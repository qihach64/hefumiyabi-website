#!/usr/bin/env python3
"""
Gate 0 Verification Script
One-click verification for Phase 0: Environment Preparation
"""
import sys
import os
import subprocess
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

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
║           Gate 0 验收 - 环境准备与技术验证                    ║
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


def verify_python_version() -> VerificationResult:
    """G0.1: Verify Python version"""
    result = VerificationResult("Python 版本", "G0.1")

    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"

    if version.major >= 3 and version.minor >= 9:
        result.passed = True
        result.details = f"Python {version_str}"
    else:
        result.passed = False
        result.details = f"Python {version_str}"
        result.error = "需要 Python 3.9 或更高版本"

    return result


def verify_dependencies() -> VerificationResult:
    """G0.2: Verify key dependencies"""
    result = VerificationResult("核心依赖", "G0.2")

    required_packages = [
        ("langchain", "langchain"),
        ("dashscope", "dashscope"),
        ("pinecone", "pinecone"),
        ("pandas", "pandas"),
        ("beautifulsoup4", "bs4"),
        ("fastapi", "fastapi"),
    ]

    missing = []
    installed = []

    for pkg_name, import_name in required_packages:
        try:
            __import__(import_name)
            installed.append(pkg_name)
        except ImportError:
            missing.append(pkg_name)

    if not missing:
        result.passed = True
        result.details = f"{len(installed)} 个核心包已安装"
    else:
        result.passed = False
        result.details = f"已安装 {len(installed)}/{len(required_packages)}"
        result.error = f"缺失: {', '.join(missing)}"

    return result


def verify_qwen_api() -> VerificationResult:
    """G0.3: Verify Qwen API connection"""
    result = VerificationResult("Qwen API 连接", "G0.3")

    api_key = os.getenv("DASHSCOPE_API_KEY", "")

    if not api_key or api_key == "your_dashscope_api_key_here":
        result.passed = False
        result.details = "API Key 未配置"
        result.error = "请在 .env 文件中配置 DASHSCOPE_API_KEY"
        return result

    try:
        import dashscope
        from dashscope import Generation

        dashscope.api_key = api_key

        response = Generation.call(
            model="qwen-turbo",
            prompt="测试",
            max_tokens=5,
        )

        if response.status_code == 200:
            result.passed = True
            result.details = "连接成功"
        else:
            result.passed = False
            result.details = f"API 错误: {response.code}"
            result.error = response.message

    except Exception as e:
        result.passed = False
        result.details = "连接失败"
        result.error = str(e)

    return result


def verify_pinecone_api() -> VerificationResult:
    """G0.4: Verify Pinecone API connection"""
    result = VerificationResult("Pinecone 连接", "G0.4")

    api_key = os.getenv("PINECONE_API_KEY", "")

    if not api_key or api_key == "your_pinecone_api_key_here":
        result.passed = False
        result.details = "API Key 未配置"
        result.error = "请在 .env 文件中配置 PINECONE_API_KEY"
        return result

    try:
        from pinecone import Pinecone

        pc = Pinecone(api_key=api_key)
        indexes = pc.list_indexes()

        result.passed = True
        result.details = f"连接成功 ({len(list(indexes))} 个索引)"

    except Exception as e:
        result.passed = False
        result.details = "连接失败"
        result.error = str(e)

    return result


def verify_instagram_data() -> VerificationResult:
    """G0.5: Verify Instagram data availability"""
    result = VerificationResult("Instagram 数据", "G0.5")

    path_str = os.getenv("INSTAGRAM_DATA_PATH", "../inbox")
    path = Path(path_str)
    if not path.is_absolute():
        path = project_root / path
    path = path.resolve()

    if not path.exists():
        result.passed = False
        result.details = "路径不存在"
        result.error = f"找不到: {path}"
        return result

    # Count conversation directories
    conversation_count = 0
    html_count = 0

    for item in path.iterdir():
        if item.is_dir():
            html_files = list(item.glob("*.html"))
            if html_files:
                conversation_count += 1
                html_count += len(html_files)

    if conversation_count >= 5000:
        result.passed = True
        result.details = f"{conversation_count:,} 个对话, {html_count:,} 个HTML文件"
    else:
        result.passed = False
        result.details = f"{conversation_count:,} 个对话"
        result.error = f"预期 ~5,812 个对话"

    return result


def verify_line_data() -> VerificationResult:
    """G0.6: Verify LINE data availability"""
    result = VerificationResult("LINE 数据", "G0.6")

    path_str = os.getenv("LINE_DATA_PATH", "../LINE2024-2025")
    path = Path(path_str)
    if not path.is_absolute():
        path = project_root / path
    path = path.resolve()

    if not path.exists():
        result.passed = False
        result.details = "路径不存在"
        result.error = f"找不到: {path}"
        return result

    # Count XLSX files
    xlsx_files = list(path.glob("**/*.xlsx"))
    xlsx_count = len(xlsx_files)

    if xlsx_count >= 2000:
        result.passed = True
        result.details = f"{xlsx_count:,} 个XLSX文件"
    else:
        result.passed = False
        result.details = f"{xlsx_count:,} 个XLSX文件"
        result.error = f"预期 ~2,237 个文件"

    return result


def run_all_verifications() -> list[VerificationResult]:
    """Run all verifications"""
    verifications = [
        verify_python_version,
        verify_dependencies,
        verify_qwen_api,
        verify_pinecone_api,
        verify_instagram_data,
        verify_line_data,
    ]

    results = []
    for verify_func in verifications:
        print(f"  检查中: {verify_func.__doc__.split(':')[1].strip()}...", end="", flush=True)
        result = verify_func()
        results.append(result)
        status = "✓" if result.passed else "✗"
        print(f" {status}")

    return results


def print_report(results: list[VerificationResult]):
    """Print verification report"""

    print("\n" + "="*65)
    print("                    Gate 0 验收报告")
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
    print(f"  必须通过项: {passed_count}/{total_count}")

    if passed_count == total_count:
        print("-"*65)
        if RICH_AVAILABLE:
            console.print("  [bold green]✓ Gate 0 验收通过！[/bold green]")
            console.print("\n  [cyan]请在对话中回复:[/cyan]")
            console.print('  [bold]"Gate 0 验收通过，进入 Phase 1"[/bold]')
        else:
            print("  ✓ Gate 0 验收通过！")
            print("\n  请在对话中回复:")
            print('  "Gate 0 验收通过，进入 Phase 1"')
    else:
        print("-"*65)
        if RICH_AVAILABLE:
            console.print("  [bold red]✗ Gate 0 验收未通过[/bold red]")
            console.print("\n  [yellow]请解决上述问题后重新运行验收脚本[/yellow]")
        else:
            print("  ✗ Gate 0 验收未通过")
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

    print("\n🔍 正在执行 Gate 0 验收检查...\n")

    results = run_all_verifications()
    success = print_report(results)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
