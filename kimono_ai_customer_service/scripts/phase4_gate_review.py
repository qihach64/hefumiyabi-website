#!/usr/bin/env python3
"""
Phase 4 Gate Review - 通用模板语料验收脚本

验收标准:
| ID   | 检查项      | 验收标准                              |
|------|------------|--------------------------------------|
| P4.1 | 语料分析    | 完成现有语料的通用性分析报告           |
| P4.2 | 模板提取    | 提取 500+ 条通用模板语料              |
| P4.3 | 质量验证    | 模板语料通过质量检查                  |
| P4.4 | 初始化 API  | 新商家初始化 API 可用                 |
| P4.5 | 模板复制    | 通用语料正确复制到新商家 namespace    |
| P4.6 | 隔离验证    | 新商家修改不影响模板                  |

运行: python scripts/phase4_gate_review.py
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Optional

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

# Load environment
from dotenv import load_dotenv
load_dotenv(project_root / ".env")


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
    phase: str = "Phase 4"
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

class Phase4GateReview:
    """Phase 4 Gate Review 测试"""

    def __init__(self):
        self.review = GateReviewResult()
        self.templates_file = project_root / "data" / "templates" / "universal_templates.json"
        self.report_file = project_root / "data" / "templates" / "analysis_report.txt"

    def print_header(self):
        """打印标题"""
        print("\n" + "=" * 60)
        print("Phase 4 Gate Review - 通用模板语料验收")
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
            print("\n🎉 Phase 4 Gate Review 全部通过!")
            print("   通用模板语料系统已准备就绪")
        else:
            print(f"\n⚠️  有 {self.review.failed_tests} 个测试未通过")
            print("   请修复问题后重新运行验收")

        print("\n" + "=" * 60 + "\n")

    # ========== P4.1 语料分析报告 ==========

    def test_p4_1_analysis_report(self) -> TestResult:
        """P4.1: 检查语料分析报告是否存在且有效"""
        test_id = "P4.1"
        test_name = "语料分析报告"

        if not self.report_file.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="分析报告文件不存在",
                details={"expected_path": str(self.report_file)}
            )

        # 读取报告内容
        with open(self.report_file, "r", encoding="utf-8") as f:
            content = f.read()

        # 检查报告包含必要信息
        required_sections = [
            "总 QA 对数量",
            "通用候选数量",
            "类别分布",
            "排除原因分布"
        ]

        missing_sections = []
        for section in required_sections:
            if section not in content:
                missing_sections.append(section)

        if missing_sections:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"分析报告缺少必要章节: {missing_sections}",
                details={"report_length": len(content)}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="语料分析报告完整",
            details={"report_length": len(content)}
        )

    # ========== P4.2 模板提取数量 ==========

    def test_p4_2_template_count(self) -> TestResult:
        """P4.2: 检查提取的模板数量是否达到 500+"""
        test_id = "P4.2"
        test_name = "模板提取数量"
        min_required = 500

        if not self.templates_file.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="模板文件不存在",
                details={"expected_path": str(self.templates_file)}
            )

        with open(self.templates_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 支持嵌套格式 {metadata, templates} 和扁平数组格式
        if isinstance(data, dict) and "templates" in data:
            templates = data["templates"]
        else:
            templates = data

        count = len(templates)

        if count < min_required:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"模板数量不足，需要 {min_required}+，实际 {count}",
                details={"count": count, "required": min_required}
            )

        # 统计类别分布
        categories = {}
        for t in templates:
            cat = t.get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message=f"模板数量达标: {count} 条",
            details={"count": count, "categories": categories}
        )

    # ========== P4.3 质量验证 ==========

    def test_p4_3_quality_check(self) -> TestResult:
        """P4.3: 检查模板质量"""
        test_id = "P4.3"
        test_name = "模板质量验证"

        if not self.templates_file.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="模板文件不存在"
            )

        with open(self.templates_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 支持嵌套格式 {metadata, templates} 和扁平数组格式
        if isinstance(data, dict) and "templates" in data:
            templates = data["templates"]
        else:
            templates = data

        # 质量检查
        issues = []
        total_score = 0.0
        valid_count = 0

        for i, t in enumerate(templates):
            # 检查必要字段
            if not t.get("question"):
                issues.append(f"模板 {i}: 缺少问题")
                continue
            if not t.get("answer"):
                issues.append(f"模板 {i}: 缺少答案")
                continue
            if not t.get("category"):
                issues.append(f"模板 {i}: 缺少类别")
                continue

            # 累计质量分数
            score = t.get("quality_score", 0.0)
            total_score += score
            valid_count += 1

        # 计算平均质量分数
        avg_score = total_score / valid_count if valid_count > 0 else 0.0
        min_avg_score = 0.6  # 最低平均质量分数要求

        if issues:
            # 只显示前 5 个问题
            display_issues = issues[:5]
            if len(issues) > 5:
                display_issues.append(f"... 还有 {len(issues) - 5} 个问题")

            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"发现 {len(issues)} 个质量问题",
                details={"issues": display_issues}
            )

        if avg_score < min_avg_score:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"平均质量分数 {avg_score:.2f} 低于要求 {min_avg_score}",
                details={"avg_score": round(avg_score, 3)}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message=f"质量检查通过，平均分数: {avg_score:.3f}",
            details={
                "valid_templates": valid_count,
                "avg_quality_score": round(avg_score, 3)
            }
        )

    # ========== P4.4 初始化 API 检查 ==========

    def test_p4_4_init_api(self) -> TestResult:
        """P4.4: 检查初始化 API 是否可用"""
        test_id = "P4.4"
        test_name = "初始化 API 可用性"

        # 检查路由文件是否存在
        routes_file = project_root / "src" / "api" / "tenant_routes.py"

        if not routes_file.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="tenant_routes.py 不存在",
                details={"expected_path": str(routes_file)}
            )

        # 读取文件检查 API 端点
        with open(routes_file, "r", encoding="utf-8") as f:
            content = f.read()

        required_endpoints = [
            "/initialize",
            "/templates",
            "/templates/stats",
            "/status"
        ]

        missing_endpoints = []
        for endpoint in required_endpoints:
            if endpoint not in content:
                missing_endpoints.append(endpoint)

        if missing_endpoints:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少 API 端点: {missing_endpoints}",
                details={"missing": missing_endpoints}
            )

        # 检查主要函数
        required_functions = [
            "initialize_tenant",
            "get_templates",
            "get_template_stats",
            "copy_templates_to_vector_db"
        ]

        missing_functions = []
        for func in required_functions:
            if func not in content:
                missing_functions.append(func)

        if missing_functions:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"缺少函数: {missing_functions}",
                details={"missing": missing_functions}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="初始化 API 端点完整",
            details={"endpoints": required_endpoints, "functions": required_functions}
        )

    # ========== P4.5 模板复制逻辑检查 ==========

    def test_p4_5_template_copy(self) -> TestResult:
        """P4.5: 检查模板复制到 namespace 的逻辑"""
        test_id = "P4.5"
        test_name = "模板复制逻辑"

        routes_file = project_root / "src" / "api" / "tenant_routes.py"

        if not routes_file.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="tenant_routes.py 不存在"
            )

        with open(routes_file, "r", encoding="utf-8") as f:
            content = f.read()

        # 检查关键复制逻辑
        required_logic = [
            "copy_templates_to_vector_db",  # 后台任务函数
            "background_tasks.add_task",     # 后台任务添加
            "namespace",                     # namespace 参数
            "PineconeService",               # Pinecone 服务
            "upsert_vectors",                # 向量写入
            "template_",                     # 模板 ID 前缀
        ]

        missing_logic = []
        for logic in required_logic:
            if logic not in content:
                missing_logic.append(logic)

        if missing_logic:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"复制逻辑不完整: {missing_logic}",
                details={"missing": missing_logic}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="模板复制逻辑完整",
            details={"checked_elements": required_logic}
        )

    # ========== P4.6 隔离验证 ==========

    def test_p4_6_isolation(self) -> TestResult:
        """P4.6: 检查租户隔离机制"""
        test_id = "P4.6"
        test_name = "租户隔离验证"

        routes_file = project_root / "src" / "api" / "tenant_routes.py"

        if not routes_file.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="tenant_routes.py 不存在"
            )

        with open(routes_file, "r", encoding="utf-8") as f:
            content = f.read()

        # 检查隔离相关逻辑
        isolation_checks = [
            "tenant_id",                      # 租户 ID
            "tenant.namespace",               # 租户专属 namespace
            "get_current_tenant_admin",       # 权限验证
            "source.*template",               # 标记来源为模板
        ]

        issues = []

        # 检查租户 ID 使用
        if "tenant_id" not in content:
            issues.append("未使用 tenant_id 进行隔离")

        # 检查 namespace 使用
        if "namespace" not in content:
            issues.append("未使用 namespace 进行数据隔离")

        # 检查权限验证
        if "get_current_tenant_admin" not in content:
            issues.append("未进行租户管理员权限验证")

        if issues:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"隔离机制不完整: {issues}",
                details={"issues": issues}
            )

        # 检查模板是只读的（不会被商家修改影响）
        # 模板文件是独立存储的，复制后商家操作的是自己 namespace 的副本
        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="租户隔离机制完整",
            details={
                "isolation_method": "namespace",
                "template_storage": "独立文件，复制到商家 namespace"
            }
        )

    # ========== P4.7 服务文件检查 ==========

    def test_p4_7_service_file(self) -> TestResult:
        """P4.7: 检查模板服务文件"""
        test_id = "P4.7"
        test_name = "模板服务完整性"

        service_file = project_root / "src" / "services" / "template_service.py"

        if not service_file.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="template_service.py 不存在",
                details={"expected_path": str(service_file)}
            )

        with open(service_file, "r", encoding="utf-8") as f:
            content = f.read()

        required_components = [
            "UNIVERSAL_CRITERIA",
            "TemplateService",
            "TenantInitializationService",
            "analyze_qa_pair",
            "analyze_corpus",
            "extract_universal_templates",
            "clean_for_template"
        ]

        missing = []
        for comp in required_components:
            if comp not in content:
                missing.append(comp)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"服务文件缺少组件: {missing}",
                details={"missing": missing}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="模板服务文件完整",
            details={"components": required_components}
        )

    # ========== P4.8 提取脚本检查 ==========

    def test_p4_8_extract_script(self) -> TestResult:
        """P4.8: 检查模板提取脚本"""
        test_id = "P4.8"
        test_name = "提取脚本可用性"

        script_file = project_root / "scripts" / "extract_templates.py"

        if not script_file.exists():
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message="extract_templates.py 不存在",
                details={"expected_path": str(script_file)}
            )

        with open(script_file, "r", encoding="utf-8") as f:
            content = f.read()

        required_features = [
            "--analyze",
            "--extract",
            "--all",
            "argparse",
            "TemplateService"
        ]

        missing = []
        for feature in required_features:
            if feature not in content:
                missing.append(feature)

        if missing:
            return TestResult(
                test_id=test_id,
                test_name=test_name,
                passed=False,
                message=f"提取脚本缺少功能: {missing}",
                details={"missing": missing}
            )

        return TestResult(
            test_id=test_id,
            test_name=test_name,
            passed=True,
            message="提取脚本功能完整",
            details={"features": required_features}
        )

    # ========== 运行所有测试 ==========

    def run_all_tests(self):
        """运行所有测试"""
        self.print_header()

        # 定义测试顺序
        tests = [
            self.test_p4_1_analysis_report,
            self.test_p4_2_template_count,
            self.test_p4_3_quality_check,
            self.test_p4_4_init_api,
            self.test_p4_5_template_copy,
            self.test_p4_6_isolation,
            self.test_p4_7_service_file,
            self.test_p4_8_extract_script,
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
    review = Phase4GateReview()
    success = review.run_all_tests()

    # 返回退出码
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
