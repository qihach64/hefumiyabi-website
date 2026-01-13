"""
Feedback Repository
反馈数据访问层
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Feedback


class FeedbackRepository:
    """反馈数据仓库"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        conversation_id: str,
        user_question: str,
        original_answer: str,
        rating: int,
        feedback_type: str,
        message_id: Optional[str] = None,
        corrected_answer: Optional[str] = None,
        comment: Optional[str] = None,
        tenant_id: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> Feedback:
        """创建反馈记录"""
        feedback = Feedback(
            tenant_id=tenant_id,
            conversation_id=conversation_id,
            message_id=message_id,
            user_question=user_question,
            original_answer=original_answer,
            rating=rating,
            feedback_type=feedback_type,
            corrected_answer=corrected_answer,
            comment=comment,
            extra_data=metadata,
        )
        self.session.add(feedback)
        await self.session.flush()
        return feedback

    async def get_by_id(self, feedback_id: int) -> Optional[Feedback]:
        """根据 ID 获取反馈"""
        result = await self.session.execute(
            select(Feedback).where(Feedback.id == feedback_id)
        )
        return result.scalar_one_or_none()

    async def get_by_conversation(
        self,
        conversation_id: str,
        tenant_id: Optional[str] = None,
    ) -> List[Feedback]:
        """获取会话的所有反馈"""
        query = select(Feedback).where(Feedback.conversation_id == conversation_id)
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        query = query.order_by(Feedback.created_at)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_pending(
        self,
        tenant_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Feedback]:
        """获取待处理的反馈"""
        query = select(Feedback).where(Feedback.status == "pending")
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        query = query.order_by(Feedback.created_at).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_corrections(
        self,
        tenant_id: Optional[str] = None,
        status: str = "pending",
        limit: int = 100,
    ) -> List[Feedback]:
        """获取纠偏反馈（有正确答案的）"""
        query = select(Feedback).where(
            and_(
                Feedback.corrected_answer.isnot(None),
                Feedback.status == status,
            )
        )
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        query = query.order_by(Feedback.created_at).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_status(
        self,
        feedback_id: int,
        status: str,
        applied_qa_id: Optional[int] = None,
    ) -> Optional[Feedback]:
        """更新反馈状态"""
        feedback = await self.get_by_id(feedback_id)
        if feedback:
            feedback.status = status
            if status == "applied":
                feedback.applied_at = datetime.utcnow()
                feedback.applied_qa_id = applied_qa_id
            await self.session.flush()
        return feedback

    async def get_statistics(
        self,
        tenant_id: Optional[str] = None,
        days: int = 30,
    ) -> dict:
        """获取反馈统计"""
        from datetime import timedelta

        cutoff = datetime.utcnow() - timedelta(days=days)

        # 基础查询
        base_query = select(Feedback).where(Feedback.created_at >= cutoff)
        if tenant_id:
            base_query = base_query.where(Feedback.tenant_id == tenant_id)

        # 总数
        total_query = select(func.count(Feedback.id)).where(
            Feedback.created_at >= cutoff
        )
        if tenant_id:
            total_query = total_query.where(Feedback.tenant_id == tenant_id)
        total_result = await self.session.execute(total_query)
        total = total_result.scalar() or 0

        # 按评分分组
        rating_query = (
            select(Feedback.rating, func.count(Feedback.id))
            .where(Feedback.created_at >= cutoff)
            .group_by(Feedback.rating)
        )
        if tenant_id:
            rating_query = rating_query.where(Feedback.tenant_id == tenant_id)
        rating_result = await self.session.execute(rating_query)
        rating_distribution = {r: c for r, c in rating_result.all()}

        # 按类型分组
        type_query = (
            select(Feedback.feedback_type, func.count(Feedback.id))
            .where(Feedback.created_at >= cutoff)
            .group_by(Feedback.feedback_type)
        )
        if tenant_id:
            type_query = type_query.where(Feedback.tenant_id == tenant_id)
        type_result = await self.session.execute(type_query)
        type_distribution = {t: c for t, c in type_result.all()}

        # 平均评分
        avg_query = select(func.avg(Feedback.rating)).where(
            Feedback.created_at >= cutoff
        )
        if tenant_id:
            avg_query = avg_query.where(Feedback.tenant_id == tenant_id)
        avg_result = await self.session.execute(avg_query)
        avg_rating = avg_result.scalar() or 0

        return {
            "total": total,
            "average_rating": round(float(avg_rating), 2),
            "rating_distribution": rating_distribution,
            "type_distribution": type_distribution,
            "period_days": days,
        }

    async def list_recent(
        self,
        tenant_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Feedback]:
        """获取最近的反馈列表"""
        query = select(Feedback)
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        query = query.order_by(desc(Feedback.created_at)).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def approve(
        self,
        feedback_id: int,
        reviewed_by: Optional[str] = None,
    ) -> Optional[Feedback]:
        """审核通过反馈"""
        feedback = await self.get_by_id(feedback_id)
        if feedback:
            feedback.status = "approved"
            feedback.reviewed_by = reviewed_by
            feedback.reviewed_at = datetime.utcnow()
            await self.session.flush()
        return feedback

    async def reject(
        self,
        feedback_id: int,
        reviewed_by: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> Optional[Feedback]:
        """审核拒绝反馈"""
        feedback = await self.get_by_id(feedback_id)
        if feedback:
            feedback.status = "rejected"
            feedback.reviewed_by = reviewed_by
            feedback.reviewed_at = datetime.utcnow()
            if reason and feedback.extra_data:
                feedback.extra_data["reject_reason"] = reason
            elif reason:
                feedback.extra_data = {"reject_reason": reason}
            await self.session.flush()
        return feedback

    async def get_by_status(
        self,
        status: str,
        tenant_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Feedback]:
        """按状态获取反馈列表"""
        query = select(Feedback).where(Feedback.status == status)
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        query = query.order_by(desc(Feedback.created_at)).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_by_status(
        self,
        tenant_id: Optional[str] = None,
    ) -> dict:
        """按状态统计反馈数量"""
        query = (
            select(Feedback.status, func.count(Feedback.id))
            .group_by(Feedback.status)
        )
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        result = await self.session.execute(query)
        return {status: count for status, count in result.all()}

    async def get_similar_feedback_count(
        self,
        question: str,
        tenant_id: Optional[str] = None,
    ) -> int:
        """获取相似问题的反馈数量（用于判断出现次数）"""
        # 简单实现：使用 LIKE 匹配
        query = select(func.count(Feedback.id)).where(
            Feedback.user_question.like(f"%{question[:30]}%")
        )
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_negative_count_for_question(
        self,
        question: str,
        tenant_id: Optional[str] = None,
    ) -> int:
        """获取问题的负向反馈次数"""
        query = select(func.count(Feedback.id)).where(
            and_(
                Feedback.user_question.like(f"%{question[:30]}%"),
                Feedback.feedback_type == "negative",
            )
        )
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_positive_high_rating(
        self,
        tenant_id: Optional[str] = None,
        min_rating: int = 5,
        status: str = "pending",
        limit: int = 100,
    ) -> List[Feedback]:
        """获取高评分正向反馈（用于自动通过）"""
        query = select(Feedback).where(
            and_(
                Feedback.rating >= min_rating,
                Feedback.feedback_type == "positive",
                Feedback.status == status,
            )
        )
        if tenant_id:
            query = query.where(Feedback.tenant_id == tenant_id)
        query = query.order_by(Feedback.created_at).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
