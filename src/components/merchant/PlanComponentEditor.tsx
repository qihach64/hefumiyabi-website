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
} from "lucide-react";
import EditorHotspot from "@/components/shared/EditorHotspot";

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

  // 放置模式：选中一个组件后，点击图片可以放置
  const [placingComponentId, setPlacingComponentId] = useState<string | null>(null);

  // 拖拽状态
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 图片容器引用
  const imageContainerRef = useRef<HTMLDivElement>(null);

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

  // ==================== 位置计算辅助函数 ====================

  // 根据点击位置计算标签应该在左边还是右边
  const calculateLabelPosition = (x: number): string => {
    return x > 0.5 ? "left" : "right";
  };

  // 将鼠标事件坐标转换为相对位置 (0-1)
  const getRelativePosition = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } | null => {
    if (!imageContainerRef.current) return null;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  }, []);

  // ==================== 放置组件逻辑 ====================

  // 点击图片放置组件
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (!placingComponentId) return;

    const pos = getRelativePosition(e);
    if (!pos) return;

    const labelPosition = calculateLabelPosition(pos.x);

    // 更新或添加配置
    const existingConfig = configs.find(c => c.componentId === placingComponentId);
    if (existingConfig) {
      setConfigs(configs.map(c =>
        c.componentId === placingComponentId
          ? { ...c, hotmapX: pos.x, hotmapY: pos.y, hotmapLabelPosition: labelPosition }
          : c
      ));
    } else {
      setConfigs([...configs, {
        componentId: placingComponentId,
        isIncluded: true,
        enabledUpgrades: [],
        hotmapX: pos.x,
        hotmapY: pos.y,
        hotmapLabelPosition: labelPosition,
      }]);
    }

    // 如果组件未被选中，添加到选中列表
    if (!selectedComponentIds.includes(placingComponentId)) {
      onChange([...selectedComponentIds, placingComponentId]);
    }

    // 退出放置模式
    setPlacingComponentId(null);
  }, [placingComponentId, getRelativePosition, configs, setConfigs, selectedComponentIds, onChange]);

  // ==================== 拖拽逻辑 ====================

  const handleDragStart = useCallback((e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const config = configs.find(c => c.componentId === componentId);
    if (!config?.hotmapX || !config?.hotmapY) return;

    const pos = getRelativePosition(e);
    if (!pos) return;

    setDraggingComponentId(componentId);
    setDragOffset({
      x: pos.x - config.hotmapX,
      y: pos.y - config.hotmapY,
    });
  }, [configs, getRelativePosition]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!draggingComponentId) return;

    const pos = getRelativePosition(e);
    if (!pos) return;

    const newX = Math.max(0.05, Math.min(0.95, pos.x - dragOffset.x));
    const newY = Math.max(0.05, Math.min(0.95, pos.y - dragOffset.y));
    const labelPosition = calculateLabelPosition(newX);

    setConfigs(configs.map(c =>
      c.componentId === draggingComponentId
        ? { ...c, hotmapX: newX, hotmapY: newY, hotmapLabelPosition: labelPosition }
        : c
    ));
  }, [draggingComponentId, dragOffset, getRelativePosition, configs, setConfigs]);

  const handleDragEnd = useCallback(() => {
    setDraggingComponentId(null);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (draggingComponentId) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [draggingComponentId, handleDragMove, handleDragEnd]);

  // ==================== 辅助函数 ====================

  const getAllComponents = (): ServiceComponent[] => {
    return categories.flatMap((cat) => cat.components);
  };

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

  // 从列表选择组件 - 进入放置模式或取消选择
  const handleComponentSelect = useCallback((componentId: string) => {
    const isSelected = selectedComponentIds.includes(componentId);

    // 检查组件是否可以放到热图上
    const component = getAllComponents().find(c => c.id === componentId);
    const canPlaceOnHotmap = component && ['OUTFIT', 'KIMONO', 'STYLING', 'ACCESSORY'].includes(component.type);
    const hasMap = !!mapTemplate;

    if (isSelected) {
      // 取消选择
      onChange(selectedComponentIds.filter(id => id !== componentId));
      setConfigs(configs.filter(c => c.componentId !== componentId));
      if (placingComponentId === componentId) {
        setPlacingComponentId(null);
      }
    } else {
      // 选择组件
      onChange([...selectedComponentIds, componentId]);

      // ADDON 类型不需要热图位置
      if (!canPlaceOnHotmap) {
        setConfigs([...configs, {
          componentId,
          isIncluded: true,
          enabledUpgrades: [],
          hotmapX: null,
          hotmapY: null,
          hotmapLabelPosition: "right",
        }]);
        return;
      }

      // OUTFIT 类型：添加到配置
      setConfigs([...configs, {
        componentId,
        isIncluded: true,
        enabledUpgrades: [],
        hotmapX: null,
        hotmapY: null,
        hotmapLabelPosition: "right",
      }]);

      // 如果有热图模板，自动进入放置模式
      if (hasMap) {
        setPlacingComponentId(componentId);
      }
    }
  }, [selectedComponentIds, onChange, configs, setConfigs, placingComponentId, categories, mapTemplate]);

  // 从图片移除组件 = 取消选中
  const removeFromMap = useCallback((componentId: string) => {
    onChange(selectedComponentIds.filter(id => id !== componentId));
    setConfigs(configs.filter(c => c.componentId !== componentId));
  }, [configs, setConfigs, selectedComponentIds, onChange]);

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

  const getConfig = (componentId: string): ComponentConfig | undefined => {
    return configs.find((c) => c.componentId === componentId);
  };

  // 判断组件类型是否可以放置到热图上（只有 OUTFIT 类型可以）
  // 兼容旧类型：KIMONO, STYLING, ACCESSORY 也视为可放置
  // 如果组件数据还未加载，返回 true（假设可放置）
  const isHotmapEligible = (componentId: string): boolean => {
    const component = getAllComponents().find(c => c.id === componentId);
    // 如果组件数据还没加载完，假设已有坐标的组件是可放置的
    if (!component) return true;
    // OUTFIT 或旧的可视化类型都可以放到热图
    const hotmapTypes = ['OUTFIT', 'KIMONO', 'STYLING', 'ACCESSORY'];
    return hotmapTypes.includes(component.type);
  };

  // 获取已放置到图片上的组件
  // 注意：已有坐标的组件总是显示，即使组件数据还没加载
  const getPlacedComponents = () => {
    return configs.filter(c =>
      c.hotmapX != null &&
      c.hotmapY != null &&
      selectedComponentIds.includes(c.componentId)
    );
  };


  // 统计
  const totalEnabledUpgrades = configs.reduce(
    (sum, c) => sum + c.enabledUpgrades.length,
    0
  );

  const placedComponents = getPlacedComponents();

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
                ? "在左侧勾选服务，在右侧预览热图放置位置"
                : "勾选套餐包含的服务项目"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedComponentIds.length > 0 && (
              <span className="px-3 py-1.5 bg-sakura-100 text-sakura-700 rounded-full text-sm font-medium">
                已选 {selectedComponentIds.length} 项
              </span>
            )}
            {hasMapTemplate && placedComponents.length > 0 && (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                已放置 {placedComponents.length} 项
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

      {/* 主内容区 - 左右分栏（左侧选择，右侧预览） */}
      <div className={`flex flex-col ${hasMapTemplate ? "lg:flex-row" : ""}`}>
        {/* 左侧：组件选择列表 */}
        <div className={`${hasMapTemplate ? "lg:w-[45%]" : "w-full"} flex-shrink-0 ${hasMapTemplate ? "border-b lg:border-b-0 lg:border-r border-gray-100" : ""}`}>
          <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
            {/* 提示信息 */}
            {hasMapTemplate && (
              <div className="px-3 py-2 bg-sakura-50 rounded-lg text-xs text-gray-700 border border-sakura-100">
                勾选着装项后自动进入放置模式，点击右侧热图确定位置
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
                        const isPlacing = placingComponentId === component.id;
                        const componentUpgrades = upgradePaths[component.id] || [];
                        const hasUpgrades = componentUpgrades.length > 0;
                        const isUpgradeExpanded = expandedUpgrades.has(component.id);
                        const enabledUpgradeCount = config?.enabledUpgrades.length || 0;

                        return (
                          <div key={component.id} className="space-y-2">
                            {/* 组件行 */}
                            <div
                              className={`
                                flex items-center gap-3 p-3 rounded-xl border-2
                                transition-all duration-200
                                ${isPlacing
                                  ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                                  : isSelected
                                    ? "border-sakura-400 bg-sakura-50"
                                    : "border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50"
                                }
                              `}
                            >
                              {/* 选择框 */}
                              <div
                                onClick={() => handleComponentSelect(component.id)}
                                className={`
                                  flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer
                                  ${isSelected
                                    ? "bg-sakura-500 border-sakura-500"
                                    : "border-gray-300 hover:border-sakura-400"
                                  }
                                `}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>

                              {/* 组件信息 */}
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => handleComponentSelect(component.id)}
                              >
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
                                  {/* ADDON 类型标识 */}
                                  {!isHotmapEligible(component.id) && (
                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded">
                                      增值
                                    </span>
                                  )}
                                  {/* 放置中状态提示 */}
                                  {isPlacing && (
                                    <span className="px-1.5 py-0.5 bg-sakura-100 text-sakura-600 text-[10px] rounded animate-pulse">
                                      点击右侧图片
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

        {/* 右侧：热点图预览（3:4 比例，与用户端一致） */}
        {hasMapTemplate && (
          <div className="flex-1 min-w-0 bg-gradient-to-br from-gray-50 to-white">
            <div className="p-4 sticky top-0 max-h-[calc(100vh-120px)] overflow-y-auto">
              {/* 操作提示 */}
              <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${
                placingComponentId
                  ? "bg-sakura-100 border border-sakura-300"
                  : "bg-gray-50"
              }`}>
                <Info className={`w-4 h-4 flex-shrink-0 ${placingComponentId ? "text-sakura-600" : "text-gray-400"}`} />
                <p className={`text-xs ${placingComponentId ? "text-sakura-700 font-medium" : "text-gray-600"}`}>
                  {placingComponentId ? (
                    <>
                      <strong>点击图片</strong>放置「{getAllComponents().find(c => c.id === placingComponentId)?.name}」
                      <button
                        type="button"
                        onClick={() => {
                          // 取消放置 = 取消选中该组件
                          onChange(selectedComponentIds.filter(id => id !== placingComponentId));
                          setConfigs(configs.filter(c => c.componentId !== placingComponentId));
                          setPlacingComponentId(null);
                        }}
                        className="ml-2 text-sakura-500 hover:text-sakura-700 underline"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>预览效果 · 拖拽调整位置 · 点击标记可移除</>
                  )}
                </p>
              </div>

              {/* 图片容器 - 3:4 比例 */}
              <div
                ref={imageContainerRef}
                className={`relative rounded-xl overflow-hidden bg-white shadow-sm border-2 aspect-[3/4] ${
                  placingComponentId
                    ? "border-sakura-400 cursor-crosshair"
                    : draggingComponentId
                      ? "border-sakura-400 cursor-grabbing"
                      : "border-gray-200"
                }`}
                onClick={placingComponentId ? handleImageClick : undefined}
              >
                <Image
                  src={mapTemplate.imageUrl}
                  alt="套餐展示图"
                  fill
                  className="object-cover pointer-events-none select-none"
                  unoptimized
                  draggable={false}
                />

                {/* 放置模式下的十字准星 */}
                {placingComponentId && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-sakura-300/50" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sakura-300/50" />
                  </div>
                )}

                {/* 已放置的组件标记 */}
                {placedComponents.map((config) => {
                  if (config.hotmapX == null || config.hotmapY == null) return null;

                  const component = getAllComponents().find(c => c.id === config.componentId);
                  const isDragging = draggingComponentId === config.componentId;

                  return (
                    <EditorHotspot
                      key={config.componentId}
                      hotspot={{
                        id: config.componentId,
                        x: config.hotmapX,
                        y: config.hotmapY,
                        labelPosition: (config.hotmapLabelPosition as "left" | "right" | "top" | "bottom") || "right",
                        name: component?.name ?? "加载中...",
                        icon: component?.icon ?? "📍",
                        isIncluded: config.isIncluded,
                      }}
                      isEditable
                      isDragging={isDragging}
                      onDragStart={(e) => handleDragStart(e, config.componentId)}
                      onRemove={() => removeFromMap(config.componentId)}
                    />
                  );
                })}
              </div>


              {/* 图例说明 */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>拖拽调整位置</span>
                <span>·</span>
                <span>点击热点可移除</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
