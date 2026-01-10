#!/usr/bin/env python3
"""
API Connection Test Script
Tests connectivity to Qwen (DashScope) and Pinecone APIs
"""
import sys
import os
import argparse
import time
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / ".env")

try:
    from rich.console import Console
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


def print_result(name: str, status: bool, details: str = "", time_ms: float = None):
    """Print test result"""
    icon = "✓" if status else "✗"
    color = "green" if status else "red"
    time_str = f" ({time_ms:.0f}ms)" if time_ms else ""

    if RICH_AVAILABLE:
        status_str = f"[{color}]{icon}[/{color}]"
        console.print(f"  {status_str} {name}{time_str}")
        if details:
            console.print(f"      {details}")
    else:
        print(f"  {icon} {name}{time_str}")
        if details:
            print(f"      {details}")


def test_qwen_api() -> tuple[bool, str, float]:
    """Test Qwen (DashScope) API connection"""
    api_key = os.getenv("DASHSCOPE_API_KEY", "")

    if not api_key or api_key == "your_dashscope_api_key_here":
        return False, "DASHSCOPE_API_KEY 未配置", 0

    try:
        import dashscope
        from dashscope import Generation

        dashscope.api_key = api_key

        start_time = time.time()

        # Simple test call
        response = Generation.call(
            model="qwen-turbo",  # Use turbo for faster test
            prompt="说'连接成功'",
            max_tokens=10,
        )

        elapsed_ms = (time.time() - start_time) * 1000

        if response.status_code == 200:
            return True, f"模型响应正常 (Qwen API)", elapsed_ms
        else:
            return False, f"API错误: {response.code} - {response.message}", elapsed_ms

    except ImportError:
        return False, "dashscope 包未安装", 0
    except Exception as e:
        return False, f"连接失败: {str(e)}", 0


def test_qwen_plus() -> tuple[bool, str, float]:
    """Test Qwen-Plus model specifically"""
    api_key = os.getenv("DASHSCOPE_API_KEY", "")

    if not api_key or api_key == "your_dashscope_api_key_here":
        return False, "DASHSCOPE_API_KEY 未配置", 0

    try:
        import dashscope
        from dashscope import Generation

        dashscope.api_key = api_key

        start_time = time.time()

        response = Generation.call(
            model="qwen-plus",
            prompt="你好",
            max_tokens=10,
        )

        elapsed_ms = (time.time() - start_time) * 1000

        if response.status_code == 200:
            return True, "Qwen-Plus 模型可用", elapsed_ms
        else:
            return False, f"Qwen-Plus 不可用: {response.message}", elapsed_ms

    except Exception as e:
        return False, f"测试失败: {str(e)}", 0


def test_pinecone_api() -> tuple[bool, str, float]:
    """Test Pinecone API connection"""
    api_key = os.getenv("PINECONE_API_KEY", "")
    index_name = os.getenv("PINECONE_INDEX", "kimono-faq-index")

    if not api_key or api_key == "your_pinecone_api_key_here":
        return False, "PINECONE_API_KEY 未配置", 0

    try:
        from pinecone import Pinecone

        start_time = time.time()

        pc = Pinecone(api_key=api_key)

        # List indexes to verify connection
        indexes = pc.list_indexes()
        elapsed_ms = (time.time() - start_time) * 1000

        index_names = [idx.name for idx in indexes]

        if index_name in index_names:
            return True, f"已连接，索引 '{index_name}' 存在", elapsed_ms
        else:
            available = ", ".join(index_names) if index_names else "无"
            return True, f"已连接，索引 '{index_name}' 不存在 (可用索引: {available})", elapsed_ms

    except ImportError:
        return False, "pinecone-client 包未安装", 0
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "Unauthorized" in error_msg:
            return False, "API Key 无效", 0
        return False, f"连接失败: {error_msg}", 0


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="测试API连接")
    parser.add_argument("--qwen", action="store_true", help="只测试Qwen API")
    parser.add_argument("--pinecone", action="store_true", help="只测试Pinecone API")
    parser.add_argument("--all", action="store_true", help="测试所有API (默认)")
    args = parser.parse_args()

    # Default to all if no specific flag
    if not args.qwen and not args.pinecone:
        args.all = True

    print_header("API 连接测试")

    all_passed = True
    results = []

    # Test Qwen API
    if args.qwen or args.all:
        print("\n🤖 Qwen (DashScope) API:")

        status, details, elapsed = test_qwen_api()
        print_result("基础连接", status, details, elapsed)
        results.append(("Qwen API", status))
        if not status:
            all_passed = False

        if status:
            status2, details2, elapsed2 = test_qwen_plus()
            print_result("Qwen-Plus 模型", status2, details2, elapsed2)
            results.append(("Qwen-Plus", status2))

    # Test Pinecone API
    if args.pinecone or args.all:
        print("\n🗄️  Pinecone 向量数据库:")

        status, details, elapsed = test_pinecone_api()
        print_result("连接状态", status, details, elapsed)
        results.append(("Pinecone", status))
        if not status:
            all_passed = False

    # Summary
    print("\n" + "="*60)
    print("📊 测试结果汇总:")
    for name, status in results:
        icon = "✓" if status else "✗"
        status_text = "通过" if status else "失败"
        print(f"  {icon} {name}: {status_text}")

    print("="*60)

    if all_passed:
        if RICH_AVAILABLE:
            console.print("\n[bold green]✓ 所有API连接测试通过！[/bold green]")
        else:
            print("\n✓ 所有API连接测试通过！")
        return 0
    else:
        if RICH_AVAILABLE:
            console.print("\n[bold red]✗ 部分API连接失败，请检查配置[/bold red]")
            console.print("\n请确保 .env 文件中的 API Key 已正确配置")
        else:
            print("\n✗ 部分API连接失败，请检查配置")
            print("\n请确保 .env 文件中的 API Key 已正确配置")
        return 1


if __name__ == "__main__":
    sys.exit(main())
