"""
LINE XLSX Parser
解析 LINE 导出的 Excel 对话文件
"""
from __future__ import annotations

import re
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Generator

import pandas as pd

from .models import (
    Message,
    Conversation,
    ConversationSource,
    SenderType,
    MessageType,
    ConversationBatch,
)


class LineParser:
    """LINE XLSX 对话解析器"""

    # 商家账号标识
    STAFF_SENDER_TYPE = "Account"
    CUSTOMER_SENDER_TYPE = "User"

    def __init__(self, data_path: str | Path):
        """
        初始化解析器

        Args:
            data_path: LINE 数据目录路径
        """
        self.data_path = Path(data_path)
        if not self.data_path.exists():
            raise FileNotFoundError(f"数据目录不存在: {self.data_path}")

    def _parse_filename(self, filename: str) -> dict:
        """
        解析文件名提取元数据

        Args:
            filename: 如 "1000_20250226_20250226_魏翊玲.xlsx"

        Returns:
            包含序号、开始日期、结束日期、客户名的字典
        """
        # 移除扩展名
        name = Path(filename).stem

        # 尝试解析格式: 序号_开始日期_结束日期_客户名
        pattern = r"^(\d+)_(\d{8})_(\d{8})_(.+)$"
        match = re.match(pattern, name)

        if match:
            return {
                "index": match.group(1),
                "start_date": match.group(2),
                "end_date": match.group(3),
                "customer_name": match.group(4),
            }

        # 备用解析：只提取客户名
        return {
            "index": None,
            "start_date": None,
            "end_date": None,
            "customer_name": name,
        }

    def _generate_message_id(self, conversation_id: str, timestamp: datetime, content: str) -> str:
        """生成消息唯一ID"""
        unique_str = f"{conversation_id}_{timestamp.isoformat()}_{content[:50] if content else 'empty'}"
        return hashlib.md5(unique_str.encode()).hexdigest()[:16]

    def _parse_datetime(self, date_val, time_val) -> Optional[datetime]:
        """
        解析日期和时间

        Args:
            date_val: 日期值（可能是 datetime 或字符串）
            time_val: 时间值（可能是 time、timedelta 或字符串）

        Returns:
            datetime 对象
        """
        try:
            # 处理日期
            if isinstance(date_val, datetime):
                date_part = date_val.date()
            elif isinstance(date_val, str):
                date_part = datetime.strptime(date_val.split()[0], "%Y-%m-%d").date()
            else:
                return None

            # 处理时间
            if isinstance(time_val, timedelta):
                # timedelta 转换为时间
                total_seconds = int(time_val.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                seconds = total_seconds % 60
                return datetime.combine(date_part, datetime.min.time().replace(
                    hour=hours, minute=minutes, second=seconds
                ))
            elif isinstance(time_val, datetime):
                return datetime.combine(date_part, time_val.time())
            elif isinstance(time_val, str):
                time_parts = time_val.split(":")
                hours = int(time_parts[0])
                minutes = int(time_parts[1]) if len(time_parts) > 1 else 0
                seconds = int(time_parts[2]) if len(time_parts) > 2 else 0
                return datetime.combine(date_part, datetime.min.time().replace(
                    hour=hours, minute=minutes, second=seconds
                ))
            else:
                # 尝试直接转换
                if hasattr(time_val, "hour"):
                    return datetime.combine(date_part, time_val)

            return None

        except Exception:
            # 静默处理解析失败（如列标题行）
            return None

    def _detect_message_type(self, content: str) -> MessageType:
        """检测消息类型"""
        if not content:
            return MessageType.UNKNOWN

        content_lower = content.lower()

        # 贴图标识
        if "[sticker]" in content_lower or "貼圖" in content:
            return MessageType.STICKER

        # 图片标识
        if "[photo]" in content_lower or "[image]" in content_lower:
            return MessageType.IMAGE

        # 文件标识
        if "[file]" in content_lower:
            return MessageType.FILE

        return MessageType.TEXT

    def parse_conversation(self, xlsx_path: Path) -> Optional[Conversation]:
        """
        解析单个 XLSX 文件

        Args:
            xlsx_path: Excel 文件路径

        Returns:
            Conversation 对象
        """
        try:
            # 读取 Excel 文件
            df = pd.read_excel(xlsx_path, header=None)
        except Exception as e:
            print(f"读取Excel文件失败 {xlsx_path}: {e}")
            return None

        if df.empty or len(df) < 4:
            return None

        # 解析文件名获取元数据
        file_info = self._parse_filename(xlsx_path.name)
        customer_name = file_info["customer_name"]

        # 生成对话ID
        conversation_id = hashlib.md5(xlsx_path.name.encode()).hexdigest()[:16]

        # LINE 文件结构:
        # Row 0: 时区信息
        # Row 1: 下载时间
        # Row 2: 列标题 (传送者类型, 传送者名称, 传送日期, 传送时间, 内容)
        # Row 3+: 数据行

        messages = []

        # 从第3行开始解析数据
        for idx in range(3, len(df)):
            row = df.iloc[idx]

            try:
                sender_type_raw = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                sender_name_raw = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
                date_val = row.iloc[2]
                time_val = row.iloc[3]
                content = str(row.iloc[4]).strip() if pd.notna(row.iloc[4]) else ""

                # 跳过空行
                if not sender_type_raw or sender_type_raw == "nan":
                    continue

                # 解析时间戳
                timestamp = self._parse_datetime(date_val, time_val)
                if not timestamp:
                    continue

                # 判断发送者类型
                if sender_type_raw == self.STAFF_SENDER_TYPE:
                    sender_type = SenderType.STAFF
                else:
                    sender_type = SenderType.CUSTOMER
                    # 更新客户名（使用实际发送者名）
                    if sender_name_raw and sender_name_raw != "nan":
                        customer_name = sender_name_raw

                # 检测消息类型
                message_type = self._detect_message_type(content)

                # 创建消息对象
                msg_id = self._generate_message_id(conversation_id, timestamp, content)
                message = Message(
                    id=msg_id,
                    conversation_id=conversation_id,
                    sender_type=sender_type,
                    sender_name=sender_name_raw if sender_name_raw != "nan" else "",
                    content=content,
                    message_type=message_type,
                    timestamp=timestamp,
                )
                messages.append(message)

            except Exception as e:
                print(f"解析行失败 {xlsx_path} row {idx}: {e}")
                continue

        if not messages:
            return None

        # 按时间排序
        messages.sort(key=lambda m: m.timestamp)

        # 创建对话对象
        conversation = Conversation(
            id=conversation_id,
            source=ConversationSource.LINE,
            customer_name=customer_name,
            customer_id=file_info.get("index"),
            messages=messages,
            source_file=str(xlsx_path),
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
        batch = ConversationBatch(source=ConversationSource.LINE)

        # 获取所有 XLSX 文件
        xlsx_files = list(self.data_path.glob("**/*.xlsx"))

        if limit:
            xlsx_files = xlsx_files[:limit]

        total = len(xlsx_files)

        for i, xlsx_path in enumerate(xlsx_files):
            try:
                conversation = self.parse_conversation(xlsx_path)
                if conversation:
                    batch.conversations.append(conversation)
                else:
                    batch.errors.append({
                        "path": str(xlsx_path),
                        "error": "No messages found or parse failed"
                    })
                    batch.error_count += 1

                if progress_callback:
                    progress_callback(i + 1, total)

            except Exception as e:
                batch.errors.append({
                    "path": str(xlsx_path),
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
        xlsx_files = list(self.data_path.glob("**/*.xlsx"))

        if limit:
            xlsx_files = xlsx_files[:limit]

        for xlsx_path in xlsx_files:
            try:
                conversation = self.parse_conversation(xlsx_path)
                if conversation:
                    yield conversation
            except Exception as e:
                print(f"解析对话失败 {xlsx_path}: {e}")
                continue
