"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  Save,
  Loader2,
  FileText,
  Send,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Tab 组件
import TabNavigation, { TabId } from "./PlanEditorTabs";
import BasicInfoTab from "./PlanEditorTabs/BasicInfoTab";
import PricingTab from "./PlanEditorTabs/PricingTab";
import ComponentsTab from "./PlanEditorTabs/ComponentsTab";
import CategoryTagsTab from "./PlanEditorTabs/CategoryTagsTab";
import AdvancedTab from "./PlanEditorTabs/AdvancedTab";

// 预览组件
import PlanEditPreview from "./PlanEditPreview";

// 草稿 Store
import {
  PlanFormData,
  ComponentConfig,
  defaultFormData,
  usePlanDraftStore,
} from "@/store/planDraft";

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
  merchantComponentId: string;
  hotmapX?: number | null;
  hotmapY?: number | null;
  hotmapLabelPosition?: string;
  hotmapLabelOffsetX?: number | null;
  hotmapLabelOffsetY?: number | null;
  hotmapOrder?: number;
  merchantComponent: {
    id: string;
    template: {
      id: string;
      code: string;
      name: string;
      type: string;
      icon: string | null;
    };
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
    depositAmount?: number;
    pricingUnit?: string | null;
    unitLabel?: string | null;
    unitDescription?: string | null;
    minQuantity?: number | null;
    maxQuantity?: number | null;
    duration?: number;
    planComponents?: PlanComponent[];
    imageUrl?: string | null;
    images?: string[];
    storeName?: string | null;
    region?: string | null;
    themeId?: string | null;
    planTags?: { tag: Tag }[];
    isActive: boolean;
    isFeatured: boolean;
    isCampaign: boolean;
    isLimited?: boolean;
    maxBookings?: number | null;
    availableFrom?: string | null;
    availableUntil?: string | null;
    status?: string;
  };
  mapTemplate?: MapTemplateData | null;
}

export default function PlanEditForm({ plan, mapTemplate }: PlanEditFormProps) {
  const router = useRouter();

  // UI 状态
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 草稿 Store
  const { saveDraft, getDraft, clearDraft, hasDraft, getLastSaved } =
    usePlanDraftStore();
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);

  // 主题和标签数据
  const [themes, setThemes] = useState<Theme[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);

  // 表单数据
  const [formData, setFormData] = useState<PlanFormData>(() => ({
    name: plan.name,
    description: plan.description,
    highlights: plan.highlights || "",
    price: plan.price / 100,
    originalPrice: plan.originalPrice ? plan.originalPrice / 100 : "",
    depositAmount: plan.depositAmount ? plan.depositAmount / 100 : "",
    pricingUnit: (plan.pricingUnit as "person" | "group") || "person",
    unitLabel: plan.unitLabel || "人",
    unitDescription: plan.unitDescription || "",
    minQuantity: plan.minQuantity || 1,
    maxQuantity: plan.maxQuantity || 10,
    duration: plan.duration || 4,
    imageUrl: plan.imageUrl || "",
    images: plan.images || [],
    storeName: plan.storeName || "",
    region: plan.region || "",
    themeId: plan.themeId || null,
    selectedTagIds: plan.planTags?.map((pt) => pt.tag.id) || [],
    category: plan.category,
    isLimited: plan.isLimited || false,
    maxBookings: plan.maxBookings || null,
    availableFrom: plan.availableFrom || null,
    availableUntil: plan.availableUntil || null,
    isFeatured: plan.isFeatured,
    isActive: plan.isActive,
  }));

  // 组件配置
  const [selectedMerchantComponentIds, setSelectedMerchantComponentIds] = useState<
    string[]
  >(plan.planComponents?.map((pc) => pc.merchantComponentId) || []);

  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>(
    plan.planComponents?.map((pc) => ({
      merchantComponentId: pc.merchantComponentId,
      hotmapX: pc.hotmapX ?? null,
      hotmapY: pc.hotmapY ?? null,
      hotmapLabelPosition: pc.hotmapLabelPosition ?? "right",
      hotmapLabelOffsetX: pc.hotmapLabelOffsetX ?? undefined,
      hotmapLabelOffsetY: pc.hotmapLabelOffsetY ?? undefined,
      hotmapOrder: pc.hotmapOrder ?? 0,
    })) || []
  );

  // 当 plan.planComponents 变化时（如 router.refresh() 后），同步更新状态
  useEffect(() => {
    if (plan.planComponents) {
      setComponentConfigs(
        plan.planComponents.map((pc) => ({
          merchantComponentId: pc.merchantComponentId,
          hotmapX: pc.hotmapX ?? null,
          hotmapY: pc.hotmapY ?? null,
          hotmapLabelPosition: pc.hotmapLabelPosition ?? "right",
          hotmapLabelOffsetX: pc.hotmapLabelOffsetX ?? undefined,
          hotmapLabelOffsetY: pc.hotmapLabelOffsetY ?? undefined,
          hotmapOrder: pc.hotmapOrder ?? 0,
        }))
      );
      setSelectedMerchantComponentIds(
        plan.planComponents.map((pc) => pc.merchantComponentId)
      );
    }
  }, [plan.planComponents]);

  // 自动保存定时器
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载主题和标签
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [themesRes, tagsRes] = await Promise.all([
          fetch("/api/themes"),
          fetch("/api/tags/categories"),
        ]);

        if (themesRes.ok) {
          const data = await themesRes.json();
          setThemes(data.themes || []);
        }

        if (tagsRes.ok) {
          const data = await tagsRes.json();
          setTagCategories(data.categories || []);
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    };

    fetchData();
  }, []);

  // 检查草稿恢复
  useEffect(() => {
    if (hasDraft(plan.id)) {
      const draft = getDraft(plan.id);
      if (draft) {
        const draftTime = new Date(draft.lastSaved);
        // 如果草稿比较新，提示恢复
        setShowDraftRecovery(true);
      }
    }
  }, [plan.id, hasDraft, getDraft]);

  // 恢复草稿
  const recoverDraft = () => {
    const draft = getDraft(plan.id);
    if (draft) {
      setFormData(draft.formData);
      setComponentConfigs(draft.componentConfigs);
      setSelectedMerchantComponentIds(draft.selectedMerchantComponentIds);
      setLastSavedTime(new Date(draft.lastSaved));
    }
    setShowDraftRecovery(false);
  };

  // 丢弃草稿
  const discardDraft = () => {
    clearDraft(plan.id);
    setShowDraftRecovery(false);
  };

  // 自动保存草稿（防抖）
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(plan.id, formData, componentConfigs, selectedMerchantComponentIds);
      setLastSavedTime(new Date());
    }, 3000);
  }, [plan.id, formData, componentConfigs, selectedMerchantComponentIds, saveDraft]);

  // 表单变化时触发自动保存
  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, componentConfigs, selectedMerchantComponentIds, triggerAutoSave]);

  // 表单字段更新
  const handleFormChange = <K extends keyof PlanFormData>(
    field: K,
    value: PlanFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 获取已选标签的完整信息
  const getSelectedTags = (): Tag[] => {
    const allTags = [
      ...(plan.planTags?.map((pt) => pt.tag) || []),
      ...tagCategories.flatMap((cat) => cat.tags),
    ];
    const uniqueTags = allTags.reduce((acc, tag) => {
      if (!acc.find((t) => t.id === tag.id) && formData.selectedTagIds.includes(tag.id)) {
        acc.push(tag);
      }
      return acc;
    }, [] as Tag[]);
    return uniqueTags;
  };

  // 获取当前主题
  const getCurrentTheme = () => {
    return themes.find((t) => t.id === formData.themeId) || null;
  };

  // 保存草稿到服务器
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setError(null);

    try {
      const response = await fetch(`/api/merchant/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildSubmitData(),
          status: "DRAFT",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "保存草稿失败");
      }

      clearDraft(plan.id);
      setSuccess("草稿已保存");
      // 刷新页面数据以显示最新保存的状态
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存草稿失败");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 发布套餐
  const handlePublish = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      setError("请填写套餐名称");
      setActiveTab("basic");
      return;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      setError("请填写套餐描述（至少 10 个字符）");
      setActiveTab("basic");
      return;
    }
    if (formData.price <= 0) {
      setError("请设置有效的价格");
      setActiveTab("pricing");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/merchant/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildSubmitData(),
          status: "PUBLISHED",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "发布失败");
      }

      clearDraft(plan.id);
      setSuccess("套餐已发布！");
      // 刷新页面数据以显示最新保存的状态
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 构建提交数据
  const buildSubmitData = () => ({
    name: formData.name,
    description: formData.description,
    highlights: formData.highlights || null,
    price: Math.round(Number(formData.price) * 100),
    originalPrice: formData.originalPrice
      ? Math.round(Number(formData.originalPrice) * 100)
      : null,
    depositAmount: formData.depositAmount
      ? Math.round(Number(formData.depositAmount) * 100)
      : 0,
    pricingUnit: formData.pricingUnit,
    unitLabel: formData.unitLabel,
    unitDescription: formData.unitDescription || null,
    minQuantity: formData.minQuantity,
    maxQuantity: formData.maxQuantity,
    duration: formData.duration,
    planComponents: componentConfigs.map((config) => ({
      merchantComponentId: config.merchantComponentId,
      hotmapX: config.hotmapX,
      hotmapY: config.hotmapY,
      hotmapLabelPosition: config.hotmapLabelPosition,
      hotmapLabelOffsetX: config.hotmapLabelOffsetX,
      hotmapLabelOffsetY: config.hotmapLabelOffsetY,
      hotmapOrder: config.hotmapOrder,
    })),
    imageUrl: formData.imageUrl || null,
    images: formData.images || [],
    storeName: formData.storeName || null,
    region: formData.region || null,
    themeId: formData.themeId,
    tagIds: formData.selectedTagIds,
    isLimited: formData.isLimited,
    maxBookings: formData.maxBookings,
    availableFrom: formData.availableFrom,
    availableUntil: formData.availableUntil,
    isFeatured: formData.isFeatured,
    isActive: formData.isActive,
  });

  // 格式化上次保存时间
  const formatLastSaved = () => {
    if (!lastSavedTime) return null;
    const now = new Date();
    const diff = now.getTime() - lastSavedTime.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    return lastSavedTime.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* 草稿恢复弹窗 */}
      {showDraftRecovery && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">发现未保存的编辑</h3>
            <p className="text-gray-600 mb-4">
              您有一个未保存的草稿版本，是否要恢复？
            </p>
            <div className="flex gap-3">
              <button
                onClick={recoverDraft}
                className="flex-1 px-4 py-2 bg-[#D4A5A5] text-white rounded-xl font-medium hover:bg-[#c99595] transition-colors"
              >
                恢复草稿
              </button>
              <button
                onClick={discardDraft}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                丢弃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧：返回和标题 */}
            <div className="flex items-center gap-4">
              <Link
                href="/merchant/listings"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-800">编辑套餐</h1>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                  {formData.name || "未命名套餐"}
                </p>
              </div>
            </div>

            {/* 中间：上次保存时间 */}
            {lastSavedTime && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>自动保存于 {formatLastSaved()}</span>
              </div>
            )}

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isLoading}
              >
                {isSavingDraft ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-1.5" />
                )}
                保存草稿
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handlePublish}
                disabled={isLoading || isSavingDraft}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                发布
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 提示消息 */}
      {(error || success) && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
              {success}
            </div>
          )}
        </div>
      )}

      {/* 主体内容：60/40 布局 */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 左侧：编辑区 (60%) */}
          <div className="flex-1 min-w-0" style={{ maxWidth: "60%" }}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Tab 导航 */}
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Tab 内容 */}
              <div className="p-6 min-h-[500px]">
                {activeTab === "basic" && (
                  <BasicInfoTab formData={formData} onFormChange={handleFormChange} />
                )}

                {activeTab === "pricing" && (
                  <PricingTab formData={formData} onFormChange={handleFormChange} />
                )}

                {activeTab === "components" && (
                  <ComponentsTab
                    themeId={formData.themeId}
                    selectedMerchantComponentIds={selectedMerchantComponentIds}
                    componentConfigs={componentConfigs}
                    mapTemplate={mapTemplate}
                    onComponentIdsChange={setSelectedMerchantComponentIds}
                    onComponentConfigsChange={setComponentConfigs}
                  />
                )}

                {activeTab === "tags" && (
                  <CategoryTagsTab formData={formData} onFormChange={handleFormChange} />
                )}

                {activeTab === "advanced" && (
                  <AdvancedTab formData={formData} onFormChange={handleFormChange} />
                )}
              </div>
            </div>
          </div>

          {/* 右侧：预览区 (40%) */}
          <div className="w-[40%] flex-shrink-0">
            <div className="sticky top-24 h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <PlanEditPreview
                formData={formData}
                componentConfigs={componentConfigs}
                selectedTags={getSelectedTags()}
                theme={getCurrentTheme()}
                store={formData.storeName ? { id: "preview", name: formData.storeName } : null}
                isCampaign={plan.isCampaign}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
