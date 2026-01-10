"""
Import Export Service
导入导出服务

支持 Excel 和 CSV 格式的知识库导入导出
"""

import csv
import io
from datetime import datetime, timezone
from typing import Optional, List, Dict
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from database.models import QAPair, Tenant


@dataclass
class ImportResult:
    """导入结果"""
    success_count: int = 0
    failed_count: int = 0
    skipped_count: int = 0
    errors: List[str] = field(default_factory=list)


@dataclass
class ExportFilter:
    """导出过滤条件"""
    tenant_id: Optional[str] = None
    category: Optional[str] = None
    is_synced: Optional[bool] = None


class ImportExportService:
    """导入导出服务"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def import_from_csv(
        self,
        content: bytes,
        tenant_id: str,
        skip_header: bool = True,
    ) -> ImportResult:
        """从 CSV 导入"""
        result = ImportResult()

        # 验证商家存在
        tenant_query = select(Tenant).where(Tenant.id == tenant_id)
        tenant_result = await self.db.execute(tenant_query)
        tenant = tenant_result.scalar_one_or_none()

        if not tenant:
            result.errors.append(f"商家 {tenant_id} 不存在")
            return result

        try:
            # 解析 CSV
            text_content = content.decode('utf-8-sig')  # 支持带 BOM 的 UTF-8
            reader = csv.reader(io.StringIO(text_content))

            rows = list(reader)
            if skip_header and rows:
                rows = rows[1:]

            for i, row in enumerate(rows, start=2 if skip_header else 1):
                try:
                    if len(row) < 2:
                        result.errors.append(f"第 {i} 行: 列数不足")
                        result.failed_count += 1
                        continue

                    question = row[0].strip()
                    answer = row[1].strip()
                    category = row[2].strip() if len(row) > 2 else None
                    keywords_str = row[3].strip() if len(row) > 3 else ""
                    priority = int(row[4]) if len(row) > 4 and row[4].strip().isdigit() else 0

                    if not question or not answer:
                        result.errors.append(f"第 {i} 行: 问题或答案为空")
                        result.failed_count += 1
                        continue

                    # 检查是否已存在
                    existing_query = select(QAPair).where(
                        and_(
                            QAPair.tenant_id == tenant_id,
                            QAPair.question == question,
                            QAPair.status == "active"
                        )
                    )
                    existing_result = await self.db.execute(existing_query)
                    existing = existing_result.scalar_one_or_none()

                    if existing:
                        # 更新现有的
                        existing.answer = answer
                        if category:
                            existing.category = category
                        if keywords_str:
                            existing.keywords = [k.strip() for k in keywords_str.split(',') if k.strip()]
                        existing.priority = priority
                        existing.updated_at = datetime.now(timezone.utc)
                        existing.is_synced = False
                        result.skipped_count += 1
                    else:
                        # 创建新的
                        keywords = [k.strip() for k in keywords_str.split(',') if k.strip()] if keywords_str else []
                        qa = QAPair(
                            tenant_id=tenant_id,
                            question=question,
                            answer=answer,
                            category=category if category else None,
                            keywords=keywords,
                            priority=priority,
                            status="active",
                            is_synced=False,
                            source="import_csv",
                            created_at=datetime.now(timezone.utc),
                            updated_at=datetime.now(timezone.utc),
                        )
                        self.db.add(qa)
                        result.success_count += 1

                except Exception as e:
                    result.errors.append(f"第 {i} 行: {str(e)}")
                    result.failed_count += 1

            await self.db.commit()

        except UnicodeDecodeError:
            result.errors.append("文件编码错误，请使用 UTF-8 编码")
        except Exception as e:
            result.errors.append(f"解析错误: {str(e)}")

        return result

    async def export_to_csv(
        self,
        filter: ExportFilter,
    ) -> bytes:
        """导出为 CSV"""
        # 构建查询
        query = select(QAPair).where(QAPair.status == "active")

        if filter.tenant_id:
            query = query.where(QAPair.tenant_id == filter.tenant_id)
        else:
            query = query.where(QAPair.tenant_id.isnot(None))

        if filter.category:
            query = query.where(QAPair.category == filter.category)

        if filter.is_synced is not None:
            query = query.where(QAPair.is_synced == filter.is_synced)

        query = query.order_by(QAPair.updated_at.desc())

        # 执行查询
        result = await self.db.execute(query)
        qa_pairs = result.scalars().all()

        # 获取商家名称
        tenant_ids = list(set(qa.tenant_id for qa in qa_pairs if qa.tenant_id))
        tenant_names = await self._get_tenant_names(tenant_ids)

        # 生成 CSV
        output = io.StringIO()
        writer = csv.writer(output)

        # 写入表头
        writer.writerow([
            '问题', '答案', '分类', '关键词', '优先级',
            '商家', '同步状态', '来源', '创建时间', '更新时间'
        ])

        # 写入数据
        for qa in qa_pairs:
            writer.writerow([
                qa.question,
                qa.answer,
                qa.category or '',
                ', '.join(qa.keywords) if qa.keywords else '',
                qa.priority or 0,
                tenant_names.get(qa.tenant_id, qa.tenant_id),
                '已同步' if qa.is_synced else '待同步',
                qa.source or '',
                qa.created_at.isoformat() if qa.created_at else '',
                qa.updated_at.isoformat() if qa.updated_at else '',
            ])

        # 添加 UTF-8 BOM 以支持 Excel 正确识别
        csv_content = output.getvalue()
        return ('\ufeff' + csv_content).encode('utf-8')

    async def get_import_template(self) -> bytes:
        """获取导入模板"""
        output = io.StringIO()
        writer = csv.writer(output)

        # 写入表头
        writer.writerow(['问题', '答案', '分类', '关键词', '优先级'])

        # 写入示例数据
        writer.writerow([
            '租借和服的价格是多少？',
            '我们的和服租借价格从 3000 日元起，根据和服类型和配件会有所不同。',
            '价格',
            '租借, 价格, 费用',
            '10'
        ])
        writer.writerow([
            '如何预约和服租借？',
            '您可以通过我们的官网在线预约，或拨打我们的客服电话进行预约。',
            '预约',
            '预约, 租借, 方式',
            '10'
        ])

        csv_content = output.getvalue()
        return ('\ufeff' + csv_content).encode('utf-8')

    # ========== 私有方法 ==========

    async def _get_tenant_names(self, tenant_ids: List[str]) -> Dict[str, str]:
        """获取商家名称映射"""
        if not tenant_ids:
            return {}

        query = select(Tenant.id, Tenant.name).where(Tenant.id.in_(tenant_ids))
        result = await self.db.execute(query)
        return {row[0]: row[1] for row in result.fetchall()}
