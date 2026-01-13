"""
Knowledge Module Tests
知识库模块单元测试
"""
import pytest
from knowledge import FAQClassifier, FAQCategory, CleanedQAPair, EmbeddingGenerator


class TestFAQClassifier:
    """FAQ 分类器测试"""

    def test_classifier_initialization(self, faq_classifier):
        """测试分类器初始化"""
        assert faq_classifier is not None
        assert len(faq_classifier.invalid_patterns) > 0

    def test_text_cleaning(self, faq_classifier):
        """测试文本清洗"""
        # 测试去除多余空白
        text = "  你好   世界  "
        cleaned = faq_classifier._clean_text(text)
        assert cleaned == "你好 世界"

        # 测试空文本
        assert faq_classifier._clean_text("") == ""
        assert faq_classifier._clean_text(None) == ""

    def test_invalid_detection(self, faq_classifier):
        """测试无效问答检测"""
        # 太短的问题
        assert faq_classifier._is_invalid("ab", "answer") is True

        # 太短的回答
        assert faq_classifier._is_invalid("question", "a") is True

        # 问题等于回答
        assert faq_classifier._is_invalid("same", "same") is True

        # 有效问答
        assert faq_classifier._is_invalid("这是一个问题？", "这是回答") is False

    def test_classification_booking(self, faq_classifier):
        """测试预约分类"""
        category = faq_classifier._classify("如何预约和服？", "可以通过官网预约")
        assert category == FAQCategory.BOOKING

    def test_classification_pricing(self, faq_classifier):
        """测试价格分类"""
        category = faq_classifier._classify("价格多少？", "6000日元")
        assert category == FAQCategory.PRICING

    def test_classification_size(self, faq_classifier):
        """测试尺寸分类"""
        category = faq_classifier._classify("和服尺寸有哪些？", "有S到3L的尺寸")
        assert category == FAQCategory.SIZE_STYLE

    def test_process_qa_pair(self, faq_classifier, sample_qa_pair):
        """测试处理单个问答对"""
        cleaned = faq_classifier.process_qa_pair(sample_qa_pair)

        assert cleaned is not None
        assert isinstance(cleaned, CleanedQAPair)
        assert cleaned.question == sample_qa_pair["question"]
        assert cleaned.category == FAQCategory.PRICING
        assert cleaned.quality_score > 0

    def test_process_invalid_qa_pair(self, faq_classifier):
        """测试处理无效问答对"""
        invalid_qa = {"question": "ok", "answer": "好"}
        cleaned = faq_classifier.process_qa_pair(invalid_qa)
        assert cleaned is None

    def test_quality_score_calculation(self, faq_classifier):
        """测试质量分数计算"""
        # 高质量问答
        high_quality = faq_classifier._calculate_quality_score(
            "请问和服租赁的价格是多少？",
            "我们的和服租赁价格从6000日元起。",
            FAQCategory.PRICING,
        )
        assert high_quality >= 0.7

        # 低质量问答
        low_quality = faq_classifier._calculate_quality_score(
            "hi",
            "hello",
            FAQCategory.GENERAL,
        )
        assert low_quality < 0.7

    def test_keyword_extraction(self, faq_classifier):
        """测试关键词提取"""
        keywords = faq_classifier._extract_keywords(
            "预约和服的价格",
            "6000日元起"
        )
        assert len(keywords) > 0
        assert any("预约" in kw or "价格" in kw or "日元" in kw for kw in keywords)


class TestEmbeddingGenerator:
    """嵌入生成器测试"""

    def test_generator_initialization(self, embedding_generator):
        """测试生成器初始化"""
        assert embedding_generator is not None
        assert embedding_generator.dimension == 1536

    def test_single_embedding(self, embedding_generator):
        """测试单个嵌入生成"""
        text = "这是一段测试文本"
        embedding = embedding_generator.generate_embedding(text)

        assert embedding is not None
        assert len(embedding) == 1536
        assert all(isinstance(x, float) for x in embedding)

    def test_empty_text_embedding(self, embedding_generator):
        """测试空文本嵌入"""
        assert embedding_generator.generate_embedding("") is None
        assert embedding_generator.generate_embedding("   ") is None

    def test_qa_embedding(self, embedding_generator):
        """测试问答对嵌入"""
        embedding = embedding_generator.generate_qa_embedding(
            question="价格多少？",
            answer="6000日元"
        )

        assert embedding is not None
        assert len(embedding) == 1536

    def test_id_generation(self, embedding_generator):
        """测试 ID 生成"""
        text = "测试文本"
        id1 = embedding_generator.generate_id(text)
        id2 = embedding_generator.generate_id(text)

        # 相同文本生成相同 ID
        assert id1 == id2
        assert len(id1) == 16

        # 不同文本生成不同 ID
        id3 = embedding_generator.generate_id("不同文本")
        assert id1 != id3

    def test_text_truncation(self, embedding_generator):
        """测试文本截断"""
        long_text = "测试" * 3000
        truncated = embedding_generator._truncate_text(long_text)
        assert len(truncated) <= 4000


class TestCleanedQAPair:
    """CleanedQAPair 数据类测试"""

    def test_to_dict(self):
        """测试转换为字典"""
        qa_pair = CleanedQAPair(
            question="测试问题",
            answer="测试回答",
            category=FAQCategory.GENERAL,
            source="test",
            conversation_id="conv-001",
            quality_score=0.8,
            keywords=["测试"],
        )

        d = qa_pair.to_dict()

        assert d["question"] == "测试问题"
        assert d["answer"] == "测试回答"
        assert d["category"] == "general"
        assert d["quality_score"] == 0.8
        assert "测试" in d["keywords"]
