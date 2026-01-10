"""
User Repository
用户数据访问层
"""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import User


class UserRepository:
    """用户数据仓库"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        tenant_id: str,
        username: str,
        password_hash: str,
        role: str = "staff",
        display_name: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> User:
        """创建用户"""
        if user_id is None:
            user_id = f"user_{uuid.uuid4().hex[:8]}"

        user = User(
            id=user_id,
            tenant_id=tenant_id,
            username=username,
            password_hash=password_hash,
            role=role,
            display_name=display_name or username,
            is_active=True,
        )
        self.session.add(user)
        await self.session.flush()
        return user

    async def get_by_id(self, user_id: str) -> Optional[User]:
        """根据 ID 获取用户"""
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        result = await self.session.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def get_by_tenant_and_username(
        self,
        tenant_id: str,
        username: str,
    ) -> Optional[User]:
        """根据商家和用户名获取用户"""
        result = await self.session.execute(
            select(User).where(
                and_(
                    User.tenant_id == tenant_id,
                    User.username == username,
                )
            )
        )
        return result.scalar_one_or_none()

    async def update(
        self,
        user_id: str,
        display_name: Optional[str] = None,
        password_hash: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[User]:
        """更新用户信息"""
        user = await self.get_by_id(user_id)
        if not user:
            return None

        if display_name is not None:
            user.display_name = display_name
        if password_hash is not None:
            user.password_hash = password_hash
        if role is not None:
            user.role = role
        if is_active is not None:
            user.is_active = is_active

        user.updated_at = datetime.utcnow()
        await self.session.flush()
        return user

    async def update_last_login(self, user_id: str) -> Optional[User]:
        """更新最后登录时间"""
        user = await self.get_by_id(user_id)
        if user:
            user.last_login = datetime.utcnow()
            await self.session.flush()
        return user

    async def list_by_tenant(
        self,
        tenant_id: str,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[User]:
        """列出商家的用户"""
        query = select(User).where(User.tenant_id == tenant_id)

        if role:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_by_tenant(
        self,
        tenant_id: str,
        is_active: Optional[bool] = None,
    ) -> int:
        """统计商家用户数量"""
        query = select(func.count(User.id)).where(User.tenant_id == tenant_id)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def delete(self, user_id: str) -> bool:
        """禁用用户"""
        user = await self.get_by_id(user_id)
        if user:
            user.is_active = False
            await self.session.flush()
            return True
        return False
