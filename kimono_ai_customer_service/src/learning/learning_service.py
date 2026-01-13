"""
Learning Service
语料学习服务 - 处理反馈并应用到知识库
"""

from datetime import datetime
from typing import Optional, List
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Feedback, QAPair
from database.repositories import FeedbackRepository, QAPairRepository
from knowledge.vector_store import VectorStoreManager
from .rules import LearningRules, RuleAction, get_learning_rules


@dataclass
class LearningResult:
    """学习结果"""
    feedback_id: int
    success: bool
    action: str  # "created", "updated", "rejected", "skipped"
    qa_pair_id: Optional[int] = None
    vector_id: Optional[str] = None
    message: str = ""


@dataclass
class LearningStats:
    """学习统计"""
    processed: int = 0
    created: int = 0
    updated: int = 0
    rejected: int = 0
    skipped: int = 0
    errors: int = 0


class LearningService:
    """
    语料学习服务

    功能:
    1. 纠偏反馈自动应用 - 将用户纠正的答案添加到知识库
    2. 正向反馈强化 - 提升高评分问答对的质量分数
    3. 负向反馈降权 - 降低低评分问答对的质量分数
    """

    # 质量分数调整参数
    POSITIVE_BOOST = 0.05  # 正向反馈增加的分数
    NEGATIVE_PENALTY = 0.03  # 负向反馈减少的分数
    MAX_QUALITY_SCORE = 1.0
    MIN_QUALITY_SCORE = 0.1

    # 阈值
    MIN_QUALITY_FOR_SYNC = 0.4  # 同步到向量库的最低质量分数
    CORRECTION_INITIAL_SCORE = 0.75  # 纠偏创建的问答对初始分数

    def __init__(
        self,
        session: AsyncSession,
        vector_store: Optional[VectorStoreManager] = None,
        rules: Optional[LearningRules] = None,
    ):
        """
        初始化学习服务

        Args:
            session: 数据库会话
            vector_store: 向量存储管理器
            rules: 学习规则引擎
        """
        self.session = session
        self.vector_store = vector_store
        self.feedback_repo = FeedbackRepository(session)
        self.qa_repo = QAPairRepository(session)
        self.rules = rules or get_learning_rules()

    async def process_pending_feedbacks(
        self,
        tenant_id: Optional[str] = None,
        limit: int = 100,
    ) -> LearningStats:
        """
        处理待处理的反馈

        Args:
            tenant_id: 商家 ID（可选，不指定则处理所有）
            limit: 最大处理数量

        Returns:
            学习统计信息
        """
        stats = LearningStats()

        # 获取待处理的反馈
        pending = await self.feedback_repo.get_pending(tenant_id=tenant_id, limit=limit)

        for feedback in pending:
            try:
                result = await self._process_single_feedback(feedback)
                stats.processed += 1

                if result.success:
                    if result.action == "created":
                        stats.created += 1
                    elif result.action == "updated":
                        stats.updated += 1
                    elif result.action == "rejected":
                        stats.rejected += 1
                    elif result.action == "skipped":
                        stats.skipped += 1
                else:
                    stats.errors += 1

            except Exception as e:
                print(f"处理反馈 {feedback.id} 失败: {e}")
                stats.errors += 1

        # 提交所有更改
        await self.session.commit()

        return stats

    async def _process_single_feedback(self, feedback: Feedback) -> LearningResult:
        """
        处理单条反馈

        Args:
            feedback: 反馈记录

        Returns:
            学习结果
        """
        # 根据反馈类型分发处理
        if feedback.feedback_type == "corrected" and feedback.corrected_answer:
            return await self._apply_correction(feedback)
        elif feedback.feedback_type == "positive":
            return await self._apply_positive_feedback(feedback)
        elif feedback.feedback_type == "negative":
            return await self._apply_negative_feedback(feedback)
        else:
            # 跳过未知类型
            await self.feedback_repo.update_status(feedback.id, "skipped")
            return LearningResult(
                feedback_id=feedback.id,
                success=True,
                action="skipped",
                message="未知反馈类型",
            )

    async def _apply_correction(self, feedback: Feedback) -> LearningResult:
        """
        应用纠偏反馈 - 创建或更新问答对

        策略:
        1. 检查是否存在相似问题（通过向量搜索）
        2. 如果存在高相似度的，更新其答案
        3. 否则创建新的问答对
        4. 同步到向量库
        """
        question = feedback.user_question
        corrected_answer = feedback.corrected_answer
        tenant_id = feedback.tenant_id

        # 确定命名空间（租户 ID 或默认）
        namespace = tenant_id or ""

        # 1. 检查是否存在相似问题
        existing_qa = None
        if self.vector_store:
            similar = self.vector_store.search(
                query=question,
                top_k=1,
                namespace=namespace,
            )
            # 如果相似度很高（> 0.95），认为是同一个问题
            if similar and similar[0].score > 0.95:
                # 尝试找到对应的 QAPair
                existing_list = await self.qa_repo.search(
                    keyword=similar[0].question[:50],
                    tenant_id=tenant_id,
                    limit=1,
                )
                if existing_list:
                    existing_qa = existing_list[0]

        # 2. 创建或更新问答对
        if existing_qa:
            # 更新现有问答对
            await self.qa_repo.update(
                qa_id=existing_qa.id,
                answer=corrected_answer,
                quality_score=min(
                    existing_qa.quality_score + self.POSITIVE_BOOST,
                    self.MAX_QUALITY_SCORE,
                ),
            )
            qa_pair = existing_qa
            action = "updated"
        else:
            # 创建新问答对
            qa_pair = await self.qa_repo.create(
                question=question,
                answer=corrected_answer,
                tenant_id=tenant_id,
                category=self._get_category(feedback, question),
                source="feedback",
                quality_score=self.CORRECTION_INITIAL_SCORE,
                source_feedback_id=feedback.id,
            )
            action = "created"

        # 3. 同步到向量库
        vector_id = None
        if self.vector_store and qa_pair.quality_score >= self.MIN_QUALITY_FOR_SYNC:
            vector_id = self.vector_store.upsert_single(
                question=qa_pair.question,
                answer=qa_pair.answer,
                category=qa_pair.category or "",
                namespace=namespace,
                quality_score=qa_pair.quality_score,
                source="feedback",
            )
            if vector_id:
                await self.qa_repo.mark_synced(qa_pair.id, vector_id)

        # 4. 更新反馈状态
        await self.feedback_repo.update_status(
            feedback_id=feedback.id,
            status="applied",
            applied_qa_id=qa_pair.id,
        )

        return LearningResult(
            feedback_id=feedback.id,
            success=True,
            action=action,
            qa_pair_id=qa_pair.id,
            vector_id=vector_id,
            message=f"纠偏已应用: {action}",
        )

    async def _apply_positive_feedback(self, feedback: Feedback) -> LearningResult:
        """
        应用正向反馈 - 提升相关问答对的质量分数

        策略:
        1. 通过向量搜索找到最相关的问答对
        2. 提升其质量分数
        3. 更新向量库元数据
        """
        question = feedback.user_question
        tenant_id = feedback.tenant_id
        namespace = tenant_id or ""

        # 查找相似问答
        updated_qa = None
        if self.vector_store:
            similar = self.vector_store.search(
                query=question,
                top_k=1,
                namespace=namespace,
            )
            if similar and similar[0].score > 0.8:
                # 找到对应的 QAPair 并更新
                existing_list = await self.qa_repo.search(
                    keyword=similar[0].question[:50],
                    tenant_id=tenant_id,
                    limit=1,
                )
                if existing_list:
                    qa = existing_list[0]
                    new_score = min(
                        qa.quality_score + self.POSITIVE_BOOST,
                        self.MAX_QUALITY_SCORE,
                    )
                    await self.qa_repo.update(qa_id=qa.id, quality_score=new_score)
                    updated_qa = qa

                    # 更新向量库元数据
                    if qa.vector_id:
                        self.vector_store.update_metadata(
                            vector_id=qa.vector_id,
                            metadata={"quality_score": new_score},
                            namespace=namespace,
                        )

        # 更新反馈状态
        await self.feedback_repo.update_status(
            feedback_id=feedback.id,
            status="applied",
            applied_qa_id=updated_qa.id if updated_qa else None,
        )

        return LearningResult(
            feedback_id=feedback.id,
            success=True,
            action="updated" if updated_qa else "skipped",
            qa_pair_id=updated_qa.id if updated_qa else None,
            message="正向反馈已应用" if updated_qa else "未找到匹配的问答对",
        )

    async def _apply_negative_feedback(self, feedback: Feedback) -> LearningResult:
        """
        应用负向反馈 - 降低相关问答对的质量分数

        策略:
        1. 通过向量搜索找到最相关的问答对
        2. 降低其质量分数
        3. 如果分数过低，可能从向量库移除
        """
        question = feedback.user_question
        tenant_id = feedback.tenant_id
        namespace = tenant_id or ""

        updated_qa = None
        if self.vector_store:
            similar = self.vector_store.search(
                query=question,
                top_k=1,
                namespace=namespace,
            )
            if similar and similar[0].score > 0.8:
                existing_list = await self.qa_repo.search(
                    keyword=similar[0].question[:50],
                    tenant_id=tenant_id,
                    limit=1,
                )
                if existing_list:
                    qa = existing_list[0]
                    new_score = max(
                        qa.quality_score - self.NEGATIVE_PENALTY,
                        self.MIN_QUALITY_SCORE,
                    )
                    await self.qa_repo.update(qa_id=qa.id, quality_score=new_score)
                    updated_qa = qa

                    # 如果分数低于阈值，从向量库移除
                    if new_score < self.MIN_QUALITY_FOR_SYNC and qa.vector_id:
                        self.vector_store.delete_vector(qa.vector_id, namespace)
                        qa.is_synced = False
                        qa.vector_id = None
                    elif qa.vector_id:
                        # 更新向量库元数据
                        self.vector_store.update_metadata(
                            vector_id=qa.vector_id,
                            metadata={"quality_score": new_score},
                            namespace=namespace,
                        )

        # 更新反馈状态
        await self.feedback_repo.update_status(
            feedback_id=feedback.id,
            status="applied",
            applied_qa_id=updated_qa.id if updated_qa else None,
        )

        return LearningResult(
            feedback_id=feedback.id,
            success=True,
            action="updated" if updated_qa else "skipped",
            qa_pair_id=updated_qa.id if updated_qa else None,
            message="负向反馈已应用" if updated_qa else "未找到匹配的问答对",
        )

    def _get_category(self, feedback: Feedback, question: str) -> str:
        """
        获取分类，优先使用手动指定的分类

        Args:
            feedback: 反馈对象
            question: 问题文本

        Returns:
            分类名称
        """
        # 优先使用手动指定的分类
        if feedback.extra_data and feedback.extra_data.get("manual_category"):
            return feedback.extra_data["manual_category"]

        # 否则使用自动分类
        return self._detect_category(question)

    def _detect_category(self, question: str) -> str:
        """
        简单的分类检测

        Args:
            question: 问题文本

        Returns:
            分类名称
        """
        # 关键词映射
        category_keywords = {
            "预约": ["预约", "预定", "订", "booking"],
            "价格": ["价格", "多少钱", "费用", "收费", "优惠"],
            "款式": ["款式", "颜色", "花纹", "样式", "图案"],
            "流程": ["流程", "步骤", "怎么", "如何"],
            "时间": ["时间", "几点", "营业", "开门", "关门"],
            "位置": ["地址", "位置", "在哪", "怎么走"],
            "退换": ["退", "换", "取消", "修改"],
        }

        question_lower = question.lower()
        for category, keywords in category_keywords.items():
            for kw in keywords:
                if kw in question_lower:
                    return category

        return "其他"

    async def sync_unsynced_qa_pairs(
        self,
        tenant_id: Optional[str] = None,
        limit: int = 100,
    ) -> dict:
        """
        同步未同步的问答对到向量库

        Args:
            tenant_id: 商家 ID（None 则同步所有商家）
            limit: 最大数量

        Returns:
            同步统计
        """
        if not self.vector_store:
            return {"error": "向量存储未初始化", "synced": 0}

        unsynced = await self.qa_repo.get_unsynced(tenant_id=tenant_id, limit=limit)

        synced_count = 0
        error_count = 0

        for qa in unsynced:
            if qa.quality_score < self.MIN_QUALITY_FOR_SYNC:
                continue

            # 使用每条记录自己的 tenant_id 作为 namespace
            namespace = qa.tenant_id or ""

            try:
                vector_id = self.vector_store.upsert_single(
                    question=qa.question,
                    answer=qa.answer,
                    category=qa.category or "",
                    namespace=namespace,
                    quality_score=qa.quality_score,
                    source=qa.source,
                )
                if vector_id:
                    await self.qa_repo.mark_synced(qa.id, vector_id)
                    synced_count += 1
            except Exception as e:
                print(f"同步 QAPair {qa.id} 失败: {e}")
                error_count += 1

        await self.session.commit()

        return {
            "total": len(unsynced),
            "synced": synced_count,
            "errors": error_count,
        }

    async def get_learning_statistics(
        self,
        tenant_id: Optional[str] = None,
    ) -> dict:
        """
        获取学习统计信息

        Args:
            tenant_id: 商家 ID

        Returns:
            统计信息
        """
        feedback_stats = await self.feedback_repo.get_statistics(tenant_id=tenant_id)
        qa_stats = await self.qa_repo.get_statistics(tenant_id=tenant_id)

        return {
            "feedback": feedback_stats,
            "qa_pairs": qa_stats,
            "learning": {
                "min_quality_for_sync": self.MIN_QUALITY_FOR_SYNC,
                "positive_boost": self.POSITIVE_BOOST,
                "negative_penalty": self.NEGATIVE_PENALTY,
            },
            "rules": self.rules.get_rules_summary(),
        }

    async def evaluate_feedback_with_rules(
        self,
        feedback: Feedback,
    ) -> dict:
        """
        使用规则引擎评估反馈

        Args:
            feedback: 反馈记录

        Returns:
            评估结果
        """
        tenant_id = feedback.tenant_id

        # 获取相似问题出现次数
        occurrence_count = await self.feedback_repo.get_similar_feedback_count(
            question=feedback.user_question or "",
            tenant_id=tenant_id,
        )

        # 获取负反馈次数
        negative_count = await self.feedback_repo.get_negative_count_for_question(
            question=feedback.user_question or "",
            tenant_id=tenant_id,
        )

        # 使用规则引擎评估
        rule_result = self.rules.evaluate(
            rating=feedback.rating or 0,
            feedback_type=feedback.feedback_type or "",
            has_correction=bool(feedback.corrected_answer),
            occurrence_count=occurrence_count,
            negative_count=negative_count,
        )

        return {
            "feedback_id": feedback.id,
            "action": rule_result.action.value,
            "reason": rule_result.reason,
            "confidence": rule_result.confidence,
            "occurrence_count": occurrence_count,
            "negative_count": negative_count,
        }

    async def process_with_rules(
        self,
        tenant_id: Optional[str] = None,
        limit: int = 100,
        apply_auto_approve: bool = True,
        apply_auto_flag: bool = True,
    ) -> dict:
        """
        使用规则引擎智能处理反馈

        Args:
            tenant_id: 商家 ID
            limit: 最大处理数量
            apply_auto_approve: 是否自动应用符合自动通过条件的反馈
            apply_auto_flag: 是否自动标记问题反馈

        Returns:
            处理统计
        """
        stats = {
            "total": 0,
            "auto_approved": 0,
            "require_review": 0,
            "auto_flagged": 0,
            "processed": 0,
            "errors": 0,
        }

        # 获取待处理反馈
        pending = await self.feedback_repo.get_pending(tenant_id=tenant_id, limit=limit)
        stats["total"] = len(pending)

        for feedback in pending:
            try:
                # 评估反馈
                eval_result = await self.evaluate_feedback_with_rules(feedback)
                action = eval_result["action"]

                if action == "auto_approve" and apply_auto_approve:
                    # 自动通过并应用
                    result = await self._process_single_feedback(feedback)
                    stats["auto_approved"] += 1
                    stats["processed"] += 1

                elif action == "auto_flag" and apply_auto_flag:
                    # 自动标记为问题
                    await self.feedback_repo.update_status(
                        feedback_id=feedback.id,
                        status="flagged",
                    )
                    stats["auto_flagged"] += 1

                elif action == "require_review":
                    # 保持待审核状态
                    stats["require_review"] += 1

            except Exception as e:
                print(f"规则处理反馈 {feedback.id} 失败: {e}")
                stats["errors"] += 1

        await self.session.commit()
        return stats
