"""
Tenant Manager
商家管理服务
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update, delete

from database.models import Tenant, User, Feedback, Conversation, QAPair


@dataclass
class TenantListItem:
    """商家列表项"""
    id: str
    name: str
    namespace: str
    status: str
    user_count: int = 0
    qa_pair_count: int = 0
    conversations_today: int = 0
    last_active_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


@dataclass
class TenantListResponse:
    """商家列表响应"""
    items: List[TenantListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


@dataclass
class TenantStats:
    """商家统计数据"""
    # 用户统计
    total_users: int = 0
    admin_count: int = 0
    staff_count: int = 0

    # 知识库统计
    total_qa_pairs: int = 0
    synced_qa_pairs: int = 0
    unsynced_qa_pairs: int = 0

    # 对话统计
    conversations_today: int = 0
    conversations_week: int = 0
    conversations_month: int = 0

    # 反馈统计
    total_feedbacks: int = 0
    pending_feedbacks: int = 0
    approved_feedbacks: int = 0
    rejected_feedbacks: int = 0


@dataclass
class TenantDetail:
    """商家详情"""
    id: str
    name: str
    namespace: str
    status: str
    settings: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    stats: Optional[TenantStats] = None


@dataclass
class TenantDeleteStats:
    """商家删除统计（删除前预览）"""
    tenant_id: str
    tenant_name: str
    namespace: str
    user_count: int = 0
    qa_pair_count: int = 0
    conversation_count: int = 0
    feedback_count: int = 0
    vector_count: int = 0


@dataclass
class TenantDeleteResult:
    """商家删除结果"""
    success: bool
    tenant_id: str
    tenant_name: str
    deleted_users: int = 0
    deleted_qa_pairs: int = 0
    deleted_conversations: int = 0
    deleted_feedbacks: int = 0
    deleted_vectors: int = 0
    error: Optional[str] = None


class TenantManager:
    """商家管理器"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def list_tenants(
        self,
        status: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> TenantListResponse:
        """获取商家列表"""
        # 基础查询
        query = select(Tenant)

        # 状态过滤
        if status:
            query = query.where(Tenant.status == status)

        # 关键词搜索
        if keyword:
            query = query.where(
                Tenant.name.ilike(f"%{keyword}%") |
                Tenant.id.ilike(f"%{keyword}%")
            )

        # 统计总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # 分页
        offset = (page - 1) * page_size
        query = query.order_by(Tenant.created_at.desc()).offset(offset).limit(page_size)

        # 执行查询
        result = await self.db.execute(query)
        tenants = result.scalars().all()

        # 获取今日起始时间
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # 构建列表项
        items = []
        for tenant in tenants:
            # 获取用户数
            user_count = await self._count_users(tenant.id)

            # 获取 QA 数
            qa_count = await self._count_qa_pairs(tenant.id)

            # 获取今日对话数
            conv_today = await self._count_conversations_since(tenant.id, today_start)

            # 获取最后活跃时间
            last_active = await self._get_last_active(tenant.id)

            items.append(TenantListItem(
                id=tenant.id,
                name=tenant.name,
                namespace=tenant.namespace,
                status=tenant.status,
                user_count=user_count,
                qa_pair_count=qa_count,
                conversations_today=conv_today,
                last_active_at=last_active,
                created_at=tenant.created_at,
            ))

        total_pages = (total + page_size - 1) // page_size

        return TenantListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_tenant_detail(self, tenant_id: str) -> Optional[TenantDetail]:
        """获取商家详情"""
        query = select(Tenant).where(Tenant.id == tenant_id)
        result = await self.db.execute(query)
        tenant = result.scalar_one_or_none()

        if not tenant:
            return None

        # 获取统计数据
        stats = await self.get_tenant_stats(tenant_id)

        return TenantDetail(
            id=tenant.id,
            name=tenant.name,
            namespace=tenant.namespace,
            status=tenant.status,
            settings=tenant.settings or {},
            created_at=tenant.created_at,
            updated_at=tenant.updated_at,
            stats=stats,
        )

    async def get_tenant_stats(self, tenant_id: str) -> TenantStats:
        """获取商家统计数据"""
        stats = TenantStats()

        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)

        # 用户统计
        stats.total_users = await self._count_users(tenant_id)
        stats.admin_count = await self._count_users_by_role(tenant_id, "tenant_admin")
        stats.staff_count = await self._count_users_by_role(tenant_id, "staff")

        # 知识库统计
        stats.total_qa_pairs = await self._count_qa_pairs(tenant_id)
        stats.synced_qa_pairs = await self._count_qa_pairs(tenant_id, synced=True)
        stats.unsynced_qa_pairs = stats.total_qa_pairs - stats.synced_qa_pairs

        # 对话统计
        stats.conversations_today = await self._count_conversations_since(tenant_id, today_start)
        stats.conversations_week = await self._count_conversations_since(tenant_id, week_start)
        stats.conversations_month = await self._count_conversations_since(tenant_id, month_start)

        # 反馈统计
        feedback_stats = await self._get_feedback_stats(tenant_id)
        stats.total_feedbacks = feedback_stats.get("total", 0)
        stats.pending_feedbacks = feedback_stats.get("pending", 0)
        stats.approved_feedbacks = feedback_stats.get("approved", 0)
        stats.rejected_feedbacks = feedback_stats.get("rejected", 0)

        return stats

    async def update_tenant_status(
        self,
        tenant_id: str,
        new_status: str,
        reason: Optional[str] = None,
    ) -> bool:
        """更新商家状态"""
        # 验证状态值
        if new_status not in ("active", "suspended"):
            raise ValueError(f"Invalid status: {new_status}")

        # 更新状态
        stmt = (
            update(Tenant)
            .where(Tenant.id == tenant_id)
            .values(
                status=new_status,
                updated_at=datetime.now(timezone.utc),
            )
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount > 0

    async def suspend_tenant(self, tenant_id: str, reason: Optional[str] = None) -> bool:
        """暂停商家"""
        return await self.update_tenant_status(tenant_id, "suspended", reason)

    async def activate_tenant(self, tenant_id: str) -> bool:
        """激活商家"""
        return await self.update_tenant_status(tenant_id, "active")

    # ========== 私有方法 ==========

    async def _count_users(self, tenant_id: str) -> int:
        """统计商家用户数"""
        try:
            query = select(func.count(User.id)).where(
                and_(User.tenant_id == tenant_id, User.is_active == True)
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _count_users_by_role(self, tenant_id: str, role: str) -> int:
        """统计商家指定角色用户数"""
        try:
            query = select(func.count(User.id)).where(
                and_(
                    User.tenant_id == tenant_id,
                    User.role == role,
                    User.is_active == True
                )
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _count_qa_pairs(self, tenant_id: str, synced: Optional[bool] = None) -> int:
        """统计商家 QA 对数"""
        try:
            conditions = [QAPair.tenant_id == tenant_id, QAPair.status == "active"]
            if synced is not None:
                conditions.append(QAPair.is_synced == synced)

            query = select(func.count(QAPair.id)).where(and_(*conditions))
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _count_conversations_since(self, tenant_id: str, since: datetime) -> int:
        """统计商家指定时间后的对话数"""
        try:
            query = select(func.count(Conversation.id)).where(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= since
                )
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _get_last_active(self, tenant_id: str) -> Optional[datetime]:
        """获取商家最后活跃时间"""
        try:
            query = (
                select(func.max(Conversation.updated_at))
                .where(Conversation.tenant_id == tenant_id)
            )
            result = await self.db.execute(query)
            return result.scalar()
        except Exception:
            return None

    async def _get_feedback_stats(self, tenant_id: str) -> Dict[str, int]:
        """获取商家反馈统计"""
        try:
            # 总数
            total_query = select(func.count(Feedback.id)).where(
                Feedback.tenant_id == tenant_id
            )
            total_result = await self.db.execute(total_query)
            total = total_result.scalar() or 0

            # 待处理
            pending_query = select(func.count(Feedback.id)).where(
                and_(Feedback.tenant_id == tenant_id, Feedback.status == "pending")
            )
            pending_result = await self.db.execute(pending_query)
            pending = pending_result.scalar() or 0

            # 已通过
            approved_query = select(func.count(Feedback.id)).where(
                and_(Feedback.tenant_id == tenant_id, Feedback.status == "approved")
            )
            approved_result = await self.db.execute(approved_query)
            approved = approved_result.scalar() or 0

            # 已拒绝
            rejected_query = select(func.count(Feedback.id)).where(
                and_(Feedback.tenant_id == tenant_id, Feedback.status == "rejected")
            )
            rejected_result = await self.db.execute(rejected_query)
            rejected = rejected_result.scalar() or 0

            return {
                "total": total,
                "pending": pending,
                "approved": approved,
                "rejected": rejected,
            }
        except Exception:
            return {"total": 0, "pending": 0, "approved": 0, "rejected": 0}

    async def _count_all_conversations(self, tenant_id: str) -> int:
        """统计商家所有对话数"""
        try:
            query = select(func.count(Conversation.id)).where(
                Conversation.tenant_id == tenant_id
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _count_all_feedbacks(self, tenant_id: str) -> int:
        """统计商家所有反馈数"""
        try:
            query = select(func.count(Feedback.id)).where(
                Feedback.tenant_id == tenant_id
            )
            result = await self.db.execute(query)
            return result.scalar() or 0
        except Exception:
            return 0

    # ========== 删除商家相关方法 ==========

    async def get_delete_stats(
        self,
        tenant_id: str,
        vector_store=None,
    ) -> Optional[TenantDeleteStats]:
        """
        获取商家删除统计（删除前预览）

        Args:
            tenant_id: 商家 ID
            vector_store: 向量存储管理器（用于获取向量数量）

        Returns:
            删除统计数据，如果商家不存在则返回 None
        """
        # 获取商家信息
        query = select(Tenant).where(Tenant.id == tenant_id)
        result = await self.db.execute(query)
        tenant = result.scalar_one_or_none()

        if not tenant:
            return None

        # 统计各项数据
        user_count = await self._count_users(tenant_id)
        qa_count = await self._count_qa_pairs(tenant_id)
        conversation_count = await self._count_all_conversations(tenant_id)
        feedback_count = await self._count_all_feedbacks(tenant_id)

        # 获取向量数量
        vector_count = 0
        if vector_store and tenant.namespace:
            try:
                vector_count = vector_store.get_namespace_vector_count(tenant.namespace)
            except Exception:
                pass

        return TenantDeleteStats(
            tenant_id=tenant.id,
            tenant_name=tenant.name,
            namespace=tenant.namespace,
            user_count=user_count,
            qa_pair_count=qa_count,
            conversation_count=conversation_count,
            feedback_count=feedback_count,
            vector_count=vector_count,
        )

    async def delete_tenant(
        self,
        tenant_id: str,
        confirm_name: str,
        vector_store=None,
    ) -> TenantDeleteResult:
        """
        删除商家及所有关联数据

        Args:
            tenant_id: 商家 ID
            confirm_name: 确认商家名称（必须与实际名称匹配）
            vector_store: 向量存储管理器（用于删除向量）

        Returns:
            删除结果
        """
        # 获取商家信息
        query = select(Tenant).where(Tenant.id == tenant_id)
        result = await self.db.execute(query)
        tenant = result.scalar_one_or_none()

        if not tenant:
            return TenantDeleteResult(
                success=False,
                tenant_id=tenant_id,
                tenant_name="",
                error="商家不存在",
            )

        tenant_name = tenant.name
        namespace = tenant.namespace

        # 验证商家名称
        if confirm_name != tenant_name:
            return TenantDeleteResult(
                success=False,
                tenant_id=tenant_id,
                tenant_name=tenant_name,
                error="商家名称不匹配，请输入正确的商家名称进行确认",
            )

        try:
            # 1. 删除 Pinecone 向量（先删，失败则终止）
            deleted_vectors = 0
            if vector_store and namespace:
                try:
                    vector_result = vector_store.delete_namespace(namespace)
                    if not vector_result.get("success"):
                        return TenantDeleteResult(
                            success=False,
                            tenant_id=tenant_id,
                            tenant_name=tenant_name,
                            error=f"删除向量失败: {vector_result.get('error')}",
                        )
                    deleted_vectors = vector_result.get("deleted_count", 0)
                except Exception as e:
                    return TenantDeleteResult(
                        success=False,
                        tenant_id=tenant_id,
                        tenant_name=tenant_name,
                        error=f"删除向量异常: {str(e)}",
                    )

            # 2. 删除反馈
            feedback_stmt = delete(Feedback).where(Feedback.tenant_id == tenant_id)
            feedback_result = await self.db.execute(feedback_stmt)
            deleted_feedbacks = feedback_result.rowcount

            # 3. 删除对话
            conversation_stmt = delete(Conversation).where(Conversation.tenant_id == tenant_id)
            conversation_result = await self.db.execute(conversation_stmt)
            deleted_conversations = conversation_result.rowcount

            # 4. 删除语料
            qa_stmt = delete(QAPair).where(QAPair.tenant_id == tenant_id)
            qa_result = await self.db.execute(qa_stmt)
            deleted_qa_pairs = qa_result.rowcount

            # 5. 删除用户
            user_stmt = delete(User).where(User.tenant_id == tenant_id)
            user_result = await self.db.execute(user_stmt)
            deleted_users = user_result.rowcount

            # 6. 删除商家
            tenant_stmt = delete(Tenant).where(Tenant.id == tenant_id)
            await self.db.execute(tenant_stmt)

            # 提交事务
            await self.db.commit()

            return TenantDeleteResult(
                success=True,
                tenant_id=tenant_id,
                tenant_name=tenant_name,
                deleted_users=deleted_users,
                deleted_qa_pairs=deleted_qa_pairs,
                deleted_conversations=deleted_conversations,
                deleted_feedbacks=deleted_feedbacks,
                deleted_vectors=deleted_vectors,
            )

        except Exception as e:
            await self.db.rollback()
            return TenantDeleteResult(
                success=False,
                tenant_id=tenant_id,
                tenant_name=tenant_name,
                error=f"删除失败: {str(e)}",
            )
