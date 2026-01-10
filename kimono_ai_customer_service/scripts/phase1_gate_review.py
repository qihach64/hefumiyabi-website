#!/usr/bin/env python3
"""
Phase 1 Gate Review - 数据持久化验收脚本

验收标准:
1. 数据库模块存在且结构正确
2. ORM 模型定义完整
3. 数据库连接正常
4. 表结构创建成功
5. 反馈 API 数据持久化
6. 数据可查询
"""

import sys
import asyncio
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))


class Phase1GateReviewer:
    """Phase 1 验收器"""

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
        """验证模块目录结构"""
        print("\n📁 验证数据库模块结构...")

        checks = [
            ("src/database/__init__.py", "database 包初始化"),
            ("src/database/models.py", "ORM 模型文件"),
            ("src/database/connection.py", "连接管理文件"),
            ("src/database/repositories/__init__.py", "repositories 包"),
            ("src/database/repositories/feedback_repo.py", "反馈仓库"),
            ("src/database/repositories/conversation_repo.py", "对话仓库"),
            ("src/database/repositories/qa_pair_repo.py", "问答对仓库"),
        ]

        all_passed = True
        for path, desc in checks:
            full_path = self.project_root / path
            if full_path.exists():
                self.add_result("P1.1", desc, True)
            else:
                self.add_result("P1.1", desc, False, f"文件不存在: {path}")
                all_passed = False

        return all_passed

    def verify_orm_models(self) -> bool:
        """验证 ORM 模型定义"""
        print("\n📋 验证 ORM 模型...")

        try:
            from database.models import Base, Feedback, Conversation, QAPair, Tenant, User

            models = [
                (Feedback, ["id", "conversation_id", "rating", "feedback_type", "corrected_answer"]),
                (Conversation, ["id", "messages", "message_count"]),
                (QAPair, ["id", "question", "answer", "category", "is_synced"]),
                (Tenant, ["id", "name", "namespace"]),
                (User, ["id", "username", "tenant_id", "role"]),
            ]

            all_passed = True
            for model, required_fields in models:
                model_name = model.__name__

                # 检查表名
                if hasattr(model, "__tablename__"):
                    self.add_result("P1.2", f"{model_name} 表名定义", True)
                else:
                    self.add_result("P1.2", f"{model_name} 表名定义", False)
                    all_passed = False
                    continue

                # 检查必要字段
                columns = [c.name for c in model.__table__.columns]
                for field in required_fields:
                    if field in columns:
                        self.add_result("P1.2", f"{model_name}.{field}", True)
                    else:
                        self.add_result("P1.2", f"{model_name}.{field}", False, "字段缺失")
                        all_passed = False

            return all_passed

        except ImportError as e:
            self.add_result("P1.2", "导入 ORM 模型", False, str(e))
            return False

    async def verify_database_connection(self) -> bool:
        """验证数据库连接"""
        print("\n🔌 验证数据库连接...")

        try:
            from database import init_database, close_database, get_database

            # 使用测试数据库
            test_db_path = self.project_root / "data" / "test_phase1.db"

            await init_database(f"sqlite+aiosqlite:///{test_db_path}")
            self.add_result("P1.3", "数据库初始化", True)

            db = get_database()
            if db._initialized:
                self.add_result("P1.3", "数据库连接状态", True)
            else:
                self.add_result("P1.3", "数据库连接状态", False)
                return False

            # 检查表是否创建
            from database.models import Base
            tables = Base.metadata.tables.keys()
            expected_tables = ["feedbacks", "conversations", "qa_pairs", "tenants", "users"]

            for table in expected_tables:
                if table in tables:
                    self.add_result("P1.3", f"表 {table} 创建", True)
                else:
                    self.add_result("P1.3", f"表 {table} 创建", False)

            await close_database()
            self.add_result("P1.3", "数据库关闭", True)

            # 清理测试数据库
            if test_db_path.exists():
                test_db_path.unlink()

            return True

        except Exception as e:
            self.add_result("P1.3", "数据库连接", False, str(e))
            return False

    async def verify_feedback_crud(self) -> bool:
        """验证反馈 CRUD 操作"""
        print("\n💾 验证反馈 CRUD...")

        try:
            from database import init_database, close_database, get_database
            from database.repositories import FeedbackRepository

            # 使用测试数据库
            test_db_path = self.project_root / "data" / "test_phase1_crud.db"
            await init_database(f"sqlite+aiosqlite:///{test_db_path}")

            db = get_database()
            async with db.session() as session:
                repo = FeedbackRepository(session)

                # 创建反馈
                feedback = await repo.create(
                    conversation_id="test-conv-001",
                    user_question="测试问题",
                    original_answer="测试回答",
                    rating=5,
                    feedback_type="positive",
                    message_id="test-msg-001",
                )
                self.add_result("P1.4", "创建反馈记录", True, f"ID: {feedback.id}")

                # 查询反馈
                found = await repo.get_by_id(feedback.id)
                if found and found.rating == 5:
                    self.add_result("P1.4", "查询反馈记录", True)
                else:
                    self.add_result("P1.4", "查询反馈记录", False)

                # 创建纠偏反馈
                corrected = await repo.create(
                    conversation_id="test-conv-002",
                    user_question="价格问题",
                    original_answer="错误答案",
                    rating=2,
                    feedback_type="corrected",
                    corrected_answer="正确答案",
                )
                if corrected.corrected_answer == "正确答案":
                    self.add_result("P1.4", "创建纠偏反馈", True)
                else:
                    self.add_result("P1.4", "创建纠偏反馈", False)

                # 获取统计
                stats = await repo.get_statistics()
                if stats["total"] >= 2:
                    self.add_result("P1.4", "反馈统计", True, f"总数: {stats['total']}")
                else:
                    self.add_result("P1.4", "反馈统计", False)

            await close_database()

            # 清理测试数据库
            if test_db_path.exists():
                test_db_path.unlink()

            return True

        except Exception as e:
            self.add_result("P1.4", "反馈 CRUD", False, str(e))
            return False

    async def verify_conversation_crud(self) -> bool:
        """验证对话 CRUD 操作"""
        print("\n💬 验证对话 CRUD...")

        try:
            from database import init_database, close_database, get_database
            from database.repositories import ConversationRepository

            # 使用测试数据库
            test_db_path = self.project_root / "data" / "test_phase1_conv.db"
            await init_database(f"sqlite+aiosqlite:///{test_db_path}")

            db = get_database()
            async with db.session() as session:
                repo = ConversationRepository(session)

                # 创建对话
                conv = await repo.create("test-conv-001")
                self.add_result("P1.5", "创建对话", True, f"ID: {conv.id}")

                # 添加消息
                await repo.add_message("test-conv-001", "user", "你好")
                await repo.add_message("test-conv-001", "assistant", "您好！有什么可以帮助您的？")

                # 获取消息
                messages = await repo.get_messages("test-conv-001")
                if len(messages) == 2:
                    self.add_result("P1.5", "添加和获取消息", True, f"消息数: {len(messages)}")
                else:
                    self.add_result("P1.5", "添加和获取消息", False)

                # 获取统计
                stats = await repo.get_statistics()
                if stats["total_conversations"] >= 1:
                    self.add_result("P1.5", "对话统计", True)
                else:
                    self.add_result("P1.5", "对话统计", False)

            await close_database()

            # 清理测试数据库
            if test_db_path.exists():
                test_db_path.unlink()

            return True

        except Exception as e:
            self.add_result("P1.5", "对话 CRUD", False, str(e))
            return False

    def verify_api_integration(self) -> bool:
        """验证 API 集成"""
        print("\n🔌 验证 API 集成...")

        routes_file = self.project_root / "src" / "api" / "routes.py"
        main_file = self.project_root / "src" / "api" / "main.py"

        routes_content = routes_file.read_text()
        main_content = main_file.read_text()

        checks = [
            ("from database import", routes_content, "routes.py 导入 database"),
            ("FeedbackRepository", routes_content, "routes.py 使用 FeedbackRepository"),
            ("get_db_session", routes_content, "routes.py 使用 get_db_session"),
            ("init_database", main_content, "main.py 初始化数据库"),
            ("close_database", main_content, "main.py 关闭数据库"),
        ]

        all_passed = True
        for keyword, content, desc in checks:
            if keyword in content:
                self.add_result("P1.6", desc, True)
            else:
                self.add_result("P1.6", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_requirements(self) -> bool:
        """验证依赖配置"""
        print("\n📦 验证依赖配置...")

        req_file = self.project_root / "requirements.txt"
        content = req_file.read_text()

        deps = [
            ("sqlalchemy", "SQLAlchemy ORM"),
            ("aiosqlite", "异步 SQLite 支持"),
            ("asyncpg", "异步 PostgreSQL 支持"),
        ]

        all_passed = True
        for dep, desc in deps:
            if dep in content:
                self.add_result("P1.7", desc, True)
            else:
                self.add_result("P1.7", desc, False, f"缺少 {dep}")
                all_passed = False

        return all_passed

    async def run(self) -> bool:
        """运行所有验收"""
        print("=" * 60)
        print("Phase 1 Gate Review - 数据持久化验收")
        print("=" * 60)

        checks = [
            ("sync", self.verify_module_structure),
            ("sync", self.verify_orm_models),
            ("async", self.verify_database_connection),
            ("async", self.verify_feedback_crud),
            ("async", self.verify_conversation_crud),
            ("sync", self.verify_api_integration),
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
        print("Phase 1 验收总结")
        print("=" * 60)

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(f"\n通过: {passed}/{total}")

        if all_passed and passed >= total * 0.8:
            print("\n✅ Phase 1 Gate Review 通过!")
            print("\n下一步:")
            print("  1. 启动服务测试反馈功能")
            print("  2. 验证反馈数据持久化到 data/kimono_ai.db")
            print("  3. 完成后进入 Phase 2: 多租户架构")
        else:
            print("\n❌ Phase 1 Gate Review 未通过")
            print("\n请修复以下问题:")
            for r in self.results:
                if not r["passed"]:
                    print(f"  - [{r['id']}] {r['name']}: {r['message']}")

        return all_passed and passed >= total * 0.8


if __name__ == "__main__":
    reviewer = Phase1GateReviewer()
    success = asyncio.run(reviewer.run())
    sys.exit(0 if success else 1)
