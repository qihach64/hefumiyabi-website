"""
Learning Rules
语料学习规则引擎 - 自动判断反馈处理方式
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class RuleAction(Enum):
    """规则动作"""
    AUTO_APPROVE = "auto_approve"      # 自动通过
    REQUIRE_REVIEW = "require_review"  # 需要人工审核
    AUTO_FLAG = "auto_flag"            # 自动标记问题
    AUTO_REJECT = "auto_reject"        # 自动拒绝


@dataclass
class RuleResult:
    """规则判断结果"""
    action: RuleAction
    reason: str
    confidence: float = 1.0  # 置信度 0-1


class LearningRules:
    """
    语料学习规则

    根据计划文档 3.4 节定义的规则:
    1. 自动通过条件: 评分5星 + 正向反馈 + 出现3次以上
    2. 需要审核: 纠偏答案、中等评分(2-4)
    3. 自动标记问题: 评分1星、5次以上负反馈
    """

    # 自动通过规则
    AUTO_APPROVE_CONDITIONS = {
        "min_rating": 5,                  # 评分 5 星
        "feedback_type": "positive",      # 正向反馈
        "min_occurrences": 3,             # 同类问题出现 3 次以上
    }

    # 需要审核的情况
    REQUIRE_REVIEW = {
        "corrected_answers": True,        # 所有纠偏答案
        "rating_range": (2, 4),           # 中等评分
    }

    # 自动标记问题
    AUTO_FLAG_CONDITIONS = {
        "max_rating": 1,                  # 评分 1 星
        "negative_count": 5,              # 5 次以上负反馈
    }

    def evaluate(
        self,
        rating: int,
        feedback_type: str,
        has_correction: bool,
        occurrence_count: int = 1,
        negative_count: int = 0,
    ) -> RuleResult:
        """
        评估反馈应该如何处理

        Args:
            rating: 评分 1-5
            feedback_type: 反馈类型 (positive/negative/corrected)
            has_correction: 是否有纠偏答案
            occurrence_count: 同类问题出现次数
            negative_count: 该问题的负向反馈次数

        Returns:
            RuleResult: 规则判断结果
        """
        # 1. 检查自动标记问题条件
        if self._should_auto_flag(rating, negative_count):
            return RuleResult(
                action=RuleAction.AUTO_FLAG,
                reason=f"低评分({rating})或负反馈过多({negative_count}次)",
                confidence=0.9,
            )

        # 2. 检查需要审核条件
        if self._should_require_review(rating, has_correction):
            return RuleResult(
                action=RuleAction.REQUIRE_REVIEW,
                reason="纠偏答案需要人工审核" if has_correction else f"中等评分({rating})需要审核",
                confidence=0.8,
            )

        # 3. 检查自动通过条件
        if self._should_auto_approve(rating, feedback_type, occurrence_count):
            return RuleResult(
                action=RuleAction.AUTO_APPROVE,
                reason=f"高评分({rating}) + 正向反馈 + 出现{occurrence_count}次",
                confidence=0.95,
            )

        # 4. 默认需要审核
        return RuleResult(
            action=RuleAction.REQUIRE_REVIEW,
            reason="不满足自动处理条件，需要人工审核",
            confidence=0.5,
        )

    def _should_auto_approve(
        self,
        rating: int,
        feedback_type: str,
        occurrence_count: int,
    ) -> bool:
        """判断是否应该自动通过"""
        return (
            rating >= self.AUTO_APPROVE_CONDITIONS["min_rating"]
            and feedback_type == self.AUTO_APPROVE_CONDITIONS["feedback_type"]
            and occurrence_count >= self.AUTO_APPROVE_CONDITIONS["min_occurrences"]
        )

    def _should_require_review(
        self,
        rating: int,
        has_correction: bool,
    ) -> bool:
        """判断是否需要人工审核"""
        # 纠偏答案总是需要审核
        if has_correction and self.REQUIRE_REVIEW["corrected_answers"]:
            return True

        # 中等评分需要审核
        min_rating, max_rating = self.REQUIRE_REVIEW["rating_range"]
        if min_rating <= rating <= max_rating:
            return True

        return False

    def _should_auto_flag(
        self,
        rating: int,
        negative_count: int,
    ) -> bool:
        """判断是否应该自动标记为问题"""
        return (
            rating <= self.AUTO_FLAG_CONDITIONS["max_rating"]
            or negative_count >= self.AUTO_FLAG_CONDITIONS["negative_count"]
        )

    def check_auto_approve_batch(
        self,
        feedbacks: list,
    ) -> list:
        """
        批量检查可以自动通过的反馈

        Args:
            feedbacks: 反馈列表，每个元素需要有 rating, feedback_type, occurrence_count

        Returns:
            可以自动通过的反馈 ID 列表
        """
        auto_approve_ids = []
        for fb in feedbacks:
            if self._should_auto_approve(
                rating=fb.get("rating", 0),
                feedback_type=fb.get("feedback_type", ""),
                occurrence_count=fb.get("occurrence_count", 1),
            ):
                auto_approve_ids.append(fb.get("id"))
        return auto_approve_ids

    def get_rules_summary(self) -> dict:
        """获取规则配置摘要"""
        return {
            "auto_approve": self.AUTO_APPROVE_CONDITIONS,
            "require_review": self.REQUIRE_REVIEW,
            "auto_flag": self.AUTO_FLAG_CONDITIONS,
        }


# 全局规则实例
_rules_instance: Optional[LearningRules] = None


def get_learning_rules() -> LearningRules:
    """获取全局学习规则实例"""
    global _rules_instance
    if _rules_instance is None:
        _rules_instance = LearningRules()
    return _rules_instance
