"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Info,
  Minus,
} from "lucide-react";

// ==================== 类型定义 ====================

interface ServiceComponent {
  id: string;
  code: string;
  name: string;
  nameJa: string | null;
  nameEn: string | null;
  description: string | null;
  type: string;
  icon: string | null;
  tier: number;
  tierLabel: string | null;
  isBaseComponent: boolean;
  basePrice: number;
  highlights: string[];
  isSystemComponent: boolean;
}

interface ComponentCategory {
  type: string;
  label: string;
  icon: string;
  components: ServiceComponent[];
}

interface UpgradeOption {
  id: string;
  fromComponentId: string;
  toComponentId: string;
  priceDiff: number;
  scope: string;
  scopeId: string | null;
  label: string | null;
  description: string | null;
  isRecommended: boolean;
  displayOrder: number;
  toComponent: {
    id: string;
    name: string;
    icon: string | null;
    tier: number;
    tierLabel: string | null;
  };
}

// 组件配置（包含升级选项和热点位置）
export interface ComponentConfig {
  componentId: string;
  isIncluded: boolean;
  enabledUpgrades: string[];
  hotmapX?: number | null;
  hotmapY?: number | null;
  hotmapLabelPosition?: string;
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

interface PlanComponentEditorProps {
  selectedComponentIds: string[];
  onChange: (componentIds: string[]) => void;
  componentConfigs?: ComponentConfig[];
  onConfigChange?: (configs: ComponentConfig[]) => void;
  themeId?: string | null;
  mapTemplate?: MapTemplateData | null;
  className?: string;
}

// ==================== 主组件 ====================

export default function PlanComponentEditor({
  selectedComponentIds,
  onChange,
  componentConfigs,
  onConfigChange,
  themeId,
  mapTemplate,
  className = "",
}: PlanComponentEditorProps) {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [upgradePaths, setUpgradePaths] = useState<Record<string, UpgradeOption[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedUpgrades, setExpandedUpgrades] = useState<Set<string>>(new Set());

  // 最近选中的组件（用于闪烁动画）
  const [recentlySelectedId, setRecentlySelectedId] = useState<string | null>(null);

  // 内部状态：组件配置
  const [internalConfigs, setInternalConfigs] = useState<ComponentConfig[]>([]);
  const configs = componentConfigs || internalConfigs;
  const setConfigs = onConfigChange || setInternalConfigs;

  // 加载服务组件
  useEffect(() => {
    async function fetchComponents() {
      try {
        const url = new URL("/api/service-components", window.location.origin);
        if (themeId) {
          url.searchParams.set("themeId", themeId);
        }
        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
          setUpgradePaths(data.upgradePaths || {});
          // 默认展开所有分类
          const allTypes = (data.categories || []).map((c: ComponentCategory) => c.type);
          setExpandedCategories(new Set(allTypes));
        }
      } catch (error) {
        console.error("Failed to fetch service components:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchComponents();
  }, [themeId]);

  // 清除闪烁动画
  useEffect(() => {
    if (recentlySelectedId) {
      const timer = setTimeout(() => setRecentlySelectedId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [recentlySelectedId]);

  // ==================== 组件选择逻辑 ====================

  const toggleCategory = (type: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // 统一的选择/取消组件函数
  const toggleComponent = useCallback(
    (componentId: string, fromHotspot: boolean = false) => {
      const isSelected = selectedComponentIds.includes(componentId);

      if (isSelected) {
        // 取消选择
        onChange(selectedComponentIds.filter((id) => id !== componentId));
        setConfigs(configs.filter((c) => c.componentId !== componentId));
      } else {
        // 选择组件
        onChange([...selectedComponentIds, componentId]);
        // 使用模板的热点位置（如果有）
        const templateHotspot = mapTemplate?.hotspots.find(
          (h) => h.componentId === componentId
        );
        setConfigs([
          ...configs,
          {
            componentId,
            isIncluded: true,
            enabledUpgrades: [],
            hotmapX: templateHotspot?.x ?? null,
            hotmapY: templateHotspot?.y ?? null,
            hotmapLabelPosition: templateHotspot?.labelPosition ?? "right",
          },
        ]);
        // 触发闪烁动画
        setRecentlySelectedId(componentId);
      }
    },
    [selectedComponentIds, onChange, configs, setConfigs, mapTemplate]
  );

  const selectAllInCategory = (components: ServiceComponent[]) => {
    const categoryIds = components.map((c) => c.id);
    const allSelected = categoryIds.every((id) => selectedComponentIds.includes(id));

    if (allSelected) {
      onChange(selectedComponentIds.filter((id) => !categoryIds.includes(id)));
      setConfigs(configs.filter((c) => !categoryIds.includes(c.componentId)));
    } else {
      const newIds = new Set([...selectedComponentIds, ...categoryIds]);
      onChange(Array.from(newIds));

      const existingConfigIds = new Set(configs.map((c) => c.componentId));
      const newConfigs = categoryIds
        .filter((id) => !existingConfigIds.has(id))
        .map((componentId) => {
          const templateHotspot = mapTemplate?.hotspots.find(
            (h) => h.componentId === componentId
          );
          return {
            componentId,
            isIncluded: true,
            enabledUpgrades: [],
            hotmapX: templateHotspot?.x ?? null,
            hotmapY: templateHotspot?.y ?? null,
            hotmapLabelPosition: templateHotspot?.labelPosition ?? "right",
          };
        });
      setConfigs([...configs, ...newConfigs]);
    }
  };

  // ==================== 升级选项逻辑 ====================

  const toggleUpgrade = (componentId: string, upgradeId: string) => {
    setConfigs(
      configs.map((config) => {
        if (config.componentId !== componentId) return config;
        const enabledUpgrades = config.enabledUpgrades.includes(upgradeId)
          ? config.enabledUpgrades.filter((id) => id !== upgradeId)
          : [...config.enabledUpgrades, upgradeId];
        return { ...config, enabledUpgrades };
      })
    );
  };

  const toggleUpgradePanel = (componentId: string) => {
    setExpandedUpgrades((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  // ==================== 辅助函数 ====================

  const getConfig = (componentId: string): ComponentConfig | undefined => {
    return configs.find((c) => c.componentId === componentId);
  };

  const getAllComponents = (): ServiceComponent[] => {
    return categories.flatMap((cat) => cat.components);
  };

  // 统计
  const totalEnabledUpgrades = configs.reduce(
    (sum, c) => sum + c.enabledUpgrades.length,
    0
  );

  // 获取有预设位置的组件列表（用于热点图显示）
  const hotspotsToShow = mapTemplate?.hotspots || [];

  // 获取没有预设位置的已选组件
  const selectedWithoutHotspot = selectedComponentIds.filter(
    (id) => !mapTemplate?.hotspots.find((h) => h.componentId === id)
  );

  // ==================== 渲染 ====================

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-12 text-gray-500">
          <div className="w-8 h-8 border-2 border-sakura-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          加载服务组件中...
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">暂无可用服务组件</p>
          <p className="text-sm mt-2">请联系管理员添加</p>
        </div>
      </div>
    );
  }

  const hasMapTemplate = !!mapTemplate;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">套餐包含内容</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {hasMapTemplate
                ? "点击图片上的标记选择服务，或在右侧列表中勾选"
                : "勾选套餐包含的服务项目"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedComponentIds.length > 0 && (
              <span className="px-3 py-1.5 bg-sakura-100 text-sakura-700 rounded-full text-sm font-medium">
                已选 {selectedComponentIds.length} 项
              </span>
            )}
            {totalEnabledUpgrades > 0 && (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                {totalEnabledUpgrades} 个升级
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区 - 左右分栏 */}
      <div className={`flex flex-col ${hasMapTemplate ? "lg:flex-row" : ""}`}>
        {/* 左侧：可交互的热点图 */}
        {hasMapTemplate && (
          <div className="lg:w-1/2 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <div className="p-4">
              {/* 操作提示 */}
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <strong>点击标记</strong>选择/取消服务项目，选中的服务会包含在套餐中
                </p>
              </div>

              {/* 图片容器 */}
              <div className="relative rounded-xl overflow-hidden bg-white shadow-sm border border-gray-200 aspect-[2/3] max-h-[600px]">
                <Image
                  src={mapTemplate.imageUrl}
                  alt="套餐展示图"
                  fill
                  className="object-contain pointer-events-none"
                  unoptimized
                />

                {/* 所有预设热点（无论是否选中都显示，但样式不同） */}
                {hotspotsToShow.map((hotspot, index) => {
                  const component = getAllComponents().find(
                    (c) => c.id === hotspot.componentId
                  );
                  if (!component) return null;

                  const isSelected = selectedComponentIds.includes(hotspot.componentId);
                  const isRecent = recentlySelectedId === hotspot.componentId;

                  return (
                    <button
                      key={hotspot.componentId}
                      type="button"
                      onClick={() => toggleComponent(hotspot.componentId, true)}
                      className="absolute group"
                      style={{
                        left: `${hotspot.x * 100}%`,
                        top: `${hotspot.y * 100}%`,
                        transform: "translate(-50%, -50%)",
                        zIndex: isSelected ? 20 : 10,
                      }}
                    >
                      {/* 选中时的脉冲动画 */}
                      {isRecent && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-sakura-400/60" />
                      )}

                      {/* 主圆点 */}
                      <div
                        className={`
                          relative w-9 h-9 rounded-full flex items-center justify-center
                          text-sm font-bold shadow-lg cursor-pointer
                          transition-all duration-300 ease-out
                          ${isSelected
                            ? "bg-sakura-500 text-white scale-110 ring-4 ring-sakura-200"
                            : "bg-white text-gray-400 border-2 border-gray-300 hover:border-sakura-400 hover:text-sakura-500 hover:scale-105"
                          }
                        `}
                      >
                        {isSelected ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>

                      {/* 标签（始终显示） */}
                      <div
                        className={`
                          absolute whitespace-nowrap rounded-lg
                          px-2.5 py-1.5 text-xs shadow-lg
                          transition-all duration-200
                          pointer-events-none
                          ${hotspot.labelPosition === "left"
                            ? "right-full mr-2"
                            : "left-full ml-2"
                          }
                          top-1/2 -translate-y-1/2
                          ${isSelected
                            ? "bg-sakura-500 text-white"
                            : "bg-white/95 text-gray-600 border border-gray-200 group-hover:border-sakura-300 group-hover:text-sakura-600"
                          }
                        `}
                      >
                        <span className="mr-1">{component.icon}</span>
                        {component.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 没有预设位置但已选中的组件提示 */}
              {selectedWithoutHotspot.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium mb-2">
                    以下服务已选择，但不在展示图中显示：
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWithoutHotspot.map((id) => {
                      const component = getAllComponents().find((c) => c.id === id);
                      if (!component) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-gray-700 border border-amber-200"
                        >
                          <span>{component.icon}</span>
                          {component.name}
                          <button
                            type="button"
                            onClick={() => toggleComponent(id)}
                            className="ml-1 text-gray-400 hover:text-red-500"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 图例说明 */}
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-sakura-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>已选择（包含在套餐中）</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
                    1
                  </div>
                  <span>未选择</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 右侧：组件选择列表 */}
        <div className="flex-1 min-w-0">
          <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
            {/* 提示信息 */}
            {hasMapTemplate && (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                也可以在此列表中勾选服务，已勾选的服务会自动显示在左侧图片上
              </div>
            )}

            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.type);
              const selectedCount = category.components.filter((c) =>
                selectedComponentIds.includes(c.id)
              ).length;
              const allSelected = selectedCount === category.components.length;

              return (
                <div
                  key={category.type}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* 分类标题 */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.type)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{category.label}</p>
                        <p className="text-xs text-gray-500">
                          {category.components.length} 项可选
                          {selectedCount > 0 && (
                            <span className="text-sakura-600 font-medium">
                              {" "}· 已选 {selectedCount}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* 组件列表 */}
                  {isExpanded && (
                    <div className="p-3 bg-white space-y-2">
                      {/* 全选按钮 */}
                      <button
                        type="button"
                        onClick={() => selectAllInCategory(category.components)}
                        className="text-xs text-sakura-600 hover:text-sakura-700 font-medium mb-1"
                      >
                        {allSelected ? "取消全选" : "全选此分类"}
                      </button>

                      {category.components.map((component) => {
                        const isSelected = selectedComponentIds.includes(component.id);
                        const config = getConfig(component.id);
                        const hasHotspot = mapTemplate?.hotspots.find(
                          (h) => h.componentId === component.id
                        );
                        const componentUpgrades = upgradePaths[component.id] || [];
                        const hasUpgrades = componentUpgrades.length > 0;
                        const isUpgradeExpanded = expandedUpgrades.has(component.id);
                        const enabledUpgradeCount = config?.enabledUpgrades.length || 0;
                        const isRecent = recentlySelectedId === component.id;

                        return (
                          <div key={component.id} className="space-y-2">
                            {/* 组件行 */}
                            <div
                              onClick={() => toggleComponent(component.id)}
                              className={`
                                flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                                transition-all duration-200
                                ${isSelected
                                  ? isRecent
                                    ? "border-sakura-500 bg-sakura-100 shadow-md"
                                    : "border-sakura-400 bg-sakura-50"
                                  : "border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50"
                                }
                              `}
                            >
                              {/* 选择框 */}
                              <div
                                className={`
                                  flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                                  ${isSelected
                                    ? "bg-sakura-500 border-sakura-500"
                                    : "border-gray-300"
                                  }
                                `}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>

                              {/* 组件信息 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{component.icon}</span>
                                  <span className={`font-medium text-sm ${isSelected ? "text-sakura-700" : "text-gray-900"}`}>
                                    {component.name}
                                  </span>
                                  {component.tierLabel && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                                      {component.tierLabel}
                                    </span>
                                  )}
                                  {/* 显示是否在热点图上 */}
                                  {hasHotspot && isSelected && (
                                    <span className="px-1.5 py-0.5 bg-sakura-100 text-sakura-600 text-[10px] rounded">
                                      展示图
                                    </span>
                                  )}
                                </div>
                                {component.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {component.description}
                                  </p>
                                )}
                              </div>

                              {/* 升级按钮 */}
                              {isSelected && hasUpgrades && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleUpgradePanel(component.id);
                                  }}
                                  className={`
                                    flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                                    ${enabledUpgradeCount > 0
                                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }
                                  `}
                                >
                                  <Sparkles className="w-3 h-3 inline mr-1" />
                                  升级{enabledUpgradeCount > 0 && ` (${enabledUpgradeCount})`}
                                </button>
                              )}
                            </div>

                            {/* 升级选项面板 */}
                            {isSelected && hasUpgrades && isUpgradeExpanded && (
                              <div className="ml-8 p-3 bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-200">
                                <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  可选升级（顾客付差价）
                                </p>
                                <div className="space-y-1.5">
                                  {componentUpgrades.map((upgrade) => {
                                    const isEnabled = config?.enabledUpgrades.includes(upgrade.id);
                                    return (
                                      <button
                                        key={upgrade.id}
                                        type="button"
                                        onClick={() => toggleUpgrade(component.id, upgrade.id)}
                                        className={`
                                          w-full p-2.5 rounded-lg border text-left transition-all duration-200 text-sm
                                          ${isEnabled
                                            ? "border-amber-400 bg-white shadow-sm"
                                            : "border-gray-200 bg-white hover:border-gray-300"
                                          }
                                        `}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`
                                                w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                                                ${isEnabled ? "bg-amber-500 border-amber-500" : "border-gray-300"}
                                              `}
                                            >
                                              {isEnabled && <Check className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                            <span className="text-gray-400 text-xs">{component.name}</span>
                                            <ArrowRight className="w-3 h-3 text-gray-300" />
                                            <span className={`font-medium ${isEnabled ? "text-amber-700" : "text-gray-700"}`}>
                                              {upgrade.toComponent.icon} {upgrade.label || upgrade.toComponent.name}
                                            </span>
                                            {upgrade.isRecommended && (
                                              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[10px] rounded">
                                                推荐
                                              </span>
                                            )}
                                          </div>
                                          <span className={`font-semibold ${isEnabled ? "text-amber-600" : "text-gray-600"}`}>
                                            +¥{(upgrade.priceDiff / 100).toLocaleString()}
                                          </span>
                                        </div>
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
