#!/usr/bin/env python3
"""
前端 Gate 2 Review 验收脚本
Phase 2: 测试辅助信息展示

验收标准:
1. 知识来源展示
2. 匹配分数百分比
3. 模型信息显示
4. 置信度显示
5. 响应时间显示
6. 语言标识显示
7. 折叠/展开功能
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))


class Gate2Reviewer:
    """Gate 2 验收器"""

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

    def verify_sources_display(self) -> bool:
        """验证来源展示功能"""
        print("\n📚 验证知识来源展示...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("msg.sources", "来源数据绑定"),
            ("sources.length", "来源数量判断"),
            ("source.question", "来源问题显示"),
            ("source.answer", "来源答案显示"),
            ("source.score", "来源分数显示"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G2.1", desc, True)
            else:
                self.add_result("G2.1", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_score_format(self) -> bool:
        """验证分数格式"""
        print("\n📊 验证分数百分比格式...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        # 检查百分比转换
        if "source.score * 100" in content or "score * 100" in content:
            self.add_result("G2.2", "分数百分比转换", True)
        else:
            self.add_result("G2.2", "分数百分比转换", False, "缺少分数百分比转换逻辑")
            return False

        if "%" in content:
            self.add_result("G2.2", "百分比符号显示", True)
        else:
            self.add_result("G2.2", "百分比符号显示", False)
            return False

        return True

    def verify_model_info(self) -> bool:
        """验证模型信息显示"""
        print("\n⚡ 验证模型信息显示...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("model_used", "模型字段绑定"),
            ("msg.meta", "元数据对象"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G2.3", desc, True)
            else:
                self.add_result("G2.3", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_confidence_display(self) -> bool:
        """验证置信度显示"""
        print("\n🎯 验证置信度显示...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        if "confidence" in content:
            self.add_result("G2.4", "置信度字段", True)
        else:
            self.add_result("G2.4", "置信度字段", False)
            return False

        if "confidence * 100" in content:
            self.add_result("G2.4", "置信度百分比转换", True)
        else:
            self.add_result("G2.4", "置信度百分比转换", False)
            return False

        return True

    def verify_latency_display(self) -> bool:
        """验证响应时间显示"""
        print("\n⏱️ 验证响应时间显示...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        if "latency_ms" in content:
            self.add_result("G2.5", "响应时间字段", True)
        else:
            self.add_result("G2.5", "响应时间字段", False)
            return False

        # 检查时间格式化（毫秒转秒）
        if "/ 1000" in content or "/1000" in content:
            self.add_result("G2.5", "毫秒转秒转换", True)
        else:
            self.add_result("G2.5", "毫秒转秒转换", False)
            return False

        return True

    def verify_language_display(self) -> bool:
        """验证语言标识显示"""
        print("\n🌐 验证语言标识显示...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("language", "语言字段"),
            ("getLanguageName", "语言名称转换函数"),
            ("日本語", "日语标识"),
            ("中文", "中文标识"),
            ("English", "英语标识"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G2.6", desc, True)
            else:
                self.add_result("G2.6", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_collapse_expand(self) -> bool:
        """验证折叠/展开功能"""
        print("\n📂 验证折叠/展开功能...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        checks = [
            ("showSources", "来源显示状态"),
            ("!msg.showSources", "折叠/展开切换"),
            ("收起来源", "收起文本"),
            ("查看来源", "展开文本"),
        ]

        all_passed = True
        for keyword, desc in checks:
            if keyword in content:
                self.add_result("G2.7", desc, True)
            else:
                self.add_result("G2.7", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_layout_clean(self) -> bool:
        """验证布局整洁"""
        print("\n🎨 验证布局整洁...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        # 检查是否有适当的样式类
        style_checks = [
            ("text-xs", "小字体辅助信息"),
            ("text-gray", "灰色辅助文字"),
            ("border-t", "分隔线"),
            ("mt-", "上边距"),
            ("space-x", "元素间距"),
        ]

        all_passed = True
        for keyword, desc in style_checks:
            if keyword in content:
                self.add_result("G2.8", desc, True)
            else:
                self.add_result("G2.8", desc, False, f"缺少 {keyword}")
                all_passed = False

        return all_passed

    def verify_empty_sources_handling(self) -> bool:
        """验证空来源处理"""
        print("\n🔍 验证空来源处理...")

        index_html = self.project_root / "src" / "static" / "index.html"
        content = index_html.read_text()

        # 检查是否有条件显示逻辑
        if "sources.length > 0" in content or "sources && msg.sources" in content:
            self.add_result("G2.9", "空来源条件判断", True)
            return True
        else:
            self.add_result("G2.9", "空来源条件判断", False, "缺少空来源判断逻辑")
            return False

    def run(self) -> bool:
        """运行所有验收"""
        print("=" * 60)
        print("Gate 2 Review - 测试辅助信息展示验收")
        print("=" * 60)

        checks = [
            self.verify_sources_display,
            self.verify_score_format,
            self.verify_model_info,
            self.verify_confidence_display,
            self.verify_latency_display,
            self.verify_language_display,
            self.verify_collapse_expand,
            self.verify_layout_clean,
            self.verify_empty_sources_handling,
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
        print("Gate 2 验收总结")
        print("=" * 60)

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(f"\n通过: {passed}/{total}")

        if all_passed and passed >= total * 0.8:
            print("\n✅ Gate 2 Review 通过!")
            print("\n下一步:")
            print("  1. 在浏览器中测试辅助信息显示")
            print("  2. 确认来源折叠/展开功能正常")
            print("  3. 完成测试后进入 Phase 3")
        else:
            print("\n❌ Gate 2 Review 未通过")
            print("\n请修复以下问题:")
            for r in self.results:
                if not r["passed"]:
                    print(f"  - [{r['id']}] {r['name']}: {r['message']}")

        return all_passed and passed >= total * 0.8


if __name__ == "__main__":
    reviewer = Gate2Reviewer()
    success = reviewer.run()
    sys.exit(0 if success else 1)
