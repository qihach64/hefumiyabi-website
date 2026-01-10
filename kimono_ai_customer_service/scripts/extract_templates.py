#!/usr/bin/env python3
"""
模板语料提取脚本 - Phase 4
从现有语料中提取通用模板

使用方法:
    python scripts/extract_templates.py --analyze    # 仅分析
    python scripts/extract_templates.py --extract    # 提取模板
    python scripts/extract_templates.py --all        # 分析并提取
"""

import sys
import argparse
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

from services.template_service import (
    TemplateService,
    load_qa_pairs_from_file,
    save_templates_to_file,
    UNIVERSAL_CRITERIA,
)


def analyze_corpus(input_file: str, output_report: str = None):
    """分析语料库"""
    print("=" * 60)
    print("语料分析开始")
    print("=" * 60)
    print(f"\n输入文件: {input_file}")

    # 加载语料
    qa_pairs = load_qa_pairs_from_file(input_file)
    print(f"加载 QA 对数量: {len(qa_pairs)}")

    # 分析
    service = TemplateService()
    analyzed_pairs, report = service.analyze_corpus(qa_pairs)

    # 生成报告
    report_text = service.generate_report_text(report)
    print("\n" + report_text)

    # 保存报告
    if output_report:
        with open(output_report, 'w', encoding='utf-8') as f:
            f.write(report_text)
        print(f"\n报告已保存到: {output_report}")

    return analyzed_pairs, report


def extract_templates(
    input_file: str,
    output_file: str,
    min_score: float = 0.4,
    max_count: int = 1000
):
    """提取通用模板"""
    print("\n" + "=" * 60)
    print("模板提取开始")
    print("=" * 60)
    print(f"\n输入文件: {input_file}")
    print(f"最低通用性分数: {min_score}")
    print(f"最大提取数量: {max_count}")

    # 加载语料
    qa_pairs = load_qa_pairs_from_file(input_file)
    print(f"加载 QA 对数量: {len(qa_pairs)}")

    # 提取模板
    service = TemplateService()
    templates = service.extract_universal_templates(
        qa_pairs,
        min_score=min_score,
        max_count=max_count
    )

    print(f"\n提取模板数量: {len(templates)}")

    # 清理模板
    cleaned_templates = [service.clean_for_template(t) for t in templates]

    # 统计类别分布
    category_counts = {}
    for t in cleaned_templates:
        category_counts[t.category] = category_counts.get(t.category, 0) + 1

    print("\n类别分布:")
    for category, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  {category}: {count}")

    # 显示分数分布
    scores = [t.universal_score for t in cleaned_templates]
    if scores:
        print(f"\n通用性分数统计:")
        print(f"  最高: {max(scores):.3f}")
        print(f"  最低: {min(scores):.3f}")
        print(f"  平均: {sum(scores) / len(scores):.3f}")

    # 保存模板
    save_templates_to_file(cleaned_templates, output_file)
    print(f"\n模板已保存到: {output_file}")

    # 显示示例
    print("\n" + "-" * 40)
    print("示例模板 (前5条):")
    print("-" * 40)
    for i, t in enumerate(cleaned_templates[:5], 1):
        print(f"\n[{i}] 类别: {t.category}, 分数: {t.universal_score:.2f}")
        print(f"    Q: {t.question[:80]}...")
        print(f"    A: {t.answer[:80]}...")

    return cleaned_templates


def main():
    parser = argparse.ArgumentParser(description="通用模板语料提取工具")
    parser.add_argument("--analyze", action="store_true", help="仅分析语料")
    parser.add_argument("--extract", action="store_true", help="提取模板")
    parser.add_argument("--all", action="store_true", help="分析并提取")
    parser.add_argument(
        "--input",
        default=str(project_root / "data/processed/qa_pairs_cleaned.json"),
        help="输入文件路径"
    )
    parser.add_argument(
        "--output",
        default=str(project_root / "data/templates/universal_templates.json"),
        help="输出模板文件路径"
    )
    parser.add_argument(
        "--report",
        default=str(project_root / "data/templates/analysis_report.txt"),
        help="分析报告输出路径"
    )
    parser.add_argument(
        "--min-score",
        type=float,
        default=0.4,
        help="最低通用性分数 (默认 0.4)"
    )
    parser.add_argument(
        "--max-count",
        type=int,
        default=1000,
        help="最大提取数量 (默认 1000)"
    )

    args = parser.parse_args()

    # 如果没有指定任何操作，默认执行全部
    if not (args.analyze or args.extract or args.all):
        args.all = True

    # 确保输出目录存在
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).parent.mkdir(parents=True, exist_ok=True)

    if args.analyze or args.all:
        analyze_corpus(args.input, args.report)

    if args.extract or args.all:
        templates = extract_templates(
            args.input,
            args.output,
            min_score=args.min_score,
            max_count=args.max_count
        )

        print("\n" + "=" * 60)
        print(f"提取完成! 共 {len(templates)} 条通用模板")
        print("=" * 60)


if __name__ == "__main__":
    main()
