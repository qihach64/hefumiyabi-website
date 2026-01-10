"""
Template Manager
通用模板管理服务

通用模板是 tenant_id 为 None 的 QAPair，可分发到各商家
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update

from database.models import QAPair, Tenant


@dataclass
class Template:
    """模板"""
    id: int
    question: str
    answer: str
    category: Optional[str] = None
    keywords: List[str] = field(default_factory=list)
    priority: int = 0
    status: str = "active"
    is_synced: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class TemplateCreate:
    """创建模板请求"""
    question: str
    answer: str
    category: Optional[str] = None
    keywords: List[str] = field(default_factory=list)
    priority: int = 0


@dataclass
class TemplateUpdate:
    """更新模板请求"""
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    keywords: Optional[List[str]] = None
    priority: Optional[int] = None


@dataclass
class TemplateListResponse:
    """模板列表响应"""
    items: List[Template]
    total: int
    page: int
    page_size: int


@dataclass
class DistributeResult:
    """分发结果"""
    success_count: int
    failed_count: int
    tenant_ids: List[str]
    errors: List[str] = field(default_factory=list)


class TemplateManager:
    """模板管理器"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def list_templates(
        self,
        category: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> TemplateListResponse:
        """获取模板列表"""
        # 基础查询：tenant_id 为 None 的是通用模板
        query = select(QAPair).where(
            and_(QAPair.tenant_id.is_(None), QAPair.status == "active")
        )

        # 分类过滤
        if category:
            query = query.where(QAPair.category == category)

        # 关键词搜索
        if keyword:
            query = query.where(
                QAPair.question.ilike(f"%{keyword}%") |
                QAPair.answer.ilike(f"%{keyword}%")
            )

        # 统计总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # 分页和排序
        offset = (page - 1) * page_size
        query = query.order_by(QAPair.priority.desc(), QAPair.created_at.desc())
        query = query.offset(offset).limit(page_size)

        # 执行查询
        result = await self.db.execute(query)
        qa_pairs = result.scalars().all()

        # 转换为 Template
        items = [self._qa_to_template(qa) for qa in qa_pairs]

        return TemplateListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_template(self, template_id: int) -> Optional[Template]:
        """获取模板详情"""
        query = select(QAPair).where(
            and_(
                QAPair.id == template_id,
                QAPair.tenant_id.is_(None),
                QAPair.status == "active"
            )
        )
        result = await self.db.execute(query)
        qa = result.scalar_one_or_none()

        if not qa:
            return None

        return self._qa_to_template(qa)

    async def create_template(self, data: TemplateCreate) -> Template:
        """创建模板"""
        qa = QAPair(
            tenant_id=None,  # 通用模板没有 tenant_id
            question=data.question,
            answer=data.answer,
            category=data.category,
            keywords=data.keywords,
            priority=data.priority,
            status="active",
            is_synced=False,
            source="manual",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        self.db.add(qa)
        await self.db.commit()
        await self.db.refresh(qa)

        return self._qa_to_template(qa)

    async def update_template(self, template_id: int, data: TemplateUpdate) -> Optional[Template]:
        """更新模板"""
        # 先获取
        query = select(QAPair).where(
            and_(
                QAPair.id == template_id,
                QAPair.tenant_id.is_(None),
                QAPair.status == "active"
            )
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

        return self._qa_to_template(qa)

    async def delete_template(self, template_id: int) -> bool:
        """删除模板（软删除）"""
        stmt = (
            update(QAPair)
            .where(
                and_(
                    QAPair.id == template_id,
                    QAPair.tenant_id.is_(None)
                )
            )
            .values(
                status="deleted",
                updated_at=datetime.now(timezone.utc)
            )
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount > 0

    async def distribute_to_tenant(
        self,
        template_ids: List[int],
        tenant_id: str,
    ) -> DistributeResult:
        """分发模板到指定商家"""
        success_count = 0
        failed_count = 0
        errors = []

        # 获取商家信息
        tenant_query = select(Tenant).where(Tenant.id == tenant_id)
        tenant_result = await self.db.execute(tenant_query)
        tenant = tenant_result.scalar_one_or_none()

        if not tenant:
            return DistributeResult(
                success_count=0,
                failed_count=len(template_ids),
                tenant_ids=[],
                errors=[f"商家 {tenant_id} 不存在"],
            )

        # 获取模板
        for template_id in template_ids:
            try:
                template = await self.get_template(template_id)
                if not template:
                    errors.append(f"模板 {template_id} 不存在")
                    failed_count += 1
                    continue

                # 检查是否已存在相同问题
                existing_query = select(QAPair).where(
                    and_(
                        QAPair.tenant_id == tenant_id,
                        QAPair.question == template.question,
                        QAPair.status == "active"
                    )
                )
                existing_result = await self.db.execute(existing_query)
                existing = existing_result.scalar_one_or_none()

                if existing:
                    # 更新现有的
                    existing.answer = template.answer
                    existing.category = template.category
                    existing.keywords = template.keywords
                    existing.priority = template.priority
                    existing.updated_at = datetime.now(timezone.utc)
                    existing.is_synced = False
                else:
                    # 创建新的
                    new_qa = QAPair(
                        tenant_id=tenant_id,
                        question=template.question,
                        answer=template.answer,
                        category=template.category,
                        keywords=template.keywords,
                        priority=template.priority,
                        status="active",
                        is_synced=False,
                        source="template",
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                    self.db.add(new_qa)

                success_count += 1

            except Exception as e:
                errors.append(f"模板 {template_id} 分发失败: {str(e)}")
                failed_count += 1

        await self.db.commit()

        return DistributeResult(
            success_count=success_count,
            failed_count=failed_count,
            tenant_ids=[tenant_id],
            errors=errors,
        )

    async def distribute_to_all(
        self,
        template_ids: List[int],
    ) -> DistributeResult:
        """分发模板到所有活跃商家"""
        # 获取所有活跃商家
        tenant_query = select(Tenant.id).where(Tenant.status == "active")
        tenant_result = await self.db.execute(tenant_query)
        tenant_ids = [row[0] for row in tenant_result.fetchall()]

        if not tenant_ids:
            return DistributeResult(
                success_count=0,
                failed_count=0,
                tenant_ids=[],
                errors=["没有活跃的商家"],
            )

        total_success = 0
        total_failed = 0
        all_errors = []

        for tenant_id in tenant_ids:
            result = await self.distribute_to_tenant(template_ids, tenant_id)
            total_success += result.success_count
            total_failed += result.failed_count
            all_errors.extend(result.errors)

        return DistributeResult(
            success_count=total_success,
            failed_count=total_failed,
            tenant_ids=tenant_ids,
            errors=all_errors,
        )

    async def get_categories(self) -> List[str]:
        """获取所有模板分类"""
        query = (
            select(QAPair.category)
            .where(
                and_(
                    QAPair.tenant_id.is_(None),
                    QAPair.status == "active",
                    QAPair.category.isnot(None)
                )
            )
            .distinct()
        )
        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    # ========== 私有方法 ==========

    def _qa_to_template(self, qa: QAPair) -> Template:
        """将 QAPair 转换为 Template"""
        return Template(
            id=qa.id,
            question=qa.question,
            answer=qa.answer,
            category=qa.category,
            keywords=qa.keywords or [],
            priority=qa.priority or 0,
            status=qa.status,
            is_synced=qa.is_synced or False,
            created_at=qa.created_at,
            updated_at=qa.updated_at,
        )
