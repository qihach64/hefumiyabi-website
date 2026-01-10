#!/usr/bin/env python3
"""
Gate 2 Verification Script
Phase 2 验收: 知识库构建
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
║           Gate 2 验收 - 知识库构建                            ║
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


def verify_faq_classifier() -> VerificationResult:
    """G2.1: Verify FAQ classifier"""
    result = VerificationResult("FAQ 分类器", "G2.1")

    try:
        from knowledge import FAQClassifier

        classifier = FAQClassifier()

        # 测试分类
        test_cases = [
            {"question": "请问如何预约和服？", "answer": "可以通过官网预约", "expected": "booking"},
            {"question": "有大尺码的和服吗？", "answer": "有的，最大到110cm", "expected": "size_style"},
            {"question": "租一天多少钱？", "answer": "6000日元", "expected": "pricing"},
        ]

        correct = 0
        for tc in test_cases:
            cleaned = classifier.process_qa_pair(tc)
            if cleaned and cleaned.category.value == tc["expected"]:
                correct += 1

        if correct >= 2:  # 至少2个正确
            result.passed = True
            result.details = f"分类测试通过 ({correct}/{len(test_cases)})"
        else:
            result.passed = False
            result.details = f"分类准确率不足 ({correct}/{len(test_cases)})"
            result.error = "需要至少 2/3 准确率"

    except Exception as e:
        result.passed = False
        result.details = "分类器错误"
        result.error = str(e)

    return result


def verify_cleaned_qa_file() -> VerificationResult:
    """G2.2: Verify cleaned QA pairs file"""
    result = VerificationResult("清洗后问答对", "G2.2")

    try:
        qa_file = project_root / "data" / "processed" / "qa_pairs_cleaned.json"

        if not qa_file.exists():
            # 尝试生成
            from knowledge import FAQClassifier
            classifier = FAQClassifier()
            classifier.process_qa_file(
                project_root / "data" / "processed" / "qa_pairs_full_test.json",
                qa_file,
                min_quality=0.4
            )

        with open(qa_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        total = data["metadata"]["total_cleaned"]
        avg_quality = data["metadata"]["avg_quality_score"]

        if total >= 3000 and avg_quality >= 0.7:
            result.passed = True
            result.details = f"{total} 个问答对, 平均质量 {avg_quality:.2f}"
        else:
            result.passed = False
            result.details = f"{total} 个问答对, 质量 {avg_quality:.2f}"
            result.error = "需要至少 3000 个问答对，平均质量 >= 0.7"

    except Exception as e:
        result.passed = False
        result.details = "文件错误"
        result.error = str(e)

    return result


def verify_embedding_generator() -> VerificationResult:
    """G2.3: Verify embedding generator"""
    result = VerificationResult("嵌入生成器", "G2.3")

    try:
        from knowledge import EmbeddingGenerator

        generator = EmbeddingGenerator()

        # 测试单个嵌入
        test_text = "请问和服租赁的价格是多少？"
        embedding = generator.generate_embedding(test_text)

        if embedding and len(embedding) == generator.dimension:
            result.passed = True
            result.details = f"嵌入维度: {len(embedding)}"
        else:
            result.passed = False
            result.details = "嵌入生成失败"
            result.error = "无法生成有效嵌入向量"

    except Exception as e:
        result.passed = False
        result.details = "嵌入器错误"
        result.error = str(e)

    return result


def verify_pinecone_index() -> VerificationResult:
    """G2.4: Verify Pinecone index"""
    result = VerificationResult("Pinecone 索引", "G2.4")

    try:
        from knowledge import VectorStoreManager

        manager = VectorStoreManager()

        # 尝试创建或获取索引
        created = manager.create_index()

        if created:
            stats = manager.get_index_stats()
            result.passed = True
            result.details = f"索引维度: {stats.get('dimension', 'N/A')}"
        else:
            result.passed = False
            result.details = "索引创建失败"
            result.error = "无法创建 Pinecone 索引"

    except Exception as e:
        result.passed = False
        result.details = "Pinecone 错误"
        result.error = str(e)

    return result


def verify_knowledge_base_build() -> VerificationResult:
    """G2.5: Verify knowledge base build"""
    result = VerificationResult("知识库构建", "G2.5")

    try:
        from knowledge import KnowledgeBase, FAQClassifier, CleanedQAPair, FAQCategory

        kb = KnowledgeBase()

        # 读取清洗后的问答对
        qa_file = project_root / "data" / "processed" / "qa_pairs_cleaned.json"

        with open(qa_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 只上传前 200 个测试
        qa_pairs = data["qa_pairs"][:200]
        cleaned_pairs = [
            CleanedQAPair(
                question=qa["question"],
                answer=qa["answer"],
                category=FAQCategory(qa["category"]),
                source=qa["source"],
                conversation_id=qa.get("conversation_id", ""),
                quality_score=qa.get("quality_score", 0.5),
                keywords=qa.get("keywords", []) if isinstance(qa.get("keywords"), list) else [],
            )
            for qa in qa_pairs
        ]

        # 上传到向量数据库
        upload_stats = kb.vector_store.upsert_qa_pairs(cleaned_pairs, namespace="test")

        if upload_stats["success"] >= 150:  # 至少 75% 成功
            result.passed = True
            result.details = f"上传成功 {upload_stats['success']}/{len(cleaned_pairs)}"
        else:
            result.passed = False
            result.details = f"上传率过低 {upload_stats['success']}/{len(cleaned_pairs)}"
            result.error = "需要至少 75% 上传成功率"

    except Exception as e:
        result.passed = False
        result.details = "构建错误"
        result.error = str(e)

    return result


def verify_knowledge_base_query() -> VerificationResult:
    """G2.6: Verify knowledge base query"""
    result = VerificationResult("知识库查询", "G2.6")

    try:
        from knowledge import KnowledgeBase

        kb = KnowledgeBase()

        # 测试查询
        test_queries = [
            "和服租赁价格是多少？",
            "如何预约和服体验？",
            "有大尺码吗？",
        ]

        success_count = 0
        for query in test_queries:
            results = kb.vector_store.search(query, top_k=3, namespace="test")
            if results and len(results) > 0:
                success_count += 1

        if success_count >= 2:  # 至少 2 个查询成功
            result.passed = True
            result.details = f"查询测试通过 ({success_count}/{len(test_queries)})"
        else:
            result.passed = False
            result.details = f"查询成功率不足 ({success_count}/{len(test_queries)})"
            result.error = "需要至少 2/3 查询成功"

    except Exception as e:
        result.passed = False
        result.details = "查询错误"
        result.error = str(e)

    return result


def run_all_verifications() -> list[VerificationResult]:
    """Run all verifications"""
    verifications = [
        verify_faq_classifier,
        verify_cleaned_qa_file,
        verify_embedding_generator,
        verify_pinecone_index,
        verify_knowledge_base_build,
        verify_knowledge_base_query,
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
    print("                    Gate 2 验收报告")
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
            console.print("  [bold green]✓ Gate 2 验收通过！[/bold green]")
            console.print("\n  [cyan]请在对话中回复:[/cyan]")
            console.print('  [bold]"Gate 2 验收通过，进入 Phase 3"[/bold]')
        else:
            print("  ✓ Gate 2 验收通过！")
            print("\n  请在对话中回复:")
            print('  "Gate 2 验收通过，进入 Phase 3"')
    else:
        print("-"*65)
        if RICH_AVAILABLE:
            console.print("  [bold red]✗ Gate 2 验收未通过[/bold red]")
            console.print("\n  [yellow]请解决上述问题后重新运行验收脚本[/yellow]")
        else:
            print("  ✗ Gate 2 验收未通过")
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

    print("\n🔍 正在执行 Gate 2 验收检查...\n")

    results = run_all_verifications()
    success = print_report(results)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
