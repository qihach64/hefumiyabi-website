"""
Tenant Management Routes
商家管理路由 - 商家初始化、模板复制
"""

import os
import json
from pathlib import Path
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from .auth import get_current_tenant_admin, TokenData
from .dependencies import get_service_container, ServiceContainer

from database import get_db_session
from database.repositories import TenantRepository


# ========== 请求/响应模型 ==========

class TenantInitRequest(BaseModel):
    """商家初始化请求"""
    copy_templates: bool = Field(True, description="是否复制通用模板到知识库")
    categories: Optional[List[str]] = Field(
        None,
        description="要复制的模板类别，默认全部"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "copy_templates": True,
                "categories": ["general", "size_style", "photo", "hair_makeup"]
            }
        }
    }


class TemplateStats(BaseModel):
    """模板统计"""
    total_templates: int = Field(..., description="总模板数")
    categories: dict = Field(default_factory=dict, description="按类别统计")
    avg_quality_score: float = Field(0.0, description="平均质量分数")


class TenantInitResponse(BaseModel):
    """商家初始化响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="消息")
    tenant_id: str = Field(..., description="商家 ID")
    templates_copied: int = Field(0, description="复制的模板数量")
    template_stats: Optional[TemplateStats] = Field(None, description="模板统计")


class TemplateListResponse(BaseModel):
    """模板列表响应"""
    total: int = Field(..., description="总数量")
    categories: dict = Field(default_factory=dict, description="类别分布")
    templates: List[dict] = Field(default_factory=list, description="模板列表（前100条）")


# ========== 路由器定义 ==========

tenant_router = APIRouter(prefix="/tenant", tags=["商家管理"])


# ========== 模板相关路由 ==========

@tenant_router.get(
    "/templates",
    response_model=TemplateListResponse,
    summary="获取通用模板列表",
    description="获取系统通用模板库中的模板列表",
)
async def get_templates(
    category: Optional[str] = None,
    limit: int = 100,
):
    """获取通用模板列表

    可选按类别过滤
    """
    templates_file = Path(__file__).parent.parent.parent / "data" / "templates" / "universal_templates.json"

    if not templates_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通用模板库尚未创建，请先运行模板提取脚本"
        )

    with open(templates_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 支持嵌套格式 {metadata, templates} 和扁平数组格式
    if isinstance(data, dict) and "templates" in data:
        all_templates = data["templates"]
    else:
        all_templates = data

    # 按类别过滤
    if category:
        filtered = [t for t in all_templates if t.get("category") == category]
    else:
        filtered = all_templates

    # 统计类别分布
    categories = {}
    for t in all_templates:
        cat = t.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1

    return TemplateListResponse(
        total=len(filtered),
        categories=categories,
        templates=filtered[:limit]
    )


@tenant_router.get(
    "/templates/stats",
    response_model=TemplateStats,
    summary="获取模板统计",
    description="获取通用模板库的统计信息",
)
async def get_template_stats():
    """获取模板统计信息"""
    templates_file = Path(__file__).parent.parent.parent / "data" / "templates" / "universal_templates.json"

    if not templates_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通用模板库尚未创建"
        )

    with open(templates_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 支持嵌套格式 {metadata, templates} 和扁平数组格式
    if isinstance(data, dict) and "templates" in data:
        templates = data["templates"]
    else:
        templates = data

    # 统计
    categories = {}
    total_score = 0.0

    for t in templates:
        cat = t.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
        total_score += t.get("universality_score", 0.0)

    avg_score = total_score / len(templates) if templates else 0.0

    return TemplateStats(
        total_templates=len(templates),
        categories=categories,
        avg_quality_score=round(avg_score, 3)
    )


# ========== 商家初始化路由 ==========

@tenant_router.post(
    "/initialize",
    response_model=TenantInitResponse,
    summary="初始化商家知识库",
    description="为当前商家初始化知识库，可选择复制通用模板",
)
async def initialize_tenant(
    request: TenantInitRequest,
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(get_current_tenant_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """初始化商家知识库

    - 仅商家管理员可调用
    - 可选复制通用模板到商家知识库
    - 使用后台任务进行模板复制（大量数据时）
    """
    tenant_id = current_user.tenant_id

    # 检查商家是否存在
    tenant_repo = TenantRepository(db)
    tenant = await tenant_repo.get_by_id(tenant_id)

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )

    templates_copied = 0
    template_stats = None

    if request.copy_templates:
        # 加载通用模板
        templates_file = Path(__file__).parent.parent.parent / "data" / "templates" / "universal_templates.json"

        if not templates_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="通用模板库尚未创建，请先运行模板提取脚本"
            )

        with open(templates_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 支持嵌套格式 {metadata, templates} 和扁平数组格式
        if isinstance(data, dict) and "templates" in data:
            all_templates = data["templates"]
        else:
            all_templates = data

        # 按类别过滤
        if request.categories:
            templates_to_copy = [
                t for t in all_templates
                if t.get("category") in request.categories
            ]
        else:
            templates_to_copy = all_templates

        # 统计
        categories = {}
        total_score = 0.0
        for t in templates_to_copy:
            cat = t.get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1
            total_score += t.get("universality_score", 0.0)

        templates_copied = len(templates_to_copy)
        avg_score = total_score / templates_copied if templates_copied > 0 else 0.0

        template_stats = TemplateStats(
            total_templates=templates_copied,
            categories=categories,
            avg_quality_score=round(avg_score, 3)
        )

        # 后台任务：将模板写入向量数据库
        background_tasks.add_task(
            copy_templates_to_vector_db,
            tenant_id=tenant_id,
            namespace=tenant.namespace,
            templates=templates_to_copy
        )

    return TenantInitResponse(
        success=True,
        message=f"商家初始化成功，已提交 {templates_copied} 条模板复制任务",
        tenant_id=tenant_id,
        templates_copied=templates_copied,
        template_stats=template_stats
    )


async def copy_templates_to_vector_db(
    tenant_id: str,
    namespace: str,
    templates: List[dict],
):
    """后台任务：复制模板到向量数据库"""
    try:
        # 获取服务容器单例
        container = ServiceContainer.get_instance()

        if not container.knowledge_base:
            print(f"[TenantInit] {tenant_id}: 知识库服务不可用")
            return

        vector_store = container.knowledge_base.vector_store

        # 批量处理
        batch_size = 50
        total = len(templates)
        processed = 0

        for i in range(0, total, batch_size):
            batch = templates[i:i + batch_size]

            # 使用向量库的 upsert_single 方法逐个添加
            for idx, t in enumerate(batch):
                vector_store.upsert_single(
                    question=t.get("question", ""),
                    answer=t.get("answer", ""),
                    category=t.get("category", "general"),
                    namespace=namespace,
                    quality_score=t.get("quality_score", 0.8),
                    source="universal_template",
                )

            processed += len(batch)
            print(f"[TenantInit] {tenant_id}: 已处理 {processed}/{total} 条模板")

        print(f"[TenantInit] {tenant_id}: 模板复制完成，共 {total} 条")

    except Exception as e:
        print(f"[TenantInit] {tenant_id}: 模板复制失败 - {e}")


@tenant_router.get(
    "/status",
    summary="获取商家状态",
    description="获取当前商家的初始化状态和知识库统计",
)
async def get_tenant_status(
    current_user: TokenData = Depends(get_current_tenant_admin),
    db: AsyncSession = Depends(get_db_session),
    container: ServiceContainer = Depends(get_service_container),
):
    """获取商家状态

    返回商家的初始化状态和知识库统计信息
    """
    tenant_id = current_user.tenant_id

    tenant_repo = TenantRepository(db)
    tenant = await tenant_repo.get_by_id(tenant_id)

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商家不存在"
        )

    # 获取知识库统计（简化版）
    kb_stats = {
        "total_vectors": 0,
        "categories": {},
    }

    try:
        if container.knowledge_base:
            stats = container.knowledge_base.vector_store.get_index_stats()
            namespace_stats = stats.get("namespaces", {}).get(tenant.namespace, {})
            kb_stats["total_vectors"] = namespace_stats.get("vector_count", 0)
            kb_stats["all_namespaces"] = stats.get("namespaces", {})
    except Exception as e:
        kb_stats["error"] = str(e)

    return {
        "tenant_id": tenant_id,
        "tenant_name": tenant.name,
        "namespace": tenant.namespace,
        "status": tenant.status,
        "created_at": tenant.created_at.isoformat(),
        "knowledge_base": kb_stats,
    }
