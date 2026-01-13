"""
Pytest Configuration
测试配置和 fixtures
"""
import sys
import os
from pathlib import Path

import pytest

# Add project paths
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / ".env")


@pytest.fixture(scope="session")
def project_root_path():
    """Project root path fixture"""
    return project_root


@pytest.fixture(scope="session")
def data_path(project_root_path):
    """Data directory path fixture"""
    return project_root_path / "data"


@pytest.fixture(scope="module")
def faq_classifier():
    """FAQ classifier fixture"""
    from knowledge import FAQClassifier
    return FAQClassifier()


@pytest.fixture(scope="module")
def embedding_generator():
    """Embedding generator fixture"""
    from knowledge import EmbeddingGenerator
    return EmbeddingGenerator()


@pytest.fixture(scope="module")
def knowledge_base():
    """Knowledge base fixture"""
    from knowledge import KnowledgeBase
    return KnowledgeBase()


@pytest.fixture(scope="module")
def qwen_llm():
    """Qwen LLM fixture"""
    from rag import QwenLLM
    return QwenLLM()


@pytest.fixture(scope="module")
def conversation_manager():
    """Conversation manager fixture"""
    from rag import ConversationManager
    return ConversationManager(max_conversations=100, conversation_ttl=300)


@pytest.fixture(scope="module")
def rag_chain(knowledge_base, qwen_llm, conversation_manager):
    """RAG chain fixture"""
    from rag import RAGChain
    return RAGChain(
        knowledge_base=knowledge_base,
        llm=qwen_llm,
        conversation_manager=conversation_manager,
    )


@pytest.fixture(scope="module")
def service_container():
    """Service container fixture"""
    from api.dependencies import get_service_container
    container = get_service_container()
    container.initialize(namespace="test")
    return container


# Sample test data
@pytest.fixture
def sample_qa_pair():
    """Sample QA pair for testing"""
    return {
        "question": "请问和服租赁的价格是多少？",
        "answer": "我们的和服租赁价格从6000日元起，具体价格取决于您选择的套餐和款式。",
        "source": "test",
        "conversation_id": "test-conv-001",
    }


@pytest.fixture
def sample_qa_pairs():
    """Sample QA pairs for batch testing"""
    return [
        {
            "question": "如何预约和服体验？",
            "answer": "您可以通过我们的官网或Instagram预约，提前1-2天预约即可。",
            "source": "test",
        },
        {
            "question": "有大尺码的和服吗？",
            "answer": "有的，我们提供从S到3L的各种尺码，最大可适合身高185cm的客人。",
            "source": "test",
        },
        {
            "question": "租赁时间是多长？",
            "answer": "标准租赁时间是从上午10点到下午6点，您也可以选择过夜套餐。",
            "source": "test",
        },
    ]


@pytest.fixture
def test_messages():
    """Test conversation messages"""
    return [
        {"role": "user", "content": "你好"},
        {"role": "assistant", "content": "您好！欢迎咨询 Kimono One 和服租赁服务。"},
        {"role": "user", "content": "价格是多少？"},
    ]
