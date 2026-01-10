#!/usr/bin/env python3
"""
前端 Gate 3 Review 验收脚本
Phase 3: 反馈功能

验收标准:
1. 反馈按钮显示
2. 点击效果
3. API 调用
4. 成功提示
5. 防重复提交
6. 状态保持
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))


class Gate3Reviewer:
    """Gate 3 验收器"""

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

    def verify_feedback_buttons(self) -> bool:
        """验证反馈按钮"""
        print("\n👍 验证反馈按钮...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("submitFeedback", "反馈提交函数"),
            ("有帮助", "正面反馈按钮提示"),
            ("需要改进", "负面反馈按钮提示"),
            ("M14 10h4.764", "拇指向上图标 SVG"),
            ("M10 14H5.236", "拇指向下图标 SVG"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword.lower() in content.lower():
                self.add_result("G3.1", desc, True)
            else:
                self.add_result("G3.1", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_click_effect(self) -> bool:
        """验证点击效果"""
        print("\n🖱️ 验证点击效果...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("hover:bg-green", "正面反馈悬停效果"),
            ("hover:bg-red", "负面反馈悬停效果"),
            ("hover:text-green", "正面反馈文字变色"),
            ("hover:text-red", "负面反馈文字变色"),
            ("transition", "过渡动画"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G3.2", desc, True)
            else:
                self.add_result("G3.2", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_api_call(self) -> bool:
        """验证 API 调用"""
        print("\n🔌 验证反馈 API 调用...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("/api/v1/chat/feedback", "反馈 API 端点"),
            ("message_id", "消息 ID 传递"),
            ("rating", "评分传递"),
            ("POST", "POST 请求方法"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G3.3", desc, True)
            else:
                self.add_result("G3.3", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_success_message(self) -> bool:
        """验证成功提示"""
        print("\n✅ 验证成功提示...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("感谢反馈", "感谢提示文字"),
            ("msg.feedback", "反馈状态判断"),
            ("text-green", "成功提示颜色"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G3.4", desc, True)
            else:
                self.add_result("G3.4", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_prevent_duplicate(self) -> bool:
        """验证防重复提交"""
        print("\n🔒 验证防重复提交...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("feedbackLoading", "加载状态标识"),
            ("msg.feedback", "已反馈状态检查"),
            (":disabled", "按钮禁用绑定"),
            ("!msg.feedback", "未反馈条件判断"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G3.5", desc, True)
            else:
                self.add_result("G3.5", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_state_management(self) -> bool:
        """验证状态管理"""
        print("\n📊 验证状态管理...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("feedback: null", "初始反馈状态"),
            ("feedbackLoading: false", "初始加载状态"),
            ("msg.feedback = type", "反馈状态更新"),
            ("msg.feedbackLoading = true", "加载状态设置"),
            ("msg.feedbackLoading = false", "加载状态清除"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G3.6", desc, True)
            else:
                self.add_result("G3.6", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_error_handling(self) -> bool:
        """验证错误处理"""
        print("\n🛡️ 验证错误处理...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("try", "异常捕获"),
            ("catch", "异常处理"),
            ("console.error", "错误日志"),
            ("finally", "最终处理"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G3.7", desc, True)
            else:
                self.add_result("G3.7", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def run(self) -> bool:
        """运行所有验收"""
        print("=" * 60)
        print("Gate 3 Review - 反馈功能验收")
        print("=" * 60)

        checks = [
            self.verify_feedback_buttons,
            self.verify_click_effect,
            self.verify_api_call,
            self.verify_success_message,
            self.verify_prevent_duplicate,
            self.verify_state_management,
            self.verify_error_handling,
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
        print("Gate 3 验收总结")
        print("=" * 60)

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(f"\n通过: {passed}/{total}")

        if all_passed and passed >= total * 0.8:
            print("\n✅ Gate 3 Review 通过!")
            print("\n下一步:")
            print("  1. 在浏览器中测试反馈功能")
            print("  2. 点击 👍/👎 验证反馈提交")
            print("  3. 完成测试后进入 Phase 4")
        else:
            print("\n❌ Gate 3 Review 未通过")
            print("\n请修复以下问题:")
            for r in self.results:
                if not r["passed"]:
                    print(f"  - [{r['id']}] {r['name']}: {r['message']}")

        return all_passed and passed >= total * 0.8


if __name__ == "__main__":
    reviewer = Gate3Reviewer()
    success = reviewer.run()
    sys.exit(0 if success else 1)
