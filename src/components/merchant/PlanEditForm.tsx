"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Save, Loader2, FileText, Send, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Tab 组件
import TabNavigation, { TabId } from "./PlanEditorTabs";
import BasicInfoTab from "./PlanEditorTabs/BasicInfoTab";
import PricingTab from "./PlanEditorTabs/PricingTab";
import ComponentsTab from "./PlanEditorTabs/ComponentsTab";
import UpgradesTab from "./PlanEditorTabs/UpgradesTab";
import CategoryTagsTab from "./PlanEditorTabs/CategoryTagsTab";
import AdvancedTab from "./PlanEditorTabs/AdvancedTab";

// 预览组件
import PlanEditPreview from "./PlanEditPreview";

// 草稿 Store
import {
  PlanFormData,
  ComponentConfig,
  UpgradeConfig,
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
    } | null;
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

interface PlanUpgrade {
  id: string;
  merchantComponentId: string;
  priceOverride: number | null;
  isPopular: boolean;
  displayOrder: number;
  merchantComponent: {
    id: string;
    price: number | null;
    template: {
      id: string;
      code: string;
      name: string;
      icon: string | null;
    } | null;
  };
}

// Plan 数据类型（编辑模式时传入）
interface PlanData {
  id: string;
  slug: string;
  name: string;
  nameEn?: string | null;
  description: string;
  highlights?: string | null;
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
  planUpgrades?: PlanUpgrade[];
  imageUrl?: string | null;
  images?: string[];
  customMapImageUrl?: string | null;
  storeName?: string | null;
  region?: string | null;
  themeId?: string | null;
  planTags?: { tag: Tag }[];
  isActive: boolean;
  isFeatured: boolean;
  isCampaign: boolean;
  isLimited?: boolean;
  maxBookings?: number | null;
  availableFrom?: string | Date | null;
  availableUntil?: string | Date | null;
  status?: string;
}

interface PlanFormProps {
  /** 编辑模式：传入现有套餐数据；新建模式：不传或传 undefined */
  plan?: PlanData;
  mapTemplate?: MapTemplateData | null;
}

export default function PlanForm({ plan, mapTemplate }: PlanFormProps) {
  const router = useRouter();

  // 模式判断：有 plan.id 为编辑模式，否则为新建模式
  const isCreateMode = !plan?.id;
  // 用于草稿存储的 ID（新建时使用临时 ID）
  const draftId = plan?.id || "new-plan-draft";

  // UI 状态
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 草稿 Store
  const { saveDraft, getDraft, clearDraft, hasDraft, getLastSaved } = usePlanDraftStore();
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);

  // 主题和标签数据
  const [themes, setThemes] = useState<Theme[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);

  // 表单数据：编辑模式使用现有数据，新建模式使用默认值
  const [formData, setFormData] = useState<PlanFormData>(() => {
    if (plan) {
      return {
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
        customMapImageUrl: plan.customMapImageUrl || "",
        storeName: plan.storeName || "",
        region: plan.region || "",
        themeId: plan.themeId || null,
        selectedTagIds: plan.planTags?.map((pt) => pt.tag.id) || [],
        isLimited: plan.isLimited || false,
        maxBookings: plan.maxBookings || null,
        availableFrom: plan.availableFrom
          ? plan.availableFrom instanceof Date
            ? plan.availableFrom.toISOString()
            : plan.availableFrom
          : null,
        availableUntil: plan.availableUntil
          ? plan.availableUntil instanceof Date
            ? plan.availableUntil.toISOString()
            : plan.availableUntil
          : null,
        isFeatured: plan.isFeatured,
        isActive: plan.isActive,
      };
    }
    // 新建模式：使用默认值
    return { ...defaultFormData };
  });

  // 组件配置
  const [selectedMerchantComponentIds, setSelectedMerchantComponentIds] = useState<string[]>(
    plan?.planComponents?.map((pc) => pc.merchantComponentId) || []
  );

  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>(
    plan?.planComponents?.map((pc) => ({
      merchantComponentId: pc.merchantComponentId,
      hotmapX: pc.hotmapX ?? null,
      hotmapY: pc.hotmapY ?? null,
      hotmapLabelPosition: pc.hotmapLabelPosition ?? "right",
      hotmapLabelOffsetX: pc.hotmapLabelOffsetX ?? undefined,
      hotmapLabelOffsetY: pc.hotmapLabelOffsetY ?? undefined,
      hotmapOrder: pc.hotmapOrder ?? 0,
    })) || []
  );

  // 升级服务配置
  const [upgradeConfigs, setUpgradeConfigs] = useState<UpgradeConfig[]>(
    plan?.planUpgrades?.map((pu) => ({
      merchantComponentId: pu.merchantComponentId,
      priceOverride: pu.priceOverride,
      isPopular: pu.isPopular,
      displayOrder: pu.displayOrder,
    })) || []
  );

  // 当 plan.planComponents 变化时（如 router.refresh() 后），同步更新状态（仅编辑模式）
  useEffect(() => {
    if (plan?.planComponents) {
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
      setSelectedMerchantComponentIds(plan.planComponents.map((pc) => pc.merchantComponentId));
    }
  }, [plan?.planComponents]);

  // 当 plan.planUpgrades 变化时，同步更新状态（仅编辑模式）
  useEffect(() => {
    if (plan?.planUpgrades) {
      setUpgradeConfigs(
        plan.planUpgrades.map((pu) => ({
          merchantComponentId: pu.merchantComponentId,
          priceOverride: pu.priceOverride,
          isPopular: pu.isPopular,
          displayOrder: pu.displayOrder,
        }))
      );
    }
  }, [plan?.planUpgrades]);

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
    if (hasDraft(draftId)) {
      const draft = getDraft(draftId);
      if (draft) {
        const draftTime = new Date(draft.lastSaved);
        // 如果草稿比较新，提示恢复
        setShowDraftRecovery(true);
      }
    }
  }, [draftId, hasDraft, getDraft]);

  // 恢复草稿
  const recoverDraft = () => {
    const draft = getDraft(draftId);
    if (draft) {
      setFormData(draft.formData);
      setComponentConfigs(draft.componentConfigs);
      setSelectedMerchantComponentIds(draft.selectedMerchantComponentIds);
      setUpgradeConfigs(draft.upgradeConfigs || []);
      setLastSavedTime(new Date(draft.lastSaved));
    }
    setShowDraftRecovery(false);
  };

  // 丢弃草稿
  const discardDraft = () => {
    clearDraft(draftId);
    setShowDraftRecovery(false);
  };

  // 自动保存草稿（防抖）
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(draftId, formData, componentConfigs, selectedMerchantComponentIds, upgradeConfigs);
      setLastSavedTime(new Date());
    }, 3000);
  }, [
    draftId,
    formData,
    componentConfigs,
    selectedMerchantComponentIds,
    upgradeConfigs,
    saveDraft,
  ]);

  // 表单变化时触发自动保存
  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, componentConfigs, selectedMerchantComponentIds, upgradeConfigs, triggerAutoSave]);

  // 表单字段更新
  const handleFormChange = <K extends keyof PlanFormData>(field: K, value: PlanFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 获取已选标签的完整信息
  const getSelectedTags = (): Tag[] => {
    const allTags = [
      ...(plan?.planTags?.map((pt) => pt.tag) || []),
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

  // 保存草稿到服务器（仅编辑模式支持）
  const handleSaveDraft = async () => {
    if (isCreateMode) {
      // 新建模式：仅保存到 localStorage
      saveDraft(draftId, formData, componentConfigs, selectedMerchantComponentIds, upgradeConfigs);
      setLastSavedTime(new Date());
      setSuccess("草稿已保存到本地");
      setTimeout(() => setSuccess(null), 3000);
      return;
    }

    setIsSavingDraft(true);
    setError(null);

    try {
      const response = await fetch(`/api/merchant/plans/${plan!.id}`, {
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

      clearDraft(draftId);
      setSuccess("草稿已保存");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存草稿失败");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 发布/创建套餐
  const handlePublish = async () => {
    // 先保存草稿到 localStorage，确保修改不会丢失
    saveDraft(draftId, formData, componentConfigs, selectedMerchantComponentIds, upgradeConfigs);
    setLastSavedTime(new Date());

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
      // 新建模式使用 POST，编辑模式使用 PATCH
      const url = isCreateMode ? "/api/merchant/plans" : `/api/merchant/plans/${plan!.id}`;
      const method = isCreateMode ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildSubmitData(),
          status: "PUBLISHED",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || (isCreateMode ? "创建失败" : "发布失败"));
      }

      clearDraft(draftId);

      if (isCreateMode) {
        setSuccess("套餐创建成功！");
        // 新建成功后跳转到列表页
        router.push("/merchant/listings");
        router.refresh();
      } else {
        setSuccess("套餐已发布！");
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : isCreateMode ? "创建失败，请重试" : "发布失败，请重试"
      );
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
    originalPrice: formData.originalPrice ? Math.round(Number(formData.originalPrice) * 100) : null,
    depositAmount: formData.depositAmount ? Math.round(Number(formData.depositAmount) * 100) : 0,
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
    planUpgrades: upgradeConfigs.map((config) => ({
      merchantComponentId: config.merchantComponentId,
      priceOverride: config.priceOverride,
      isPopular: config.isPopular,
      displayOrder: config.displayOrder,
    })),
    imageUrl: formData.imageUrl || null,
    images: formData.images || [],
    customMapImageUrl: formData.customMapImageUrl || null,
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
    <div className="min-h-screen bg-gray-50">
      {/* 草稿恢复弹窗 */}
      {showDraftRecovery && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-[18px] font-semibold text-gray-900 mb-2">发现未保存的编辑</h3>
            <p className="text-[14px] text-gray-600 mb-6">您有一个未保存的草稿版本，是否要恢复？</p>
            <div className="flex gap-4">
              <button
                onClick={recoverDraft}
                className="flex-1 px-4 py-2.5 bg-sakura-600 text-white rounded-lg text-[14px] font-medium hover:bg-sakura-700 transition-all duration-300"
              >
                恢复草稿
              </button>
              <button
                onClick={discardDraft}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition-all duration-300"
              >
                丢弃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提示消息 */}
      {(error || success) && (
        <div className="px-6 lg:px-8 pt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[14px]">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-[14px]">
              {success}
            </div>
          )}
        </div>
      )}

      {/* 主体内容：全宽布局 */}
      <div className="bg-white min-h-screen">
        {/* Tab 导航头部：包含返回、tabs 和操作按钮 */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 lg:px-6">
            {/* 左侧：返回按钮 + Tab 导航 */}
            <div className="flex items-center">
              <Link
                href="/merchant/listings"
                className="p-2 mr-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* 右侧：保存时间 + 操作按钮 */}
            <div className="flex items-center gap-4">
              {lastSavedTime && (
                <div className="hidden lg:flex items-center gap-2 text-[12px] text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>自动保存于 {formatLastSaved()}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isLoading}
                  className="rounded-lg"
                >
                  {isSavingDraft ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-1.5" />
                  )}
                  <span className="text-[13px] hidden sm:inline">保存草稿</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handlePublish}
                  disabled={isLoading || isSavingDraft}
                  className="rounded-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1.5" />
                  )}
                  <span className="text-[13px]">{isCreateMode ? "发布套餐" : "发布"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 内容 */}
        <div className="p-6 lg:p-8 min-h-[calc(100vh-60px)]">
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
              customMapImageUrl={formData.customMapImageUrl}
              onCustomMapImageChange={(url) => handleFormChange("customMapImageUrl", url)}
              onComponentIdsChange={setSelectedMerchantComponentIds}
              onComponentConfigsChange={setComponentConfigs}
              planId={plan?.id}
            />
          )}

          {activeTab === "upgrades" && (
            <UpgradesTab selectedUpgrades={upgradeConfigs} onUpgradesChange={setUpgradeConfigs} />
          )}

          {activeTab === "tags" && (
            <CategoryTagsTab formData={formData} onFormChange={handleFormChange} />
          )}

          {activeTab === "advanced" && (
            <AdvancedTab formData={formData} onFormChange={handleFormChange} />
          )}

          {activeTab === "preview" && (
            <div className="h-[calc(100vh-140px)] overflow-hidden rounded-xl border border-gray-100">
              <PlanEditPreview
                formData={formData}
                componentConfigs={componentConfigs}
                selectedTags={getSelectedTags()}
                theme={getCurrentTheme()}
                store={formData.storeName ? { id: "preview", name: formData.storeName } : null}
                isCampaign={plan?.isCampaign || false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
