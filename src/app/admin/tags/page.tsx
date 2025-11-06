"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Tag {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  usageCount: number;
  category: {
    id: string;
    code: string;
    name: string;
  };
}

interface TagCategory {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  showInFilter: boolean;
  filterOrder: number;
  tags: Tag[];
  _count: {
    tags: number;
  };
}

export default function AdminTagsPage() {
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

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

  async function toggleTagActive(tagId: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchCategories();
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
        fetchCategories();
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
      alert("删除失败");
    }
  }

  const filteredCategories = selectedCategory
    ? categories.filter((c) => c.id === selectedCategory)
    : categories;

  const totalTags = categories.reduce((sum, c) => sum + c._count.tags, 0);
  const activeTags = categories.reduce(
    (sum, c) => sum + c.tags.filter((t) => t.isActive).length,
    0
  );

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

  return (
    <div className="container py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">标签管理</h1>
            <p className="text-gray-600">管理套餐筛选标签和分类</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tags/categories"
              className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:scale-[1.02] transition-all duration-200 font-medium"
            >
              管理分类
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 font-medium"
            >
              + 新建标签
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">标签分类</p>
              <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#FFF5F7] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#FF5580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">总标签数</p>
              <p className="text-3xl font-bold text-gray-900">{totalTags}</p>
            </div>
            <div className="w-12 h-12 bg-[#E0F2FE] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">活跃标签</p>
              <p className="text-3xl font-bold text-gray-900">{activeTags}</p>
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
              <p className="text-3xl font-bold text-gray-900">
                {categories.filter((c) => c.showInFilter).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
              selectedCategory === null
                ? "bg-[#FF5580] text-white shadow-md"
                : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            全部分类
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCategory === category.id
                  ? "bg-[#FF5580] text-white shadow-md"
                  : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {category.name} ({category._count.tags})
            </button>
          ))}
        </div>
      </div>

      {/* 标签列表 */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl border-2 border-gray-200 p-6">
            {/* 分类标题 */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: category.color || "#FF5580" }}
                >
                  {category.icon || "📁"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">
                    {category.code} · {category.tags.length} 个标签
                    {category.showInFilter && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        显示在筛选器
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Link
                href={`/admin/tags/categories/${category.id}`}
                className="text-sm text-[#FF5580] hover:text-[#E63462] font-medium"
              >
                编辑分类 →
              </Link>
            </div>

            {/* 标签网格 */}
            {category.tags.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.tags
                  .sort((a, b) => a.order - b.order)
                  .map((tag) => (
                    <div
                      key={tag.id}
                      className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                        tag.isActive
                          ? "border-gray-200 bg-white hover:shadow-md hover:-translate-y-1"
                          : "border-gray-100 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {tag.icon && <span className="text-xl">{tag.icon}</span>}
                          <div>
                            <p className="font-semibold text-gray-900">{tag.name}</p>
                            {tag.nameEn && (
                              <p className="text-xs text-gray-500">{tag.nameEn}</p>
                            )}
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
                        <span>代码: {tag.code}</span>
                        <span>使用: {tag.usageCount} 次</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingTag(tag)}
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
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p>该分类下暂无标签</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-sm text-[#FF5580] hover:text-[#E63462] font-medium"
                >
                  + 添加第一个标签
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {categories.length === 0 && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有标签分类</h3>
          <p className="text-gray-600 mb-6">先创建标签分类，然后添加标签</p>
          <Link
            href="/admin/tags/categories"
            className="inline-block px-6 py-3 bg-[#FF5580] text-white rounded-lg hover:bg-[#E63462] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 font-medium"
          >
            创建第一个分类
          </Link>
        </div>
      )}
    </div>
  );
}
