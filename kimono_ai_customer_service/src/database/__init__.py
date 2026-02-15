"""
Database Module
数据持久化层 - 支持 SQLite (开发) 和 PostgreSQL (生产)
"""

from .connection import (
    get_database,
    get_db_session,
    init_database,
    close_database,
)
from .models import (
    Base,
    Feedback,
    Conversation,
    QAPair,
    Tenant,
    User,
)

__all__ = [
    # Connection
    "get_database",
    "get_db_session",
    "init_database",
    "close_database",
    # Models
    "Base",
    "Feedback",
    "Conversation",
    "QAPair",
    "Tenant",
    "User",
]
