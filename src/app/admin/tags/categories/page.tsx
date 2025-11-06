"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TagCategory {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  showInFilter: boolean;
  filterOrder: number;
  _count: {
    tags: number;
  };
}

interface FormData {
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  showInFilter: boolean;
}

export default function TagCategoriesPage() {
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: "",
    name: "",
    description: "",
    icon: "",
    color: "#FF5580",
    showInFilter: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const response = await fetch("/api/admin/tags/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCategoryActive(categoryId: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/admin/tags/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Failed to toggle category:", error);
    }
  }

  async function toggleShowInFilter(categoryId: string, showInFilter: boolean) {
    try {
      const response = await fetch(`/api/admin/tags/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInFilter: !showInFilter }),
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Failed to toggle filter:", error);
    }
  }

  async function deleteCategory(categoryId: string, tagCount: number) {
    if (tagCount > 0) {
      alert(`该分类下有 ${tagCount} 个标签，请先删除标签`);
      return;
    }

    if (!confirm("确定要删除这个分类吗？")) return;

    try {
      const response = await fetch(`/api/admin/tags/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("删除失败");
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      icon: "",
      color: "#FF5580",
      showInFilter: true,
    });
    setShowModal(true);
  }

  function openEditModal(category: TagCategory) {
    setEditingCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      color: category.color || "#FF5580",
      showInFilter: category.showInFilter,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCategory(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingCategory
        ? `/api/admin/tags/categories/${editingCategory.id}`
        : "/api/admin/tags/categories";

      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCategories();
        closeModal();
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("操作失败");
    } finally {
      setSubmitting(false);
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

  const activeCategories = categories.filter((c) => c.isActive).length;
  const filterCategories = categories.filter((c) => c.showInFilter).length;
  const totalTags = categories.reduce((sum, c) => sum + c._count.tags, 0);

  return (
    <div className="container py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin/tags"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">标签分类管理</h1>
            </div>
            <p className="text-gray-600">管理标签的分类和筛选器配置</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-2 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 font-medium"
          >
            + 新建分类
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">总分类数</p>
              <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#FFF5F7] rounded-lg flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">活跃分类</p>
              <p className="text-3xl font-bold text-gray-900">{activeCategories}</p>
            </div>
            <div className="w-12 h-12 bg-[#DCFCE7] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">筛选器分类</p>
              <p className="text-3xl font-bold text-gray-900">{filterCategories}</p>
            </div>
            <div className="w-12 h-12 bg-[#E0F2FE] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">包含标签</p>
              <p className="text-3xl font-bold text-gray-900">{totalTags}</p>
            </div>
            <div className="w-12 h-12 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏷️</span>
            </div>
          </div>
        </div>
      </div>

      {/* 分类列表 */}
      {categories.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories
            .sort((a, b) => a.order - b.order)
            .map((category) => (
              <div
                key={category.id}
                className={`bg-white rounded-xl border-2 p-6 transition-all duration-300 ${
                  category.isActive
                    ? "border-gray-200 hover:shadow-lg hover:-translate-y-1"
                    : "border-gray-100 bg-gray-50 opacity-60"
                }`}
              >
                {/* 卡片头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color || "#FF5580" }}
                    >
                      {category.icon || "📁"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                      {category.nameEn && (
                        <p className="text-sm text-gray-500">{category.nameEn}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 描述 */}
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}

                {/* 元数据 */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">代码:</span>
                    <span className="font-mono font-semibold text-gray-900">{category.code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">包含标签:</span>
                    <span className="font-semibold text-gray-900">{category._count.tags} 个</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">排序:</span>
                    <span className="font-semibold text-gray-900">#{category.order}</span>
                  </div>
                </div>

                {/* 状态标签 */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => toggleCategoryActive(category.id, category.isActive)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      category.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {category.isActive ? "已启用" : "已停用"}
                  </button>
                  <button
                    onClick={() => toggleShowInFilter(category.id, category.showInFilter)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      category.showInFilter
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {category.showInFilter ? "显示筛选器" : "隐藏筛选器"}
                  </button>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/tags/categories/${category.id}`}
                    className="flex-1 px-3 py-2 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] hover:scale-[1.02] transition-all text-sm font-medium text-center"
                  >
                    管理标签
                  </Link>
                  <button
                    onClick={() => openEditModal(category)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id, category._count.tags)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <span className="text-6xl mb-4 block">📁</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有标签分类</h3>
          <p className="text-gray-600 mb-6">创建第一个分类来组织你的标签系统</p>
          <button
            onClick={openCreateModal}
            className="inline-block px-6 py-3 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 font-medium"
          >
            + 创建第一个分类
          </button>
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">使用提示</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>显示筛选器</strong>：控制该分类是否在前端套餐列表页显示为筛选选项</li>
              <li>• <strong>停用分类</strong>：停用后该分类下的所有标签将不再可用</li>
              <li>• <strong>删除保护</strong>：只有空分类（无标签）才能被删除</li>
              <li>• <strong>编辑标签</strong>：点击分类卡片的"查看标签"可以直接管理该分类下的标签</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 编辑/创建分类模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 模态框标题 */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? "编辑分类" : "创建新分类"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={submitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 表单内容 */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      代码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF5580] focus:outline-none transition-colors"
                      placeholder="scene"
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">英文字母和下划线，用于系统识别</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF5580] focus:outline-none transition-colors"
                      placeholder="使用场景"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF5580] focus:outline-none transition-colors"
                    placeholder="简要描述该分类的用途..."
                    rows={3}
                    disabled={submitting}
                  />
                </div>

                {/* 视觉设计 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    图标 (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF5580] focus:outline-none transition-colors text-2xl"
                    placeholder="📍"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">输入 emoji，如: 📍 ⭐ 🏷️</p>
                </div>

                {/* 显示筛选器开关 */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <input
                    type="checkbox"
                    id="showInFilter"
                    checked={formData.showInFilter}
                    onChange={(e) => setFormData({ ...formData, showInFilter: e.target.checked })}
                    className="w-5 h-5 text-[#FF5580] border-gray-300 rounded focus:ring-[#FF5580]"
                    disabled={submitting}
                  />
                  <label htmlFor="showInFilter" className="flex-1 cursor-pointer">
                    <p className="font-semibold text-gray-900">在筛选器中显示</p>
                    <p className="text-sm text-gray-600">启用后，该分类将在前端套餐列表页显示为筛选选项</p>
                  </label>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={submitting}
                >
                  {submitting ? "保存中..." : (editingCategory ? "保存修改" : "创建分类")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
