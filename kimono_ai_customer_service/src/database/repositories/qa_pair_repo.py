"""
QA Pair Repository
问答对数据访问层
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import QAPair


class QAPairRepository:
    """问答对数据仓库"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        question: str,
        answer: str,
        tenant_id: Optional[str] = None,
        category: Optional[str] = None,
        source: str = "manual",
        quality_score: float = 0.8,
        keywords: Optional[str] = None,
        source_feedback_id: Optional[int] = None,
        metadata: Optional[dict] = None,
    ) -> QAPair:
        """创建问答对"""
        qa_pair = QAPair(
            tenant_id=tenant_id,
            question=question,
            answer=answer,
            category=category,
            source=source,
            quality_score=quality_score,
            keywords=keywords,
            source_feedback_id=source_feedback_id,
            extra_data=metadata,
            status="active",  # 新记录默认为 active 状态
        )
        self.session.add(qa_pair)
        await self.session.flush()
        return qa_pair

    async def get_by_id(self, qa_id: int) -> Optional[QAPair]:
        """根据 ID 获取问答对"""
        result = await self.session.execute(
            select(QAPair).where(QAPair.id == qa_id)
        )
        return result.scalar_one_or_none()

    async def update(
        self,
        qa_id: int,
        question: Optional[str] = None,
        answer: Optional[str] = None,
        category: Optional[str] = None,
        quality_score: Optional[float] = None,
        keywords: Optional[str] = None,
    ) -> Optional[QAPair]:
        """更新问答对"""
        qa_pair = await self.get_by_id(qa_id)
        if not qa_pair:
            return None

        if question is not None:
            qa_pair.question = question
        if answer is not None:
            qa_pair.answer = answer
        if category is not None:
            qa_pair.category = category
        if quality_score is not None:
            qa_pair.quality_score = quality_score
        if keywords is not None:
            qa_pair.keywords = keywords

        qa_pair.updated_at = datetime.utcnow()
        await self.session.flush()
        return qa_pair

    async def mark_synced(
        self,
        qa_id: int,
        vector_id: str,
    ) -> Optional[QAPair]:
        """标记已同步到向量库"""
        qa_pair = await self.get_by_id(qa_id)
        if qa_pair:
            qa_pair.vector_id = vector_id
            qa_pair.is_synced = True
            qa_pair.synced_at = datetime.utcnow()
            await self.session.flush()
        return qa_pair

    async def delete(self, qa_id: int) -> bool:
        """软删除问答对"""
        qa_pair = await self.get_by_id(qa_id)
        if qa_pair:
            qa_pair.status = "deleted"
            await self.session.flush()
            return True
        return False

    async def list_by_tenant(
        self,
        tenant_id: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[QAPair]:
        """列出商家的问答对"""
        # 修复：允许 status 为 "active" 或 None 的记录
        query = select(QAPair).where(
            or_(QAPair.status == "active", QAPair.status.is_(None))
        )

        if tenant_id is not None:
            query = query.where(QAPair.tenant_id == tenant_id)
        if category:
            query = query.where(QAPair.category == category)
        if source:
            query = query.where(QAPair.source == source)

        query = query.order_by(desc(QAPair.created_at)).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_unsynced(
        self,
        tenant_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[QAPair]:
        """获取未同步到向量库的问答对"""
        # 修复：允许 status 为 "active" 或 None 的记录被同步
        # 排除已删除的记录
        query = select(QAPair).where(
            and_(
                QAPair.is_synced == False,
                or_(
                    QAPair.status == "active",
                    QAPair.status.is_(None),
                ),
            )
        )
        if tenant_id is not None:
            query = query.where(QAPair.tenant_id == tenant_id)
        query = query.order_by(QAPair.created_at).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_statistics(
        self,
        tenant_id: Optional[str] = None,
    ) -> dict:
        """获取问答对统计"""
        # 修复：统计 status 为 "active" 或 None 的记录
        base_condition = or_(QAPair.status == "active", QAPair.status.is_(None))
        if tenant_id is not None:
            base_condition = and_(base_condition, QAPair.tenant_id == tenant_id)

        # 总数
        total_query = select(func.count(QAPair.id)).where(base_condition)
        total_result = await self.session.execute(total_query)
        total = total_result.scalar() or 0

        # 已同步数
        synced_query = select(func.count(QAPair.id)).where(
            and_(base_condition, QAPair.is_synced == True)
        )
        synced_result = await self.session.execute(synced_query)
        synced = synced_result.scalar() or 0

        # 按分类
        category_query = (
            select(QAPair.category, func.count(QAPair.id))
            .where(base_condition)
            .group_by(QAPair.category)
        )
        category_result = await self.session.execute(category_query)
        category_distribution = {c or "unknown": n for c, n in category_result.all()}

        # 按来源
        source_query = (
            select(QAPair.source, func.count(QAPair.id))
            .where(base_condition)
            .group_by(QAPair.source)
        )
        source_result = await self.session.execute(source_query)
        source_distribution = {s: n for s, n in source_result.all()}

        # 平均质量分
        avg_query = select(func.avg(QAPair.quality_score)).where(base_condition)
        avg_result = await self.session.execute(avg_query)
        avg_quality = avg_result.scalar() or 0

        return {
            "total": total,
            "synced": synced,
            "unsynced": total - synced,
            "average_quality_score": round(float(avg_quality), 3),
            "category_distribution": category_distribution,
            "source_distribution": source_distribution,
        }

    async def search(
        self,
        keyword: str,
        tenant_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[QAPair]:
        """搜索问答对（简单文本搜索）"""
        # 修复：搜索 status 为 "active" 或 None 的记录
        query = select(QAPair).where(
            and_(
                or_(QAPair.status == "active", QAPair.status.is_(None)),
                QAPair.question.contains(keyword) | QAPair.answer.contains(keyword),
            )
        )
        if tenant_id is not None:
            query = query.where(QAPair.tenant_id == tenant_id)
        query = query.limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
