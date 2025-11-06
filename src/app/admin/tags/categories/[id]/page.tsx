"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  usageCount: number;
}

interface TagCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  showInFilter: boolean;
  tags: Tag[];
}

interface TagFormData {
  code: string;
  name: string;
  icon: string;
  color: string;
}

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<TagCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tagFormData, setTagFormData] = useState<TagFormData>({
    code: "",
    name: "",
    icon: "",
    color: "#FF5580",
  });

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

  async function fetchCategory() {
    try {
      const response = await fetch(`/api/admin/tags/categories/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setCategory(data.category);
      }
    } catch (error) {
      console.error("Failed to fetch category:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateTagModal() {
    setEditingTag(null);
    setTagFormData({
      code: "",
      name: "",
      icon: "",
      color: category?.color || "#FF5580",
    });
    setShowTagModal(true);
  }

  function openEditTagModal(tag: Tag) {
    setEditingTag(tag);
    setTagFormData({
      code: tag.code,
      name: tag.name,
      icon: tag.icon || "",
      color: tag.color || "#FF5580",
    });
    setShowTagModal(true);
  }

  function closeTagModal() {
    setShowTagModal(false);
    setEditingTag(null);
  }

  async function handleTagSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingTag
        ? `/api/admin/tags/${editingTag.id}`
        : "/api/admin/tags";

      const method = editingTag ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tagFormData,
          categoryId: categoryId,
        }),
      });

      if (response.ok) {
        fetchCategory();
        closeTagModal();
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to save tag:", error);
      alert("操作失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTagActive(tagId: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchCategory();
      }
    } catch (error) {
      console.error("Failed to toggle tag:", error);
    }
  }

  async function deleteTag(tagId: string) {
    if (!confirm("确定要删除这个标签吗？")) return;

    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategory();
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
      alert("删除失败");
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF5580] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">分类不存在</p>
          <Link
            href="/admin/tags/categories"
            className="inline-block mt-4 text-[#FF5580] hover:text-[#E63462]"
          >
            ← 返回分类列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/admin/tags/categories"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: category.color || "#FF5580" }}
          >
            {category.icon || "📁"}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-600">
              {category.code} {category.description && `· ${category.description}`}
            </p>
          </div>
          <button
            onClick={openCreateTagModal}
            className="px-6 py-2 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 font-medium"
          >
            + 新建标签
          </button>
        </div>

        {/* 状态标签 */}
        <div className="flex items-center gap-2">
          {category.isActive ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              已启用
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              已停用
            </span>
          )}
          {category.showInFilter && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              显示在筛选器
            </span>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">总标签数</p>
          <p className="text-3xl font-bold text-gray-900">{category.tags.length}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">活跃标签</p>
          <p className="text-3xl font-bold text-gray-900">
            {category.tags.filter((t) => t.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">总使用次数</p>
          <p className="text-3xl font-bold text-gray-900">
            {category.tags.reduce((sum, t) => sum + t.usageCount, 0)}
          </p>
        </div>
      </div>

      {/* 标签列表 */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">标签列表</h2>

        {category.tags.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.tags.map((tag) => (
              <div
                key={tag.id}
                className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                  tag.isActive
                    ? "border-gray-200 bg-white hover:shadow-md"
                    : "border-gray-100 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {tag.icon && <span className="text-2xl">{tag.icon}</span>}
                    <div>
                      <p className="font-semibold text-gray-900">{tag.name}</p>
                      <p className="text-xs text-gray-500">{tag.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTagActive(tag.id, tag.isActive)}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                      tag.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tag.isActive ? "启用" : "停用"}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <span>使用: {tag.usageCount} 次</span>
                  <span className="text-gray-500">代码: {tag.code}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditTagModal(tag)}
                    className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <span className="text-6xl block mb-4">🏷️</span>
            <p className="mb-4">该分类下暂无标签</p>
            <button
              onClick={openCreateTagModal}
              className="px-6 py-2 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] transition-all font-medium"
            >
              + 创建第一个标签
            </button>
          </div>
        )}
      </div>

      {/* 标签编辑/创建模态框 */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* 模态框标题 */}
            <div className="border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTag ? "编辑标签" : "创建新标签"}
              </h2>
              <button
                onClick={closeTagModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={submitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 表单内容 */}
            <form onSubmit={handleTagSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      代码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tagFormData.code}
                      onChange={(e) => setTagFormData({ ...tagFormData, code: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF5580] focus:outline-none transition-colors"
                      placeholder="casual_walk"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tagFormData.name}
                      onChange={(e) => setTagFormData({ ...tagFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF5580] focus:outline-none transition-colors"
                      placeholder="街拍漫步"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    图标 (Emoji)
                  </label>
                  <input
                    type="text"
                    value={tagFormData.icon}
                    onChange={(e) => setTagFormData({ ...tagFormData, icon: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF5580] focus:outline-none transition-colors text-2xl"
                    placeholder="📸"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">输入 emoji，如: 📸 🌸 ⭐</p>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={closeTagModal}
                  className="flex-1 px-6 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] hover:scale-[1.02] hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? "保存中..." : (editingTag ? "保存修改" : "创建标签")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
