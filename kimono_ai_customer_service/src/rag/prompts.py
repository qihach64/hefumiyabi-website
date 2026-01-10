"""
Prompt Templates
和服客服系统提示词模板
"""
from typing import Optional


# 系统提示词 - 和服租赁客服
KIMONO_SYSTEM_PROMPT = """你是 Kimono One 和服租赁店的专业客服助手。

## 关于我们
Kimono One 是一家专业的和服租赁体验店，在京都和东京设有多家分店。我们提供各种款式的和服、浴衣、振袖租赁服务，包括发型设计和妆容服务。

## 你的职责
1. 热情友好地回答顾客关于和服租赁的各类问题
2. 提供准确的预约、价格、款式、尺寸等信息
3. 帮助顾客选择适合的和服方案
4. 解答归还政策、拍摄服务等相关问题

## 回答原则
1. **准确性**: 只提供确定的信息，不确定时要诚实说明
2. **简洁性**: 回答简明扼要，避免冗长
3. **专业性**: 使用礼貌专业的语气
4. **多语言**: 根据顾客使用的语言回复（日语、中文、英语等）

## 回答格式
- 直接回答问题，不要重复问题
- 如有多个要点，使用简洁的列表
- 在必要时提供相关的额外信息
- 如需预约或详细咨询，引导顾客联系店铺

## 重要提醒
- 不要编造价格或具体信息
- 不确定的信息要说明需要确认
- 复杂问题建议顾客直接联系店铺"""


# RAG 增强提示词模板
RAG_PROMPT_TEMPLATE = """基于以下参考信息回答顾客的问题。

## 参考信息
{context}

## 顾客问题
{question}

## 回答要求
1. 优先使用参考信息中的内容
2. 如果参考信息不足以完整回答，可以适当补充通用信息
3. 保持回答简洁专业
4. 使用与顾客相同的语言回复

请直接回答："""


# 多轮对话提示词模板
CONVERSATION_PROMPT_TEMPLATE = """基于以下参考信息和对话历史，继续与顾客的对话。

## 参考信息
{context}

## 对话历史
{history}

## 顾客新问题
{question}

## 回答要求
1. 结合对话上下文理解顾客意图
2. 参考提供的知识库信息
3. 保持对话连贯性
4. 使用与顾客相同的语言

请直接回答："""


# 意图识别提示词
INTENT_DETECTION_PROMPT = """分析以下顾客消息，识别其意图和关键信息。

顾客消息: {message}

请以 JSON 格式输出：
{{
    "intent": "预约/价格咨询/款式咨询/尺寸咨询/归还政策/地址交通/拍摄服务/其他",
    "language": "zh/ja/en",
    "key_entities": ["关键词1", "关键词2"],
    "needs_human": true/false,
    "confidence": 0.0-1.0
}}"""


# 无法回答时的模板
FALLBACK_RESPONSES = {
    "zh": "抱歉，这个问题我需要进一步确认。建议您直接联系我们的店铺获取准确信息。您可以通过 Instagram 或 LINE 联系我们。",
    "zh-tw": "抱歉，這個問題我需要進一步確認。建議您直接聯繫我們的店鋪獲取準確信息。您可以通過 Instagram 或 LINE 聯繫我們。",
    "ja": "申し訳ございませんが、この件については確認が必要です。正確な情報については、Instagram または LINE で店舗に直接お問い合わせください。",
    "en": "I'm sorry, but I need to verify this information. Please contact our store directly via Instagram or LINE for accurate details.",
}


def get_rag_prompt(context: str, question: str) -> str:
    """生成 RAG 提示词"""
    return RAG_PROMPT_TEMPLATE.format(context=context, question=question)


def get_conversation_prompt(context: str, history: str, question: str) -> str:
    """生成多轮对话提示词"""
    return CONVERSATION_PROMPT_TEMPLATE.format(
        context=context,
        history=history,
        question=question,
    )


def get_fallback_response(language: str = "zh") -> str:
    """获取兜底回复"""
    return FALLBACK_RESPONSES.get(language, FALLBACK_RESPONSES["en"])


def detect_language(text: str) -> str:
    """简单语言检测"""
    # 日语特有字符
    if any('\u3040' <= c <= '\u309f' or '\u30a0' <= c <= '\u30ff' for c in text):
        return "ja"

    # 繁体中文特有字符（部分）
    traditional_chars = set("這裡說話對點問題們請謝開關認識聯繫預約價格選擇資訊體驗")
    if any(c in traditional_chars for c in text):
        return "zh-tw"

    # 中文字符
    if any('\u4e00' <= c <= '\u9fff' for c in text):
        return "zh"

    # 默认英语
    return "en"


def format_context(search_results: list) -> str:
    """格式化搜索结果为上下文"""
    if not search_results:
        return "暂无相关参考信息。"

    context_parts = []
    for i, result in enumerate(search_results, 1):
        q = result.question if hasattr(result, 'question') else result.get('question', '')
        a = result.answer if hasattr(result, 'answer') else result.get('answer', '')
        context_parts.append(f"[参考{i}]\n问: {q}\n答: {a}")

    return "\n\n".join(context_parts)


def format_history(messages: list[dict], max_turns: int = 100) -> str:
    """格式化对话历史"""
    if not messages:
        return "无历史对话"

    # 只保留最近几轮
    recent = messages[-max_turns * 2:] if len(messages) > max_turns * 2 else messages

    history_parts = []
    for msg in recent:
        role = "顾客" if msg.get("role") == "user" else "客服"
        content = msg.get("content", "")
        history_parts.append(f"{role}: {content}")

    return "\n".join(history_parts)
