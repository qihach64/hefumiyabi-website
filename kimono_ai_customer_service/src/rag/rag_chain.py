"""
RAG Chain
检索增强生成链 - 整合知识库检索和 LLM 生成
"""
import time
from typing import Optional
from dataclasses import dataclass, field

from .llm import QwenLLM, ModelType, LLMResponse
from .prompts import (
    KIMONO_SYSTEM_PROMPT,
    get_rag_prompt,
    get_conversation_prompt,
    get_fallback_response,
    detect_language,
    format_context,
    format_history,
)
from .conversation import ConversationManager, ContextWindowManager


@dataclass
class RAGResponse:
    """RAG 响应"""
    answer: str
    sources: list[dict] = field(default_factory=list)
    model_used: str = ""
    language: str = "zh"
    confidence: float = 0.0
    latency_ms: int = 0
    usage: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "answer": self.answer,
            "sources": self.sources,
            "model_used": self.model_used,
            "language": self.language,
            "confidence": self.confidence,
            "latency_ms": self.latency_ms,
            "usage": self.usage,
        }


class RAGChain:
    """RAG 链"""

    def __init__(
        self,
        knowledge_base=None,
        llm: Optional[QwenLLM] = None,
        conversation_manager: Optional[ConversationManager] = None,
        top_k: int = 3,
        min_relevance_score: float = 0.5,
    ):
        """
        初始化 RAG 链

        Args:
            knowledge_base: 知识库实例
            llm: LLM 实例
            conversation_manager: 对话管理器
            top_k: 检索返回数量
            min_relevance_score: 最小相关性分数
        """
        self.knowledge_base = knowledge_base
        self.llm = llm or QwenLLM()
        self.conversation_manager = conversation_manager or ConversationManager()
        self.context_manager = ContextWindowManager()
        self.top_k = top_k
        self.min_relevance_score = min_relevance_score

    def _retrieve(self, query: str, namespace: str = "") -> list:
        """检索相关知识"""
        if self.knowledge_base is None:
            return []

        try:
            results = self.knowledge_base.vector_store.search(
                query=query,
                top_k=self.top_k,
                namespace=namespace,
            )

            # 过滤低相关性结果
            filtered = [r for r in results if r.score >= self.min_relevance_score]
            return filtered

        except Exception as e:
            print(f"知识检索错误: {e}")
            return []

    def _calculate_confidence(self, search_results: list, llm_response: Optional[LLMResponse]) -> float:
        """计算响应置信度"""
        if not llm_response:
            return 0.0

        confidence = 0.5  # 基础置信度

        # 有相关检索结果
        if search_results:
            avg_score = sum(r.score for r in search_results) / len(search_results)
            confidence += avg_score * 0.3

        # LLM 正常完成
        if llm_response.finish_reason == "stop":
            confidence += 0.1

        # 回复长度合适
        if 10 < len(llm_response.content) < 500:
            confidence += 0.1

        return min(confidence, 1.0)

    def query(
        self,
        question: str,
        conversation_id: Optional[str] = None,
        namespace: str = "",
        force_model: Optional[ModelType] = None,
    ) -> RAGResponse:
        """
        执行 RAG 查询

        Args:
            question: 用户问题
            conversation_id: 对话 ID（多轮对话）
            namespace: 知识库命名空间
            force_model: 强制使用的模型

        Returns:
            RAG 响应
        """
        start_time = time.time()

        # 检测语言
        language = detect_language(question)

        # 检索相关知识
        search_results = self._retrieve(question, namespace)

        # 格式化上下文
        context = format_context(search_results)
        context = self.context_manager.fit_context(context, max_context_tokens=8000)

        # 构建提示词
        if conversation_id:
            # 多轮对话
            history_msgs = self.conversation_manager.get_history(conversation_id)
            history = format_history(history_msgs)

            # 截断历史
            context_tokens = self.context_manager.estimate_tokens(context)
            history_msgs = self.context_manager.truncate_history(
                history_msgs,
                system_tokens=500,
                context_tokens=context_tokens,
            )

            prompt = get_conversation_prompt(context, history, question)

            # 保存用户消息
            self.conversation_manager.add_user_message(conversation_id, question)
        else:
            # 单轮对话
            prompt = get_rag_prompt(context, question)

        # 调用 LLM
        llm_response = self.llm.generate(
            prompt=prompt,
            system_prompt=KIMONO_SYSTEM_PROMPT,
            model=force_model,
        )

        # 处理响应
        if llm_response:
            answer = llm_response.content

            # 保存助手消息
            if conversation_id:
                self.conversation_manager.add_assistant_message(
                    conversation_id,
                    answer,
                    metadata={"model": llm_response.model},
                )

            confidence = self._calculate_confidence(search_results, llm_response)

            return RAGResponse(
                answer=answer,
                sources=[{"question": r.question, "answer": r.answer, "score": r.score} for r in search_results],
                model_used=llm_response.model,
                language=language,
                confidence=confidence,
                latency_ms=int((time.time() - start_time) * 1000),
                usage=llm_response.usage,
            )
        else:
            # LLM 调用失败，返回兜底回复
            fallback_answer = get_fallback_response(language)

            # 仍然保存到对话历史
            if conversation_id:
                self.conversation_manager.add_assistant_message(
                    conversation_id,
                    fallback_answer,
                    metadata={"model": "fallback"},
                )

            return RAGResponse(
                answer=fallback_answer,
                language=language,
                confidence=0.0,
                latency_ms=int((time.time() - start_time) * 1000),
            )

    def query_with_history(
        self,
        question: str,
        history: list[dict],
        namespace: str = "",
    ) -> RAGResponse:
        """
        带历史的查询（不使用 ConversationManager）

        Args:
            question: 用户问题
            history: 对话历史 [{"role": "user/assistant", "content": "..."}]
            namespace: 知识库命名空间

        Returns:
            RAG 响应
        """
        start_time = time.time()
        language = detect_language(question)

        # 检索
        search_results = self._retrieve(question, namespace)
        context = format_context(search_results)

        # 构建消息
        messages = [{"role": "system", "content": KIMONO_SYSTEM_PROMPT}]

        # 添加历史（截断）
        context_tokens = self.context_manager.estimate_tokens(context)
        truncated_history = self.context_manager.truncate_history(
            history,
            system_tokens=500,
            context_tokens=context_tokens,
        )
        messages.extend(truncated_history)

        # 添加当前问题（含上下文）
        current_prompt = get_rag_prompt(context, question)
        messages.append({"role": "user", "content": current_prompt})

        # 调用 LLM
        llm_response = self.llm.chat(messages)

        if llm_response:
            confidence = self._calculate_confidence(search_results, llm_response)

            return RAGResponse(
                answer=llm_response.content,
                sources=[{"question": r.question, "answer": r.answer, "score": r.score} for r in search_results],
                model_used=llm_response.model,
                language=language,
                confidence=confidence,
                latency_ms=int((time.time() - start_time) * 1000),
                usage=llm_response.usage,
            )
        else:
            return RAGResponse(
                answer=get_fallback_response(language),
                language=language,
                confidence=0.0,
                latency_ms=int((time.time() - start_time) * 1000),
            )

    def simple_query(self, question: str) -> str:
        """
        简单查询（只返回答案）

        Args:
            question: 用户问题

        Returns:
            答案文本
        """
        response = self.query(question)
        return response.answer

    def get_stats(self) -> dict:
        """获取统计信息"""
        stats = {
            "conversation_stats": self.conversation_manager.get_stats(),
        }

        if self.knowledge_base:
            stats["knowledge_base_stats"] = self.knowledge_base.get_stats()

        return stats


class KimonoCustomerService:
    """和服客服服务 - 高层封装"""

    def __init__(
        self,
        pinecone_api_key: Optional[str] = None,
        dashscope_api_key: Optional[str] = None,
        index_name: Optional[str] = None,
        namespace: str = "",
    ):
        """
        初始化和服客服服务

        Args:
            pinecone_api_key: Pinecone API Key
            dashscope_api_key: DashScope API Key
            index_name: Pinecone 索引名称
            namespace: 知识库命名空间
        """
        from knowledge import KnowledgeBase

        self.knowledge_base = KnowledgeBase(
            pinecone_api_key=pinecone_api_key,
            dashscope_api_key=dashscope_api_key,
            index_name=index_name,
        )

        self.rag_chain = RAGChain(
            knowledge_base=self.knowledge_base,
        )

        self.namespace = namespace

    def chat(self, message: str, conversation_id: Optional[str] = None) -> dict:
        """
        聊天接口

        Args:
            message: 用户消息
            conversation_id: 对话 ID

        Returns:
            响应字典
        """
        response = self.rag_chain.query(
            question=message,
            conversation_id=conversation_id,
            namespace=self.namespace,
        )

        return response.to_dict()

    def get_answer(self, question: str) -> str:
        """
        获取答案（简化接口）

        Args:
            question: 问题

        Returns:
            答案
        """
        return self.rag_chain.simple_query(question)
