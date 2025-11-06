"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@/components/ui";
import { Save, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PlanCardPreview from "@/components/PlanCard/PlanCardPreview";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  categoryId: string;
}

interface TagCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  tags: Tag[];
}

interface PlanEditFormProps {
  plan: {
    id: string;
    slug: string;
    name: string;
    nameEn?: string | null;
    description: string;
    category: string;
    price: number;
    originalPrice?: number | null;
    depositAmount: number;
    duration: number;
    includes: string[];
    imageUrl?: string | null;
    storeName?: string | null;
    region?: string | null;
    tags: string[]; // 保留旧数据兼容性
    planTags?: { tag: Tag }[]; // 新的标签系统
    isActive: boolean;
    isFeatured: boolean;
    isLimited: boolean;
    isCampaign: boolean;
    maxBookings?: number | null;
    currentBookings: number;
    availableFrom?: Date | null;
    availableUntil?: Date | null;
  };
}

const PLAN_CATEGORIES = [
  { value: "LADIES", label: "女士套餐" },
  { value: "MENS", label: "男士套餐" },
  { value: "COUPLE", label: "情侣套餐" },
  { value: "FAMILY", label: "家庭套餐" },
  { value: "GROUP", label: "团体套餐" },
  { value: "SPECIAL", label: "特别套餐" },
];

export default function PlanEditForm({ plan }: PlanEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 标签系统
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    plan.planTags?.map(pt => pt.tag.id) || []
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 获取已选标签的完整信息（合并 plan.planTags 和 tagCategories）
  const getSelectedTags = (): Tag[] => {
    const allTags = [
      ...(plan.planTags?.map(pt => pt.tag) || []),
      ...tagCategories.flatMap(cat => cat.tags)
    ];
    // 去重并筛选已选标签
    const uniqueTags = allTags.reduce((acc, tag) => {
      if (!acc.find(t => t.id === tag.id) && selectedTagIds.includes(tag.id)) {
        acc.push(tag);
      }
      return acc;
    }, [] as Tag[]);
    return uniqueTags;
  };

  // 加载标签分类
  useEffect(() => {
    fetchTagCategories();
  }, []);

  async function fetchTagCategories() {
    try {
      const response = await fetch('/api/tags/categories');
      if (response.ok) {
        const data = await response.json();
        const categories = data.categories || [];
        setTagCategories(categories);
        // 只展开包含已选标签的分类
        const categoriesToExpand = categories
          .filter((cat: TagCategory) =>
            cat.tags.some(tag => selectedTagIds.includes(tag.id))
          )
          .map((c: TagCategory) => c.id);
        setExpandedCategories(new Set(categoriesToExpand));
      }
    } catch (error) {
      console.error('Failed to fetch tag categories:', error);
    }
  }

  // 表单状态
  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description,
    category: plan.category,
    price: plan.price / 100, // 转换为元
    originalPrice: plan.originalPrice ? plan.originalPrice / 100 : "",
    depositAmount: plan.depositAmount / 100,
    duration: plan.duration,
    includes: plan.includes,
    imageUrl: plan.imageUrl || "",
    tags: plan.tags, // 保留旧数据兼容性
    isActive: plan.isActive,
  });

  // 新增项输入
  const [newIncludeItem, setNewIncludeItem] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/merchant/plans/${plan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tagIds: selectedTagIds, // 使用新标签系统
          price: Math.round(Number(formData.price) * 100), // 转换为分
          originalPrice: formData.originalPrice
            ? Math.round(Number(formData.originalPrice) * 100)
            : null,
          depositAmount: Math.round(Number(formData.depositAmount) * 100),
          // 添加后端API需要的字段（商家不可控制，使用默认值）
          isFeatured: false, // 精选由管理员控制
          isLimited: false,  // 限量供应功能移除
          maxBookings: null,
          availableFrom: "",
          availableUntil: "",
          nameEn: "",
          storeName: "",
          region: "",
        }),
      });

      // Check response status first
      if (!response.ok) {
        // Try to parse error message from JSON response
        try {
          const data = await response.json();
          throw new Error(data.message || `更新失败 (${response.status})`);
        } catch (jsonError) {
          // If JSON parsing fails, throw generic error
          throw new Error(`更新失败 (${response.status})`);
        }
      }

      // Success
      setSuccess(true);
      // 滚动到页面顶部显示成功提示
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // 显示成功提示后跳转回列表页
      setTimeout(() => {
        router.push("/merchant/listings");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const addIncludeItem = () => {
    if (newIncludeItem.trim()) {
      setFormData({
        ...formData,
        includes: [...formData.includes, newIncludeItem.trim()],
      });
      setNewIncludeItem("");
    }
  };

  const removeIncludeItem = (index: number) => {
    setFormData({
      ...formData,
      includes: formData.includes.filter((_, i) => i !== index),
    });
  };

  // 新标签系统函数
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 左侧：编辑表单 */}
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
        {/* 固定位置的成功提示 */}
        {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg">保存成功！</p>
              <p className="text-sm text-green-100">正在跳转到套餐列表...</p>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">基本信息</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 套餐名称 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              套餐名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>

          {/* 类别 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              套餐类别 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            >
              {PLAN_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 时长 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              体验时长 (分钟) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: Number(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 描述 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            套餐描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* 价格信息 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">价格信息</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 当前价格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前价格 (¥) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>

          {/* 原价 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原价 (¥)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.originalPrice}
              onChange={(e) =>
                setFormData({ ...formData, originalPrice: e.target.value })
              }
              placeholder="可选，用于显示折扣"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>

          {/* 押金 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              押金 (¥) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.depositAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  depositAmount: Number(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 图片 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">套餐图片</h2>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>

          {/* 图片预览缩略图 */}
          {formData.imageUrl && (
            <div className="relative w-32 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={formData.imageUrl}
                alt="套餐图片预览"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* 包含内容 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">包含内容</h2>

        {/* 已添加的项目 */}
        <div className="space-y-2 mb-4">
          {formData.includes.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl"
            >
              <span className="flex-1 text-gray-700">{item}</span>
              <button
                type="button"
                onClick={() => removeIncludeItem(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* 添加新项目 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newIncludeItem}
            onChange={(e) => setNewIncludeItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIncludeItem())}
            placeholder="例如：和服租赁、专业着装服务"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
          />
          <Button
            type="button"
            onClick={addIncludeItem}
            variant="secondary"
            size="md"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加
          </Button>
        </div>
      </div>

      {/* 标签 - 新标签系统 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">套餐标签</h2>
        <p className="text-sm text-gray-600 mb-4">
          选择适合您套餐的标签，帮助用户更容易找到和筛选
        </p>

        {/* 已选标签预览 */}
        {selectedTagIds.length > 0 && (
          <div className="mb-6 p-4 bg-sakura-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-2">
              已选择 {selectedTagIds.length} 个标签：
            </p>
            <div className="flex flex-wrap gap-2">
              {tagCategories.flatMap(cat => cat.tags)
                .filter(tag => selectedTagIds.includes(tag.id))
                .map(tag => (
                  <Badge key={tag.id} variant="info" size="md">
                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* 标签分类选择器 */}
        <div className="space-y-4">
          {tagCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const selectedCount = category.tags.filter(tag =>
              selectedTagIds.includes(tag.id)
            ).length;

            return (
              <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* 分类标题 */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{category.name}</p>
                      <p className="text-xs text-gray-600">
                        {category.tags.length} 个标签
                        {selectedCount > 0 && ` · 已选 ${selectedCount} 个`}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 标签列表 */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="flex flex-wrap gap-2">
                      {category.tags.map((tag) => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? 'text-white shadow-md scale-105'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            style={{
                              backgroundColor: isSelected
                                ? (tag.color || category.color || '#FF5580')
                                : undefined
                            }}
                          >
                            {tag.icon && <span className="mr-1">{tag.icon}</span>}
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {tagCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>暂无可用标签分类</p>
            <p className="text-sm mt-2">请联系管理员添加标签</p>
          </div>
        )}
      </div>

      {/* 套餐状态 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">套餐状态</h2>

        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="w-5 h-5 text-sakura-600 border-gray-300 rounded focus:ring-sakura-500"
          />
          <div>
            <p className="font-medium text-gray-900">上架状态</p>
            <p className="text-sm text-gray-600">开启后，用户可以查看并预订此套餐</p>
          </div>
        </label>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              保存修改
            </>
          )}
        </Button>

        <Link href="/merchant/listings">
          <Button variant="secondary" size="lg" disabled={isLoading}>
            取消
          </Button>
        </Link>
      </div>
    </form>

      {/* 右侧：实时预览 */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <PlanCardPreview
              formData={formData}
              selectedTags={getSelectedTags()}
              isActive={formData.isActive}
              isCampaign={plan.isCampaign}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
