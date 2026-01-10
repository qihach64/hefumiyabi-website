#!/usr/bin/env python3
"""
Environment Check Script
Verifies that all required dependencies are installed correctly
"""
import sys
import subprocess
from pathlib import Path

# Add rich for beautiful output (fallback to plain text if not available)
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    console = None


def print_header(text: str):
    """Print header"""
    if RICH_AVAILABLE:
        console.print(Panel(text, style="bold blue"))
    else:
        print(f"\n{'='*60}")
        print(f"  {text}")
        print('='*60)


def print_status(name: str, status: bool, details: str = ""):
    """Print status line"""
    icon = "✓" if status else "✗"
    color = "green" if status else "red"

    if RICH_AVAILABLE:
        status_str = f"[{color}]{icon}[/{color}]"
        console.print(f"  {status_str} {name}: {details}")
    else:
        print(f"  {icon} {name}: {details}")


def check_python_version() -> tuple[bool, str]:
    """Check Python version"""
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"

    if version.major >= 3 and version.minor >= 9:
        return True, f"Python {version_str}"
    else:
        return False, f"Python {version_str} (需要 3.9+)"


def check_package(package_name: str, import_name: str = None) -> tuple[bool, str]:
    """Check if a package is installed"""
    if import_name is None:
        import_name = package_name.replace("-", "_")

    try:
        module = __import__(import_name)
        version = getattr(module, "__version__", "unknown")
        return True, f"v{version}"
    except ImportError:
        return False, "未安装"


def check_all_packages() -> list[tuple[str, bool, str]]:
    """Check all required packages"""
    packages = [
        ("langchain", "langchain"),
        ("langchain-community", "langchain_community"),
        ("dashscope", "dashscope"),
        ("pinecone-client", "pinecone"),
        ("pandas", "pandas"),
        ("openpyxl", "openpyxl"),
        ("beautifulsoup4", "bs4"),
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("python-dotenv", "dotenv"),
        ("pydantic", "pydantic"),
        ("rich", "rich"),
        ("httpx", "httpx"),
    ]

    results = []
    for pkg_name, import_name in packages:
        status, details = check_package(pkg_name, import_name)
        results.append((pkg_name, status, details))

    return results


def check_env_file() -> tuple[bool, str]:
    """Check if .env file exists"""
    project_root = Path(__file__).parent.parent
    env_file = project_root / ".env"
    env_template = project_root / ".env.template"

    if env_file.exists():
        return True, ".env 文件已存在"
    elif env_template.exists():
        return False, ".env 文件不存在 (请从 .env.template 复制)"
    else:
        return False, ".env 和 .env.template 都不存在"


def main():
    """Main function"""
    print_header("Kimono AI 客服系统 - 环境检查")

    all_passed = True

    # Check Python version
    print("\n📌 Python 版本:")
    status, details = check_python_version()
    print_status("Python", status, details)
    if not status:
        all_passed = False

    # Check packages
    print("\n📦 依赖包检查:")
    results = check_all_packages()

    for pkg_name, status, details in results:
        print_status(pkg_name, status, details)
        if not status:
            all_passed = False

    # Check .env file
    print("\n⚙️  配置文件:")
    status, details = check_env_file()
    print_status(".env", status, details)
    if not status:
        all_passed = False

    # Summary
    print("\n" + "="*60)
    if all_passed:
        if RICH_AVAILABLE:
            console.print("[bold green]✓ 环境检查通过！[/bold green]")
        else:
            print("✓ 环境检查通过！")
        return 0
    else:
        if RICH_AVAILABLE:
            console.print("[bold red]✗ 环境检查未通过，请安装缺失的依赖[/bold red]")
            console.print("\n运行以下命令安装依赖:")
            console.print("[cyan]pip install -r requirements.txt[/cyan]")
        else:
            print("✗ 环境检查未通过，请安装缺失的依赖")
            print("\n运行以下命令安装依赖:")
            print("pip install -r requirements.txt")
        return 1


if __name__ == "__main__":
    sys.exit(main())
