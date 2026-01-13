"""
API Models
API 请求和响应模型定义
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ========== 请求模型 ==========

class ChatRequest(BaseModel):
    """对话请求"""
    message: str = Field(..., min_length=1, max_length=2000, description="用户消息")
    conversation_id: Optional[str] = Field(None, description="会话 ID，用于多轮对话")
    user_id: Optional[str] = Field(None, description="用户 ID")
    language: Optional[str] = Field(None, description="语言偏好 (zh/ja/en)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "请问和服租赁价格是多少？",
                "conversation_id": "conv-12345",
                "user_id": "user-001",
                "language": "zh"
            }
        }
    )


class FeedbackRequest(BaseModel):
    """反馈请求"""
    conversation_id: str = Field(..., description="会话 ID")
    message_id: Optional[str] = Field(None, description="消息 ID")
    rating: int = Field(..., ge=1, le=5, description="评分 1-5")
    comment: Optional[str] = Field(None, max_length=500, description="评论")

    # 纠偏功能扩展
    user_question: Optional[str] = Field(None, max_length=2000, description="用户原始问题")
    original_answer: Optional[str] = Field(None, max_length=5000, description="AI 原始回答")
    corrected_answer: Optional[str] = Field(None, max_length=5000, description="纠正后的答案")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "conversation_id": "conv-12345",
                "message_id": "msg-67890",
                "rating": 2,
                "comment": "答案不够准确",
                "user_question": "和服租赁价格是多少？",
                "original_answer": "价格是5000日元",
                "corrected_answer": "我们的和服租赁价格从6000日元起，具体取决于套餐选择"
            }
        }
    )


class SearchRequest(BaseModel):
    """知识库搜索请求"""
    query: str = Field(..., min_length=1, max_length=500, description="搜索查询")
    top_k: int = Field(5, ge=1, le=20, description="返回结果数量")
    category: Optional[str] = Field(None, description="分类过滤")


# ========== 响应模型 ==========

class SourceItem(BaseModel):
    """来源信息"""
    question: str = Field(..., description="参考问题")
    answer: str = Field(..., description="参考答案")
    score: float = Field(..., description="相关性分数")
    category: Optional[str] = Field(None, description="分类")


class ChatResponse(BaseModel):
    """对话响应"""
    answer: str = Field(..., description="回答内容")
    conversation_id: str = Field(..., description="会话 ID")
    message_id: str = Field(..., description="消息 ID")
    sources: list[SourceItem] = Field(default_factory=list, description="参考来源")
    model_used: str = Field("", description="使用的模型")
    language: str = Field("zh", description="响应语言")
    confidence: float = Field(0.0, ge=0, le=1, description="置信度")
    latency_ms: int = Field(0, description="响应延迟(毫秒)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "answer": "我们的和服租赁价格从6000日元起，具体价格取决于您选择的套餐...",
                "conversation_id": "conv-12345",
                "message_id": "msg-67890",
                "sources": [
                    {"question": "租金多少？", "answer": "6000日元起", "score": 0.92}
                ],
                "model_used": "qwen-plus",
                "language": "zh",
                "confidence": 0.85,
                "latency_ms": 1200
            }
        }
    )


class FeedbackResponse(BaseModel):
    """反馈响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="响应消息")
    feedback_id: Optional[int] = Field(None, description="反馈记录 ID")
    applied: bool = Field(False, description="是否已应用到知识库")


class SearchResultItem(BaseModel):
    """搜索结果项"""
    question: str
    answer: str
    category: str
    score: float


class SearchResponse(BaseModel):
    """搜索响应"""
    results: list[SearchResultItem] = Field(default_factory=list)
    total: int = Field(0)
    query: str = Field("")


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str = Field(..., description="服务状态")
    version: str = Field(..., description="版本号")
    timestamp: str = Field(..., description="时间戳")
    components: dict = Field(default_factory=dict, description="组件状态")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2024-01-01T12:00:00Z",
                "components": {
                    "database": "healthy",
                    "llm": "healthy",
                    "vector_store": "healthy"
                }
            }
        }
    )


class StatsResponse(BaseModel):
    """统计响应"""
    total_conversations: int = Field(0, description="总会话数")
    active_conversations: int = Field(0, description="活跃会话数")
    total_messages: int = Field(0, description="总消息数")
    avg_response_time_ms: float = Field(0, description="平均响应时间")
    model_usage: dict = Field(default_factory=dict, description="模型使用统计")
    knowledge_base_stats: dict = Field(default_factory=dict, description="知识库统计")


class ErrorResponse(BaseModel):
    """错误响应"""
    error: str = Field(..., description="错误类型")
    message: str = Field(..., description="错误消息")
    detail: Optional[str] = Field(None, description="详细信息")
    request_id: Optional[str] = Field(None, description="请求 ID")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": "ValidationError",
                "message": "消息不能为空",
                "detail": "message field is required",
                "request_id": "req-12345"
            }
        }
    )


# ========== 认证模型 ==========

class TenantRegisterRequest(BaseModel):
    """商家注册请求"""
    name: str = Field(..., min_length=2, max_length=100, description="商家名称")
    admin_username: str = Field(..., min_length=3, max_length=50, description="管理员用户名")
    admin_password: str = Field(..., min_length=6, max_length=100, description="管理员密码")
    admin_display_name: Optional[str] = Field(None, max_length=100, description="管理员显示名称")
    # 新增：模板复制选项
    copy_templates: bool = Field(True, description="是否复制通用模板到知识库")
    template_categories: Optional[List[str]] = Field(
        None,
        description="要复制的模板类别，默认全部"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "京都和服店",
                "admin_username": "admin",
                "admin_password": "secure123",
                "admin_display_name": "店长",
                "copy_templates": True,
                "template_categories": None
            }
        }
    )


class UserRegisterRequest(BaseModel):
    """用户注册请求（商家内部）"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, max_length=100, description="密码")
    display_name: Optional[str] = Field(None, max_length=100, description="显示名称")
    role: str = Field("staff", description="角色: staff/tenant_admin")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "staff001",
                "password": "password123",
                "display_name": "客服小张",
                "role": "staff"
            }
        }
    )


class UserUpdateRequest(BaseModel):
    """用户更新请求"""
    display_name: Optional[str] = Field(None, max_length=100, description="显示名称")
    password: Optional[str] = Field(None, min_length=6, max_length=100, description="新密码")
    role: Optional[str] = Field(None, description="角色: staff/tenant_admin")
    is_active: Optional[bool] = Field(None, description="是否激活")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "display_name": "客服小李",
                "is_active": True
            }
        }
    )


class LoginRequest(BaseModel):
    """登录请求"""
    tenant_id: str = Field(..., description="商家 ID")
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tenant_id": "tenant_abc123",
                "username": "admin",
                "password": "secure123"
            }
        }
    )


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求"""
    refresh_token: str = Field(..., description="刷新令牌")


class TokenResponse(BaseModel):
    """令牌响应"""
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = Field("bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间（秒）")


class TenantResponse(BaseModel):
    """商家信息响应"""
    id: str = Field(..., description="商家 ID")
    name: str = Field(..., description="商家名称")
    namespace: str = Field(..., description="命名空间")
    status: str = Field(..., description="状态")
    created_at: datetime = Field(..., description="创建时间")


class UserResponse(BaseModel):
    """用户信息响应"""
    id: str = Field(..., description="用户 ID")
    tenant_id: str = Field(..., description="商家 ID")
    username: str = Field(..., description="用户名")
    display_name: str = Field(..., description="显示名称")
    role: str = Field(..., description="角色")
    is_active: bool = Field(..., description="是否激活")
    created_at: datetime = Field(..., description="创建时间")
    last_login: Optional[datetime] = Field(None, description="最后登录时间")


class TenantRegisterResponse(BaseModel):
    """商家注册响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="消息")
    tenant: Optional[TenantResponse] = Field(None, description="商家信息")
    admin_user: Optional[UserResponse] = Field(None, description="管理员用户信息")
    tokens: Optional[TokenResponse] = Field(None, description="访问令牌")
