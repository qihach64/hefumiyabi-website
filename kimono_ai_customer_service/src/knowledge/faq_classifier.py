"""
FAQ Classifier and Cleaner
FAQ 问答对分类器和清洗器
"""
from __future__ import annotations

import re
import json
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field
from enum import Enum


class FAQCategory(str, Enum):
    """FAQ 分类"""
    BOOKING = "booking"              # 预约相关
    SIZE_STYLE = "size_style"        # 尺寸/款式
    PRICING = "pricing"              # 价格相关
    HAIR_MAKEUP = "hair_makeup"      # 发型/妆容
    RETURN_POLICY = "return_policy"  # 归还政策
    LOCATION = "location"            # 地点/交通
    PHOTO = "photo"                  # 摄影相关
    GENERAL = "general"              # 一般问题
    INVALID = "invalid"              # 无效问答


@dataclass
class CleanedQAPair:
    """清洗后的问答对"""
    question: str
    answer: str
    category: FAQCategory
    source: str
    conversation_id: str
    quality_score: float = 0.0
    keywords: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "question": self.question,
            "answer": self.answer,
            "category": self.category.value,
            "source": self.source,
            "conversation_id": self.conversation_id,
            "quality_score": self.quality_score,
            "keywords": self.keywords,
        }


class FAQClassifier:
    """FAQ 分类器"""

    # 分类关键词
    CATEGORY_KEYWORDS = {
        FAQCategory.BOOKING: [
            "预约", "預約", "予約", "booking", "reserve", "reservation",
            "取消", "キャンセル", "cancel", "改期", "変更", "change",
            "时间", "時間", "time", "几点", "幾點", "what time",
        ],
        FAQCategory.SIZE_STYLE: [
            "尺寸", "サイズ", "size", "大きい", "小さい",
            "款式", "样式", "樣式", "スタイル", "style",
            "颜色", "顏色", "色", "color", "colour",
            "身高", "体重", "體重", "胖", "瘦",
            "振袖", "浴衣", "袴", "和服", "kimono",
        ],
        FAQCategory.PRICING: [
            "价格", "價格", "価格", "price", "多少钱", "多少錢",
            "费用", "費用", "料金", "fee", "cost",
            "套餐", "方案", "プラン", "plan", "package",
            "优惠", "優惠", "割引", "discount",
            "日圓", "日元", "円", "yen",
        ],
        FAQCategory.HAIR_MAKEUP: [
            "发型", "髮型", "ヘアスタイル", "hair",
            "妆", "妝", "メイク", "makeup", "化妆", "化妝",
            "造型", "スタイリング", "styling",
            "kitty", "卡通", "キャラクター",
        ],
        FAQCategory.RETURN_POLICY: [
            "归还", "歸還", "返却", "return",
            "几点还", "幾點還", "何時まで", "when return",
            "延长", "延長", "延期", "extend",
            "过夜", "過夜", "overnight",
        ],
        FAQCategory.LOCATION: [
            "地址", "住所", "address", "location",
            "怎么走", "怎麼走", "行き方", "how to get",
            "交通", "アクセス", "access",
            "哪家店", "哪間店", "which store", "どの店",
            "京都", "东京", "東京", "浅草", "淺草",
        ],
        FAQCategory.PHOTO: [
            "摄影", "攝影", "撮影", "photo", "photograph",
            "拍照", "写真", "picture",
            "摄影师", "攝影師", "カメラマン", "photographer",
        ],
    }

    # 无效模式
    INVALID_PATTERNS = [
        r"^https?://",                    # 纯链接
        r"^\[sticker\]",                  # 贴图
        r"^貼圖",                         # 贴图
        r"^\s*$",                          # 空白
        r"^(ok|好|好的|嗯|是|はい|yes)$",  # 太简短
    ]

    def __init__(self):
        # 编译正则表达式
        self.invalid_patterns = [re.compile(p, re.IGNORECASE) for p in self.INVALID_PATTERNS]

    def _clean_text(self, text: str) -> str:
        """清洗文本"""
        if not text:
            return ""

        # 移除时间戳标记 (如 "❤️Instagram User (Feb 12, 2023 7:20 pm)")
        text = re.sub(r"❤️?[\w\s]+\([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s*[ap]m\)", "", text)

        # 移除重复的 URL
        urls = re.findall(r"https?://\S+", text)
        seen_urls = set()
        for url in urls:
            if url in seen_urls:
                text = text.replace(url, "", 1)
            seen_urls.add(url)

        # 移除多余空白
        text = re.sub(r"\s+", " ", text)

        return text.strip()

    def _is_invalid(self, question: str, answer: str) -> bool:
        """检查是否为无效问答对"""
        # 检查无效模式
        for pattern in self.invalid_patterns:
            if pattern.match(question) or pattern.match(answer):
                return True

        # 问题或回答太短
        if len(question) < 3 or len(answer) < 2:
            return True

        # 问题就是回答
        if question.strip() == answer.strip():
            return True

        return False

    def _classify(self, question: str, answer: str) -> FAQCategory:
        """分类问答对"""
        combined_text = f"{question} {answer}".lower()

        # 统计各分类的匹配数
        scores = {}
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw.lower() in combined_text)
            if score > 0:
                scores[category] = score

        if not scores:
            return FAQCategory.GENERAL

        # 返回得分最高的分类
        return max(scores.keys(), key=lambda k: scores[k])

    def _extract_keywords(self, question: str, answer: str) -> list[str]:
        """提取关键词"""
        keywords = set()
        combined_text = f"{question} {answer}".lower()

        for category, kw_list in self.CATEGORY_KEYWORDS.items():
            for kw in kw_list:
                if kw.lower() in combined_text:
                    keywords.add(kw)

        return list(keywords)[:10]  # 最多10个关键词

    def _calculate_quality_score(self, question: str, answer: str, category: FAQCategory) -> float:
        """计算质量分数 (0-1)"""
        score = 0.5  # 基础分

        # 问题长度合适 (10-200字)
        q_len = len(question)
        if 10 <= q_len <= 200:
            score += 0.1
        elif q_len > 200:
            score += 0.05

        # 回答长度合适 (5-500字)
        a_len = len(answer)
        if 5 <= a_len <= 500:
            score += 0.1
        elif a_len > 500:
            score += 0.05

        # 有明确分类
        if category != FAQCategory.GENERAL:
            score += 0.15

        # 回答包含具体信息
        if any(c.isdigit() for c in answer):  # 包含数字
            score += 0.1

        # 问题是问句
        if any(q in question for q in ["?", "？", "吗", "嗎", "か", "呢"]):
            score += 0.05

        return min(score, 1.0)

    def process_qa_pair(self, qa: dict) -> Optional[CleanedQAPair]:
        """处理单个问答对"""
        question = self._clean_text(qa.get("question", ""))
        answer = self._clean_text(qa.get("answer", ""))

        # 检查是否无效
        if self._is_invalid(question, answer):
            return None

        # 分类
        category = self._classify(question, answer)

        # 提取关键词
        keywords = self._extract_keywords(question, answer)

        # 计算质量分数
        quality_score = self._calculate_quality_score(question, answer, category)

        return CleanedQAPair(
            question=question,
            answer=answer,
            category=category,
            source=qa.get("source", "unknown"),
            conversation_id=qa.get("conversation_id", ""),
            quality_score=quality_score,
            keywords=keywords,
        )

    def process_qa_file(self, input_path: str | Path, output_path: Optional[str | Path] = None, min_quality: float = 0.4) -> dict:
        """
        处理问答对文件

        Args:
            input_path: 输入文件路径
            output_path: 输出文件路径（可选）
            min_quality: 最低质量分数

        Returns:
            处理统计信息
        """
        input_path = Path(input_path)

        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        raw_pairs = data.get("qa_pairs", [])
        cleaned_pairs = []
        category_counts = {cat: 0 for cat in FAQCategory}
        invalid_count = 0

        for qa in raw_pairs:
            cleaned = self.process_qa_pair(qa)

            if cleaned is None:
                invalid_count += 1
                category_counts[FAQCategory.INVALID] += 1
                continue

            if cleaned.quality_score < min_quality:
                invalid_count += 1
                continue

            cleaned_pairs.append(cleaned)
            category_counts[cleaned.category] += 1

        # 按质量分数排序
        cleaned_pairs.sort(key=lambda x: x.quality_score, reverse=True)

        # 统计信息
        stats = {
            "total_raw": len(raw_pairs),
            "total_cleaned": len(cleaned_pairs),
            "invalid_count": invalid_count,
            "category_distribution": {k.value: v for k, v in category_counts.items()},
            "avg_quality_score": sum(p.quality_score for p in cleaned_pairs) / len(cleaned_pairs) if cleaned_pairs else 0,
        }

        # 保存结果
        if output_path:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            output_data = {
                "metadata": stats,
                "qa_pairs": [p.to_dict() for p in cleaned_pairs],
            }

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)

        return stats

    def get_pairs_by_category(self, pairs: list[CleanedQAPair], category: FAQCategory) -> list[CleanedQAPair]:
        """按分类筛选问答对"""
        return [p for p in pairs if p.category == category]
