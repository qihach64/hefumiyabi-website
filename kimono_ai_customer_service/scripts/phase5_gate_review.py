#!/usr/bin/env python3
"""
Phase 5 Gate Review - 客服界面优化验收脚本

验收标准:
| ID   | 检查项      | 验收标准                              |
|------|------------|--------------------------------------|
| P5.1 | 登录页面    | 客服可登录，显示所属商家              |
| P5.2 | 工作台      | 完整的对话和反馈界面                  |
| P5.3 | 编辑答案    | 支持编辑 AI 回答后采纳               |
| P5.4 | 历史记录    | 可查看历史对话                        |
| P5.5 | 语料管理    | 管理员可查看/编辑语料                 |
| P5.6 | 多客服      | 多客服同时使用互不影响               |
| P5.7 | 响应式      | 移动端适配良好                        |

运行: python scripts/phase5_gate_review.py
"""

import os
import sys
import re
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Optional

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))


# ========== 测试结果数据类 ==========

@dataclass
class TestResult:
    """单个测试结果"""
    test_id: str
    test_name: str
    passed: bool
    message: str
    details: Optional[dict] = None


@dataclass
class GateReviewResult:
    """Gate Review 总体结果"""
    phase: str = "Phase 5"
    total_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0
    results: List[TestResult] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None

    @property
    def success_rate(self) -> float:
        if self.total_tests == 0:
            return 0.0
        return self.passed_tests / self.total_tests * 100

    def add_result(self, result: TestResult):
        self.results.append(result)
        self.total_tests += 1
        if result.passed:
            self.passed_tests += 1
        else:
            self.failed_tests += 1


# ========== 测试用例 ==========

class Phase5GateReview:
    """Phase 5 Gate Review 测试"""

    def __init__(self):
        self.review = GateReviewResult()
        self.static_dir = project_root / "src" / "static"
        self.index_html = self.static_dir / "index.html"
        self.login_html = self.static_dir / "login.html"
        self.corpus_html = self.static_dir / "corpus.html"

    def print_header(self):
        """打印标题"""
        print("\n" + "=" * 60)
        print("Phase 5 Gate Review - 客服界面优化验收")
        print("=" * 60)
        print(f"开始时间: {self.review.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 60 + "\n")

    def print_result(self, result: TestResult):
        """打印测试结果"""
        status = "✅ PASS" if result.passed else "❌ FAIL"
        print(f"[{result.test_id}] {result.test_name}")
        print(f"   状态: {status}")
        print(f"   说明: {result.message}")
        if result.details:
            for key, value in result.details.items():
                print(f"   {key}: {value}")
        print()

    def print_summary(self):
        """打印总结"""
        self.review.end_time = datetime.now()
        duration = (self.review.end_time - self.review.start_time).total_seconds()

        print("-" * 60)
        print("Gate Review 总结")
        print("-" * 60)
        print(f"总测试数: {self.review.total_tests}")
        print(f"通过: {self.review.passed_tests}")
        print(f"失败: {self.review.failed_tests}")
        print(f"通过率: {self.review.success_rate:.1f}%")
        print(f"耗时: {duration:.2f} 秒")
        print("-" * 60)

        if self.review.failed_tests == 0:
            print("\n🎉 Phase 5 Gate Review 全部通过!")
            print("   客服界面优化已完成")
        else:
            print(f"\n⚠️  有 {self.review.failed_tests} 个测试未通过")
            print("   请修复问题后重新运行验收")

        print("\n" + "=" * 60 + "\n")

    # ========== P5.1 登录页面 ==========

    def test_p5_1_login_page(self) -> TestResult:
        """P5.1: 检查登录页面"""
        test_id = "P5.1"
        test_name = "登录页面"

        if not self.login_html.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="login.html 不存在",
                details={"expected_path": str(self.login_html)}
            )

        with open(self.login_html, "r", encoding="utf-8") as f:
            content = f.read()

        required_elements = [
            ("登录表单", "loginForm"),
            ("商家 ID 输入", "tenant_id"),
            ("用户名输入", "username"),
            ("密码输入", "password"),
            ("登录按钮", "登录"),
            ("注册功能", "register"),
            ("商家名称显示", "tenant_name"),
        ]

        missing = []
        for name, keyword in required_elements:
            if keyword not in content:
                missing.append(name)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少元素: {missing}",
                details={"missing": missing}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="登录页面完整",
            details={"elements_checked": len(required_elements)}
        )

    # ========== P5.2 工作台界面 ==========

    def test_p5_2_workstation(self) -> TestResult:
        """P5.2: 检查工作台界面"""
        test_id = "P5.2"
        test_name = "工作台界面"

        if not self.index_html.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="index.html 不存在"
            )

        with open(self.index_html, "r", encoding="utf-8") as f:
            content = f.read()

        required_elements = [
            ("消息列表", "messages"),
            ("消息输入框", "inputMessage"),
            ("发送按钮", "sendMessage"),
            ("用户消息", "role === 'user'"),
            ("AI 消息", "role === 'assistant'"),
            ("反馈按钮", "submitFeedback"),
            ("来源显示", "sources"),
            ("置信度显示", "confidence"),
        ]

        missing = []
        for name, keyword in required_elements:
            if keyword not in content:
                missing.append(name)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少元素: {missing}",
                details={"missing": missing}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="工作台界面完整",
            details={"elements_checked": len(required_elements)}
        )

    # ========== P5.3 编辑答案功能 ==========

    def test_p5_3_edit_answer(self) -> TestResult:
        """P5.3: 检查编辑答案功能"""
        test_id = "P5.3"
        test_name = "编辑答案功能"

        if not self.index_html.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="index.html 不存在"
            )

        with open(self.index_html, "r", encoding="utf-8") as f:
            content = f.read()

        required_elements = [
            ("编辑按钮", "openEditModal"),
            ("编辑模态框", "showEditModal"),
            ("纠正答案输入", "correctedAnswer"),
            ("提交纠偏", "submitCorrectedFeedback"),
            ("纠偏标记", "corrected"),
        ]

        missing = []
        for name, keyword in required_elements:
            if keyword not in content:
                missing.append(name)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少元素: {missing}",
                details={"missing": missing}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="编辑答案功能完整",
            details={"elements_checked": len(required_elements)}
        )

    # ========== P5.4 历史记录 ==========

    def test_p5_4_history(self) -> TestResult:
        """P5.4: 检查历史记录功能"""
        test_id = "P5.4"
        test_name = "历史记录功能"

        if not self.index_html.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="index.html 不存在"
            )

        with open(self.index_html, "r", encoding="utf-8") as f:
            content = f.read()

        required_elements = [
            ("历史记录按钮", "showHistory"),
            ("历史记录列表", "conversationHistory"),
            ("加载历史对话", "loadHistoryConversation"),
            ("删除历史记录", "deleteHistoryConversation"),
            ("清空历史", "clearAllHistory"),
            ("保存到历史", "saveToHistory"),
        ]

        missing = []
        for name, keyword in required_elements:
            if keyword not in content:
                missing.append(name)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少元素: {missing}",
                details={"missing": missing}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="历史记录功能完整",
            details={"elements_checked": len(required_elements)}
        )

    # ========== P5.5 语料管理 ==========

    def test_p5_5_corpus_management(self) -> TestResult:
        """P5.5: 检查语料管理功能"""
        test_id = "P5.5"
        test_name = "语料管理"

        if not self.corpus_html.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="corpus.html 不存在",
                details={"expected_path": str(self.corpus_html)}
            )

        with open(self.corpus_html, "r", encoding="utf-8") as f:
            content = f.read()

        required_elements = [
            ("权限检查", "isAuthorized"),
            ("语料列表", "corpusList"),
            ("待审核列表", "pendingList"),
            ("添加语料", "showAddModal"),
            ("编辑语料", "editCorpusItem"),
            ("删除语料", "deleteCorpusItem"),
            ("审核通过", "approveFeedback"),
            ("审核拒绝", "rejectFeedback"),
            ("统计信息", "stats"),
        ]

        missing = []
        for name, keyword in required_elements:
            if keyword not in content:
                missing.append(name)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少元素: {missing}",
                details={"missing": missing}
            )

        # 检查 index.html 是否有语料管理入口
        with open(self.index_html, "r", encoding="utf-8") as f:
            index_content = f.read()

        if "corpus.html" not in index_content:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="index.html 缺少语料管理入口链接",
                details={"missing_link": "corpus.html"}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="语料管理功能完整",
            details={"elements_checked": len(required_elements)}
        )

    # ========== P5.6 多客服支持 ==========

    def test_p5_6_multi_agent(self) -> TestResult:
        """P5.6: 检查多客服支持"""
        test_id = "P5.6"
        test_name = "多客服支持"

        if not self.index_html.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="index.html 不存在"
            )

        with open(self.index_html, "r", encoding="utf-8") as f:
            content = f.read()

        # 多客服支持需要以下架构元素
        isolation_elements = [
            ("用户认证", "accessToken"),
            ("用户信息", "userInfo"),
            ("会话 ID", "conversationId"),
            ("本地存储", "localStorage"),
            ("认证头", "getAuthHeaders"),
            ("登录状态", "isLoggedIn"),
        ]

        missing = []
        for name, keyword in isolation_elements:
            if keyword not in content:
                missing.append(name)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少隔离元素: {missing}",
                details={"missing": missing}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="多客服会话隔离完整",
            details={
                "isolation_method": "独立 session + localStorage",
                "elements_checked": len(isolation_elements)
            }
        )

    # ========== P5.7 响应式设计 ==========

    def test_p5_7_responsive(self) -> TestResult:
        """P5.7: 检查响应式设计"""
        test_id = "P5.7"
        test_name = "响应式设计"

        if not self.index_html.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="index.html 不存在"
            )

        with open(self.index_html, "r", encoding="utf-8") as f:
            content = f.read()

        responsive_elements = [
            ("Tailwind CSS", "tailwindcss"),
            ("视口设置", "viewport"),
            ("响应式类", "sm:"),
            ("响应式类", "md:"),
            ("媒体查询", "@media"),
            ("弹性布局", "flex"),
            ("最大宽度", "max-w-"),
        ]

        missing = []
        for name, keyword in responsive_elements:
            if keyword not in content:
                missing.append(name)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少响应式元素: {missing}",
                details={"missing": missing}
            )

        # 检查 login.html 和 corpus.html 的响应式
        for html_file in [self.login_html, self.corpus_html]:
            if html_file.exists():
                with open(html_file, "r", encoding="utf-8") as f:
                    file_content = f.read()
                if "tailwindcss" not in file_content:
                    return TestResult(
                        test_id=test_id,
                        test_name=test_name,
                        passed=False,
                        message=f"{html_file.name} 缺少 Tailwind CSS"
                    )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="响应式设计完整",
            details={"elements_checked": len(responsive_elements)}
        )

    # ========== P5.8 文件完整性 ==========

    def test_p5_8_files(self) -> TestResult:
        """P5.8: 检查文件完整性"""
        test_id = "P5.8"
        test_name = "文件完整性"

        required_files = [
            self.index_html,
            self.login_html,
            self.corpus_html,
        ]

        missing_files = []
        file_sizes = {}

        for file_path in required_files:
            if not file_path.exists():
                missing_files.append(file_path.name)
            else:
                file_sizes[file_path.name] = f"{file_path.stat().st_size / 1024:.1f} KB"

        if missing_files:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少文件: {missing_files}",
                details={"missing": missing_files}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="所有前端文件存在",
            details={"file_sizes": file_sizes}
        )

    # ========== 运行所有测试 ==========

    def run_all_tests(self):
        """运行所有测试"""
        self.print_header()

        # 定义测试顺序
        tests = [
            self.test_p5_1_login_page,
            self.test_p5_2_workstation,
            self.test_p5_3_edit_answer,
            self.test_p5_4_history,
            self.test_p5_5_corpus_management,
            self.test_p5_6_multi_agent,
            self.test_p5_7_responsive,
            self.test_p5_8_files,
        ]

        # 运行每个测试
        for test_func in tests:
            try:
                result = test_func()
            except Exception as e:
                result = TestResult(
                    test_id=test_func.__name__,
                    test_name=test_func.__doc__ or test_func.__name__,
                    passed=False,
                    message=f"测试执行异常: {e}"
                )

            self.review.add_result(result)
            self.print_result(result)

        self.print_summary()

        return self.review.failed_tests == 0


# ========== 主入口 ==========

def main():
    """主函数"""
    review = Phase5GateReview()
    success = review.run_all_tests()

    # 返回退出码
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
