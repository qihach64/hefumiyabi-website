"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  GripVertical,
  Plus,
  Eye,
  EyeOff,
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
  enabledUpgrades: string[]; // 启用的升级选项 ID 列表
  // 热点位置（可选）
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

  // 热点编辑器状态
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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

          // 默认展开所有分类（方便快速选择）
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

  const toggleComponent = useCallback(
    (componentId: string) => {
      const isSelected = selectedComponentIds.includes(componentId);

      if (isSelected) {
        onChange(selectedComponentIds.filter((id) => id !== componentId));
        setConfigs(configs.filter((c) => c.componentId !== componentId));
        if (activeHotspotId === componentId) {
          setActiveHotspotId(null);
        }
      } else {
        onChange([...selectedComponentIds, componentId]);
        // 创建默认配置，使用模板的热点位置（如果有）
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
      }
    },
    [selectedComponentIds, onChange, configs, setConfigs, mapTemplate, activeHotspotId]
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

  // ==================== 热点编辑逻辑 ====================

  const handleHotspotMouseDown = useCallback((e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHotspotId(componentId);
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !activeHotspotId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      setConfigs(
        configs.map((c) =>
          c.componentId === activeHotspotId ? { ...c, hotmapX: x, hotmapY: y } : c
        )
      );
    },
    [isDragging, activeHotspotId, configs, setConfigs]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 点击图片空白处添加热点
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || !containerRef.current || !activeHotspotId) return;

      const config = configs.find(c => c.componentId === activeHotspotId);
      if (config?.hotmapX != null) return; // 已有位置的不处理

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setConfigs(
        configs.map((c) =>
          c.componentId === activeHotspotId ? { ...c, hotmapX: x, hotmapY: y } : c
        )
      );
    },
    [isDragging, activeHotspotId, configs, setConfigs]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ==================== 辅助函数 ====================

  const getConfig = (componentId: string): ComponentConfig | undefined => {
    return configs.find((c) => c.componentId === componentId);
  };

  const getAllComponents = (): ServiceComponent[] => {
    return categories.flatMap((cat) => cat.components);
  };

  const getSelectedComponents = (): ServiceComponent[] => {
    return getAllComponents().filter((c) => selectedComponentIds.includes(c.id));
  };

  // 统计
  const totalEnabledUpgrades = configs.reduce(
    (sum, c) => sum + c.enabledUpgrades.length,
    0
  );
  const configuredHotspots = configs.filter(
    (c) => c.hotmapX !== null && c.hotmapY !== null
  ).length;

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

  const selectedComponents = getSelectedComponents();
  const hasMapTemplate = !!mapTemplate;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">套餐包含内容</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              选择服务项目，{hasMapTemplate ? "点击图片定位展示位置" : "配置升级选项"}
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
        {/* 左侧：展示图预览（如果有模板） */}
        {hasMapTemplate && (
          <div className="lg:w-1/2 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <div className="p-4">
              {/* 图片标题和控制 */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">套餐展示预览</p>
                <button
                  type="button"
                  onClick={() => setShowHotspots(!showHotspots)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showHotspots
                      ? "bg-sakura-100 text-sakura-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  title={showHotspots ? "隐藏标注" : "显示标注"}
                >
                  {showHotspots ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {/* 图片容器 - 限制最大高度 */}
              <div
                ref={containerRef}
                onClick={handleImageClick}
                className={`relative rounded-xl overflow-hidden bg-white shadow-sm border border-gray-200 aspect-[2/3] max-h-[600px] ${
                  isDragging ? "cursor-grabbing" : activeHotspotId ? "cursor-crosshair" : "cursor-default"
                }`}
              >
                <Image
                  src={mapTemplate.imageUrl}
                  alt="套餐展示图"
                  fill
                  className="object-contain pointer-events-none"
                  unoptimized
                />

                {/* 热点标记 */}
                {showHotspots && configs
                  .filter((c) => c.hotmapX != null && c.hotmapY != null && selectedComponentIds.includes(c.componentId))
                  .map((config, index) => {
                    const component = getAllComponents().find(
                      (c) => c.id === config.componentId
                    );
                    if (!component) return null;

                    const isActive = activeHotspotId === config.componentId;
                    return (
                      <div
                        key={config.componentId}
                        className="absolute"
                        style={{
                          left: `${(config.hotmapX ?? 0) * 100}%`,
                          top: `${(config.hotmapY ?? 0) * 100}%`,
                          transform: "translate(-50%, -50%)",
                          zIndex: isActive ? 20 : 10,
                        }}
                      >
                        {/* 热点圆点 */}
                        <div
                          onMouseDown={(e) => handleHotspotMouseDown(e, config.componentId)}
                          className={`
                            group relative cursor-grab transition-all duration-200
                            ${isActive ? "scale-110" : "hover:scale-105"}
                          `}
                        >
                          {/* 外环动画 */}
                          <div className={`
                            absolute inset-0 rounded-full
                            ${isActive ? "animate-ping bg-sakura-400/40" : ""}
                          `} />

                          {/* 主圆点 */}
                          <div
                            className={`
                              relative w-7 h-7 rounded-full flex items-center justify-center
                              text-white text-xs font-bold shadow-lg
                              ${isActive
                                ? "bg-sakura-600 ring-2 ring-sakura-300"
                                : "bg-sakura-500 group-hover:bg-sakura-600"
                              }
                            `}
                          >
                            {index + 1}
                          </div>

                          {/* 悬停标签 */}
                          <div
                            className={`
                              absolute left-full ml-2 top-1/2 -translate-y-1/2
                              whitespace-nowrap bg-gray-900/90 text-white rounded-lg
                              px-2.5 py-1.5 text-xs shadow-xl
                              opacity-0 group-hover:opacity-100 pointer-events-none
                              transition-opacity duration-200
                            `}
                          >
                            <span className="mr-1">{component.icon}</span>
                            {component.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* 提示文字 */}
                {activeHotspotId && !configs.find(c => c.componentId === activeHotspotId)?.hotmapX && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <div className="bg-white rounded-xl px-4 py-3 shadow-xl text-center">
                      <Plus className="w-6 h-6 text-sakura-500 mx-auto mb-1" />
                      <p className="text-sm font-medium text-gray-700">点击设置位置</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 已选组件快捷列表 */}
              {selectedComponents.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">已选服务 · 点击定位</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedComponents.map((component, index) => {
                      const config = getConfig(component.id);
                      const hasPosition = config?.hotmapX != null;
                      const isActive = activeHotspotId === component.id;

                      return (
                        <button
                          key={component.id}
                          type="button"
                          onClick={() => setActiveHotspotId(isActive ? null : component.id)}
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                            transition-all duration-200 border
                            ${isActive
                              ? "bg-sakura-500 text-white border-sakura-500 shadow-md"
                              : hasPosition
                              ? "bg-sakura-50 text-sakura-700 border-sakura-200 hover:bg-sakura-100"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            }
                          `}
                        >
                          {hasPosition && (
                            <span className={`
                              w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold
                              ${isActive ? "bg-white/20" : "bg-sakura-200 text-sakura-700"}
                            `}>
                              {configs.filter(c => c.hotmapX != null && selectedComponentIds.includes(c.componentId))
                                .findIndex(c => c.componentId === component.id) + 1}
                            </span>
                          )}
                          <span>{component.icon}</span>
                          <span className="font-medium">{component.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 右侧：组件选择列表 */}
        <div className="flex-1 min-w-0">
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
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
                        const hasPosition = config?.hotmapX != null;
                        const isActive = activeHotspotId === component.id;
                        const componentUpgrades = upgradePaths[component.id] || [];
                        const hasUpgrades = componentUpgrades.length > 0;
                        const isUpgradeExpanded = expandedUpgrades.has(component.id);
                        const enabledUpgradeCount = config?.enabledUpgrades.length || 0;

                        return (
                          <div key={component.id} className="space-y-2">
                            {/* 组件行 */}
                            <div
                              className={`
                                flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200
                                ${isSelected
                                  ? isActive
                                    ? "border-sakura-500 bg-sakura-50 shadow-sm"
                                    : "border-sakura-300 bg-sakura-50/50"
                                  : "border-gray-100 hover:border-gray-200 bg-white"
                                }
                              `}
                            >
                              {/* 选择框 */}
                              <button
                                type="button"
                                onClick={() => toggleComponent(component.id)}
                                className={`
                                  flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                                  ${isSelected
                                    ? "bg-sakura-500 border-sakura-500"
                                    : "border-gray-300 hover:border-sakura-400"
                                  }
                                `}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </button>

                              {/* 拖拽手柄（选中时显示） */}
                              {isSelected && hasMapTemplate && (
                                <button
                                  type="button"
                                  onClick={() => setActiveHotspotId(isActive ? null : component.id)}
                                  className={`
                                    flex-shrink-0 p-1 rounded transition-colors
                                    ${isActive
                                      ? "bg-sakura-200 text-sakura-700"
                                      : hasPosition
                                      ? "bg-sakura-100 text-sakura-600 hover:bg-sakura-200"
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                    }
                                  `}
                                  title={hasPosition ? "调整位置" : "设置位置"}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </button>
                              )}

                              {/* 组件信息 */}
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => toggleComponent(component.id)}
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
                                  {isSelected && hasPosition && (
                                    <span className="w-4 h-4 rounded-full bg-sakura-500 text-white text-[10px] flex items-center justify-center font-bold">
                                      {configs.filter(c => c.hotmapX != null && selectedComponentIds.includes(c.componentId))
                                        .findIndex(c => c.componentId === component.id) + 1}
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
                                  onClick={() => toggleUpgradePanel(component.id)}
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
