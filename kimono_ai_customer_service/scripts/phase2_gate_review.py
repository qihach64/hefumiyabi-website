#!/usr/bin/env python3
"""
Phase 2 Gate Review - 多租户架构验收脚本

验收标准:
1. 认证模块存在且结构正确
2. JWT 令牌生成和验证正常
3. 密码加密正常
4. 商家和用户 CRUD 正常
5. 认证 API 正常
6. 租户隔离正常
7. 前端登录页面存在
"""

import sys
import asyncio
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))


class Phase2GateReviewer:
    """Phase 2 验收器"""

    def __init__(self):
        self.results = []
        self.project_root = PROJECT_ROOT

    def add_result(self, check_id: str, name: str, passed: bool, message: str = ""):
        """添加验收结果"""
        self.results.append({
            "id": check_id,
            "name": name,
            "passed": passed,
            "message": message
        })
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: [{check_id}] {name}")
        if message:
            print(f"         {message}")

    def verify_module_structure(self) -> bool:
        """验证认证模块目录结构"""
        print("\n📁 验证认证模块结构...")

        checks = [
            ("src/api/auth/__init__.py", "auth 包初始化"),
            ("src/api/auth/jwt.py", "JWT 模块"),
            ("src/api/auth/password.py", "密码模块"),
            ("src/api/auth/dependencies.py", "依赖注入模块"),
            ("src/api/auth_routes.py", "认证路由"),
            ("src/database/repositories/tenant_repo.py", "商家仓库"),
            ("src/database/repositories/user_repo.py", "用户仓库"),
            ("src/static/login.html", "登录页面"),
        ]

        all_passed = True
        for path, desc in checks:
            full_path = self.project_root / path
            if full_path.exists():
                self.add_result("P2.1", desc, True)
            else:
                self.add_result("P2.1", desc, False, f"文件不存在: {path}")
                all_passed = False

        return all_passed

    def verify_jwt_functions(self) -> bool:
        """验证 JWT 函数"""
        print("\n🔐 验证 JWT 功能...")

        try:
            from api.auth import (
                create_access_token,
                create_refresh_token,
                verify_token,
                decode_token,
                TokenData,
                ACCESS_TOKEN_EXPIRE_MINUTES,
            )

            # 创建访问令牌
            access_token = create_access_token(
                user_id="test_user_001",
                tenant_id="test_tenant_001",
                username="testuser",
                role="staff",
            )
            if access_token:
                self.add_result("P2.2", "创建访问令牌", True)
            else:
                self.add_result("P2.2", "创建访问令牌", False)
                return False

            # 创建刷新令牌
            refresh_token = create_refresh_token(
                user_id="test_user_001",
                tenant_id="test_tenant_001",
                username="testuser",
                role="staff",
            )
            if refresh_token:
                self.add_result("P2.2", "创建刷新令牌", True)
            else:
                self.add_result("P2.2", "创建刷新令牌", False)
                return False

            # 验证访问令牌
            token_data = verify_token(access_token, "access")
            if token_data and token_data.user_id == "test_user_001":
                self.add_result("P2.2", "验证访问令牌", True)
            else:
                self.add_result("P2.2", "验证访问令牌", False)
                return False

            # 验证刷新令牌
            refresh_data = verify_token(refresh_token, "refresh")
            if refresh_data and refresh_data.token_type == "refresh":
                self.add_result("P2.2", "验证刷新令牌", True)
            else:
                self.add_result("P2.2", "验证刷新令牌", False)
                return False

            # 解码令牌
            decoded = decode_token(access_token)
            if decoded and decoded.tenant_id == "test_tenant_001":
                self.add_result("P2.2", "解码令牌", True)
            else:
                self.add_result("P2.2", "解码令牌", False)
                return False

            # 验证令牌类型不匹配
            wrong_type = verify_token(access_token, "refresh")
            if wrong_type is None:
                self.add_result("P2.2", "令牌类型验证", True)
            else:
                self.add_result("P2.2", "令牌类型验证", False)
                return False

            return True

        except ImportError as e:
            self.add_result("P2.2", "导入 JWT 模块", False, str(e))
            return False
        except Exception as e:
            self.add_result("P2.2", "JWT 功能", False, str(e))
            return False

    def verify_password_functions(self) -> bool:
        """验证密码加密功能"""
        print("\n🔒 验证密码功能...")

        try:
            from api.auth import hash_password, verify_password

            test_password = "test_password_123"

            # 加密密码
            hashed = hash_password(test_password)
            if hashed and hashed != test_password:
                self.add_result("P2.3", "密码加密", True)
            else:
                self.add_result("P2.3", "密码加密", False)
                return False

            # 验证正确密码
            if verify_password(test_password, hashed):
                self.add_result("P2.3", "验证正确密码", True)
            else:
                self.add_result("P2.3", "验证正确密码", False)
                return False

            # 验证错误密码
            if not verify_password("wrong_password", hashed):
                self.add_result("P2.3", "拒绝错误密码", True)
            else:
                self.add_result("P2.3", "拒绝错误密码", False)
                return False

            return True

        except ImportError as e:
            self.add_result("P2.3", "导入密码模块", False, str(e))
            return False
        except Exception as e:
            self.add_result("P2.3", "密码功能", False, str(e))
            return False

    async def verify_tenant_crud(self) -> bool:
        """验证商家 CRUD 操作"""
        print("\n🏪 验证商家 CRUD...")

        try:
            from database import init_database, close_database, get_database
            from database.repositories import TenantRepository

            # 使用测试数据库
            test_db_path = self.project_root / "data" / "test_phase2_tenant.db"
            await init_database(f"sqlite+aiosqlite:///{test_db_path}")

            db = get_database()
            async with db.session() as session:
                repo = TenantRepository(session)

                # 创建商家
                tenant = await repo.create(
                    name="测试和服店",
                )
                if tenant and tenant.id.startswith("tenant_"):
                    self.add_result("P2.4", "创建商家", True, f"ID: {tenant.id}")
                else:
                    self.add_result("P2.4", "创建商家", False)
                    return False

                # 查询商家
                found = await repo.get_by_id(tenant.id)
                if found and found.name == "测试和服店":
                    self.add_result("P2.4", "查询商家", True)
                else:
                    self.add_result("P2.4", "查询商家", False)
                    return False

                # 更新商家
                updated = await repo.update(tenant.id, name="更新和服店")
                if updated and updated.name == "更新和服店":
                    self.add_result("P2.4", "更新商家", True)
                else:
                    self.add_result("P2.4", "更新商家", False)
                    return False

                # 列出商家
                tenants = await repo.list_all()
                if len(tenants) >= 1:
                    self.add_result("P2.4", "列出商家", True, f"数量: {len(tenants)}")
                else:
                    self.add_result("P2.4", "列出商家", False)
                    return False

            await close_database()

            # 清理测试数据库
            if test_db_path.exists():
                test_db_path.unlink()

            return True

        except Exception as e:
            self.add_result("P2.4", "商家 CRUD", False, str(e))
            return False

    async def verify_user_crud(self) -> bool:
        """验证用户 CRUD 操作"""
        print("\n👤 验证用户 CRUD...")

        try:
            from database import init_database, close_database, get_database
            from database.repositories import TenantRepository, UserRepository
            from api.auth import hash_password

            # 使用测试数据库
            test_db_path = self.project_root / "data" / "test_phase2_user.db"
            await init_database(f"sqlite+aiosqlite:///{test_db_path}")

            db = get_database()
            async with db.session() as session:
                tenant_repo = TenantRepository(session)
                user_repo = UserRepository(session)

                # 先创建商家
                tenant = await tenant_repo.create(name="用户测试店")

                # 创建用户
                password_hash = hash_password("test_password")
                user = await user_repo.create(
                    tenant_id=tenant.id,
                    username="testadmin",
                    password_hash=password_hash,
                    role="tenant_admin",
                    display_name="测试管理员",
                )
                if user and user.id.startswith("user_"):
                    self.add_result("P2.5", "创建用户", True, f"ID: {user.id}")
                else:
                    self.add_result("P2.5", "创建用户", False)
                    return False

                # 根据用户名查询
                found = await user_repo.get_by_tenant_and_username(
                    tenant_id=tenant.id,
                    username="testadmin",
                )
                if found and found.role == "tenant_admin":
                    self.add_result("P2.5", "查询用户", True)
                else:
                    self.add_result("P2.5", "查询用户", False)
                    return False

                # 更新用户
                updated = await user_repo.update(user.id, display_name="新名称")
                if updated and updated.display_name == "新名称":
                    self.add_result("P2.5", "更新用户", True)
                else:
                    self.add_result("P2.5", "更新用户", False)
                    return False

                # 列出商家用户
                users = await user_repo.list_by_tenant(tenant.id)
                if len(users) >= 1:
                    self.add_result("P2.5", "列出商家用户", True, f"数量: {len(users)}")
                else:
                    self.add_result("P2.5", "列出商家用户", False)
                    return False

            await close_database()

            # 清理测试数据库
            if test_db_path.exists():
                test_db_path.unlink()

            return True

        except Exception as e:
            self.add_result("P2.5", "用户 CRUD", False, str(e))
            return False

    def verify_auth_routes(self) -> bool:
        """验证认证路由"""
        print("\n🛣️ 验证认证路由...")

        auth_routes_file = self.project_root / "src" / "api" / "auth_routes.py"
        main_file = self.project_root / "src" / "api" / "main.py"

        auth_routes_content = auth_routes_file.read_text()
        main_content = main_file.read_text()

        checks = [
            ("/register/tenant", auth_routes_content, "商家注册路由"),
            ("/register/user", auth_routes_content, "用户注册路由"),
            ("/login", auth_routes_content, "登录路由"),
            ("/refresh", auth_routes_content, "刷新令牌路由"),
            ("/me", auth_routes_content, "获取用户信息路由"),
            ("/users", auth_routes_content, "获取用户列表路由"),
            ("auth_router", main_content, "main.py 导入 auth_router"),
            ("include_router(auth_router", main_content, "main.py 注册 auth_router"),
        ]

        all_passed = True
        for keyword, content, desc in checks:
            if keyword in content:
                self.add_result("P2.6", desc, True)
            else:
                self.add_result("P2.6", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_tenant_isolation(self) -> bool:
        """验证租户隔离"""
        print("\n🔐 验证租户隔离...")

        routes_file = self.project_root / "src" / "api" / "routes.py"
        content = routes_file.read_text()

        checks = [
            ("get_current_user", "导入 get_current_user"),
            ("current_user: Optional[TokenData]", "send_message 支持认证"),
            ("tenant_id = current_user.tenant_id if current_user else", "反馈支持租户隔离"),
            ("namespace = current_user.tenant_id if current_user else", "对话支持租户命名空间"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("P2.7", desc, True)
            else:
                self.add_result("P2.7", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_frontend_login(self) -> bool:
        """验证前端登录页面"""
        print("\n🖥️ 验证前端登录页面...")

        login_file = self.project_root / "src" / "static" / "login.html"
        index_file = self.project_root / "src" / "static" / "index.html"

        login_content = login_file.read_text()
        index_content = index_file.read_text()

        checks = [
            ("loginForm", login_content, "登录表单"),
            ("registerForm", login_content, "注册表单"),
            ("/api/v1/auth/login", login_content, "登录 API 调用"),
            ("/api/v1/auth/register/tenant", login_content, "注册 API 调用"),
            ("access_token", login_content, "令牌存储"),
            ("isLoggedIn", index_content, "主页登录状态"),
            ("getAuthHeaders", index_content, "主页认证头"),
            ("logout", index_content, "主页退出功能"),
        ]

        all_passed = True
        for keyword, content, desc in checks:
            if keyword in content:
                self.add_result("P2.8", desc, True)
            else:
                self.add_result("P2.8", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_auth_models(self) -> bool:
        """验证认证模型"""
        print("\n📋 验证认证模型...")

        models_file = self.project_root / "src" / "api" / "models.py"
        content = models_file.read_text()

        checks = [
            ("TenantRegisterRequest", "商家注册请求模型"),
            ("UserRegisterRequest", "用户注册请求模型"),
            ("LoginRequest", "登录请求模型"),
            ("RefreshTokenRequest", "刷新令牌请求模型"),
            ("TokenResponse", "令牌响应模型"),
            ("TenantResponse", "商家响应模型"),
            ("UserResponse", "用户响应模型"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("P2.9", desc, True)
            else:
                self.add_result("P2.9", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_requirements(self) -> bool:
        """验证依赖配置"""
        print("\n📦 验证认证依赖...")

        req_file = self.project_root / "requirements.txt"
        content = req_file.read_text()

        deps = [
            ("python-jose", "JWT 库"),
            ("passlib", "密码库"),
            ("bcrypt", "Bcrypt 加密"),
        ]

        all_passed = True
        for dep, desc in deps:
            if dep in content:
                self.add_result("P2.10", desc, True)
            else:
                self.add_result("P2.10", desc, False, f"缺少 {dep}")
                all_passed = False

        return all_passed

    async def run(self) -> bool:
        """运行所有验收"""
        print("=" * 60)
        print("Phase 2 Gate Review - 多租户架构验收")
        print("=" * 60)

        checks = [
            ("sync", self.verify_module_structure),
            ("sync", self.verify_jwt_functions),
            ("sync", self.verify_password_functions),
            ("async", self.verify_tenant_crud),
            ("async", self.verify_user_crud),
            ("sync", self.verify_auth_routes),
            ("sync", self.verify_tenant_isolation),
            ("sync", self.verify_frontend_login),
            ("sync", self.verify_auth_models),
            ("sync", self.verify_requirements),
        ]

        all_passed = True
        for check_type, check in checks:
            try:
                if check_type == "async":
                    if not await check():
                        all_passed = False
                else:
                    if not check():
                        all_passed = False
            except Exception as e:
                self.add_result("ERROR", check.__name__, False, f"异常: {e}")
                all_passed = False

        # 打印总结
        print("\n" + "=" * 60)
        print("Phase 2 验收总结")
        print("=" * 60)

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(f"\n通过: {passed}/{total}")

        if all_passed and passed >= total * 0.8:
            print("\n✅ Phase 2 Gate Review 通过!")
            print("\n下一步:")
            print("  1. 启动服务测试登录功能")
            print("  2. 注册商家并登录")
            print("  3. 验证租户隔离")
            print("  4. 完成后进入 Phase 3: 语料自动学习")
        else:
            print("\n❌ Phase 2 Gate Review 未通过")
            print("\n请修复以下问题:")
            for r in self.results:
                if not r["passed"]:
                    print(f"  - [{r['id']}] {r['name']}: {r['message']}")

        return all_passed and passed >= total * 0.8


if __name__ == "__main__":
    reviewer = Phase2GateReviewer()
    success = asyncio.run(reviewer.run())
    sys.exit(0 if success else 1)
