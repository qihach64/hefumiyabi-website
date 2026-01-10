"""
Ops Auth Service
运维中心认证服务

提供运维登录、会话管理和安全控制功能
"""

import os
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass, field

from fastapi import Request, HTTPException, status


# 默认管理员凭据（生产环境应使用环境变量）
DEFAULT_OPS_USERNAME = "admin"
DEFAULT_OPS_PASSWORD = "kimono_ops_2024"

# 从环境变量读取（如果存在）
OPS_USERNAME = os.environ.get("OPS_USERNAME", DEFAULT_OPS_USERNAME)
OPS_PASSWORD = os.environ.get("OPS_PASSWORD", DEFAULT_OPS_PASSWORD)

# 会话配置
SESSION_TIMEOUT_SECONDS = 3600  # 1小时
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900  # 15分钟


@dataclass
class OpsSession:
    """运维会话"""
    token: str
    username: str
    created_at: datetime
    last_active: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


@dataclass
class LoginAttempt:
    """登录尝试记录"""
    count: int = 0
    first_attempt: Optional[datetime] = None
    locked_until: Optional[datetime] = None


class OpsAuthService:
    """运维认证服务"""

    def __init__(self):
        # 活跃会话存储 {token: OpsSession}
        self._sessions: Dict[str, OpsSession] = {}
        # 登录尝试记录 {ip: LoginAttempt}
        self._login_attempts: Dict[str, LoginAttempt] = {}

    def _hash_password(self, password: str) -> str:
        """哈希密码"""
        return hashlib.sha256(password.encode()).hexdigest()

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        return self._hash_password(plain_password) == hashed_password

    def _generate_token(self) -> str:
        """生成会话令牌"""
        return secrets.token_urlsafe(32)

    def _get_client_ip(self, request: Request) -> str:
        """获取客户端 IP"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def is_ip_locked(self, ip: str) -> bool:
        """检查 IP 是否被锁定"""
        attempt = self._login_attempts.get(ip)
        if not attempt or not attempt.locked_until:
            return False
        if datetime.now(timezone.utc) > attempt.locked_until:
            # 锁定已过期，重置
            self._login_attempts[ip] = LoginAttempt()
            return False
        return True

    def get_lockout_remaining(self, ip: str) -> int:
        """获取剩余锁定秒数"""
        attempt = self._login_attempts.get(ip)
        if not attempt or not attempt.locked_until:
            return 0
        remaining = (attempt.locked_until - datetime.now(timezone.utc)).total_seconds()
        return max(0, int(remaining))

    def record_failed_attempt(self, ip: str) -> None:
        """记录失败的登录尝试"""
        now = datetime.now(timezone.utc)
        attempt = self._login_attempts.get(ip, LoginAttempt())

        # 如果是首次尝试或距离上次尝试超过锁定时间，重置计数
        if not attempt.first_attempt or (now - attempt.first_attempt).total_seconds() > LOCKOUT_DURATION_SECONDS:
            attempt = LoginAttempt(count=1, first_attempt=now)
        else:
            attempt.count += 1

        # 检查是否需要锁定
        if attempt.count >= MAX_LOGIN_ATTEMPTS:
            attempt.locked_until = now + timedelta(seconds=LOCKOUT_DURATION_SECONDS)

        self._login_attempts[ip] = attempt

    def clear_failed_attempts(self, ip: str) -> None:
        """清除失败尝试记录"""
        if ip in self._login_attempts:
            del self._login_attempts[ip]

    def login(
        self,
        username: str,
        password: str,
        request: Request,
    ) -> Optional[Dict[str, Any]]:
        """
        运维登录

        Returns:
            成功返回会话信息，失败返回 None
        """
        ip = self._get_client_ip(request)

        # 检查是否被锁定
        if self.is_ip_locked(ip):
            remaining = self.get_lockout_remaining(ip)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"登录尝试过多，请 {remaining} 秒后重试",
            )

        # 验证凭据（使用常数时间比较防止时序攻击）
        username_valid = secrets.compare_digest(username.encode(), OPS_USERNAME.encode())
        password_valid = secrets.compare_digest(password.encode(), OPS_PASSWORD.encode())
        if not (username_valid and password_valid):
            self.record_failed_attempt(ip)
            return None

        # 登录成功，清除失败记录
        self.clear_failed_attempts(ip)

        # 创建会话
        token = self._generate_token()
        now = datetime.now(timezone.utc)
        session = OpsSession(
            token=token,
            username=username,
            created_at=now,
            last_active=now,
            ip_address=ip,
            user_agent=request.headers.get("User-Agent"),
        )
        self._sessions[token] = session

        return {
            "token": token,
            "username": username,
            "expires_in": SESSION_TIMEOUT_SECONDS,
        }

    def logout(self, token: str) -> bool:
        """登出"""
        if token in self._sessions:
            del self._sessions[token]
            return True
        return False

    def validate_session(self, token: str) -> Optional[OpsSession]:
        """
        验证会话

        Returns:
            有效返回会话对象，无效返回 None
        """
        session = self._sessions.get(token)
        if not session:
            return None

        now = datetime.now(timezone.utc)

        # 检查会话是否过期
        if (now - session.last_active).total_seconds() > SESSION_TIMEOUT_SECONDS:
            del self._sessions[token]
            return None

        # 更新最后活跃时间
        session.last_active = now
        return session

    def get_session_info(self, token: str) -> Optional[Dict[str, Any]]:
        """获取会话信息"""
        session = self.validate_session(token)
        if not session:
            return None

        return {
            "username": session.username,
            "created_at": session.created_at.isoformat(),
            "last_active": session.last_active.isoformat(),
            "ip_address": session.ip_address,
            "expires_in": SESSION_TIMEOUT_SECONDS - int(
                (datetime.now(timezone.utc) - session.last_active).total_seconds()
            ),
        }

    def cleanup_expired_sessions(self) -> int:
        """清理过期会话"""
        now = datetime.now(timezone.utc)
        expired = [
            token for token, session in self._sessions.items()
            if (now - session.last_active).total_seconds() > SESSION_TIMEOUT_SECONDS
        ]
        for token in expired:
            del self._sessions[token]
        return len(expired)

    def get_active_sessions_count(self) -> int:
        """获取活跃会话数量"""
        self.cleanup_expired_sessions()
        return len(self._sessions)


# 全局单例
_ops_auth_service: Optional[OpsAuthService] = None


def get_ops_auth_service() -> OpsAuthService:
    """获取运维认证服务单例"""
    global _ops_auth_service
    if _ops_auth_service is None:
        _ops_auth_service = OpsAuthService()
    return _ops_auth_service


async def verify_ops_session(request: Request) -> OpsSession:
    """
    验证运维会话（依赖注入用）

    从 Authorization header 或 Cookie 中获取令牌并验证
    """
    # 从 Header 获取
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]

    # 从 Cookie 获取（备选）
    if not token:
        token = request.cookies.get("ops_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_service = get_ops_auth_service()
    session = auth_service.validate_session(token)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="会话已过期，请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return session
