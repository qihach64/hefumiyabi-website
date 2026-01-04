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
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  ImageIcon,
} from "lucide-react";
import EditorHotspot from "@/components/shared/EditorHotspot";
import ImageUploader from "@/components/ImageUploader";

// ==================== 类型定义 (v10.2) ====================

// 商户组件实例（从 API 获取）
interface MerchantComponentData {
  id: string;
  templateId: string;
  // 模板信息
  code: string;
  name: string;
  nameJa: string | null;
  type: string;
  icon: string | null;
  basePrice: number;
  description: string | null;
  outfitCategory: string | null; // v10.2: OUTFIT 分类
  // 商户自定义内容
  images: string[];
  highlights: string[];
  // 商户配置
  price: number | null;
  isEnabled: boolean;
  effectivePrice: number;
}

interface ComponentCategory {
  key: string; // 分类 key (type 或 outfitCategory)
  label: string;
  icon: string;
  components: MerchantComponentData[];
}

// PlanComponent 配置（v10.1 - 使用 merchantComponentId）
export interface ComponentConfig {
  merchantComponentId: string;
  hotmapX?: number | null;
  hotmapY?: number | null;
  hotmapLabelPosition?: string;
  hotmapLabelOffsetX?: number; // 标签 X 偏移（像素）
  hotmapLabelOffsetY?: number; // 标签 Y 偏移（像素）
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
  className?: string;
}

// ==================== 类型分类配置 ====================

// v10.2: OUTFIT 分类配置
const OUTFIT_CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  MAIN_GARMENT: { label: "主体服装", icon: "👘" },
  INNERWEAR: { label: "内搭层", icon: "👕" },
  OBI_SET: { label: "腰带组", icon: "🎀" },
  STYLING: { label: "造型服务", icon: "💇" },
  ACCESSORIES: { label: "随身配件", icon: "👜" },
  FOOTWEAR: { label: "足部穿着", icon: "👡" },
};

// OUTFIT 分类顺序
const OUTFIT_CATEGORY_ORDER = [
  "MAIN_GARMENT",
  "OBI_SET",
  "INNERWEAR",
  "STYLING",
  "ACCESSORIES",
  "FOOTWEAR",
];

// ADDON 类型配置
const ADDON_CONFIG = { label: "增值服务", icon: "✨" };

// 可放置到热图的类型
const HOTMAP_ELIGIBLE_TYPES = ["OUTFIT"];

// ==================== 主组件 ====================

export default function PlanComponentEditor({
  selectedMerchantComponentIds,
  onChange,
  componentConfigs,
  onConfigChange,
  themeId,
  mapTemplate,
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
  const [leftPanelWidth, setLeftPanelWidth] = useState(256); // 默认 256px
  const [rightPanelWidth, setRightPanelWidth] = useState(280); // 默认 280px
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // 面板宽度限制
  const LEFT_MIN_WIDTH = 200;
  const LEFT_MAX_WIDTH = 360;
  const RIGHT_MIN_WIDTH = 240;
  const RIGHT_MAX_WIDTH = 400;

  // 编辑状态
  const [placingComponentId, setPlacingComponentId] = useState<string | null>(null);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 组件图片编辑状态
  const [componentImages, setComponentImages] = useState<Record<string, string[]>>({});
  const [isSavingImages, setIsSavingImages] = useState(false);

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
        // 获取商户的组件实例
        const response = await fetch("/api/merchant/component-overrides");
        if (response.ok) {
          const data = await response.json();
          const components: MerchantComponentData[] = data.components || [];

          // v10.2: 按 outfitCategory 分组 OUTFIT，ADDON 单独一组
          const outfitComponents = components.filter((c) => c.type === "OUTFIT");
          const addonComponents = components.filter((c) => c.type === "ADDON");

          // OUTFIT 按 outfitCategory 分组
          const outfitGrouped = outfitComponents.reduce((acc, comp) => {
            const category = comp.outfitCategory || "OTHER";
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(comp);
            return acc;
          }, {} as Record<string, MerchantComponentData[]>);

          // 构建分类数组
          const cats: ComponentCategory[] = [];

          // 按顺序添加 OUTFIT 分类
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

          // 添加 ADDON 分类
          if (addonComponents.length > 0) {
            cats.push({
              key: "ADDON",
              label: ADDON_CONFIG.label,
              icon: ADDON_CONFIG.icon,
              components: addonComponents,
            });
          }

          setCategories(cats);
          // 默认展开所有分类
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
        selectedMerchantComponentIds.includes(c.merchantComponentId)
    );
  }, [configs, selectedMerchantComponentIds]);

  // 统计
  const stats = useMemo(() => {
    const totalSelected = selectedMerchantComponentIds.length;
    const totalPlaced = placedComponents.length;
    return { totalSelected, totalPlaced };
  }, [selectedMerchantComponentIds, placedComponents]);

  // 当前选中的组件详情
  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) return null;
    return getAllComponents().find((c) => c.id === selectedComponentId) || null;
  }, [selectedComponentId, getAllComponents]);

  const selectedConfig = useMemo(() => {
    if (!selectedComponentId) return null;
    return configs.find((c) => c.merchantComponentId === selectedComponentId) || null;
  }, [selectedComponentId, configs]);

  // ==================== 辅助函数 ====================

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
    (merchantComponentId: string): ComponentConfig | undefined => {
      return configs.find((c) => c.merchantComponentId === merchantComponentId);
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
    (merchantComponentId: string) => {
      const isSelected = selectedMerchantComponentIds.includes(merchantComponentId);
      const component = getAllComponents().find((c) => c.id === merchantComponentId);
      const canPlaceOnHotmap = component && HOTMAP_ELIGIBLE_TYPES.includes(component.type);
      const hasMap = !!mapTemplate;

      if (isSelected) {
        // 取消选择
        onChange(selectedMerchantComponentIds.filter((id) => id !== merchantComponentId));
        setConfigs(configs.filter((c) => c.merchantComponentId !== merchantComponentId));
        if (placingComponentId === merchantComponentId) {
          setPlacingComponentId(null);
        }
        if (selectedComponentId === merchantComponentId) {
          setSelectedComponentId(null);
        }
      } else {
        // 选择组件
        onChange([...selectedMerchantComponentIds, merchantComponentId]);

        const newConfig: ComponentConfig = {
          merchantComponentId,
          hotmapX: null,
          hotmapY: null,
          hotmapLabelPosition: "right",
          hotmapOrder: configs.length,
        };
        setConfigs([...configs, newConfig]);

        // 如果有热图且组件可放置，进入放置模式
        if (hasMap && canPlaceOnHotmap) {
          setPlacingComponentId(merchantComponentId);
        }
      }

      // 选中以显示属性面板，并强制展开右侧面板
      setSelectedComponentId(merchantComponentId);
      if (isRightCollapsed) {
        setIsRightCollapsed(false);
      }
    },
    [
      selectedMerchantComponentIds,
      onChange,
      configs,
      setConfigs,
      placingComponentId,
      selectedComponentId,
      getAllComponents,
      mapTemplate,
      isRightCollapsed,
    ]
  );

  // 从画布选中组件
  // source: 'hotspot' - 点击热点圆点（只选中，不展开面板，方便调整位置）
  // source: 'label' - 点击标签卡片（选中并展开面板查看详情）
  const handleCanvasComponentClick = useCallback((merchantComponentId: string, source: "hotspot" | "label") => {
    setSelectedComponentId(merchantComponentId);
    // 只有点击标签时才展开右侧面板
    if (source === "label" && isRightCollapsed) {
      setIsRightCollapsed(false);
    }
  }, [isRightCollapsed]);

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
          c.merchantComponentId === draggingComponentId
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

  // 移除组件
  const removeComponent = useCallback(
    (merchantComponentId: string) => {
      onChange(selectedMerchantComponentIds.filter((id) => id !== merchantComponentId));
      setConfigs(configs.filter((c) => c.merchantComponentId !== merchantComponentId));
      if (selectedComponentId === merchantComponentId) {
        setSelectedComponentId(null);
      }
    },
    [selectedMerchantComponentIds, onChange, configs, setConfigs, selectedComponentId]
  );

  // 更新标签偏移位置
  const handleLabelOffsetChange = useCallback(
    (merchantComponentId: string, offsetX: number, offsetY: number) => {
      setConfigs(
        configs.map((c) =>
          c.merchantComponentId === merchantComponentId
            ? {
                ...c,
                hotmapLabelOffsetX: offsetX,
                hotmapLabelOffsetY: offsetY,
                // 同时更新 labelPosition 以便兼容旧逻辑
                hotmapLabelPosition: offsetX < 0 ? "left" : "right",
              }
            : c
        )
      );
    },
    [configs, setConfigs]
  );

  // ==================== 组件图片管理 ====================

  // 获取组件当前图片（优先使用本地编辑状态，否则使用原始数据）
  const getComponentImages = useCallback(
    (componentId: string): string[] => {
      if (componentImages[componentId] !== undefined) {
        return componentImages[componentId];
      }
      const component = getAllComponents().find((c) => c.id === componentId);
      return component?.images || [];
    },
    [componentImages, getAllComponents]
  );

  // 保存组件图片到服务器
  const saveComponentImages = useCallback(
    async (componentId: string, images: string[]) => {
      setIsSavingImages(true);
      try {
        const response = await fetch("/api/merchant/component-overrides", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: componentId, images }),
        });

        if (!response.ok) {
          throw new Error("保存失败");
        }

        // 更新本地分类数据中的图片
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            components: cat.components.map((c) =>
              c.id === componentId ? { ...c, images } : c
            ),
          }))
        );

        // 清除本地编辑状态（已同步到服务器）
        setComponentImages((prev) => {
          const { [componentId]: _, ...rest } = prev;
          return rest;
        });
      } catch (error) {
        console.error("保存组件图片失败:", error);
        alert("保存图片失败，请重试");
      } finally {
        setIsSavingImages(false);
      }
    },
    []
  );

  // 处理图片变化（本地状态更新 + 自动保存）
  const handleComponentImagesChange = useCallback(
    (componentId: string, images: string[]) => {
      setComponentImages((prev) => ({ ...prev, [componentId]: images }));
      // 自动保存
      saveComponentImages(componentId, images);
    },
    [saveComponentImages]
  );

  // ==================== 面板拖拽调整 ====================

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
    [isResizingLeft, isResizingRight, LEFT_MIN_WIDTH, LEFT_MAX_WIDTH, RIGHT_MIN_WIDTH, RIGHT_MAX_WIDTH]
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

  const hasMapTemplate = !!mapTemplate;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {/* 工具栏 */}
      <div className="h-12 px-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 左侧面板切换 */}
          <button
            type="button"
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`p-1.5 rounded transition-colors ${
              isLeftCollapsed
                ? "text-sakura-600 bg-sakura-50 hover:bg-sakura-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
            title={isLeftCollapsed ? "展开组件库" : "收起组件库"}
          >
            {isLeftCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-2 text-gray-700">
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">套餐组件编辑器</span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-sakura-100 text-sakura-600 rounded">
              {stats.totalSelected} 已选
            </span>
            {hasMapTemplate && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                {stats.totalPlaced} 已放置
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 缩放控制 */}
          {hasMapTemplate && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
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
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                title="重置"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 右侧面板切换 */}
          <div className="h-4 w-px bg-gray-300" />
          <button
            type="button"
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className={`p-1.5 rounded transition-colors ${
              isRightCollapsed
                ? "text-sakura-600 bg-sakura-50 hover:bg-sakura-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
            title={isRightCollapsed ? "展开属性面板" : "收起属性面板"}
          >
            {isRightCollapsed ? (
              <PanelRightOpen className="w-4 h-4" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 三栏式主体 */}
      <div ref={mainContainerRef} className="flex h-[650px]">
        {/* ==================== 左侧：组件库 ==================== */}
        <div
          className={`flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300 ${
            isLeftCollapsed ? "w-0 overflow-hidden border-r-0" : ""
          }`}
          style={{ width: isLeftCollapsed ? 0 : leftPanelWidth }}
        >
          {/* 搜索框 */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索组件..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-sakura-400 focus:ring-1 focus:ring-sakura-400"
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
                const isExpanded = expandedCategories.has(category.key);
                const selectedCount = category.components.filter((c) =>
                  selectedMerchantComponentIds.includes(c.id)
                ).length;

                return (
                  <div key={category.key} className="border-b border-gray-100">
                    {/* 分类标题 */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.key)}
                      className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm">{category.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{category.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-sakura-100 text-sakura-600 rounded">
                            {selectedCount}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {category.components.length}
                        </span>
                      </div>
                    </button>

                    {/* 组件列表 */}
                    {isExpanded && (
                      <div className="pb-2 bg-white">
                        {category.components.map((component) => {
                          const isSelected = selectedMerchantComponentIds.includes(component.id);
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
                                  ? "bg-sakura-50 border border-sakura-300"
                                  : isSelected
                                    ? "bg-gray-50 border border-gray-200"
                                    : "hover:bg-gray-50 border border-transparent"
                                }
                                ${isPlacing ? "ring-2 ring-sakura-400 animate-pulse" : ""}
                                ${!component.isEnabled ? "opacity-50" : ""}
                              `}
                            >
                              <div className="flex items-center gap-2">
                                {/* 选中状态 */}
                                <div
                                  className={`
                                    w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                                    ${isSelected
                                      ? "bg-sakura-500 border-sakura-500"
                                      : "border-gray-300"
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
                                      className={`text-sm truncate ${isSelected ? "text-gray-900 font-medium" : "text-gray-700"}`}
                                    >
                                      {component.name}
                                    </span>
                                    {!canPlace && (
                                      <span className="text-[9px] px-1 py-0.5 bg-amber-100 text-amber-600 rounded">
                                        增值
                                      </span>
                                    )}
                                  </div>
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

        {/* 左侧拖拽手柄 */}
        {!isLeftCollapsed && (
          <div
            onMouseDown={handleLeftResizeStart}
            className={`
              w-1.5 flex-shrink-0 cursor-col-resize group
              transition-colors duration-150
              ${isResizingLeft ? "bg-sakura-400" : "bg-gray-200 hover:bg-sakura-300"}
            `}
          >
            <div className="h-full w-full flex items-center justify-center">
              <div className={`w-0.5 h-8 rounded-full transition-colors ${isResizingLeft ? "bg-sakura-600" : "bg-gray-400 group-hover:bg-sakura-500"}`} />
            </div>
          </div>
        )}

        {/* ==================== 中间：画布区 ==================== */}
        <div
          ref={canvasContainerRef}
          className="flex-1 min-w-0 bg-gray-100 overflow-auto"
        >
          {hasMapTemplate ? (
            <div className="p-6 min-h-full">
              {/* 放置提示 */}
              {placingComponentId && (
                <div className="mb-4 px-4 py-2 bg-sakura-500 text-white text-sm rounded-lg shadow-lg text-center">
                  点击下方图片放置「{getAllComponents().find((c) => c.id === placingComponentId)?.name}」
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
                  relative rounded-xl overflow-hidden shadow-lg border-2 mx-auto
                  transition-all duration-300
                  ${placingComponentId ? "cursor-crosshair border-sakura-400" : "border-gray-200"}
                  ${draggingComponentId ? "cursor-grabbing" : ""}
                `}
                style={{
                  width: `${450 * canvasZoom}px`,
                  height: `${600 * canvasZoom}px`,
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
                        labelPosition:
                          (config.hotmapLabelPosition as "left" | "right" | "top" | "bottom") ||
                          "right",
                        labelOffsetX: config.hotmapLabelOffsetX,
                        labelOffsetY: config.hotmapLabelOffsetY,
                        name: component?.name ?? "加载中...",
                        icon: component?.icon ?? "📍",
                        isIncluded: true,
                      }}
                      isEditable
                      isDragging={isDragging}
                      isSelected={isActive}
                      onClick={(source) => handleCanvasComponentClick(config.merchantComponentId, source)}
                      onDragStart={(e) => handleDragStart(e, config.merchantComponentId)}
                      onRemove={() => removeComponent(config.merchantComponentId)}
                      onLabelOffsetChange={(offsetX, offsetY) => handleLabelOffsetChange(config.merchantComponentId, offsetX, offsetY)}
                    />
                  );
                })}
              </div>

              {/* 画布底部提示 */}
              <div className="mt-4 text-center text-xs text-gray-500">
                拖拽热点调整位置 · 拖拽标签调整方向 · 点击标签查看详情
              </div>
            </div>
          ) : (
            /* 无热图模板时的空状态 */
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-200 flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-sm mb-2">未配置热图模板</p>
                <p className="text-xs text-gray-400">在左侧选择组件即可添加到套餐</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧拖拽手柄 */}
        {!isRightCollapsed && (
          <div
            onMouseDown={handleRightResizeStart}
            className={`
              w-1.5 flex-shrink-0 cursor-col-resize group
              transition-colors duration-150
              ${isResizingRight ? "bg-sakura-400" : "bg-gray-200 hover:bg-sakura-300"}
            `}
          >
            <div className="h-full w-full flex items-center justify-center">
              <div className={`w-0.5 h-8 rounded-full transition-colors ${isResizingRight ? "bg-sakura-600" : "bg-gray-400 group-hover:bg-sakura-500"}`} />
            </div>
          </div>
        )}

        {/* ==================== 右侧：属性面板 ==================== */}
        <div
          className={`flex-shrink-0 border-l border-gray-200 bg-white flex flex-col transition-all duration-300 ${
            isRightCollapsed ? "w-0 overflow-hidden border-l-0" : ""
          }`}
          style={{ width: isRightCollapsed ? 0 : rightPanelWidth }}
        >
          {selectedComponent ? (
            /* 选中组件时显示组件详情 */
            <>
              {/* 头部 */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                      {selectedComponent.icon || "📦"}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {selectedComponent.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {selectedComponent.type === "ADDON"
                          ? ADDON_CONFIG.label
                          : (selectedComponent.outfitCategory && OUTFIT_CATEGORY_CONFIG[selectedComponent.outfitCategory]?.label) || "组件"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedComponentId(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
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
                    {selectedMerchantComponentIds.includes(selectedComponent.id) ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <Check className="w-4 h-4" />
                        已添加到套餐
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Info className="w-4 h-4" />
                        未添加到套餐
                      </div>
                    )}
                    {selectedConfig?.hotmapX != null && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
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
                    <p className="text-sm text-gray-600 leading-relaxed">
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
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <ChevronRight className="w-3 h-3 text-sakura-500 mt-0.5 flex-shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 自定义图片 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3" />
                      自定义图片
                    </h4>
                    {isSavingImages && (
                      <span className="flex items-center gap-1 text-xs text-sakura-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        保存中...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    上传您自己的组件展示图片，替换平台默认图片
                  </p>
                  <ImageUploader
                    category="component"
                    entityId={selectedComponent.id}
                    purpose="gallery"
                    multiple={true}
                    maxFiles={5}
                    value={getComponentImages(selectedComponent.id)}
                    onChange={(urls) => handleComponentImagesChange(selectedComponent.id, urls)}
                    aspectRatio="4:3"
                    className="w-full"
                  />
                </div>

                {/* 操作按钮 */}
                <div className="pt-4 border-t border-gray-100">
                  {selectedMerchantComponentIds.includes(selectedComponent.id) ? (
                    <button
                      type="button"
                      onClick={() => removeComponent(selectedComponent.id)}
                      className="w-full py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm border border-red-200"
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
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">套餐配置</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* 统计 */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    当前配置
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="text-2xl font-bold text-sakura-500">{stats.totalSelected}</div>
                      <div className="text-xs text-gray-500">已选组件</div>
                    </div>
                    {hasMapTemplate && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-2xl font-bold text-blue-500">{stats.totalPlaced}</div>
                        <div className="text-xs text-gray-500">已放置</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 已选组件列表 */}
                {selectedMerchantComponentIds.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      已选组件
                    </h4>
                    <div className="space-y-1.5">
                      {selectedMerchantComponentIds.map((id) => {
                        const component = getAllComponents().find((c) => c.id === id);
                        const config = getConfig(id);
                        if (!component) return null;

                        return (
                          <div
                            key={id}
                            onClick={() => setSelectedComponentId(id)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-100"
                          >
                            <GripVertical className="w-3 h-3 text-gray-300" />
                            <span className="text-sm">{component.icon}</span>
                            <span className="text-sm text-gray-700 flex-1 truncate">
                              {component.name}
                            </span>
                            {config?.hotmapX != null && (
                              <Layers className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 使用提示 */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700 space-y-1">
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
