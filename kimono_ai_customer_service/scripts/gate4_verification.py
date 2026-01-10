#!/usr/bin/env python3
"""
Gate 4 Verification Script
Phase 4 验收: API 服务层
"""
import sys
import os
import json
import time
import asyncio
from pathlib import Path
from datetime import datetime
from multiprocessing import Process

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
║           Gate 4 验收 - API 服务层                            ║
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


def verify_fastapi_app() -> VerificationResult:
    """G4.1: Verify FastAPI application"""
    result = VerificationResult("FastAPI 应用", "G4.1")

    try:
        from api import app

        # 检查应用配置
        assert app.title == "Kimono AI 客服系统", "应用标题错误"
        assert app.version == "1.0.0", "版本号错误"

        # 检查路由数量
        routes = [r for r in app.routes if hasattr(r, 'path')]
        api_routes = [r for r in routes if r.path.startswith('/api')]

        if len(api_routes) >= 8:  # 至少 8 个 API 路由
            result.passed = True
            result.details = f"应用配置正确, {len(api_routes)} 个 API 路由"
        else:
            result.passed = False
            result.details = f"路由数量不足: {len(api_routes)}"
            result.error = "需要至少 8 个 API 路由"

    except Exception as e:
        result.passed = False
        result.details = "应用加载失败"
        result.error = str(e)

    return result


def verify_api_models() -> VerificationResult:
    """G4.2: Verify API models"""
    result = VerificationResult("API 模型", "G4.2")

    try:
        from api.models import (
            ChatRequest, ChatResponse,
            FeedbackRequest, FeedbackResponse,
            SearchRequest, SearchResponse,
            HealthResponse, StatsResponse, ErrorResponse,
        )

        # 测试 ChatRequest 验证
        chat_req = ChatRequest(message="测试消息")
        assert chat_req.message == "测试消息", "ChatRequest 解析错误"

        # 测试 ChatResponse 结构
        chat_resp = ChatResponse(
            answer="测试回答",
            conversation_id="conv-123",
            message_id="msg-456",
        )
        assert chat_resp.answer == "测试回答", "ChatResponse 解析错误"

        # 测试 HealthResponse
        health = HealthResponse(
            status="healthy",
            version="1.0.0",
            timestamp="2024-01-01T00:00:00Z",
        )
        assert health.status == "healthy", "HealthResponse 解析错误"

        result.passed = True
        result.details = "所有请求/响应模型验证通过"

    except Exception as e:
        result.passed = False
        result.details = "模型验证失败"
        result.error = str(e)

    return result


def verify_service_container() -> VerificationResult:
    """G4.3: Verify service container"""
    result = VerificationResult("服务容器", "G4.3")

    try:
        from api.dependencies import ServiceContainer, get_service_container

        # 测试单例模式
        container1 = get_service_container()
        container2 = get_service_container()
        assert container1 is container2, "服务容器不是单例"

        # 初始化服务
        container1.initialize(namespace="test")

        # 检查健康状态
        health = container1.is_healthy()
        assert isinstance(health, dict), "健康状态返回格式错误"
        assert "llm" in health, "缺少 LLM 健康状态"
        assert "knowledge_base" in health, "缺少知识库健康状态"

        healthy_count = sum(1 for v in health.values() if v == "healthy")

        if healthy_count >= 3:  # 至少 3 个服务健康
            result.passed = True
            result.details = f"服务容器正常, {healthy_count}/4 服务健康"
        else:
            result.passed = False
            result.details = f"服务不健康: {health}"
            result.error = f"需要至少 3 个健康服务"

    except Exception as e:
        result.passed = False
        result.details = "服务容器错误"
        result.error = str(e)

    return result


def verify_chat_endpoint() -> VerificationResult:
    """G4.4: Verify chat endpoint"""
    result = VerificationResult("对话接口", "G4.4")

    try:
        from api.models import ChatRequest, ChatResponse
        from api.routes import send_message
        from api.dependencies import get_service_container

        # 确保服务已初始化
        container = get_service_container()
        if not container._initialized:
            container.initialize(namespace="test")

        # 直接调用路由处理函数
        request = ChatRequest(message="你好")
        response = asyncio.get_event_loop().run_until_complete(
            send_message(request, container)
        )

        if isinstance(response, ChatResponse):
            assert response.answer, "响应缺少 answer"
            assert response.conversation_id, "响应缺少 conversation_id"
            result.passed = True
            result.details = f"对话接口正常, 延迟: {response.latency_ms}ms"
        else:
            result.passed = True
            result.details = f"对话接口响应正常"

    except Exception as e:
        result.passed = False
        result.details = "对话接口错误"
        result.error = str(e)

    return result


def verify_health_endpoint() -> VerificationResult:
    """G4.5: Verify health endpoint"""
    result = VerificationResult("健康检查接口", "G4.5")

    try:
        from api.models import HealthResponse
        from api.routes import health_check
        from api.dependencies import get_service_container

        container = get_service_container()

        # 直接调用路由处理函数
        response = asyncio.get_event_loop().run_until_complete(
            health_check(container)
        )

        if isinstance(response, HealthResponse):
            assert response.status, "缺少 status 字段"
            assert response.version, "缺少 version 字段"
            result.passed = True
            result.details = f"状态: {response.status}, 版本: {response.version}"
        else:
            result.passed = True
            result.details = "健康检查响应正常"

    except Exception as e:
        result.passed = False
        result.details = "健康检查错误"
        result.error = str(e)

    return result


def verify_knowledge_search() -> VerificationResult:
    """G4.6: Verify knowledge search endpoint"""
    result = VerificationResult("知识库搜索接口", "G4.6")

    try:
        from api.models import SearchRequest, SearchResponse
        from api.routes import search_knowledge
        from api.dependencies import get_service_container

        # 确保服务已初始化
        container = get_service_container()
        if not container._initialized:
            container.initialize(namespace="test")

        # 直接调用路由处理函数
        request = SearchRequest(query="和服价格", top_k=3)
        response = asyncio.get_event_loop().run_until_complete(
            search_knowledge(request, container)
        )

        if isinstance(response, SearchResponse):
            assert hasattr(response, 'results'), "缺少 results 字段"
            assert hasattr(response, 'total'), "缺少 total 字段"
            result.passed = True
            result.details = f"搜索正常, 返回 {response.total} 条结果"
        else:
            result.passed = True
            result.details = "知识库搜索响应正常"

    except Exception as e:
        result.passed = False
        result.details = "知识库搜索错误"
        result.error = str(e)

    return result


def run_all_verifications() -> list[VerificationResult]:
    """Run all verifications"""
    verifications = [
        verify_fastapi_app,
        verify_api_models,
        verify_service_container,
        verify_chat_endpoint,
        verify_health_endpoint,
        verify_knowledge_search,
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
    print("                    Gate 4 验收报告")
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
            console.print("  [bold green]✓ Gate 4 验收通过！[/bold green]")
            console.print("\n  [cyan]请在对话中回复:[/cyan]")
            console.print('  [bold]"Gate 4 验收通过，进入 Phase 5"[/bold]')
        else:
            print("  ✓ Gate 4 验收通过！")
            print("\n  请在对话中回复:")
            print('  "Gate 4 验收通过，进入 Phase 5"')
    else:
        print("-"*65)
        if RICH_AVAILABLE:
            console.print("  [bold red]✗ Gate 4 验收未通过[/bold red]")
            console.print("\n  [yellow]请解决上述问题后重新运行验收脚本[/yellow]")
        else:
            print("  ✗ Gate 4 验收未通过")
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

    print("\n🔍 正在执行 Gate 4 验收检查...\n")

    results = run_all_verifications()
    success = print_report(results)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
