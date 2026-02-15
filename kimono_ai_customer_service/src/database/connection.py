"""
Database Connection Management
数据库连接管理 - 支持 SQLite 和 PostgreSQL
"""

import os
from pathlib import Path
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.pool import StaticPool

from .models import Base


class Database:
    """数据库管理器"""

    def __init__(self):
        self.engine: Optional[AsyncEngine] = None
        self.session_factory: Optional[async_sessionmaker[AsyncSession]] = None
        self._initialized = False

    def get_database_url(self) -> str:
        """获取数据库连接 URL"""
        # 优先使用环境变量
        database_url = os.getenv("DATABASE_URL")

        if database_url:
            # PostgreSQL 异步驱动
            if database_url.startswith("postgresql://"):
                return database_url.replace("postgresql://", "postgresql+asyncpg://")
            return database_url

        # 默认使用 SQLite
        db_path = os.getenv("SQLITE_PATH")
        if not db_path:
            # 默认路径: data/kimono_ai.db
            project_root = Path(__file__).parent.parent.parent
            db_dir = project_root / "data"
            db_dir.mkdir(parents=True, exist_ok=True)
            db_path = str(db_dir / "kimono_ai.db")

        return f"sqlite+aiosqlite:///{db_path}"

    async def init(self, database_url: Optional[str] = None):
        """初始化数据库连接"""
        if self._initialized:
            return

        url = database_url or self.get_database_url()

        # 创建引擎
        if url.startswith("sqlite"):
            # SQLite 特殊配置
            self.engine = create_async_engine(
                url,
                echo=os.getenv("DEBUG", "").lower() == "true",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
        else:
            # PostgreSQL 配置
            self.engine = create_async_engine(
                url,
                echo=os.getenv("DEBUG", "").lower() == "true",
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
            )

        # 创建会话工厂
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

        # 创建所有表
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self._initialized = True
        print(f"✓ 数据库初始化完成: {url.split('://')[0]}")

    async def close(self):
        """关闭数据库连接"""
        if self.engine:
            await self.engine.dispose()
            self._initialized = False
            print("✓ 数据库连接已关闭")

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """获取数据库会话（上下文管理器）"""
        if not self._initialized or not self.session_factory:
            raise RuntimeError("数据库未初始化，请先调用 init()")

        session = self.session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    async def get_session(self) -> AsyncSession:
        """获取数据库会话（用于依赖注入）"""
        if not self._initialized or not self.session_factory:
            raise RuntimeError("数据库未初始化，请先调用 init()")
        return self.session_factory()


# 全局数据库实例
_database: Optional[Database] = None


def get_database() -> Database:
    """获取数据库实例"""
    global _database
    if _database is None:
        _database = Database()
    return _database


async def init_database(database_url: Optional[str] = None):
    """初始化数据库"""
    db = get_database()
    await db.init(database_url)


async def close_database():
    """关闭数据库"""
    db = get_database()
    await db.close()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖注入用的会话生成器"""
    db = get_database()
    async with db.session() as session:
        yield session
