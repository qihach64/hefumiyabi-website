#!/usr/bin/env python3
"""
Gate 3 Verification Script
Phase 3 验收: RAG 核心系统
"""
import sys
import os
import json
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
║           Gate 3 验收 - RAG 核心系统                          ║
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


def verify_qwen_llm() -> VerificationResult:
    """G3.1: Verify Qwen LLM wrapper"""
    result = VerificationResult("Qwen LLM 封装", "G3.1")

    try:
        from rag import QwenLLM, ModelType

        llm = QwenLLM()

        # 测试简单生成
        response = llm.generate(
            prompt="请用一句话介绍和服。",
            model=ModelType.QWEN_PLUS,
        )

        if response and len(response.content) > 10:
            result.passed = True
            result.details = f"模型: {response.model}, Tokens: {response.usage.get('total_tokens', 0)}"
        else:
            result.passed = False
            result.details = "LLM 生成失败"
            result.error = "无法生成有效回复"

    except Exception as e:
        result.passed = False
        result.details = "LLM 错误"
        result.error = str(e)

    return result


def verify_model_routing() -> VerificationResult:
    """G3.2: Verify model routing"""
    result = VerificationResult("模型路由策略", "G3.2")

    try:
        from rag import QwenLLM, ModelType

        llm = QwenLLM(routing_ratio=0.8)

        # 测试简单问题
        simple_query = "价格多少？"
        simple_model = llm.select_model(simple_query)

        # 测试复杂问题
        complex_query = "我要投诉，为什么预约不成功？我已经等了很久，你们的服务太差了！"
        complex_model = llm.select_model(complex_query)

        # 复杂问题应该选择 Qwen-Max
        if complex_model == ModelType.QWEN_MAX:
            result.passed = True
            result.details = f"简单问题: {simple_model.value}, 复杂问题: {complex_model.value}"
        else:
            result.passed = False
            result.details = f"复杂问题未正确路由"
            result.error = f"期望 qwen-max，实际 {complex_model.value}"

    except Exception as e:
        result.passed = False
        result.details = "路由错误"
        result.error = str(e)

    return result


def verify_prompts() -> VerificationResult:
    """G3.3: Verify prompt templates"""
    result = VerificationResult("提示词模板", "G3.3")

    try:
        from rag import (
            KIMONO_SYSTEM_PROMPT,
            get_rag_prompt,
            get_conversation_prompt,
            detect_language,
            format_context,
        )

        # 检查系统提示词
        assert len(KIMONO_SYSTEM_PROMPT) > 100, "系统提示词过短"

        # 检查 RAG 提示词
        rag_prompt = get_rag_prompt("参考内容", "用户问题")
        assert "参考内容" in rag_prompt, "RAG 提示词格式错误"
        assert "用户问题" in rag_prompt, "RAG 提示词格式错误"

        # 检查语言检测
        assert detect_language("你好") == "zh", "中文检测失败"
        assert detect_language("こんにちは") == "ja", "日语检测失败"
        assert detect_language("Hello") == "en", "英语检测失败"

        result.passed = True
        result.details = "系统提示词、RAG 模板、语言检测正常"

    except AssertionError as e:
        result.passed = False
        result.details = "模板验证失败"
        result.error = str(e)
    except Exception as e:
        result.passed = False
        result.details = "模板错误"
        result.error = str(e)

    return result


def verify_conversation_manager() -> VerificationResult:
    """G3.4: Verify conversation manager"""
    result = VerificationResult("对话管理器", "G3.4")

    try:
        from rag import ConversationManager, ContextWindowManager

        # 测试对话管理
        manager = ConversationManager(max_conversations=100, conversation_ttl=60)

        # 创建对话
        conv = manager.create_conversation("test-conv-1")
        assert conv.id == "test-conv-1", "对话 ID 错误"

        # 添加消息
        manager.add_user_message("test-conv-1", "你好")
        manager.add_assistant_message("test-conv-1", "您好！有什么可以帮您的吗？")
        manager.add_user_message("test-conv-1", "价格多少？")

        # 获取历史
        history = manager.get_history("test-conv-1")
        assert len(history) == 3, f"历史消息数量错误: {len(history)}"

        # 测试上下文管理
        ctx_manager = ContextWindowManager(max_tokens=4000)
        tokens = ctx_manager.estimate_tokens("你好世界 Hello World")
        assert tokens > 0, "Token 估算错误"

        result.passed = True
        result.details = f"对话管理正常, 消息数: {len(history)}"

        # 清理
        manager.delete_conversation("test-conv-1")

    except AssertionError as e:
        result.passed = False
        result.details = "管理器验证失败"
        result.error = str(e)
    except Exception as e:
        result.passed = False
        result.details = "管理器错误"
        result.error = str(e)

    return result


def verify_rag_chain() -> VerificationResult:
    """G3.5: Verify RAG chain"""
    result = VerificationResult("RAG 链", "G3.5")

    try:
        from rag import RAGChain, QwenLLM
        from knowledge import KnowledgeBase

        # 初始化 RAG 链
        kb = KnowledgeBase()
        llm = QwenLLM()
        rag = RAGChain(knowledge_base=kb, llm=llm, top_k=3)

        # 测试问候语
        greeting_response = rag.query("你好")
        assert greeting_response.confidence > 0.9, "问候语置信度不足"

        # 测试知识查询
        query_response = rag.query("和服租赁价格是多少？", namespace="test")

        if query_response.answer and len(query_response.answer) > 10:
            result.passed = True
            result.details = f"RAG 正常, 模型: {query_response.model_used}, 延迟: {query_response.latency_ms}ms"
        else:
            result.passed = False
            result.details = "RAG 生成失败"
            result.error = "无法生成有效回复"

    except Exception as e:
        result.passed = False
        result.details = "RAG 错误"
        result.error = str(e)

    return result


def verify_multi_turn_conversation() -> VerificationResult:
    """G3.6: Verify multi-turn conversation"""
    result = VerificationResult("多轮对话", "G3.6")

    try:
        from rag import RAGChain, QwenLLM
        from knowledge import KnowledgeBase

        # 初始化
        kb = KnowledgeBase()
        llm = QwenLLM()
        rag = RAGChain(knowledge_base=kb, llm=llm)

        # 多轮对话测试
        conv_id = "test-multi-turn"

        # 第一轮
        r1 = rag.query("你们店在哪里？", conversation_id=conv_id, namespace="test")

        # 第二轮（关联上下文）
        r2 = rag.query("营业时间呢？", conversation_id=conv_id, namespace="test")

        # 检查对话历史
        history = rag.conversation_manager.get_history(conv_id)

        if len(history) >= 4 and r2.answer:  # 2轮对话 = 4条消息
            result.passed = True
            result.details = f"多轮对话正常, 历史: {len(history)} 条消息"
        else:
            result.passed = False
            result.details = f"对话历史不完整: {len(history)} 条"
            result.error = "需要至少 4 条消息记录"

        # 清理
        rag.conversation_manager.delete_conversation(conv_id)

    except Exception as e:
        result.passed = False
        result.details = "多轮对话错误"
        result.error = str(e)

    return result


def run_all_verifications() -> list[VerificationResult]:
    """Run all verifications"""
    verifications = [
        verify_qwen_llm,
        verify_model_routing,
        verify_prompts,
        verify_conversation_manager,
        verify_rag_chain,
        verify_multi_turn_conversation,
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
    print("                    Gate 3 验收报告")
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
            console.print("  [bold green]✓ Gate 3 验收通过！[/bold green]")
            console.print("\n  [cyan]请在对话中回复:[/cyan]")
            console.print('  [bold]"Gate 3 验收通过，进入 Phase 4"[/bold]')
        else:
            print("  ✓ Gate 3 验收通过！")
            print("\n  请在对话中回复:")
            print('  "Gate 3 验收通过，进入 Phase 4"')
    else:
        print("-"*65)
        if RICH_AVAILABLE:
            console.print("  [bold red]✗ Gate 3 验收未通过[/bold red]")
            console.print("\n  [yellow]请解决上述问题后重新运行验收脚本[/yellow]")
        else:
            print("  ✗ Gate 3 验收未通过")
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

    print("\n🔍 正在执行 Gate 3 验收检查...\n")

    results = run_all_verifications()
    success = print_report(results)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
