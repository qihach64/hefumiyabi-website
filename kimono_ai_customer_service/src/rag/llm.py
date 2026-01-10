"""
LLM Wrapper
Qwen 模型封装 - 支持 Qwen-Plus 和 Qwen-Max 路由
"""
import os
import random
from typing import Optional, Generator
from dataclasses import dataclass
from enum import Enum

import dashscope
from dashscope import Generation


class ModelType(str, Enum):
    """模型类型"""
    QWEN_PLUS = "qwen-plus"      # 日常查询 (80%)
    QWEN_MAX = "qwen-max"        # 复杂问题 (20%)
    QWEN_TURBO = "qwen-turbo"    # 快速响应


@dataclass
class LLMResponse:
    """LLM 响应"""
    content: str
    model: str
    usage: dict
    finish_reason: str

    def to_dict(self) -> dict:
        return {
            "content": self.content,
            "model": self.model,
            "usage": self.usage,
            "finish_reason": self.finish_reason,
        }


class QwenLLM:
    """Qwen 模型封装"""

    # 模型配置
    # 上下文窗口: qwen-plus/turbo=128K, qwen-max=32K
    MODEL_CONFIGS = {
        ModelType.QWEN_PLUS: {
            "max_tokens": 4000,      # 输出 token 限制
            "context_window": 128000, # 上下文窗口
            "temperature": 0.7,
            "top_p": 0.8,
        },
        ModelType.QWEN_MAX: {
            "max_tokens": 8000,      # 输出 token 限制
            "context_window": 32000,  # 上下文窗口
            "temperature": 0.7,
            "top_p": 0.9,
        },
        ModelType.QWEN_TURBO: {
            "max_tokens": 2000,      # 输出 token 限制
            "context_window": 128000, # 上下文窗口
            "temperature": 0.5,
            "top_p": 0.8,
        },
    }

    # 复杂问题关键词 (触发 Qwen-Max)
    COMPLEX_KEYWORDS = [
        # 投诉相关
        "投诉", "complaint", "不满", "差评", "退款", "refund",
        # 特殊要求
        "特殊", "special", "定制", "custom", "vip",
        # 复杂咨询
        "详细", "详情", "explain", "为什么", "why",
        # 多问题
        "另外", "还有", "以及", "and also",
    ]

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: ModelType = ModelType.QWEN_PLUS,
        routing_ratio: float = 0.8,  # Qwen-Plus 使用比例
    ):
        """
        初始化 Qwen LLM

        Args:
            api_key: DashScope API Key
            default_model: 默认模型
            routing_ratio: Qwen-Plus 路由比例 (0-1)
        """
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY 未设置")

        dashscope.api_key = self.api_key
        self.default_model = default_model
        self.routing_ratio = routing_ratio

    def _is_complex_query(self, query: str) -> bool:
        """判断是否为复杂查询"""
        query_lower = query.lower()

        # 检查复杂关键词
        for keyword in self.COMPLEX_KEYWORDS:
            if keyword.lower() in query_lower:
                return True

        # 长问题可能更复杂
        if len(query) > 200:
            return True

        # 包含多个问号
        if query.count("?") > 1 or query.count("？") > 1:
            return True

        return False

    def select_model(self, query: str, force_model: Optional[ModelType] = None) -> ModelType:
        """
        智能选择模型

        Args:
            query: 用户查询
            force_model: 强制使用的模型

        Returns:
            选择的模型类型
        """
        if force_model:
            return force_model

        # 复杂查询使用 Qwen-Max
        if self._is_complex_query(query):
            return ModelType.QWEN_MAX

        # 按比例随机选择
        if random.random() < self.routing_ratio:
            return ModelType.QWEN_PLUS
        else:
            return ModelType.QWEN_MAX

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[ModelType] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
    ) -> Optional[LLMResponse]:
        """
        生成回复

        Args:
            prompt: 用户提示
            system_prompt: 系统提示
            model: 模型类型
            temperature: 温度参数
            max_tokens: 最大 token 数
            top_p: top_p 参数

        Returns:
            LLM 响应
        """
        # 选择模型
        selected_model = model or self.select_model(prompt)
        config = self.MODEL_CONFIGS[selected_model]

        # 构建消息
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = Generation.call(
                model=selected_model.value,
                messages=messages,
                temperature=temperature or config["temperature"],
                max_tokens=max_tokens or config["max_tokens"],
                top_p=top_p or config["top_p"],
                result_format="message",
            )

            if response.status_code == 200:
                output = response.output
                choice = output.choices[0]

                return LLMResponse(
                    content=choice.message.content,
                    model=selected_model.value,
                    usage={
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                        "total_tokens": response.usage.total_tokens,
                    },
                    finish_reason=choice.finish_reason,
                )
            else:
                print(f"LLM 调用失败: {response.code} - {response.message}")
                return None

        except Exception as e:
            print(f"LLM 错误: {e}")
            return None

    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[ModelType] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Generator[str, None, None]:
        """
        流式生成回复

        Args:
            prompt: 用户提示
            system_prompt: 系统提示
            model: 模型类型
            temperature: 温度参数
            max_tokens: 最大 token 数

        Yields:
            生成的文本片段
        """
        # 选择模型
        selected_model = model or self.select_model(prompt)
        config = self.MODEL_CONFIGS[selected_model]

        # 构建消息
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            responses = Generation.call(
                model=selected_model.value,
                messages=messages,
                temperature=temperature or config["temperature"],
                max_tokens=max_tokens or config["max_tokens"],
                result_format="message",
                stream=True,
                incremental_output=True,
            )

            for response in responses:
                if response.status_code == 200:
                    content = response.output.choices[0].message.content
                    if content:
                        yield content
                else:
                    print(f"流式生成错误: {response.code}")
                    break

        except Exception as e:
            print(f"流式生成错误: {e}")

    def chat(
        self,
        messages: list[dict],
        model: Optional[ModelType] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Optional[LLMResponse]:
        """
        多轮对话

        Args:
            messages: 对话历史 [{"role": "user/assistant/system", "content": "..."}]
            model: 模型类型
            temperature: 温度参数
            max_tokens: 最大 token 数

        Returns:
            LLM 响应
        """
        # 从最后一条用户消息选择模型
        last_user_msg = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_msg = msg.get("content", "")
                break

        selected_model = model or self.select_model(last_user_msg)
        config = self.MODEL_CONFIGS[selected_model]

        try:
            response = Generation.call(
                model=selected_model.value,
                messages=messages,
                temperature=temperature or config["temperature"],
                max_tokens=max_tokens or config["max_tokens"],
                result_format="message",
            )

            if response.status_code == 200:
                output = response.output
                choice = output.choices[0]

                return LLMResponse(
                    content=choice.message.content,
                    model=selected_model.value,
                    usage={
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                        "total_tokens": response.usage.total_tokens,
                    },
                    finish_reason=choice.finish_reason,
                )
            else:
                print(f"对话调用失败: {response.code} - {response.message}")
                return None

        except Exception as e:
            print(f"对话错误: {e}")
            return None
