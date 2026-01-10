"""
Learning API Routes
语料学习管理 API 路由
"""

from typing import Optional, List
from pydantic import BaseModel, Field

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_session
from database.repositories import FeedbackRepository, QAPairRepository
from learning import LearningService, QualityEvaluator
from learning.scheduler import get_scheduler

from .auth import get_current_user, TokenData, require_admin
from .dependencies import get_service_container, ServiceContainer


# ========== 请求/响应模型 ==========

class ProcessFeedbacksRequest(BaseModel):
    """处理反馈请求"""
    limit: int = Field(default=50, ge=1, le=200, description="最大处理数量")


class SyncQAPairsRequest(BaseModel):
    """同步问答对请求"""
    limit: int = Field(default=100, ge=1, le=500, description="最大同步数量")


class EvaluateQARequest(BaseModel):
    """评估问答对请求"""
    question: str = Field(..., min_length=1, description="问题")
    answer: str = Field(..., min_length=1, description="回答")
    category: Optional[str] = Field(default=None, description="分类")


class CreateQAPairRequest(BaseModel):
    """创建问答对请求"""
    question: str = Field(..., min_length=5, description="问题")
    answer: str = Field(..., min_length=10, description="回答")
    category: Optional[str] = Field(default=None, description="分类")
    keywords: Optional[str] = Field(default=None, description="关键词，逗号分隔")


class UpdateQAPairRequest(BaseModel):
    """更新问答对请求"""
    question: Optional[str] = Field(default=None, min_length=5, description="问题")
    answer: Optional[str] = Field(default=None, min_length=10, description="回答")
    category: Optional[str] = Field(default=None, description="分类")
    keywords: Optional[str] = Field(default=None, description="关键词")
    quality_score: Optional[float] = Field(default=None, ge=0, le=1, description="质量分数")


class SchedulerConfigRequest(BaseModel):
    """调度器配置请求"""
    process_interval: Optional[int] = Field(default=None, ge=60, le=3600, description="处理间隔(秒)")
    sync_interval: Optional[int] = Field(default=None, ge=60, le=7200, description="同步间隔(秒)")
    batch_size: Optional[int] = Field(default=None, ge=10, le=200, description="批次大小")
    auto_learn_enabled: Optional[bool] = Field(default=None, description="启用自动学习")
    auto_sync_enabled: Optional[bool] = Field(default=None, description="启用自动同步")


# ========== 路由定义 ==========

learning_router = APIRouter(prefix="/learning", tags=["语料学习"])


# ---------- 学习任务 ----------

@learning_router.post(
    "/process",
    summary="处理待处理的反馈",
    description="手动触发处理待处理的反馈，将纠偏答案应用到知识库",
)
async def process_feedbacks(
    request: ProcessFeedbacksRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
    current_user: TokenData = Depends(require_admin),
):
    """处理待处理的反馈"""
    service = LearningService(
        session=db,
        vector_store=container.knowledge_base.vector_store if container.knowledge_base else None,
    )

    # 获取待处理数量
    pending = await FeedbackRepository(db).get_pending(
        tenant_id=current_user.tenant_id,
        limit=request.limit,
    )

    if not pending:
        return {
            "message": "没有待处理的反馈",
            "pending_count": 0,
        }

    # 处理反馈
    stats = await service.process_pending_feedbacks(
        tenant_id=current_user.tenant_id,
        limit=request.limit,
    )

    return {
        "message": "反馈处理完成",
        "statistics": {
            "processed": stats.processed,
            "created": stats.created,
            "updated": stats.updated,
            "rejected": stats.rejected,
            "skipped": stats.skipped,
            "errors": stats.errors,
        },
    }


@learning_router.post(
    "/sync",
    summary="同步问答对到向量库",
    description="将未同步的问答对同步到 Pinecone 向量库",
)
async def sync_qa_pairs(
    request: SyncQAPairsRequest,
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
    current_user: TokenData = Depends(require_admin),
):
    """同步问答对到向量库"""
    if not container.knowledge_base:
        raise HTTPException(status_code=503, detail="知识库服务不可用")

    service = LearningService(
        session=db,
        vector_store=container.knowledge_base.vector_store,
    )

    result = await service.sync_unsynced_qa_pairs(
        tenant_id=current_user.tenant_id,
        limit=request.limit,
    )

    return {
        "message": "同步完成",
        "result": result,
    }


@learning_router.get(
    "/statistics",
    summary="获取学习统计",
    description="获取反馈和问答对的统计信息",
)
async def get_learning_statistics(
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
    current_user: TokenData = Depends(require_admin),
):
    """获取学习统计"""
    service = LearningService(
        session=db,
        vector_store=container.knowledge_base.vector_store if container.knowledge_base else None,
    )

    stats = await service.get_learning_statistics(tenant_id=current_user.tenant_id)

    return stats


# ---------- 质量评估 ----------

@learning_router.post(
    "/evaluate",
    summary="评估问答对质量",
    description="评估单个问答对的质量分数",
)
async def evaluate_qa_pair(
    request: EvaluateQARequest,
    current_user: TokenData = Depends(require_admin),
):
    """评估问答对质量"""
    evaluator = QualityEvaluator()
    report = evaluator.evaluate(
        question=request.question,
        answer=request.answer,
        category=request.category,
    )

    return {
        "overall_score": report.overall_score,
        "question_score": report.question_score,
        "answer_score": report.answer_score,
        "relevance_score": report.relevance_score,
        "issues": report.issues,
        "suggestions": report.suggestions,
    }


# ---------- 问答对管理 ----------

@learning_router.get(
    "/qa-pairs",
    summary="获取问答对列表",
    description="获取当前商家的问答对列表",
)
async def list_qa_pairs(
    category: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db_session),
    current_user: TokenData = Depends(require_admin),
):
    """获取问答对列表"""
    repo = QAPairRepository(db)
    qa_pairs = await repo.list_by_tenant(
        tenant_id=current_user.tenant_id,
        category=category,
        source=source,
        limit=limit,
        offset=offset,
    )

    # 获取总数用于分页
    stats = await repo.get_statistics(tenant_id=current_user.tenant_id)
    total_count = stats.get("total", 0)

    return {
        "items": [
            {
                "id": qa.id,
                "question": qa.question,
                "answer": qa.answer,
                "category": qa.category,
                "source": qa.source,
                "quality_score": qa.quality_score,
                "is_synced": qa.is_synced,
                "created_at": qa.created_at.isoformat() if qa.created_at else None,
            }
            for qa in qa_pairs
        ],
        "count": total_count,
        "offset": offset,
        "limit": limit,
    }


@learning_router.post(
    "/qa-pairs",
    summary="创建问答对",
    description="手动添加问答对到知识库",
)
async def create_qa_pair(
    request: CreateQAPairRequest,
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
    current_user: TokenData = Depends(require_admin),
):
    """创建问答对"""
    # 先评估质量
    evaluator = QualityEvaluator()
    report = evaluator.evaluate(
        question=request.question,
        answer=request.answer,
        category=request.category,
    )

    if report.overall_score < 0.4:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "问答对质量分数过低",
                "score": report.overall_score,
                "issues": report.issues,
                "suggestions": report.suggestions,
            },
        )

    repo = QAPairRepository(db)
    qa_pair = await repo.create(
        question=request.question,
        answer=request.answer,
        tenant_id=current_user.tenant_id,
        category=request.category,
        source="manual",
        quality_score=report.overall_score,
        keywords=request.keywords,
    )

    # 同步到向量库
    vector_id = None
    if container.knowledge_base and report.overall_score >= 0.4:
        vector_id = container.knowledge_base.vector_store.upsert_single(
            question=request.question,
            answer=request.answer,
            category=request.category or "",
            namespace=current_user.tenant_id,
            quality_score=report.overall_score,
            source="manual",
        )
        if vector_id:
            await repo.mark_synced(qa_pair.id, vector_id)

    await db.commit()

    return {
        "id": qa_pair.id,
        "quality_score": report.overall_score,
        "is_synced": vector_id is not None,
        "vector_id": vector_id,
        "message": "问答对创建成功",
    }


@learning_router.put(
    "/qa-pairs/{qa_id}",
    summary="更新问答对",
    description="更新问答对内容",
)
async def update_qa_pair(
    qa_id: int,
    request: UpdateQAPairRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: TokenData = Depends(require_admin),
):
    """更新问答对"""
    repo = QAPairRepository(db)
    qa_pair = await repo.get_by_id(qa_id)

    if not qa_pair:
        raise HTTPException(status_code=404, detail="问答对不存在")

    if qa_pair.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="无权访问此问答对")

    updated = await repo.update(
        qa_id=qa_id,
        question=request.question,
        answer=request.answer,
        category=request.category,
        quality_score=request.quality_score,
        keywords=request.keywords,
    )

    await db.commit()

    return {
        "id": updated.id,
        "message": "更新成功",
    }


@learning_router.delete(
    "/qa-pairs/{qa_id}",
    summary="删除问答对",
    description="软删除问答对",
)
async def delete_qa_pair(
    qa_id: int,
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
    current_user: TokenData = Depends(require_admin),
):
    """删除问答对"""
    repo = QAPairRepository(db)
    qa_pair = await repo.get_by_id(qa_id)

    if not qa_pair:
        raise HTTPException(status_code=404, detail="问答对不存在")

    if qa_pair.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="无权访问此问答对")

    # 从向量库删除
    if qa_pair.vector_id and container.knowledge_base:
        container.knowledge_base.vector_store.delete_vector(
            vector_id=qa_pair.vector_id,
            namespace=current_user.tenant_id,
        )

    await repo.delete(qa_id)
    await db.commit()

    return {"message": "删除成功"}


# ---------- 调度器管理 ----------

@learning_router.get(
    "/scheduler/status",
    summary="获取调度器状态",
    description="获取学习调度器的运行状态",
)
async def get_scheduler_status(
    current_user: TokenData = Depends(require_admin),
):
    """获取调度器状态"""
    scheduler = get_scheduler()
    if not scheduler:
        return {"error": "调度器未初始化", "is_running": False}

    return scheduler.get_status()


@learning_router.post(
    "/scheduler/start",
    summary="启动调度器",
    description="启动学习调度器",
)
async def start_scheduler(
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(require_admin),
):
    """启动调度器"""
    scheduler = get_scheduler()
    if not scheduler:
        raise HTTPException(status_code=503, detail="调度器未初始化")

    if scheduler.status.is_running:
        return {"message": "调度器已在运行中"}

    background_tasks.add_task(scheduler.start)

    return {"message": "调度器启动中"}


@learning_router.post(
    "/scheduler/stop",
    summary="停止调度器",
    description="停止学习调度器",
)
async def stop_scheduler(
    current_user: TokenData = Depends(require_admin),
):
    """停止调度器"""
    scheduler = get_scheduler()
    if not scheduler:
        raise HTTPException(status_code=503, detail="调度器未初始化")

    if not scheduler.status.is_running:
        return {"message": "调度器已停止"}

    await scheduler.stop()

    return {"message": "调度器已停止"}


@learning_router.put(
    "/scheduler/config",
    summary="更新调度器配置",
    description="更新调度器配置参数",
)
async def update_scheduler_config(
    request: SchedulerConfigRequest,
    current_user: TokenData = Depends(require_admin),
):
    """更新调度器配置"""
    scheduler = get_scheduler()
    if not scheduler:
        raise HTTPException(status_code=503, detail="调度器未初始化")

    scheduler.update_config(
        process_interval=request.process_interval,
        sync_interval=request.sync_interval,
        batch_size=request.batch_size,
        auto_learn_enabled=request.auto_learn_enabled,
        auto_sync_enabled=request.auto_sync_enabled,
    )

    return {
        "message": "配置已更新",
        "config": {
            "process_interval": scheduler.config.process_interval,
            "sync_interval": scheduler.config.sync_interval,
            "batch_size": scheduler.config.batch_size,
            "auto_learn_enabled": scheduler.config.auto_learn_enabled,
            "auto_sync_enabled": scheduler.config.auto_sync_enabled,
        },
    }


# ---------- 反馈管理 ----------

@learning_router.get(
    "/feedbacks",
    summary="获取反馈列表",
    description="获取当前商家的反馈列表",
)
async def list_feedbacks(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db_session),
    current_user: TokenData = Depends(require_admin),
):
    """获取反馈列表"""
    repo = FeedbackRepository(db)

    if status == "pending":
        feedbacks = await repo.get_pending(
            tenant_id=current_user.tenant_id,
            limit=limit,
        )
    elif status == "corrected":
        feedbacks = await repo.get_corrections(
            tenant_id=current_user.tenant_id,
            status="pending",
            limit=limit,
        )
    else:
        feedbacks = await repo.list_recent(
            tenant_id=current_user.tenant_id,
            limit=limit,
            offset=offset,
        )

    return {
        "items": [
            {
                "id": f.id,
                "conversation_id": f.conversation_id,
                "user_question": f.user_question,
                "original_answer": f.original_answer[:200] + "..." if len(f.original_answer) > 200 else f.original_answer,
                "corrected_answer": f.corrected_answer[:200] + "..." if f.corrected_answer and len(f.corrected_answer) > 200 else f.corrected_answer,
                "rating": f.rating,
                "feedback_type": f.feedback_type,
                "status": f.status,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
            for f in feedbacks
        ],
        "count": len(feedbacks),
    }
