"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronDown, ChevronUp, Sparkles, ArrowRight } from "lucide-react";

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

// 组件配置（包含升级选项）
export interface ComponentConfig {
  componentId: string;
  isIncluded: boolean;
  enabledUpgrades: string[]; // 启用的升级选项 ID 列表
}

interface ServiceComponentSelectorProps {
  selectedComponentIds: string[];
  onChange: (componentIds: string[]) => void;
  // 新增：支持完整的组件配置（包含升级选项）
  componentConfigs?: ComponentConfig[];
  onConfigChange?: (configs: ComponentConfig[]) => void;
  themeId?: string | null;
  className?: string;
}

export default function ServiceComponentSelector({
  selectedComponentIds,
  onChange,
  componentConfigs,
  onConfigChange,
  themeId,
  className = "",
}: ServiceComponentSelectorProps) {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [upgradePaths, setUpgradePaths] = useState<Record<string, UpgradeOption[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedUpgrades, setExpandedUpgrades] = useState<Set<string>>(new Set()); // 展开升级配置的组件

  // 内部状态：组件配置（如果外部没有传入）
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

          // 自动展开包含已选组件的分类
          const categoriesToExpand = (data.categories || [])
            .filter((cat: ComponentCategory) =>
              cat.components.some((c) => selectedComponentIds.includes(c.id))
            )
            .map((c: ComponentCategory) => c.type);
          setExpandedCategories(new Set(categoriesToExpand));
        }
      } catch (error) {
        console.error("Failed to fetch service components:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchComponents();
  }, [selectedComponentIds, themeId]);

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

  const toggleComponent = useCallback((componentId: string) => {
    const isSelected = selectedComponentIds.includes(componentId);

    if (isSelected) {
      // 取消选择时，同时删除配置
      onChange(selectedComponentIds.filter((id) => id !== componentId));
      setConfigs(configs.filter((c) => c.componentId !== componentId));
    } else {
      // 选择时，创建默认配置
      onChange([...selectedComponentIds, componentId]);
      setConfigs([
        ...configs,
        {
          componentId,
          isIncluded: true,
          enabledUpgrades: [], // 默认不启用任何升级
        },
      ]);
    }
  }, [selectedComponentIds, onChange, configs, setConfigs]);

  const selectAllInCategory = (components: ServiceComponent[]) => {
    const categoryIds = components.map((c) => c.id);
    const allSelected = categoryIds.every((id) => selectedComponentIds.includes(id));

    if (allSelected) {
      // 取消全选
      onChange(selectedComponentIds.filter((id) => !categoryIds.includes(id)));
      setConfigs(configs.filter((c) => !categoryIds.includes(c.componentId)));
    } else {
      // 全选
      const newIds = new Set([...selectedComponentIds, ...categoryIds]);
      onChange(Array.from(newIds));

      // 为新选中的组件创建配置
      const existingConfigIds = new Set(configs.map((c) => c.componentId));
      const newConfigs = categoryIds
        .filter((id) => !existingConfigIds.has(id))
        .map((componentId) => ({
          componentId,
          isIncluded: true,
          enabledUpgrades: [],
        }));
      setConfigs([...configs, ...newConfigs]);
    }
  };

  // 切换升级选项
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

  // 切换升级配置面板
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

  // 获取组件的配置
  const getConfig = (componentId: string): ComponentConfig | undefined => {
    return configs.find((c) => c.componentId === componentId);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <h2 className="text-[18px] font-semibold text-gray-900 mb-6">套餐包含内容</h2>
        <div className="text-center py-8 text-gray-500">加载服务组件中...</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <h2 className="text-[18px] font-semibold text-gray-900 mb-6">套餐包含内容</h2>
        <div className="text-center py-8 text-gray-500">
          <p>暂无可用服务组件</p>
          <p className="text-[14px] mt-2">请联系管理员添加</p>
        </div>
      </div>
    );
  }

  // 获取所有已选组件的详情
  const selectedComponents = categories
    .flatMap((cat) => cat.components)
    .filter((c) => selectedComponentIds.includes(c.id));

  // 统计启用的升级数量
  const totalEnabledUpgrades = configs.reduce(
    (sum, c) => sum + c.enabledUpgrades.length,
    0
  );

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h2 className="text-[18px] font-semibold text-gray-900 mb-2">套餐包含内容</h2>
      <p className="text-[14px] text-gray-600 mb-6">
        选择此套餐包含的服务和配件，已选择 {selectedComponentIds.length} 项
        {totalEnabledUpgrades > 0 && (
          <span className="text-sakura-600 font-medium">
            ，{totalEnabledUpgrades} 个升级选项
          </span>
        )}
      </p>

      {/* 已选组件预览 */}
      {selectedComponents.length > 0 && (
        <div className="mb-6 p-4 bg-sakura-50 rounded-xl">
          <p className="text-[14px] font-medium text-gray-700 mb-3">已选择的服务：</p>
          <div className="flex flex-wrap gap-2">
            {selectedComponents.map((component) => {
              const config = getConfig(component.id);
              const upgradeCount = config?.enabledUpgrades.length || 0;
              return (
                <span
                  key={component.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-[14px] text-gray-700 border border-sakura-200"
                >
                  {component.icon && <span>{component.icon}</span>}
                  {component.name}
                  {upgradeCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-sakura-100 text-sakura-600 text-[12px] rounded-full">
                      +{upgradeCount}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleComponent(component.id)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 分类选择器 */}
      <div className="space-y-4">
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
                  <span className="text-[22px]">{category.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{category.label}</p>
                    <p className="text-[12px] text-gray-600">
                      {category.components.length} 项可选
                      {selectedCount > 0 && (
                        <span className="text-sakura-600 font-medium">
                          {" "}· 已选 {selectedCount} 项
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* 组件列表 */}
              {isExpanded && (
                <div className="p-4 bg-white">
                  {/* 全选按钮 */}
                  <button
                    type="button"
                    onClick={() => selectAllInCategory(category.components)}
                    className="mb-3 text-[14px] text-sakura-600 hover:text-sakura-700 font-medium"
                  >
                    {allSelected ? "取消全选" : "全选此分类"}
                  </button>

                  <div className="space-y-3">
                    {category.components.map((component) => {
                      const isSelected = selectedComponentIds.includes(component.id);
                      const componentUpgrades = upgradePaths[component.id] || [];
                      const hasUpgrades = componentUpgrades.length > 0;
                      const isUpgradeExpanded = expandedUpgrades.has(component.id);
                      const config = getConfig(component.id);
                      const enabledUpgradeCount = config?.enabledUpgrades.length || 0;

                      return (
                        <div key={component.id} className="space-y-2">
                          {/* 组件选择卡片 */}
                          <div
                            className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                              isSelected
                                ? "border-sakura-500 bg-sakura-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* 选择按钮 */}
                              <button
                                type="button"
                                onClick={() => toggleComponent(component.id)}
                                className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-sakura-500 border-sakura-500"
                                    : "border-gray-300 hover:border-sakura-400"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </button>

                              {/* 组件信息 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {component.icon && (
                                    <span className="text-[18px]">{component.icon}</span>
                                  )}
                                  <p
                                    className={`font-medium ${
                                      isSelected ? "text-sakura-700" : "text-gray-900"
                                    }`}
                                  >
                                    {component.name}
                                  </p>
                                  {component.tierLabel && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[12px] rounded-full">
                                      {component.tierLabel}
                                    </span>
                                  )}
                                  {!component.isSystemComponent && (
                                    <span className="px-2 py-0.5 bg-sakura-100 text-sakura-600 text-[12px] rounded-full">
                                      自定义
                                    </span>
                                  )}
                                </div>
                                {component.description && (
                                  <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">
                                    {component.description}
                                  </p>
                                )}
                                {component.basePrice > 0 && (
                                  <p className="text-[12px] text-gray-400 mt-1">
                                    单独购买 ¥{(component.basePrice / 100).toLocaleString()}
                                  </p>
                                )}
                              </div>

                              {/* 升级配置按钮 */}
                              {isSelected && hasUpgrades && (
                                <button
                                  type="button"
                                  onClick={() => toggleUpgradePanel(component.id)}
                                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                    enabledUpgradeCount > 0
                                      ? "bg-sakura-100 text-sakura-700 hover:bg-sakura-200"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                >
                                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                                  升级选项
                                  {enabledUpgradeCount > 0 && (
                                    <span className="ml-1">({enabledUpgradeCount})</span>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 升级选项配置面板 */}
                          {isSelected && hasUpgrades && isUpgradeExpanded && (
                            <div className="ml-8 p-4 bg-gradient-to-br from-sakura-50 to-white rounded-xl border border-sakura-200">
                              <p className="text-[14px] font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-sakura-500" />
                                可升级选项
                              </p>
                              <p className="text-[12px] text-gray-500 mb-4">
                                选择允许顾客升级的选项（顾客需要支付差价）
                              </p>
                              <div className="space-y-2">
                                {componentUpgrades.map((upgrade) => {
                                  const isEnabled = config?.enabledUpgrades.includes(upgrade.id);
                                  return (
                                    <button
                                      key={upgrade.id}
                                      type="button"
                                      onClick={() => toggleUpgrade(component.id, upgrade.id)}
                                      className={`w-full p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                                        isEnabled
                                          ? "border-sakura-500 bg-white shadow-sm"
                                          : "border-gray-200 bg-white hover:border-gray-300"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                              isEnabled
                                                ? "bg-sakura-500 border-sakura-500"
                                                : "border-gray-300"
                                            }`}
                                          >
                                            {isEnabled && (
                                              <Check className="w-2.5 h-2.5 text-white" />
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[14px] text-gray-500">
                                              {component.name}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-gray-400" />
                                            {upgrade.toComponent.icon && (
                                              <span>{upgrade.toComponent.icon}</span>
                                            )}
                                            <span
                                              className={`text-[14px] font-medium ${
                                                isEnabled ? "text-sakura-700" : "text-gray-900"
                                              }`}
                                            >
                                              {upgrade.label || upgrade.toComponent.name}
                                            </span>
                                            {upgrade.toComponent.tierLabel && (
                                              <span className="px-1.5 py-0.5 bg-sakura-100 text-sakura-600 text-[10px] rounded-full">
                                                {upgrade.toComponent.tierLabel}
                                              </span>
                                            )}
                                            {upgrade.isRecommended && (
                                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full">
                                                推荐
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span
                                          className={`text-[14px] font-semibold ${
                                            isEnabled ? "text-sakura-600" : "text-gray-700"
                                          }`}
                                        >
                                          +¥{(upgrade.priceDiff / 100).toLocaleString()}
                                        </span>
                                      </div>
                                      {upgrade.description && (
                                        <p className="mt-2 ml-7 text-[12px] text-gray-500">
                                          {upgrade.description}
                                        </p>
                                      )}
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
