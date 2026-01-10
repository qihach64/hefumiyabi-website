"""
Instagram HTML Parser
解析 Instagram 导出的 HTML 对话文件
"""
from __future__ import annotations

import re
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Optional, Generator
from bs4 import BeautifulSoup

from .models import (
    Message,
    Conversation,
    ConversationSource,
    SenderType,
    MessageType,
    ConversationBatch,
)


class InstagramParser:
    """Instagram HTML 对话解析器"""

    # 商家账号名称列表（用于识别客服消息）
    STAFF_ACCOUNTS = [
        "kimonomiyabi director江戸和裝工房-雅",
        "kimonomiyabi director",
        "江戸和裝工房-雅",
        "和装工房雅",
    ]

    def __init__(self, data_path: str | Path):
        """
        初始化解析器

        Args:
            data_path: Instagram inbox 数据目录路径
        """
        self.data_path = Path(data_path)
        if not self.data_path.exists():
            raise FileNotFoundError(f"数据目录不存在: {self.data_path}")

    def _parse_timestamp(self, timestamp_str: str) -> Optional[datetime]:
        """
        解析时间戳字符串

        Args:
            timestamp_str: 如 "Apr 03, 2025 5:29 pm"

        Returns:
            datetime 对象
        """
        formats = [
            "%b %d, %Y %I:%M %p",  # Apr 03, 2025 5:29 pm
            "%b %d, %Y %I:%M%p",   # Apr 03, 2025 5:29pm
            "%B %d, %Y %I:%M %p",  # April 03, 2025 5:29 pm
            "%Y-%m-%d %H:%M:%S",   # 2025-04-03 17:29:00
        ]

        timestamp_str = timestamp_str.strip()

        for fmt in formats:
            try:
                return datetime.strptime(timestamp_str, fmt)
            except ValueError:
                continue

        # 尝试更灵活的解析
        try:
            # 处理 "Apr 3, 2025 5:29 pm" (没有前导零)
            timestamp_str = re.sub(r'(\w+)\s+(\d{1,2}),', r'\1 0\2,', timestamp_str)
            for fmt in formats:
                try:
                    return datetime.strptime(timestamp_str, fmt)
                except ValueError:
                    continue
        except Exception:
            pass

        return None

    def _is_staff_message(self, sender_name: str) -> bool:
        """判断是否为客服消息"""
        sender_lower = sender_name.lower()
        for staff_name in self.STAFF_ACCOUNTS:
            if staff_name.lower() in sender_lower or sender_lower in staff_name.lower():
                return True
        return False

    def _generate_message_id(self, conversation_id: str, timestamp: datetime, content: str) -> str:
        """生成消息唯一ID"""
        unique_str = f"{conversation_id}_{timestamp.isoformat()}_{content[:50]}"
        return hashlib.md5(unique_str.encode()).hexdigest()[:16]

    def _extract_messages_from_html(self, html_path: Path, conversation_id: str) -> list[Message]:
        """
        从单个 HTML 文件提取消息

        Args:
            html_path: HTML 文件路径
            conversation_id: 对话ID

        Returns:
            消息列表
        """
        messages = []

        try:
            with open(html_path, "r", encoding="utf-8") as f:
                soup = BeautifulSoup(f.read(), "lxml")
        except Exception as e:
            print(f"读取HTML文件失败 {html_path}: {e}")
            return messages

        # 查找所有消息容器
        # 消息容器的 class: "pam _3-95 _2ph- _a6-g uiBoxWhite noborder"
        message_divs = soup.find_all("div", class_=lambda c: c and "pam" in c and "_a6-g" in c)

        for div in message_divs:
            try:
                # 提取发送者
                sender_elem = div.find("h2")
                if not sender_elem:
                    continue
                sender_name = sender_elem.get_text(strip=True)

                # 提取消息内容
                content_div = div.find("div", class_=lambda c: c and "_a6-p" in c)
                content = ""
                attachments = []
                message_type = MessageType.TEXT

                if content_div:
                    # 提取文本内容
                    text_parts = []
                    for child in content_div.stripped_strings:
                        if child:
                            text_parts.append(child)
                    content = " ".join(text_parts)

                    # 提取图片附件
                    img_tags = content_div.find_all("img")
                    for img in img_tags:
                        src = img.get("src", "")
                        if src:
                            attachments.append(src)
                            if not content:
                                message_type = MessageType.IMAGE

                # 提取时间戳
                timestamp_div = div.find("div", class_=lambda c: c and "_a6-o" in c)
                if not timestamp_div:
                    continue
                timestamp_str = timestamp_div.get_text(strip=True)
                timestamp = self._parse_timestamp(timestamp_str)

                if not timestamp:
                    continue

                # 判断发送者类型
                sender_type = SenderType.STAFF if self._is_staff_message(sender_name) else SenderType.CUSTOMER

                # 创建消息对象
                msg_id = self._generate_message_id(conversation_id, timestamp, content)
                message = Message(
                    id=msg_id,
                    conversation_id=conversation_id,
                    sender_type=sender_type,
                    sender_name=sender_name,
                    content=content,
                    message_type=message_type,
                    timestamp=timestamp,
                    attachments=attachments,
                )
                messages.append(message)

            except Exception as e:
                print(f"解析消息失败: {e}")
                continue

        return messages

    def parse_conversation(self, conversation_dir: Path) -> Optional[Conversation]:
        """
        解析单个对话目录

        Args:
            conversation_dir: 对话目录路径

        Returns:
            Conversation 对象
        """
        if not conversation_dir.is_dir():
            return None

        # 从目录名提取客户信息
        # 格式: username_id
        dir_name = conversation_dir.name
        parts = dir_name.rsplit("_", 1)
        customer_name = parts[0] if len(parts) > 1 else dir_name
        customer_id = parts[1] if len(parts) > 1 else None

        # 生成对话ID
        conversation_id = hashlib.md5(dir_name.encode()).hexdigest()[:16]

        # 查找所有 HTML 文件
        html_files = sorted(conversation_dir.glob("message_*.html"))
        if not html_files:
            return None

        # 解析所有消息
        all_messages = []
        for html_file in html_files:
            messages = self._extract_messages_from_html(html_file, conversation_id)
            all_messages.extend(messages)

        if not all_messages:
            return None

        # 按时间排序消息
        all_messages.sort(key=lambda m: m.timestamp)

        # 从消息中获取真实客户名
        customer_names = set()
        for msg in all_messages:
            if msg.sender_type == SenderType.CUSTOMER:
                customer_names.add(msg.sender_name)

        if customer_names:
            customer_name = list(customer_names)[0]

        # 创建对话对象
        conversation = Conversation(
            id=conversation_id,
            source=ConversationSource.INSTAGRAM,
            customer_name=customer_name,
            customer_id=customer_id,
            messages=all_messages,
            source_file=str(conversation_dir),
        )
        conversation.update_stats()

        return conversation

    def parse_all(self, limit: Optional[int] = None, progress_callback=None) -> ConversationBatch:
        """
        解析所有对话

        Args:
            limit: 限制解析数量（用于测试）
            progress_callback: 进度回调函数

        Returns:
            ConversationBatch 对象
        """
        batch = ConversationBatch(source=ConversationSource.INSTAGRAM)

        # 获取所有对话目录
        conversation_dirs = [
            d for d in self.data_path.iterdir()
            if d.is_dir() and not d.name.startswith(".")
        ]

        if limit:
            conversation_dirs = conversation_dirs[:limit]

        total = len(conversation_dirs)

        for i, conv_dir in enumerate(conversation_dirs):
            try:
                conversation = self.parse_conversation(conv_dir)
                if conversation:
                    batch.conversations.append(conversation)
                else:
                    batch.errors.append({
                        "path": str(conv_dir),
                        "error": "No messages found"
                    })
                    batch.error_count += 1

                if progress_callback:
                    progress_callback(i + 1, total)

            except Exception as e:
                batch.errors.append({
                    "path": str(conv_dir),
                    "error": str(e)
                })
                batch.error_count += 1

        batch.update_counts()
        return batch

    def iter_conversations(self, limit: Optional[int] = None) -> Generator[Conversation, None, None]:
        """
        迭代器方式返回对话（内存友好）

        Args:
            limit: 限制数量

        Yields:
            Conversation 对象
        """
        conversation_dirs = [
            d for d in self.data_path.iterdir()
            if d.is_dir() and not d.name.startswith(".")
        ]

        if limit:
            conversation_dirs = conversation_dirs[:limit]

        for conv_dir in conversation_dirs:
            try:
                conversation = self.parse_conversation(conv_dir)
                if conversation:
                    yield conversation
            except Exception as e:
                print(f"解析对话失败 {conv_dir}: {e}")
                continue
