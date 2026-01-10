"""
Vector Store Manager
向量数据库管理器 - Pinecone 集成
"""
from __future__ import annotations

import os
import json
import time
from typing import Optional
from pathlib import Path
from dataclasses import dataclass

from pinecone import Pinecone, ServerlessSpec

from .embeddings import EmbeddingGenerator
from .faq_classifier import CleanedQAPair, FAQCategory


@dataclass
class SearchResult:
    """搜索结果"""
    question: str
    answer: str
    category: str
    score: float
    metadata: dict

    def to_dict(self) -> dict:
        return {
            "question": self.question,
            "answer": self.answer,
            "category": self.category,
            "score": self.score,
            "metadata": self.metadata,
        }


class VectorStoreManager:
    """Pinecone 向量数据库管理器"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        index_name: Optional[str] = None,
        embedding_generator: Optional[EmbeddingGenerator] = None,
    ):
        """
        初始化向量数据库管理器

        Args:
            api_key: Pinecone API Key
            index_name: 索引名称
            embedding_generator: 嵌入生成器实例
        """
        self.api_key = api_key or os.getenv("PINECONE_API_KEY")
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY 未设置")

        self.index_name = index_name or os.getenv("PINECONE_INDEX", "kimono-faq-index")
        self.pc = Pinecone(api_key=self.api_key)

        # 嵌入生成器
        self.embedding_generator = embedding_generator or EmbeddingGenerator()
        self.dimension = self.embedding_generator.dimension

        self._index = None

    @property
    def index(self):
        """获取索引实例"""
        if self._index is None:
            if self.index_name in [idx.name for idx in self.pc.list_indexes()]:
                self._index = self.pc.Index(self.index_name)
            else:
                raise ValueError(f"索引 '{self.index_name}' 不存在")
        return self._index

    def create_index(self, dimension: Optional[int] = None, metric: str = "cosine") -> bool:
        """
        创建索引

        Args:
            dimension: 向量维度
            metric: 距离度量方式

        Returns:
            是否创建成功
        """
        dimension = dimension or self.dimension

        # 检查索引是否已存在
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        if self.index_name in existing_indexes:
            print(f"索引 '{self.index_name}' 已存在")
            self._index = self.pc.Index(self.index_name)
            return True

        try:
            self.pc.create_index(
                name=self.index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1",
                )
            )

            # 等待索引就绪
            print(f"正在创建索引 '{self.index_name}'...")
            while not self.pc.describe_index(self.index_name).status["ready"]:
                time.sleep(1)

            print(f"✓ 索引 '{self.index_name}' 创建成功")
            self._index = self.pc.Index(self.index_name)
            return True

        except Exception as e:
            print(f"创建索引失败: {e}")
            return False

    def delete_index(self) -> bool:
        """删除索引"""
        try:
            self.pc.delete_index(self.index_name)
            print(f"✓ 索引 '{self.index_name}' 已删除")
            self._index = None
            return True
        except Exception as e:
            print(f"删除索引失败: {e}")
            return False

    def get_index_stats(self) -> dict:
        """获取索引统计信息"""
        try:
            stats = self.index.describe_index_stats()
            # 手动序列化 namespaces，避免 Pinecone 对象导致的递归问题
            namespaces_dict = {}
            if stats.namespaces:
                for ns_name, ns_summary in stats.namespaces.items():
                    namespaces_dict[ns_name] = {
                        "vector_count": ns_summary.vector_count if hasattr(ns_summary, 'vector_count') else 0
                    }
            return {
                "dimension": stats.dimension,
                "total_vector_count": stats.total_vector_count,
                "namespaces": namespaces_dict,
            }
        except Exception as e:
            print(f"获取索引统计失败: {e}")
            return {}

    def upsert_qa_pairs(
        self,
        qa_pairs: list[CleanedQAPair],
        namespace: str = "",
        batch_size: int = 100,
        progress_callback=None,
    ) -> dict:
        """
        上传问答对到向量数据库

        Args:
            qa_pairs: 清洗后的问答对列表
            namespace: 命名空间
            batch_size: 批次大小
            progress_callback: 进度回调

        Returns:
            上传统计信息
        """
        total = len(qa_pairs)
        success_count = 0
        error_count = 0

        for i in range(0, total, batch_size):
            batch = qa_pairs[i:i + batch_size]

            # 生成嵌入向量 (只使用问题文本，确保与搜索时一致)
            texts = [qa.question for qa in batch]
            embeddings = self.embedding_generator.generate_embeddings_batch(texts)

            # 准备上传数据
            vectors = []
            for j, (qa, embedding) in enumerate(zip(batch, embeddings)):
                if embedding is None:
                    error_count += 1
                    continue

                vector_id = self.embedding_generator.generate_id(qa.question)

                vectors.append({
                    "id": vector_id,
                    "values": embedding,
                    "metadata": {
                        "question": qa.question[:1000],  # 限制长度
                        "answer": qa.answer[:2000],
                        "category": qa.category.value if isinstance(qa.category, FAQCategory) else qa.category,
                        "source": qa.source,
                        "quality_score": qa.quality_score,
                        "keywords": ",".join(qa.keywords[:5]),
                    }
                })

            # 上传到 Pinecone
            if vectors:
                try:
                    self.index.upsert(vectors=vectors, namespace=namespace)
                    success_count += len(vectors)
                except Exception as e:
                    print(f"上传批次失败: {e}")
                    error_count += len(vectors)

            if progress_callback:
                progress_callback(min(i + batch_size, total), total)

            # 避免请求过快
            time.sleep(0.5)

        return {
            "total": total,
            "success": success_count,
            "errors": error_count,
        }

    def search(
        self,
        query: str,
        top_k: int = 5,
        namespace: str = "",
        filter_dict: Optional[dict] = None,
        include_metadata: bool = True,
    ) -> list[SearchResult]:
        """
        搜索相似问答

        Args:
            query: 查询文本
            top_k: 返回结果数量
            namespace: 命名空间
            filter_dict: 过滤条件
            include_metadata: 是否返回元数据

        Returns:
            搜索结果列表
        """
        # 生成查询向量
        query_embedding = self.embedding_generator.generate_embedding(query)
        if query_embedding is None:
            return []

        try:
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                namespace=namespace,
                filter=filter_dict,
                include_metadata=include_metadata,
            )

            search_results = []
            for match in results.matches:
                metadata = match.metadata or {}
                search_results.append(SearchResult(
                    question=metadata.get("question", ""),
                    answer=metadata.get("answer", ""),
                    category=metadata.get("category", ""),
                    score=match.score,
                    metadata=metadata,
                ))

            return search_results

        except Exception as e:
            print(f"搜索失败: {e}")
            return []

    def search_by_category(
        self,
        query: str,
        category: str,
        top_k: int = 5,
        namespace: str = "",
    ) -> list[SearchResult]:
        """按分类搜索"""
        return self.search(
            query=query,
            top_k=top_k,
            namespace=namespace,
            filter_dict={"category": {"$eq": category}},
        )

    def upsert_single(
        self,
        question: str,
        answer: str,
        category: str = "",
        namespace: str = "",
        quality_score: float = 0.8,
        source: str = "feedback",
        vector_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        上传单条问答对到向量数据库

        Args:
            question: 问题
            answer: 回答
            category: 分类
            namespace: 命名空间
            quality_score: 质量分数
            source: 来源
            vector_id: 指定向量 ID（可选）

        Returns:
            向量 ID，失败返回 None
        """
        # 只使用问题文本生成向量，确保与搜索时一致
        embedding = self.embedding_generator.generate_embedding(question)
        if embedding is None:
            return None

        vector_id = vector_id or self.embedding_generator.generate_id(question)

        try:
            self.index.upsert(
                vectors=[{
                    "id": vector_id,
                    "values": embedding,
                    "metadata": {
                        "question": question[:1000],
                        "answer": answer[:2000],
                        "category": category,
                        "source": source,
                        "quality_score": quality_score,
                    }
                }],
                namespace=namespace,
            )
            return vector_id
        except Exception as e:
            print(f"上传单条失败: {e}")
            return None

    def delete_vector(
        self,
        vector_id: str,
        namespace: str = "",
    ) -> bool:
        """
        删除向量

        Args:
            vector_id: 向量 ID
            namespace: 命名空间

        Returns:
            是否删除成功
        """
        try:
            self.index.delete(ids=[vector_id], namespace=namespace)
            return True
        except Exception as e:
            print(f"删除向量失败: {e}")
            return False

    def delete_namespace(self, namespace: str) -> dict:
        """
        删除整个命名空间的所有向量

        Args:
            namespace: 命名空间

        Returns:
            删除结果 {"success": bool, "deleted_count": int, "error": str}
        """
        if not namespace:
            return {"success": False, "deleted_count": 0, "error": "namespace 不能为空"}

        try:
            # 获取命名空间的向量数量
            stats = self.get_index_stats()
            namespaces = stats.get("namespaces", {})
            vector_count = namespaces.get(namespace, {}).get("vector_count", 0)

            if vector_count == 0:
                return {"success": True, "deleted_count": 0, "error": None}

            # 删除整个命名空间
            self.index.delete(delete_all=True, namespace=namespace)

            return {"success": True, "deleted_count": vector_count, "error": None}
        except Exception as e:
            print(f"删除命名空间失败: {e}")
            return {"success": False, "deleted_count": 0, "error": str(e)}

    def get_namespace_vector_count(self, namespace: str) -> int:
        """
        获取命名空间的向量数量

        Args:
            namespace: 命名空间

        Returns:
            向量数量
        """
        try:
            stats = self.get_index_stats()
            namespaces = stats.get("namespaces", {})
            return namespaces.get(namespace, {}).get("vector_count", 0)
        except Exception:
            return 0

    def update_metadata(
        self,
        vector_id: str,
        metadata: dict,
        namespace: str = "",
    ) -> bool:
        """
        更新向量元数据（通过重新 upsert 实现）

        Args:
            vector_id: 向量 ID
            metadata: 新的元数据
            namespace: 命名空间

        Returns:
            是否更新成功
        """
        try:
            # 先获取原向量
            results = self.index.fetch(ids=[vector_id], namespace=namespace)
            if not results.vectors or vector_id not in results.vectors:
                return False

            original = results.vectors[vector_id]
            # 合并元数据
            updated_metadata = {**original.metadata, **metadata}

            # 重新 upsert
            self.index.upsert(
                vectors=[{
                    "id": vector_id,
                    "values": original.values,
                    "metadata": updated_metadata,
                }],
                namespace=namespace,
            )
            return True
        except Exception as e:
            print(f"更新元数据失败: {e}")
            return False


class KnowledgeBase:
    """知识库 - 整合分类器、嵌入器和向量存储"""

    def __init__(
        self,
        pinecone_api_key: Optional[str] = None,
        dashscope_api_key: Optional[str] = None,
        index_name: Optional[str] = None,
    ):
        """初始化知识库"""
        from .faq_classifier import FAQClassifier

        self.classifier = FAQClassifier()
        self.embedding_generator = EmbeddingGenerator(api_key=dashscope_api_key)
        self.vector_store = VectorStoreManager(
            api_key=pinecone_api_key,
            index_name=index_name,
            embedding_generator=self.embedding_generator,
        )

    def build_from_qa_file(
        self,
        qa_file_path: str | Path,
        min_quality: float = 0.4,
        namespace: str = "",
        progress_callback=None,
    ) -> dict:
        """
        从问答对文件构建知识库

        Args:
            qa_file_path: 问答对文件路径
            min_quality: 最低质量分数
            namespace: 命名空间
            progress_callback: 进度回调

        Returns:
            构建统计信息
        """
        qa_file_path = Path(qa_file_path)

        # 读取问答对
        with open(qa_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        raw_pairs = data.get("qa_pairs", [])

        # 分类和清洗
        print("正在分类和清洗问答对...")
        cleaned_pairs = []
        for qa in raw_pairs:
            cleaned = self.classifier.process_qa_pair(qa)
            if cleaned and cleaned.quality_score >= min_quality:
                cleaned_pairs.append(cleaned)

        print(f"  ✓ 清洗完成: {len(cleaned_pairs)}/{len(raw_pairs)} 个有效问答对")

        # 创建索引（如不存在）
        print("正在检查/创建 Pinecone 索引...")
        self.vector_store.create_index()

        # 上传到向量数据库
        print("正在上传到向量数据库...")
        upload_stats = self.vector_store.upsert_qa_pairs(
            cleaned_pairs,
            namespace=namespace,
            progress_callback=progress_callback,
        )

        return {
            "raw_pairs": len(raw_pairs),
            "cleaned_pairs": len(cleaned_pairs),
            "uploaded": upload_stats["success"],
            "errors": upload_stats["errors"],
        }

    def query(
        self,
        question: str,
        top_k: int = 3,
        category: Optional[str] = None,
    ) -> list[SearchResult]:
        """
        查询知识库

        Args:
            question: 用户问题
            top_k: 返回结果数量
            category: 限定分类

        Returns:
            相关问答对列表
        """
        if category:
            return self.vector_store.search_by_category(question, category, top_k)
        return self.vector_store.search(question, top_k)

    def get_stats(self) -> dict:
        """获取知识库统计信息"""
        return self.vector_store.get_index_stats()
