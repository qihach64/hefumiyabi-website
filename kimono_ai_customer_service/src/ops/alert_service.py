"""
Alert Service
告警服务

提供告警创建、查询、确认、解决等功能
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from dataclasses import dataclass, field
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, update


from database.models import Alert


class AlertSeverity(str, Enum):
    """告警严重级别"""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class AlertStatus(str, Enum):
    """告警状态"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


@dataclass
class AlertItem:
    """告警项"""
    id: int
    created_at: datetime
    alert_type: str
    severity: str
    title: str
    message: Optional[str]
    source: Optional[str]
    status: str
    acknowledged_by: Optional[str]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    resolved_by: Optional[str]
    resolution_note: Optional[str]
    extra_data: Optional[Dict]


@dataclass
class AlertListResponse:
    """告警列表响应"""
    items: List[AlertItem]
    total: int
    page: int
    page_size: int
    total_pages: int


@dataclass
class AlertStats:
    """告警统计"""
    active_count: int
    acknowledged_count: int
    resolved_count: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
    recent_trend: List[Dict]  # 最近趋势


@dataclass
class AlertFilter:
    """告警过滤条件"""
    status: Optional[str] = None
    severity: Optional[str] = None
    alert_type: Optional[str] = None
    source: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class AlertService:
    """告警服务"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def create_alert(
        self,
        alert_type: str,
        severity: str,
        title: str,
        message: Optional[str] = None,
        source: Optional[str] = None,
        extra_data: Optional[Dict] = None,
    ) -> Alert:
        """创建告警"""
        alert = Alert(
            created_at=datetime.now(timezone.utc),
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            source=source,
            status=AlertStatus.ACTIVE.value,
            extra_data=extra_data,
        )

        self.db.add(alert)
        await self.db.commit()
        await self.db.refresh(alert)

        return alert

    async def get_active_alerts(self) -> List[AlertItem]:
        """获取活跃告警"""
        query = (
            select(Alert)
            .where(Alert.status.in_([AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]))
            .order_by(
                # 按严重级别排序
                Alert.severity == AlertSeverity.CRITICAL.value,
                Alert.severity == AlertSeverity.ERROR.value,
                Alert.severity == AlertSeverity.WARNING.value,
                desc(Alert.created_at)
            )
        )

        result = await self.db.execute(query)
        alerts = result.scalars().all()

        return [self._to_alert_item(alert) for alert in alerts]

    async def get_alerts(
        self,
        filter: Optional[AlertFilter] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> AlertListResponse:
        """查询告警"""
        query = select(Alert)

        if filter:
            if filter.status:
                query = query.where(Alert.status == filter.status)
            if filter.severity:
                query = query.where(Alert.severity == filter.severity)
            if filter.alert_type:
                query = query.where(Alert.alert_type == filter.alert_type)
            if filter.source:
                query = query.where(Alert.source == filter.source)
            if filter.start_time:
                query = query.where(Alert.created_at >= filter.start_time)
            if filter.end_time:
                query = query.where(Alert.created_at <= filter.end_time)

        # 统计总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # 分页排序
        offset = (page - 1) * page_size
        query = query.order_by(desc(Alert.created_at))
        query = query.offset(offset).limit(page_size)

        # 执行查询
        result = await self.db.execute(query)
        alerts = result.scalars().all()

        items = [self._to_alert_item(alert) for alert in alerts]
        total_pages = (total + page_size - 1) // page_size

        return AlertListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_alert(self, alert_id: int) -> Optional[AlertItem]:
        """获取单个告警"""
        query = select(Alert).where(Alert.id == alert_id)
        result = await self.db.execute(query)
        alert = result.scalar_one_or_none()

        if not alert:
            return None

        return self._to_alert_item(alert)

    async def acknowledge_alert(
        self,
        alert_id: int,
        user_id: str,
    ) -> Optional[AlertItem]:
        """确认告警"""
        query = select(Alert).where(
            and_(
                Alert.id == alert_id,
                Alert.status == AlertStatus.ACTIVE.value
            )
        )
        result = await self.db.execute(query)
        alert = result.scalar_one_or_none()

        if not alert:
            return None

        alert.status = AlertStatus.ACKNOWLEDGED.value
        alert.acknowledged_by = user_id
        alert.acknowledged_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(alert)

        return self._to_alert_item(alert)

    async def resolve_alert(
        self,
        alert_id: int,
        user_id: str,
        resolution_note: Optional[str] = None,
    ) -> Optional[AlertItem]:
        """解决告警"""
        query = select(Alert).where(
            and_(
                Alert.id == alert_id,
                Alert.status.in_([AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value])
            )
        )
        result = await self.db.execute(query)
        alert = result.scalar_one_or_none()

        if not alert:
            return None

        alert.status = AlertStatus.RESOLVED.value
        alert.resolved_by = user_id
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolution_note = resolution_note

        await self.db.commit()
        await self.db.refresh(alert)

        return self._to_alert_item(alert)

    async def bulk_acknowledge(
        self,
        alert_ids: List[int],
        user_id: str,
    ) -> int:
        """批量确认告警"""
        stmt = (
            update(Alert)
            .where(
                and_(
                    Alert.id.in_(alert_ids),
                    Alert.status == AlertStatus.ACTIVE.value
                )
            )
            .values(
                status=AlertStatus.ACKNOWLEDGED.value,
                acknowledged_by=user_id,
                acknowledged_at=datetime.now(timezone.utc),
            )
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount

    async def bulk_resolve(
        self,
        alert_ids: List[int],
        user_id: str,
        resolution_note: Optional[str] = None,
    ) -> int:
        """批量解决告警"""
        stmt = (
            update(Alert)
            .where(
                and_(
                    Alert.id.in_(alert_ids),
                    Alert.status.in_([AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value])
                )
            )
            .values(
                status=AlertStatus.RESOLVED.value,
                resolved_by=user_id,
                resolved_at=datetime.now(timezone.utc),
                resolution_note=resolution_note,
            )
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount

    async def get_alert_stats(
        self,
        days: int = 7,
    ) -> AlertStats:
        """获取告警统计"""
        # 活跃告警数
        active_query = select(func.count(Alert.id)).where(
            Alert.status == AlertStatus.ACTIVE.value
        )
        active_result = await self.db.execute(active_query)
        active_count = active_result.scalar() or 0

        # 已确认告警数
        ack_query = select(func.count(Alert.id)).where(
            Alert.status == AlertStatus.ACKNOWLEDGED.value
        )
        ack_result = await self.db.execute(ack_query)
        acknowledged_count = ack_result.scalar() or 0

        # 已解决告警数（最近N天）
        start_time = datetime.now(timezone.utc) - timedelta(days=days)
        resolved_query = select(func.count(Alert.id)).where(
            and_(
                Alert.status == AlertStatus.RESOLVED.value,
                Alert.resolved_at >= start_time
            )
        )
        resolved_result = await self.db.execute(resolved_query)
        resolved_count = resolved_result.scalar() or 0

        # 按严重级别统计（活跃+已确认）
        severity_query = (
            select(Alert.severity, func.count(Alert.id))
            .where(Alert.status.in_([AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]))
            .group_by(Alert.severity)
        )
        severity_result = await self.db.execute(severity_query)
        by_severity = {row[0]: row[1] for row in severity_result.fetchall() if row[0]}

        # 按类型统计（最近N天）
        type_query = (
            select(Alert.alert_type, func.count(Alert.id))
            .where(Alert.created_at >= start_time)
            .group_by(Alert.alert_type)
        )
        type_result = await self.db.execute(type_query)
        by_type = {row[0]: row[1] for row in type_result.fetchall() if row[0]}

        # 最近趋势
        recent_trend = await self._get_daily_trend(days)

        return AlertStats(
            active_count=active_count,
            acknowledged_count=acknowledged_count,
            resolved_count=resolved_count,
            by_severity=by_severity,
            by_type=by_type,
            recent_trend=recent_trend,
        )

    async def get_alert_types(self) -> List[str]:
        """获取所有告警类型"""
        query = (
            select(Alert.alert_type)
            .distinct()
            .order_by(Alert.alert_type)
        )
        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    async def get_alert_sources(self) -> List[str]:
        """获取所有告警来源"""
        query = (
            select(Alert.source)
            .where(Alert.source.isnot(None))
            .distinct()
            .order_by(Alert.source)
        )
        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    async def check_and_create_threshold_alert(
        self,
        metric_type: str,
        current_value: float,
        threshold: float,
        severity: str = AlertSeverity.WARNING.value,
        source: Optional[str] = None,
    ) -> Optional[Alert]:
        """检查阈值并创建告警"""
        if current_value <= threshold:
            return None

        # 检查是否已有同类型的活跃告警
        existing_query = select(Alert).where(
            and_(
                Alert.alert_type == f"threshold_{metric_type}",
                Alert.status.in_([AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value])
            )
        )
        existing_result = await self.db.execute(existing_query)
        existing = existing_result.scalar_one_or_none()

        if existing:
            # 已有活跃告警，不重复创建
            return None

        # 创建新告警
        alert = await self.create_alert(
            alert_type=f"threshold_{metric_type}",
            severity=severity,
            title=f"{metric_type} 超过阈值",
            message=f"当前值: {current_value}, 阈值: {threshold}",
            source=source,
            extra_data={
                "metric_type": metric_type,
                "current_value": current_value,
                "threshold": threshold,
            }
        )

        return alert

    # ========== 私有方法 ==========

    def _to_alert_item(self, alert: Alert) -> AlertItem:
        """转换为 AlertItem"""
        return AlertItem(
            id=alert.id,
            created_at=alert.created_at,
            alert_type=alert.alert_type,
            severity=alert.severity,
            title=alert.title,
            message=alert.message,
            source=alert.source,
            status=alert.status,
            acknowledged_by=alert.acknowledged_by,
            acknowledged_at=alert.acknowledged_at,
            resolved_at=alert.resolved_at,
            resolved_by=alert.resolved_by,
            resolution_note=alert.resolution_note,
            extra_data=alert.extra_data,
        )

    async def _get_daily_trend(self, days: int) -> List[Dict]:
        """获取每日告警趋势"""
        start_time = datetime.now(timezone.utc) - timedelta(days=days)
        current = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
        end = datetime.now(timezone.utc)

        trend = []
        while current <= end:
            next_day = current + timedelta(days=1)

            # 查询当天告警数
            count_query = select(func.count(Alert.id)).where(
                and_(
                    Alert.created_at >= current,
                    Alert.created_at < next_day
                )
            )
            count_result = await self.db.execute(count_query)
            count = count_result.scalar() or 0

            trend.append({
                "date": current.strftime("%Y-%m-%d"),
                "count": count,
            })

            current = next_day

        return trend
