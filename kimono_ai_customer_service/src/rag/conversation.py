"""
Conversation Manager
多轮对话管理器
"""
import time
import uuid
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime
from collections import OrderedDict


@dataclass
class Message:
    """对话消息"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: float = field(default_factory=time.time)
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Message":
        return cls(
            role=data["role"],
            content=data["content"],
            timestamp=data.get("timestamp", time.time()),
            metadata=data.get("metadata", {}),
        )


@dataclass
class Conversation:
    """对话会话"""
    id: str
    messages: list[Message] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    metadata: dict = field(default_factory=dict)

    def add_message(self, role: str, content: str, metadata: dict = None) -> Message:
        """添加消息"""
        msg = Message(
            role=role,
            content=content,
            metadata=metadata or {},
        )
        self.messages.append(msg)
        self.updated_at = time.time()
        return msg

    def get_history(self, max_turns: int = 100) -> list[dict]:
        """获取对话历史（用于 LLM）"""
        recent = self.messages[-max_turns * 2:] if len(self.messages) > max_turns * 2 else self.messages
        return [msg.to_dict() for msg in recent]

    def get_last_user_message(self) -> Optional[str]:
        """获取最后一条用户消息"""
        for msg in reversed(self.messages):
            if msg.role == "user":
                return msg.content
        return None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "messages": [msg.to_dict() for msg in self.messages],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Conversation":
        conv = cls(
            id=data["id"],
            created_at=data.get("created_at", time.time()),
            updated_at=data.get("updated_at", time.time()),
            metadata=data.get("metadata", {}),
        )
        conv.messages = [Message.from_dict(m) for m in data.get("messages", [])]
        return conv


class ConversationManager:
    """对话管理器"""

    def __init__(
        self,
        max_conversations: int = 1000,
        conversation_ttl: int = 3600,  # 1 小时过期
    ):
        """
        初始化对话管理器

        Args:
            max_conversations: 最大会话数
            conversation_ttl: 会话过期时间（秒）
        """
        self.max_conversations = max_conversations
        self.conversation_ttl = conversation_ttl
        self._conversations: OrderedDict[str, Conversation] = OrderedDict()

    def create_conversation(self, conversation_id: Optional[str] = None, metadata: dict = None) -> Conversation:
        """创建新对话"""
        # 清理过期会话
        self._cleanup_expired()

        # 超出限制时移除最旧的
        while len(self._conversations) >= self.max_conversations:
            self._conversations.popitem(last=False)

        conv_id = conversation_id or str(uuid.uuid4())
        conv = Conversation(id=conv_id, metadata=metadata or {})
        self._conversations[conv_id] = conv

        return conv

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """获取对话"""
        conv = self._conversations.get(conversation_id)

        if conv and self._is_expired(conv):
            del self._conversations[conversation_id]
            return None

        if conv:
            # 移到末尾（LRU）
            self._conversations.move_to_end(conversation_id)

        return conv

    def get_or_create_conversation(self, conversation_id: str, metadata: dict = None) -> Conversation:
        """获取或创建对话"""
        conv = self.get_conversation(conversation_id)
        if conv is None:
            conv = self.create_conversation(conversation_id, metadata)
        return conv

    def add_user_message(self, conversation_id: str, content: str, metadata: dict = None) -> Message:
        """添加用户消息"""
        conv = self.get_or_create_conversation(conversation_id)
        return conv.add_message("user", content, metadata)

    def add_assistant_message(self, conversation_id: str, content: str, metadata: dict = None) -> Message:
        """添加助手消息"""
        conv = self.get_conversation(conversation_id)
        if conv is None:
            raise ValueError(f"会话 {conversation_id} 不存在")
        return conv.add_message("assistant", content, metadata)

    def get_history(self, conversation_id: str, max_turns: int = 100) -> list[dict]:
        """获取对话历史"""
        conv = self.get_conversation(conversation_id)
        if conv is None:
            return []
        return conv.get_history(max_turns)

    def delete_conversation(self, conversation_id: str) -> bool:
        """删除对话"""
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]
            return True
        return False

    def clear_all(self):
        """清除所有对话"""
        self._conversations.clear()

    def _is_expired(self, conv: Conversation) -> bool:
        """检查对话是否过期"""
        return time.time() - conv.updated_at > self.conversation_ttl

    def _cleanup_expired(self):
        """清理过期会话"""
        current_time = time.time()
        expired_ids = [
            conv_id for conv_id, conv in self._conversations.items()
            if current_time - conv.updated_at > self.conversation_ttl
        ]
        for conv_id in expired_ids:
            del self._conversations[conv_id]

    def get_stats(self) -> dict:
        """获取统计信息"""
        self._cleanup_expired()
        return {
            "active_conversations": len(self._conversations),
            "max_conversations": self.max_conversations,
            "ttl_seconds": self.conversation_ttl,
        }


class ContextWindowManager:
    """上下文窗口管理器 - 管理 LLM 的上下文长度"""

    def __init__(self, max_tokens: int = 32000, reserve_tokens: int = 4000):
        """
        初始化上下文窗口管理器

        Args:
            max_tokens: 最大 token 数（qwen-max: 32K, qwen-plus/turbo: 128K）
            reserve_tokens: 为输出保留的 token 数
        """
        self.max_tokens = max_tokens
        self.reserve_tokens = reserve_tokens
        self.available_tokens = max_tokens - reserve_tokens

    def estimate_tokens(self, text: str) -> int:
        """估算文本 token 数（简单估算）"""
        # 中文约 1 字符 = 1 token
        # 英文约 4 字符 = 1 token
        chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        other_chars = len(text) - chinese_chars
        return chinese_chars + (other_chars // 4)

    def truncate_history(
        self,
        messages: list[dict],
        system_tokens: int = 500,
        context_tokens: int = 0,
    ) -> list[dict]:
        """
        截断历史以适应上下文窗口

        Args:
            messages: 消息列表
            system_tokens: 系统提示占用的 token
            context_tokens: RAG 上下文占用的 token

        Returns:
            截断后的消息列表
        """
        available = self.available_tokens - system_tokens - context_tokens

        if available <= 0:
            return messages[-2:] if len(messages) >= 2 else messages

        result = []
        total_tokens = 0

        # 从最新的消息开始
        for msg in reversed(messages):
            msg_tokens = self.estimate_tokens(msg.get("content", ""))
            if total_tokens + msg_tokens <= available:
                result.insert(0, msg)
                total_tokens += msg_tokens
            else:
                break

        return result

    def fit_context(
        self,
        context: str,
        max_context_tokens: int = 8000,
    ) -> str:
        """
        截断上下文以适应窗口

        Args:
            context: 上下文文本
            max_context_tokens: 最大上下文 token

        Returns:
            截断后的上下文
        """
        tokens = self.estimate_tokens(context)

        if tokens <= max_context_tokens:
            return context

        # 按比例截断
        ratio = max_context_tokens / tokens
        target_len = int(len(context) * ratio * 0.9)  # 留一些余量

        return context[:target_len] + "\n...(内容已截断)"
