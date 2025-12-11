"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Info,
  X,
  Plus,
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

// 热点槽位（模板定义的位置）
interface HotspotSlot {
  slotIndex: number;  // 槽位索引
  x: number;
  y: number;
  labelPosition: string;
  defaultComponentId?: string;  // 模板预设的默认组件
  assignedComponentId?: string | null;  // 当前分配的组件
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

  // 槽位分配状态
  const [slotAssignments, setSlotAssignments] = useState<Map<number, string | null>>(new Map());

  // 当前选中要分配的槽位（点击空槽位时打开选择器）
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

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

  // 初始化槽位分配（基于模板预设 + 已选组件）
  useEffect(() => {
    if (!mapTemplate) return;

    const initialAssignments = new Map<number, string | null>();

    mapTemplate.hotspots.forEach((hotspot, index) => {
      // 检查该位置的默认组件是否被选中
      if (selectedComponentIds.includes(hotspot.componentId)) {
        initialAssignments.set(index, hotspot.componentId);
      } else {
        // 检查是否有其他已选组件在 config 中有这个位置
        const configAtPosition = configs.find(
          c => c.hotmapX === hotspot.x && c.hotmapY === hotspot.y && selectedComponentIds.includes(c.componentId)
        );
        if (configAtPosition) {
          initialAssignments.set(index, configAtPosition.componentId);
        } else {
          initialAssignments.set(index, null);
        }
      }
    });

    setSlotAssignments(initialAssignments);
  }, [mapTemplate, selectedComponentIds, configs]);

  // ==================== 槽位操作逻辑 ====================

  // 获取槽位信息
  const getSlots = useCallback((): HotspotSlot[] => {
    if (!mapTemplate) return [];
    return mapTemplate.hotspots.map((hotspot, index) => ({
      slotIndex: index,
      x: hotspot.x,
      y: hotspot.y,
      labelPosition: hotspot.labelPosition,
      defaultComponentId: hotspot.componentId,
      assignedComponentId: slotAssignments.get(index) ?? null,
    }));
  }, [mapTemplate, slotAssignments]);

  // 将组件分配到槽位
  const assignComponentToSlot = useCallback((slotIndex: number, componentId: string) => {
    const slot = mapTemplate?.hotspots[slotIndex];
    if (!slot) return;

    // 更新槽位分配
    setSlotAssignments(prev => {
      const next = new Map(prev);
      // 先移除该组件在其他槽位的分配
      next.forEach((assignedId, idx) => {
        if (assignedId === componentId) {
          next.set(idx, null);
        }
      });
      // 分配到新槽位
      next.set(slotIndex, componentId);
      return next;
    });

    // 如果组件未被选中，添加到选中列表
    if (!selectedComponentIds.includes(componentId)) {
      onChange([...selectedComponentIds, componentId]);
    }

    // 更新组件配置的热点位置
    const existingConfig = configs.find((c: ComponentConfig) => c.componentId === componentId);
    if (existingConfig) {
      setConfigs(configs.map((c: ComponentConfig) =>
        c.componentId === componentId
          ? { ...c, hotmapX: slot.x, hotmapY: slot.y, hotmapLabelPosition: slot.labelPosition }
          : c
      ));
    } else {
      setConfigs([...configs, {
        componentId,
        isIncluded: true,
        enabledUpgrades: [],
        hotmapX: slot.x,
        hotmapY: slot.y,
        hotmapLabelPosition: slot.labelPosition,
      }]);
    }

    // 关闭选择器
    setActiveSlotIndex(null);
  }, [mapTemplate, selectedComponentIds, onChange, setConfigs, configs]);

  // 从槽位移除组件
  const removeFromSlot = useCallback((slotIndex: number) => {
    const assignedComponentId = slotAssignments.get(slotIndex);
    if (!assignedComponentId) return;

    // 更新槽位分配
    setSlotAssignments(prev => {
      const next = new Map(prev);
      next.set(slotIndex, null);
      return next;
    });

    // 从选中列表移除
    onChange(selectedComponentIds.filter(id => id !== assignedComponentId));

    // 从配置中移除
    setConfigs(configs.filter(c => c.componentId !== assignedComponentId));
  }, [slotAssignments, selectedComponentIds, onChange, configs, setConfigs]);

  // ==================== 组件选择逻辑（右侧列表）====================

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

  // 从右侧列表选择/取消组件
  const toggleComponentFromList = useCallback(
    (componentId: string) => {
      const isSelected = selectedComponentIds.includes(componentId);

      if (isSelected) {
        // 取消选择 - 同时从槽位中移除
        onChange(selectedComponentIds.filter((id) => id !== componentId));
        setConfigs(configs.filter((c) => c.componentId !== componentId));

        // 从槽位分配中移除
        setSlotAssignments(prev => {
          const next = new Map(prev);
          next.forEach((assignedId, idx) => {
            if (assignedId === componentId) {
              next.set(idx, null);
            }
          });
          return next;
        });
      } else {
        // 选择组件 - 尝试自动分配到默认槽位或第一个空槽位
        onChange([...selectedComponentIds, componentId]);

        // 查找该组件的默认槽位
        const defaultSlotIndex = mapTemplate?.hotspots.findIndex(h => h.componentId === componentId);
        let targetSlot = mapTemplate?.hotspots[defaultSlotIndex ?? -1];
        let targetSlotIndex = defaultSlotIndex ?? -1;

        // 如果默认槽位已被占用或不存在，找第一个空槽位
        if (defaultSlotIndex !== undefined && defaultSlotIndex >= 0) {
          const isOccupied = slotAssignments.get(defaultSlotIndex) !== null && slotAssignments.get(defaultSlotIndex) !== undefined;
          if (isOccupied) {
            // 查找空槽位
            const emptySlotIndex = Array.from(slotAssignments.entries()).find(([, assigned]) => !assigned)?.[0];
            if (emptySlotIndex !== undefined) {
              targetSlot = mapTemplate?.hotspots[emptySlotIndex];
              targetSlotIndex = emptySlotIndex;
            } else {
              targetSlot = undefined;
              targetSlotIndex = -1;
            }
          }
        } else {
          // 没有默认槽位，找第一个空槽位
          const emptySlotIndex = Array.from(slotAssignments.entries()).find(([, assigned]) => !assigned)?.[0];
          if (emptySlotIndex !== undefined) {
            targetSlot = mapTemplate?.hotspots[emptySlotIndex];
            targetSlotIndex = emptySlotIndex;
          }
        }

        // 添加配置
        setConfigs([
          ...configs,
          {
            componentId,
            isIncluded: true,
            enabledUpgrades: [],
            hotmapX: targetSlot?.x ?? null,
            hotmapY: targetSlot?.y ?? null,
            hotmapLabelPosition: targetSlot?.labelPosition ?? "right",
          },
        ]);

        // 更新槽位分配
        if (targetSlotIndex >= 0) {
          setSlotAssignments(prev => {
            const next = new Map(prev);
            next.set(targetSlotIndex, componentId);
            return next;
          });
        }
      }
    },
    [selectedComponentIds, onChange, configs, setConfigs, mapTemplate, slotAssignments]
  );

  const selectAllInCategory = (components: ServiceComponent[]) => {
    const categoryIds = components.map((c) => c.id);
    const allSelected = categoryIds.every((id) => selectedComponentIds.includes(id));

    if (allSelected) {
      onChange(selectedComponentIds.filter((id) => !categoryIds.includes(id)));
      setConfigs(configs.filter((c) => !categoryIds.includes(c.componentId)));
      // 从槽位中移除
      setSlotAssignments(prev => {
        const next = new Map(prev);
        next.forEach((assignedId, idx) => {
          if (assignedId && categoryIds.includes(assignedId)) {
            next.set(idx, null);
          }
        });
        return next;
      });
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

  // 获取组件在哪个槽位
  const getSlotIndexForComponent = (componentId: string): number | null => {
    for (const [slotIndex, assignedId] of slotAssignments.entries()) {
      if (assignedId === componentId) return slotIndex;
    }
    return null;
  };

  // 统计
  const totalEnabledUpgrades = configs.reduce(
    (sum, c) => sum + c.enabledUpgrades.length,
    0
  );

  const slots = getSlots();
  const occupiedSlotCount = slots.filter(s => s.assignedComponentId).length;

  // 获取没有分配到槽位的已选组件
  const unassignedComponents = selectedComponentIds.filter(
    id => getSlotIndexForComponent(id) === null
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
                ? "点击图片上的空位放置服务，或在右侧列表中勾选"
                : "勾选套餐包含的服务项目"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedComponentIds.length > 0 && (
              <span className="px-3 py-1.5 bg-sakura-100 text-sakura-700 rounded-full text-sm font-medium">
                已选 {selectedComponentIds.length} 项
              </span>
            )}
            {hasMapTemplate && (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                展示图 {occupiedSlotCount}/{slots.length}
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
        {/* 左侧：可交互的槽位图 */}
        {hasMapTemplate && (
          <div className="lg:w-1/2 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <div className="p-4">
              {/* 操作提示 */}
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  点击<strong>空位 (+)</strong> 放置服务 · 点击<strong>已放置的服务</strong>可移除
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

                {/* 所有槽位 */}
                {slots.map((slot) => {
                  const assignedComponent = slot.assignedComponentId
                    ? getAllComponents().find(c => c.id === slot.assignedComponentId)
                    : null;
                  const defaultComponent = slot.defaultComponentId
                    ? getAllComponents().find(c => c.id === slot.defaultComponentId)
                    : null;
                  const isEmpty = !slot.assignedComponentId;
                  const isActive = activeSlotIndex === slot.slotIndex;

                  return (
                    <div key={slot.slotIndex}>
                      {/* 槽位按钮 */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isEmpty) {
                            setActiveSlotIndex(isActive ? null : slot.slotIndex);
                          } else {
                            removeFromSlot(slot.slotIndex);
                          }
                        }}
                        className="absolute group"
                        style={{
                          left: `${slot.x * 100}%`,
                          top: `${slot.y * 100}%`,
                          transform: "translate(-50%, -50%)",
                          zIndex: isActive ? 30 : isEmpty ? 10 : 20,
                        }}
                      >
                        {/* 主圆点 */}
                        <div
                          className={`
                            relative w-9 h-9 rounded-full flex items-center justify-center
                            text-sm font-bold shadow-lg cursor-pointer
                            transition-all duration-300 ease-out
                            ${isEmpty
                              ? isActive
                                ? "bg-blue-500 text-white scale-110 ring-4 ring-blue-200"
                                : "bg-white text-gray-400 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-500 hover:scale-105"
                              : "bg-sakura-500 text-white scale-105 ring-2 ring-sakura-200 hover:bg-red-500 hover:ring-red-200"
                            }
                          `}
                        >
                          {isEmpty ? (
                            <Plus className="w-4 h-4" />
                          ) : (
                            <span className="group-hover:hidden">{assignedComponent?.icon || <Check className="w-4 h-4" />}</span>
                          )}
                          {!isEmpty && (
                            <X className="w-4 h-4 hidden group-hover:block" />
                          )}
                        </div>

                        {/* 标签 */}
                        <div
                          className={`
                            absolute whitespace-nowrap rounded-lg
                            px-2.5 py-1.5 text-xs shadow-lg
                            transition-all duration-200
                            pointer-events-none
                            ${slot.labelPosition === "left"
                              ? "right-full mr-2"
                              : "left-full ml-2"
                            }
                            top-1/2 -translate-y-1/2
                            ${isEmpty
                              ? isActive
                                ? "bg-blue-500 text-white"
                                : "bg-white/95 text-gray-500 border border-dashed border-gray-300"
                              : "bg-sakura-500 text-white group-hover:bg-red-500"
                            }
                          `}
                        >
                          {isEmpty ? (
                            isActive ? "选择服务..." : (defaultComponent ? `推荐: ${defaultComponent.name}` : `空位 ${slot.slotIndex + 1}`)
                          ) : (
                            <>
                              <span className="group-hover:hidden">
                                {assignedComponent?.icon && <span className="mr-1">{assignedComponent.icon}</span>}
                                {assignedComponent?.name}
                              </span>
                              <span className="hidden group-hover:inline">点击移除</span>
                            </>
                          )}
                        </div>
                      </button>

                      {/* 组件选择弹窗 */}
                      {isActive && (
                        <div
                          className="absolute z-40 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                          style={{
                            left: slot.labelPosition === "left"
                              ? `calc(${slot.x * 100}% - 280px)`
                              : `calc(${slot.x * 100}% + 30px)`,
                            top: `${Math.min(slot.y * 100, 60)}%`,
                          }}
                        >
                          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">选择要放置的服务</span>
                            <button
                              type="button"
                              onClick={() => setActiveSlotIndex(null)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                            {/* 推荐的默认组件优先显示 */}
                            {defaultComponent && !selectedComponentIds.includes(defaultComponent.id) && (
                              <button
                                type="button"
                                onClick={() => assignComponentToSlot(slot.slotIndex, defaultComponent.id)}
                                className="w-full p-2 rounded-lg text-left hover:bg-blue-50 border-2 border-blue-200 bg-blue-50/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span>{defaultComponent.icon}</span>
                                  <span className="font-medium text-sm text-gray-900">{defaultComponent.name}</span>
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded">推荐</span>
                                </div>
                              </button>
                            )}

                            {/* 所有可选组件 */}
                            {getAllComponents()
                              .filter(c => {
                                // 排除已经分配到其他槽位的组件
                                const assignedSlot = getSlotIndexForComponent(c.id);
                                return assignedSlot === null || assignedSlot === slot.slotIndex;
                              })
                              .filter(c => c.id !== defaultComponent?.id || selectedComponentIds.includes(c.id))
                              .map(component => (
                                <button
                                  key={component.id}
                                  type="button"
                                  onClick={() => assignComponentToSlot(slot.slotIndex, component.id)}
                                  className="w-full p-2 rounded-lg text-left hover:bg-gray-50 border border-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{component.icon}</span>
                                    <span className="font-medium text-sm text-gray-900">{component.name}</span>
                                    {component.tierLabel && (
                                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                                        {component.tierLabel}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 未分配到槽位的组件提示 */}
              {unassignedComponents.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium mb-2">
                    以下服务已选择，但未放置到展示图中（点击空位可放置）：
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {unassignedComponents.map((id) => {
                      const component = getAllComponents().find((c) => c.id === id);
                      if (!component) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-gray-700 border border-amber-200"
                        >
                          <span>{component.icon}</span>
                          {component.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 图例说明 */}
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-sakura-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>已放置（套餐包含）</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Plus className="w-3 h-3 text-gray-400" />
                  </div>
                  <span>空位（点击添加）</span>
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
                在此列表中勾选的服务会自动放置到展示图的空位上
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
                        const slotIndex = getSlotIndexForComponent(component.id);
                        const isOnMap = slotIndex !== null;
                        const componentUpgrades = upgradePaths[component.id] || [];
                        const hasUpgrades = componentUpgrades.length > 0;
                        const isUpgradeExpanded = expandedUpgrades.has(component.id);
                        const enabledUpgradeCount = config?.enabledUpgrades.length || 0;

                        return (
                          <div key={component.id} className="space-y-2">
                            {/* 组件行 */}
                            <div
                              onClick={() => toggleComponentFromList(component.id)}
                              className={`
                                flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                                transition-all duration-200
                                ${isSelected
                                  ? "border-sakura-400 bg-sakura-50"
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
                                  {/* 显示是否在展示图上 */}
                                  {isSelected && isOnMap && (
                                    <span className="px-1.5 py-0.5 bg-sakura-100 text-sakura-600 text-[10px] rounded">
                                      展示图 #{slotIndex! + 1}
                                    </span>
                                  )}
                                  {isSelected && !isOnMap && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] rounded">
                                      未放置
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
