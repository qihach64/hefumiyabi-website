"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@/components/ui";
import { Save, Loader2, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PlanCardPreview from "@/components/PlanCard/PlanCardPreview";
import PlanComponentEditor, { ComponentConfig } from "./PlanComponentEditor";

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

interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface PlanComponent {
  id: string;
  componentId: string;
  isIncluded: boolean;
  isHighlighted: boolean;
  component: {
    id: string;
    code: string;
    name: string;
    type: string;
    icon: string | null;
  };
}

interface MapTemplateData {
  id: string;
  imageUrl: string;
  hotspots: {
    componentId: string;
    x: number;
    y: number;
    labelPosition: string;
  }[];
}

interface PlanEditFormProps {
  plan: {
    id: string;
    slug: string;
    name: string;
    nameEn?: string | null;
    description: string;
    highlights?: string | null;
    category: string;
    price: number;
    originalPrice?: number | null;
    planComponents?: PlanComponent[];
    imageUrl?: string | null;
    storeName?: string | null;
    region?: string | null;
    themeId?: string | null;
    planTags?: { tag: Tag }[]; // 新的标签系统
    isActive: boolean;
    isFeatured: boolean;
    isCampaign: boolean;
  };
  mapTemplate?: MapTemplateData | null;
}

// PLAN_CATEGORIES 已删除 - 使用 Theme 系统替代

export default function PlanEditForm({ plan, mapTemplate }: PlanEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 预览面板状态
  const [showPreview, setShowPreview] = useState(false);

  // 标签系统
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    plan.planTags?.map(pt => pt.tag.id) || []
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 主题系统
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(plan.themeId || null);

  // 服务组件系统
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>(
    plan.planComponents?.map(pc => pc.componentId) || []
  );

  // 组件配置（包含升级选项）
  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>(
    plan.planComponents?.map(pc => ({
      componentId: pc.componentId,
      isIncluded: pc.isIncluded,
      enabledUpgrades: [], // TODO: 从后端加载已启用的升级
    })) || []
  );

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

  // 加载标签分类和主题
  useEffect(() => {
    fetchTagCategories();
    fetchThemes();
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

  async function fetchThemes() {
    try {
      const response = await fetch('/api/themes');
      if (response.ok) {
        const data = await response.json();
        setThemes(data.themes || []);
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  }

  // 表单状态
  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description,
    highlights: plan.highlights || "",
    price: plan.price / 100, // 转换为元
    originalPrice: plan.originalPrice ? plan.originalPrice / 100 : "",
    imageUrl: plan.imageUrl || "",
    storeName: plan.storeName || "",
    region: plan.region || "",
    isActive: plan.isActive,
  });


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
          name: formData.name,
          description: formData.description,
          highlights: formData.highlights || null,
          price: Math.round(Number(formData.price) * 100), // 转换为分
          originalPrice: formData.originalPrice
            ? Math.round(Number(formData.originalPrice) * 100)
            : null,
          componentIds: selectedComponentIds,
          // 组件配置（包含升级选项）
          componentConfigs: componentConfigs.map(config => ({
            componentId: config.componentId,
            isIncluded: config.isIncluded,
            enabledUpgrades: config.enabledUpgrades,
          })),
          imageUrl: formData.imageUrl || null,
          storeName: formData.storeName || null,
          region: formData.region || null,
          themeId: selectedThemeId,
          tagIds: selectedTagIds,
          isActive: formData.isActive,
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
    <div className="relative">
      {/* 主表单区域 - 全宽 */}
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <h2 className="text-lg font-bold text-gray-900 mb-5">基本信息</h2>

          <div className="space-y-5">
            {/* 套餐名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                套餐名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
              />
            </div>

            {/* 主题选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                所属主题
              </label>
              <p className="text-xs text-gray-500 mb-2">选择套餐所属的主题分类，便于用户发现</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {themes.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(isSelected ? null : theme.id)}
                      className={`p-2.5 rounded-xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-sakura-500 bg-sakura-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {theme.icon && <span className="text-lg">{theme.icon}</span>}
                        <span className={`font-medium text-sm ${isSelected ? 'text-sakura-700' : 'text-gray-900'}`}>
                          {theme.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {themes.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">加载主题中...</p>
              )}
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                套餐描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="描述套餐的主要特点和服务内容"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 核心卖点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                核心卖点
              </label>
              <input
                type="text"
                value={formData.highlights}
                onChange={(e) =>
                  setFormData({ ...formData, highlights: e.target.value })
                }
                placeholder="例如：含专业跟拍、适合网红打卡"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">简短的一句话卖点，突出套餐最大亮点</p>
            </div>
          </div>
        </div>

        {/* 店铺信息 + 价格信息 - 合并为一行 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 店铺信息 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">店铺信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  店铺名称
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) =>
                    setFormData({ ...formData, storeName: e.target.value })
                  }
                  placeholder="例如：浅草本店"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  所在地区
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  placeholder="例如：东京浅草、京都祇园"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">价格信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  当前价格 (¥) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  原价 (¥)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.originalPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, originalPrice: e.target.value })
                  }
                  placeholder="可选，用于显示折扣"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">设置原价后将显示折扣标签</p>
              </div>
            </div>
          </div>
        </div>

        {/* 图片 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">套餐图片</h2>

          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                图片URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
              />
            </div>

            {/* 图片预览缩略图 */}
            {formData.imageUrl && (
              <div className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
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

        {/* 套餐内容配置 - 统一的组件选择、升级配置和热点编辑 */}
        <PlanComponentEditor
          selectedComponentIds={selectedComponentIds}
          onChange={setSelectedComponentIds}
          componentConfigs={componentConfigs}
          onConfigChange={setComponentConfigs}
          themeId={selectedThemeId}
          mapTemplate={mapTemplate}
        />

        {/* 标签 - 新标签系统 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">套餐标签</h2>
          <p className="text-sm text-gray-600 mb-4">
            选择适合您套餐的标签，帮助用户更容易找到和筛选
          </p>

          {/* 已选标签预览 */}
          {selectedTagIds.length > 0 && (
            <div className="mb-5 p-3 bg-sakura-50 rounded-xl">
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
          <div className="space-y-3">
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
                        <span className="text-xl">{category.icon}</span>
                      )}
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{category.name}</p>
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
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
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
          <h2 className="text-lg font-bold text-gray-900 mb-5">套餐状态</h2>

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
        <div className="flex gap-3 pb-8">
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

      {/* 浮动预览按钮 */}
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className={`
          fixed bottom-6 right-6 z-40
          flex items-center gap-2 px-4 py-3 rounded-full
          shadow-lg transition-all duration-300
          ${showPreview
            ? "bg-gray-800 text-white hover:bg-gray-700"
            : "bg-sakura-500 text-white hover:bg-sakura-600"
          }
        `}
      >
        <Eye className="w-5 h-5" />
        <span className="font-medium">
          {showPreview ? "关闭预览" : "用户预览"}
        </span>
        {showPreview ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* 侧边预览面板 */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[360px] bg-white border-l border-gray-200 shadow-2xl
          transform transition-transform duration-300 ease-out z-50
          ${showPreview ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* 面板头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900">用户预览</h3>
            <p className="text-xs text-gray-500">实时查看用户看到的效果</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 面板内容 */}
        <div className="p-5 overflow-y-auto" style={{ height: "calc(100% - 73px)" }}>
          <PlanCardPreview
            formData={formData}
            selectedTags={getSelectedTags()}
            isActive={formData.isActive}
            isCampaign={plan.isCampaign}
          />

          {/* 预览提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>提示：</strong>此预览展示的是用户在套餐列表中看到的卡片效果。
              实际详情页会展示更多信息。
            </p>
          </div>
        </div>
      </div>

      {/* 遮罩层 */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
