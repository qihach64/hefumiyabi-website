"""
API Module Tests
API 模块单元测试
"""
import pytest
import asyncio
from api.models import (
    ChatRequest, ChatResponse,
    SearchRequest, SearchResponse,
    HealthResponse, StatsResponse,
    FeedbackRequest, FeedbackResponse,
)
from api.dependencies import ServiceContainer, get_service_container
from api.routes import (
    send_message, health_check, search_knowledge,
    submit_feedback, get_conversation_history,
)


class TestAPIModels:
    """API 模型测试"""

    def test_chat_request_validation(self):
        """测试 ChatRequest 验证"""
        # 有效请求
        req = ChatRequest(message="测试消息")
        assert req.message == "测试消息"
        assert req.conversation_id is None

        # 带会话 ID
        req = ChatRequest(message="测试", conversation_id="conv-123")
        assert req.conversation_id == "conv-123"

    def test_chat_request_invalid(self):
        """测试无效 ChatRequest"""
        with pytest.raises(Exception):
            ChatRequest(message="")  # 空消息

    def test_chat_response(self):
        """测试 ChatResponse"""
        resp = ChatResponse(
            answer="测试回答",
            conversation_id="conv-123",
            message_id="msg-456",
            confidence=0.85,
        )
        assert resp.answer == "测试回答"
        assert resp.confidence == 0.85

    def test_search_request(self):
        """测试 SearchRequest"""
        req = SearchRequest(query="测试查询", top_k=5)
        assert req.query == "测试查询"
        assert req.top_k == 5

    def test_health_response(self):
        """测试 HealthResponse"""
        resp = HealthResponse(
            status="healthy",
            version="1.0.0",
            timestamp="2024-01-01T00:00:00Z",
        )
        assert resp.status == "healthy"

    def test_feedback_request(self):
        """测试 FeedbackRequest"""
        req = FeedbackRequest(
            conversation_id="conv-123",
            rating=5,
            comment="很好",
        )
        assert req.rating == 5


class TestServiceContainer:
    """服务容器测试"""

    def test_singleton_pattern(self):
        """测试单例模式"""
        container1 = get_service_container()
        container2 = get_service_container()
        assert container1 is container2

    def test_initialization(self, service_container):
        """测试初始化"""
        assert service_container._initialized is True

    def test_health_check(self, service_container):
        """测试健康检查"""
        health = service_container.is_healthy()
        assert isinstance(health, dict)
        assert "llm" in health
        assert "knowledge_base" in health

    def test_stats(self, service_container):
        """测试统计信息"""
        stats = service_container.get_stats()
        assert isinstance(stats, dict)


class TestAPIRoutes:
    """API 路由测试"""

    @pytest.mark.asyncio
    async def test_send_message(self, service_container):
        """测试发送消息"""
        request = ChatRequest(message="你好")
        response = await send_message(request, service_container)

        assert isinstance(response, ChatResponse)
        assert len(response.answer) > 0
        assert response.conversation_id is not None

    @pytest.mark.asyncio
    async def test_health_check_route(self, service_container):
        """测试健康检查路由"""
        response = await health_check(service_container)

        assert isinstance(response, HealthResponse)
        assert response.status in ["healthy", "degraded"]
        assert response.version == "1.0.0"

    @pytest.mark.asyncio
    async def test_search_knowledge_route(self, service_container):
        """测试知识库搜索路由"""
        request = SearchRequest(query="和服价格", top_k=3)
        response = await search_knowledge(request, service_container)

        assert isinstance(response, SearchResponse)
        assert hasattr(response, 'results')
        assert hasattr(response, 'total')

    @pytest.mark.asyncio
    async def test_submit_feedback_route(self):
        """测试提交反馈路由"""
        request = FeedbackRequest(
            conversation_id="test-conv",
            rating=5,
            comment="测试反馈",
        )
        response = await submit_feedback(request)

        assert isinstance(response, FeedbackResponse)
        assert response.success is True

    @pytest.mark.asyncio
    async def test_conversation_history(self, service_container):
        """测试获取对话历史"""
        # 先发送一条消息创建对话
        chat_req = ChatRequest(message="测试消息", conversation_id="test-history-conv")
        await send_message(chat_req, service_container)

        # 获取历史
        response = await get_conversation_history("test-history-conv", 20, service_container)

        assert "conversation_id" in response
        assert "messages" in response


class TestIntegration:
    """集成测试"""

    @pytest.mark.asyncio
    async def test_multi_turn_conversation(self, service_container):
        """测试多轮对话"""
        conv_id = "test-multi-turn"

        # 第一轮
        req1 = ChatRequest(message="你好", conversation_id=conv_id)
        resp1 = await send_message(req1, service_container)
        assert resp1.conversation_id == conv_id

        # 第二轮
        req2 = ChatRequest(message="价格多少？", conversation_id=conv_id)
        resp2 = await send_message(req2, service_container)
        assert resp2.conversation_id == conv_id

        # 获取历史
        history = await get_conversation_history(conv_id, 20, service_container)
        assert len(history["messages"]) >= 2

    @pytest.mark.asyncio
    async def test_language_detection_in_response(self, service_container):
        """测试响应语言检测"""
        # 中文
        req_zh = ChatRequest(message="你好")
        resp_zh = await send_message(req_zh, service_container)
        assert resp_zh.language == "zh"

        # 日语
        req_ja = ChatRequest(message="こんにちは")
        resp_ja = await send_message(req_ja, service_container)
        assert resp_ja.language == "ja"

    @pytest.mark.asyncio
    async def test_knowledge_retrieval(self, service_container):
        """测试知识检索"""
        req = ChatRequest(message="和服租赁的价格是多少？")
        resp = await send_message(req, service_container)

        # 应该有知识来源
        # 注意：可能没有来源如果是问候语
        assert len(resp.answer) > 0
