"""
JWT Token Management
JWT 令牌管理
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from dataclasses import dataclass

from jose import jwt, JWTError


# 配置
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "kimono-ai-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRE_MINUTES", "1440"))  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "7"))


@dataclass
class TokenData:
    """Token 数据"""
    user_id: str
    tenant_id: str
    username: str
    role: str
    token_type: str = "access"  # access or refresh


def create_access_token(
    user_id: str,
    tenant_id: str,
    username: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """创建访问令牌"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "username": username,
        "role": role,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(
    user_id: str,
    tenant_id: str,
    username: str,
    role: str,
) -> str:
    """创建刷新令牌"""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "username": username,
        "role": role,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    """解码令牌"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")
        tenant_id = payload.get("tenant_id")
        username = payload.get("username")
        role = payload.get("role")
        token_type = payload.get("type", "access")

        if not all([user_id, tenant_id, username, role]):
            return None

        return TokenData(
            user_id=user_id,
            tenant_id=tenant_id,
            username=username,
            role=role,
            token_type=token_type,
        )

    except JWTError:
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[TokenData]:
    """验证令牌"""
    token_data = decode_token(token)

    if token_data is None:
        return None

    if token_data.token_type != token_type:
        return None

    return token_data
