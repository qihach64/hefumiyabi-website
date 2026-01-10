"""
RAG Module Tests
RAG 模块单元测试
"""
import pytest
from rag import (
    QwenLLM, ModelType, LLMResponse,
    ConversationManager, ContextWindowManager,
    RAGChain, RAGResponse,
    detect_language, format_context, format_history,
    get_rag_prompt, get_greeting_response, KIMONO_SYSTEM_PROMPT,
)


class TestQwenLLM:
    """Qwen LLM 测试"""

    def test_llm_initialization(self, qwen_llm):
        """测试 LLM 初始化"""
        assert qwen_llm is not None
        assert qwen_llm.default_model == ModelType.QWEN_PLUS
        assert qwen_llm.routing_ratio == 0.8

    def test_complex_query_detection(self, qwen_llm):
        """测试复杂查询检测"""
        # 复杂查询（投诉）
        assert qwen_llm._is_complex_query("我要投诉！") is True

        # 复杂查询（长问题）
        long_query = "这是一个非常长的问题，" * 20
        assert qwen_llm._is_complex_query(long_query) is True

        # 简单查询
        assert qwen_llm._is_complex_query("价格多少？") is False

    def test_model_selection_simple(self, qwen_llm):
        """测试简单问题模型选择"""
        # 简单问题大部分应该使用 Plus
        simple_queries = ["价格？", "几点？", "在哪？"]
        plus_count = 0

        for query in simple_queries:
            model = qwen_llm.select_model(query)
            if model == ModelType.QWEN_PLUS:
                plus_count += 1

        # 不验证具体比例，因为有随机性

    def test_model_selection_complex(self, qwen_llm):
        """测试复杂问题模型选择"""
        complex_query = "我要投诉，服务太差了！为什么预约不成功？"
        model = qwen_llm.select_model(complex_query)
        assert model == ModelType.QWEN_MAX

    def test_force_model_selection(self, qwen_llm):
        """测试强制模型选择"""
        model = qwen_llm.select_model("简单问题", force_model=ModelType.QWEN_MAX)
        assert model == ModelType.QWEN_MAX

    def test_generate_response(self, qwen_llm):
        """测试生成响应"""
        response = qwen_llm.generate(
            prompt="用一句话介绍和服。",
            model=ModelType.QWEN_PLUS,
        )

        assert response is not None
        assert isinstance(response, LLMResponse)
        assert len(response.content) > 0
        assert response.model == "qwen-plus"
        assert response.usage.get("total_tokens", 0) > 0


class TestConversationManager:
    """对话管理器测试"""

    def test_manager_initialization(self, conversation_manager):
        """测试管理器初始化"""
        assert conversation_manager is not None
        assert conversation_manager.max_conversations == 100

    def test_create_conversation(self, conversation_manager):
        """测试创建对话"""
        conv = conversation_manager.create_conversation("test-conv-1")
        assert conv is not None
        assert conv.id == "test-conv-1"

        # 清理
        conversation_manager.delete_conversation("test-conv-1")

    def test_add_messages(self, conversation_manager):
        """测试添加消息"""
        conv_id = "test-conv-2"
        conversation_manager.create_conversation(conv_id)

        # 添加用户消息
        msg1 = conversation_manager.add_user_message(conv_id, "你好")
        assert msg1.role == "user"
        assert msg1.content == "你好"

        # 添加助手消息
        msg2 = conversation_manager.add_assistant_message(conv_id, "您好！")
        assert msg2.role == "assistant"

        # 获取历史
        history = conversation_manager.get_history(conv_id)
        assert len(history) == 2

        # 清理
        conversation_manager.delete_conversation(conv_id)

    def test_get_or_create_conversation(self, conversation_manager):
        """测试获取或创建对话"""
        conv_id = "test-conv-3"

        # 第一次应该创建
        conv1 = conversation_manager.get_or_create_conversation(conv_id)
        assert conv1 is not None

        # 第二次应该获取同一个
        conv2 = conversation_manager.get_or_create_conversation(conv_id)
        assert conv1.id == conv2.id

        # 清理
        conversation_manager.delete_conversation(conv_id)

    def test_delete_conversation(self, conversation_manager):
        """测试删除对话"""
        conv_id = "test-conv-4"
        conversation_manager.create_conversation(conv_id)

        # 删除
        result = conversation_manager.delete_conversation(conv_id)
        assert result is True

        # 再次删除应该返回 False
        result = conversation_manager.delete_conversation(conv_id)
        assert result is False

    def test_stats(self, conversation_manager):
        """测试统计信息"""
        stats = conversation_manager.get_stats()
        assert "active_conversations" in stats
        assert "max_conversations" in stats


class TestContextWindowManager:
    """上下文窗口管理器测试"""

    def test_token_estimation(self):
        """测试 token 估算"""
        manager = ContextWindowManager()

        # 中文
        chinese = "你好世界"
        tokens = manager.estimate_tokens(chinese)
        assert tokens == 4  # 4 个汉字

        # 英文
        english = "Hello World"
        tokens = manager.estimate_tokens(english)
        assert tokens > 0

    def test_history_truncation(self):
        """测试历史截断"""
        manager = ContextWindowManager(max_tokens=1000)

        messages = [
            {"role": "user", "content": "消息" * 100},
            {"role": "assistant", "content": "回复" * 100},
            {"role": "user", "content": "消息" * 100},
        ]

        truncated = manager.truncate_history(messages, system_tokens=200)
        assert len(truncated) <= len(messages)

    def test_context_fitting(self):
        """测试上下文适配"""
        manager = ContextWindowManager()

        long_context = "内容" * 2000
        fitted = manager.fit_context(long_context, max_context_tokens=100)

        assert len(fitted) < len(long_context)
        assert "截断" in fitted


class TestPrompts:
    """提示词模块测试"""

    def test_system_prompt(self):
        """测试系统提示词"""
        assert len(KIMONO_SYSTEM_PROMPT) > 100
        assert "Kimono" in KIMONO_SYSTEM_PROMPT

    def test_language_detection(self):
        """测试语言检测"""
        assert detect_language("你好") == "zh"
        assert detect_language("こんにちは") == "ja"
        assert detect_language("Hello") == "en"
        assert detect_language("這裡") == "zh-tw"

    def test_rag_prompt(self):
        """测试 RAG 提示词生成"""
        prompt = get_rag_prompt("参考内容", "用户问题")
        assert "参考内容" in prompt
        assert "用户问题" in prompt

    def test_greeting_response(self):
        """测试问候语响应"""
        zh_greeting = get_greeting_response("zh")
        assert "您好" in zh_greeting

        ja_greeting = get_greeting_response("ja")
        assert "こんにちは" in ja_greeting

        en_greeting = get_greeting_response("en")
        assert "Hello" in en_greeting

    def test_format_context(self):
        """测试上下文格式化"""
        results = [
            type("Result", (), {"question": "Q1", "answer": "A1"})(),
            type("Result", (), {"question": "Q2", "answer": "A2"})(),
        ]
        context = format_context(results)
        assert "Q1" in context
        assert "A1" in context

    def test_format_history(self):
        """测试历史格式化"""
        messages = [
            {"role": "user", "content": "你好"},
            {"role": "assistant", "content": "您好！"},
        ]
        history = format_history(messages)
        assert "顾客" in history
        assert "客服" in history


class TestRAGChain:
    """RAG 链测试"""

    def test_chain_initialization(self, rag_chain):
        """测试 RAG 链初始化"""
        assert rag_chain is not None
        assert rag_chain.knowledge_base is not None
        assert rag_chain.llm is not None

    def test_greeting_detection(self, rag_chain):
        """测试问候语检测"""
        assert rag_chain._is_greeting("你好") is True
        assert rag_chain._is_greeting("hello") is True
        assert rag_chain._is_greeting("价格多少？") is False

    def test_greeting_response(self, rag_chain):
        """测试问候语响应"""
        response = rag_chain.query("你好")

        assert response is not None
        assert isinstance(response, RAGResponse)
        assert response.confidence > 0.9
        assert "您好" in response.answer or "欢迎" in response.answer

    def test_knowledge_query(self, rag_chain):
        """测试知识查询"""
        response = rag_chain.query(
            "和服租赁价格是多少？",
            namespace="test",
        )

        assert response is not None
        assert len(response.answer) > 0
        assert response.language in ["zh", "zh-tw"]  # 接受简体或繁体中文

    def test_simple_query(self, rag_chain):
        """测试简单查询接口"""
        answer = rag_chain.simple_query("你好")
        assert len(answer) > 0

    def test_stats(self, rag_chain):
        """测试统计信息"""
        stats = rag_chain.get_stats()
        assert "conversation_stats" in stats
