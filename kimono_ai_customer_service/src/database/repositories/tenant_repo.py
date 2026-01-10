"""
Tenant Repository
商家数据访问层
"""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Tenant


class TenantRepository:
    """商家数据仓库"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        name: str,
        tenant_id: Optional[str] = None,
        namespace: Optional[str] = None,
        settings: Optional[dict] = None,
    ) -> Tenant:
        """创建商家"""
        if tenant_id is None:
            tenant_id = f"tenant_{uuid.uuid4().hex[:8]}"

        if namespace is None:
            namespace = tenant_id

        tenant = Tenant(
            id=tenant_id,
            name=name,
            namespace=namespace,
            settings=settings or {},
            status="active",
        )
        self.session.add(tenant)
        await self.session.flush()
        return tenant

    async def get_by_id(self, tenant_id: str) -> Optional[Tenant]:
        """根据 ID 获取商家"""
        result = await self.session.execute(
            select(Tenant).where(Tenant.id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_namespace(self, namespace: str) -> Optional[Tenant]:
        """根据命名空间获取商家"""
        result = await self.session.execute(
            select(Tenant).where(Tenant.namespace == namespace)
        )
        return result.scalar_one_or_none()

    async def update(
        self,
        tenant_id: str,
        name: Optional[str] = None,
        settings: Optional[dict] = None,
        status: Optional[str] = None,
    ) -> Optional[Tenant]:
        """更新商家信息"""
        tenant = await self.get_by_id(tenant_id)
        if not tenant:
            return None

        if name is not None:
            tenant.name = name
        if settings is not None:
            tenant.settings = settings
        if status is not None:
            tenant.status = status

        tenant.updated_at = datetime.utcnow()
        await self.session.flush()
        return tenant

    async def list_all(
        self,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Tenant]:
        """列出所有商家"""
        query = select(Tenant)
        if status:
            query = query.where(Tenant.status == status)
        query = query.order_by(Tenant.created_at.desc()).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(self, status: Optional[str] = None) -> int:
        """统计商家数量"""
        query = select(func.count(Tenant.id))
        if status:
            query = query.where(Tenant.status == status)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def delete(self, tenant_id: str) -> bool:
        """软删除商家"""
        tenant = await self.get_by_id(tenant_id)
        if tenant:
            tenant.status = "deleted"
            await self.session.flush()
            return True
        return False
