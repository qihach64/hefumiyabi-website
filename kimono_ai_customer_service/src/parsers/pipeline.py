"""
Data Processing Pipeline
数据处理管道 - 整合、清洗、标准化对话数据
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field

from .models import (
    Conversation,
    ConversationSource,
    ConversationBatch,
    Message,
    SenderType,
)
from .instagram_parser import InstagramParser
from .line_parser import LineParser


@dataclass
class PipelineStats:
    """处理统计"""
    total_conversations: int = 0
    total_messages: int = 0
    instagram_conversations: int = 0
    line_conversations: int = 0
    customer_messages: int = 0
    staff_messages: int = 0
    avg_messages_per_conversation: float = 0.0
    errors: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "total_conversations": self.total_conversations,
            "total_messages": self.total_messages,
            "instagram_conversations": self.instagram_conversations,
            "line_conversations": self.line_conversations,
            "customer_messages": self.customer_messages,
            "staff_messages": self.staff_messages,
            "avg_messages_per_conversation": round(self.avg_messages_per_conversation, 2),
            "error_count": len(self.errors),
        }


class DataPipeline:
    """数据处理管道"""

    def __init__(
        self,
        instagram_path: Optional[str | Path] = None,
        line_path: Optional[str | Path] = None,
        output_path: Optional[str | Path] = None,
    ):
        """
        初始化管道

        Args:
            instagram_path: Instagram 数据目录
            line_path: LINE 数据目录
            output_path: 输出目录
        """
        self.instagram_path = Path(instagram_path) if instagram_path else None
        self.line_path = Path(line_path) if line_path else None
        self.output_path = Path(output_path) if output_path else Path("data/processed")

        self.conversations: list[Conversation] = []
        self.stats = PipelineStats()

    def _clean_text(self, text: str) -> str:
        """
        清洗文本内容

        Args:
            text: 原始文本

        Returns:
            清洗后的文本
        """
        if not text:
            return ""

        # 移除多余空白
        text = re.sub(r'\s+', ' ', text)

        # 移除不可见字符
        text = ''.join(c for c in text if c.isprintable() or c in '\n\t')

        # 移除 LINE 的自动回复标记
        if text.startswith("ようこそ和装工房雅"):
            return "[自动回复]"

        return text.strip()

    def _normalize_conversation(self, conv: Conversation) -> Conversation:
        """
        标准化对话数据

        Args:
            conv: 原始对话

        Returns:
            标准化后的对话
        """
        # 清洗消息内容
        for msg in conv.messages:
            msg.content = self._clean_text(msg.content)

        # 移除空消息
        conv.messages = [
            msg for msg in conv.messages
            if msg.content or msg.attachments
        ]

        # 重新计算统计
        conv.update_stats()

        return conv

    def load_instagram(self, limit: Optional[int] = None, progress_callback=None) -> ConversationBatch:
        """
        加载 Instagram 数据

        Args:
            limit: 限制数量
            progress_callback: 进度回调

        Returns:
            ConversationBatch
        """
        if not self.instagram_path:
            raise ValueError("Instagram 数据路径未设置")

        parser = InstagramParser(self.instagram_path)
        batch = parser.parse_all(limit=limit, progress_callback=progress_callback)

        # 标准化
        for conv in batch.conversations:
            self._normalize_conversation(conv)

        self.conversations.extend(batch.conversations)
        self.stats.instagram_conversations = batch.success_count
        self.stats.errors.extend(batch.errors)

        return batch

    def load_line(self, limit: Optional[int] = None, progress_callback=None) -> ConversationBatch:
        """
        加载 LINE 数据

        Args:
            limit: 限制数量
            progress_callback: 进度回调

        Returns:
            ConversationBatch
        """
        if not self.line_path:
            raise ValueError("LINE 数据路径未设置")

        parser = LineParser(self.line_path)
        batch = parser.parse_all(limit=limit, progress_callback=progress_callback)

        # 标准化
        for conv in batch.conversations:
            self._normalize_conversation(conv)

        self.conversations.extend(batch.conversations)
        self.stats.line_conversations = batch.success_count
        self.stats.errors.extend(batch.errors)

        return batch

    def process_all(self, instagram_limit: Optional[int] = None, line_limit: Optional[int] = None) -> PipelineStats:
        """
        处理所有数据源

        Args:
            instagram_limit: Instagram 数据限制
            line_limit: LINE 数据限制

        Returns:
            处理统计
        """
        print("正在加载 Instagram 数据...")
        if self.instagram_path and self.instagram_path.exists():
            self.load_instagram(limit=instagram_limit)
            print(f"  ✓ 加载 {self.stats.instagram_conversations} 个 Instagram 对话")

        print("正在加载 LINE 数据...")
        if self.line_path and self.line_path.exists():
            self.load_line(limit=line_limit)
            print(f"  ✓ 加载 {self.stats.line_conversations} 个 LINE 对话")

        # 更新统计
        self._update_stats()

        return self.stats

    def _update_stats(self):
        """更新统计信息"""
        self.stats.total_conversations = len(self.conversations)
        self.stats.total_messages = sum(c.message_count for c in self.conversations)
        self.stats.customer_messages = sum(c.customer_message_count for c in self.conversations)
        self.stats.staff_messages = sum(c.staff_message_count for c in self.conversations)

        if self.stats.total_conversations > 0:
            self.stats.avg_messages_per_conversation = (
                self.stats.total_messages / self.stats.total_conversations
            )

    def save_conversations(self, filename: str = "conversations.json") -> Path:
        """
        保存对话到 JSON 文件

        Args:
            filename: 输出文件名

        Returns:
            输出文件路径
        """
        self.output_path.mkdir(parents=True, exist_ok=True)
        output_file = self.output_path / filename

        # 转换为可序列化格式
        data = {
            "metadata": {
                "processed_at": datetime.now().isoformat(),
                "stats": self.stats.to_dict(),
            },
            "conversations": [
                conv.model_dump(mode="json") for conv in self.conversations
            ]
        }

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"✓ 对话数据已保存到: {output_file}")
        return output_file

    def save_qa_pairs(self, filename: str = "qa_pairs.json") -> Path:
        """
        提取并保存问答对

        Args:
            filename: 输出文件名

        Returns:
            输出文件路径
        """
        self.output_path.mkdir(parents=True, exist_ok=True)
        output_file = self.output_path / filename

        qa_pairs = []

        for conv in self.conversations:
            # 按时间排序的消息
            messages = sorted(conv.messages, key=lambda m: m.timestamp)

            # 提取问答对
            i = 0
            while i < len(messages) - 1:
                # 找客户问题
                if messages[i].sender_type == SenderType.CUSTOMER:
                    question = messages[i].content

                    # 找客服回复
                    j = i + 1
                    while j < len(messages) and messages[j].sender_type == SenderType.CUSTOMER:
                        # 合并连续的客户消息作为问题
                        question += " " + messages[j].content
                        j += 1

                    if j < len(messages) and messages[j].sender_type == SenderType.STAFF:
                        answer = messages[j].content

                        # 合并连续的客服消息作为回答
                        k = j + 1
                        while k < len(messages) and messages[k].sender_type == SenderType.STAFF:
                            answer += " " + messages[k].content
                            k += 1

                        if question.strip() and answer.strip() and answer != "[自动回复]":
                            qa_pairs.append({
                                "question": question.strip(),
                                "answer": answer.strip(),
                                "source": conv.source.value,
                                "conversation_id": conv.id,
                            })

                        i = k
                    else:
                        i = j
                else:
                    i += 1

        # 保存
        data = {
            "metadata": {
                "processed_at": datetime.now().isoformat(),
                "total_pairs": len(qa_pairs),
            },
            "qa_pairs": qa_pairs,
        }

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"✓ 问答对已保存到: {output_file} ({len(qa_pairs)} 对)")
        return output_file

    def get_sample_conversations(self, n: int = 5) -> list[Conversation]:
        """获取样本对话"""
        return self.conversations[:n]

    def print_stats(self):
        """打印统计信息"""
        print("\n" + "=" * 60)
        print("数据处理统计")
        print("=" * 60)
        print(f"总对话数: {self.stats.total_conversations:,}")
        print(f"  - Instagram: {self.stats.instagram_conversations:,}")
        print(f"  - LINE: {self.stats.line_conversations:,}")
        print(f"总消息数: {self.stats.total_messages:,}")
        print(f"  - 客户消息: {self.stats.customer_messages:,}")
        print(f"  - 客服消息: {self.stats.staff_messages:,}")
        print(f"平均消息/对话: {self.stats.avg_messages_per_conversation:.1f}")
        if self.stats.errors:
            print(f"错误数: {len(self.stats.errors)}")
        print("=" * 60)
