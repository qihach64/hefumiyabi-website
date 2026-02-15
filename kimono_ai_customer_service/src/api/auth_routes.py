"""
Authentication Routes
认证路由 - 商家注册、用户登录、令牌刷新
"""

import json
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    TenantRegisterRequest, TenantRegisterResponse,
    UserRegisterRequest, UserUpdateRequest, UserResponse,
    LoginRequest, RefreshTokenRequest, TokenResponse,
    TenantResponse,
)
from .auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, verify_token,
    TokenData, get_current_active_user, get_current_tenant_admin,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

from database import get_db_session
from database.repositories import TenantRepository, UserRepository


# ========== 路由器定义 ==========

auth_router = APIRouter(prefix="/auth", tags=["认证"])


# ========== 商家注册 ==========

@auth_router.post(
    "/register/tenant",
    response_model=TenantRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="注册商家",
    description="注册新商家并创建管理员账户，可选自动复制通用模板",
)
async def register_tenant(
    request: TenantRegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    """注册商家

    创建新商家和管理员账户，返回访问令牌
    可选自动复制通用模板到商家知识库（后台执行）
    """
    try:
        tenant_repo = TenantRepository(db)
        user_repo = UserRepository(db)

        # 创建商家
        tenant = await tenant_repo.create(
            name=request.name,
        )

        # 创建管理员用户
        password_hash = hash_password(request.admin_password)
        admin_user = await user_repo.create(
            tenant_id=tenant.id,
            username=request.admin_username,
            password_hash=password_hash,
            role="tenant_admin",
            display_name=request.admin_display_name,
        )

        await db.commit()

        # 自动复制通用模板（后台任务，不阻塞注册流程）
        if request.copy_templates:
            background_tasks.add_task(
                copy_templates_for_new_tenant,
                tenant_id=tenant.id,
                namespace=tenant.namespace,
                categories=request.template_categories,
            )

        # 生成令牌
        access_token = create_access_token(
            user_id=admin_user.id,
            tenant_id=tenant.id,
            username=admin_user.username,
            role=admin_user.role,
        )
        refresh_token = create_refresh_token(
            user_id=admin_user.id,
            tenant_id=tenant.id,
            username=admin_user.username,
            role=admin_user.role,
        )

        message = "商家注册成功"
        if request.copy_templates:
            message += "，通用模板正在后台复制中"

        return TenantRegisterResponse(
            success=True,
            message=message,
            tenant=TenantResponse(
                id=tenant.id,
                name=tenant.name,
                namespace=tenant.namespace,
                status=tenant.status,
                created_at=tenant.created_at,
            ),
            admin_user=UserResponse(
                id=admin_user.id,
                tenant_id=admin_user.tenant_id,
                username=admin_user.username,
                display_name=admin_user.display_name,
                role=admin_user.role,
                is_active=admin_user.is_active,
                created_at=admin_user.created_at,
                last_login=admin_user.last_login,
            ),
            tokens=TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}",
        )


# ========== 用户注册（商家管理员操作） ==========

@auth_router.post(
    "/register/user",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="注册用户",
    description="商家管理员为商家添加新用户",
)
async def register_user(
    request: UserRegisterRequest,
    current_user: TokenData = Depends(get_current_tenant_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """注册用户

    商家管理员为商家添加新的客服人员
    """
    try:
        user_repo = UserRepository(db)

        # 检查用户名是否已存在
        existing = await user_repo.get_by_tenant_and_username(
            tenant_id=current_user.tenant_id,
            username=request.username,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在",
            )

        # 验证角色
        if request.role not in ["staff", "tenant_admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的角色",
            )

        # 创建用户
        password_hash = hash_password(request.password)
        user = await user_repo.create(
            tenant_id=current_user.tenant_id,
            username=request.username,
            password_hash=password_hash,
            role=request.role,
            display_name=request.display_name,
        )

        await db.commit()

        return UserResponse(
            id=user.id,
            tenant_id=user.tenant_id,
            username=user.username,
            display_name=user.display_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}",
        )


# ========== 用户登录 ==========

@auth_router.post(
    "/login",
    response_model=TokenResponse,
    summary="用户登录",
    description="用户登录获取访问令牌",
)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """用户登录

    验证用户凭据并返回访问令牌
    """
    user_repo = UserRepository(db)

    # 查找用户
    user = await user_repo.get_by_tenant_and_username(
        tenant_id=request.tenant_id,
        username=request.username,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 验证密码
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 检查用户状态
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用",
        )

    # 更新最后登录时间
    await user_repo.update_last_login(user.id)
    await db.commit()

    # 生成令牌
    access_token = create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        username=user.username,
        role=user.role,
    )
    refresh_token = create_refresh_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        username=user.username,
        role=user.role,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ========== 刷新令牌 ==========

@auth_router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="刷新令牌",
    description="使用刷新令牌获取新的访问令牌",
)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """刷新令牌

    验证刷新令牌并返回新的访问令牌
    """
    # 验证刷新令牌
    token_data = verify_token(request.refresh_token, "refresh")

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 验证用户是否仍然有效
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(token_data.user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已被禁用",
        )

    # 生成新令牌
    access_token = create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        username=user.username,
        role=user.role,
    )
    new_refresh_token = create_refresh_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        username=user.username,
        role=user.role,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ========== 获取当前用户信息 ==========

@auth_router.get(
    "/me",
    response_model=UserResponse,
    summary="获取当前用户",
    description="获取当前登录用户的信息",
)
async def get_current_user_info(
    current_user: TokenData = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """获取当前用户信息"""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(current_user.user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )

    return UserResponse(
        id=user.id,
        tenant_id=user.tenant_id,
        username=user.username,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
    )


# ========== 获取商家用户列表 ==========

@auth_router.get(
    "/users",
    response_model=list[UserResponse],
    summary="获取用户列表",
    description="获取当前商家的所有用户",
)
async def list_users(
    include_inactive: bool = False,
    current_user: TokenData = Depends(get_current_tenant_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """获取商家用户列表

    仅限商家管理员访问
    - include_inactive: 是否包含已禁用用户，默认 False
    """
    user_repo = UserRepository(db)
    users = await user_repo.list_by_tenant(
        tenant_id=current_user.tenant_id,
        is_active=None if include_inactive else True,
    )

    return [
        UserResponse(
            id=user.id,
            tenant_id=user.tenant_id,
            username=user.username,
            display_name=user.display_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
        )
        for user in users
    ]


# ========== 更新用户 ==========

@auth_router.patch(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="更新用户",
    description="更新用户信息（禁用/启用、修改显示名称等）",
)
async def update_user(
    user_id: str,
    request: UserUpdateRequest,
    current_user: TokenData = Depends(get_current_tenant_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """更新用户信息

    仅限商家管理员操作
    """
    user_repo = UserRepository(db)

    # 获取用户
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )

    # 验证用户属于当前商家
    if user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权操作其他商家的用户",
        )

    # 不允许管理员禁用自己
    if user_id == current_user.user_id and request.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能禁用自己的账户",
        )

    # 验证角色
    if request.role and request.role not in ["staff", "tenant_admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的角色",
        )

    # 准备更新参数
    update_kwargs = {}
    if request.display_name is not None:
        update_kwargs["display_name"] = request.display_name
    if request.password is not None:
        update_kwargs["password_hash"] = hash_password(request.password)
    if request.role is not None:
        update_kwargs["role"] = request.role
    if request.is_active is not None:
        update_kwargs["is_active"] = request.is_active

    # 执行更新
    if update_kwargs:
        user = await user_repo.update(user_id, **update_kwargs)
        await db.commit()

    return UserResponse(
        id=user.id,
        tenant_id=user.tenant_id,
        username=user.username,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
    )


# ========== 删除用户（软删除） ==========

@auth_router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除用户",
    description="禁用用户账户（软删除）",
)
async def delete_user(
    user_id: str,
    current_user: TokenData = Depends(get_current_tenant_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """删除用户（软删除）

    仅限商家管理员操作
    """
    user_repo = UserRepository(db)

    # 获取用户
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )

    # 验证用户属于当前商家
    if user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权操作其他商家的用户",
        )

    # 不允许删除自己
    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己的账户",
        )

    # 执行软删除
    await user_repo.delete(user_id)
    await db.commit()


# ========== 辅助函数 ==========

async def copy_templates_for_new_tenant(
    tenant_id: str,
    namespace: str,
    categories: Optional[List[str]] = None,
):
    """
    后台任务：为新商家复制通用模板

    Args:
        tenant_id: 商家 ID
        namespace: Pinecone 命名空间
        categories: 要复制的类别，None 表示全部
    """
    import asyncio
    from .dependencies import ServiceContainer
    from database import get_database
    from database.repositories import QAPairRepository

    try:
        templates_file = Path(__file__).parent.parent.parent / "data" / "templates" / "universal_templates.json"

        if not templates_file.exists():
            print(f"[RegisterInit] {tenant_id}: 通用模板文件不存在，跳过复制")
            return

        # 读取文件（在线程池中执行）
        def load_templates():
            with open(templates_file, "r", encoding="utf-8") as f:
                return json.load(f)

        data = await asyncio.to_thread(load_templates)

        # 支持嵌套格式和扁平数组格式
        if isinstance(data, dict) and "templates" in data:
            all_templates = data["templates"]
        else:
            all_templates = data

        # 按类别过滤
        if categories:
            templates_to_copy = [t for t in all_templates if t.get("category") in categories]
        else:
            templates_to_copy = all_templates

        if not templates_to_copy:
            print(f"[RegisterInit] {tenant_id}: 无模板需要复制")
            return

        # 获取服务容器（用于向量库）
        container = ServiceContainer.get_instance()
        vector_store = None
        if container and container.knowledge_base:
            vector_store = container.knowledge_base.vector_store

        # 批量处理
        batch_size = 50
        total = len(templates_to_copy)
        processed = 0
        db_inserted = 0
        vec_synced = 0

        for i in range(0, total, batch_size):
            batch = templates_to_copy[i:i + batch_size]
            batch_qa_ids = []  # 记录本批次创建的 QA pair ID

            # 1. 写入数据库（每批次创建新 session）
            try:
                db = get_database()
                async with db.session() as db_session:
                    repo = QAPairRepository(db_session)
                    for t in batch:
                        question = t.get("question", "")
                        answer = t.get("answer", "")
                        category = t.get("category", "general")
                        quality_score = t.get("quality_score", t.get("universality_score", 0.8))

                        qa_pair = await repo.create(
                            question=question,
                            answer=answer,
                            tenant_id=tenant_id,
                            category=category,
                            source="universal_template",
                            quality_score=quality_score,
                        )
                        batch_qa_ids.append({
                            "id": qa_pair.id,
                            "question": question,
                            "answer": answer,
                            "category": category,
                            "quality_score": quality_score,
                        })
                        db_inserted += 1

                    await db_session.commit()
            except Exception as db_err:
                print(f"[RegisterInit] {tenant_id}: 数据库写入失败 - {db_err}")
                continue  # 数据库失败则跳过本批次

            # 2. 写入向量库并更新同步状态
            if vector_store and batch_qa_ids:
                try:
                    # 向量库写入（在线程池中执行）
                    def process_batch_vector(qa_items):
                        results = []
                        for item in qa_items:
                            try:
                                vector_id = vector_store.upsert_single(
                                    question=item["question"],
                                    answer=item["answer"],
                                    category=item["category"],
                                    namespace=namespace,
                                    quality_score=item["quality_score"],
                                    source="universal_template",
                                )
                                results.append({"id": item["id"], "vector_id": vector_id, "success": True})
                            except Exception:
                                results.append({"id": item["id"], "vector_id": None, "success": False})
                        return results

                    sync_results = await asyncio.to_thread(process_batch_vector, batch_qa_ids)

                    # 更新数据库中的同步状态
                    success_ids = [(r["id"], r["vector_id"]) for r in sync_results if r["success"] and r["vector_id"]]
                    if success_ids:
                        db = get_database()
                        async with db.session() as db_session:
                            repo = QAPairRepository(db_session)
                            for qa_id, vector_id in success_ids:
                                await repo.mark_synced(qa_id, vector_id)
                                vec_synced += 1
                            await db_session.commit()

                except Exception as vec_err:
                    print(f"[RegisterInit] {tenant_id}: 向量库写入失败(批次{i//batch_size + 1}) - {vec_err}")

            processed += len(batch)
            print(f"[RegisterInit] {tenant_id}: 已复制 {processed}/{total} 条模板 (DB: {db_inserted}, Vec: {vec_synced})")
            # 让出事件循环
            await asyncio.sleep(0.1)

        print(f"[RegisterInit] {tenant_id}: 模板复制完成，共 {total} 条，数据库 {db_inserted} 条，向量库 {vec_synced} 条")
        if db_inserted > vec_synced:
            print(f"[RegisterInit] {tenant_id}: {db_inserted - vec_synced} 条未同步，将由定时任务补同步")

    except Exception as e:
        print(f"[RegisterInit] {tenant_id}: 模板复制失败 - {e}")
