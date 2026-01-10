"""
Quality Evaluator
语料质量评估器 - 评估问答对的质量分数
"""

import re
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class QualityReport:
    """质量评估报告"""
    overall_score: float  # 总体分数 0-1
    question_score: float  # 问题质量分数
    answer_score: float  # 回答质量分数
    relevance_score: float  # 相关性分数
    issues: List[str]  # 发现的问题
    suggestions: List[str]  # 改进建议


class QualityEvaluator:
    """
    语料质量评估器

    评估维度:
    1. 问题质量 - 清晰度、完整性、规范性
    2. 回答质量 - 完整性、信息量、格式
    3. 相关性 - 问答匹配度
    """

    # 权重配置
    WEIGHTS = {
        "question": 0.3,
        "answer": 0.5,
        "relevance": 0.2,
    }

    # 最小长度要求
    MIN_QUESTION_LENGTH = 5
    MIN_ANSWER_LENGTH = 10

    # 和服租赁相关关键词
    DOMAIN_KEYWORDS = [
        "和服", "着物", "浴衣", "振袖", "留袖", "访问着", "小纹", "色无地",
        "帯", "草履", "足袋", "半襟", "伊达締", "腰紐",
        "预约", "租赁", "归还", "试穿", "拍照", "摄影",
        "京都", "东京", "大阪", "奈良", "浅草",
        "价格", "费用", "套餐", "优惠", "折扣",
    ]

    def evaluate(
        self,
        question: str,
        answer: str,
        category: Optional[str] = None,
    ) -> QualityReport:
        """
        评估问答对质量

        Args:
            question: 问题文本
            answer: 回答文本
            category: 分类（可选）

        Returns:
            质量评估报告
        """
        issues = []
        suggestions = []

        # 1. 评估问题质量
        question_score, q_issues, q_suggestions = self._evaluate_question(question)
        issues.extend(q_issues)
        suggestions.extend(q_suggestions)

        # 2. 评估回答质量
        answer_score, a_issues, a_suggestions = self._evaluate_answer(answer)
        issues.extend(a_issues)
        suggestions.extend(a_suggestions)

        # 3. 评估相关性
        relevance_score, r_issues, r_suggestions = self._evaluate_relevance(
            question, answer, category
        )
        issues.extend(r_issues)
        suggestions.extend(r_suggestions)

        # 计算总体分数
        overall_score = (
            question_score * self.WEIGHTS["question"]
            + answer_score * self.WEIGHTS["answer"]
            + relevance_score * self.WEIGHTS["relevance"]
        )

        return QualityReport(
            overall_score=round(overall_score, 3),
            question_score=round(question_score, 3),
            answer_score=round(answer_score, 3),
            relevance_score=round(relevance_score, 3),
            issues=issues,
            suggestions=suggestions,
        )

    def _evaluate_question(self, question: str) -> tuple:
        """
        评估问题质量

        评估标准:
        - 长度合适
        - 包含疑问词或问号
        - 清晰明确
        - 无乱码/特殊字符
        """
        issues = []
        suggestions = []
        score = 1.0

        # 清理文本
        question = question.strip()

        # 长度检查
        if len(question) < self.MIN_QUESTION_LENGTH:
            score -= 0.5  # 增加惩罚力度
            issues.append("问题过短")
            suggestions.append("问题应该更具体详细")

        if len(question) > 500:
            score -= 0.1
            issues.append("问题过长")
            suggestions.append("问题应该简洁明了")

        # 问号检查
        question_markers = ["?", "？", "吗", "呢", "什么", "怎么", "如何", "多少", "哪"]
        has_question_marker = any(m in question for m in question_markers)
        if not has_question_marker:
            score -= 0.1
            issues.append("缺少疑问词或问号")

        # 乱码检查
        if self._has_gibberish(question):
            score -= 0.3
            issues.append("包含乱码或异常字符")

        # 重复字符检查
        if self._has_excessive_repetition(question):
            score -= 0.2
            issues.append("包含过多重复字符")

        return max(0, score), issues, suggestions

    def _evaluate_answer(self, answer: str) -> tuple:
        """
        评估回答质量

        评估标准:
        - 长度充足
        - 信息完整
        - 格式规范
        - 无乱码
        """
        issues = []
        suggestions = []
        score = 1.0

        # 清理文本
        answer = answer.strip()

        # 长度检查
        if len(answer) < self.MIN_ANSWER_LENGTH:
            score -= 0.6  # 增加惩罚力度
            issues.append("回答过短")
            suggestions.append("回答应该提供更多信息")

        # 信息量检查（通过词数估算）
        word_count = len(answer)
        if word_count < 20:
            score -= 0.1
            suggestions.append("回答信息量较少")

        # 乱码检查
        if self._has_gibberish(answer):
            score -= 0.3
            issues.append("包含乱码或异常字符")

        # 重复字符检查
        if self._has_excessive_repetition(answer):
            score -= 0.2
            issues.append("包含过多重复内容")

        # 完整性检查（是否以句号等结尾）
        if answer and answer[-1] not in "。.!！?？)）」』":
            score -= 0.05
            suggestions.append("回答可能不完整")

        # 格式检查（有结构化内容加分）
        if any(marker in answer for marker in ["1.", "2.", "•", "-", "："]):
            score = min(score + 0.05, 1.0)

        return max(0, score), issues, suggestions

    def _evaluate_relevance(
        self,
        question: str,
        answer: str,
        category: Optional[str],
    ) -> tuple:
        """
        评估问答相关性

        评估标准:
        - 回答是否针对问题
        - 是否包含领域关键词
        - 是否有信息重叠
        """
        issues = []
        suggestions = []
        score = 1.0

        combined_text = question + answer

        # 领域相关性（是否和和服租赁相关）
        domain_keyword_count = sum(
            1 for kw in self.DOMAIN_KEYWORDS if kw in combined_text
        )
        if domain_keyword_count == 0:
            score -= 0.2
            issues.append("可能与和服租赁领域无关")
        elif domain_keyword_count >= 3:
            score = min(score + 0.1, 1.0)

        # 词汇重叠（问题和回答应有一定关联）
        q_chars = set(question)
        a_chars = set(answer)
        overlap_ratio = len(q_chars & a_chars) / max(len(q_chars), 1)

        if overlap_ratio < 0.1:
            score -= 0.1
            issues.append("问答内容关联度较低")

        # 回答不应该是简单复述问题
        if len(answer) < len(question) * 1.5 and overlap_ratio > 0.8:
            score -= 0.2
            issues.append("回答可能只是复述问题")
            suggestions.append("回答应该提供问题之外的信息")

        return max(0, score), issues, suggestions

    def _has_gibberish(self, text: str) -> bool:
        """检查是否包含乱码"""
        # 检查异常字符比例
        normal_pattern = re.compile(
            r"[\u4e00-\u9fff\u3040-\u30ff\u31f0-\u31ff"  # 中文、日文假名
            r"a-zA-Z0-9"  # 英文数字
            r"\s\.,!?;:，。！？；：（）()「」『』【】\[\]"  # 常用标点
            r"・ー〜～\-_/\\@#$%&*+=\"''"  # 其他常用符号
            r"]"
        )
        abnormal_chars = normal_pattern.sub("", text)
        if len(text) > 0 and len(abnormal_chars) / len(text) > 0.1:
            return True
        return False

    def _has_excessive_repetition(self, text: str) -> bool:
        """检查是否有过多重复"""
        # 检查连续重复字符
        for i in range(len(text) - 2):
            if text[i] == text[i + 1] == text[i + 2]:
                if text[i] not in "。...！！！？？？":  # 排除常见重复
                    return True

        # 检查重复短语
        words = text.split()
        if len(words) > 5:
            for i in range(len(words) - 1):
                phrase = " ".join(words[i:i+2])
                if text.count(phrase) > 2:
                    return True

        return False

    def batch_evaluate(
        self,
        qa_pairs: List[dict],
    ) -> dict:
        """
        批量评估问答对

        Args:
            qa_pairs: 问答对列表 [{"question": ..., "answer": ..., "category": ...}, ...]

        Returns:
            批量评估结果
        """
        results = []
        total_score = 0

        for qa in qa_pairs:
            report = self.evaluate(
                question=qa.get("question", ""),
                answer=qa.get("answer", ""),
                category=qa.get("category"),
            )
            results.append({
                "question": qa.get("question", "")[:50] + "...",
                "score": report.overall_score,
                "issues": report.issues,
            })
            total_score += report.overall_score

        avg_score = total_score / len(qa_pairs) if qa_pairs else 0

        # 分数分布统计
        score_distribution = {
            "excellent": sum(1 for r in results if r["score"] >= 0.9),
            "good": sum(1 for r in results if 0.7 <= r["score"] < 0.9),
            "fair": sum(1 for r in results if 0.5 <= r["score"] < 0.7),
            "poor": sum(1 for r in results if r["score"] < 0.5),
        }

        return {
            "total": len(qa_pairs),
            "average_score": round(avg_score, 3),
            "score_distribution": score_distribution,
            "low_quality_items": [
                r for r in results if r["score"] < 0.5
            ],
        }
