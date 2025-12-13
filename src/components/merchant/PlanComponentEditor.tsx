"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Package,
  Settings,
  X,
  GripVertical,
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

// ==================== 类型分类配置 ====================

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  OUTFIT: { label: "着装项目", icon: "👘", color: "sakura" },
  KIMONO: { label: "和服本体", icon: "👘", color: "sakura" },
  STYLING: { label: "造型服务", icon: "💇", color: "purple" },
  ACCESSORY: { label: "配饰", icon: "🎀", color: "blue" },
  ADDON: { label: "增值服务", icon: "✨", color: "amber" },
  EXPERIENCE: { label: "增值体验", icon: "📸", color: "amber" },
  OTHER: { label: "其他", icon: "📦", color: "gray" },
};

// 可放置到热图的类型
const HOTMAP_ELIGIBLE_TYPES = ["OUTFIT", "KIMONO", "STYLING", "ACCESSORY"];

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
  // 数据状态
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [upgradePaths, setUpgradePaths] = useState<Record<string, UpgradeOption[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // UI 状态
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(1);

  // 编辑状态
  const [placingComponentId, setPlacingComponentId] = useState<string | null>(null);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 内部配置状态
  const [internalConfigs, setInternalConfigs] = useState<ComponentConfig[]>([]);
  const configs = componentConfigs || internalConfigs;
  const setConfigs = onConfigChange || setInternalConfigs;

  // ==================== 数据加载 ====================

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

  // ==================== 计算属性 ====================

  const getAllComponents = useCallback((): ServiceComponent[] => {
    return categories.flatMap((cat) => cat.components);
  }, [categories]);

  // 过滤后的分类（搜索）
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        components: cat.components.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.nameJa?.toLowerCase().includes(query) ||
            c.code.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.components.length > 0);
  }, [categories, searchQuery]);

  // 已放置的组件
  const placedComponents = useMemo(() => {
    return configs.filter(
      (c) =>
        c.hotmapX != null &&
        c.hotmapY != null &&
        selectedComponentIds.includes(c.componentId)
    );
  }, [configs, selectedComponentIds]);

  // 统计
  const stats = useMemo(() => {
    const totalSelected = selectedComponentIds.length;
    const totalPlaced = placedComponents.length;
    const totalUpgrades = configs.reduce((sum, c) => sum + c.enabledUpgrades.length, 0);
    return { totalSelected, totalPlaced, totalUpgrades };
  }, [selectedComponentIds, placedComponents, configs]);

  // 当前选中的组件详情
  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) return null;
    return getAllComponents().find((c) => c.id === selectedComponentId) || null;
  }, [selectedComponentId, getAllComponents]);

  const selectedConfig = useMemo(() => {
    if (!selectedComponentId) return null;
    return configs.find((c) => c.componentId === selectedComponentId) || null;
  }, [selectedComponentId, configs]);

  // ==================== 辅助函数 ====================

  const isHotmapEligible = useCallback(
    (componentId: string): boolean => {
      const component = getAllComponents().find((c) => c.id === componentId);
      if (!component) return true;
      return HOTMAP_ELIGIBLE_TYPES.includes(component.type);
    },
    [getAllComponents]
  );

  const calculateLabelPosition = (x: number): string => {
    return x > 0.5 ? "left" : "right";
  };

  const getRelativePosition = useCallback(
    (e: React.MouseEvent | MouseEvent): { x: number; y: number } | null => {
      if (!imageContainerRef.current) return null;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      return { x, y };
    },
    []
  );

  const getConfig = useCallback(
    (componentId: string): ComponentConfig | undefined => {
      return configs.find((c) => c.componentId === componentId);
    },
    [configs]
  );

  // ==================== 组件选择逻辑 ====================

  const toggleCategory = useCallback((type: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }, []);

  const handleComponentClick = useCallback(
    (componentId: string) => {
      const isSelected = selectedComponentIds.includes(componentId);
      const component = getAllComponents().find((c) => c.id === componentId);
      const canPlaceOnHotmap = component && HOTMAP_ELIGIBLE_TYPES.includes(component.type);
      const hasMap = !!mapTemplate;

      if (isSelected) {
        // 取消选择
        onChange(selectedComponentIds.filter((id) => id !== componentId));
        setConfigs(configs.filter((c) => c.componentId !== componentId));
        if (placingComponentId === componentId) {
          setPlacingComponentId(null);
        }
        if (selectedComponentId === componentId) {
          setSelectedComponentId(null);
        }
      } else {
        // 选择组件
        onChange([...selectedComponentIds, componentId]);

        const newConfig: ComponentConfig = {
          componentId,
          isIncluded: true,
          enabledUpgrades: [],
          hotmapX: null,
          hotmapY: null,
          hotmapLabelPosition: "right",
        };
        setConfigs([...configs, newConfig]);

        // 如果有热图且组件可放置，进入放置模式
        if (hasMap && canPlaceOnHotmap) {
          setPlacingComponentId(componentId);
        }
      }

      // 选中以显示属性面板
      setSelectedComponentId(componentId);
    },
    [
      selectedComponentIds,
      onChange,
      configs,
      setConfigs,
      placingComponentId,
      selectedComponentId,
      getAllComponents,
      mapTemplate,
    ]
  );

  // 从画布选中组件
  const handleCanvasComponentClick = useCallback((componentId: string) => {
    setSelectedComponentId(componentId);
  }, []);

  // ==================== 放置逻辑 ====================

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!placingComponentId) return;

      const pos = getRelativePosition(e);
      if (!pos) return;

      const labelPosition = calculateLabelPosition(pos.x);

      setConfigs(
        configs.map((c) =>
          c.componentId === placingComponentId
            ? { ...c, hotmapX: pos.x, hotmapY: pos.y, hotmapLabelPosition: labelPosition }
            : c
        )
      );

      if (!selectedComponentIds.includes(placingComponentId)) {
        onChange([...selectedComponentIds, placingComponentId]);
      }

      setPlacingComponentId(null);
    },
    [placingComponentId, getRelativePosition, configs, setConfigs, selectedComponentIds, onChange]
  );

  // ==================== 拖拽逻辑 ====================

  const handleDragStart = useCallback(
    (e: React.MouseEvent, componentId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const config = configs.find((c) => c.componentId === componentId);
      if (!config?.hotmapX || !config?.hotmapY) return;

      const pos = getRelativePosition(e);
      if (!pos) return;

      setDraggingComponentId(componentId);
      setDragOffset({
        x: pos.x - config.hotmapX,
        y: pos.y - config.hotmapY,
      });
    },
    [configs, getRelativePosition]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingComponentId) return;

      const pos = getRelativePosition(e);
      if (!pos) return;

      const newX = Math.max(0.05, Math.min(0.95, pos.x - dragOffset.x));
      const newY = Math.max(0.05, Math.min(0.95, pos.y - dragOffset.y));
      const labelPosition = calculateLabelPosition(newX);

      setConfigs(
        configs.map((c) =>
          c.componentId === draggingComponentId
            ? { ...c, hotmapX: newX, hotmapY: newY, hotmapLabelPosition: labelPosition }
            : c
        )
      );
    },
    [draggingComponentId, dragOffset, getRelativePosition, configs, setConfigs]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingComponentId(null);
  }, []);

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

  // ==================== 升级选项 ====================

  const toggleUpgrade = useCallback(
    (componentId: string, upgradeId: string) => {
      setConfigs(
        configs.map((config) => {
          if (config.componentId !== componentId) return config;
          const enabledUpgrades = config.enabledUpgrades.includes(upgradeId)
            ? config.enabledUpgrades.filter((id) => id !== upgradeId)
            : [...config.enabledUpgrades, upgradeId];
          return { ...config, enabledUpgrades };
        })
      );
    },
    [configs, setConfigs]
  );

  // 移除组件
  const removeComponent = useCallback(
    (componentId: string) => {
      onChange(selectedComponentIds.filter((id) => id !== componentId));
      setConfigs(configs.filter((c) => c.componentId !== componentId));
      if (selectedComponentId === componentId) {
        setSelectedComponentId(null);
      }
    },
    [selectedComponentIds, onChange, configs, setConfigs, selectedComponentId]
  );

  // ==================== 缩放控制 ====================

  const handleZoomIn = () => setCanvasZoom((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setCanvasZoom((z) => Math.max(z - 0.25, 0.5));
  const handleZoomReset = () => setCanvasZoom(1);

  // ==================== 渲染 ====================

  if (isLoading) {
    return (
      <div className={`bg-[#1a1a1a] rounded-2xl h-[700px] flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-2 border-sakura-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>加载组件库...</p>
        </div>
      </div>
    );
  }

  const hasMapTemplate = !!mapTemplate;

  return (
    <div className={`bg-[#1a1a1a] rounded-2xl overflow-hidden ${className}`}>
      {/* 工具栏 */}
      <div className="h-12 px-4 bg-[#252525] border-b border-[#333] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">套餐组件编辑器</span>
          </div>
          <div className="h-4 w-px bg-[#444]" />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-sakura-500/20 text-sakura-400 rounded">
              {stats.totalSelected} 已选
            </span>
            {hasMapTemplate && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                {stats.totalPlaced} 已放置
              </span>
            )}
            {stats.totalUpgrades > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                {stats.totalUpgrades} 升级
              </span>
            )}
          </div>
        </div>

        {/* 缩放控制 */}
        {hasMapTemplate && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs text-gray-500 min-w-[48px] text-center">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
              title="重置"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 三栏式主体 */}
      <div className="flex h-[650px]">
        {/* ==================== 左侧：组件库 ==================== */}
        <div className="w-64 flex-shrink-0 border-r border-[#333] bg-[#1f1f1f] flex flex-col">
          {/* 搜索框 */}
          <div className="p-3 border-b border-[#333]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索组件..."
                className="w-full pl-9 pr-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sakura-500/50"
              />
            </div>
          </div>

          {/* 组件列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? "未找到匹配的组件" : "暂无可用组件"}
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isExpanded = expandedCategories.has(category.type);
                const selectedCount = category.components.filter((c) =>
                  selectedComponentIds.includes(c.id)
                ).length;
                const typeConfig = TYPE_CONFIG[category.type] || TYPE_CONFIG.OTHER;

                return (
                  <div key={category.type} className="border-b border-[#2a2a2a]">
                    {/* 分类标题 */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.type)}
                      className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-[#252525] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm">{typeConfig.icon}</span>
                        <span className="text-sm font-medium text-gray-300">{category.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-sakura-500/20 text-sakura-400 rounded">
                            {selectedCount}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-600">
                          {category.components.length}
                        </span>
                      </div>
                    </button>

                    {/* 组件列表 */}
                    {isExpanded && (
                      <div className="pb-2">
                        {category.components.map((component) => {
                          const isSelected = selectedComponentIds.includes(component.id);
                          const isPlacing = placingComponentId === component.id;
                          const isActive = selectedComponentId === component.id;
                          const canPlace = HOTMAP_ELIGIBLE_TYPES.includes(component.type);

                          return (
                            <div
                              key={component.id}
                              onClick={() => handleComponentClick(component.id)}
                              className={`
                                mx-2 mb-1 px-3 py-2 rounded-lg cursor-pointer transition-all
                                ${isActive
                                  ? "bg-sakura-500/20 border border-sakura-500/50"
                                  : isSelected
                                    ? "bg-[#2a2a2a] border border-[#3a3a3a]"
                                    : "hover:bg-[#252525] border border-transparent"
                                }
                                ${isPlacing ? "ring-2 ring-sakura-400 animate-pulse" : ""}
                              `}
                            >
                              <div className="flex items-center gap-2">
                                {/* 选中状态 */}
                                <div
                                  className={`
                                    w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                                    ${isSelected
                                      ? "bg-sakura-500 border-sakura-500"
                                      : "border-gray-600"
                                    }
                                  `}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>

                                {/* 图标 */}
                                <span className="text-base flex-shrink-0">
                                  {component.icon || "📦"}
                                </span>

                                {/* 名称 */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`text-sm truncate ${isSelected ? "text-white" : "text-gray-300"}`}
                                    >
                                      {component.name}
                                    </span>
                                    {!canPlace && (
                                      <span className="text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                        增值
                                      </span>
                                    )}
                                  </div>
                                  {component.tierLabel && (
                                    <span className="text-[10px] text-gray-500">
                                      {component.tierLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================== 中间：画布区 ==================== */}
        <div
          ref={canvasContainerRef}
          className="flex-1 min-w-0 bg-[#151515] flex items-center justify-center p-6 overflow-auto"
        >
          {hasMapTemplate ? (
            <div className="relative">
              {/* 放置提示 */}
              {placingComponentId && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-sakura-500 text-white text-sm rounded-lg shadow-lg z-20 whitespace-nowrap">
                  点击画布放置「{getAllComponents().find((c) => c.id === placingComponentId)?.name}」
                  <button
                    type="button"
                    onClick={() => {
                      setPlacingComponentId(null);
                      removeComponent(placingComponentId);
                    }}
                    className="ml-2 underline opacity-80 hover:opacity-100"
                  >
                    取消
                  </button>
                </div>
              )}

              {/* 画布容器 */}
              <div
                ref={imageContainerRef}
                onClick={placingComponentId ? handleCanvasClick : undefined}
                className={`
                  relative rounded-xl overflow-hidden shadow-2xl
                  transition-all duration-300
                  ${placingComponentId ? "cursor-crosshair ring-2 ring-sakura-400" : ""}
                  ${draggingComponentId ? "cursor-grabbing" : ""}
                `}
                style={{
                  width: `${300 * canvasZoom}px`,
                  height: `${400 * canvasZoom}px`,
                }}
              >
                {/* 背景图片 */}
                <Image
                  src={mapTemplate.imageUrl}
                  alt="套餐展示图"
                  fill
                  className="object-cover pointer-events-none select-none"
                  unoptimized
                  draggable={false}
                />

                {/* 放置模式网格辅助线 */}
                {placingComponentId && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-sakura-500/5" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-sakura-400/30" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sakura-400/30" />
                  </div>
                )}

                {/* 热点 */}
                {placedComponents.map((config) => {
                  if (config.hotmapX == null || config.hotmapY == null) return null;

                  const component = getAllComponents().find((c) => c.id === config.componentId);
                  const isDragging = draggingComponentId === config.componentId;
                  const isActive = selectedComponentId === config.componentId;

                  return (
                    <EditorHotspot
                      key={config.componentId}
                      hotspot={{
                        id: config.componentId,
                        x: config.hotmapX,
                        y: config.hotmapY,
                        labelPosition:
                          (config.hotmapLabelPosition as "left" | "right" | "top" | "bottom") ||
                          "right",
                        name: component?.name ?? "加载中...",
                        icon: component?.icon ?? "📍",
                        isIncluded: config.isIncluded,
                      }}
                      isEditable
                      isDragging={isDragging}
                      isSelected={isActive}
                      onClick={() => handleCanvasComponentClick(config.componentId)}
                      onDragStart={(e) => handleDragStart(e, config.componentId)}
                      onRemove={() => removeComponent(config.componentId)}
                    />
                  );
                })}
              </div>

              {/* 画布底部提示 */}
              <div className="mt-4 text-center text-xs text-gray-600">
                拖拽调整位置 · 点击选中查看详情 · 点击 × 移除
              </div>
            </div>
          ) : (
            /* 无热图模板时的空状态 */
            <div className="text-center text-gray-500">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#252525] flex items-center justify-center">
                <Package className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-sm mb-2">未配置热图模板</p>
              <p className="text-xs text-gray-600">在左侧选择组件即可添加到套餐</p>
            </div>
          )}
        </div>

        {/* ==================== 右侧：属性面板 ==================== */}
        <div className="w-72 flex-shrink-0 border-l border-[#333] bg-[#1f1f1f] flex flex-col">
          {selectedComponent ? (
            /* 选中组件时显示组件详情 */
            <>
              {/* 头部 */}
              <div className="p-4 border-b border-[#333]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center text-xl">
                      {selectedComponent.icon || "📦"}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {selectedComponent.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {TYPE_CONFIG[selectedComponent.type]?.label || "组件"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedComponentId(null)}
                    className="p-1 text-gray-500 hover:text-white hover:bg-[#333] rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* 状态 */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    状态
                  </h4>
                  <div className="space-y-2">
                    {selectedComponentIds.includes(selectedComponent.id) ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <Check className="w-4 h-4" />
                        已添加到套餐
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Info className="w-4 h-4" />
                        未添加到套餐
                      </div>
                    )}
                    {selectedConfig?.hotmapX != null && (
                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <Layers className="w-3 h-3" />
                        已放置到热图 ({Math.round((selectedConfig.hotmapX || 0) * 100)}%, {Math.round((selectedConfig.hotmapY || 0) * 100)}%)
                      </div>
                    )}
                  </div>
                </div>

                {/* 描述 */}
                {selectedComponent.description && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      描述
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {selectedComponent.description}
                    </p>
                  </div>
                )}

                {/* 亮点 */}
                {selectedComponent.highlights && selectedComponent.highlights.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      特点
                    </h4>
                    <div className="space-y-1.5">
                      {selectedComponent.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <ChevronRight className="w-3 h-3 text-sakura-400 mt-0.5 flex-shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 升级选项 */}
                {selectedComponentIds.includes(selectedComponent.id) &&
                  upgradePaths[selectedComponent.id]?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        可选升级
                      </h4>
                      <div className="space-y-2">
                        {upgradePaths[selectedComponent.id].map((upgrade) => {
                          const isEnabled = selectedConfig?.enabledUpgrades.includes(upgrade.id);
                          return (
                            <button
                              key={upgrade.id}
                              type="button"
                              onClick={() => toggleUpgrade(selectedComponent.id, upgrade.id)}
                              className={`
                                w-full p-3 rounded-lg border text-left transition-all
                                ${isEnabled
                                  ? "border-amber-500/50 bg-amber-500/10"
                                  : "border-[#3a3a3a] bg-[#2a2a2a] hover:border-[#4a4a4a]"
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`
                                      w-4 h-4 rounded border-2 flex items-center justify-center
                                      ${isEnabled ? "bg-amber-500 border-amber-500" : "border-gray-600"}
                                    `}
                                  >
                                    {isEnabled && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className="text-sm">
                                    {upgrade.toComponent.icon} {upgrade.label || upgrade.toComponent.name}
                                  </span>
                                  {upgrade.isRecommended && (
                                    <span className="text-[9px] px-1 py-0.5 bg-amber-500/30 text-amber-300 rounded">
                                      推荐
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-sm font-medium ${isEnabled ? "text-amber-400" : "text-gray-500"}`}
                                >
                                  +¥{(upgrade.priceDiff / 100).toLocaleString()}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 操作按钮 */}
                <div className="pt-4 border-t border-[#333]">
                  {selectedComponentIds.includes(selectedComponent.id) ? (
                    <button
                      type="button"
                      onClick={() => removeComponent(selectedComponent.id)}
                      className="w-full py-2 px-4 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                    >
                      从套餐中移除
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleComponentClick(selectedComponent.id)}
                      className="w-full py-2 px-4 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors text-sm"
                    >
                      添加到套餐
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* 未选中组件时显示套餐概览 */
            <>
              <div className="p-4 border-b border-[#333]">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-white">套餐配置</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* 统计 */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    当前配置
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#2a2a2a] rounded-lg">
                      <div className="text-2xl font-bold text-sakura-400">{stats.totalSelected}</div>
                      <div className="text-xs text-gray-500">已选组件</div>
                    </div>
                    {hasMapTemplate && (
                      <div className="p-3 bg-[#2a2a2a] rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">{stats.totalPlaced}</div>
                        <div className="text-xs text-gray-500">已放置</div>
                      </div>
                    )}
                    <div className="p-3 bg-[#2a2a2a] rounded-lg">
                      <div className="text-2xl font-bold text-amber-400">{stats.totalUpgrades}</div>
                      <div className="text-xs text-gray-500">升级选项</div>
                    </div>
                  </div>
                </div>

                {/* 已选组件列表 */}
                {selectedComponentIds.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      已选组件
                    </h4>
                    <div className="space-y-1.5">
                      {selectedComponentIds.map((id) => {
                        const component = getAllComponents().find((c) => c.id === id);
                        const config = getConfig(id);
                        if (!component) return null;

                        return (
                          <div
                            key={id}
                            onClick={() => setSelectedComponentId(id)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-[#2a2a2a] hover:bg-[#333] cursor-pointer transition-colors"
                          >
                            <GripVertical className="w-3 h-3 text-gray-600" />
                            <span className="text-sm">{component.icon}</span>
                            <span className="text-sm text-gray-300 flex-1 truncate">
                              {component.name}
                            </span>
                            {config?.hotmapX != null && (
                              <Layers className="w-3 h-3 text-blue-400" />
                            )}
                            {(config?.enabledUpgrades?.length || 0) > 0 && (
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 使用提示 */}
                <div className="p-3 bg-[#252525] rounded-lg border border-[#333]">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>· 在左侧组件库点击添加组件</p>
                      <p>· 点击画布上的组件查看详情</p>
                      <p>· 拖拽调整组件在热图上的位置</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
