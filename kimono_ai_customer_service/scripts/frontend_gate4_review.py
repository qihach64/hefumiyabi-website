#!/usr/bin/env python3
"""
前端 Gate 4 Review 验收脚本
Phase 4: 增强功能

验收标准:
1. 快捷问题面板
2. Enter 发送 / Shift+Enter 换行
3. 使用说明弹窗
4. localStorage 会话持久化
5. 移动端适配
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))


class Gate4Reviewer:
    """Gate 4 验收器"""

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

    def verify_quick_questions(self) -> bool:
        """验证快捷问题面板"""
        print("\n💬 验证快捷问题面板...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("quickQuestions", "快捷问题数组"),
            ("showQuickQuestions", "快捷问题显示状态"),
            ("sendQuickQuestion", "快捷问题发送函数"),
            ("快捷问题", "快捷问题按钮文本"),
            ("快捷测试问题", "快捷问题面板标题"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G4.1", desc, True)
            else:
                self.add_result("G4.1", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_keyboard_shortcuts(self) -> bool:
        """验证键盘快捷键"""
        print("\n⌨️ 验证键盘快捷键...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("handleKeydown", "键盘事件处理函数"),
            ("event.shiftKey", "Shift 键检测"),
            ("event.preventDefault", "默认行为阻止"),
            ("Enter 发送", "Enter 发送提示"),
            ("Shift+Enter 换行", "Shift+Enter 提示"),
            ("textarea", "多行输入框"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G4.2", desc, True)
            else:
                self.add_result("G4.2", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_help_modal(self) -> bool:
        """验证使用说明弹窗"""
        print("\n❓ 验证使用说明弹窗...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("showHelp", "帮助弹窗状态"),
            ("使用说明", "帮助弹窗标题"),
            ("基本操作", "基本操作说明"),
            ("多语言支持", "多语言说明"),
            ("反馈功能", "反馈功能说明"),
            ("会话保存", "会话保存说明"),
            ("知道了", "确认按钮文本"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G4.3", desc, True)
            else:
                self.add_result("G4.3", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_local_storage(self) -> bool:
        """验证 localStorage 会话持久化"""
        print("\n💾 验证 localStorage 会话持久化...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("localStorage", "localStorage API"),
            ("saveConversation", "保存会话函数"),
            ("loadConversation", "加载会话函数"),
            ("clearSavedConversation", "清除会话函数"),
            ("kimono_chat_conversation", "存储键名"),
            ("JSON.stringify", "JSON 序列化"),
            ("JSON.parse", "JSON 解析"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G4.4", desc, True)
            else:
                self.add_result("G4.4", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_textarea_auto_resize(self) -> bool:
        """验证文本框自动调整"""
        print("\n📏 验证文本框自动调整...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("autoResize", "自动调整函数"),
            ("scrollHeight", "内容高度获取"),
            ("max-height", "最大高度限制"),
            ("resize-none", "禁用手动调整"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G4.5", desc, True)
            else:
                self.add_result("G4.5", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_mobile_responsive(self) -> bool:
        """验证移动端适配"""
        print("\n📱 验证移动端适配...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("viewport", "视口元标签"),
            ("max-w-4xl", "最大宽度限制"),
            ("mx-auto", "居中对齐"),
            ("md:grid-cols-2", "响应式网格"),
            ("px-4", "水平内边距"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G4.6", desc, True)
            else:
                self.add_result("G4.6", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_modal_interaction(self) -> bool:
        """验证弹窗交互"""
        print("\n🖱️ 验证弹窗交互...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("@click.self", "点击背景关闭"),
            ("@click.stop", "阻止事件冒泡"),
            ("fixed inset-0", "全屏遮罩"),
            ("z-50", "层级设置"),
            ("bg-opacity-50", "半透明背景"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G4.7", desc, True)
            else:
                self.add_result("G4.7", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def run(self) -> bool:
        """运行所有验收"""
        print("=" * 60)
        print("Gate 4 Review - 增强功能验收")
        print("=" * 60)

        checks = [
            self.verify_quick_questions,
            self.verify_keyboard_shortcuts,
            self.verify_help_modal,
            self.verify_local_storage,
            self.verify_textarea_auto_resize,
            self.verify_mobile_responsive,
            self.verify_modal_interaction,
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
        print("Gate 4 验收总结")
        print("=" * 60)

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(f"\n通过: {passed}/{total}")

        if all_passed and passed >= total * 0.8:
            print("\n✅ Gate 4 Review 通过!")
            print("\n🎉 前端开发全部完成!")
            print("\n下一步:")
            print("  1. 在浏览器中测试所有功能")
            print("  2. 验证 Shift+Enter 换行功能")
            print("  3. 验证会话保存和恢复功能")
            print("  4. 验证帮助弹窗显示")
        else:
            print("\n❌ Gate 4 Review 未通过")
            print("\n请修复以下问题:")
            for r in self.results:
                if not r["passed"]:
                    print(f"  - [{r['id']}] {r['name']}: {r['message']}")

        return all_passed and passed >= total * 0.8


if __name__ == "__main__":
    reviewer = Gate4Reviewer()
    success = reviewer.run()
    sys.exit(0 if success else 1)
