#!/usr/bin/env python3
"""
前端 Gate 1 Review 验收脚本
Phase 1: 核心对话功能

验收标准:
1. 页面正常加载
2. 静态资源正确加载
3. 消息发送功能正常
4. 消息展示正确
5. 多轮对话正常
6. 新建对话功能正常
7. 错误处理正常
"""

import os
import sys
import asyncio
from pathlib import Path

# 添加项目路径
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))


class Gate1Reviewer:
    """Gate 1 验收器"""

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

    def verify_static_directory(self) -> bool:
        """验证静态文件目录结构"""
        print("\n📁 验证静态文件目录...")

        static_dir = self.project_root / "src" / "static"
        index_html = static_dir / "index.html"

        if not static_dir.exists():
            self.add_result("G1.1a", "静态目录存在", False, "src/static/ 目录不存在")
            return False

        self.add_result("G1.1a", "静态目录存在", True)

        if not index_html.exists():
            self.add_result("G1.1b", "index.html 存在", False, "index.html 文件不存在")
            return False

        self.add_result("G1.1b", "index.html 存在", True)

        # 检查 index.html 内容
        content = index_html.read_text()

        checks = [
            ("tailwindcss", "Tailwind CSS CDN"),
            ("alpinejs", "Alpine.js CDN"),
            ("x-data", "Alpine.js 数据绑定"),
            ("sendMessage", "发送消息函数"),
            ("messages", "消息列表"),
            ("conversationId", "会话ID管理"),
            ("newConversation", "新建对话函数"),
            ("isLoading", "加载状态"),
            ("errorMessage", "错误消息"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword.lower() in content.lower():
                self.add_result(f"G1.2", f"包含 {desc}", True)
            else:
                self.add_result(f"G1.2", f"包含 {desc}", False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_main_py_config(self) -> bool:
        """验证 main.py 静态文件配置"""
        print("\n⚙️ 验证 FastAPI 配置...")

        main_py = self.project_root / "src" / "api" / "main.py"

        if not main_py.exists():
            self.add_result("G1.3", "main.py 存在", False)
            return False

        content = main_py.read_text()

        checks = [
            ("StaticFiles", "StaticFiles 导入"),
            ("FileResponse", "FileResponse 导入"),
            ("app.mount", "静态文件挂载"),
            ("index.html", "首页路由配置"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G1.3", desc, True)
            else:
                self.add_result("G1.3", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_html_structure(self) -> bool:
        """验证 HTML 页面结构"""
        print("\n🎨 验证页面结构...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        # 检查页面结构元素
        structure_checks = [
            ("header", "头部区域"),
            ("chat-container", "对话容器"),
            ("messagesContainer", "消息区域"),
            ("inputMessage", "输入框"),
            ("发送", "发送按钮"),
            ("新对话", "新对话按钮"),
        ]

        all_passed = True
        for keyword, desc in structure_checks:
            if keyword in content:
                self.add_result("G1.4", desc, True)
            else:
                self.add_result("G1.4", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_api_integration(self) -> bool:
        """验证 API 集成"""
        print("\n🔌 验证 API 集成...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        api_checks = [
            ("/api/v1/chat/message", "消息发送 API"),
            ("/api/v1/system/health", "健康检查 API"),
            ("conversation_id", "会话 ID 传递"),
            ("Content-Type", "请求头设置"),
        ]

        all_passed = True
        for keyword, desc in api_checks:
            if keyword in content:
                self.add_result("G1.5", desc, True)
            else:
                self.add_result("G1.5", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_ui_features(self) -> bool:
        """验证 UI 功能"""
        print("\n✨ 验证 UI 功能...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        ui_checks = [
            ("typing-indicator", "加载动画"),
            ("scrollToBottom", "自动滚动"),
            ("bg-purple", "品牌配色"),
            ("rounded", "圆角样式"),
            ("user", "用户消息样式"),
            ("assistant", "AI 消息样式"),
        ]

        all_passed = True
        for keyword, desc in ui_checks:
            if keyword in content:
                self.add_result("G1.6", desc, True)
            else:
                self.add_result("G1.6", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_error_handling(self) -> bool:
        """验证错误处理"""
        print("\n🛡️ 验证错误处理...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        error_checks = [
            ("try", "异常捕获"),
            ("catch", "异常处理"),
            ("errorMessage", "错误消息显示"),
            ("isOnline", "在线状态检测"),
            ("disabled", "按钮禁用状态"),
        ]

        all_passed = True
        for keyword, desc in error_checks:
            if keyword in content:
                self.add_result("G1.7", desc, True)
            else:
                self.add_result("G1.7", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_multi_turn_dialog(self) -> bool:
        """验证多轮对话功能"""
        print("\n💬 验证多轮对话...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        dialog_checks = [
            ("conversationId", "会话 ID 管理"),
            ("messages.push", "消息添加"),
            ("newConversation", "新建对话"),
            ("messages = []", "清空消息"),
        ]

        all_passed = True
        for keyword, desc in dialog_checks:
            if keyword in content:
                self.add_result("G1.8", desc, True)
            else:
                self.add_result("G1.8", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def run(self) -> bool:
        """运行所有验收"""
        print("=" * 60)
        print("Gate 1 Review - 前端核心对话功能验收")
        print("=" * 60)

        checks = [
            self.verify_static_directory,
            self.verify_main_py_config,
            self.verify_html_structure,
            self.verify_api_integration,
            self.verify_ui_features,
            self.verify_error_handling,
            self.verify_multi_turn_dialog,
        ]

        all_passed = True
        for check in checks:
            try:
                if not check():
                    all_passed = False
            except Exception as e:
                self.add_result("ERROR", check.__name__, False, f"异常: {e}")
                all_passed = False

        # 打印总结
        print("\n" + "=" * 60)
        print("Gate 1 验收总结")
        print("=" * 60)

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(f"\n通过: {passed}/{total}")

        # 检查阻断条件
        blocking_checks = ["G1.1a", "G1.1b", "G1.3"]
        blocking_failed = [r for r in self.results if r["id"] in blocking_checks and not r["passed"]]

        if blocking_failed:
            print("\n❌ 存在阻断条件未通过:")
            for r in blocking_failed:
                print(f"  - [{r['id']}] {r['name']}: {r['message']}")
            all_passed = False

        if all_passed and passed >= total * 0.8:
            print("\n✅ Gate 1 Review 通过!")
            print("\n下一步:")
            print("  1. 启动服务: cd src && python -m uvicorn api.main:app --reload")
            print("  2. 访问 http://localhost:8000/ 进行功能测试")
            print("  3. 完成功能测试后进入 Phase 2")
        else:
            print("\n❌ Gate 1 Review 未通过")
            print("\n请修复以下问题:")
            for r in self.results:
                if not r["passed"]:
                    print(f"  - [{r['id']}] {r['name']}: {r['message']}")

        return all_passed and passed >= total * 0.8


if __name__ == "__main__":
    reviewer = Gate1Reviewer()
    success = reviewer.run()
    sys.exit(0 if success else 1)
