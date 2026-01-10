"""
Unified data models for customer service conversations
统一的客服对话数据模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ConversationSource(str, Enum):
    """对话来源平台"""
    INSTAGRAM = "instagram"
    LINE = "line"
    WECHAT = "wechat"


class SenderType(str, Enum):
    """发送者类型"""
    CUSTOMER = "customer"  # 客户
    STAFF = "staff"        # 客服/商家


class MessageType(str, Enum):
    """消息类型"""
    TEXT = "text"
    IMAGE = "image"
    STICKER = "sticker"
    AUDIO = "audio"
    VIDEO = "video"
    FILE = "file"
    UNKNOWN = "unknown"


class Message(BaseModel):
    """单条消息模型"""
    id: str = Field(description="消息唯一ID")
    conversation_id: str = Field(description="所属对话ID")
    sender_type: SenderType = Field(description="发送者类型")
    sender_name: str = Field(description="发送者名称")
    content: str = Field(default="", description="消息文本内容")
    message_type: MessageType = Field(default=MessageType.TEXT, description="消息类型")
    timestamp: datetime = Field(description="发送时间")

    # 可选字段
    attachments: list[str] = Field(default_factory=list, description="附件路径列表")
    raw_data: Optional[dict] = Field(default=None, description="原始数据（用于调试）")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Conversation(BaseModel):
    """对话模型"""
    id: str = Field(description="对话唯一ID")
    source: ConversationSource = Field(description="来源平台")
    customer_name: str = Field(description="客户名称")
    customer_id: Optional[str] = Field(default=None, description="客户平台ID")

    messages: list[Message] = Field(default_factory=list, description="消息列表")

    # 元数据
    start_time: Optional[datetime] = Field(default=None, description="对话开始时间")
    end_time: Optional[datetime] = Field(default=None, description="对话结束时间")
    message_count: int = Field(default=0, description="消息总数")
    customer_message_count: int = Field(default=0, description="客户消息数")
    staff_message_count: int = Field(default=0, description="客服消息数")

    # 原始数据路径
    source_file: Optional[str] = Field(default=None, description="源文件路径")

    def update_stats(self):
        """更新统计信息"""
        self.message_count = len(self.messages)
        self.customer_message_count = sum(
            1 for m in self.messages if m.sender_type == SenderType.CUSTOMER
        )
        self.staff_message_count = sum(
            1 for m in self.messages if m.sender_type == SenderType.STAFF
        )

        if self.messages:
            timestamps = [m.timestamp for m in self.messages]
            self.start_time = min(timestamps)
            self.end_time = max(timestamps)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ConversationBatch(BaseModel):
    """对话批次（用于批量处理）"""
    conversations: list[Conversation] = Field(default_factory=list)
    source: ConversationSource
    processed_at: datetime = Field(default_factory=datetime.now)
    total_count: int = Field(default=0)
    success_count: int = Field(default=0)
    error_count: int = Field(default=0)
    errors: list[dict] = Field(default_factory=list)

    def update_counts(self):
        """更新计数"""
        self.total_count = len(self.conversations) + self.error_count
        self.success_count = len(self.conversations)
