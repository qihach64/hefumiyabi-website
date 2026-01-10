"""
Ops Routes
运维管理 API 路由
"""

import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_session
from .auth import get_current_user, TokenData, require_ops_role
from .dependencies import get_service_container, ServiceContainer
from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
from ops.metrics_collector import MetricsCollector
from ops.tenant_manager import TenantManager
from ops.template_manager import TemplateManager, TemplateCreate, TemplateUpdate
from ops.knowledge_manager import KnowledgeManager, QAPairCreate, QAPairUpdate
from ops.import_export_service import ImportExportService, ExportFilter
from ops.log_manager import LogManager, LogFilter
from ops.alert_service import AlertService, AlertFilter, AlertSeverity
from ops.api_usage_tracker import APIUsageTracker, UsageFilter
from ops.config_manager import ConfigManager, ConfigCategory
from ops.ops_auth import get_ops_auth_service, verify_ops_session, OpsSession
from learning.scheduler import get_scheduler


# 允许的运维页面白名单
ALLOWED_OPS_PAGES = {
    'index', 'dashboard', 'tenants', 'templates',
    'knowledge', 'logs', 'alerts', 'config'
}


# ========== 日志记录辅助函数 ==========

async def log_operation(
    db: AsyncSession,
    action: str,
    target_type: str = None,
    target_id: str = None,
    username: str = None,
    details: dict = None,
    ip_address: str = None,
    success: bool = True,
    error_message: str = None,
):
    """记录运维操作日志"""
    try:
        log_manager = LogManager(db)
        await log_manager.record_log(
            action=action,
            target_type=target_type,
            target_id=target_id,
            username=username,
            details=details,
            ip_address=ip_address,
            success=success,
            error_message=error_message,
        )
    except Exception as e:
        print(f"[WARNING] 日志记录失败: {e}")


# ========== 路由器定义 ==========

ops_router = APIRouter(prefix="/ops", tags=["运维管理"])


# ========== 响应模型 ==========

class ComponentStatusResponse(BaseModel):
    """组件状态响应"""
    name: str
    status: str
    latency_ms: float
    last_check: str
    message: Optional[str] = None


class DashboardOverviewResponse(BaseModel):
    """仪表盘概览响应"""
    # 商家统计
    total_tenants: int = 0
    active_tenants: int = 0
    suspended_tenants: int = 0

    # 用户统计
    total_users: int = 0
    active_users: int = 0

    # 对话统计
    conversations_today: int = 0
    conversations_week: int = 0
    conversations_month: int = 0

    # 知识库统计
    total_qa_pairs: int = 0
    synced_qa_pairs: int = 0
    unsynced_qa_pairs: int = 0
    template_qa_pairs: int = 0

    # 反馈统计
    pending_feedbacks: int = 0
    total_feedbacks: int = 0

    # 系统状态
    uptime_seconds: int = 0
    collected_at: str = ""


class TrendDataPointResponse(BaseModel):
    """趋势数据点"""
    date: str
    conversations: int = 0
    feedbacks: int = 0
    qa_pairs_created: int = 0


class TenantActivityResponse(BaseModel):
    """商家活跃度"""
    tenant_id: str
    tenant_name: str
    conversations_count: int
    last_active: Optional[str] = None


class SystemStatusResponse(BaseModel):
    """系统状态响应"""
    status: str
    version: str
    uptime_seconds: int
    components: List[ComponentStatusResponse]
    scheduler_status: Dict[str, Any]


# ========== 认证相关模型 ==========

class OpsLoginRequest(BaseModel):
    """运维登录请求"""
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class OpsLoginResponse(BaseModel):
    """运维登录响应"""
    success: bool
    token: Optional[str] = None
    username: Optional[str] = None
    expires_in: Optional[int] = None
    message: Optional[str] = None


class OpsSessionResponse(BaseModel):
    """运维会话信息"""
    username: str
    created_at: str
    last_active: str
    ip_address: Optional[str] = None
    expires_in: int


# ========== 认证 API ==========

@ops_router.post(
    "/auth/login",
    response_model=OpsLoginResponse,
    summary="运维登录",
    description="运维人员登录获取会话令牌",
)
async def ops_login(
    request: OpsLoginRequest,
    http_request: Request,
):
    """运维登录"""
    auth_service = get_ops_auth_service()

    try:
        result = auth_service.login(
            username=request.username,
            password=request.password,
            request=http_request,
        )

        if not result:
            return OpsLoginResponse(
                success=False,
                message="用户名或密码错误",
            )

        return OpsLoginResponse(
            success=True,
            token=result["token"],
            username=result["username"],
            expires_in=result["expires_in"],
            message="登录成功",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")


@ops_router.post(
    "/auth/logout",
    summary="运维登出",
    description="登出当前会话",
)
async def ops_logout(
    session: OpsSession = Depends(verify_ops_session),
):
    """运维登出"""
    auth_service = get_ops_auth_service()
    auth_service.logout(session.token)
    return {"success": True, "message": "已登出"}


@ops_router.get(
    "/auth/status",
    response_model=OpsSessionResponse,
    summary="检查会话状态",
    description="检查当前会话是否有效",
)
async def ops_auth_status(
    session: OpsSession = Depends(verify_ops_session),
):
    """检查会话状态"""
    auth_service = get_ops_auth_service()
    info = auth_service.get_session_info(session.token)

    if not info:
        raise HTTPException(status_code=401, detail="会话已过期")

    return OpsSessionResponse(
        username=info["username"],
        created_at=info["created_at"],
        last_active=info["last_active"],
        ip_address=info.get("ip_address"),
        expires_in=info["expires_in"],
    )


# ========== 仪表盘 API ==========

@ops_router.get(
    "/dashboard/overview",
    response_model=DashboardOverviewResponse,
    summary="获取仪表盘概览",
    description="获取系统运维仪表盘的全局概览数据",
)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db_session),
    # current_user: TokenData = Depends(require_ops_role),  # 暂时注释，方便调试
):
    """获取仪表盘概览数据"""
    try:
        collector = MetricsCollector(db)
        overview = await collector.collect_overview()

        return DashboardOverviewResponse(
            total_tenants=overview.total_tenants,
            active_tenants=overview.active_tenants,
            suspended_tenants=overview.suspended_tenants,
            total_users=overview.total_users,
            active_users=overview.active_users,
            conversations_today=overview.conversations_today,
            conversations_week=overview.conversations_week,
            conversations_month=overview.conversations_month,
            total_qa_pairs=overview.total_qa_pairs,
            synced_qa_pairs=overview.synced_qa_pairs,
            unsynced_qa_pairs=overview.unsynced_qa_pairs,
            template_qa_pairs=overview.template_qa_pairs,
            pending_feedbacks=overview.pending_feedbacks,
            total_feedbacks=overview.total_feedbacks,
            uptime_seconds=overview.uptime_seconds,
            collected_at=overview.collected_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取概览数据失败: {str(e)}")


@ops_router.get(
    "/dashboard/trends",
    response_model=List[TrendDataPointResponse],
    summary="获取趋势数据",
    description="获取最近 N 天的趋势数据",
)
async def get_dashboard_trends(
    days: int = 7,
    db: AsyncSession = Depends(get_db_session),
):
    """获取趋势数据"""
    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="days 参数必须在 1-90 之间")

    try:
        collector = MetricsCollector(db)
        trends = await collector.collect_trends(days)

        return [
            TrendDataPointResponse(
                date=t.date,
                conversations=t.conversations,
                feedbacks=t.feedbacks,
                qa_pairs_created=t.qa_pairs_created,
            )
            for t in trends
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取趋势数据失败: {str(e)}")


@ops_router.get(
    "/dashboard/top-tenants",
    response_model=List[TenantActivityResponse],
    summary="获取活跃商家 TOP N",
    description="获取今日最活跃的商家列表",
)
async def get_top_active_tenants(
    limit: int = 5,
    db: AsyncSession = Depends(get_db_session),
):
    """获取最活跃的商家"""
    if limit < 1 or limit > 20:
        raise HTTPException(status_code=400, detail="limit 参数必须在 1-20 之间")

    try:
        collector = MetricsCollector(db)
        activities = await collector.get_top_active_tenants(limit)

        return [
            TenantActivityResponse(
                tenant_id=a.tenant_id,
                tenant_name=a.tenant_name,
                conversations_count=a.conversations_count,
                last_active=a.last_active.isoformat() if a.last_active else None,
            )
            for a in activities
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取活跃商家失败: {str(e)}")


# ========== 系统状态 API ==========

@ops_router.get(
    "/system/status",
    response_model=SystemStatusResponse,
    summary="获取系统状态",
    description="获取系统整体状态和各组件健康状况",
)
async def get_system_status(
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
):
    """获取系统状态"""
    try:
        # 获取调度器状态
        scheduler = get_scheduler()
        scheduler_status = {}
        scheduler_running = False

        if scheduler:
            try:
                status = scheduler.get_status()  # 同步方法，无需 await
                scheduler_status = {
                    "is_running": status.get("is_running", False),
                    "processed_count": status.get("stats", {}).get("processed_count", 0),
                    "synced_count": status.get("stats", {}).get("synced_count", 0),
                    "last_run": status.get("stats", {}).get("last_process_time"),
                }
                scheduler_running = status.get("is_running", False)
            except Exception:
                scheduler_status = {"error": "无法获取调度器状态"}

        # 获取组件健康状态
        components_health = container.is_healthy()

        collector = MetricsCollector(db)
        # 注意: knowledge_base 内部包含了 Pinecone vector store
        components = await collector.check_component_health(
            db_healthy=True,  # 数据库由 SQLAlchemy 管理，能运行到这里说明正常
            pinecone_healthy=components_health.get("knowledge_base") == "healthy",
            pinecone_latency=0,  # TODO: 实际测量
            llm_healthy=components_health.get("llm") == "healthy",
            llm_latency=0,  # TODO: 实际测量
            scheduler_running=scheduler_running,
        )

        # 计算整体状态
        all_healthy = all(c.status == "healthy" for c in components)
        any_unhealthy = any(c.status == "unhealthy" for c in components)

        if any_unhealthy:
            overall_status = "unhealthy"
        elif all_healthy:
            overall_status = "healthy"
        else:
            overall_status = "degraded"

        # 计算运行时间
        overview = await collector.collect_overview()

        return SystemStatusResponse(
            status=overall_status,
            version="1.0.0",
            uptime_seconds=overview.uptime_seconds,
            components=[
                ComponentStatusResponse(
                    name=c.name,
                    status=c.status,
                    latency_ms=c.latency_ms,
                    last_check=c.last_check.isoformat(),
                    message=c.message,
                )
                for c in components
            ],
            scheduler_status=scheduler_status,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取系统状态失败: {str(e)}")


@ops_router.get(
    "/system/components",
    response_model=List[ComponentStatusResponse],
    summary="获取组件健康状态",
    description="获取各组件的健康状态详情",
)
async def get_component_health(
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
):
    """获取组件健康状态"""
    try:
        components_health = container.is_healthy()

        scheduler = get_scheduler()
        scheduler_running = False
        if scheduler:
            try:
                status = scheduler.get_status()  # 同步方法，无需 await
                scheduler_running = status.get("is_running", False)
            except Exception:
                pass

        collector = MetricsCollector(db)
        components = await collector.check_component_health(
            db_healthy=True,  # 数据库由 SQLAlchemy 管理，能运行到这里说明正常
            pinecone_healthy=components_health.get("knowledge_base") == "healthy",
            pinecone_latency=0,
            llm_healthy=components_health.get("llm") == "healthy",
            llm_latency=0,
            scheduler_running=scheduler_running,
        )

        return [
            ComponentStatusResponse(
                name=c.name,
                status=c.status,
                latency_ms=c.latency_ms,
                last_check=c.last_check.isoformat(),
                message=c.message,
            )
            for c in components
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取组件状态失败: {str(e)}")


# ========== 商家管理响应模型 ==========

class TenantListItemResponse(BaseModel):
    """商家列表项"""
    id: str
    name: str
    namespace: str
    status: str
    user_count: int = 0
    qa_pair_count: int = 0
    conversations_today: int = 0
    last_active_at: Optional[str] = None
    created_at: Optional[str] = None


class TenantListResponse(BaseModel):
    """商家列表响应"""
    items: List[TenantListItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TenantStatsResponse(BaseModel):
    """商家统计响应"""
    total_users: int = 0
    admin_count: int = 0
    staff_count: int = 0
    total_qa_pairs: int = 0
    synced_qa_pairs: int = 0
    unsynced_qa_pairs: int = 0
    conversations_today: int = 0
    conversations_week: int = 0
    conversations_month: int = 0
    total_feedbacks: int = 0
    pending_feedbacks: int = 0
    approved_feedbacks: int = 0
    rejected_feedbacks: int = 0


class TenantDetailResponse(BaseModel):
    """商家详情响应"""
    id: str
    name: str
    namespace: str
    status: str
    settings: Dict[str, Any] = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    stats: Optional[TenantStatsResponse] = None


class TenantStatusRequest(BaseModel):
    """商家状态更新请求"""
    reason: Optional[str] = None


class TenantDeletePreviewResponse(BaseModel):
    """商家删除预览响应"""
    tenant_id: str
    tenant_name: str
    namespace: str
    user_count: int = 0
    qa_pair_count: int = 0
    conversation_count: int = 0
    feedback_count: int = 0
    vector_count: int = 0


class TenantDeleteRequest(BaseModel):
    """商家删除请求"""
    confirm_name: str = Field(..., description="输入商家名称确认删除")


class TenantDeleteResponse(BaseModel):
    """商家删除响应"""
    success: bool
    tenant_id: str
    tenant_name: str
    deleted_users: int = 0
    deleted_qa_pairs: int = 0
    deleted_conversations: int = 0
    deleted_feedbacks: int = 0
    deleted_vectors: int = 0
    error: Optional[str] = None


# ========== 模板管理响应模型 ==========

class TemplateResponse(BaseModel):
    """模板响应"""
    id: int
    question: str
    answer: str
    category: Optional[str] = None
    keywords: List[str] = []
    priority: int = 0
    status: str = "active"
    is_synced: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TemplateListResponse(BaseModel):
    """模板列表响应"""
    items: List[TemplateResponse]
    total: int
    page: int
    page_size: int


class TemplateCreateRequest(BaseModel):
    """创建模板请求"""
    question: str = Field(..., min_length=1, max_length=500)
    answer: str = Field(..., min_length=1, max_length=5000)
    category: Optional[str] = Field(None, max_length=50)
    keywords: List[str] = Field(default_factory=list)
    priority: int = Field(0, ge=0, le=100)


class TemplateUpdateRequest(BaseModel):
    """更新模板请求"""
    question: Optional[str] = Field(None, min_length=1, max_length=500)
    answer: Optional[str] = Field(None, min_length=1, max_length=5000)
    category: Optional[str] = Field(None, max_length=50)
    keywords: Optional[List[str]] = None
    priority: Optional[int] = Field(None, ge=0, le=100)


class DistributeRequest(BaseModel):
    """分发请求"""
    template_ids: List[int] = Field(..., min_items=1)
    tenant_ids: Optional[List[str]] = None  # None 表示分发给所有商家


class DistributeResponse(BaseModel):
    """分发响应"""
    success_count: int
    failed_count: int
    tenant_ids: List[str]
    errors: List[str] = []


# ========== 商家管理 API ==========

@ops_router.get(
    "/tenants",
    response_model=TenantListResponse,
    summary="获取商家列表",
    description="获取所有商家列表，支持分页和过滤",
)
async def list_tenants(
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db_session),
):
    """获取商家列表"""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    try:
        manager = TenantManager(db)
        result = await manager.list_tenants(
            status=status,
            keyword=keyword,
            page=page,
            page_size=page_size,
        )

        return TenantListResponse(
            items=[
                TenantListItemResponse(
                    id=item.id,
                    name=item.name,
                    namespace=item.namespace,
                    status=item.status,
                    user_count=item.user_count,
                    qa_pair_count=item.qa_pair_count,
                    conversations_today=item.conversations_today,
                    last_active_at=item.last_active_at.isoformat() if item.last_active_at else None,
                    created_at=item.created_at.isoformat() if item.created_at else None,
                )
                for item in result.items
            ],
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            total_pages=result.total_pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取商家列表失败: {str(e)}")


@ops_router.get(
    "/tenants/{tenant_id}",
    response_model=TenantDetailResponse,
    summary="获取商家详情",
    description="获取指定商家的详细信息",
)
async def get_tenant_detail(
    tenant_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """获取商家详情"""
    try:
        manager = TenantManager(db)
        detail = await manager.get_tenant_detail(tenant_id)

        if not detail:
            raise HTTPException(status_code=404, detail="商家不存在")

        stats_response = None
        if detail.stats:
            stats_response = TenantStatsResponse(
                total_users=detail.stats.total_users,
                admin_count=detail.stats.admin_count,
                staff_count=detail.stats.staff_count,
                total_qa_pairs=detail.stats.total_qa_pairs,
                synced_qa_pairs=detail.stats.synced_qa_pairs,
                unsynced_qa_pairs=detail.stats.unsynced_qa_pairs,
                conversations_today=detail.stats.conversations_today,
                conversations_week=detail.stats.conversations_week,
                conversations_month=detail.stats.conversations_month,
                total_feedbacks=detail.stats.total_feedbacks,
                pending_feedbacks=detail.stats.pending_feedbacks,
                approved_feedbacks=detail.stats.approved_feedbacks,
                rejected_feedbacks=detail.stats.rejected_feedbacks,
            )

        return TenantDetailResponse(
            id=detail.id,
            name=detail.name,
            namespace=detail.namespace,
            status=detail.status,
            settings=detail.settings,
            created_at=detail.created_at.isoformat() if detail.created_at else None,
            updated_at=detail.updated_at.isoformat() if detail.updated_at else None,
            stats=stats_response,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取商家详情失败: {str(e)}")


@ops_router.get(
    "/tenants/{tenant_id}/stats",
    response_model=TenantStatsResponse,
    summary="获取商家统计",
    description="获取指定商家的统计数据",
)
async def get_tenant_stats(
    tenant_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """获取商家统计"""
    try:
        manager = TenantManager(db)
        stats = await manager.get_tenant_stats(tenant_id)

        return TenantStatsResponse(
            total_users=stats.total_users,
            admin_count=stats.admin_count,
            staff_count=stats.staff_count,
            total_qa_pairs=stats.total_qa_pairs,
            synced_qa_pairs=stats.synced_qa_pairs,
            unsynced_qa_pairs=stats.unsynced_qa_pairs,
            conversations_today=stats.conversations_today,
            conversations_week=stats.conversations_week,
            conversations_month=stats.conversations_month,
            total_feedbacks=stats.total_feedbacks,
            pending_feedbacks=stats.pending_feedbacks,
            approved_feedbacks=stats.approved_feedbacks,
            rejected_feedbacks=stats.rejected_feedbacks,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取商家统计失败: {str(e)}")


@ops_router.post(
    "/tenants/{tenant_id}/suspend",
    summary="暂停商家",
    description="暂停指定商家的服务",
)
async def suspend_tenant(
    tenant_id: str,
    request: TenantStatusRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """暂停商家"""
    try:
        manager = TenantManager(db)
        success = await manager.suspend_tenant(tenant_id, request.reason)

        if not success:
            raise HTTPException(status_code=404, detail="商家不存在")

        # 记录操作日志
        await log_operation(
            db=db,
            action="suspend_tenant",
            target_type="tenant",
            target_id=tenant_id,
            username=session.username,
            details={"reason": request.reason},
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "message": "商家已暂停"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"暂停商家失败: {str(e)}")


@ops_router.post(
    "/tenants/{tenant_id}/activate",
    summary="激活商家",
    description="激活已暂停的商家",
)
async def activate_tenant(
    tenant_id: str,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """激活商家"""
    try:
        manager = TenantManager(db)
        success = await manager.activate_tenant(tenant_id)

        if not success:
            raise HTTPException(status_code=404, detail="商家不存在")

        # 记录操作日志
        await log_operation(
            db=db,
            action="activate_tenant",
            target_type="tenant",
            target_id=tenant_id,
            username=session.username,
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "message": "商家已激活"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"激活商家失败: {str(e)}")


@ops_router.get(
    "/tenants/{tenant_id}/delete-preview",
    response_model=TenantDeletePreviewResponse,
    summary="获取删除预览",
    description="获取商家删除前的数据统计预览，包括将被删除的用户、语料、对话、反馈、向量数据数量",
)
async def get_tenant_delete_preview(
    tenant_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """获取商家删除预览"""
    try:
        manager = TenantManager(db)
        stats = await manager.get_delete_stats(tenant_id)

        if stats is None:
            raise HTTPException(status_code=404, detail="商家不存在")

        return TenantDeletePreviewResponse(
            tenant_id=stats.tenant_id,
            tenant_name=stats.tenant_name,
            namespace=stats.namespace,
            user_count=stats.user_count,
            qa_pair_count=stats.qa_pair_count,
            conversation_count=stats.conversation_count,
            feedback_count=stats.feedback_count,
            vector_count=stats.vector_count,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取删除预览失败: {str(e)}")


@ops_router.delete(
    "/tenants/{tenant_id}",
    response_model=TenantDeleteResponse,
    summary="删除商家",
    description="删除商家及其所有数据（用户、语料、对话、反馈、向量），此操作不可逆",
)
async def delete_tenant(
    tenant_id: str,
    request: TenantDeleteRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
    session: OpsSession = Depends(verify_ops_session),
):
    """删除商家及所有数据"""
    try:
        # 获取 vector_store 用于删除向量数据
        vector_store = None
        if container.knowledge_base:
            vector_store = container.knowledge_base.vector_store

        manager = TenantManager(db)
        result = await manager.delete_tenant(tenant_id, request.confirm_name, vector_store=vector_store)

        if not result.success:
            # 记录失败日志
            await log_operation(
                db=db,
                action="delete_tenant",
                target_type="tenant",
                target_id=tenant_id,
                username=session.username,
                details={"confirm_name": request.confirm_name},
                ip_address=req.client.host if req.client else None,
                success=False,
                error_message=result.error,
            )
            if "不存在" in (result.error or ""):
                raise HTTPException(status_code=404, detail=result.error)
            elif "名称不匹配" in (result.error or ""):
                raise HTTPException(status_code=400, detail=result.error)
            else:
                raise HTTPException(status_code=500, detail=result.error or "删除失败")

        # 记录成功日志
        await log_operation(
            db=db,
            action="delete_tenant",
            target_type="tenant",
            target_id=tenant_id,
            username=session.username,
            details={
                "tenant_name": result.tenant_name,
                "deleted_users": result.deleted_users,
                "deleted_qa_pairs": result.deleted_qa_pairs,
                "deleted_conversations": result.deleted_conversations,
                "deleted_feedbacks": result.deleted_feedbacks,
                "deleted_vectors": result.deleted_vectors,
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return TenantDeleteResponse(
            success=result.success,
            tenant_id=result.tenant_id,
            tenant_name=result.tenant_name,
            deleted_users=result.deleted_users,
            deleted_qa_pairs=result.deleted_qa_pairs,
            deleted_conversations=result.deleted_conversations,
            deleted_feedbacks=result.deleted_feedbacks,
            deleted_vectors=result.deleted_vectors,
            error=result.error,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除商家失败: {str(e)}")


# ========== 模板管理 API ==========

@ops_router.get(
    "/templates",
    response_model=TemplateListResponse,
    summary="获取模板列表",
    description="获取通用模板列表，支持分页和分类过滤",
)
async def list_templates(
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db_session),
):
    """获取模板列表"""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    try:
        manager = TemplateManager(db)
        result = await manager.list_templates(
            category=category,
            keyword=keyword,
            page=page,
            page_size=page_size,
        )

        return TemplateListResponse(
            items=[
                TemplateResponse(
                    id=item.id,
                    question=item.question,
                    answer=item.answer,
                    category=item.category,
                    keywords=item.keywords.split(',') if item.keywords else [],
                    priority=item.priority,
                    status=item.status,
                    is_synced=item.is_synced,
                    created_at=item.created_at.isoformat() if item.created_at else None,
                    updated_at=item.updated_at.isoformat() if item.updated_at else None,
                )
                for item in result.items
            ],
            total=result.total,
            page=result.page,
            page_size=result.page_size,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模板列表失败: {str(e)}")


@ops_router.get(
    "/templates/categories",
    response_model=List[str],
    summary="获取模板分类",
    description="获取所有模板分类列表",
)
async def get_template_categories(
    db: AsyncSession = Depends(get_db_session),
):
    """获取模板分类"""
    try:
        manager = TemplateManager(db)
        return await manager.get_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模板分类失败: {str(e)}")


@ops_router.get(
    "/templates/{template_id}",
    response_model=TemplateResponse,
    summary="获取模板详情",
    description="获取指定模板的详细信息",
)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db_session),
):
    """获取模板详情"""
    try:
        manager = TemplateManager(db)
        template = await manager.get_template(template_id)

        if not template:
            raise HTTPException(status_code=404, detail="模板不存在")

        return TemplateResponse(
            id=template.id,
            question=template.question,
            answer=template.answer,
            category=template.category,
            keywords=template.keywords.split(',') if template.keywords else [],
            priority=template.priority,
            status=template.status,
            is_synced=template.is_synced,
            created_at=template.created_at.isoformat() if template.created_at else None,
            updated_at=template.updated_at.isoformat() if template.updated_at else None,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模板详情失败: {str(e)}")


@ops_router.post(
    "/templates",
    response_model=TemplateResponse,
    summary="创建模板",
    description="创建新的通用模板",
)
async def create_template(
    request: TemplateCreateRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """创建模板"""
    try:
        manager = TemplateManager(db)
        data = TemplateCreate(
            question=request.question,
            answer=request.answer,
            category=request.category,
            keywords=request.keywords,
            priority=request.priority,
        )
        template = await manager.create_template(data)

        # 记录操作日志
        await log_operation(
            db=db,
            action="create_template",
            target_type="template",
            target_id=str(template.id),
            username=session.username,
            details={"question": request.question[:50], "category": request.category},
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return TemplateResponse(
            id=template.id,
            question=template.question,
            answer=template.answer,
            category=template.category,
            keywords=template.keywords.split(',') if template.keywords else [],
            priority=template.priority,
            status=template.status,
            is_synced=template.is_synced,
            created_at=template.created_at.isoformat() if template.created_at else None,
            updated_at=template.updated_at.isoformat() if template.updated_at else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建模板失败: {str(e)}")


@ops_router.put(
    "/templates/{template_id}",
    response_model=TemplateResponse,
    summary="更新模板",
    description="更新指定模板的信息",
)
async def update_template(
    template_id: int,
    request: TemplateUpdateRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """更新模板"""
    try:
        manager = TemplateManager(db)
        data = TemplateUpdate(
            question=request.question,
            answer=request.answer,
            category=request.category,
            keywords=request.keywords,
            priority=request.priority,
        )
        template = await manager.update_template(template_id, data)

        if not template:
            raise HTTPException(status_code=404, detail="模板不存在")

        # 记录操作日志
        await log_operation(
            db=db,
            action="update_template",
            target_type="template",
            target_id=str(template_id),
            username=session.username,
            details={"category": request.category},
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return TemplateResponse(
            id=template.id,
            question=template.question,
            answer=template.answer,
            category=template.category,
            keywords=template.keywords.split(',') if template.keywords else [],
            priority=template.priority,
            status=template.status,
            is_synced=template.is_synced,
            created_at=template.created_at.isoformat() if template.created_at else None,
            updated_at=template.updated_at.isoformat() if template.updated_at else None,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新模板失败: {str(e)}")


@ops_router.delete(
    "/templates/{template_id}",
    summary="删除模板",
    description="删除指定模板（软删除）",
)
async def delete_template(
    template_id: int,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """删除模板"""
    try:
        manager = TemplateManager(db)
        success = await manager.delete_template(template_id)

        if not success:
            raise HTTPException(status_code=404, detail="模板不存在")

        # 记录操作日志
        await log_operation(
            db=db,
            action="delete_template",
            target_type="template",
            target_id=str(template_id),
            username=session.username,
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "message": "模板已删除"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除模板失败: {str(e)}")


@ops_router.post(
    "/templates/distribute",
    response_model=DistributeResponse,
    summary="分发模板",
    description="将模板分发到指定商家或所有商家",
)
async def distribute_templates(
    request: DistributeRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """分发模板"""
    try:
        manager = TemplateManager(db)

        if request.tenant_ids:
            # 分发到指定商家
            all_results = []
            for tenant_id in request.tenant_ids:
                result = await manager.distribute_to_tenant(
                    request.template_ids, tenant_id
                )
                all_results.append(result)

            # 合并结果
            total_success = sum(r.success_count for r in all_results)
            total_failed = sum(r.failed_count for r in all_results)
            all_errors = []
            for r in all_results:
                all_errors.extend(r.errors)

            # 记录操作日志
            await log_operation(
                db=db,
                action="distribute_templates",
                target_type="template",
                username=session.username,
                details={
                    "template_count": len(request.template_ids),
                    "tenant_count": len(request.tenant_ids),
                    "success_count": total_success,
                    "failed_count": total_failed,
                },
                ip_address=req.client.host if req.client else None,
                success=True,
            )

            return DistributeResponse(
                success_count=total_success,
                failed_count=total_failed,
                tenant_ids=request.tenant_ids,
                errors=all_errors,
            )
        else:
            # 分发到所有商家
            result = await manager.distribute_to_all(request.template_ids)

            # 记录操作日志
            await log_operation(
                db=db,
                action="distribute_templates",
                target_type="template",
                username=session.username,
                details={
                    "template_count": len(request.template_ids),
                    "to_all_tenants": True,
                    "success_count": result.success_count,
                    "failed_count": result.failed_count,
                },
                ip_address=req.client.host if req.client else None,
                success=True,
            )

            return DistributeResponse(
                success_count=result.success_count,
                failed_count=result.failed_count,
                tenant_ids=result.tenant_ids,
                errors=result.errors,
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分发模板失败: {str(e)}")


# ========== 知识库管理响应模型 ==========

class KnowledgeOverviewResponse(BaseModel):
    """知识库概览响应"""
    total_qa_pairs: int = 0
    by_tenant: Dict[str, int] = {}
    by_category: Dict[str, int] = {}
    by_source: Dict[str, int] = {}
    synced_count: int = 0
    unsynced_count: int = 0


class QAPairResponse(BaseModel):
    """QA 响应"""
    id: int
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    question: str
    answer: str
    category: Optional[str] = None
    keywords: List[str] = []
    source: Optional[str] = None
    priority: int = 0
    is_synced: bool = False
    status: str = "active"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class QAPairListResponse(BaseModel):
    """QA 列表响应"""
    items: List[QAPairResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class QAPairCreateRequest(BaseModel):
    """创建 QA 请求"""
    tenant_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1, max_length=500)
    answer: str = Field(..., min_length=1, max_length=5000)
    category: Optional[str] = Field(None, max_length=50)
    keywords: List[str] = Field(default_factory=list)
    priority: int = Field(0, ge=0, le=100)


class QAPairUpdateRequest(BaseModel):
    """更新 QA 请求"""
    question: Optional[str] = Field(None, min_length=1, max_length=500)
    answer: Optional[str] = Field(None, min_length=1, max_length=5000)
    category: Optional[str] = Field(None, max_length=50)
    keywords: Optional[List[str]] = None
    priority: Optional[int] = Field(None, ge=0, le=100)


class BulkOperationRequest(BaseModel):
    """批量操作请求"""
    qa_ids: List[int] = Field(..., min_items=1)
    operation: str = Field(..., pattern="^(delete|sync|update_category)$")
    category: Optional[str] = None  # 用于 update_category 操作


class BulkOperationResponse(BaseModel):
    """批量操作响应"""
    success_count: int
    failed_count: int
    errors: List[str] = []


class SyncStatusResponse(BaseModel):
    """同步状态响应"""
    is_running: bool
    last_sync_time: Optional[str] = None
    pending_count: int
    synced_count: int
    last_error: Optional[str] = None


class ImportResponse(BaseModel):
    """导入响应"""
    success_count: int = 0
    failed_count: int = 0
    skipped_count: int = 0
    errors: List[str] = []


class TenantOption(BaseModel):
    """商家选项"""
    id: str
    name: str


# ========== 知识库管理 API ==========

@ops_router.get(
    "/knowledge/overview",
    response_model=KnowledgeOverviewResponse,
    summary="获取知识库概览",
    description="获取全局知识库统计数据",
)
async def get_knowledge_overview(
    db: AsyncSession = Depends(get_db_session),
):
    """获取知识库概览"""
    try:
        manager = KnowledgeManager(db)
        overview = await manager.get_overview()

        return KnowledgeOverviewResponse(
            total_qa_pairs=overview.total_qa_pairs,
            by_tenant=overview.by_tenant,
            by_category=overview.by_category,
            by_source=overview.by_source,
            synced_count=overview.synced_count,
            unsynced_count=overview.unsynced_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取知识库概览失败: {str(e)}")


@ops_router.get(
    "/knowledge/qa-pairs",
    response_model=QAPairListResponse,
    summary="获取 QA 列表",
    description="获取所有商家的 QA 列表，支持筛选",
)
async def list_qa_pairs(
    tenant_id: Optional[str] = None,
    keyword: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    is_synced: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db_session),
):
    """获取 QA 列表"""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    try:
        manager = KnowledgeManager(db)
        result = await manager.list_qa_pairs(
            tenant_id=tenant_id,
            keyword=keyword,
            category=category,
            source=source,
            is_synced=is_synced,
            page=page,
            page_size=page_size,
        )

        return QAPairListResponse(
            items=[
                QAPairResponse(
                    id=item.id,
                    tenant_id=item.tenant_id,
                    tenant_name=item.tenant_name,
                    question=item.question,
                    answer=item.answer,
                    category=item.category,
                    keywords=item.keywords,
                    source=item.source,
                    priority=item.priority,
                    is_synced=item.is_synced,
                    status=item.status,
                    created_at=item.created_at.isoformat() if item.created_at else None,
                    updated_at=item.updated_at.isoformat() if item.updated_at else None,
                )
                for item in result.items
            ],
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            total_pages=result.total_pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取 QA 列表失败: {str(e)}")


@ops_router.get(
    "/knowledge/qa-pairs/{qa_id}",
    response_model=QAPairResponse,
    summary="获取 QA 详情",
    description="获取单个 QA 的详细信息",
)
async def get_qa_pair(
    qa_id: int,
    db: AsyncSession = Depends(get_db_session),
):
    """获取 QA 详情"""
    try:
        manager = KnowledgeManager(db)
        qa = await manager.get_qa_pair(qa_id)

        if not qa:
            raise HTTPException(status_code=404, detail="QA 不存在")

        return QAPairResponse(
            id=qa.id,
            tenant_id=qa.tenant_id,
            tenant_name=qa.tenant_name,
            question=qa.question,
            answer=qa.answer,
            category=qa.category,
            keywords=qa.keywords,
            source=qa.source,
            priority=qa.priority,
            is_synced=qa.is_synced,
            status=qa.status,
            created_at=qa.created_at.isoformat() if qa.created_at else None,
            updated_at=qa.updated_at.isoformat() if qa.updated_at else None,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取 QA 详情失败: {str(e)}")


@ops_router.post(
    "/knowledge/qa-pairs",
    response_model=QAPairResponse,
    summary="创建 QA",
    description="创建新的 QA 对",
)
async def create_qa_pair(
    request: QAPairCreateRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """创建 QA"""
    try:
        manager = KnowledgeManager(db)
        data = QAPairCreate(
            tenant_id=request.tenant_id,
            question=request.question,
            answer=request.answer,
            category=request.category,
            keywords=request.keywords,
            priority=request.priority,
        )
        qa = await manager.create_qa_pair(data)

        # 记录操作日志
        await log_operation(
            db=db,
            action="create_qa_pair",
            target_type="qa_pair",
            target_id=str(qa.id),
            username=session.username,
            details={
                "tenant_id": request.tenant_id,
                "question": request.question[:50] + "..." if len(request.question) > 50 else request.question,
                "category": request.category,
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return QAPairResponse(
            id=qa.id,
            tenant_id=qa.tenant_id,
            tenant_name=qa.tenant_name,
            question=qa.question,
            answer=qa.answer,
            category=qa.category,
            keywords=qa.keywords,
            source=qa.source,
            priority=qa.priority,
            is_synced=qa.is_synced,
            status=qa.status,
            created_at=qa.created_at.isoformat() if qa.created_at else None,
            updated_at=qa.updated_at.isoformat() if qa.updated_at else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建 QA 失败: {str(e)}")


@ops_router.put(
    "/knowledge/qa-pairs/{qa_id}",
    response_model=QAPairResponse,
    summary="更新 QA",
    description="更新指定 QA 的信息",
)
async def update_qa_pair(
    qa_id: int,
    request: QAPairUpdateRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """更新 QA"""
    try:
        manager = KnowledgeManager(db)
        data = QAPairUpdate(
            question=request.question,
            answer=request.answer,
            category=request.category,
            keywords=request.keywords,
            priority=request.priority,
        )
        qa = await manager.update_qa_pair(qa_id, data)

        if not qa:
            raise HTTPException(status_code=404, detail="QA 不存在")

        # 记录操作日志
        await log_operation(
            db=db,
            action="update_qa_pair",
            target_type="qa_pair",
            target_id=str(qa_id),
            username=session.username,
            details={
                "tenant_id": qa.tenant_id,
                "question": qa.question[:50] + "..." if len(qa.question) > 50 else qa.question,
                "category": qa.category,
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return QAPairResponse(
            id=qa.id,
            tenant_id=qa.tenant_id,
            tenant_name=qa.tenant_name,
            question=qa.question,
            answer=qa.answer,
            category=qa.category,
            keywords=qa.keywords,
            source=qa.source,
            priority=qa.priority,
            is_synced=qa.is_synced,
            status=qa.status,
            created_at=qa.created_at.isoformat() if qa.created_at else None,
            updated_at=qa.updated_at.isoformat() if qa.updated_at else None,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新 QA 失败: {str(e)}")


@ops_router.delete(
    "/knowledge/qa-pairs/{qa_id}",
    summary="删除 QA",
    description="删除指定 QA（软删除）",
)
async def delete_qa_pair(
    qa_id: int,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """删除 QA"""
    try:
        manager = KnowledgeManager(db)
        success = await manager.delete_qa_pair(qa_id)

        if not success:
            raise HTTPException(status_code=404, detail="QA 不存在")

        # 记录操作日志
        await log_operation(
            db=db,
            action="delete_qa_pair",
            target_type="qa_pair",
            target_id=str(qa_id),
            username=session.username,
            details={"qa_id": qa_id},
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "message": "QA 已删除"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除 QA 失败: {str(e)}")


@ops_router.post(
    "/knowledge/qa-pairs/bulk",
    response_model=BulkOperationResponse,
    summary="批量操作",
    description="批量删除、同步或修改分类",
)
async def bulk_operation(
    request: BulkOperationRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """批量操作"""
    try:
        manager = KnowledgeManager(db)

        if request.operation == "delete":
            result = await manager.bulk_delete(request.qa_ids)
        elif request.operation == "sync":
            result = await manager.bulk_sync(request.qa_ids)
        elif request.operation == "update_category":
            if not request.category:
                raise HTTPException(status_code=400, detail="修改分类需要提供 category 参数")
            result = await manager.bulk_update_category(request.qa_ids, request.category)
        else:
            raise HTTPException(status_code=400, detail="无效的操作类型")

        # 记录操作日志
        await log_operation(
            db=db,
            action=f"bulk_{request.operation}",
            target_type="qa_pair",
            target_id=None,
            username=session.username,
            details={
                "operation": request.operation,
                "qa_ids": request.qa_ids,
                "category": request.category,
                "success_count": result.success_count,
                "failed_count": result.failed_count,
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return BulkOperationResponse(
            success_count=result.success_count,
            failed_count=result.failed_count,
            errors=result.errors,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量操作失败: {str(e)}")


@ops_router.get(
    "/knowledge/sync/status",
    response_model=SyncStatusResponse,
    summary="获取同步状态",
    description="获取知识库同步状态",
)
async def get_sync_status(
    db: AsyncSession = Depends(get_db_session),
):
    """获取同步状态"""
    try:
        manager = KnowledgeManager(db)
        status = await manager.get_sync_status()

        # 获取调度器实际状态
        scheduler = get_scheduler()
        is_running = False
        last_sync_time = None

        if scheduler:
            try:
                scheduler_status = scheduler.get_status()  # 同步方法，无需 await
                is_running = scheduler_status.get("is_running", False)
                last_process_time = scheduler_status.get("stats", {}).get("last_process_time")
                if last_process_time:
                    last_sync_time = last_process_time
            except Exception:
                pass

        return SyncStatusResponse(
            is_running=is_running,
            last_sync_time=last_sync_time,
            pending_count=status.pending_count,
            synced_count=status.synced_count,
            last_error=status.last_error,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取同步状态失败: {str(e)}")


@ops_router.post(
    "/knowledge/sync",
    summary="触发同步",
    description="手动触发知识库同步",
)
async def trigger_sync(
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """触发同步"""
    try:
        scheduler = get_scheduler()
        if not scheduler:
            raise HTTPException(status_code=503, detail="调度器未初始化")

        # 触发立即处理
        await scheduler.process_pending()

        # 记录操作日志
        await log_operation(
            db=db,
            action="trigger_sync",
            target_type="knowledge",
            target_id=None,
            username=session.username,
            details={"action": "manual_sync_trigger"},
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "message": "同步任务已触发"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"触发同步失败: {str(e)}")


@ops_router.get(
    "/knowledge/categories",
    response_model=List[str],
    summary="获取分类列表",
    description="获取所有 QA 分类",
)
async def get_knowledge_categories(
    tenant_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
):
    """获取分类列表"""
    try:
        manager = KnowledgeManager(db)
        return await manager.get_categories(tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取分类列表失败: {str(e)}")


@ops_router.get(
    "/knowledge/sources",
    response_model=List[str],
    summary="获取来源列表",
    description="获取所有 QA 来源",
)
async def get_knowledge_sources(
    db: AsyncSession = Depends(get_db_session),
):
    """获取来源列表"""
    try:
        manager = KnowledgeManager(db)
        return await manager.get_sources()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取来源列表失败: {str(e)}")


@ops_router.get(
    "/knowledge/tenants",
    response_model=List[TenantOption],
    summary="获取商家选项",
    description="获取商家列表（用于下拉选择）",
)
async def get_knowledge_tenants(
    db: AsyncSession = Depends(get_db_session),
):
    """获取商家选项"""
    try:
        manager = KnowledgeManager(db)
        tenants = await manager.get_tenants_list()
        return [TenantOption(id=t["id"], name=t["name"]) for t in tenants]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取商家列表失败: {str(e)}")


@ops_router.post(
    "/knowledge/import",
    response_model=ImportResponse,
    summary="导入 QA",
    description="从 CSV 文件导入 QA",
)
async def import_qa_pairs(
    tenant_id: str,
    req: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """导入 QA"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="只支持 CSV 文件")

    try:
        content = await file.read()
        service = ImportExportService(db)
        result = await service.import_from_csv(content, tenant_id)

        # 记录操作日志
        await log_operation(
            db=db,
            action="import_qa_pairs",
            target_type="qa_pair",
            target_id=None,
            username=session.username,
            details={
                "tenant_id": tenant_id,
                "filename": file.filename,
                "success_count": result.success_count,
                "failed_count": result.failed_count,
                "skipped_count": result.skipped_count,
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return ImportResponse(
            success_count=result.success_count,
            failed_count=result.failed_count,
            skipped_count=result.skipped_count,
            errors=result.errors,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")


@ops_router.get(
    "/knowledge/export",
    summary="导出 QA",
    description="导出 QA 为 CSV 文件",
)
async def export_qa_pairs(
    tenant_id: Optional[str] = None,
    category: Optional[str] = None,
    is_synced: Optional[bool] = None,
    db: AsyncSession = Depends(get_db_session),
):
    """导出 QA"""
    try:
        service = ImportExportService(db)
        filter = ExportFilter(
            tenant_id=tenant_id,
            category=category,
            is_synced=is_synced,
        )
        csv_content = await service.export_to_csv(filter)

        filename = f"qa_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")


@ops_router.get(
    "/knowledge/import-template",
    summary="获取导入模板",
    description="下载 CSV 导入模板",
)
async def get_import_template(
    db: AsyncSession = Depends(get_db_session),
):
    """获取导入模板"""
    try:
        service = ImportExportService(db)
        csv_content = await service.get_import_template()

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=qa_import_template.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模板失败: {str(e)}")


# ========== 日志管理响应模型 ==========

class LogItemResponse(BaseModel):
    """日志项响应"""
    id: int
    timestamp: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None


class LogListResponse(BaseModel):
    """日志列表响应"""
    items: List[LogItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class LogStatsResponse(BaseModel):
    """日志统计响应"""
    total_logs: int = 0
    by_action: Dict[str, int] = {}
    by_target_type: Dict[str, int] = {}
    by_user: Dict[str, int] = {}
    success_count: int = 0
    failed_count: int = 0
    recent_trend: List[Dict[str, Any]] = []


# ========== 告警管理响应模型 ==========

class AlertItemResponse(BaseModel):
    """告警项响应"""
    id: int
    created_at: str
    alert_type: str
    severity: str
    title: str
    message: Optional[str] = None
    source: Optional[str] = None
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_note: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class AlertListResponse(BaseModel):
    """告警列表响应"""
    items: List[AlertItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AlertStatsResponse(BaseModel):
    """告警统计响应"""
    active_count: int = 0
    acknowledged_count: int = 0
    resolved_count: int = 0
    by_severity: Dict[str, int] = {}
    by_type: Dict[str, int] = {}
    recent_trend: List[Dict[str, Any]] = []


class AlertActionRequest(BaseModel):
    """告警操作请求"""
    note: Optional[str] = None


class AlertBulkRequest(BaseModel):
    """告警批量操作请求"""
    alert_ids: List[int] = Field(..., min_items=1)
    note: Optional[str] = None


class CreateAlertRequest(BaseModel):
    """创建告警请求"""
    alert_type: str = Field(..., min_length=1, max_length=50)
    severity: str = Field(..., pattern="^(critical|error|warning|info)$")
    title: str = Field(..., min_length=1, max_length=255)
    message: Optional[str] = None
    source: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


# ========== API 使用统计响应模型 ==========

class UsageRecordResponse(BaseModel):
    """使用记录响应"""
    id: int
    timestamp: str
    api_type: str
    operation: str
    tenant_id: Optional[str] = None
    tokens_input: int = 0
    tokens_output: int = 0
    latency_ms: Optional[int] = None
    success: bool = True
    error_code: Optional[str] = None


class UsageListResponse(BaseModel):
    """使用记录列表响应"""
    items: List[UsageRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class UsageStatsResponse(BaseModel):
    """使用统计响应"""
    total_requests: int = 0
    total_tokens_input: int = 0
    total_tokens_output: int = 0
    success_rate: float = 0.0
    avg_latency_ms: float = 0.0
    by_api_type: Dict[str, Dict[str, Any]] = {}
    by_operation: Dict[str, Dict[str, Any]] = {}
    by_tenant: Dict[str, Dict[str, Any]] = {}
    daily_trend: List[Dict[str, Any]] = []


class CostEstimateResponse(BaseModel):
    """成本估算响应"""
    total_cost: float = 0.0
    by_api_type: Dict[str, float] = {}
    by_operation: Dict[str, float] = {}
    by_tenant: Dict[str, float] = {}
    currency: str = "CNY"


# ========== 日志管理 API ==========

@ops_router.get(
    "/logs/query",
    response_model=LogListResponse,
    summary="查询日志",
    description="查询运维操作日志",
)
async def query_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    success: Optional[bool] = None,
    keyword: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db_session),
):
    """查询日志"""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 50

    try:
        # 解析时间参数
        start_dt = None
        end_dt = None
        if start_time:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))

        log_filter = LogFilter(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            success=success,
            start_time=start_dt,
            end_time=end_dt,
            keyword=keyword,
        )

        manager = LogManager(db)
        result = await manager.query_logs(log_filter, page, page_size)

        return LogListResponse(
            items=[
                LogItemResponse(
                    id=item.id,
                    timestamp=item.timestamp.isoformat() if item.timestamp else "",
                    user_id=item.user_id,
                    username=item.username,
                    action=item.action,
                    target_type=item.target_type,
                    target_id=item.target_id,
                    details=item.details,
                    ip_address=item.ip_address,
                    success=item.success,
                    error_message=item.error_message,
                )
                for item in result.items
            ],
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            total_pages=result.total_pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询日志失败: {str(e)}")


@ops_router.get(
    "/logs/stats",
    response_model=LogStatsResponse,
    summary="获取日志统计",
    description="获取日志统计数据",
)
async def get_log_stats(
    days: int = 7,
    db: AsyncSession = Depends(get_db_session),
):
    """获取日志统计"""
    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="days 参数必须在 1-90 之间")

    try:
        manager = LogManager(db)
        stats = await manager.get_log_stats(days=days)

        return LogStatsResponse(
            total_logs=stats.total_logs,
            by_action=stats.by_action,
            by_target_type=stats.by_target_type,
            by_user=stats.by_user,
            success_count=stats.success_count,
            failed_count=stats.failed_count,
            recent_trend=stats.recent_trend,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取日志统计失败: {str(e)}")


@ops_router.get(
    "/logs/actions",
    response_model=List[str],
    summary="获取操作类型",
    description="获取所有操作类型列表",
)
async def get_log_actions(
    db: AsyncSession = Depends(get_db_session),
):
    """获取操作类型"""
    try:
        manager = LogManager(db)
        return await manager.get_actions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取操作类型失败: {str(e)}")


@ops_router.get(
    "/logs/target-types",
    response_model=List[str],
    summary="获取目标类型",
    description="获取所有目标类型列表",
)
async def get_log_target_types(
    db: AsyncSession = Depends(get_db_session),
):
    """获取目标类型"""
    try:
        manager = LogManager(db)
        return await manager.get_target_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取目标类型失败: {str(e)}")


@ops_router.get(
    "/logs/users",
    response_model=List[Dict[str, str]],
    summary="获取用户列表",
    description="获取有日志记录的用户列表",
)
async def get_log_users(
    db: AsyncSession = Depends(get_db_session),
):
    """获取用户列表"""
    try:
        manager = LogManager(db)
        return await manager.get_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户列表失败: {str(e)}")


# ========== 告警管理 API ==========

@ops_router.get(
    "/alerts/active",
    response_model=List[AlertItemResponse],
    summary="获取活跃告警",
    description="获取所有活跃和已确认的告警",
)
async def get_active_alerts(
    db: AsyncSession = Depends(get_db_session),
):
    """获取活跃告警"""
    try:
        service = AlertService(db)
        alerts = await service.get_active_alerts()

        return [
            AlertItemResponse(
                id=a.id,
                created_at=a.created_at.isoformat() if a.created_at else "",
                alert_type=a.alert_type,
                severity=a.severity,
                title=a.title,
                message=a.message,
                source=a.source,
                status=a.status,
                acknowledged_by=a.acknowledged_by,
                acknowledged_at=a.acknowledged_at.isoformat() if a.acknowledged_at else None,
                resolved_at=a.resolved_at.isoformat() if a.resolved_at else None,
                resolved_by=a.resolved_by,
                resolution_note=a.resolution_note,
                extra_data=a.extra_data,
            )
            for a in alerts
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取活跃告警失败: {str(e)}")


@ops_router.get(
    "/alerts/history",
    response_model=AlertListResponse,
    summary="获取告警历史",
    description="获取告警历史记录",
)
async def get_alert_history(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    source: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db_session),
):
    """获取告警历史"""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 50

    try:
        # 解析时间参数
        start_dt = None
        end_dt = None
        if start_time:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))

        alert_filter = AlertFilter(
            status=status,
            severity=severity,
            alert_type=alert_type,
            source=source,
            start_time=start_dt,
            end_time=end_dt,
        )

        service = AlertService(db)
        result = await service.get_alerts(alert_filter, page, page_size)

        return AlertListResponse(
            items=[
                AlertItemResponse(
                    id=a.id,
                    created_at=a.created_at.isoformat() if a.created_at else "",
                    alert_type=a.alert_type,
                    severity=a.severity,
                    title=a.title,
                    message=a.message,
                    source=a.source,
                    status=a.status,
                    acknowledged_by=a.acknowledged_by,
                    acknowledged_at=a.acknowledged_at.isoformat() if a.acknowledged_at else None,
                    resolved_at=a.resolved_at.isoformat() if a.resolved_at else None,
                    resolved_by=a.resolved_by,
                    resolution_note=a.resolution_note,
                    extra_data=a.extra_data,
                )
                for a in result.items
            ],
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            total_pages=result.total_pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取告警历史失败: {str(e)}")


@ops_router.get(
    "/alerts/stats",
    response_model=AlertStatsResponse,
    summary="获取告警统计",
    description="获取告警统计数据",
)
async def get_alert_stats(
    days: int = 7,
    db: AsyncSession = Depends(get_db_session),
):
    """获取告警统计"""
    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="days 参数必须在 1-90 之间")

    try:
        service = AlertService(db)
        stats = await service.get_alert_stats(days)

        return AlertStatsResponse(
            active_count=stats.active_count,
            acknowledged_count=stats.acknowledged_count,
            resolved_count=stats.resolved_count,
            by_severity=stats.by_severity,
            by_type=stats.by_type,
            recent_trend=stats.recent_trend,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取告警统计失败: {str(e)}")


@ops_router.post(
    "/alerts",
    response_model=AlertItemResponse,
    summary="创建告警",
    description="手动创建告警",
)
async def create_alert(
    request: CreateAlertRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """创建告警"""
    try:
        service = AlertService(db)
        alert = await service.create_alert(
            alert_type=request.alert_type,
            severity=request.severity,
            title=request.title,
            message=request.message,
            source=request.source,
            extra_data=request.extra_data,
        )

        # 记录操作日志
        await log_operation(
            db=db,
            action="create_alert",
            target_type="alert",
            target_id=str(alert.id),
            username=session.username,
            details={
                "alert_type": request.alert_type,
                "severity": request.severity,
                "title": request.title,
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return AlertItemResponse(
            id=alert.id,
            created_at=alert.created_at.isoformat() if alert.created_at else "",
            alert_type=alert.alert_type,
            severity=alert.severity,
            title=alert.title,
            message=alert.message,
            source=alert.source,
            status=alert.status,
            acknowledged_by=alert.acknowledged_by,
            acknowledged_at=alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            resolved_at=alert.resolved_at.isoformat() if alert.resolved_at else None,
            resolved_by=alert.resolved_by,
            resolution_note=alert.resolution_note,
            extra_data=alert.extra_data,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建告警失败: {str(e)}")


@ops_router.post(
    "/alerts/{alert_id}/acknowledge",
    summary="确认告警",
    description="确认指定告警",
)
async def acknowledge_alert(
    alert_id: int,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """确认告警"""
    try:
        service = AlertService(db)
        user_id = session.username
        alert = await service.acknowledge_alert(alert_id, user_id)

        if not alert:
            raise HTTPException(status_code=404, detail="告警不存在或状态不允许确认")

        # 记录操作日志
        await log_operation(
            db=db,
            action="acknowledge_alert",
            target_type="alert",
            target_id=str(alert_id),
            username=session.username,
            details={"alert_id": alert_id},
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "message": "告警已确认"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"确认告警失败: {str(e)}")


@ops_router.post(
    "/alerts/{alert_id}/resolve",
    summary="解决告警",
    description="解决指定告警",
)
async def resolve_alert(
    alert_id: int,
    request: AlertActionRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """解决告警"""
    try:
        service = AlertService(db)
        user_id = session.username
        alert = await service.resolve_alert(alert_id, user_id, request.note)

        if not alert:
            raise HTTPException(status_code=404, detail="告警不存在或状态不允许解决")

        # 记录操作日志
        await log_operation(
            db=db,
            action="resolve_alert",
            target_type="alert",
            target_id=str(alert_id),
            username=session.username,
            details={"alert_id": alert_id, "note": request.note},
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "message": "告警已解决"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"解决告警失败: {str(e)}")


@ops_router.post(
    "/alerts/bulk/acknowledge",
    summary="批量确认告警",
    description="批量确认多个告警",
)
async def bulk_acknowledge_alerts(
    request: AlertBulkRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """批量确认告警"""
    try:
        service = AlertService(db)
        user_id = session.username
        count = await service.bulk_acknowledge(request.alert_ids, user_id)

        # 记录操作日志
        await log_operation(
            db=db,
            action="bulk_acknowledge_alerts",
            target_type="alert",
            target_id=None,
            username=session.username,
            details={
                "alert_ids": request.alert_ids,
                "acknowledged_count": count,
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "acknowledged_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量确认失败: {str(e)}")


@ops_router.post(
    "/alerts/bulk/resolve",
    summary="批量解决告警",
    description="批量解决多个告警",
)
async def bulk_resolve_alerts(
    request: AlertBulkRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """批量解决告警"""
    try:
        service = AlertService(db)
        user_id = session.username
        count = await service.bulk_resolve(request.alert_ids, user_id, request.note)

        # 记录操作日志
        await log_operation(
            db=db,
            action="bulk_resolve_alerts",
            target_type="alert",
            target_id=None,
            username=session.username,
            details={
                "alert_ids": request.alert_ids,
                "resolved_count": count,
                "note": request.note,
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "resolved_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量解决失败: {str(e)}")


@ops_router.get(
    "/alerts/types",
    response_model=List[str],
    summary="获取告警类型",
    description="获取所有告警类型列表",
)
async def get_alert_types(
    db: AsyncSession = Depends(get_db_session),
):
    """获取告警类型"""
    try:
        service = AlertService(db)
        return await service.get_alert_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取告警类型失败: {str(e)}")


@ops_router.get(
    "/alerts/sources",
    response_model=List[str],
    summary="获取告警来源",
    description="获取所有告警来源列表",
)
async def get_alert_sources(
    db: AsyncSession = Depends(get_db_session),
):
    """获取告警来源"""
    try:
        service = AlertService(db)
        return await service.get_alert_sources()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取告警来源失败: {str(e)}")


# ========== API 使用统计 API ==========

@ops_router.get(
    "/api-usage/records",
    response_model=UsageListResponse,
    summary="查询使用记录",
    description="查询 API 使用记录",
)
async def query_api_usage_records(
    api_type: Optional[str] = None,
    operation: Optional[str] = None,
    tenant_id: Optional[str] = None,
    success: Optional[bool] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db_session),
):
    """查询使用记录"""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 50

    try:
        # 解析时间参数
        start_dt = None
        end_dt = None
        if start_time:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))

        usage_filter = UsageFilter(
            api_type=api_type,
            operation=operation,
            tenant_id=tenant_id,
            success=success,
            start_time=start_dt,
            end_time=end_dt,
        )

        tracker = APIUsageTracker(db)
        result = await tracker.get_usage_records(usage_filter, page, page_size)

        return UsageListResponse(
            items=[
                UsageRecordResponse(
                    id=item.id,
                    timestamp=item.timestamp.isoformat() if item.timestamp else "",
                    api_type=item.api_type,
                    operation=item.operation,
                    tenant_id=item.tenant_id,
                    tokens_input=item.tokens_input,
                    tokens_output=item.tokens_output,
                    latency_ms=item.latency_ms,
                    success=item.success,
                    error_code=item.error_code,
                )
                for item in result.items
            ],
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            total_pages=result.total_pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询使用记录失败: {str(e)}")


@ops_router.get(
    "/api-usage/stats",
    response_model=UsageStatsResponse,
    summary="获取使用统计",
    description="获取 API 使用统计数据",
)
async def get_api_usage_stats(
    days: int = 7,
    db: AsyncSession = Depends(get_db_session),
):
    """获取使用统计"""
    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="days 参数必须在 1-90 之间")

    try:
        tracker = APIUsageTracker(db)
        stats = await tracker.get_usage_stats(days=days)

        return UsageStatsResponse(
            total_requests=stats.total_requests,
            total_tokens_input=stats.total_tokens_input,
            total_tokens_output=stats.total_tokens_output,
            success_rate=stats.success_rate,
            avg_latency_ms=stats.avg_latency_ms,
            by_api_type=stats.by_api_type,
            by_operation=stats.by_operation,
            by_tenant=stats.by_tenant,
            daily_trend=stats.daily_trend,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取使用统计失败: {str(e)}")


@ops_router.get(
    "/api-usage/cost",
    response_model=CostEstimateResponse,
    summary="获取成本估算",
    description="获取 API 成本估算",
)
async def get_api_cost_estimate(
    days: int = 30,
    db: AsyncSession = Depends(get_db_session),
):
    """获取成本估算"""
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="days 参数必须在 1-365 之间")

    try:
        tracker = APIUsageTracker(db)
        cost = await tracker.estimate_cost(days=days)

        return CostEstimateResponse(
            total_cost=cost.total_cost,
            by_api_type=cost.by_api_type,
            by_operation=cost.by_operation,
            by_tenant=cost.by_tenant,
            currency=cost.currency,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取成本估算失败: {str(e)}")


@ops_router.get(
    "/api-usage/types",
    response_model=List[str],
    summary="获取 API 类型",
    description="获取所有 API 类型列表",
)
async def get_api_types(
    db: AsyncSession = Depends(get_db_session),
):
    """获取 API 类型"""
    try:
        tracker = APIUsageTracker(db)
        return await tracker.get_api_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取 API 类型失败: {str(e)}")


@ops_router.get(
    "/api-usage/operations",
    response_model=List[str],
    summary="获取操作类型",
    description="获取所有操作类型列表",
)
async def get_api_operations(
    api_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
):
    """获取操作类型"""
    try:
        tracker = APIUsageTracker(db)
        return await tracker.get_operations(api_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取操作类型失败: {str(e)}")


# ========== 配置管理响应模型 ==========

class ConfigItemResponse(BaseModel):
    """配置项响应"""
    category: str
    key: str
    value: Any
    description: Optional[str] = None
    is_sensitive: bool = False
    updated_at: Optional[str] = None


class ConfigCategoryResponse(BaseModel):
    """配置分类响应"""
    category: str
    name: str
    description: str
    items: List[ConfigItemResponse]


class ConfigCategoryInfoResponse(BaseModel):
    """配置分类信息响应"""
    category: str
    name: str
    description: str


class ConfigUpdateRequest(BaseModel):
    """配置更新请求"""
    updates: Dict[str, Any] = Field(..., description="要更新的配置项 {key: value}")


# ========== 配置管理 API ==========

@ops_router.get(
    "/config/categories",
    response_model=List[ConfigCategoryInfoResponse],
    summary="获取配置分类",
    description="获取所有配置分类列表",
)
async def get_config_categories(
    db: AsyncSession = Depends(get_db_session),
):
    """获取配置分类"""
    try:
        manager = ConfigManager(db)
        categories = await manager.get_categories()
        return [ConfigCategoryInfoResponse(**cat) for cat in categories]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取配置分类失败: {str(e)}")


@ops_router.get(
    "/config/{category}",
    response_model=ConfigCategoryResponse,
    summary="获取配置",
    description="获取指定分类的配置",
)
async def get_config(
    category: str,
    db: AsyncSession = Depends(get_db_session),
):
    """获取配置"""
    # 验证分类
    valid_categories = [c.value for c in ConfigCategory]
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"无效的配置分类，有效值: {valid_categories}")

    try:
        manager = ConfigManager(db)
        config = await manager.get_config(category)

        return ConfigCategoryResponse(
            category=config.category,
            name=config.name,
            description=config.description,
            items=[
                ConfigItemResponse(
                    category=item.category,
                    key=item.key,
                    value=item.value,
                    description=item.description,
                    is_sensitive=item.is_sensitive,
                    updated_at=item.updated_at.isoformat() if item.updated_at else None,
                )
                for item in config.items
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取配置失败: {str(e)}")


@ops_router.put(
    "/config/{category}",
    response_model=List[ConfigItemResponse],
    summary="更新配置",
    description="更新指定分类的配置",
)
async def update_config(
    category: str,
    request: ConfigUpdateRequest,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """更新配置"""
    # 验证分类
    valid_categories = [c.value for c in ConfigCategory]
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"无效的配置分类，有效值: {valid_categories}")

    try:
        manager = ConfigManager(db)
        updated = await manager.update_config(category, request.updates)

        # 记录操作日志
        await log_operation(
            db=db,
            action="update_config",
            target_type="config",
            target_id=category,
            username=session.username,
            details={
                "category": category,
                "updated_keys": list(request.updates.keys()),
            },
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return [
            ConfigItemResponse(
                category=item.category,
                key=item.key,
                value=item.value,
                description=item.description,
                is_sensitive=item.is_sensitive,
                updated_at=item.updated_at.isoformat() if item.updated_at else None,
            )
            for item in updated
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新配置失败: {str(e)}")


@ops_router.post(
    "/config/{category}/reset",
    summary="重置配置",
    description="重置指定分类的配置为默认值",
)
async def reset_config(
    category: str,
    req: Request,
    db: AsyncSession = Depends(get_db_session),
    session: OpsSession = Depends(verify_ops_session),
):
    """重置配置"""
    # 验证分类
    valid_categories = [c.value for c in ConfigCategory]
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"无效的配置分类，有效值: {valid_categories}")

    try:
        manager = ConfigManager(db)
        await manager.reset_config(category)

        # 记录操作日志
        await log_operation(
            db=db,
            action="reset_config",
            target_type="config",
            target_id=category,
            username=session.username,
            details={"category": category},
            ip_address=req.client.host if req.client else None,
            success=True,
        )

        return {"success": True, "message": f"配置分类 {category} 已重置为默认值"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"重置配置失败: {str(e)}")


# ========== 页面路由 ==========

@ops_router.get("/", include_in_schema=False)
async def ops_index():
    """运维中心首页"""
    static_dir = Path(__file__).parent.parent / "static" / "ops"
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return JSONResponse(
        status_code=404,
        content={"error": "运维页面不存在，请先部署前端文件"}
    )


@ops_router.get("/{page}.html", include_in_schema=False)
async def ops_page(page: str):
    """运维中心页面"""
    # 安全检查：验证页面名称只包含字母数字和下划线/连字符
    if not re.match(r'^[a-zA-Z0-9_-]+$', page):
        return JSONResponse(
            status_code=400,
            content={"error": "无效的页面名称"}
        )

    # 安全检查：白名单验证
    if page not in ALLOWED_OPS_PAGES:
        return JSONResponse(
            status_code=403,
            content={"error": "页面不允许访问"}
        )

    static_dir = Path(__file__).parent.parent / "static" / "ops"
    page_file = (static_dir / f"{page}.html").resolve()

    # 安全检查：确保文件在预期目录内（防止路径遍历）
    if not str(page_file).startswith(str(static_dir.resolve())):
        return JSONResponse(
            status_code=403,
            content={"error": "访问被拒绝"}
        )

    if page_file.exists():
        return FileResponse(str(page_file))
    return JSONResponse(
        status_code=404,
        content={"error": f"页面 {page}.html 不存在"}
    )
