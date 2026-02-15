"""
Learning Scheduler
学习任务调度器 - 定期处理待处理的反馈并更新知识库
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional, Callable
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from .learning_service import LearningService, LearningStats
from knowledge.vector_store import VectorStoreManager


@dataclass
class SchedulerConfig:
    """调度器配置"""
    # 处理间隔（秒）
    process_interval: int = 300  # 默认 5 分钟

    # 每次处理的最大反馈数
    batch_size: int = 50

    # 同步间隔（秒）
    sync_interval: int = 600  # 默认 10 分钟

    # 是否启用自动学习
    auto_learn_enabled: bool = True

    # 是否启用自动同步
    auto_sync_enabled: bool = True


@dataclass
class SchedulerStatus:
    """调度器状态"""
    is_running: bool = False
    last_process_time: Optional[datetime] = None
    last_sync_time: Optional[datetime] = None
    total_processed: int = 0
    total_synced: int = 0
    last_stats: Optional[LearningStats] = None
    errors: list = field(default_factory=list)


class LearningScheduler:
    """
    学习任务调度器

    功能:
    1. 定期处理待处理的反馈
    2. 定期同步未同步的问答对到向量库
    3. 提供手动触发接口
    4. 状态监控和报告
    """

    def __init__(
        self,
        session_factory: Callable[[], AsyncSession],
        vector_store: Optional[VectorStoreManager] = None,
        config: Optional[SchedulerConfig] = None,
    ):
        """
        初始化调度器

        Args:
            session_factory: 数据库会话工厂函数
            vector_store: 向量存储管理器
            config: 调度器配置
        """
        self.session_factory = session_factory
        self.vector_store = vector_store
        self.config = config or SchedulerConfig()
        self.status = SchedulerStatus()

        self._process_task: Optional[asyncio.Task] = None
        self._sync_task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()

    async def start(self):
        """启动调度器"""
        if self.status.is_running:
            return

        self.status.is_running = True
        self._stop_event.clear()

        print(f"🎓 学习调度器已启动")
        print(f"   - 处理间隔: {self.config.process_interval}s")
        print(f"   - 同步间隔: {self.config.sync_interval}s")
        print(f"   - 批次大小: {self.config.batch_size}")

        # 启动后台任务
        if self.config.auto_learn_enabled:
            self._process_task = asyncio.create_task(self._process_loop())

        if self.config.auto_sync_enabled:
            self._sync_task = asyncio.create_task(self._sync_loop())

    async def stop(self):
        """停止调度器"""
        if not self.status.is_running:
            return

        self._stop_event.set()
        self.status.is_running = False

        # 等待任务完成
        if self._process_task:
            self._process_task.cancel()
            try:
                await self._process_task
            except asyncio.CancelledError:
                pass

        if self._sync_task:
            self._sync_task.cancel()
            try:
                await self._sync_task
            except asyncio.CancelledError:
                pass

        print("🛑 学习调度器已停止")

    async def _process_loop(self):
        """处理循环"""
        while not self._stop_event.is_set():
            try:
                await self.process_feedbacks()
            except Exception as e:
                error_msg = f"处理反馈时出错: {e}"
                print(f"❌ {error_msg}")
                self.status.errors.append({
                    "time": datetime.utcnow().isoformat(),
                    "type": "process",
                    "message": str(e),
                })
                # 只保留最近 100 条错误
                if len(self.status.errors) > 100:
                    self.status.errors = self.status.errors[-100:]

            # 等待下一次处理
            try:
                await asyncio.wait_for(
                    self._stop_event.wait(),
                    timeout=self.config.process_interval,
                )
                break  # 如果 stop_event 被设置，退出循环
            except asyncio.TimeoutError:
                continue  # 超时则继续下一次处理

    async def _sync_loop(self):
        """同步循环"""
        while not self._stop_event.is_set():
            try:
                await self.sync_qa_pairs()
            except Exception as e:
                error_msg = f"同步问答对时出错: {e}"
                print(f"❌ {error_msg}")
                self.status.errors.append({
                    "time": datetime.utcnow().isoformat(),
                    "type": "sync",
                    "message": str(e),
                })

            try:
                await asyncio.wait_for(
                    self._stop_event.wait(),
                    timeout=self.config.sync_interval,
                )
                break
            except asyncio.TimeoutError:
                continue

    async def process_feedbacks(
        self,
        tenant_id: Optional[str] = None,
    ) -> LearningStats:
        """
        处理待处理的反馈（可手动调用）

        Args:
            tenant_id: 指定商家 ID，None 则处理所有

        Returns:
            学习统计
        """
        async with self.session_factory() as session:
            service = LearningService(
                session=session,
                vector_store=self.vector_store,
            )

            stats = await service.process_pending_feedbacks(
                tenant_id=tenant_id,
                limit=self.config.batch_size,
            )

            self.status.last_process_time = datetime.utcnow()
            self.status.total_processed += stats.processed
            self.status.last_stats = stats

            if stats.processed > 0:
                print(
                    f"📚 处理了 {stats.processed} 条反馈: "
                    f"创建={stats.created}, 更新={stats.updated}, "
                    f"跳过={stats.skipped}, 错误={stats.errors}"
                )

            return stats

    async def sync_qa_pairs(
        self,
        tenant_id: Optional[str] = None,
    ) -> dict:
        """
        同步未同步的问答对到向量库（可手动调用）

        Args:
            tenant_id: 指定商家 ID

        Returns:
            同步统计
        """
        if not self.vector_store:
            return {"error": "向量存储未配置"}

        async with self.session_factory() as session:
            service = LearningService(
                session=session,
                vector_store=self.vector_store,
            )

            result = await service.sync_unsynced_qa_pairs(
                tenant_id=tenant_id,
                limit=self.config.batch_size,
            )

            self.status.last_sync_time = datetime.utcnow()
            self.status.total_synced += result.get("synced", 0)

            if result.get("synced", 0) > 0:
                print(f"🔄 同步了 {result['synced']} 条问答对到向量库")

            return result

    def get_status(self) -> dict:
        """获取调度器状态"""
        return {
            "is_running": self.status.is_running,
            "config": {
                "process_interval": self.config.process_interval,
                "sync_interval": self.config.sync_interval,
                "batch_size": self.config.batch_size,
                "auto_learn_enabled": self.config.auto_learn_enabled,
                "auto_sync_enabled": self.config.auto_sync_enabled,
            },
            "statistics": {
                "last_process_time": (
                    self.status.last_process_time.isoformat()
                    if self.status.last_process_time else None
                ),
                "last_sync_time": (
                    self.status.last_sync_time.isoformat()
                    if self.status.last_sync_time else None
                ),
                "total_processed": self.status.total_processed,
                "total_synced": self.status.total_synced,
            },
            "last_run": (
                {
                    "processed": self.status.last_stats.processed,
                    "created": self.status.last_stats.created,
                    "updated": self.status.last_stats.updated,
                    "errors": self.status.last_stats.errors,
                }
                if self.status.last_stats else None
            ),
            "recent_errors": self.status.errors[-10:] if self.status.errors else [],
        }

    def update_config(
        self,
        process_interval: Optional[int] = None,
        sync_interval: Optional[int] = None,
        batch_size: Optional[int] = None,
        auto_learn_enabled: Optional[bool] = None,
        auto_sync_enabled: Optional[bool] = None,
    ):
        """更新配置"""
        if process_interval is not None:
            self.config.process_interval = process_interval
        if sync_interval is not None:
            self.config.sync_interval = sync_interval
        if batch_size is not None:
            self.config.batch_size = batch_size
        if auto_learn_enabled is not None:
            self.config.auto_learn_enabled = auto_learn_enabled
        if auto_sync_enabled is not None:
            self.config.auto_sync_enabled = auto_sync_enabled


# 全局调度器实例（延迟初始化）
_scheduler: Optional[LearningScheduler] = None


def get_scheduler() -> Optional[LearningScheduler]:
    """获取全局调度器实例"""
    return _scheduler


def init_scheduler(
    session_factory: Callable[[], AsyncSession],
    vector_store: Optional[VectorStoreManager] = None,
    config: Optional[SchedulerConfig] = None,
) -> LearningScheduler:
    """初始化全局调度器"""
    global _scheduler
    _scheduler = LearningScheduler(
        session_factory=session_factory,
        vector_store=vector_store,
        config=config,
    )
    return _scheduler
