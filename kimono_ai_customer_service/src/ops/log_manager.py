"""
Log Manager
运维日志管理服务

提供日志查询、统计和记录功能
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc


from database.models import OpsLog


@dataclass
class LogItem:
    """日志项"""
    id: int
    timestamp: datetime
    user_id: Optional[str]
    username: Optional[str]
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    details: Optional[Dict]
    ip_address: Optional[str]
    success: bool
    error_message: Optional[str]


@dataclass
class LogListResponse:
    """日志列表响应"""
    items: List[LogItem]
    total: int
    page: int
    page_size: int
    total_pages: int


@dataclass
class LogStats:
    """日志统计"""
    total_logs: int
    by_action: Dict[str, int]
    by_target_type: Dict[str, int]
    by_user: Dict[str, int]
    success_count: int
    failed_count: int
    recent_trend: List[Dict]  # 最近趋势 [{date, count}]


@dataclass
class LogFilter:
    """日志过滤条件"""
    user_id: Optional[str] = None
    action: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    success: Optional[bool] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    keyword: Optional[str] = None


class LogManager:
    """日志管理器"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def query_logs(
        self,
        filter: Optional[LogFilter] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> LogListResponse:
        """查询日志"""
        query = select(OpsLog)

        if filter:
            if filter.user_id:
                query = query.where(OpsLog.user_id == filter.user_id)
            if filter.action:
                query = query.where(OpsLog.action == filter.action)
            if filter.target_type:
                query = query.where(OpsLog.target_type == filter.target_type)
            if filter.target_id:
                query = query.where(OpsLog.target_id == filter.target_id)
            if filter.success is not None:
                query = query.where(OpsLog.success == filter.success)
            if filter.start_time:
                query = query.where(OpsLog.timestamp >= filter.start_time)
            if filter.end_time:
                query = query.where(OpsLog.timestamp <= filter.end_time)
            if filter.keyword:
                # 搜索 action, username, error_message
                keyword_pattern = f"%{filter.keyword}%"
                query = query.where(
                    OpsLog.action.ilike(keyword_pattern) |
                    OpsLog.username.ilike(keyword_pattern) |
                    OpsLog.error_message.ilike(keyword_pattern)
                )

        # 统计总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # 分页排序
        offset = (page - 1) * page_size
        query = query.order_by(desc(OpsLog.timestamp))
        query = query.offset(offset).limit(page_size)

        # 执行查询
        result = await self.db.execute(query)
        logs = result.scalars().all()

        items = [
            LogItem(
                id=log.id,
                timestamp=log.timestamp,
                user_id=log.user_id,
                username=log.username,
                action=log.action,
                target_type=log.target_type,
                target_id=log.target_id,
                details=log.details,
                ip_address=log.ip_address,
                success=log.success,
                error_message=log.error_message,
            )
            for log in logs
        ]

        total_pages = (total + page_size - 1) // page_size

        return LogListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_log_stats(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        days: int = 7,
    ) -> LogStats:
        """获取日志统计"""
        if not start_time:
            start_time = datetime.now(timezone.utc) - timedelta(days=days)
        if not end_time:
            end_time = datetime.now(timezone.utc)

        base_filter = and_(
            OpsLog.timestamp >= start_time,
            OpsLog.timestamp <= end_time
        )

        # 总数
        total_query = select(func.count(OpsLog.id)).where(base_filter)
        total_result = await self.db.execute(total_query)
        total_logs = total_result.scalar() or 0

        # 按操作类型统计
        action_query = (
            select(OpsLog.action, func.count(OpsLog.id))
            .where(base_filter)
            .group_by(OpsLog.action)
        )
        action_result = await self.db.execute(action_query)
        by_action = {row[0]: row[1] for row in action_result.fetchall() if row[0]}

        # 按目标类型统计
        target_query = (
            select(OpsLog.target_type, func.count(OpsLog.id))
            .where(and_(base_filter, OpsLog.target_type.isnot(None)))
            .group_by(OpsLog.target_type)
        )
        target_result = await self.db.execute(target_query)
        by_target_type = {row[0]: row[1] for row in target_result.fetchall() if row[0]}

        # 按用户统计
        user_query = (
            select(OpsLog.username, func.count(OpsLog.id))
            .where(and_(base_filter, OpsLog.username.isnot(None)))
            .group_by(OpsLog.username)
            .order_by(desc(func.count(OpsLog.id)))
            .limit(10)
        )
        user_result = await self.db.execute(user_query)
        by_user = {row[0]: row[1] for row in user_result.fetchall() if row[0]}

        # 成功/失败统计
        success_query = select(func.count(OpsLog.id)).where(
            and_(base_filter, OpsLog.success == True)
        )
        success_result = await self.db.execute(success_query)
        success_count = success_result.scalar() or 0

        failed_query = select(func.count(OpsLog.id)).where(
            and_(base_filter, OpsLog.success == False)
        )
        failed_result = await self.db.execute(failed_query)
        failed_count = failed_result.scalar() or 0

        # 最近趋势（按天统计）
        recent_trend = await self._get_daily_trend(start_time, end_time)

        return LogStats(
            total_logs=total_logs,
            by_action=by_action,
            by_target_type=by_target_type,
            by_user=by_user,
            success_count=success_count,
            failed_count=failed_count,
            recent_trend=recent_trend,
        )

    async def record_log(
        self,
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        user_id: Optional[str] = None,
        username: Optional[str] = None,
        details: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ) -> OpsLog:
        """记录操作日志"""
        log = OpsLog(
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            username=username,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address,
            success=success,
            error_message=error_message,
        )

        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)

        return log

    async def get_actions(self) -> List[str]:
        """获取所有操作类型"""
        query = (
            select(OpsLog.action)
            .distinct()
            .order_by(OpsLog.action)
        )
        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    async def get_target_types(self) -> List[str]:
        """获取所有目标类型"""
        query = (
            select(OpsLog.target_type)
            .where(OpsLog.target_type.isnot(None))
            .distinct()
            .order_by(OpsLog.target_type)
        )
        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    async def get_users(self) -> List[Dict[str, str]]:
        """获取有日志记录的用户列表"""
        query = (
            select(OpsLog.user_id, OpsLog.username)
            .where(OpsLog.user_id.isnot(None))
            .distinct()
        )
        result = await self.db.execute(query)
        return [
            {"id": row[0], "name": row[1] or row[0]}
            for row in result.fetchall()
            if row[0]
        ]

    # ========== 私有方法 ==========

    async def _get_daily_trend(
        self,
        start_time: datetime,
        end_time: datetime,
    ) -> List[Dict]:
        """获取每日趋势"""
        # 生成日期范围
        current = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
        end = end_time.replace(hour=23, minute=59, second=59, microsecond=999999)

        trend = []
        while current <= end:
            next_day = current + timedelta(days=1)

            # 查询当天日志数
            count_query = select(func.count(OpsLog.id)).where(
                and_(
                    OpsLog.timestamp >= current,
                    OpsLog.timestamp < next_day
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
