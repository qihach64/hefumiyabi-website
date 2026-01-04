"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Package,
  Settings,
  X,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  ImageIcon,
  Plus,
  Trash2,
  Edit3,
} from "lucide-react";
import EditorHotspot from "@/components/shared/EditorHotspot";
import ImageUploader from "@/components/ImageUploader";

// ==================== 类型定义 (v10.2) ====================

interface MerchantComponentData {
  id: string;
  templateId: string;
  code: string;
  name: string;
  nameJa: string | null;
  type: string;
  icon: string | null;
  basePrice: number;
  description: string | null;
  outfitCategory: string | null;
  images: string[];
  highlights: string[];
  price: number | null;
  isEnabled: boolean;
  effectivePrice: number;
}

interface ComponentCategory {
  key: string;
  label: string;
  icon: string;
  components: MerchantComponentData[];
}

export interface ComponentConfig {
  merchantComponentId: string;
  hotmapX?: number | null;
  hotmapY?: number | null;
  hotmapLabelPosition?: string;
  hotmapLabelOffsetX?: number;
  hotmapLabelOffsetY?: number;
  hotmapOrder?: number;
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
  selectedMerchantComponentIds: string[];
  onChange: (merchantComponentIds: string[]) => void;
  componentConfigs?: ComponentConfig[];
  onConfigChange?: (configs: ComponentConfig[]) => void;
  themeId?: string | null;
  mapTemplate?: MapTemplateData | null;
  customMapImageUrl?: string;
  onCustomMapImageChange?: (url: string) => void;
  planId?: string;
  className?: string;
}

// ==================== 类型分类配置 ====================

const OUTFIT_CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  MAIN_GARMENT: { label: "主体服装", icon: "👘" },
  INNERWEAR: { label: "内搭层", icon: "👕" },
  OBI_SET: { label: "腰带组", icon: "🎀" },
  STYLING: { label: "造型服务", icon: "💇" },
  ACCESSORIES: { label: "随身配件", icon: "👜" },
  FOOTWEAR: { label: "足部穿着", icon: "👡" },
};

const OUTFIT_CATEGORY_ORDER = [
  "MAIN_GARMENT",
  "OBI_SET",
  "INNERWEAR",
  "STYLING",
  "ACCESSORIES",
  "FOOTWEAR",
];

// ADDON 类型组件在独立的 UpgradesTab 管理
const HOTMAP_ELIGIBLE_TYPES = ["OUTFIT"];

// ==================== 主组件 ====================

export default function PlanComponentEditor({
  selectedMerchantComponentIds,
  onChange,
  componentConfigs,
  onConfigChange,
  themeId,
  mapTemplate,
  customMapImageUrl,
  onCustomMapImageChange,
  planId,
  className = "",
}: PlanComponentEditorProps) {
  // 数据状态
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI 状态
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(1);

  // 面板状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true); // 默认收起
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // 弹窗状态
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);

  // 面板宽度限制
  const LEFT_MIN_WIDTH = 200;
  const LEFT_MAX_WIDTH = 320;
  const RIGHT_MIN_WIDTH = 240;
  const RIGHT_MAX_WIDTH = 360;

  // 编辑状态
  const [placingComponentId, setPlacingComponentId] = useState<string | null>(null);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 组件图片编辑状态
  const [componentImages, setComponentImages] = useState<Record<string, string[]>>({});
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0); // 当前查看的主图索引
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string; progress: number }[]>([]); // 上传中的文件

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // 内部配置状态
  const [internalConfigs, setInternalConfigs] = useState<ComponentConfig[]>([]);
  const configs = componentConfigs || internalConfigs;
  const setConfigs = onConfigChange || setInternalConfigs;

  // ==================== 数据加载 ====================

  useEffect(() => {
    async function fetchComponents() {
      try {
        const response = await fetch("/api/merchant/component-overrides");
        if (response.ok) {
          const data = await response.json();
          const components: MerchantComponentData[] = data.components || [];

          // 只显示 OUTFIT 类型组件（增值服务在独立的 UpgradesTab 管理）
          const outfitComponents = components.filter((c) => c.type === "OUTFIT");

          const outfitGrouped = outfitComponents.reduce((acc, comp) => {
            const category = comp.outfitCategory || "OTHER";
            if (!acc[category]) acc[category] = [];
            acc[category].push(comp);
            return acc;
          }, {} as Record<string, MerchantComponentData[]>);

          const cats: ComponentCategory[] = [];

          for (const categoryKey of OUTFIT_CATEGORY_ORDER) {
            if (outfitGrouped[categoryKey]?.length > 0) {
              const config = OUTFIT_CATEGORY_CONFIG[categoryKey];
              cats.push({
                key: categoryKey,
                label: config?.label || categoryKey,
                icon: config?.icon || "📦",
                components: outfitGrouped[categoryKey],
              });
            }
          }

          setCategories(cats);
          setExpandedCategories(new Set(cats.map((c) => c.key)));
        }
      } catch (error) {
        console.error("Failed to fetch merchant components:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchComponents();
  }, []);

  // ==================== 计算属性 ====================

  const getAllComponents = useCallback((): MerchantComponentData[] => {
    return categories.flatMap((cat) => cat.components);
  }, [categories]);

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
            c.code.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.components.length > 0);
  }, [categories, searchQuery]);

  const placedComponents = useMemo(() => {
    return configs.filter(
      (c) =>
        c.hotmapX != null &&
        c.hotmapY != null &&
        selectedMerchantComponentIds.includes(c.merchantComponentId)
    );
  }, [configs, selectedMerchantComponentIds]);

  const stats = useMemo(() => ({
    totalSelected: selectedMerchantComponentIds.length,
    totalPlaced: placedComponents.length,
  }), [selectedMerchantComponentIds, placedComponents]);

  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) return null;
    return getAllComponents().find((c) => c.id === selectedComponentId) || null;
  }, [selectedComponentId, getAllComponents]);

  const selectedConfig = useMemo(() => {
    if (!selectedComponentId) return null;
    return configs.find((c) => c.merchantComponentId === selectedComponentId) || null;
  }, [selectedComponentId, configs]);

  // ==================== 辅助函数 ====================

  const calculateLabelPosition = (x: number): string => x > 0.5 ? "left" : "right";

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
    (merchantComponentId: string): ComponentConfig | undefined => {
      return configs.find((c) => c.merchantComponentId === merchantComponentId);
    },
    [configs]
  );

  // ==================== 组件选择逻辑 ====================

  const toggleCategory = useCallback((type: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) newSet.delete(type);
      else newSet.add(type);
      return newSet;
    });
  }, []);

  const handleComponentClick = useCallback(
    (merchantComponentId: string) => {
      const isSelected = selectedMerchantComponentIds.includes(merchantComponentId);
      const component = getAllComponents().find((c) => c.id === merchantComponentId);
      const canPlaceOnHotmap = component && HOTMAP_ELIGIBLE_TYPES.includes(component.type);
      const hasMap = !!mapTemplate || !!customMapImageUrl;

      if (isSelected) {
        onChange(selectedMerchantComponentIds.filter((id) => id !== merchantComponentId));
        setConfigs(configs.filter((c) => c.merchantComponentId !== merchantComponentId));
        if (placingComponentId === merchantComponentId) setPlacingComponentId(null);
        if (selectedComponentId === merchantComponentId) setSelectedComponentId(null);
      } else {
        onChange([...selectedMerchantComponentIds, merchantComponentId]);
        const newConfig: ComponentConfig = {
          merchantComponentId,
          hotmapX: null,
          hotmapY: null,
          hotmapLabelPosition: "right",
          hotmapOrder: configs.length,
        };
        setConfigs([...configs, newConfig]);
        if (hasMap && canPlaceOnHotmap) {
          setPlacingComponentId(merchantComponentId);
        }
      }
      setSelectedComponentId(merchantComponentId);
    },
    [selectedMerchantComponentIds, onChange, configs, setConfigs, placingComponentId, selectedComponentId, getAllComponents, mapTemplate, customMapImageUrl]
  );

  // 点击热点 - 选中并展开右侧详情面板
  const handleHotspotSelect = useCallback((componentId: string) => {
    setSelectedComponentId(componentId);
    setIsRightCollapsed(false);
    setActiveImageIndex(0); // 重置图片索引
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
          c.merchantComponentId === placingComponentId
            ? { ...c, hotmapX: pos.x, hotmapY: pos.y, hotmapLabelPosition: labelPosition }
            : c
        )
      );

      if (!selectedMerchantComponentIds.includes(placingComponentId)) {
        onChange([...selectedMerchantComponentIds, placingComponentId]);
      }
      setPlacingComponentId(null);
    },
    [placingComponentId, getRelativePosition, configs, setConfigs, selectedMerchantComponentIds, onChange]
  );

  // ==================== 拖拽逻辑 ====================

  const handleDragStart = useCallback(
    (e: React.MouseEvent, merchantComponentId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const config = configs.find((c) => c.merchantComponentId === merchantComponentId);
      if (!config?.hotmapX || !config?.hotmapY) return;

      const pos = getRelativePosition(e);
      if (!pos) return;

      setDraggingComponentId(merchantComponentId);
      setDragOffset({ x: pos.x - config.hotmapX, y: pos.y - config.hotmapY });
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
          c.merchantComponentId === draggingComponentId
            ? { ...c, hotmapX: newX, hotmapY: newY, hotmapLabelPosition: labelPosition }
            : c
        )
      );
    },
    [draggingComponentId, dragOffset, getRelativePosition, configs, setConfigs]
  );

  const handleDragEnd = useCallback(() => setDraggingComponentId(null), []);

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

  const removeComponent = useCallback(
    (merchantComponentId: string) => {
      onChange(selectedMerchantComponentIds.filter((id) => id !== merchantComponentId));
      setConfigs(configs.filter((c) => c.merchantComponentId !== merchantComponentId));
      if (selectedComponentId === merchantComponentId) {
        setSelectedComponentId(null);
        setIsRightCollapsed(true);
      }
    },
    [selectedMerchantComponentIds, onChange, configs, setConfigs, selectedComponentId]
  );

  const handleLabelOffsetChange = useCallback(
    (merchantComponentId: string, offsetX: number, offsetY: number) => {
      setConfigs(
        configs.map((c) =>
          c.merchantComponentId === merchantComponentId
            ? { ...c, hotmapLabelOffsetX: offsetX, hotmapLabelOffsetY: offsetY, hotmapLabelPosition: offsetX < 0 ? "left" : "right" }
            : c
        )
      );
    },
    [configs, setConfigs]
  );

  // ==================== 组件图片管理 ====================

  const getComponentImages = useCallback(
    (componentId: string): string[] => {
      if (componentImages[componentId] !== undefined) return componentImages[componentId];
      const component = getAllComponents().find((c) => c.id === componentId);
      return component?.images || [];
    },
    [componentImages, getAllComponents]
  );

  const saveComponentImages = useCallback(async (componentId: string, images: string[]) => {
    setIsSavingImages(true);
    try {
      const response = await fetch("/api/merchant/component-overrides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: componentId, images }),
      });
      if (!response.ok) throw new Error("保存失败");
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          components: cat.components.map((c) => (c.id === componentId ? { ...c, images } : c)),
        }))
      );
      setComponentImages((prev) => {
        const { [componentId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error("保存组件图片失败:", error);
    } finally {
      setIsSavingImages(false);
    }
  }, []);

  const handleComponentImagesChange = useCallback(
    (componentId: string, images: string[]) => {
      setComponentImages((prev) => ({ ...prev, [componentId]: images }));
      saveComponentImages(componentId, images);
    },
    [saveComponentImages]
  );

  // ==================== 面板拖拽 ====================

  const handleLeftResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  }, []);

  const handleRightResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      if (isResizingLeft) {
        const newWidth = e.clientX - rect.left;
        setLeftPanelWidth(Math.max(LEFT_MIN_WIDTH, Math.min(LEFT_MAX_WIDTH, newWidth)));
      }
      if (isResizingRight) {
        const newWidth = rect.right - e.clientX;
        setRightPanelWidth(Math.max(RIGHT_MIN_WIDTH, Math.min(RIGHT_MAX_WIDTH, newWidth)));
      }
    },
    [isResizingLeft, isResizingRight]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizingLeft, isResizingRight, handleResizeMove, handleResizeEnd]);

  // ==================== 缩放控制 ====================

  const handleZoomIn = () => setCanvasZoom((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setCanvasZoom((z) => Math.max(z - 0.25, 0.5));
  const handleZoomReset = () => setCanvasZoom(1);

  // ==================== 渲染 ====================

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 h-[700px] flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-10 h-10 border-2 border-sakura-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>加载组件库...</p>
        </div>
      </div>
    );
  }

  const effectiveMapImageUrl = customMapImageUrl || mapTemplate?.imageUrl;
  const hasMapTemplate = !!effectiveMapImageUrl;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col ${className}`}>
      {/* ==================== 工具栏 ==================== */}
      <div className="h-11 px-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* 左侧面板切换 */}
          <button
            type="button"
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`p-1.5 rounded transition-colors ${
              isLeftCollapsed ? "text-sakura-600 bg-sakura-50" : "text-gray-500 hover:bg-gray-200"
            }`}
            title={isLeftCollapsed ? "展开组件库" : "收起组件库"}
          >
            {isLeftCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5 text-gray-700">
            <Layers className="w-4 h-4" />
            <span className="text-[13px] font-medium">组件编辑器</span>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="px-1.5 py-0.5 bg-sakura-100 text-sakura-600 rounded">
              {stats.totalSelected} 已选
            </span>
            {hasMapTemplate && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                {stats.totalPlaced} 已放置
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 背景设置按钮 */}
          <button
            type="button"
            onClick={() => setShowBackgroundDialog(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            title="设置背景图"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>背景</span>
          </button>

          {/* 缩放控制 */}
          {hasMapTemplate && (
            <>
              <div className="h-4 w-px bg-gray-300 mx-1" />
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={handleZoomOut} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" title="缩小">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-1.5 text-[11px] text-gray-500 min-w-[40px] text-center">
                  {Math.round(canvasZoom * 100)}%
                </span>
                <button type="button" onClick={handleZoomIn} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" title="放大">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button type="button" onClick={handleZoomReset} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded" title="重置">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==================== 三栏主体 ==================== */}
      <div ref={mainContainerRef} className="flex flex-1 min-h-0 relative">

        {/* ========== 左侧：组件库 ========== */}
        <div
          className={`flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-200 ${
            isLeftCollapsed ? "w-0 overflow-hidden border-r-0" : ""
          }`}
          style={{ width: isLeftCollapsed ? 0 : leftPanelWidth }}
        >
          {/* 搜索框 */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索组件..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-sakura-400"
              />
            </div>
          </div>

          {/* 组件列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-[13px]">
                {searchQuery ? "未找到匹配的组件" : "暂无可用组件"}
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isExpanded = expandedCategories.has(category.key);
                const selectedCount = category.components.filter((c) =>
                  selectedMerchantComponentIds.includes(c.id)
                ).length;

                return (
                  <div key={category.key} className="border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.key)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                        <span className="text-[13px]">{category.icon}</span>
                        <span className="text-[13px] font-medium text-gray-700">{category.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {selectedCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-sakura-100 text-sakura-600 rounded">
                            {selectedCount}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{category.components.length}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="pb-1 bg-white">
                        {category.components.map((component) => {
                          const isSelected = selectedMerchantComponentIds.includes(component.id);
                          const isPlacing = placingComponentId === component.id;
                          const isActive = selectedComponentId === component.id;

                          return (
                            <div
                              key={component.id}
                              onClick={() => handleComponentClick(component.id)}
                              className={`
                                mx-1.5 mb-0.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-[13px]
                                ${isActive ? "bg-sakura-50 border border-sakura-300" : isSelected ? "bg-gray-50 border border-gray-200" : "hover:bg-gray-50 border border-transparent"}
                                ${isPlacing ? "ring-2 ring-sakura-400 animate-pulse" : ""}
                                ${!component.isEnabled ? "opacity-50" : ""}
                              `}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-sakura-500 border-sakura-500" : "border-gray-300"}`}>
                                  {isSelected && <Check className="w-2 h-2 text-white" />}
                                </div>
                                <span className="flex-shrink-0">{component.icon || "📦"}</span>
                                <span className={`truncate ${isSelected ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                                  {component.name}
                                </span>
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

        {/* 左侧拖拽手柄 */}
        {!isLeftCollapsed && (
          <div
            onMouseDown={handleLeftResizeStart}
            className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${isResizingLeft ? "bg-sakura-400" : "bg-gray-200 hover:bg-sakura-300"}`}
          />
        )}

        {/* ========== 左侧收起时的悬浮添加按钮 ========== */}
        {isLeftCollapsed && (
          <button
            type="button"
            onClick={() => setIsLeftCollapsed(false)}
            className="absolute left-3 top-3 z-20 flex items-center gap-1.5 px-3 py-2 bg-sakura-500 hover:bg-sakura-600 text-white text-[13px] font-medium rounded-lg shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加组件
          </button>
        )}

        {/* ========== 中间：画布区 ========== */}
        <div
          ref={canvasContainerRef}
          className="flex-1 min-w-0 bg-gray-100 overflow-auto relative"
          onClick={handleCanvasClick}
        >
          {hasMapTemplate ? (
            <div className="p-4 min-h-full flex flex-col items-center">
              {/* 放置提示 */}
              {placingComponentId && (
                <div className="mb-3 px-4 py-2 bg-sakura-500 text-white text-[13px] rounded-lg shadow-lg text-center">
                  点击下方图片放置「{getAllComponents().find((c) => c.id === placingComponentId)?.name}」
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlacingComponentId(null);
                      removeComponent(placingComponentId);
                    }}
                    className="ml-2 underline opacity-80 hover:opacity-100"
                  >
                    取消
                  </button>
                </div>
              )}

              {/* 画布 */}
              <div
                ref={imageContainerRef}
                className={`relative rounded-xl overflow-hidden shadow-lg border-2 transition-all ${
                  placingComponentId ? "cursor-crosshair border-sakura-400" : "border-gray-200"
                } ${draggingComponentId ? "cursor-grabbing" : ""}`}
                style={{ width: `${450 * canvasZoom}px`, height: `${600 * canvasZoom}px` }}
              >
                <Image
                  src={effectiveMapImageUrl!}
                  alt="套餐展示图"
                  fill
                  className="object-cover pointer-events-none select-none"
                  unoptimized
                  draggable={false}
                />

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
                  const component = getAllComponents().find((c) => c.id === config.merchantComponentId);
                  const isDragging = draggingComponentId === config.merchantComponentId;
                  const isActive = selectedComponentId === config.merchantComponentId;

                  return (
                    <EditorHotspot
                      key={config.merchantComponentId}
                      hotspot={{
                        id: config.merchantComponentId,
                        x: config.hotmapX,
                        y: config.hotmapY,
                        labelPosition: (config.hotmapLabelPosition as "left" | "right" | "top" | "bottom") || "right",
                        labelOffsetX: config.hotmapLabelOffsetX,
                        labelOffsetY: config.hotmapLabelOffsetY,
                        name: component?.name ?? "加载中...",
                        icon: component?.icon ?? "📍",
                        isIncluded: true,
                      }}
                      isEditable
                      isDragging={isDragging}
                      isSelected={isActive}
                      onClick={() => handleHotspotSelect(config.merchantComponentId)}
                      onDragStart={(e) => handleDragStart(e, config.merchantComponentId)}
                      onRemove={() => removeComponent(config.merchantComponentId)}
                      onLabelOffsetChange={(offsetX, offsetY) => handleLabelOffsetChange(config.merchantComponentId, offsetX, offsetY)}
                    />
                  );
                })}
              </div>

              <div className="mt-3 text-center text-[12px] text-gray-500">
                拖拽热点调整位置 · 点击热点编辑详情
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-200 flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-[13px] mb-2">未配置热图背景</p>
                <button
                  type="button"
                  onClick={() => setShowBackgroundDialog(true)}
                  className="text-[13px] text-sakura-600 hover:text-sakura-700 underline"
                >
                  点击上传背景图
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧拖拽手柄 */}
        {!isRightCollapsed && (
          <div
            onMouseDown={handleRightResizeStart}
            className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${isResizingRight ? "bg-sakura-400" : "bg-gray-200 hover:bg-sakura-300"}`}
          />
        )}

        {/* ========== 右侧：属性面板（按需显示） ========== */}
        <div
          className={`flex-shrink-0 border-l border-gray-200 bg-white flex flex-col transition-all duration-200 ${
            isRightCollapsed ? "w-0 overflow-hidden border-l-0" : ""
          }`}
          style={{ width: isRightCollapsed ? 0 : rightPanelWidth }}
        >
          {selectedComponent && (
            <>
              {/* 头部 */}
              <div className="p-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                      {selectedComponent.icon || "📦"}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-gray-900">{selectedComponent.name}</h3>
                      <p className="text-[11px] text-gray-500">
                        {(selectedComponent.outfitCategory && OUTFIT_CATEGORY_CONFIG[selectedComponent.outfitCategory]?.label) || "组件"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRightCollapsed(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* 状态 */}
                <div>
                  <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">状态</h4>
                  <div className="space-y-1.5">
                    {selectedMerchantComponentIds.includes(selectedComponent.id) ? (
                      <div className="flex items-center gap-2 text-[13px] text-emerald-600">
                        <Check className="w-4 h-4" />
                        已添加到套餐
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[13px] text-gray-500">
                        <Info className="w-4 h-4" />
                        未添加到套餐
                      </div>
                    )}
                    {selectedConfig?.hotmapX != null && (
                      <div className="flex items-center gap-2 text-[11px] text-blue-600">
                        <Layers className="w-3 h-3" />
                        已放置 ({Math.round((selectedConfig.hotmapX || 0) * 100)}%, {Math.round((selectedConfig.hotmapY || 0) * 100)}%)
                      </div>
                    )}
                  </div>
                </div>

                {/* 描述 */}
                {selectedComponent.description && (
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">描述</h4>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{selectedComponent.description}</p>
                  </div>
                )}

                {/* 亮点 */}
                {selectedComponent.highlights?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">特点</h4>
                    <div className="space-y-1">
                      {selectedComponent.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                          <ChevronRight className="w-3 h-3 text-sakura-500 mt-0.5 flex-shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 自定义图片 - 主图 + 缩略图模式 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      组件图片
                    </h4>
                    {(isSavingImages || uploadingFiles.length > 0) && (
                      <span className="flex items-center gap-1 text-[11px] text-sakura-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {uploadingFiles.length > 0 ? `上传中 (${uploadingFiles.length})` : "保存中"}
                      </span>
                    )}
                  </div>

                  {(() => {
                    const images = getComponentImages(selectedComponent.id);
                    const currentIndex = Math.min(activeImageIndex, Math.max(0, images.length - 1));
                    const totalSlots = images.length + uploadingFiles.length;

                    // 批量上传处理函数
                    const handleBatchUpload = async (files: File[]) => {
                      if (files.length === 0) return;

                      const maxToUpload = 5 - images.length;
                      const filesToUpload = files.slice(0, maxToUpload);

                      // 为每个文件创建上传任务
                      const uploadTasks = filesToUpload.map((file) => ({
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        name: file.name,
                        file,
                        progress: 0,
                      }));

                      // 添加到上传队列
                      setUploadingFiles(prev => [...prev, ...uploadTasks.map(t => ({ id: t.id, name: t.name, progress: 0 }))]);

                      // 并行上传所有文件
                      const results = await Promise.allSettled(
                        uploadTasks.map(async (task) => {
                          try {
                            // 更新进度: 开始
                            setUploadingFiles(prev => prev.map(f => f.id === task.id ? { ...f, progress: 10 } : f));

                            // 1. 获取预签名 URL
                            const presignResponse = await fetch("/api/upload/presign", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                fileType: task.file.type,
                                fileSize: task.file.size,
                                category: "component",
                                entityId: selectedComponent.id,
                                purpose: "gallery",
                              }),
                            });

                            if (!presignResponse.ok) throw new Error("获取上传凭证失败");

                            setUploadingFiles(prev => prev.map(f => f.id === task.id ? { ...f, progress: 30 } : f));

                            const { presignedUrl, publicUrl } = await presignResponse.json();

                            // 2. 上传到 S3
                            setUploadingFiles(prev => prev.map(f => f.id === task.id ? { ...f, progress: 50 } : f));

                            await fetch(presignedUrl, {
                              method: "PUT",
                              body: task.file,
                              headers: { "Content-Type": task.file.type },
                            });

                            setUploadingFiles(prev => prev.map(f => f.id === task.id ? { ...f, progress: 100 } : f));

                            return { taskId: task.id, publicUrl };
                          } catch (err) {
                            console.error(`上传失败 (${task.name}):`, err);
                            throw err;
                          }
                        })
                      );

                      // 收集成功上传的 URLs
                      const successUrls: string[] = [];
                      const completedIds: string[] = [];

                      results.forEach((result, i) => {
                        if (result.status === "fulfilled") {
                          successUrls.push(result.value.publicUrl);
                          completedIds.push(result.value.taskId);
                        } else {
                          completedIds.push(uploadTasks[i].id);
                        }
                      });

                      // 移除已完成的上传任务
                      setUploadingFiles(prev => prev.filter(f => !completedIds.includes(f.id)));

                      // 更新图片列表
                      if (successUrls.length > 0) {
                        const newImages = [...images, ...successUrls];
                        handleComponentImagesChange(selectedComponent.id, newImages);
                      }
                    };

                    // 删除图片
                    const handleDeleteImage = (index: number) => {
                      const newImages = images.filter((_, i) => i !== index);
                      handleComponentImagesChange(selectedComponent.id, newImages);
                      if (currentIndex >= newImages.length) {
                        setActiveImageIndex(Math.max(0, newImages.length - 1));
                      }
                    };

                    return (
                      <div className="space-y-3">
                        {/* 主图区域 */}
                        {images.length > 0 ? (
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 group">
                            <Image
                              src={images[currentIndex]}
                              alt={`${selectedComponent.name} 图片 ${currentIndex + 1}`}
                              fill
                              className="object-cover"
                              sizes="280px"
                              unoptimized
                            />
                            {/* 左右切换箭头 */}
                            {images.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setActiveImageIndex(i => (i - 1 + images.length) % images.length)}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                >
                                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveImageIndex(i => (i + 1) % images.length)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                >
                                  <ChevronRight className="w-4 h-4 text-gray-700" />
                                </button>
                              </>
                            )}
                            {/* 图片计数 */}
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-[11px] text-white">
                              {currentIndex + 1} / {images.length}
                            </div>
                            {/* 删除当前图片 */}
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(currentIndex)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-red-500 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                              title="删除图片"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        ) : uploadingFiles.length > 0 ? (
                          /* 上传中占位 */
                          <div className="aspect-[4/3] rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-sakura-400 animate-spin mb-2" />
                            <p className="text-[12px] text-gray-500">正在上传 {uploadingFiles.length} 张图片...</p>
                          </div>
                        ) : (
                          /* 空状态 - 可拖拽上传 */
                          <label className="aspect-[4/3] rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-sakura-400 flex flex-col items-center justify-center cursor-pointer transition-colors">
                            <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                            <p className="text-[13px] text-gray-500 font-medium">点击上传图片</p>
                            <p className="text-[11px] text-gray-400 mt-1">支持批量上传，最多 5 张</p>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                handleBatchUpload(files);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}

                        {/* 缩略图行 + 上传中指示器 + 添加按钮 */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {/* 已上传的图片缩略图 */}
                          {images.map((img, i) => (
                            <div
                              key={`img-${i}`}
                              className="relative flex-shrink-0 group/thumb"
                            >
                              <button
                                type="button"
                                onClick={() => setActiveImageIndex(i)}
                                className={`
                                  relative w-12 h-12 rounded-lg overflow-hidden transition-all
                                  ${currentIndex === i
                                    ? "ring-2 ring-sakura-500 ring-offset-1"
                                    : "ring-1 ring-gray-200 hover:ring-sakura-300"
                                  }
                                `}
                              >
                                <Image
                                  src={img}
                                  alt={`缩略图 ${i + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                  unoptimized
                                />
                              </button>
                              {/* 删除按钮 */}
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(i)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                title="删除"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {/* 上传中的占位符 */}
                          {uploadingFiles.map((file) => (
                            <div
                              key={file.id}
                              className="relative flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden"
                            >
                              {/* 进度条背景 */}
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-sakura-400 transition-all duration-300"
                                style={{ height: `${file.progress}%` }}
                              />
                              {/* 加载图标 */}
                              <Loader2 className="w-5 h-5 text-sakura-500 animate-spin relative z-10" />
                            </div>
                          ))}

                          {/* 添加更多图片按钮 */}
                          {totalSlots < 5 && (
                            <label className="flex-shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-sakura-400 hover:bg-sakura-50 flex items-center justify-center cursor-pointer transition-colors">
                              <Plus className="w-5 h-5 text-gray-400" />
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  handleBatchUpload(files);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {/* 图片数量提示 */}
                        <p className="text-[11px] text-gray-400 text-center">
                          {images.length}/5 张 · 点击缩略图预览 · 悬停显示删除
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* 操作按钮 */}
                <div className="pt-3 border-t border-gray-100">
                  {selectedMerchantComponentIds.includes(selectedComponent.id) ? (
                    <button
                      type="button"
                      onClick={() => removeComponent(selectedComponent.id)}
                      className="w-full py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-[13px] border border-red-200"
                    >
                      从套餐中移除
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleComponentClick(selectedComponent.id)}
                      className="w-full py-2 px-3 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors text-[13px]"
                    >
                      添加到套餐
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==================== 背景设置 Dialog ==================== */}
      {showBackgroundDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBackgroundDialog(false)} />

          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* 头部 */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                <h3 className="text-[16px] font-semibold text-gray-900">设置热点图背景</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBackgroundDialog(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5">
              <p className="text-[13px] text-gray-500 mb-4">
                上传自定义图片作为热点图背景，建议尺寸 450×600 像素（3:4 比例）
              </p>

              {/* 当前背景预览 */}
              {customMapImageUrl && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-[85px] rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                      <img src={customMapImageUrl} alt="当前背景" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-gray-700 font-medium mb-1">当前背景</p>
                      <button
                        type="button"
                        onClick={() => onCustomMapImageChange?.("")}
                        className="text-[12px] text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        移除背景
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 上传组件 */}
              <ImageUploader
                category="plan"
                entityId={planId || "new"}
                purpose="gallery"
                multiple={false}
                maxFiles={1}
                value={customMapImageUrl ? [customMapImageUrl] : []}
                onChange={(urls) => {
                  onCustomMapImageChange?.(urls[0] || "");
                  if (urls[0]) setShowBackgroundDialog(false);
                }}
                aspectRatio="3:4"
                className="w-full"
              />
            </div>

            {/* 底部 */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBackgroundDialog(false)}
                className="px-4 py-2 text-[13px] text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
