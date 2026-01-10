#!/usr/bin/env python3
"""
Gate 5 Verification Script
Phase 5 验收: 测试与优化
"""
import sys
import os
import subprocess
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / ".env")

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    console = None


def print_banner():
    """Print banner"""
    banner = """
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           Gate 5 验收 - 测试与优化                            ║
║                                                               ║
║           Kimono AI 客服系统                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    """
    if RICH_AVAILABLE:
        console.print(Panel(banner.strip(), style="bold blue"))
    else:
        print(banner)


class VerificationResult:
    """Verification result container"""
    def __init__(self, name: str, code: str):
        self.name = name
        self.code = code
        self.passed = False
        self.details = ""
        self.error = ""


def verify_test_files() -> VerificationResult:
    """G5.1: Verify test files exist"""
    result = VerificationResult("测试文件", "G5.1")

    try:
        tests_dir = project_root / "tests"
        required_files = [
            "conftest.py",
            "test_knowledge.py",
            "test_rag.py",
            "test_api.py",
            "test_performance.py",
        ]

        missing = []
        for f in required_files:
            if not (tests_dir / f).exists():
                missing.append(f)

        if not missing:
            result.passed = True
            result.details = f"所有 {len(required_files)} 个测试文件存在"
        else:
            result.passed = False
            result.details = f"缺少文件: {missing}"
            result.error = "测试文件不完整"

    except Exception as e:
        result.passed = False
        result.details = "文件检查错误"
        result.error = str(e)

    return result


def verify_knowledge_tests() -> VerificationResult:
    """G5.2: Run knowledge module tests"""
    result = VerificationResult("知识库测试", "G5.2")

    try:
        # Run pytest for knowledge tests
        proc = subprocess.run(
            ["python", "-m", "pytest", "tests/test_knowledge.py", "-v", "--tb=short", "-q"],
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=120,
        )

        output = proc.stdout + proc.stderr

        # Check for pass/fail
        if proc.returncode == 0:
            # Count passed tests
            lines = output.split("\n")
            for line in lines:
                if "passed" in line:
                    result.passed = True
                    result.details = line.strip()
                    break
            else:
                result.passed = True
                result.details = "所有测试通过"
        else:
            # Find failure info
            result.passed = False
            result.details = "测试失败"
            # Extract error summary
            for line in output.split("\n"):
                if "FAILED" in line or "ERROR" in line:
                    result.error = line[:80]
                    break
            else:
                result.error = output[-200:] if len(output) > 200 else output

    except subprocess.TimeoutExpired:
        result.passed = False
        result.details = "测试超时"
        result.error = "测试运行超过 120 秒"
    except Exception as e:
        result.passed = False
        result.details = "测试运行错误"
        result.error = str(e)

    return result


def verify_rag_tests() -> VerificationResult:
    """G5.3: Run RAG module tests"""
    result = VerificationResult("RAG 测试", "G5.3")

    try:
        proc = subprocess.run(
            ["python", "-m", "pytest", "tests/test_rag.py", "-v", "--tb=short", "-q"],
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=180,
        )

        output = proc.stdout + proc.stderr

        if proc.returncode == 0:
            lines = output.split("\n")
            for line in lines:
                if "passed" in line:
                    result.passed = True
                    result.details = line.strip()
                    break
            else:
                result.passed = True
                result.details = "所有测试通过"
        else:
            result.passed = False
            result.details = "测试失败"
            for line in output.split("\n"):
                if "FAILED" in line or "ERROR" in line:
                    result.error = line[:80]
                    break
            else:
                result.error = output[-200:] if len(output) > 200 else output

    except subprocess.TimeoutExpired:
        result.passed = False
        result.details = "测试超时"
        result.error = "测试运行超过 180 秒"
    except Exception as e:
        result.passed = False
        result.details = "测试运行错误"
        result.error = str(e)

    return result


def verify_api_tests() -> VerificationResult:
    """G5.4: Run API module tests"""
    result = VerificationResult("API 测试", "G5.4")

    try:
        proc = subprocess.run(
            ["python", "-m", "pytest", "tests/test_api.py", "-v", "--tb=short", "-q"],
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=180,
        )

        output = proc.stdout + proc.stderr

        if proc.returncode == 0:
            lines = output.split("\n")
            for line in lines:
                if "passed" in line:
                    result.passed = True
                    result.details = line.strip()
                    break
            else:
                result.passed = True
                result.details = "所有测试通过"
        else:
            result.passed = False
            result.details = "测试失败"
            for line in output.split("\n"):
                if "FAILED" in line or "ERROR" in line:
                    result.error = line[:80]
                    break
            else:
                result.error = output[-200:] if len(output) > 200 else output

    except subprocess.TimeoutExpired:
        result.passed = False
        result.details = "测试超时"
        result.error = "测试运行超过 180 秒"
    except Exception as e:
        result.passed = False
        result.details = "测试运行错误"
        result.error = str(e)

    return result


def verify_performance_tests() -> VerificationResult:
    """G5.5: Run performance tests"""
    result = VerificationResult("性能测试", "G5.5")

    try:
        proc = subprocess.run(
            ["python", "-m", "pytest", "tests/test_performance.py", "-v", "--tb=short", "-q", "-s"],
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=300,
        )

        output = proc.stdout + proc.stderr

        if proc.returncode == 0:
            lines = output.split("\n")
            for line in lines:
                if "passed" in line:
                    result.passed = True
                    result.details = line.strip()
                    break
            else:
                result.passed = True
                result.details = "性能测试通过"
        else:
            result.passed = False
            result.details = "性能测试失败"
            for line in output.split("\n"):
                if "FAILED" in line or "AssertionError" in line:
                    result.error = line[:80]
                    break
            else:
                result.error = "性能未达标"

    except subprocess.TimeoutExpired:
        result.passed = False
        result.details = "测试超时"
        result.error = "测试运行超过 300 秒"
    except Exception as e:
        result.passed = False
        result.details = "测试运行错误"
        result.error = str(e)

    return result


def verify_test_coverage() -> VerificationResult:
    """G5.6: Verify test coverage"""
    result = VerificationResult("测试覆盖", "G5.6")

    try:
        # Check that we have tests for all main modules
        test_files = list((project_root / "tests").glob("test_*.py"))
        test_count = len(test_files)

        # Count test functions
        total_tests = 0
        for test_file in test_files:
            content = test_file.read_text()
            test_funcs = content.count("def test_")
            total_tests += test_funcs

        if test_count >= 4 and total_tests >= 30:
            result.passed = True
            result.details = f"{test_count} 个测试文件, {total_tests} 个测试用例"
        else:
            result.passed = False
            result.details = f"{test_count} 个文件, {total_tests} 个用例"
            result.error = "需要至少 4 个测试文件和 30 个测试用例"

    except Exception as e:
        result.passed = False
        result.details = "覆盖检查错误"
        result.error = str(e)

    return result


def run_all_verifications() -> list[VerificationResult]:
    """Run all verifications"""
    verifications = [
        verify_test_files,
        verify_knowledge_tests,
        verify_rag_tests,
        verify_api_tests,
        verify_performance_tests,
        verify_test_coverage,
    ]

    results = []
    for verify_func in verifications:
        doc = verify_func.__doc__
        name = doc.split(":")[1].strip() if ":" in doc else doc
        print(f"  检查中: {name}...", end="", flush=True)
        result = verify_func()
        results.append(result)
        status = "✓" if result.passed else "✗"
        print(f" {status}")

    return results


def print_report(results: list[VerificationResult]):
    """Print verification report"""

    print("\n" + "="*65)
    print("                    Gate 5 验收报告")
    print("="*65)
    print(f"  验收时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*65)

    # Results table
    if RICH_AVAILABLE:
        table = Table(show_header=True, header_style="bold")
        table.add_column("编号", width=6)
        table.add_column("检查项", width=20)
        table.add_column("结果", width=8)
        table.add_column("详情", width=25)

        for r in results:
            status = "[green]通过[/green]" if r.passed else "[red]未通过[/red]"
            detail = r.details if r.passed else f"{r.details}\n{r.error}" if r.error else r.details
            table.add_row(r.code, r.name, status, detail)

        console.print(table)
    else:
        print(f"\n{'编号':<8} {'检查项':<20} {'结果':<8} {'详情'}")
        print("-" * 65)
        for r in results:
            status = "通过" if r.passed else "未通过"
            detail = r.details if r.passed else f"{r.details} - {r.error}" if r.error else r.details
            print(f"{r.code:<8} {r.name:<20} {status:<8} {detail}")

    # Summary
    passed_count = sum(1 for r in results if r.passed)
    total_count = len(results)

    print("\n" + "="*65)
    print(f"  通过项: {passed_count}/{total_count}")

    if passed_count == total_count:
        print("-"*65)
        if RICH_AVAILABLE:
            console.print("  [bold green]✓ Gate 5 验收通过！[/bold green]")
            console.print("\n  [cyan]请在对话中回复:[/cyan]")
            console.print('  [bold]"Gate 5 验收通过，进入 Phase 6"[/bold]')
        else:
            print("  ✓ Gate 5 验收通过！")
            print("\n  请在对话中回复:")
            print('  "Gate 5 验收通过，进入 Phase 6"')
    else:
        print("-"*65)
        if RICH_AVAILABLE:
            console.print("  [bold red]✗ Gate 5 验收未通过[/bold red]")
            console.print("\n  [yellow]请解决上述问题后重新运行验收脚本[/yellow]")
        else:
            print("  ✗ Gate 5 验收未通过")
            print("\n  请解决上述问题后重新运行验收脚本")

        # Print specific fix instructions
        print("\n  修复建议:")
        for r in results:
            if not r.passed:
                print(f"  - {r.code} {r.name}: {r.error}")

    print("="*65)

    return passed_count == total_count


def main():
    """Main function"""
    print_banner()

    print("\n🔍 正在执行 Gate 5 验收检查...\n")

    results = run_all_verifications()
    success = print_report(results)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
