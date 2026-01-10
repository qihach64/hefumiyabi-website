"""
ORM Models
数据库模型定义
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    JSON,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import DeclarativeBase, relationship


def utcnow():
    """返回当前 UTC 时间（Python 端默认值，避免异步上下文问题）"""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """SQLAlchemy Base Model"""
    pass


# ========== 租户和用户 (Phase 2 预留) ==========

class Tenant(Base):
    """商家/租户表"""
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)

    # Pinecone 命名空间
    namespace = Column(String(64), unique=True, nullable=False)

    # 商家配置
    settings = Column(JSON, default=dict)

    # 状态: active, suspended, deleted
    status = Column(String(20), default="active")

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # 关系
    users = relationship("User", back_populates="tenant")
    feedbacks = relationship("Feedback", back_populates="tenant")
    conversations = relationship("Conversation", back_populates="tenant")
    qa_pairs = relationship("QAPair", back_populates="tenant")

    def __repr__(self):
        return f"<Tenant(id={self.id}, name={self.name})>"


class User(Base):
    """用户表 (客服/管理员)"""
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)

    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # 可为空，支持 SSO

    # 角色: tenant_admin, staff
    role = Column(String(20), default="staff")
    display_name = Column(String(100))

    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # 关系
    tenant = relationship("Tenant", back_populates="users")

    # 索引
    __table_args__ = (
        Index("ix_users_tenant_id", "tenant_id"),
    )

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"


# ========== 反馈数据 ==========

class Feedback(Base):
    """反馈记录表"""
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 关联信息
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=True)  # Phase 1 可为空
    conversation_id = Column(String(64), nullable=False)
    message_id = Column(String(64), nullable=True)

    # 用户原始问题
    user_question = Column(Text, nullable=False)

    # AI 原始回答
    original_answer = Column(Text, nullable=False)

    # 反馈内容
    rating = Column(Integer, nullable=False)  # 1-5 评分
    feedback_type = Column(String(20), nullable=False)  # positive, negative, corrected

    # 纠偏答案 (当 feedback_type = corrected 时填写)
    corrected_answer = Column(Text, nullable=True)

    # 评论/备注
    comment = Column(Text, nullable=True)

    # 处理状态: pending, approved, applied, rejected, flagged
    status = Column(String(20), default="pending")

    # 审核信息
    reviewed_by = Column(String(64), nullable=True)  # 审核人 ID
    reviewed_at = Column(DateTime, nullable=True)    # 审核时间

    # 应用到知识库的记录
    applied_at = Column(DateTime, nullable=True)
    applied_qa_id = Column(Integer, nullable=True)  # 关联的 QAPair ID

    # 扩展数据
    extra_data = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=utcnow)

    # 关系
    tenant = relationship("Tenant", back_populates="feedbacks")

    # 索引
    __table_args__ = (
        Index("ix_feedbacks_tenant_id", "tenant_id"),
        Index("ix_feedbacks_conversation_id", "conversation_id"),
        Index("ix_feedbacks_status", "status"),
        Index("ix_feedbacks_rating", "rating"),
        Index("ix_feedbacks_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<Feedback(id={self.id}, rating={self.rating}, type={self.feedback_type})>"


# ========== 对话历史 ==========

class Conversation(Base):
    """对话记录表"""
    __tablename__ = "conversations"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=True)  # Phase 1 可为空

    # 消息列表 (JSON 格式)
    # [{"role": "user/assistant", "content": "...", "timestamp": ..., "metadata": {...}}]
    messages = Column(JSON, default=list)

    # 对话统计
    message_count = Column(Integer, default=0)

    # 扩展数据
    extra_data = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # 关系
    tenant = relationship("Tenant", back_populates="conversations")

    # 索引
    __table_args__ = (
        Index("ix_conversations_tenant_id", "tenant_id"),
        Index("ix_conversations_created_at", "created_at"),
        Index("ix_conversations_updated_at", "updated_at"),
    )

    def __repr__(self):
        return f"<Conversation(id={self.id}, messages={self.message_count})>"


# ========== 语料管理 ==========

class QAPair(Base):
    """问答对表 (语料管理)"""
    __tablename__ = "qa_pairs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=True)  # 空表示通用模板

    # 问答内容
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    # 分类
    category = Column(String(50), nullable=True)

    # 优先级 0-100
    priority = Column(Integer, default=0)

    # 来源: template, import, feedback, manual
    source = Column(String(20), default="manual")

    # 质量分数 0-1
    quality_score = Column(Float, default=0.8)

    # 关键词 (逗号分隔)
    keywords = Column(String(500), nullable=True)

    # 向量库同步状态
    vector_id = Column(String(64), nullable=True)  # Pinecone 向量 ID
    is_synced = Column(Boolean, default=False)
    synced_at = Column(DateTime, nullable=True)

    # 来源反馈 ID (如果从反馈创建)
    source_feedback_id = Column(Integer, nullable=True)

    # 扩展数据
    extra_data = Column(JSON, nullable=True)

    # 状态: active, deleted
    status = Column(String(20), default="active")

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # 关系
    tenant = relationship("Tenant", back_populates="qa_pairs")

    # 索引
    __table_args__ = (
        Index("ix_qa_pairs_tenant_id", "tenant_id"),
        Index("ix_qa_pairs_category", "category"),
        Index("ix_qa_pairs_source", "source"),
        Index("ix_qa_pairs_is_synced", "is_synced"),
        Index("ix_qa_pairs_status", "status"),
    )

    def __repr__(self):
        return f"<QAPair(id={self.id}, category={self.category})>"


# ========== 运维监控 ==========

class MetricsSnapshot(Base):
    """指标快照表（运维监控用）"""
    __tablename__ = "metrics_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=utcnow, index=True)

    # 指标类型: conversations, feedbacks, qa_pairs, api_calls, etc.
    metric_type = Column(String(50), nullable=False, index=True)

    # 指标值
    metric_value = Column(Float, nullable=False)

    # 维度信息 (JSON)
    # 例如: {"tenant_id": "xxx", "category": "price"}
    dimensions = Column(JSON, nullable=True)

    __table_args__ = (
        Index("ix_metrics_snapshots_type_time", "metric_type", "timestamp"),
    )

    def __repr__(self):
        return f"<MetricsSnapshot(type={self.metric_type}, value={self.metric_value})>"


class OpsLog(Base):
    """运维操作日志表"""
    __tablename__ = "ops_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=utcnow, index=True)

    # 操作者
    user_id = Column(String(64), nullable=True)
    username = Column(String(100), nullable=True)

    # 操作信息
    action = Column(String(100), nullable=False)  # 操作类型
    target_type = Column(String(50), nullable=True)  # 目标类型: tenant, qa_pair, config
    target_id = Column(String(64), nullable=True)  # 目标 ID

    # 详细信息 (JSON)
    details = Column(JSON, nullable=True)

    # IP 地址
    ip_address = Column(String(45), nullable=True)

    # 操作结果
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_ops_logs_action", "action"),
        Index("ix_ops_logs_target", "target_type", "target_id"),
    )

    def __repr__(self):
        return f"<OpsLog(action={self.action}, target={self.target_type})>"


class Alert(Base):
    """告警表"""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=utcnow, index=True)

    # 告警信息
    alert_type = Column(String(50), nullable=False)  # 告警类型
    severity = Column(String(20), nullable=False)  # critical, error, warning, info
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)  # 告警来源

    # 状态: active, acknowledged, resolved
    status = Column(String(20), default="active", index=True)

    # 确认信息
    acknowledged_by = Column(String(64), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

    # 解决信息
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(64), nullable=True)
    resolution_note = Column(Text, nullable=True)

    # 扩展数据
    extra_data = Column(JSON, nullable=True)

    def __repr__(self):
        return f"<Alert(type={self.alert_type}, severity={self.severity})>"


class APIUsageLog(Base):
    """API 调用记录表"""
    __tablename__ = "api_usage_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=utcnow, index=True)

    # API 信息
    api_type = Column(String(50), nullable=False)  # dashscope, pinecone
    operation = Column(String(50), nullable=False)  # chat, embedding, query

    # 关联商家
    tenant_id = Column(String(64), nullable=True, index=True)

    # Token 使用
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)

    # 性能
    latency_ms = Column(Integer, nullable=True)

    # 结果
    success = Column(Boolean, default=True)
    error_code = Column(String(50), nullable=True)

    __table_args__ = (
        Index("ix_api_usage_logs_type_time", "api_type", "timestamp"),
    )

    def __repr__(self):
        return f"<APIUsageLog(api={self.api_type}, op={self.operation})>"


# ========== 系统配置 ==========

class SystemConfig(Base):
    """系统配置表"""
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 配置分类: api, scheduler, alert, security
    category = Column(String(50), nullable=False, index=True)

    # 配置键
    key = Column(String(100), nullable=False)

    # 配置值（JSON 格式）
    value = Column(JSON, nullable=True)

    # 描述
    description = Column(String(255), nullable=True)

    # 是否为敏感配置
    is_sensitive = Column(Boolean, default=False)

    # 时间戳
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        Index("ix_system_configs_category_key", "category", "key", unique=True),
    )

    def __repr__(self):
        return f"<SystemConfig(category={self.category}, key={self.key})>"
