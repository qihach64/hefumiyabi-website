"""
Conversation Repository
对话数据访问层
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, func, desc, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Conversation


class ConversationRepository:
    """对话数据仓库"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        conversation_id: str,
        tenant_id: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> Conversation:
        """创建对话"""
        conversation = Conversation(
            id=conversation_id,
            tenant_id=tenant_id,
            messages=[],
            message_count=0,
            extra_data=metadata,
        )
        self.session.add(conversation)
        await self.session.flush()
        return conversation

    async def get_by_id(
        self,
        conversation_id: str,
        tenant_id: Optional[str] = None,
    ) -> Optional[Conversation]:
        """获取对话"""
        query = select(Conversation).where(Conversation.id == conversation_id)
        if tenant_id:
            query = query.where(Conversation.tenant_id == tenant_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_or_create(
        self,
        conversation_id: str,
        tenant_id: Optional[str] = None,
    ) -> Conversation:
        """获取或创建对话"""
        conversation = await self.get_by_id(conversation_id, tenant_id)
        if not conversation:
            conversation = await self.create(conversation_id, tenant_id)
        return conversation

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        tenant_id: Optional[str] = None,
        message_metadata: Optional[dict] = None,
    ) -> Conversation:
        """添加消息到对话"""
        conversation = await self.get_or_create(conversation_id, tenant_id)

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": message_metadata or {},
        }

        # 更新消息列表
        messages = list(conversation.messages) if conversation.messages else []
        messages.append(message)
        conversation.messages = messages
        conversation.message_count = len(messages)
        conversation.updated_at = datetime.utcnow()

        await self.session.flush()
        return conversation

    async def get_messages(
        self,
        conversation_id: str,
        tenant_id: Optional[str] = None,
        max_turns: int = 20,
    ) -> List[dict]:
        """获取对话消息"""
        conversation = await self.get_by_id(conversation_id, tenant_id)
        if not conversation or not conversation.messages:
            return []

        messages = conversation.messages
        if len(messages) > max_turns * 2:
            messages = messages[-(max_turns * 2):]

        return messages

    async def delete(
        self,
        conversation_id: str,
        tenant_id: Optional[str] = None,
    ) -> bool:
        """删除对话"""
        query = delete(Conversation).where(Conversation.id == conversation_id)
        if tenant_id:
            query = query.where(Conversation.tenant_id == tenant_id)
        result = await self.session.execute(query)
        return result.rowcount > 0

    async def list_recent(
        self,
        tenant_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Conversation]:
        """获取最近的对话列表"""
        query = select(Conversation)
        if tenant_id:
            query = query.where(Conversation.tenant_id == tenant_id)
        query = query.order_by(desc(Conversation.updated_at)).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_statistics(
        self,
        tenant_id: Optional[str] = None,
        days: int = 30,
    ) -> dict:
        """获取对话统计"""
        from datetime import timedelta

        cutoff = datetime.utcnow() - timedelta(days=days)

        # 对话总数
        total_query = select(func.count(Conversation.id)).where(
            Conversation.created_at >= cutoff
        )
        if tenant_id:
            total_query = total_query.where(Conversation.tenant_id == tenant_id)
        total_result = await self.session.execute(total_query)
        total = total_result.scalar() or 0

        # 消息总数
        msg_query = select(func.sum(Conversation.message_count)).where(
            Conversation.created_at >= cutoff
        )
        if tenant_id:
            msg_query = msg_query.where(Conversation.tenant_id == tenant_id)
        msg_result = await self.session.execute(msg_query)
        total_messages = msg_result.scalar() or 0

        return {
            "total_conversations": total,
            "total_messages": total_messages,
            "average_messages_per_conversation": (
                round(total_messages / total, 2) if total > 0 else 0
            ),
            "period_days": days,
        }

    async def cleanup_old(
        self,
        days: int = 7,
        tenant_id: Optional[str] = None,
    ) -> int:
        """清理过期对话"""
        from datetime import timedelta

        cutoff = datetime.utcnow() - timedelta(days=days)

        query = delete(Conversation).where(Conversation.updated_at < cutoff)
        if tenant_id:
            query = query.where(Conversation.tenant_id == tenant_id)

        result = await self.session.execute(query)
        return result.rowcount
