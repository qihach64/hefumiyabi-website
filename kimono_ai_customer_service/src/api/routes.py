"""
API Routes
API 路由定义
"""
import uuid
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    ChatRequest, ChatResponse, SourceItem,
    FeedbackRequest, FeedbackResponse,
    SearchRequest, SearchResponse, SearchResultItem,
    HealthResponse, StatsResponse, ErrorResponse,
)
from .dependencies import (
    get_service_container, get_rag_chain, get_knowledge_base,
    get_conversation_manager, ServiceContainer,
)
from .auth import get_current_user, TokenData

# 数据库相关
from database import get_db_session
from database.repositories import FeedbackRepository, ConversationRepository


# ========== 路由器定义 ==========

chat_router = APIRouter(prefix="/chat", tags=["对话"])
knowledge_router = APIRouter(prefix="/knowledge", tags=["知识库"])
system_router = APIRouter(prefix="/system", tags=["系统"])


# ========== 对话接口 ==========

@chat_router.post(
    "/message",
    response_model=ChatResponse,
    responses={
        400: {"model": ErrorResponse, "description": "请求参数错误"},
        500: {"model": ErrorResponse, "description": "服务器错误"},
    },
    summary="发送消息",
    description="向客服系统发送消息并获取回复，支持多轮对话",
)
async def send_message(
    request: ChatRequest,
    container: ServiceContainer = Depends(get_service_container),
    current_user: Optional[TokenData] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """发送消息到客服系统"""
    rag_chain = container.rag_chain

    if not rag_chain:
        raise HTTPException(
            status_code=503,
            detail="RAG 服务不可用"
        )

    # 生成或使用会话 ID
    conversation_id = request.conversation_id or f"conv-{uuid.uuid4().hex[:12]}"
    message_id = f"msg-{uuid.uuid4().hex[:12]}"

    # 确定租户命名空间
    # 如果用户已登录，使用其租户 ID 作为命名空间
    # 否则使用默认命名空间（支持匿名访问）
    namespace = current_user.tenant_id if current_user else container.namespace

    try:
        # 执行 RAG 查询
        response = rag_chain.query(
            question=request.message,
            conversation_id=conversation_id,
            namespace=namespace,
        )

        # 构建响应
        sources = [
            SourceItem(
                question=s.get("question", ""),
                answer=s.get("answer", ""),
                score=s.get("score", 0),
                category=s.get("category"),
            )
            for s in response.sources
        ]

        # 持久化对话记录到数据库（用于统计）
        try:
            conv_repo = ConversationRepository(db)
            # 记录用户消息
            await conv_repo.add_message(
                conversation_id=conversation_id,
                tenant_id=namespace,
                role="user",
                content=request.message,
            )
            # 记录助手回复
            await conv_repo.add_message(
                conversation_id=conversation_id,
                tenant_id=namespace,
                role="assistant",
                content=response.answer,
            )
            await db.commit()
        except Exception as db_error:
            # 对话记录失败不影响主流程，仅记录日志
            print(f"[WARNING] 对话记录保存失败: {db_error}")

        return ChatResponse(
            answer=response.answer,
            conversation_id=conversation_id,
            message_id=message_id,
            sources=sources,
            model_used=response.model_used,
            language=response.language,
            confidence=response.confidence,
            latency_ms=response.latency_ms,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理消息时出错: {str(e)}"
        )


@chat_router.get(
    "/history/{conversation_id}",
    summary="获取对话历史",
    description="获取指定会话的对话历史记录",
)
async def get_conversation_history(
    conversation_id: str,
    max_turns: int = 20,
    container: ServiceContainer = Depends(get_service_container),
):
    """获取对话历史"""
    conv_manager = container.conversation_manager

    if not conv_manager:
        raise HTTPException(status_code=503, detail="对话管理服务不可用")

    history = conv_manager.get_history(conversation_id, max_turns)

    if not history:
        return {"conversation_id": conversation_id, "messages": [], "count": 0}

    return {
        "conversation_id": conversation_id,
        "messages": history,
        "count": len(history),
    }


@chat_router.delete(
    "/conversation/{conversation_id}",
    summary="删除会话",
    description="删除指定的会话及其历史记录",
)
async def delete_conversation(
    conversation_id: str,
    container: ServiceContainer = Depends(get_service_container),
):
    """删除会话"""
    conv_manager = container.conversation_manager

    if not conv_manager:
        raise HTTPException(status_code=503, detail="对话管理服务不可用")

    deleted = conv_manager.delete_conversation(conversation_id)

    return {
        "success": deleted,
        "message": "会话已删除" if deleted else "会话不存在",
    }


@chat_router.post(
    "/feedback",
    response_model=FeedbackResponse,
    summary="提交反馈",
    description="对客服回复进行评价和反馈，支持纠偏答案",
)
async def submit_feedback(
    request: FeedbackRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[TokenData] = Depends(get_current_user),
):
    """提交反馈

    - rating 5: 采纳（正向反馈）
    - rating 1-2: 不好（负向反馈）
    - rating 1-2 + corrected_answer: 纠偏（需要提供正确答案）
    """
    try:
        repo = FeedbackRepository(db)

        # 确定反馈类型
        if request.corrected_answer:
            feedback_type = "corrected"
        elif request.rating >= 4:
            feedback_type = "positive"
        else:
            feedback_type = "negative"

        # 确定租户 ID（登录用户使用其租户 ID，匿名用户为 None）
        tenant_id = current_user.tenant_id if current_user else None

        # 创建反馈记录
        feedback = await repo.create(
            tenant_id=tenant_id,
            conversation_id=request.conversation_id,
            message_id=request.message_id,
            user_question=request.user_question or "",
            original_answer=request.original_answer or "",
            rating=request.rating,
            feedback_type=feedback_type,
            corrected_answer=request.corrected_answer,
            comment=request.comment,
            metadata={
                "source": "web_ui",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_id": current_user.user_id if current_user else None,
            },
        )

        await db.commit()

        # 根据反馈类型返回不同消息
        if feedback_type == "corrected":
            message = "感谢您的纠正！正确答案已记录，将用于优化 AI 回答"
        elif feedback_type == "positive":
            message = "感谢您的认可！我们会继续努力"
        else:
            message = "感谢您的反馈！我们会持续改进"

        return FeedbackResponse(
            success=True,
            message=message,
            feedback_id=feedback.id,
            applied=False,  # Phase 3 实现自动应用
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"反馈保存失败: {str(e)}"
        )


# ========== 知识库接口 ==========

@knowledge_router.post(
    "/search",
    response_model=SearchResponse,
    summary="搜索知识库",
    description="在知识库中搜索相关问答",
)
async def search_knowledge(
    request: SearchRequest,
    container: ServiceContainer = Depends(get_service_container),
    current_user: Optional[TokenData] = Depends(get_current_user),
):
    """搜索知识库"""
    kb = container.knowledge_base

    if not kb:
        raise HTTPException(status_code=503, detail="知识库服务不可用")

    # 确定租户命名空间
    namespace = current_user.tenant_id if current_user else container.namespace

    try:
        if request.category:
            results = kb.vector_store.search_by_category(
                query=request.query,
                category=request.category,
                top_k=request.top_k,
                namespace=namespace,
            )
        else:
            results = kb.vector_store.search(
                query=request.query,
                top_k=request.top_k,
                namespace=namespace,
            )

        items = [
            SearchResultItem(
                question=r.question,
                answer=r.answer,
                category=r.category,
                score=r.score,
            )
            for r in results
        ]

        return SearchResponse(
            results=items,
            total=len(items),
            query=request.query,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"搜索失败: {str(e)}"
        )


@knowledge_router.get(
    "/stats",
    summary="知识库统计",
    description="获取知识库的统计信息",
)
async def get_knowledge_stats(
    container: ServiceContainer = Depends(get_service_container),
):
    """获取知识库统计"""
    kb = container.knowledge_base

    if not kb:
        raise HTTPException(status_code=503, detail="知识库服务不可用")

    try:
        stats = kb.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取统计失败: {str(e)}"
        )


# ========== 系统接口 ==========

@system_router.get(
    "/health",
    response_model=HealthResponse,
    summary="健康检查",
    description="检查服务健康状态",
)
async def health_check(
    container: ServiceContainer = Depends(get_service_container),
):
    """健康检查"""
    components = container.is_healthy()

    # 判断整体状态
    all_healthy = all(v == "healthy" for v in components.values())
    status = "healthy" if all_healthy else "degraded"

    return HealthResponse(
        status=status,
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        components=components,
    )


@system_router.get(
    "/stats",
    response_model=StatsResponse,
    summary="系统统计",
    description="获取系统运行统计信息",
)
async def get_system_stats(
    container: ServiceContainer = Depends(get_service_container),
):
    """获取系统统计"""
    stats = container.get_stats()

    conv_stats = stats.get("conversation", {})
    kb_stats = stats.get("knowledge_base", {})

    return StatsResponse(
        active_conversations=conv_stats.get("active_conversations", 0),
        total_conversations=conv_stats.get("active_conversations", 0),
        total_messages=0,  # TODO: 实现消息计数
        avg_response_time_ms=0,  # TODO: 实现响应时间统计
        model_usage={},  # TODO: 实现模型使用统计
        knowledge_base_stats=kb_stats,
    )


@system_router.get(
    "/ready",
    summary="就绪检查",
    description="检查服务是否准备好接收请求",
)
async def readiness_check(
    container: ServiceContainer = Depends(get_service_container),
):
    """就绪检查"""
    rag_chain = container.rag_chain

    if rag_chain:
        return {"ready": True, "message": "服务就绪"}
    else:
        raise HTTPException(
            status_code=503,
            detail="服务尚未就绪"
        )


@system_router.get(
    "/live",
    summary="存活检查",
    description="检查服务是否存活",
)
async def liveness_check():
    """存活检查"""
    return {"alive": True, "timestamp": datetime.now(timezone.utc).isoformat()}
