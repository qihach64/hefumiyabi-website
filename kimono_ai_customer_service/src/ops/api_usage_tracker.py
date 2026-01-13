"""
API Usage Tracker
API 使用追踪服务

提供 API 调用记录、统计和成本估算功能
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc


from database.models import APIUsageLog


# API 价格配置（每 1000 tokens）
API_PRICING = {
    "dashscope": {
        "chat": {
            "input": 0.002,   # ¥0.002/1K tokens
            "output": 0.006,  # ¥0.006/1K tokens
        },
        "embedding": {
            "input": 0.0007,  # ¥0.0007/1K tokens
            "output": 0.0,
        },
    },
    "pinecone": {
        "query": {
            "input": 0.0,
            "output": 0.0,
            "per_request": 0.000025,  # 按请求计费
        },
        "upsert": {
            "input": 0.0,
            "output": 0.0,
            "per_request": 0.000025,
        },
    },
}


@dataclass
class UsageRecord:
    """使用记录"""
    id: int
    timestamp: datetime
    api_type: str
    operation: str
    tenant_id: Optional[str]
    tokens_input: int
    tokens_output: int
    latency_ms: Optional[int]
    success: bool
    error_code: Optional[str]


@dataclass
class UsageListResponse:
    """使用记录列表响应"""
    items: List[UsageRecord]
    total: int
    page: int
    page_size: int
    total_pages: int


@dataclass
class UsageStats:
    """使用统计"""
    total_requests: int
    total_tokens_input: int
    total_tokens_output: int
    success_rate: float
    avg_latency_ms: float
    by_api_type: Dict[str, Dict]
    by_operation: Dict[str, Dict]
    by_tenant: Dict[str, Dict]
    daily_trend: List[Dict]


@dataclass
class CostEstimate:
    """成本估算"""
    total_cost: float
    by_api_type: Dict[str, float]
    by_operation: Dict[str, float]
    by_tenant: Dict[str, float]
    currency: str = "CNY"


@dataclass
class UsageFilter:
    """使用过滤条件"""
    api_type: Optional[str] = None
    operation: Optional[str] = None
    tenant_id: Optional[str] = None
    success: Optional[bool] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class APIUsageTracker:
    """API 使用追踪器"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def record_usage(
        self,
        api_type: str,
        operation: str,
        tenant_id: Optional[str] = None,
        tokens_input: int = 0,
        tokens_output: int = 0,
        latency_ms: Optional[int] = None,
        success: bool = True,
        error_code: Optional[str] = None,
    ) -> APIUsageLog:
        """记录 API 使用"""
        log = APIUsageLog(
            timestamp=datetime.now(timezone.utc),
            api_type=api_type,
            operation=operation,
            tenant_id=tenant_id,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            latency_ms=latency_ms,
            success=success,
            error_code=error_code,
        )

        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)

        return log

    async def get_usage_records(
        self,
        filter: Optional[UsageFilter] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> UsageListResponse:
        """查询使用记录"""
        query = select(APIUsageLog)

        if filter:
            if filter.api_type:
                query = query.where(APIUsageLog.api_type == filter.api_type)
            if filter.operation:
                query = query.where(APIUsageLog.operation == filter.operation)
            if filter.tenant_id:
                query = query.where(APIUsageLog.tenant_id == filter.tenant_id)
            if filter.success is not None:
                query = query.where(APIUsageLog.success == filter.success)
            if filter.start_time:
                query = query.where(APIUsageLog.timestamp >= filter.start_time)
            if filter.end_time:
                query = query.where(APIUsageLog.timestamp <= filter.end_time)

        # 统计总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # 分页排序
        offset = (page - 1) * page_size
        query = query.order_by(desc(APIUsageLog.timestamp))
        query = query.offset(offset).limit(page_size)

        # 执行查询
        result = await self.db.execute(query)
        records = result.scalars().all()

        items = [
            UsageRecord(
                id=r.id,
                timestamp=r.timestamp,
                api_type=r.api_type,
                operation=r.operation,
                tenant_id=r.tenant_id,
                tokens_input=r.tokens_input,
                tokens_output=r.tokens_output,
                latency_ms=r.latency_ms,
                success=r.success,
                error_code=r.error_code,
            )
            for r in records
        ]

        total_pages = (total + page_size - 1) // page_size

        return UsageListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_usage_stats(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        days: int = 7,
    ) -> UsageStats:
        """获取使用统计"""
        if not start_time:
            start_time = datetime.now(timezone.utc) - timedelta(days=days)
        if not end_time:
            end_time = datetime.now(timezone.utc)

        base_filter = and_(
            APIUsageLog.timestamp >= start_time,
            APIUsageLog.timestamp <= end_time
        )

        # 总请求数
        total_query = select(func.count(APIUsageLog.id)).where(base_filter)
        total_result = await self.db.execute(total_query)
        total_requests = total_result.scalar() or 0

        # 总 tokens
        tokens_query = select(
            func.sum(APIUsageLog.tokens_input),
            func.sum(APIUsageLog.tokens_output)
        ).where(base_filter)
        tokens_result = await self.db.execute(tokens_query)
        tokens_row = tokens_result.fetchone()
        total_tokens_input = tokens_row[0] or 0
        total_tokens_output = tokens_row[1] or 0

        # 成功率
        success_query = select(func.count(APIUsageLog.id)).where(
            and_(base_filter, APIUsageLog.success == True)
        )
        success_result = await self.db.execute(success_query)
        success_count = success_result.scalar() or 0
        success_rate = (success_count / total_requests * 100) if total_requests > 0 else 0

        # 平均延迟
        latency_query = select(func.avg(APIUsageLog.latency_ms)).where(
            and_(base_filter, APIUsageLog.latency_ms.isnot(None))
        )
        latency_result = await self.db.execute(latency_query)
        avg_latency_ms = latency_result.scalar() or 0

        # 按 API 类型统计
        by_api_type = await self._get_stats_by_field(base_filter, "api_type")

        # 按操作统计
        by_operation = await self._get_stats_by_field(base_filter, "operation")

        # 按商家统计
        by_tenant = await self._get_stats_by_tenant(base_filter)

        # 每日趋势
        daily_trend = await self._get_daily_trend(start_time, end_time)

        return UsageStats(
            total_requests=total_requests,
            total_tokens_input=total_tokens_input,
            total_tokens_output=total_tokens_output,
            success_rate=round(success_rate, 2),
            avg_latency_ms=round(avg_latency_ms, 2),
            by_api_type=by_api_type,
            by_operation=by_operation,
            by_tenant=by_tenant,
            daily_trend=daily_trend,
        )

    async def estimate_cost(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        days: int = 30,
    ) -> CostEstimate:
        """估算成本"""
        if not start_time:
            start_time = datetime.now(timezone.utc) - timedelta(days=days)
        if not end_time:
            end_time = datetime.now(timezone.utc)

        base_filter = and_(
            APIUsageLog.timestamp >= start_time,
            APIUsageLog.timestamp <= end_time,
            APIUsageLog.success == True
        )

        # 按 API 类型和操作统计
        stats_query = (
            select(
                APIUsageLog.api_type,
                APIUsageLog.operation,
                func.count(APIUsageLog.id),
                func.sum(APIUsageLog.tokens_input),
                func.sum(APIUsageLog.tokens_output),
            )
            .where(base_filter)
            .group_by(APIUsageLog.api_type, APIUsageLog.operation)
        )
        stats_result = await self.db.execute(stats_query)

        total_cost = 0.0
        by_api_type: Dict[str, float] = {}
        by_operation: Dict[str, float] = {}

        for row in stats_result.fetchall():
            api_type, operation, count, input_tokens, output_tokens = row
            input_tokens = input_tokens or 0
            output_tokens = output_tokens or 0

            cost = self._calculate_cost(
                api_type, operation, count, input_tokens, output_tokens
            )

            total_cost += cost

            if api_type not in by_api_type:
                by_api_type[api_type] = 0.0
            by_api_type[api_type] += cost

            op_key = f"{api_type}:{operation}"
            by_operation[op_key] = cost

        # 按商家统计成本
        tenant_query = (
            select(
                APIUsageLog.tenant_id,
                APIUsageLog.api_type,
                APIUsageLog.operation,
                func.count(APIUsageLog.id),
                func.sum(APIUsageLog.tokens_input),
                func.sum(APIUsageLog.tokens_output),
            )
            .where(and_(base_filter, APIUsageLog.tenant_id.isnot(None)))
            .group_by(APIUsageLog.tenant_id, APIUsageLog.api_type, APIUsageLog.operation)
        )
        tenant_result = await self.db.execute(tenant_query)

        by_tenant: Dict[str, float] = {}
        for row in tenant_result.fetchall():
            tenant_id, api_type, operation, count, input_tokens, output_tokens = row
            input_tokens = input_tokens or 0
            output_tokens = output_tokens or 0

            cost = self._calculate_cost(
                api_type, operation, count, input_tokens, output_tokens
            )

            if tenant_id not in by_tenant:
                by_tenant[tenant_id] = 0.0
            by_tenant[tenant_id] += cost

        return CostEstimate(
            total_cost=round(total_cost, 4),
            by_api_type={k: round(v, 4) for k, v in by_api_type.items()},
            by_operation={k: round(v, 4) for k, v in by_operation.items()},
            by_tenant={k: round(v, 4) for k, v in by_tenant.items()},
            currency="CNY",
        )

    async def get_api_types(self) -> List[str]:
        """获取所有 API 类型"""
        query = (
            select(APIUsageLog.api_type)
            .distinct()
            .order_by(APIUsageLog.api_type)
        )
        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    async def get_operations(self, api_type: Optional[str] = None) -> List[str]:
        """获取所有操作类型"""
        query = select(APIUsageLog.operation).distinct()

        if api_type:
            query = query.where(APIUsageLog.api_type == api_type)

        query = query.order_by(APIUsageLog.operation)

        result = await self.db.execute(query)
        return [row[0] for row in result.fetchall() if row[0]]

    # ========== 私有方法 ==========

    async def _get_stats_by_field(
        self,
        base_filter,
        field_name: str,
    ) -> Dict[str, Dict]:
        """按字段统计"""
        field = getattr(APIUsageLog, field_name)

        query = (
            select(
                field,
                func.count(APIUsageLog.id),
                func.sum(APIUsageLog.tokens_input),
                func.sum(APIUsageLog.tokens_output),
            )
            .where(base_filter)
            .group_by(field)
        )

        result = await self.db.execute(query)

        stats = {}
        for row in result.fetchall():
            key = row[0]
            if key:
                stats[key] = {
                    "count": row[1] or 0,
                    "tokens_input": row[2] or 0,
                    "tokens_output": row[3] or 0,
                }

        return stats

    async def _get_stats_by_tenant(self, base_filter) -> Dict[str, Dict]:
        """按商家统计"""
        query = (
            select(
                APIUsageLog.tenant_id,
                func.count(APIUsageLog.id),
                func.sum(APIUsageLog.tokens_input),
                func.sum(APIUsageLog.tokens_output),
            )
            .where(and_(base_filter, APIUsageLog.tenant_id.isnot(None)))
            .group_by(APIUsageLog.tenant_id)
            .order_by(desc(func.count(APIUsageLog.id)))
            .limit(10)
        )

        result = await self.db.execute(query)

        stats = {}
        for row in result.fetchall():
            tenant_id = row[0]
            if tenant_id:
                stats[tenant_id] = {
                    "count": row[1] or 0,
                    "tokens_input": row[2] or 0,
                    "tokens_output": row[3] or 0,
                }

        return stats

    async def _get_daily_trend(
        self,
        start_time: datetime,
        end_time: datetime,
    ) -> List[Dict]:
        """获取每日趋势"""
        current = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
        end = end_time.replace(hour=23, minute=59, second=59, microsecond=999999)

        trend = []
        while current <= end:
            next_day = current + timedelta(days=1)

            # 查询当天统计
            stats_query = select(
                func.count(APIUsageLog.id),
                func.sum(APIUsageLog.tokens_input),
                func.sum(APIUsageLog.tokens_output),
            ).where(
                and_(
                    APIUsageLog.timestamp >= current,
                    APIUsageLog.timestamp < next_day
                )
            )
            stats_result = await self.db.execute(stats_query)
            row = stats_result.fetchone()

            trend.append({
                "date": current.strftime("%Y-%m-%d"),
                "requests": row[0] or 0,
                "tokens_input": row[1] or 0,
                "tokens_output": row[2] or 0,
            })

            current = next_day

        return trend

    def _calculate_cost(
        self,
        api_type: str,
        operation: str,
        count: int,
        input_tokens: int,
        output_tokens: int,
    ) -> float:
        """计算成本"""
        pricing = API_PRICING.get(api_type, {}).get(operation, {})

        input_price = pricing.get("input", 0)
        output_price = pricing.get("output", 0)
        per_request = pricing.get("per_request", 0)

        cost = (
            (input_tokens / 1000) * input_price +
            (output_tokens / 1000) * output_price +
            count * per_request
        )

        return cost
