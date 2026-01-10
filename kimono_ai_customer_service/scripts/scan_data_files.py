#!/usr/bin/env python3
"""
Data Files Scanner
Scans Instagram and LINE data directories to verify data availability
"""
import sys
import os
import argparse
from pathlib import Path
from collections import defaultdict

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
    from rich.progress import track
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
    if RICH_AVAILABLE:
        color = "green" if status else "red"
        console.print(f"  [{color}]{icon}[/{color}] {name}: {details}")
    else:
        print(f"  {icon} {name}: {details}")


def get_instagram_path() -> Path:
    """Get Instagram data path"""
    path_str = os.getenv("INSTAGRAM_DATA_PATH", "../inbox")
    path = Path(path_str)
    if not path.is_absolute():
        path = project_root / path
    return path.resolve()


def get_line_path() -> Path:
    """Get LINE data path"""
    path_str = os.getenv("LINE_DATA_PATH", "../LINE2024-2025")
    path = Path(path_str)
    if not path.is_absolute():
        path = project_root / path
    return path.resolve()


def scan_instagram_data(path: Path) -> dict:
    """Scan Instagram HTML files"""
    result = {
        "path": str(path),
        "exists": path.exists(),
        "conversation_count": 0,
        "html_file_count": 0,
        "total_size_mb": 0,
        "sample_conversations": [],
        "errors": []
    }

    if not path.exists():
        result["errors"].append(f"路径不存在: {path}")
        return result

    if not path.is_dir():
        result["errors"].append(f"路径不是目录: {path}")
        return result

    total_size = 0
    conversation_dirs = []

    # Scan conversation directories
    for item in path.iterdir():
        if item.is_dir():
            # Each directory is a conversation
            html_files = list(item.glob("*.html"))
            if html_files:
                conversation_dirs.append({
                    "name": item.name,
                    "html_count": len(html_files),
                    "size": sum(f.stat().st_size for f in html_files)
                })
                result["html_file_count"] += len(html_files)
                total_size += sum(f.stat().st_size for f in html_files)

    result["conversation_count"] = len(conversation_dirs)
    result["total_size_mb"] = total_size / (1024 * 1024)

    # Sample conversations
    result["sample_conversations"] = [c["name"] for c in conversation_dirs[:5]]

    return result


def scan_line_data(path: Path) -> dict:
    """Scan LINE XLSX files"""
    result = {
        "path": str(path),
        "exists": path.exists(),
        "xlsx_file_count": 0,
        "total_size_mb": 0,
        "sample_files": [],
        "errors": []
    }

    if not path.exists():
        result["errors"].append(f"路径不存在: {path}")
        return result

    if not path.is_dir():
        result["errors"].append(f"路径不是目录: {path}")
        return result

    xlsx_files = []
    total_size = 0

    # Scan XLSX files
    for xlsx_file in path.glob("**/*.xlsx"):
        file_size = xlsx_file.stat().st_size
        xlsx_files.append({
            "name": xlsx_file.name,
            "size": file_size
        })
        total_size += file_size

    result["xlsx_file_count"] = len(xlsx_files)
    result["total_size_mb"] = total_size / (1024 * 1024)

    # Sample files
    result["sample_files"] = [f["name"] for f in xlsx_files[:5]]

    return result


def print_instagram_report(data: dict):
    """Print Instagram scan report"""
    print("\n📸 Instagram 数据:")
    print(f"   路径: {data['path']}")

    if not data["exists"]:
        print_status("状态", False, "路径不存在")
        return False

    print_status("状态", True, "路径存在")
    print(f"   对话数量: {data['conversation_count']:,} 个")
    print(f"   HTML文件: {data['html_file_count']:,} 个")
    print(f"   总大小: {data['total_size_mb']:.1f} MB")

    if data["sample_conversations"]:
        print("   示例对话:")
        for conv in data["sample_conversations"][:3]:
            print(f"     - {conv}")

    return data["conversation_count"] > 0


def print_line_report(data: dict):
    """Print LINE scan report"""
    print("\n💬 LINE 数据:")
    print(f"   路径: {data['path']}")

    if not data["exists"]:
        print_status("状态", False, "路径不存在")
        return False

    print_status("状态", True, "路径存在")
    print(f"   XLSX文件: {data['xlsx_file_count']:,} 个")
    print(f"   总大小: {data['total_size_mb']:.1f} MB")

    if data["sample_files"]:
        print("   示例文件:")
        for f in data["sample_files"][:3]:
            print(f"     - {f}")

    return data["xlsx_file_count"] > 0


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="扫描数据文件")
    parser.add_argument("--instagram", action="store_true", help="只扫描Instagram数据")
    parser.add_argument("--line", action="store_true", help="只扫描LINE数据")
    parser.add_argument("--all", action="store_true", help="扫描所有数据 (默认)")
    args = parser.parse_args()

    # Default to all if no specific flag
    if not args.instagram and not args.line:
        args.all = True

    print_header("数据文件扫描")

    results = {}
    all_passed = True

    # Scan Instagram data
    if args.instagram or args.all:
        instagram_path = get_instagram_path()
        instagram_data = scan_instagram_data(instagram_path)
        results["instagram"] = instagram_data
        if not print_instagram_report(instagram_data):
            all_passed = False

    # Scan LINE data
    if args.line or args.all:
        line_path = get_line_path()
        line_data = scan_line_data(line_path)
        results["line"] = line_data
        if not print_line_report(line_data):
            all_passed = False

    # Summary
    print("\n" + "="*60)
    print("📊 扫描结果汇总:")

    if "instagram" in results:
        ig = results["instagram"]
        status = ig["conversation_count"] > 5000
        print_status(
            "Instagram",
            status,
            f"{ig['conversation_count']:,} 个对话 {'✓' if status else '(预期 ~5,812)'}"
        )

    if "line" in results:
        ln = results["line"]
        status = ln["xlsx_file_count"] > 2000
        print_status(
            "LINE",
            status,
            f"{ln['xlsx_file_count']:,} 个文件 {'✓' if status else '(预期 ~2,237)'}"
        )

    # Total
    total_conversations = 0
    if "instagram" in results:
        total_conversations += results["instagram"]["conversation_count"]
    if "line" in results:
        total_conversations += results["line"]["xlsx_file_count"]

    print(f"\n   📁 总对话/文件数: {total_conversations:,}")

    print("="*60)

    if all_passed:
        if RICH_AVAILABLE:
            console.print("\n[bold green]✓ 数据文件扫描完成！[/bold green]")
        else:
            print("\n✓ 数据文件扫描完成！")
        return 0
    else:
        if RICH_AVAILABLE:
            console.print("\n[bold yellow]⚠ 部分数据可能缺失，请检查路径配置[/bold yellow]")
        else:
            print("\n⚠ 部分数据可能缺失，请检查路径配置")
        return 1


if __name__ == "__main__":
    sys.exit(main())
