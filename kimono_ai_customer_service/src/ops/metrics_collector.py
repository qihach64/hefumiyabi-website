"""
Metrics Collector
系统指标收集器
"""

import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text, Integer

from database.models import Tenant, User, Feedback, Conversation, QAPair


@dataclass
class ComponentStatus:
    """组件状态"""
    name: str
    status: str  # healthy/degraded/unhealthy
    latency_ms: float
    last_check: datetime
    message: Optional[str] = None


@dataclass
class DashboardOverview:
    """仪表盘概览数据"""
    # 商家统计
    total_tenants: int = 0
    active_tenants: int = 0
    suspended_tenants: int = 0

    # 用户统计
    total_users: int = 0
    active_users: int = 0

    # 全局对话统计
    conversations_today: int = 0
    conversations_week: int = 0
    conversations_month: int = 0

    # 全局知识库统计
    total_qa_pairs: int = 0
    synced_qa_pairs: int = 0
    unsynced_qa_pairs: int = 0
    template_qa_pairs: int = 0

    # 全局反馈统计
    pending_feedbacks: int = 0
    total_feedbacks: int = 0

    # 系统状态
    components_status: Dict[str, str] = field(default_factory=dict)
    uptime_seconds: int = 0

    # 时间戳
    collected_at: str = ""


@dataclass
class TrendDataPoint:
    """趋势数据点"""
    date: str
    conversations: int = 0
    feedbacks: int = 0
    qa_pairs_created: int = 0


@dataclass
class TenantActivity:
    """商家活跃度"""
    tenant_id: str
    tenant_name: str
    conversations_count: int
    last_active: Optional[datetime]


class MetricsCollector:
    """指标收集器"""

    # 服务启动时间
    _start_time: datetime = None

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        if MetricsCollector._start_time is None:
            MetricsCollector._start_time = datetime.now(timezone.utc)

    async def collect_overview(self) -> DashboardOverview:
        """收集仪表盘概览数据"""
        overview = DashboardOverview()

        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)

        # 商家统计
        tenant_stats = await self._get_tenant_stats()
        overview.total_tenants = tenant_stats.get("total", 0)
        overview.active_tenants = tenant_stats.get("active", 0)
        overview.suspended_tenants = tenant_stats.get("suspended", 0)

        # 用户统计
        user_stats = await self._get_user_stats()
        overview.total_users = user_stats.get("total", 0)
        overview.active_users = user_stats.get("active", 0)

        # 对话统计
        overview.conversations_today = await self._count_conversations_since(today_start)
        overview.conversations_week = await self._count_conversations_since(week_start)
        overview.conversations_month = await self._count_conversations_since(month_start)

        # 知识库统计
        qa_stats = await self._get_qa_stats()
        overview.total_qa_pairs = qa_stats.get("total", 0)
        overview.synced_qa_pairs = qa_stats.get("synced", 0)
        overview.unsynced_qa_pairs = qa_stats.get("unsynced", 0)
        overview.template_qa_pairs = qa_stats.get("templates", 0)

        # 反馈统计
        feedback_stats = await self._get_feedback_stats()
        overview.pending_feedbacks = feedback_stats.get("pending", 0)
        overview.total_feedbacks = feedback_stats.get("total", 0)

        # 系统状态
        overview.uptime_seconds = int((now - MetricsCollector._start_time).total_seconds())
        overview.collected_at = now.isoformat()

        return overview

    async def collect_trends(self, days: int = 7) -> List[TrendDataPoint]:
        """收集趋势数据"""
        trends = []
        now = datetime.now(timezone.utc)

        for i in range(days - 1, -1, -1):
            date = now - timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)

            # 对话数
            conversations = await self._count_conversations_between(day_start, day_end)

            # 反馈数
            feedbacks = await self._count_feedbacks_between(day_start, day_end)

            # 新增 QA 数
            qa_created = await self._count_qa_created_between(day_start, day_end)

            trends.append(TrendDataPoint(
                date=day_start.strftime("%Y-%m-%d"),
                conversations=conversations,
                feedbacks=feedbacks,
                qa_pairs_created=qa_created,
            ))

        return trends

    async def get_top_active_tenants(self, limit: int = 5) -> List[TenantActivity]:
        """获取最活跃的商家"""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # 查询今日对话数最多的商家
        query = (
            select(
                Conversation.tenant_id,
                Tenant.name,
                func.count(Conversation.id).label("conv_count"),
                func.max(Conversation.updated_at).label("last_active")
            )
            .join(Tenant, Conversation.tenant_id == Tenant.id, isouter=True)
            .where(
                and_(
                    Conversation.created_at >= today_start,
                    Conversation.tenant_id.isnot(None)
                )
            )
            .group_by(Conversation.tenant_id, Tenant.name)
            .order_by(func.count(Conversation.id).desc())
            .limit(limit)
        )

        result = await self.db.execute(query)
        rows = result.fetchall()

        activities = []
        for row in rows:
            activities.append(TenantActivity(
                tenant_id=row.tenant_id or "unknown",
                tenant_name=row.name or "未知商家",
                conversations_count=row.conv_count,
                last_active=row.last_active,
            ))

        return activities

    async def check_component_health(
        self,
        db_healthy: bool = True,
        pinecone_healthy: bool = True,
        pinecone_latency: float = 0,
        llm_healthy: bool = True,
        llm_latency: float = 0,
        scheduler_running: bool = True,
    ) -> List[ComponentStatus]:
        """检查组件健康状态"""
        now = datetime.now(timezone.utc)
        components = []

        # 数据库
        db_status = "healthy" if db_healthy else "unhealthy"
        db_latency = await self._check_db_latency()
        components.append(ComponentStatus(
            name="database",
            status=db_status,
            latency_ms=db_latency,
            last_check=now,
        ))

        # Pinecone
        pc_status = "healthy" if pinecone_healthy else "unhealthy"
        if pinecone_latency > 1000:
            pc_status = "degraded"
        components.append(ComponentStatus(
            name="pinecone",
            status=pc_status,
            latency_ms=pinecone_latency,
            last_check=now,
        ))

        # LLM (DashScope)
        llm_status = "healthy" if llm_healthy else "unhealthy"
        if llm_latency > 5000:
            llm_status = "degraded"
        components.append(ComponentStatus(
            name="dashscope",
            status=llm_status,
            latency_ms=llm_latency,
            last_check=now,
        ))

        # 调度器
        sched_status = "healthy" if scheduler_running else "unhealthy"
        components.append(ComponentStatus(
            name="scheduler",
            status=sched_status,
            latency_ms=0,
            last_check=now,
            message="运行中" if scheduler_running else "已停止",
        ))

        return components

    # ========== 私有方法 ==========

    async def _get_tenant_stats(self) -> Dict[str, int]:
        """获取商家统计"""
        query = select(
            func.count(Tenant.id).label("total"),
            func.sum(func.cast(Tenant.status == "active", Integer)).label("active"),
            func.sum(func.cast(Tenant.status == "suspended", Integer)).label("suspended"),
        ).select_from(Tenant)

        try:
            # 使用更兼容的方式
            total_query = select(func.count(Tenant.id))
            total_result = await self.db.execute(total_query)
            total = total_result.scalar() or 0

            active_query = select(func.count(Tenant.id)).where(Tenant.status == "active")
            active_result = await self.db.execute(active_query)
            active = active_result.scalar() or 0

            suspended_query = select(func.count(Tenant.id)).where(Tenant.status == "suspended")
            suspended_result = await self.db.execute(suspended_query)
            suspended = suspended_result.scalar() or 0

            return {"total": total, "active": active, "suspended": suspended}
        except Exception:
            return {"total": 0, "active": 0, "suspended": 0}

    async def _get_user_stats(self) -> Dict[str, int]:
        """获取用户统计"""
        try:
            total_query = select(func.count(User.id))
            total_result = await self.db.execute(total_query)
            total = total_result.scalar() or 0

            active_query = select(func.count(User.id)).where(User.is_active == True)
            active_result = await self.db.execute(active_query)
            active = active_result.scalar() or 0

            return {"total": total, "active": active}
        except Exception:
            return {"total": 0, "active": 0}

    async def _count_conversations_since(self, since: datetime) -> int:
        """统计指定时间后的对话数"""
        try:
            query = select(func.count(Conversation.id)).where(
                Conversation.created_at >= since
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _count_conversations_between(self, start: datetime, end: datetime) -> int:
        """统计时间段内的对话数"""
        try:
            query = select(func.count(Conversation.id)).where(
                and_(
                    Conversation.created_at >= start,
                    Conversation.created_at < end
                )
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _get_qa_stats(self) -> Dict[str, int]:
        """获取知识库统计"""
        try:
            # 总数
            total_query = select(func.count(QAPair.id)).where(QAPair.status == "active")
            total_result = await self.db.execute(total_query)
            total = total_result.scalar() or 0

            # 已同步
            synced_query = select(func.count(QAPair.id)).where(
                and_(QAPair.status == "active", QAPair.is_synced == True)
            )
            synced_result = await self.db.execute(synced_query)
            synced = synced_result.scalar() or 0

            # 未同步
            unsynced = total - synced

            # 通用模板
            template_query = select(func.count(QAPair.id)).where(
                and_(QAPair.status == "active", QAPair.tenant_id.is_(None))
            )
            template_result = await self.db.execute(template_query)
            templates = template_result.scalar() or 0

            return {
                "total": total,
                "synced": synced,
                "unsynced": unsynced,
                "templates": templates,
            }
        except Exception:
            return {"total": 0, "synced": 0, "unsynced": 0, "templates": 0}

    async def _get_feedback_stats(self) -> Dict[str, int]:
        """获取反馈统计"""
        try:
            total_query = select(func.count(Feedback.id))
            total_result = await self.db.execute(total_query)
            total = total_result.scalar() or 0

            pending_query = select(func.count(Feedback.id)).where(
                Feedback.status == "pending"
            )
            pending_result = await self.db.execute(pending_query)
            pending = pending_result.scalar() or 0

            return {"total": total, "pending": pending}
        except Exception:
            return {"total": 0, "pending": 0}

    async def _count_feedbacks_between(self, start: datetime, end: datetime) -> int:
        """统计时间段内的反馈数"""
        try:
            query = select(func.count(Feedback.id)).where(
                and_(
                    Feedback.created_at >= start,
                    Feedback.created_at < end
                )
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _count_qa_created_between(self, start: datetime, end: datetime) -> int:
        """统计时间段内创建的 QA 对数"""
        try:
            query = select(func.count(QAPair.id)).where(
                and_(
                    QAPair.created_at >= start,
                    QAPair.created_at < end,
                    QAPair.status == "active"
                )
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _check_db_latency(self) -> float:
        """检查数据库延迟"""
        try:
            start = time.time()
            await self.db.execute(text("SELECT 1"))
            return (time.time() - start) * 1000
        except Exception:
            return -1
