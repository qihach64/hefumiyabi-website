"""
Feedback Review Routes
反馈审核 API 路由 - Phase 3 扩展

根据计划文档 3.3 节要求:
- GET  /api/v1/feedback/pending         待审核列表
- POST /api/v1/feedback/{id}/approve    审核通过
- POST /api/v1/feedback/{id}/reject     审核拒绝
- POST /api/v1/feedback/batch-apply     批量应用到知识库
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import require_admin, TokenData
from .dependencies import get_service_container, ServiceContainer
from database import get_db_session
from database.repositories import FeedbackRepository
from learning import LearningService, LearningRules, get_learning_rules
from knowledge.vector_store import VectorStoreManager


# ========== 路由器定义 ==========

feedback_review_router = APIRouter(prefix="/feedback", tags=["反馈审核"])


# ========== 请求/响应模型 ==========

class FeedbackItem(BaseModel):
    """反馈项"""
    id: int
    tenant_id: Optional[str]
    conversation_id: str
    user_question: str
    original_answer: str
    corrected_answer: Optional[str]
    rating: int
    feedback_type: str
    status: str
    comment: Optional[str]
    created_at: str


class PendingListResponse(BaseModel):
    """待审核列表响应"""
    items: List[FeedbackItem]
    total: int
    pending_count: int
    status_summary: dict


class ApproveRejectRequest(BaseModel):
    """审核请求"""
    reason: Optional[str] = None
    category: Optional[str] = None  # 指定分类，None 表示自动分类
    apply_immediately: bool = True  # 是否立即应用到语料库


class ApproveRejectResponse(BaseModel):
    """审核响应"""
    success: bool
    message: str
    feedback_id: int
    new_status: str


class BatchApplyRequest(BaseModel):
    """批量应用请求"""
    feedback_ids: Optional[List[int]] = None  # 指定 ID 列表，为空则自动选择
    auto_select: bool = True  # 是否自动选择符合规则的反馈
    limit: int = 50  # 最大处理数量


class BatchApplyResponse(BaseModel):
    """批量应用响应"""
    success: bool
    processed: int
    created: int
    updated: int
    rejected: int
    skipped: int
    errors: int
    details: List[dict]


class RulesResponse(BaseModel):
    """规则配置响应"""
    auto_approve: dict
    require_review: dict
    auto_flag: dict


# ========== API 端点 ==========

@feedback_review_router.get(
    "/pending",
    response_model=PendingListResponse,
    summary="获取待审核反馈列表",
    description="获取待处理的反馈列表，支持分页",
)
async def get_pending_feedbacks(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: str = Query("pending", description="状态筛选: pending/approved/rejected/applied"),
    current_user: TokenData = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """获取待审核反馈列表"""
    repo = FeedbackRepository(db)
    tenant_id = current_user.tenant_id

    # 获取反馈列表
    if status == "all":
        feedbacks = await repo.list_recent(
            tenant_id=tenant_id,
            limit=limit,
            offset=offset,
        )
    else:
        feedbacks = await repo.get_by_status(
            status=status,
            tenant_id=tenant_id,
            limit=limit,
            offset=offset,
        )

    # 获取状态统计
    status_counts = await repo.count_by_status(tenant_id=tenant_id)
    pending_count = status_counts.get("pending", 0)

    # 转换为响应格式
    items = [
        FeedbackItem(
            id=fb.id,
            tenant_id=fb.tenant_id,
            conversation_id=fb.conversation_id,
            user_question=fb.user_question or "",
            original_answer=fb.original_answer or "",
            corrected_answer=fb.corrected_answer,
            rating=fb.rating or 0,
            feedback_type=fb.feedback_type or "",
            status=fb.status,
            comment=fb.comment,
            created_at=fb.created_at.isoformat() if fb.created_at else "",
        )
        for fb in feedbacks
    ]

    return PendingListResponse(
        items=items,
        total=len(items),
        pending_count=pending_count,
        status_summary=status_counts,
    )


@feedback_review_router.post(
    "/{feedback_id}/approve",
    response_model=ApproveRejectResponse,
    summary="审核通过反馈",
    description="将反馈标记为审核通过并直接应用到语料库",
)
async def approve_feedback(
    feedback_id: int,
    request: ApproveRejectRequest = None,
    current_user: TokenData = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
):
    """审核通过反馈并应用到语料库"""
    repo = FeedbackRepository(db)

    # 获取反馈
    feedback = await repo.get_by_id(feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="反馈不存在")

    # 权限检查
    if current_user.role != "admin" and feedback.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="无权操作此反馈")

    # 审核通过
    feedback = await repo.approve(
        feedback_id=feedback_id,
        reviewed_by=current_user.user_id,
    )

    result_message = "反馈已审核通过"
    final_status = "approved"
    qa_pair_id = None

    # 立即应用到语料库（默认行为）
    apply_immediately = request.apply_immediately if request else True
    if apply_immediately:
        try:
            vector_store = container.knowledge_base.vector_store if container.knowledge_base else None
            learning_service = LearningService(session=db, vector_store=vector_store)

            # 如果指定了分类，设置到反馈的 extra_data 中
            if request and request.category:
                feedback.extra_data = feedback.extra_data or {}
                feedback.extra_data["manual_category"] = request.category

            # 处理反馈并应用到知识库
            result = await learning_service._process_single_feedback(feedback)

            if result.success:
                qa_pair_id = result.qa_pair_id
                final_status = "applied"
                result_message = f"反馈已审核通过并应用到语料库 ({result.action})"
            else:
                result_message = f"反馈已审核通过，但应用失败: {result.message}"
        except Exception as e:
            result_message = f"反馈已审核通过，但应用出错: {str(e)}"

    await db.commit()

    return ApproveRejectResponse(
        success=True,
        message=result_message,
        feedback_id=feedback_id,
        new_status=final_status,
    )


@feedback_review_router.post(
    "/{feedback_id}/reject",
    response_model=ApproveRejectResponse,
    summary="审核拒绝反馈",
    description="拒绝反馈，不会应用到知识库",
)
async def reject_feedback(
    feedback_id: int,
    request: ApproveRejectRequest = None,
    current_user: TokenData = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """审核拒绝反馈"""
    repo = FeedbackRepository(db)

    # 获取反馈
    feedback = await repo.get_by_id(feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="反馈不存在")

    # 权限检查
    if current_user.role != "admin" and feedback.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="无权操作此反馈")

    # 审核拒绝
    reason = request.reason if request else None
    feedback = await repo.reject(
        feedback_id=feedback_id,
        reviewed_by=current_user.user_id,
        reason=reason,
    )

    await db.commit()

    return ApproveRejectResponse(
        success=True,
        message="反馈已拒绝",
        feedback_id=feedback_id,
        new_status="rejected",
    )


@feedback_review_router.post(
    "/batch-apply",
    response_model=BatchApplyResponse,
    summary="批量应用反馈到知识库",
    description="批量处理审核通过的反馈，应用到向量知识库",
)
async def batch_apply_feedbacks(
    request: BatchApplyRequest,
    current_user: TokenData = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """批量应用反馈到知识库"""
    tenant_id = current_user.tenant_id

    # 初始化服务
    try:
        vector_store = VectorStoreManager()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"向量存储服务不可用: {e}")

    learning_service = LearningService(session=db, vector_store=vector_store)
    rules = get_learning_rules()
    repo = FeedbackRepository(db)

    details = []
    processed = 0
    created = 0
    updated = 0
    rejected = 0
    skipped = 0
    errors = 0

    # 确定要处理的反馈
    if request.feedback_ids:
        # 处理指定的反馈
        for fid in request.feedback_ids[:request.limit]:
            feedback = await repo.get_by_id(fid)
            if feedback and (current_user.role == "admin" or feedback.tenant_id == tenant_id):
                try:
                    result = await learning_service._process_single_feedback(feedback)
                    processed += 1

                    if result.action == "created":
                        created += 1
                    elif result.action == "updated":
                        updated += 1
                    elif result.action == "rejected":
                        rejected += 1
                    elif result.action == "skipped":
                        skipped += 1

                    details.append({
                        "feedback_id": fid,
                        "action": result.action,
                        "success": result.success,
                        "message": result.message,
                    })
                except Exception as e:
                    errors += 1
                    details.append({
                        "feedback_id": fid,
                        "action": "error",
                        "success": False,
                        "message": str(e),
                    })
    elif request.auto_select:
        # 自动选择符合规则的反馈
        # 1. 获取高评分正向反馈（自动通过）
        high_rating = await repo.get_positive_high_rating(
            tenant_id=tenant_id,
            min_rating=rules.AUTO_APPROVE_CONDITIONS["min_rating"],
            status="pending",
            limit=request.limit // 2,
        )

        # 检查每个反馈的出现次数
        for feedback in high_rating:
            occurrence_count = await repo.get_similar_feedback_count(
                question=feedback.user_question or "",
                tenant_id=tenant_id,
            )

            rule_result = rules.evaluate(
                rating=feedback.rating,
                feedback_type=feedback.feedback_type,
                has_correction=bool(feedback.corrected_answer),
                occurrence_count=occurrence_count,
            )

            if rule_result.action.value == "auto_approve":
                try:
                    result = await learning_service._process_single_feedback(feedback)
                    processed += 1

                    if result.action == "created":
                        created += 1
                    elif result.action == "updated":
                        updated += 1

                    details.append({
                        "feedback_id": feedback.id,
                        "action": result.action,
                        "success": result.success,
                        "rule_reason": rule_result.reason,
                    })
                except Exception as e:
                    errors += 1

        # 2. 获取已审核通过的反馈
        approved = await repo.get_by_status(
            status="approved",
            tenant_id=tenant_id,
            limit=request.limit - processed,
        )

        for feedback in approved:
            try:
                result = await learning_service._process_single_feedback(feedback)
                processed += 1

                if result.action == "created":
                    created += 1
                elif result.action == "updated":
                    updated += 1
                elif result.action == "skipped":
                    skipped += 1

                details.append({
                    "feedback_id": feedback.id,
                    "action": result.action,
                    "success": result.success,
                    "message": result.message,
                })
            except Exception as e:
                errors += 1
    else:
        # 只处理已审核通过的
        approved = await repo.get_by_status(
            status="approved",
            tenant_id=tenant_id,
            limit=request.limit,
        )

        for feedback in approved:
            try:
                result = await learning_service._process_single_feedback(feedback)
                processed += 1

                if result.action == "created":
                    created += 1
                elif result.action == "updated":
                    updated += 1
                elif result.action == "skipped":
                    skipped += 1

                details.append({
                    "feedback_id": feedback.id,
                    "action": result.action,
                    "success": result.success,
                })
            except Exception as e:
                errors += 1

    await db.commit()

    return BatchApplyResponse(
        success=errors == 0,
        processed=processed,
        created=created,
        updated=updated,
        rejected=rejected,
        skipped=skipped,
        errors=errors,
        details=details[:20],  # 限制返回的详情数量
    )


@feedback_review_router.get(
    "/rules",
    response_model=RulesResponse,
    summary="获取自动学习规则",
    description="获取当前配置的自动学习规则",
)
async def get_rules(
    current_user: TokenData = Depends(require_admin),
):
    """获取自动学习规则"""
    rules = get_learning_rules()
    summary = rules.get_rules_summary()

    return RulesResponse(
        auto_approve=summary["auto_approve"],
        require_review=summary["require_review"],
        auto_flag=summary["auto_flag"],
    )


@feedback_review_router.get(
    "/statistics",
    summary="获取反馈统计",
    description="获取反馈的统计信息",
)
async def get_feedback_statistics(
    days: int = Query(30, ge=1, le=365),
    current_user: TokenData = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """获取反馈统计"""
    repo = FeedbackRepository(db)
    tenant_id = current_user.tenant_id

    stats = await repo.get_statistics(tenant_id=tenant_id, days=days)
    status_counts = await repo.count_by_status(tenant_id=tenant_id)

    return {
        "period_days": days,
        "total": stats["total"],
        "average_rating": stats["average_rating"],
        "rating_distribution": stats["rating_distribution"],
        "type_distribution": stats["type_distribution"],
        "status_distribution": status_counts,
    }
