#!/usr/bin/env python3
"""
Gate 1 Verification Script
Phase 1 验收: 数据处理模块
"""
import sys
import os
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
║           Gate 1 验收 - 数据处理模块                          ║
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


def verify_instagram_parser() -> VerificationResult:
    """G1.1: Verify Instagram parser"""
    result = VerificationResult("Instagram 解析器", "G1.1")

    try:
        from parsers import InstagramParser

        instagram_path = os.getenv("INSTAGRAM_DATA_PATH", "../inbox")
        path = Path(instagram_path)
        if not path.is_absolute():
            path = project_root / path
        path = path.resolve()

        parser = InstagramParser(path)

        # 解析 100 个对话作为测试
        batch = parser.parse_all(limit=100)

        if batch.success_count >= 90:  # 90% 成功率
            result.passed = True
            result.details = f"解析成功 {batch.success_count}/100 个对话"
        else:
            result.passed = False
            result.details = f"解析成功率过低: {batch.success_count}/100"
            result.error = f"失败 {batch.error_count} 个"

        # 验证数据完整性
        if batch.conversations:
            conv = batch.conversations[0]
            if not conv.messages:
                result.passed = False
                result.error = "对话消息为空"
            elif not conv.customer_name:
                result.passed = False
                result.error = "客户名称缺失"

    except Exception as e:
        result.passed = False
        result.details = "解析器错误"
        result.error = str(e)

    return result


def verify_line_parser() -> VerificationResult:
    """G1.2: Verify LINE parser"""
    result = VerificationResult("LINE 解析器", "G1.2")

    try:
        from parsers import LineParser

        line_path = os.getenv("LINE_DATA_PATH", "../LINE2024-2025")
        path = Path(line_path)
        if not path.is_absolute():
            path = project_root / path
        path = path.resolve()

        parser = LineParser(path)

        # 解析 100 个对话作为测试
        batch = parser.parse_all(limit=100)

        if batch.success_count >= 90:  # 90% 成功率
            result.passed = True
            result.details = f"解析成功 {batch.success_count}/100 个对话"
        else:
            result.passed = False
            result.details = f"解析成功率过低: {batch.success_count}/100"
            result.error = f"失败 {batch.error_count} 个"

        # 验证数据完整性
        if batch.conversations:
            conv = batch.conversations[0]
            if not conv.messages:
                result.passed = False
                result.error = "对话消息为空"
            elif not conv.customer_name:
                result.passed = False
                result.error = "客户名称缺失"

    except Exception as e:
        result.passed = False
        result.details = "解析器错误"
        result.error = str(e)

    return result


def verify_data_pipeline() -> VerificationResult:
    """G1.3: Verify data pipeline"""
    result = VerificationResult("数据处理管道", "G1.3")

    try:
        from parsers import DataPipeline

        instagram_path = os.getenv("INSTAGRAM_DATA_PATH", "../inbox")
        line_path = os.getenv("LINE_DATA_PATH", "../LINE2024-2025")

        ig_path = Path(instagram_path)
        if not ig_path.is_absolute():
            ig_path = project_root / ig_path

        ln_path = Path(line_path)
        if not ln_path.is_absolute():
            ln_path = project_root / ln_path

        pipeline = DataPipeline(
            instagram_path=ig_path.resolve(),
            line_path=ln_path.resolve(),
            output_path=project_root / "data" / "processed"
        )

        # 处理少量数据测试
        stats = pipeline.process_all(instagram_limit=50, line_limit=50)

        if stats.total_conversations >= 80:  # 至少 80 个对话
            result.passed = True
            result.details = f"处理 {stats.total_conversations} 个对话, {stats.total_messages} 条消息"
        else:
            result.passed = False
            result.details = f"处理对话数量不足: {stats.total_conversations}"
            result.error = "需要至少 80 个对话"

    except Exception as e:
        result.passed = False
        result.details = "管道错误"
        result.error = str(e)

    return result


def verify_data_quality() -> VerificationResult:
    """G1.4: Verify data quality"""
    result = VerificationResult("数据质量", "G1.4")

    try:
        from parsers import DataPipeline

        instagram_path = os.getenv("INSTAGRAM_DATA_PATH", "../inbox")
        line_path = os.getenv("LINE_DATA_PATH", "../LINE2024-2025")

        ig_path = Path(instagram_path)
        if not ig_path.is_absolute():
            ig_path = project_root / ig_path

        ln_path = Path(line_path)
        if not ln_path.is_absolute():
            ln_path = project_root / ln_path

        pipeline = DataPipeline(
            instagram_path=ig_path.resolve(),
            line_path=ln_path.resolve(),
        )

        # 处理数据
        pipeline.process_all(instagram_limit=100, line_limit=100)

        # 质量检查
        quality_issues = []

        # 检查1: 客户消息比例
        if pipeline.stats.total_messages > 0:
            customer_ratio = pipeline.stats.customer_messages / pipeline.stats.total_messages
            if customer_ratio < 0.3 or customer_ratio > 0.8:
                quality_issues.append(f"客户消息比例异常: {customer_ratio:.1%}")

        # 检查2: 平均消息数
        if pipeline.stats.avg_messages_per_conversation < 2:
            quality_issues.append(f"平均消息数过低: {pipeline.stats.avg_messages_per_conversation:.1f}")

        # 检查3: 空消息检查
        empty_convs = sum(1 for c in pipeline.conversations if c.message_count == 0)
        if empty_convs > 10:
            quality_issues.append(f"空对话过多: {empty_convs}")

        # 检查4: 消息内容有效性
        valid_messages = 0
        total_messages = 0
        for conv in pipeline.conversations[:50]:  # 抽样检查
            for msg in conv.messages:
                total_messages += 1
                if msg.content and len(msg.content) > 1:
                    valid_messages += 1

        if total_messages > 0:
            valid_ratio = valid_messages / total_messages
            if valid_ratio < 0.7:
                quality_issues.append(f"有效消息比例过低: {valid_ratio:.1%}")

        if not quality_issues:
            result.passed = True
            result.details = "数据质量检查通过"
        else:
            result.passed = False
            result.details = f"发现 {len(quality_issues)} 个质量问题"
            result.error = "; ".join(quality_issues)

    except Exception as e:
        result.passed = False
        result.details = "质量检查错误"
        result.error = str(e)

    return result


def verify_qa_extraction() -> VerificationResult:
    """G1.5: Verify QA pair extraction"""
    result = VerificationResult("问答对提取", "G1.5")

    try:
        from parsers import DataPipeline

        instagram_path = os.getenv("INSTAGRAM_DATA_PATH", "../inbox")
        line_path = os.getenv("LINE_DATA_PATH", "../LINE2024-2025")

        ig_path = Path(instagram_path)
        if not ig_path.is_absolute():
            ig_path = project_root / ig_path

        ln_path = Path(line_path)
        if not ln_path.is_absolute():
            ln_path = project_root / ln_path

        output_path = project_root / "data" / "processed"

        pipeline = DataPipeline(
            instagram_path=ig_path.resolve(),
            line_path=ln_path.resolve(),
            output_path=output_path
        )

        # 处理数据
        pipeline.process_all(instagram_limit=200, line_limit=200)

        # 保存问答对
        qa_file = pipeline.save_qa_pairs("qa_pairs_test.json")

        # 验证文件是否生成
        if qa_file.exists():
            import json
            with open(qa_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            qa_count = data.get("metadata", {}).get("total_pairs", 0)

            if qa_count >= 50:  # 至少 50 个问答对
                result.passed = True
                result.details = f"提取 {qa_count} 个问答对"
            else:
                result.passed = False
                result.details = f"问答对数量不足: {qa_count}"
                result.error = "需要至少 50 个问答对"
        else:
            result.passed = False
            result.details = "文件未生成"
            result.error = "qa_pairs_test.json 未创建"

    except Exception as e:
        result.passed = False
        result.details = "问答对提取错误"
        result.error = str(e)

    return result


def verify_full_data_processing() -> VerificationResult:
    """G1.6: Verify full data processing capability"""
    result = VerificationResult("完整数据处理", "G1.6")

    try:
        from parsers import DataPipeline

        instagram_path = os.getenv("INSTAGRAM_DATA_PATH", "../inbox")
        line_path = os.getenv("LINE_DATA_PATH", "../LINE2024-2025")

        ig_path = Path(instagram_path)
        if not ig_path.is_absolute():
            ig_path = project_root / ig_path

        ln_path = Path(line_path)
        if not ln_path.is_absolute():
            ln_path = project_root / ln_path

        output_path = project_root / "data" / "processed"

        pipeline = DataPipeline(
            instagram_path=ig_path.resolve(),
            line_path=ln_path.resolve(),
            output_path=output_path
        )

        # 处理更多数据 (1000 条)
        stats = pipeline.process_all(instagram_limit=500, line_limit=500)

        # 保存数据
        conv_file = pipeline.save_conversations("conversations_test.json")
        qa_file = pipeline.save_qa_pairs("qa_pairs_full_test.json")

        # 验证
        checks = []

        # 检查对话数量
        if stats.total_conversations >= 800:
            checks.append(True)
        else:
            checks.append(False)

        # 检查文件生成
        checks.append(conv_file.exists())
        checks.append(qa_file.exists())

        # 检查消息数量
        if stats.total_messages >= 2000:
            checks.append(True)
        else:
            checks.append(False)

        if all(checks):
            result.passed = True
            result.details = f"处理 {stats.total_conversations} 对话, {stats.total_messages} 消息"
        else:
            result.passed = False
            result.details = "部分检查未通过"
            result.error = f"对话: {stats.total_conversations}, 消息: {stats.total_messages}"

    except Exception as e:
        result.passed = False
        result.details = "完整处理错误"
        result.error = str(e)

    return result


def run_all_verifications() -> list[VerificationResult]:
    """Run all verifications"""
    verifications = [
        verify_instagram_parser,
        verify_line_parser,
        verify_data_pipeline,
        verify_data_quality,
        verify_qa_extraction,
        verify_full_data_processing,
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
    print("                    Gate 1 验收报告")
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
            console.print("  [bold green]✓ Gate 1 验收通过！[/bold green]")
            console.print("\n  [cyan]请在对话中回复:[/cyan]")
            console.print('  [bold]"Gate 1 验收通过，进入 Phase 2"[/bold]')
        else:
            print("  ✓ Gate 1 验收通过！")
            print("\n  请在对话中回复:")
            print('  "Gate 1 验收通过，进入 Phase 2"')
    else:
        print("-"*65)
        if RICH_AVAILABLE:
            console.print("  [bold red]✗ Gate 1 验收未通过[/bold red]")
            console.print("\n  [yellow]请解决上述问题后重新运行验收脚本[/yellow]")
        else:
            print("  ✗ Gate 1 验收未通过")
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

    print("\n🔍 正在执行 Gate 1 验收检查...\n")

    results = run_all_verifications()
    success = print_report(results)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
