"""
Authentication Dependencies
认证依赖 - FastAPI 依赖注入
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from .jwt import verify_token, TokenData
from database import get_db_session
from database.models import User, Tenant


# Bearer Token 安全方案
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db_session),
) -> Optional[TokenData]:
    """获取当前用户（可选认证）

    用于支持匿名访问的接口
    """
    if credentials is None:
        return None

    token_data = verify_token(credentials.credentials, "access")
    return token_data


async def get_current_active_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: AsyncSession = Depends(get_db_session),
) -> TokenData:
    """获取当前活跃用户（必须认证）

    用于需要登录的接口
    """
    token_data = verify_token(credentials.credentials, "access")

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


async def get_current_tenant_admin(
    current_user: TokenData = Depends(get_current_active_user),
) -> TokenData:
    """获取当前商家管理员

    用于商家管理接口
    """
    if current_user.role not in ["tenant_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要商家管理员权限",
        )

    return current_user


def require_tenant(tenant_id: str):
    """要求特定租户权限

    装饰器工厂，用于限制特定商家访问
    """
    async def dependency(
        current_user: TokenData = Depends(get_current_active_user),
    ) -> TokenData:
        if current_user.role == "admin":
            # 系统管理员可以访问所有租户
            return current_user

        if current_user.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权访问该商家数据",
            )

        return current_user

    return dependency


# require_admin 是 get_current_tenant_admin 的别名
require_admin = get_current_tenant_admin


async def require_ops_role(
    current_user: TokenData = Depends(get_current_active_user),
) -> TokenData:
    """要求运维角色权限

    用于运维管理接口，只允许 ops_admin, ops_viewer, admin 角色访问
    """
    allowed_roles = ["ops_admin", "ops_viewer", "admin"]

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要运维人员权限",
        )

    return current_user


async def require_ops_admin(
    current_user: TokenData = Depends(get_current_active_user),
) -> TokenData:
    """要求运维管理员权限

    用于敏感运维操作，只允许 ops_admin, admin 角色访问
    """
    allowed_roles = ["ops_admin", "admin"]

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要运维管理员权限",
        )

    return current_user


class TenantContext:
    """租户上下文

    用于在请求中传递租户信息
    """

    def __init__(self, tenant_id: Optional[str] = None):
        self.tenant_id = tenant_id

    @classmethod
    def from_user(cls, user: Optional[TokenData]) -> "TenantContext":
        """从用户创建租户上下文"""
        if user is None:
            return cls(None)
        return cls(user.tenant_id)
