"""
Template Service
通用模板语料服务 - Phase 4

提供以下功能:
1. 语料通用性分析
2. 通用模板提取
3. 新商家初始化
"""

import json
import re
import uuid
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# 通用语料判断标准
UNIVERSAL_CRITERIA = {
    # 可作为通用模板的类别
    "universal_categories": [
        "general",           # 一般性问题（和服知识、文化等）
        "size_style",        # 尺寸款式（通用部分）
        "photo",             # 摄影相关（通用部分）
        "hair_makeup",       # 发型化妆（通用部分）
    ],

    # 需要商家定制的类别（不能作为通用模板）
    "tenant_specific_categories": [
        "pricing",           # 价格（每家不同）
        "booking",           # 预约（流程可能不同）
        "location",          # 地点（每家不同）
        "return_policy",     # 归还政策（每家不同）
    ],

    # 通用语料关键词（包含这些词的更可能是通用语料）
    "universal_keywords": [
        # 日语
        "和服", "着物", "袴", "浴衣", "振袖", "訪問着",
        "サイズ", "身長", "体重",
        "着付け", "帯", "草履", "足袋",
        "撮影", "写真",
        "ヘアセット", "メイク",
        # 中文
        "和服", "浴衣", "袴",
        "尺寸", "身高", "体重",
        "穿着", "穿法",
        "拍照", "摄影", "照片",
        "发型", "化妆",
        # 英文
        "kimono", "yukata", "hakama",
        "size", "height", "weight",
        "wear", "dress",
        "photo", "picture",
        "hair", "makeup",
    ],

    # 需排除的词（包含这些词的是特定商家语料，不能作为通用模板）
    "exclude_keywords": [
        # 价格相关
        "円", "日元", "日圓", "元", "yen", "¥", "price", "料金", "費用",
        "优惠", "優惠", "折扣", "discount", "割引",
        "klook", "Klook", "KLOOK",
        # 店铺相关
        "我们店", "我們店", "当店", "本店", "our shop", "our store",
        "kimono one", "Kimono One", "KIMONO ONE",
        # 地址相关
        "位于", "位於", "地址", "address", "〒",
        "京都", "东京", "東京", "大阪", "浅草", "淺草",
        # 预约相关
        "预约", "預約", "予約", "reservation", "book",
        "电话", "電話", "phone", "tel",
        # 营业时间
        "营业", "營業", "开门", "開門", "关门", "關門",
        "17:00", "17:30", "18:00", "9:00", "10:00",
    ],

    # 质量分数阈值
    "min_quality_score": 0.7,

    # 问题最小长度（太短的问题通用性差）
    "min_question_length": 10,

    # 答案最小长度
    "min_answer_length": 10,
}


@dataclass
class QAPair:
    """QA 对数据结构"""
    question: str
    answer: str
    category: str
    source: str = "template"
    quality_score: float = 0.8
    keywords: List[str] = field(default_factory=list)
    conversation_id: str = ""
    is_universal: bool = False
    universal_score: float = 0.0
    exclude_reasons: List[str] = field(default_factory=list)


@dataclass
class AnalysisReport:
    """语料分析报告"""
    total_qa_pairs: int = 0
    universal_candidates: int = 0
    excluded_count: int = 0
    category_distribution: Dict[str, int] = field(default_factory=dict)
    universal_by_category: Dict[str, int] = field(default_factory=dict)
    exclude_reasons_distribution: Dict[str, int] = field(default_factory=dict)
    avg_quality_score: float = 0.0
    avg_universal_score: float = 0.0


class TemplateService:
    """通用模板服务"""

    def __init__(self, criteria: Dict = None):
        self.criteria = criteria or UNIVERSAL_CRITERIA

    def analyze_qa_pair(self, qa: Dict) -> QAPair:
        """分析单个 QA 对的通用性"""
        question = qa.get("question", "")
        answer = qa.get("answer", "")
        category = qa.get("category", "")
        quality_score = qa.get("quality_score", 0.8)

        pair = QAPair(
            question=question,
            answer=answer,
            category=category,
            source=qa.get("source", ""),
            quality_score=quality_score,
            keywords=qa.get("keywords", []),
            conversation_id=qa.get("conversation_id", ""),
        )

        exclude_reasons = []
        universal_score = 0.0

        # 1. 检查类别
        if category in self.criteria["universal_categories"]:
            universal_score += 0.3
        elif category in self.criteria["tenant_specific_categories"]:
            exclude_reasons.append(f"tenant_specific_category:{category}")

        # 2. 检查质量分数
        if quality_score >= self.criteria["min_quality_score"]:
            universal_score += 0.2
        else:
            exclude_reasons.append(f"low_quality:{quality_score:.2f}")

        # 3. 检查长度
        if len(question) < self.criteria["min_question_length"]:
            exclude_reasons.append(f"short_question:{len(question)}")
        if len(answer) < self.criteria["min_answer_length"]:
            exclude_reasons.append(f"short_answer:{len(answer)}")

        # 4. 检查排除关键词
        combined_text = f"{question} {answer}".lower()
        for keyword in self.criteria["exclude_keywords"]:
            if keyword.lower() in combined_text:
                exclude_reasons.append(f"exclude_keyword:{keyword}")
                break  # 只记录第一个匹配的

        # 5. 检查通用关键词（加分）
        universal_keyword_count = 0
        for keyword in self.criteria["universal_keywords"]:
            if keyword.lower() in combined_text:
                universal_keyword_count += 1

        if universal_keyword_count > 0:
            universal_score += min(0.3, universal_keyword_count * 0.1)

        # 6. 内容质量评估
        # 答案包含具体信息而非仅是简单回复
        if len(answer) > 50:
            universal_score += 0.1
        if len(answer) > 100:
            universal_score += 0.1

        pair.universal_score = min(1.0, universal_score)
        pair.exclude_reasons = exclude_reasons
        pair.is_universal = len(exclude_reasons) == 0 and universal_score >= 0.4

        return pair

    def analyze_corpus(self, qa_pairs: List[Dict]) -> Tuple[List[QAPair], AnalysisReport]:
        """分析整个语料库"""
        analyzed_pairs = []
        report = AnalysisReport()

        report.total_qa_pairs = len(qa_pairs)

        quality_scores = []
        universal_scores = []

        for qa in qa_pairs:
            pair = self.analyze_qa_pair(qa)
            analyzed_pairs.append(pair)

            # 统计类别
            category = pair.category
            report.category_distribution[category] = report.category_distribution.get(category, 0) + 1

            # 统计质量分数
            quality_scores.append(pair.quality_score)
            universal_scores.append(pair.universal_score)

            # 统计通用语料
            if pair.is_universal:
                report.universal_candidates += 1
                report.universal_by_category[category] = report.universal_by_category.get(category, 0) + 1
            else:
                report.excluded_count += 1
                for reason in pair.exclude_reasons:
                    reason_type = reason.split(":")[0]
                    report.exclude_reasons_distribution[reason_type] = \
                        report.exclude_reasons_distribution.get(reason_type, 0) + 1

        # 计算平均分
        if quality_scores:
            report.avg_quality_score = sum(quality_scores) / len(quality_scores)
        if universal_scores:
            report.avg_universal_score = sum(universal_scores) / len(universal_scores)

        return analyzed_pairs, report

    def extract_universal_templates(
        self,
        qa_pairs: List[Dict],
        min_score: float = 0.4,
        max_count: int = 1000
    ) -> List[QAPair]:
        """提取通用模板语料"""
        analyzed_pairs, _ = self.analyze_corpus(qa_pairs)

        # 筛选通用语料
        universal_pairs = [
            p for p in analyzed_pairs
            if p.is_universal and p.universal_score >= min_score
        ]

        # 按通用性分数排序
        universal_pairs.sort(key=lambda x: x.universal_score, reverse=True)

        # 限制数量
        return universal_pairs[:max_count]

    def clean_for_template(self, pair: QAPair) -> QAPair:
        """清理 QA 对使其更通用"""
        cleaned_answer = pair.answer

        # 移除可能的店铺特定信息
        # 这里可以添加更多清理规则
        patterns_to_remove = [
            r'❤️.*?❤️',  # 移除表情包装的店名
            r'\(.*?\d{4}.*?am\)',  # 移除时间戳
            r'\(.*?\d{4}.*?pm\)',
        ]

        for pattern in patterns_to_remove:
            cleaned_answer = re.sub(pattern, '', cleaned_answer)

        cleaned_answer = cleaned_answer.strip()

        return QAPair(
            question=pair.question,
            answer=cleaned_answer if cleaned_answer else pair.answer,
            category=pair.category,
            source="template",
            quality_score=pair.quality_score,
            keywords=pair.keywords,
            is_universal=True,
            universal_score=pair.universal_score,
        )

    def generate_report_text(self, report: AnalysisReport) -> str:
        """生成文本格式的分析报告"""
        lines = [
            "=" * 60,
            "语料通用性分析报告",
            "=" * 60,
            "",
            f"总 QA 对数量: {report.total_qa_pairs}",
            f"通用候选数量: {report.universal_candidates}",
            f"排除数量: {report.excluded_count}",
            f"通用率: {report.universal_candidates / report.total_qa_pairs * 100:.1f}%",
            "",
            f"平均质量分数: {report.avg_quality_score:.3f}",
            f"平均通用性分数: {report.avg_universal_score:.3f}",
            "",
            "类别分布:",
            "-" * 40,
        ]

        for category, count in sorted(report.category_distribution.items(), key=lambda x: -x[1]):
            universal_count = report.universal_by_category.get(category, 0)
            rate = universal_count / count * 100 if count > 0 else 0
            lines.append(f"  {category}: {count} (通用: {universal_count}, {rate:.1f}%)")

        lines.extend([
            "",
            "排除原因分布:",
            "-" * 40,
        ])

        for reason, count in sorted(report.exclude_reasons_distribution.items(), key=lambda x: -x[1]):
            lines.append(f"  {reason}: {count}")

        lines.append("")
        lines.append("=" * 60)

        return "\n".join(lines)


class TenantInitializationService:
    """商家初始化服务"""

    def __init__(
        self,
        session: AsyncSession = None,
        vector_store=None,
        template_service: TemplateService = None
    ):
        self.session = session
        self.vector_store = vector_store
        self.template_service = template_service or TemplateService()
        self._templates_cache: List[QAPair] = []

    def load_templates_from_file(self, file_path: str) -> List[QAPair]:
        """从文件加载模板语料"""
        path = Path(file_path)
        if not path.exists():
            return []

        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        templates = []
        for item in data.get("templates", []):
            templates.append(QAPair(
                question=item.get("question", ""),
                answer=item.get("answer", ""),
                category=item.get("category", "general"),
                source="template",
                quality_score=item.get("quality_score", 0.8),
                keywords=item.get("keywords", []),
                is_universal=True,
                universal_score=item.get("universal_score", 0.8),
            ))

        self._templates_cache = templates
        return templates

    def get_templates(self) -> List[QAPair]:
        """获取缓存的模板"""
        return self._templates_cache

    async def initialize_tenant(
        self,
        tenant_id: str,
        tenant_name: str,
        copy_templates: bool = True
    ) -> Dict:
        """
        初始化新商家

        Args:
            tenant_id: 商家 ID
            tenant_name: 商家名称
            copy_templates: 是否复制通用模板

        Returns:
            初始化结果
        """
        from database.models import Tenant, QAPair as QAPairModel

        result = {
            "tenant_id": tenant_id,
            "tenant_name": tenant_name,
            "namespace": f"tenant_{tenant_id}",
            "templates_copied": 0,
            "vector_synced": 0,
            "success": False,
            "message": "",
        }

        try:
            # 1. 检查商家是否已存在
            existing = await self.session.execute(
                select(Tenant).where(Tenant.id == tenant_id)
            )
            if existing.scalar_one_or_none():
                result["message"] = "商家已存在"
                return result

            # 2. 创建商家记录
            namespace = f"tenant_{tenant_id}"
            tenant = Tenant(
                id=tenant_id,
                name=tenant_name,
                namespace=namespace,
                status="active",
                settings={
                    "initialized_at": datetime.now().isoformat(),
                    "template_version": "1.0",
                }
            )
            self.session.add(tenant)

            # 3. 复制通用模板到商家语料库
            if copy_templates and self._templates_cache:
                for template in self._templates_cache:
                    qa_pair = QAPairModel(
                        tenant_id=tenant_id,
                        question=template.question,
                        answer=template.answer,
                        category=template.category,
                        source="template",
                        quality_score=template.quality_score,
                        keywords=",".join(template.keywords) if template.keywords else None,
                        is_synced=False,
                    )
                    self.session.add(qa_pair)
                    result["templates_copied"] += 1

            # 4. 同步到向量库（如果配置了）
            if self.vector_store and copy_templates:
                try:
                    for template in self._templates_cache:
                        await self._sync_to_vector_store(
                            template,
                            namespace=namespace
                        )
                        result["vector_synced"] += 1
                except Exception as e:
                    result["message"] = f"向量同步部分失败: {e}"

            await self.session.commit()

            result["success"] = True
            result["message"] = "初始化成功"

        except Exception as e:
            await self.session.rollback()
            result["message"] = f"初始化失败: {e}"

        return result

    async def _sync_to_vector_store(self, template: QAPair, namespace: str):
        """同步单个模板到向量库"""
        if not self.vector_store:
            return

        # 生成向量 ID
        vector_id = f"template_{uuid.uuid4().hex[:8]}"

        # 上传到向量库
        await self.vector_store.upsert_qa_pair(
            question=template.question,
            answer=template.answer,
            category=template.category,
            namespace=namespace,
            metadata={
                "source": "template",
                "quality_score": template.quality_score,
            }
        )


def load_qa_pairs_from_file(file_path: str) -> List[Dict]:
    """从 JSON 文件加载 QA 对"""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"文件不存在: {file_path}")

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return data.get("qa_pairs", [])


def save_templates_to_file(templates: List[QAPair], file_path: str):
    """保存模板到 JSON 文件"""
    data = {
        "metadata": {
            "total": len(templates),
            "generated_at": datetime.now().isoformat(),
            "version": "1.0",
        },
        "templates": [
            {
                "question": t.question,
                "answer": t.answer,
                "category": t.category,
                "quality_score": t.quality_score,
                "universal_score": t.universal_score,
                "keywords": t.keywords,
            }
            for t in templates
        ]
    }

    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
