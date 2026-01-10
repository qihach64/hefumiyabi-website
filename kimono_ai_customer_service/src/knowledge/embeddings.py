"""
Embedding Generator
向量嵌入生成器 - 使用 DashScope text-embedding 模型
"""
import os
import time
import hashlib
from typing import Optional
from pathlib import Path

import dashscope
from dashscope import TextEmbedding


class EmbeddingGenerator:
    """向量嵌入生成器"""

    # DashScope 支持的嵌入模型
    MODELS = {
        "text-embedding-v2": {
            "dimension": 1536,
            "max_tokens": 2048,
            "batch_size": 25,
        },
        "text-embedding-v1": {
            "dimension": 1536,
            "max_tokens": 2048,
            "batch_size": 25,
        },
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "text-embedding-v2",
    ):
        """
        初始化嵌入生成器

        Args:
            api_key: DashScope API Key
            model: 嵌入模型名称
        """
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY 未设置")

        dashscope.api_key = self.api_key

        if model not in self.MODELS:
            raise ValueError(f"不支持的模型: {model}，可用模型: {list(self.MODELS.keys())}")

        self.model = model
        self.model_config = self.MODELS[model]
        self.dimension = self.model_config["dimension"]

    def _truncate_text(self, text: str, max_chars: int = 4000) -> str:
        """截断过长文本"""
        if len(text) <= max_chars:
            return text
        return text[:max_chars]

    def generate_embedding(self, text: str) -> Optional[list[float]]:
        """
        生成单个文本的嵌入向量

        Args:
            text: 输入文本

        Returns:
            嵌入向量 (list of floats)
        """
        if not text or not text.strip():
            return None

        text = self._truncate_text(text.strip())

        try:
            response = TextEmbedding.call(
                model=self.model,
                input=text,
            )

            if response.status_code == 200:
                return response.output["embeddings"][0]["embedding"]
            else:
                print(f"嵌入生成失败: {response.code} - {response.message}")
                return None

        except Exception as e:
            print(f"嵌入生成错误: {e}")
            return None

    def generate_embeddings_batch(
        self,
        texts: list[str],
        batch_size: Optional[int] = None,
        delay: float = 0.1,
        progress_callback=None,
    ) -> list[Optional[list[float]]]:
        """
        批量生成嵌入向量

        Args:
            texts: 文本列表
            batch_size: 批次大小
            delay: 请求间隔（秒）
            progress_callback: 进度回调函数

        Returns:
            嵌入向量列表
        """
        if batch_size is None:
            batch_size = self.model_config["batch_size"]

        results = []
        total = len(texts)

        for i in range(0, total, batch_size):
            batch_texts = texts[i:i + batch_size]

            # 清理和截断文本
            cleaned_texts = [
                self._truncate_text(t.strip()) if t and t.strip() else ""
                for t in batch_texts
            ]

            # 过滤空文本
            valid_indices = [j for j, t in enumerate(cleaned_texts) if t]
            valid_texts = [cleaned_texts[j] for j in valid_indices]

            batch_results = [None] * len(batch_texts)

            if valid_texts:
                try:
                    response = TextEmbedding.call(
                        model=self.model,
                        input=valid_texts,
                    )

                    if response.status_code == 200:
                        embeddings = response.output["embeddings"]
                        for idx, emb in enumerate(embeddings):
                            original_idx = valid_indices[idx]
                            batch_results[original_idx] = emb["embedding"]
                    else:
                        print(f"批量嵌入失败: {response.code} - {response.message}")

                except Exception as e:
                    print(f"批量嵌入错误: {e}")

            results.extend(batch_results)

            if progress_callback:
                progress_callback(min(i + batch_size, total), total)

            # 避免请求过快
            if i + batch_size < total:
                time.sleep(delay)

        return results

    def generate_qa_embedding(self, question: str, answer: str) -> Optional[list[float]]:
        """
        生成问答对的嵌入向量

        将问题和回答组合后生成嵌入

        Args:
            question: 问题
            answer: 回答

        Returns:
            嵌入向量
        """
        # 只使用问题生成向量，确保与搜索时一致
        return self.generate_embedding(question)

    def generate_id(self, text: str) -> str:
        """生成文本的唯一ID"""
        return hashlib.md5(text.encode()).hexdigest()[:16]
