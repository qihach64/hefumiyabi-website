"""
Performance Tests
性能基准测试
"""
import pytest
import time
import asyncio
from statistics import mean, stdev
from api.models import ChatRequest, SearchRequest
from api.routes import send_message, search_knowledge


class TestPerformance:
    """性能测试"""

    @pytest.mark.asyncio
    async def test_greeting_response_time(self, service_container):
        """测试问候语响应时间"""
        times = []

        for _ in range(3):
            start = time.time()
            req = ChatRequest(message="你好")
            await send_message(req, service_container)
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)

        avg_time = mean(times)
        print(f"\n问候语平均响应时间: {avg_time:.2f}ms")

        # 问候语应该很快（不需要 LLM）
        assert avg_time < 1000, f"问候语响应过慢: {avg_time}ms"

    @pytest.mark.asyncio
    async def test_knowledge_query_response_time(self, service_container):
        """测试知识查询响应时间"""
        times = []
        queries = [
            "和服租赁价格是多少？",
            "如何预约和服体验？",
            "有大尺码的和服吗？",
        ]

        for query in queries:
            start = time.time()
            req = ChatRequest(message=query)
            await send_message(req, service_container)
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)

        avg_time = mean(times)
        print(f"\n知识查询平均响应时间: {avg_time:.2f}ms")

        # RAG 查询应该在合理时间内完成
        assert avg_time < 15000, f"知识查询响应过慢: {avg_time}ms"

    @pytest.mark.asyncio
    async def test_search_response_time(self, service_container):
        """测试搜索响应时间"""
        times = []
        queries = ["价格", "预约", "尺码"]

        for query in queries:
            start = time.time()
            req = SearchRequest(query=query, top_k=5)
            await search_knowledge(req, service_container)
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)

        avg_time = mean(times)
        print(f"\n搜索平均响应时间: {avg_time:.2f}ms")

        # 搜索应该很快
        assert avg_time < 5000, f"搜索响应过慢: {avg_time}ms"

    def test_embedding_generation_speed(self, embedding_generator):
        """测试嵌入生成速度"""
        texts = [
            "这是第一段测试文本",
            "这是第二段测试文本",
            "这是第三段测试文本",
        ]

        start = time.time()
        for text in texts:
            embedding_generator.generate_embedding(text)
        elapsed = (time.time() - start) * 1000

        avg_time = elapsed / len(texts)
        print(f"\n嵌入生成平均时间: {avg_time:.2f}ms")

        assert avg_time < 2000, f"嵌入生成过慢: {avg_time}ms"

    def test_classifier_speed(self, faq_classifier):
        """测试分类器速度"""
        qa_pairs = [
            {"question": f"测试问题 {i}", "answer": f"测试回答 {i}", "source": "test"}
            for i in range(100)
        ]

        start = time.time()
        for qa in qa_pairs:
            faq_classifier.process_qa_pair(qa)
        elapsed = (time.time() - start) * 1000

        avg_time = elapsed / len(qa_pairs)
        print(f"\n分类器平均处理时间: {avg_time:.2f}ms/条")

        # 分类器应该非常快
        assert avg_time < 10, f"分类器处理过慢: {avg_time}ms"


class TestConcurrency:
    """并发测试"""

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, service_container):
        """测试并发请求"""
        async def make_request(msg):
            req = ChatRequest(message=msg)
            return await send_message(req, service_container)

        messages = ["你好", "价格多少？", "怎么预约？"]

        start = time.time()
        tasks = [make_request(msg) for msg in messages]
        responses = await asyncio.gather(*tasks)
        elapsed = (time.time() - start) * 1000

        print(f"\n{len(messages)} 个并发请求总时间: {elapsed:.2f}ms")

        # 所有请求都应该成功
        assert all(r.answer for r in responses)


class TestMemory:
    """内存测试"""

    def test_conversation_manager_memory(self, conversation_manager):
        """测试对话管理器内存"""
        # 创建多个对话
        for i in range(50):
            conv_id = f"mem-test-{i}"
            conversation_manager.create_conversation(conv_id)
            conversation_manager.add_user_message(conv_id, f"消息 {i}")
            conversation_manager.add_assistant_message(conv_id, f"回复 {i}")

        stats = conversation_manager.get_stats()
        print(f"\n活跃对话数: {stats['active_conversations']}")

        # 清理
        for i in range(50):
            conversation_manager.delete_conversation(f"mem-test-{i}")

        # 验证清理
        final_stats = conversation_manager.get_stats()
        assert final_stats["active_conversations"] < stats["active_conversations"]
