"""
Authentication Module
认证模块 - JWT + 密码加密
"""

from .jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
    decode_token,
    TokenData,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from .password import (
    hash_password,
    verify_password,
)
from .dependencies import (
    get_current_user,
    get_current_active_user,
    get_current_tenant_admin,
    require_tenant,
    require_admin,
    require_ops_role,
    require_ops_admin,
)

__all__ = [
    # JWT
    "create_access_token",
    "create_refresh_token",
    "verify_token",
    "decode_token",
    "TokenData",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    # Password
    "hash_password",
    "verify_password",
    # Dependencies
    "get_current_user",
    "get_current_active_user",
    "get_current_tenant_admin",
    "require_tenant",
    "require_admin",
    "require_ops_role",
    "require_ops_admin",
]
