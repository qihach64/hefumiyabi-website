"""
API Dependencies
API 依赖注入
"""
import os
from functools import lru_cache
from typing import Optional

from knowledge import KnowledgeBase
from rag import RAGChain, QwenLLM, ConversationManager


class ServiceContainer:
    """服务容器 - 管理所有服务实例"""

    _instance: Optional["ServiceContainer"] = None

    def __init__(self):
        self._knowledge_base: Optional[KnowledgeBase] = None
        self._llm: Optional[QwenLLM] = None
        self._rag_chain: Optional[RAGChain] = None
        self._conversation_manager: Optional[ConversationManager] = None
        self._initialized = False

    @classmethod
    def get_instance(cls) -> "ServiceContainer":
        """获取单例实例"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def initialize(self, namespace: str = ""):
        """初始化所有服务"""
        if self._initialized:
            return

        print("正在初始化服务...")

        # 初始化知识库
        try:
            self._knowledge_base = KnowledgeBase()
            print("  ✓ 知识库初始化完成")
        except Exception as e:
            print(f"  ✗ 知识库初始化失败: {e}")
            self._knowledge_base = None

        # 初始化 LLM
        try:
            self._llm = QwenLLM()
            print("  ✓ LLM 初始化完成")
        except Exception as e:
            print(f"  ✗ LLM 初始化失败: {e}")
            self._llm = None

        # 初始化对话管理器
        self._conversation_manager = ConversationManager(
            max_conversations=10000,
            conversation_ttl=86400,  # 24 小时
        )
        print("  ✓ 对话管理器初始化完成")

        # 初始化 RAG 链
        if self._knowledge_base and self._llm:
            self._rag_chain = RAGChain(
                knowledge_base=self._knowledge_base,
                llm=self._llm,
                conversation_manager=self._conversation_manager,
            )
            print("  ✓ RAG 链初始化完成")
        else:
            print("  ✗ RAG 链初始化跳过（依赖服务不可用）")

        self._namespace = namespace
        self._initialized = True
        print("服务初始化完成！")

    @property
    def knowledge_base(self) -> Optional[KnowledgeBase]:
        return self._knowledge_base

    @property
    def llm(self) -> Optional[QwenLLM]:
        return self._llm

    @property
    def rag_chain(self) -> Optional[RAGChain]:
        return self._rag_chain

    @property
    def conversation_manager(self) -> Optional[ConversationManager]:
        return self._conversation_manager

    @property
    def namespace(self) -> str:
        return getattr(self, "_namespace", "")

    def is_healthy(self) -> dict:
        """检查服务健康状态"""
        return {
            "knowledge_base": "healthy" if self._knowledge_base else "unavailable",
            "llm": "healthy" if self._llm else "unavailable",
            "rag_chain": "healthy" if self._rag_chain else "unavailable",
            "conversation_manager": "healthy" if self._conversation_manager else "unavailable",
        }

    def get_stats(self) -> dict:
        """获取统计信息"""
        stats = {}

        if self._conversation_manager:
            stats["conversation"] = self._conversation_manager.get_stats()

        if self._knowledge_base:
            try:
                stats["knowledge_base"] = self._knowledge_base.get_stats()
            except Exception:
                stats["knowledge_base"] = {"error": "无法获取统计"}

        return stats


@lru_cache()
def get_service_container() -> ServiceContainer:
    """获取服务容器（带缓存）"""
    return ServiceContainer.get_instance()


def get_rag_chain() -> Optional[RAGChain]:
    """获取 RAG 链"""
    container = get_service_container()
    return container.rag_chain


def get_knowledge_base() -> Optional[KnowledgeBase]:
    """获取知识库"""
    container = get_service_container()
    return container.knowledge_base


def get_conversation_manager() -> Optional[ConversationManager]:
    """获取对话管理器"""
    container = get_service_container()
    return container.conversation_manager


def get_llm() -> Optional[QwenLLM]:
    """获取 LLM"""
    container = get_service_container()
    return container.llm
