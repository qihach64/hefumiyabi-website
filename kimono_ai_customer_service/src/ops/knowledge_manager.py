"""
Knowledge Manager
知识库管理服务

支持跨商家的知识库管理、批量操作、同步触发等功能
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update, or_

from database.models import QAPair, Tenant


@dataclass
class KnowledgeOverview:
    """知识库概览"""
    total_qa_pairs: int = 0
    by_tenant: Dict[str, int] = field(default_factory=dict)
    by_category: Dict[str, int] = field(default_factory=dict)
    by_source: Dict[str, int] = field(default_factory=dict)
    synced_count: int = 0
    unsynced_count: int = 0


@dataclass
class QAPairItem:
    """QA 对项目"""
    id: int
    tenant_id: Optional[str]
    tenant_name: Optional[str]
    question: str
    answer: str
    category: Optional[str]
    keywords: List[str]
    source: Optional[str]
    priority: int
    is_synced: bool
    status: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


@dataclass
class QAPairListResponse:
    """QA 列表响应"""
    items: List[QAPairItem]
    total: int
    page: int
    page_size: int
    total_pages: int


@dataclass
class QAPairCreate:
    """创建 QA 请求"""
    tenant_id: str
    question: str
    answer: str
    category: Optional[str] = None
    keywords: List[str] = field(default_factory=list)
    priority: int = 0


@dataclass
class QAPairUpdate:
    """更新 QA 请求"""
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    keywords: Optional[List[str]] = None
    priority: Optional[int] = None


@dataclass
class BulkOperationResult:
    """批量操作结果"""
    success_count: int
    failed_count: int
    errors: List[str] = field(default_factory=list)


@dataclass
class SyncStatus:
    """同步状态"""
    is_running: bool
    last_sync_time: Optional[datetime]
    pending_count: int
    synced_count: int
    last_error: Optional[str] = None


class KnowledgeManager:
    """知识库管理器"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_overview(self) -> KnowledgeOverview:
        """获取知识库概览"""
        overview = KnowledgeOverview()

        # 总 QA 数
        total_query = select(func.count(QAPair.id)).where(QAPair.status == "active")
        total_result = await self.db.execute(total_query)
        overview.total_qa_pairs = total_result.scalar() or 0

        # 按商家统计
        tenant_query = (
            select(QAPair.tenant_id, func.count(QAPair.id))
            .where(and_(QAPair.status == "active", QAPair.tenant_id.isnot(None)))
            .group_by(QAPair.tenant_id)
        )
        tenant_result = await self.db.execute(tenant_query)
        for tenant_id, count in tenant_result.fetchall():
            if tenant_id:
                overview.by_tenant[tenant_id] = count

        # 按分类统计
        category_query = (
            select(QAPair.category, func.count(QAPair.id))
            .where(and_(QAPair.status == "active", QAPair.category.isnot(None)))
            .group_by(QAPair.category)
        )
        category_result = await self.db.execute(category_query)
        for category, count in category_result.fetchall():
            if category:
                overview.by_category[category] = count

        # 按来源统计
        source_query = (
            select(QAPair.source, func.count(QAPair.id))
            .where(and_(QAPair.status == "active", QAPair.source.isnot(None)))
            .group_by(QAPair.source)
        )
        source_result = await self.db.execute(source_query)
        for source, count in source_result.fetchall():
            if source:
                overview.by_source[source] = count

        # 同步状态统计
        synced_query = select(func.count(QAPair.id)).where(
            and_(QAPair.status == "active", QAPair.is_synced == True)
        )
        synced_result = await self.db.execute(synced_query)
        overview.synced_count = synced_result.scalar() or 0

        unsynced_query = select(func.count(QAPair.id)).where(
            and_(QAPair.status == "active", QAPair.is_synced == False)
        )
        unsynced_result = await self.db.execute(unsynced_query)
        overview.unsynced_count = unsynced_result.scalar() or 0

        return overview

    async def list_qa_pairs(
        self,
        tenant_id: Optional[str] = None,
        keyword: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        is_synced: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> QAPairListResponse:
        """获取 QA 列表"""
        # 基础查询
        query = select(QAPair).where(QAPair.status == "active")

        # 商家筛选
        if tenant_id:
            query = query.where(QAPair.tenant_id == tenant_id)
        else:
            # 排除模板（tenant_id 为 None 的）
            query = query.where(QAPair.tenant_id.isnot(None))

        # 分类筛选
        if category:
            query = query.where(QAPair.category == category)

        # 来源筛选
        if source:
            query = query.where(QAPair.source == source)

        # 同步状态筛选
        if is_synced is not None:
            query = query.where(QAPair.is_synced == is_synced)

        # 关键词搜索
        if keyword:
            query = query.where(
                or_(
                    QAPair.question.ilike(f"%{keyword}%"),
                    QAPair.answer.ilike(f"%{keyword}%")
                )
            )

        # 统计总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # 分页和排序
        offset = (page - 1) * page_size
        query = query.order_by(QAPair.updated_at.desc())
        query = query.offset(offset).limit(page_size)

        # 执行查询
        result = await self.db.execute(query)
        qa_pairs = result.scalars().all()

        # 获取商家名称映射
        tenant_ids = list(set(qa.tenant_id for qa in qa_pairs if qa.tenant_id))
        tenant_names = await self._get_tenant_names(tenant_ids)

        # 构建结果
        items = [
            QAPairItem(
                id=qa.id,
                tenant_id=qa.tenant_id,
                tenant_name=tenant_names.get(qa.tenant_id, "未知商家"),
                question=qa.question,
                answer=qa.answer,
                category=qa.category,
                keywords=qa.keywords.split(',') if qa.keywords else [],
                source=qa.source,
                priority=qa.priority or 0,
                is_synced=qa.is_synced or False,
                status=qa.status,
                created_at=qa.created_at,
                updated_at=qa.updated_at,
            )
            for qa in qa_pairs
        ]

        total_pages = (total + page_size - 1) // page_size

        return QAPairListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_qa_pair(self, qa_id: int) -> Optional[QAPairItem]:
        """获取单个 QA 详情"""
        query = select(QAPair).where(
            and_(QAPair.id == qa_id, QAPair.status == "active")
        )
        result = await self.db.execute(query)
        qa = result.scalar_one_or_none()

        if not qa:
            return None

        tenant_name = None
        if qa.tenant_id:
            tenant_names = await self._get_tenant_names([qa.tenant_id])
            tenant_name = tenant_names.get(qa.tenant_id)

        return QAPairItem(
            id=qa.id,
            tenant_id=qa.tenant_id,
            tenant_name=tenant_name,
            question=qa.question,
            answer=qa.answer,
            category=qa.category,
            keywords=qa.keywords.split(',') if qa.keywords else [],
            source=qa.source,
            priority=qa.priority or 0,
            is_synced=qa.is_synced or False,
            status=qa.status,
            created_at=qa.created_at,
            updated_at=qa.updated_at,
        )

    async def create_qa_pair(self, data: QAPairCreate) -> QAPairItem:
        """创建 QA"""
        qa = QAPair(
            tenant_id=data.tenant_id,
            question=data.question,
            answer=data.answer,
            category=data.category,
            keywords=data.keywords,
            priority=data.priority,
            status="active",
            is_synced=False,
            source="ops_manual",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        self.db.add(qa)
        await self.db.commit()
        await self.db.refresh(qa)

        tenant_name = None
        if qa.tenant_id:
            tenant_names = await self._get_tenant_names([qa.tenant_id])
            tenant_name = tenant_names.get(qa.tenant_id)

        return QAPairItem(
            id=qa.id,
            tenant_id=qa.tenant_id,
            tenant_name=tenant_name,
            question=qa.question,
            answer=qa.answer,
            category=qa.category,
            keywords=qa.keywords.split(',') if qa.keywords else [],
            source=qa.source,
            priority=qa.priority or 0,
            is_synced=qa.is_synced or False,
            status=qa.status,
            created_at=qa.created_at,
            updated_at=qa.updated_at,
        )

    async def update_qa_pair(self, qa_id: int, data: QAPairUpdate) -> Optional[QAPairItem]:
        """更新 QA"""
        query = select(QAPair).where(
            and_(QAPair.id == qa_id, QAPair.status == "active")
        )
        result = await self.db.execute(query)
        qa = result.scalar_one_or_none()

        if not qa:
            return None

        # 更新字段
        if data.question is not None:
            qa.question = data.question
        if data.answer is not None:
            qa.answer = data.answer
        if data.category is not None:
            qa.category = data.category
        if data.keywords is not None:
            qa.keywords = data.keywords
        if data.priority is not None:
            qa.priority = data.priority

        qa.updated_at = datetime.now(timezone.utc)
        qa.is_synced = False  # 标记需要重新同步

        await self.db.commit()
        await self.db.refresh(qa)

        tenant_name = None
        if qa.tenant_id:
            tenant_names = await self._get_tenant_names([qa.tenant_id])
            tenant_name = tenant_names.get(qa.tenant_id)

        return QAPairItem(
            id=qa.id,
            tenant_id=qa.tenant_id,
            tenant_name=tenant_name,
            question=qa.question,
            answer=qa.answer,
            category=qa.category,
            keywords=qa.keywords.split(',') if qa.keywords else [],
            source=qa.source,
            priority=qa.priority or 0,
            is_synced=qa.is_synced or False,
            status=qa.status,
            created_at=qa.created_at,
            updated_at=qa.updated_at,
        )

    async def delete_qa_pair(self, qa_id: int) -> bool:
        """删除 QA（软删除）"""
        stmt = (
            update(QAPair)
            .where(QAPair.id == qa_id)
            .values(
                status="deleted",
                updated_at=datetime.now(timezone.utc)
            )
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount > 0

    async def bulk_delete(self, qa_ids: List[int]) -> BulkOperationResult:
        """批量删除"""
        success_count = 0
        failed_count = 0
        errors = []

        for qa_id in qa_ids:
            try:
                success = await self.delete_qa_pair(qa_id)
                if success:
                    success_count += 1
                else:
                    failed_count += 1
                    errors.append(f"QA {qa_id} 不存在")
            except Exception as e:
                failed_count += 1
                errors.append(f"QA {qa_id} 删除失败: {str(e)}")

        return BulkOperationResult(
            success_count=success_count,
            failed_count=failed_count,
            errors=errors,
        )

    async def bulk_sync(self, qa_ids: List[int]) -> BulkOperationResult:
        """批量标记待同步"""
        stmt = (
            update(QAPair)
            .where(QAPair.id.in_(qa_ids))
            .values(
                is_synced=False,
                updated_at=datetime.now(timezone.utc)
            )
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return BulkOperationResult(
            success_count=result.rowcount,
            failed_count=len(qa_ids) - result.rowcount,
            errors=[],
        )

    async def bulk_update_category(
        self,
        qa_ids: List[int],
        category: str
    ) -> BulkOperationResult:
        """批量更新分类"""
        stmt = (
            update(QAPair)
            .where(QAPair.id.in_(qa_ids))
            .values(
                category=category,
                updated_at=datetime.now(timezone.utc)
            )
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return BulkOperationResult(
            success_count=result.rowcount,
            failed_count=len(qa_ids) - result.rowcount,
            errors=[],
        )

    async def get_categories(self, tenant_id: Optional[str] = None) -> List[str]:
        """获取所有分类"""
        query = (
            select(QAPair.category)
            .where(
                and_(
                    QAPair.status == "active",
                    QAPair.category.isnot(None)
                )
            )
            .distinct()
        )

        if tenant_id:
            query = query.where(QAPair.tenant_id == tenant_id)

        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    async def get_sources(self) -> List[str]:
        """获取所有来源"""
        query = (
            select(QAPair.source)
            .where(
                and_(
                    QAPair.status == "active",
                    QAPair.source.isnot(None)
                )
            )
            .distinct()
        )

        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    async def get_sync_status(self) -> SyncStatus:
        """获取同步状态"""
        # 待同步数量
        pending_query = select(func.count(QAPair.id)).where(
            and_(
                QAPair.status == "active",
                QAPair.is_synced == False,
                QAPair.tenant_id.isnot(None)
            )
        )
        pending_result = await self.db.execute(pending_query)
        pending_count = pending_result.scalar() or 0

        # 已同步数量
        synced_query = select(func.count(QAPair.id)).where(
            and_(
                QAPair.status == "active",
                QAPair.is_synced == True,
                QAPair.tenant_id.isnot(None)
            )
        )
        synced_result = await self.db.execute(synced_query)
        synced_count = synced_result.scalar() or 0

        return SyncStatus(
            is_running=False,  # 需要从调度器获取实际状态
            last_sync_time=None,
            pending_count=pending_count,
            synced_count=synced_count,
        )

    async def get_tenants_list(self) -> List[Dict[str, str]]:
        """获取商家列表（用于下拉选择）"""
        query = select(Tenant.id, Tenant.name).where(Tenant.status == "active")
        result = await self.db.execute(query)
        return [{"id": row[0], "name": row[1]} for row in result.fetchall()]

    # ========== 私有方法 ==========

    async def _get_tenant_names(self, tenant_ids: List[str]) -> Dict[str, str]:
        """获取商家名称映射"""
        if not tenant_ids:
            return {}

        query = select(Tenant.id, Tenant.name).where(Tenant.id.in_(tenant_ids))
        result = await self.db.execute(query)
        return {row[0]: row[1] for row in result.fetchall()}
