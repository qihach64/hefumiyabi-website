"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Check, Plus, Sparkles, ChevronRight, Star, X, Package, Info } from "lucide-react";
import Hotspot from "../InteractiveKimonoMap/Hotspot";
import type { MapData, HotspotData } from "../InteractiveKimonoMap/types";
import type { OutfitCategory } from "@prisma/client";

// v10.2: OUTFIT 分类配置
const OUTFIT_CATEGORY_CONFIG: Record<OutfitCategory, { label: string; icon: string; order: number }> = {
  MAIN_GARMENT: { label: "主体服装", icon: "👘", order: 1 },
  OBI_SET: { label: "腰带组", icon: "🎀", order: 2 },
  INNERWEAR: { label: "内搭层", icon: "👕", order: 3 },
  STYLING: { label: "造型服务", icon: "💇", order: 4 },
  ACCESSORIES: { label: "随身配件", icon: "👜", order: 5 },
  FOOTWEAR: { label: "足部穿着", icon: "👡", order: 6 },
};

interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  popular?: boolean;
  highlights?: string[];
}

interface ServiceMapProps {
  includes: string[];
  mapData?: MapData | null;
  upgradeOptions?: UpgradeOption[];
}

// Demo 图片（展示用）
const DEMO_IMAGES: Record<string, string[]> = {
  // 和服主体
  kimono: [
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1545048702-79362596cdc9?w=400&h=500&fit=crop",
  ],
  // 腰带
  obi: [
    "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=300&fit=crop",
  ],
  // 发型
  hair: [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
  ],
  // 配件
  accessories: [
    "https://images.unsplash.com/photo-1611085583191-a3b181a88578?w=400&h=400&fit=crop",
  ],
  // 草履
  footwear: [
    "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop",
  ],
};

// 默认升级选项
const DEFAULT_UPGRADES: UpgradeOption[] = [
  {
    id: "photo",
    name: "专业摄影",
    description: "专业摄影师跟拍 30 分钟，含 20 张精修照片",
    price: 300000,
    icon: "📷",
    popular: true,
    highlights: ["专业摄影师", "30分钟跟拍", "20张精修"],
  },
  {
    id: "makeup",
    name: "专业化妆",
    description: "资深化妆师全脸妆容，含卸妆",
    price: 250000,
    icon: "💄",
    highlights: ["资深化妆师", "全脸妆容", "含卸妆"],
  },
  {
    id: "premium-hairstyle",
    name: "高级发型",
    description: "复杂盘发造型，含发饰",
    price: 200000,
    icon: "💇",
    highlights: ["复杂盘发", "精选发饰", "持久定型"],
  },
  {
    id: "extension",
    name: "延长归还",
    description: "延长 2 小时归还时间",
    price: 100000,
    icon: "⏰",
    highlights: ["额外2小时", "灵活安排", "更多拍照时间"],
  },
];

// 统一的项目类型
type ItemType = "included" | "upgrade";
interface UnifiedItem {
  id: string;
  name: string;
  icon: string;
  type: ItemType;
  description?: string;
  highlights?: string[];
  images?: string[]; // 组件图片
  price?: number;
  popular?: boolean;
  hotspot?: HotspotData;
  outfitCategory?: OutfitCategory | null;
}

// 根据分类获取 demo 图片
function getDemoImages(category?: OutfitCategory | null): string[] {
  if (!category) return [];
  switch (category) {
    case "MAIN_GARMENT":
      return DEMO_IMAGES.kimono;
    case "OBI_SET":
      return DEMO_IMAGES.obi;
    case "STYLING":
      return DEMO_IMAGES.hair;
    case "ACCESSORIES":
      return DEMO_IMAGES.accessories;
    case "FOOTWEAR":
      return DEMO_IMAGES.footwear;
    default:
      return [];
  }
}

// v10.2: 分类分组
interface CategoryGroup {
  key: OutfitCategory;
  label: string;
  icon: string;
  items: UnifiedItem[];
}

export default function ServiceMap({
  includes,
  mapData,
  upgradeOptions = DEFAULT_UPGRADES,
}: ServiceMapProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showGuideAnimation, setShowGuideAnimation] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");

  // Refs for scroll-into-view
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 首次进入时显示引导动画，3秒后自动关闭
  useEffect(() => {
    const timer = setTimeout(() => setShowGuideAnimation(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // 自动选中第一个组件（提供默认详情）
  useEffect(() => {
    if (!selectedItemId && mapData?.hotspots && mapData.hotspots.length > 0) {
      const firstIncluded = mapData.hotspots.find(h => h.isIncluded !== false);
      if (firstIncluded) {
        setSelectedItemId(firstIncluded.id);
      }
    }
  }, [mapData, selectedItemId]);

  // 构建统一的项目列表
  const includedItems: UnifiedItem[] = mapData?.hotspots
    .filter(h => h.isIncluded !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(h => ({
      id: h.id,
      name: h.component.name,
      icon: h.component.icon || "◇",
      type: "included" as ItemType,
      description: h.component.description || undefined,
      highlights: h.component.highlights,
      // 使用组件的实际图片，如果没有则使用 demo 图片
      images: h.component.images?.length > 0
        ? h.component.images
        : getDemoImages(h.component.outfitCategory),
      hotspot: h,
      outfitCategory: h.component.outfitCategory,
    })) || [];

  // v10.2: 按 outfitCategory 分组
  const categoryGroups: CategoryGroup[] = Object.entries(OUTFIT_CATEGORY_CONFIG)
    .map(([key, config]) => ({
      key: key as OutfitCategory,
      label: config.label,
      icon: config.icon,
      items: includedItems.filter(item => item.outfitCategory === key),
    }))
    .filter(group => group.items.length > 0)
    .sort((a, b) => OUTFIT_CATEGORY_CONFIG[a.key].order - OUTFIT_CATEGORY_CONFIG[b.key].order);

  // 未分类的项目
  const uncategorizedItems = includedItems.filter(item => !item.outfitCategory);

  const upgradeItems: UnifiedItem[] = upgradeOptions.map(opt => ({
    id: opt.id,
    name: opt.name,
    icon: opt.icon,
    type: "upgrade" as ItemType,
    description: opt.description,
    highlights: opt.highlights,
    price: opt.price,
    popular: opt.popular,
  }));

  // 获取当前选中的项目
  const allItems = [...includedItems, ...upgradeItems];
  const selectedItem = allItems.find(item => item.id === selectedItemId);

  // 点击热点
  const handleHotspotClick = useCallback((hotspot: HotspotData) => {
    setSelectedItemId(hotspot.id);
    setActiveTab("detail"); // 自动切换到详情 Tab
    setShowMobileDetail(true);
    // 滚动到对应组件
    const itemEl = itemRefs.current.get(hotspot.id);
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // 点击组件
  const handleItemClick = useCallback((item: UnifiedItem) => {
    setSelectedItemId(item.id);
    setActiveTab("detail"); // 自动切换到详情 Tab
    setShowMobileDetail(true);
  }, []);

  // 如果没有数据，不渲染
  if (!mapData && upgradeOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 区块标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
        <span className="text-[11px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
          Package Contents
        </span>
      </div>

      {/* 主容器 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* ==================== 快速概览条 ==================== */}
        <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-[13px] font-medium text-gray-700">
              本套餐包含 <span className="text-emerald-600 font-semibold">{includedItems.length}</span> 项服务
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {categoryGroups.map((group) => (
              <div
                key={group.key}
                className="flex items-center gap-1 px-2 py-1 bg-white rounded-full border border-gray-200 text-[12px]"
                title={group.label}
              >
                <span>{group.icon}</span>
                <span className="text-gray-500">{group.items.length}</span>
              </div>
            ))}
          </div>
          {upgradeItems.length > 0 && (
            <>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[12px] text-amber-700">
                  {upgradeItems.length} 项可升级
                </span>
              </div>
            </>
          )}
        </div>

        {/* 桌面端：双栏布局 + Tab 切换（热图 70% | Tab 30%） */}
        <div className="hidden lg:flex h-[780px]">

          {/* ==================== 左侧：热图区域 (70%) ==================== */}
          {mapData && (
            <div className="w-[70%] flex-shrink-0 py-3 px-2 bg-gradient-to-b from-gray-50/30 to-white border-r border-gray-100 flex flex-col">
              {/* 图片容器 - 高度优先填满 */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="relative h-full aspect-[3/4]">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50 shadow-lg ring-1 ring-gray-200">
                    <Image
                      src={mapData.imageUrl}
                      alt="和服套餐配件示意图"
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      priority
                      unoptimized
                    />

                    {/* 热点层 */}
                    <div className="absolute inset-0">
                      {mapData.hotspots
                        .filter(h => h.isIncluded !== false)
                        .map((hotspot) => (
                          <Hotspot
                            key={hotspot.id}
                            hotspot={hotspot}
                            onClick={() => handleHotspotClick(hotspot)}
                            isSelected={selectedItemId === hotspot.id}
                            isHovered={hoveredItemId === hotspot.id}
                            showGuide={showGuideAnimation}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 图例 */}
              <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-gray-500">
                <div className={`w-2 h-2 rounded-full bg-sakura-500 ${showGuideAnimation ? 'animate-ping' : ''}`} />
                <span>点击热点查看详情</span>
              </div>
            </div>
          )}

          {/* ==================== 右侧：Tab 切换区域 (30%) ==================== */}
          <div className={`${mapData ? 'w-[30%]' : 'w-full'} flex-shrink-0 flex flex-col`}>
            {/* Tab 标签栏 */}
            <div className="h-12 px-2 bg-gray-50/80 border-b border-gray-100 flex items-center gap-1">
              <button
                onClick={() => setActiveTab("list")}
                className={`
                  flex-1 h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-200
                  ${activeTab === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Package className="w-4 h-4" />
                  套餐内容
                </span>
              </button>
              <button
                onClick={() => setActiveTab("detail")}
                className={`
                  flex-1 h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-200
                  ${activeTab === "detail"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }
                  ${selectedItem ? "" : "opacity-50 cursor-not-allowed"}
                `}
                disabled={!selectedItem}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Info className="w-4 h-4" />
                  详情
                  {selectedItem && (
                    <span className="w-2 h-2 rounded-full bg-sakura-500" />
                  )}
                </span>
              </button>
            </div>

            {/* Tab 内容区域 */}
            <div className="flex-1 overflow-hidden">
              {/* Tab 1: 套餐内容列表 */}
              <div className={`h-full overflow-y-auto ${activeTab === "list" ? "block" : "hidden"}`}>
                {/* 已包含项目 */}
                {categoryGroups.length > 0 && (
                  <div className="p-4">
                    {/* 分类列表 */}
                    <div className="space-y-4">
                      {categoryGroups.map((group) => (
                        <div key={group.key}>
                          {/* 分类小标题 */}
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="text-[14px]">{group.icon}</span>
                            <span className="text-[12px] text-gray-500 font-medium">{group.label}</span>
                            <span className="text-[11px] text-gray-400">({group.items.length})</span>
                          </div>

                          {/* 组件按钮 - 双列网格 */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {group.items.map((item) => (
                              <button
                                key={item.id}
                                ref={(el) => {
                                  if (el) itemRefs.current.set(item.id, el);
                                }}
                                onClick={() => handleItemClick(item)}
                                onMouseEnter={() => setHoveredItemId(item.id)}
                                onMouseLeave={() => setHoveredItemId(null)}
                                className={`
                                  flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150
                                  ${selectedItemId === item.id
                                    ? "bg-emerald-100 ring-1 ring-emerald-400"
                                    : hoveredItemId === item.id
                                      ? "bg-emerald-50"
                                      : "bg-gray-50 hover:bg-gray-100"
                                  }
                                `}
                              >
                                <span className="text-[15px]">{item.icon}</span>
                                <span className="text-[12px] font-medium text-gray-700 truncate flex-1">
                                  {item.name}
                                </span>
                                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* 未分类项目 */}
                      {uncategorizedItems.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="text-[14px]">📦</span>
                            <span className="text-[12px] text-gray-500 font-medium">其他</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {uncategorizedItems.map((item) => (
                              <button
                                key={item.id}
                                ref={(el) => {
                                  if (el) itemRefs.current.set(item.id, el);
                                }}
                                onClick={() => handleItemClick(item)}
                                onMouseEnter={() => setHoveredItemId(item.id)}
                                onMouseLeave={() => setHoveredItemId(null)}
                                className={`
                                  flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150
                                  ${selectedItemId === item.id
                                    ? "bg-emerald-100 ring-1 ring-emerald-400"
                                    : hoveredItemId === item.id
                                      ? "bg-emerald-50"
                                      : "bg-gray-50 hover:bg-gray-100"
                                  }
                                `}
                              >
                                <span className="text-[15px]">{item.icon}</span>
                                <span className="text-[12px] font-medium text-gray-700 truncate flex-1">
                                  {item.name}
                                </span>
                                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 增值服务 */}
                {upgradeItems.length > 0 && (
                  <div className="p-4 border-t border-gray-100 bg-gradient-to-b from-amber-50/50 to-white">
                    {/* 分类标题 */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Plus className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[13px] font-semibold text-amber-800">升级推荐</span>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                        可选
                      </span>
                    </div>

                    {/* 增值服务列表 */}
                    <div className="grid grid-cols-2 gap-2">
                      {upgradeItems.map((item) => (
                        <button
                          key={item.id}
                          ref={(el) => {
                            if (el) itemRefs.current.set(item.id, el);
                          }}
                          onClick={() => handleItemClick(item)}
                          onMouseEnter={() => setHoveredItemId(item.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          className={`
                            relative flex flex-col items-start p-3 rounded-xl text-left transition-all duration-150
                            ${selectedItemId === item.id
                              ? "bg-amber-100 ring-1 ring-amber-400"
                              : hoveredItemId === item.id
                                ? "bg-amber-50 border-amber-300"
                                : "bg-white border border-gray-200 hover:border-amber-300"
                            }
                          `}
                        >
                          {item.popular && (
                            <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-semibold rounded-full">
                              人气
                            </div>
                          )}
                          <span className="text-xl mb-1">{item.icon}</span>
                          <span className="text-[12px] font-medium text-gray-800">{item.name}</span>
                          <span className="text-[13px] font-bold text-sakura-600">
                            +¥{((item.price || 0) / 100).toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tab 2: 详情面板 */}
              <div className={`h-full flex flex-col ${activeTab === "detail" ? "block" : "hidden"}`}>
                {selectedItem ? (
                  <>
                    {/* 详情头部 */}
                    <div className="p-5 border-b border-gray-100 bg-white">
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-14 h-14 rounded-xl flex items-center justify-center text-2xl
                          ${selectedItem.type === "included" ? "bg-emerald-100" : "bg-amber-100"}
                        `}>
                          {selectedItem.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[16px] font-semibold text-gray-900 mb-1">
                            {selectedItem.name}
                          </h3>
                          {selectedItem.type === "included" ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600 font-medium">
                              <Check className="w-4 h-4" />
                              套餐已包含
                            </span>
                          ) : (
                            <span className="text-[15px] font-bold text-sakura-600">
                              +¥{((selectedItem.price || 0) / 100).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 详情内容 */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      {/* 图片画廊 */}
                      {selectedItem.images && selectedItem.images.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            实物展示
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedItem.images.slice(0, 4).map((img, i) => (
                              <button
                                key={i}
                                onClick={() => setLightboxImage(img)}
                                className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-sakura-400 transition-all group"
                              >
                                <Image
                                  src={img}
                                  alt={`${selectedItem.name} 图片 ${i + 1}`}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="150px"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4 text-gray-700" />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                          {selectedItem.images.length > 4 && (
                            <p className="text-[10px] text-gray-400 mt-2 text-center">
                              +{selectedItem.images.length - 4} 更多图片
                            </p>
                          )}
                        </div>
                      )}

                      {/* 描述 */}
                      {selectedItem.description && (
                        <div>
                          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            简介
                          </h4>
                          <p className="text-[14px] text-gray-600 leading-relaxed">
                            {selectedItem.description}
                          </p>
                        </div>
                      )}

                      {/* 亮点 */}
                      {selectedItem.highlights && selectedItem.highlights.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            特点
                          </h4>
                          <div className="space-y-2">
                            {selectedItem.highlights.map((h, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 px-3 py-2.5 bg-gray-50 rounded-lg"
                              >
                                <ChevronRight className="w-4 h-4 text-sakura-400 flex-shrink-0 mt-0.5" />
                                <span className="text-[13px] text-gray-700 leading-relaxed">{h}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 人气标签 */}
                      {selectedItem.popular && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200">
                          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                          <span className="text-[13px] font-medium text-amber-700">人气推荐服务</span>
                        </div>
                      )}
                    </div>

                    {/* 增值服务操作按钮 */}
                    {selectedItem.type === "upgrade" && (
                      <div className="p-4 border-t border-gray-100 bg-white">
                        <button className="w-full py-3 bg-sakura-600 hover:bg-sakura-700 text-white text-[14px] font-semibold rounded-xl transition-colors shadow-sm">
                          添加到预订
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* 未选中状态 */
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-[13px] text-gray-500 mb-1">请先选择一个组件</p>
                      <p className="text-[12px] text-gray-400">点击热点或列表项查看详情</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 移动端布局 ==================== */}
        <div className="lg:hidden">
          {/* 热图区域 */}
          {mapData && (
            <div className="p-4 bg-gradient-to-b from-gray-50/50 to-white border-b border-gray-100">
              <div className="flex justify-center">
                <div className="relative w-full max-w-xs">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50 shadow-lg ring-1 ring-gray-200">
                    <Image
                      src={mapData.imageUrl}
                      alt="和服套餐配件示意图"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 320px"
                      priority
                      unoptimized
                    />
                    <div className="absolute inset-0">
                      {mapData.hotspots
                        .filter(h => h.isIncluded !== false)
                        .map((hotspot) => (
                          <Hotspot
                            key={hotspot.id}
                            hotspot={hotspot}
                            onClick={() => handleHotspotClick(hotspot)}
                            isSelected={selectedItemId === hotspot.id}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 组件列表 */}
          <div className="p-4">
            {/* 已包含 */}
            {categoryGroups.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-[13px] font-semibold text-gray-900">套餐包含</span>
                  <span className="text-[11px] text-gray-400">{includedItems.length} 项</span>
                </div>

                <div className="space-y-3">
                  {categoryGroups.map((group) => (
                    <div key={group.key}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[14px]">{group.icon}</span>
                        <span className="text-[11px] text-gray-500">{group.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`
                              relative flex flex-col items-center p-2.5 rounded-xl transition-all duration-200
                              ${selectedItemId === item.id
                                ? "bg-emerald-50 ring-2 ring-emerald-400"
                                : "bg-gray-50 hover:bg-gray-100"
                              }
                            `}
                          >
                            <span className="text-xl mb-1">{item.icon}</span>
                            <span className="text-[11px] font-medium text-gray-700 text-center line-clamp-1">
                              {item.name}
                            </span>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 增值服务 */}
            {upgradeItems.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">增值服务</span>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                    预订时可选
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {upgradeItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`
                        relative p-3 rounded-xl text-left transition-all duration-200
                        ${selectedItemId === item.id
                          ? "bg-sakura-50 ring-2 ring-sakura-400"
                          : "bg-white border border-gray-200 hover:border-sakura-300"
                        }
                      `}
                    >
                      {item.popular && (
                        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-semibold rounded-full">
                          人气
                        </div>
                      )}
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-[12px] font-medium text-gray-800 mb-0.5">{item.name}</div>
                      <div className="text-[13px] font-bold text-sakura-600">
                        +¥{((item.price || 0) / 100).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 移动端底部抽屉 */}
        {showMobileDetail && selectedItem && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* 遮罩 */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMobileDetail(false)}
            />

            {/* 抽屉内容 */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* 拖拽指示 */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* 头部 */}
              <div className="flex items-start justify-between px-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center text-3xl
                    ${selectedItem.type === "included" ? "bg-emerald-100" : "bg-sakura-100"}
                  `}>
                    {selectedItem.icon}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-gray-900">
                      {selectedItem.name}
                    </h3>
                    {selectedItem.type === "included" ? (
                      <span className="inline-flex items-center gap-1 text-[13px] text-emerald-600 font-medium">
                        <Check className="w-4 h-4" />
                        套餐已包含
                      </span>
                    ) : (
                      <span className="text-[16px] font-bold text-sakura-600">
                        +¥{((selectedItem.price || 0) / 100).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* 内容 */}
              <div className="px-5 pb-5 space-y-4 overflow-y-auto max-h-[45vh]">
                {/* 图片画廊 - 移动端 */}
                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {selectedItem.images.slice(0, 4).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setShowMobileDetail(false);
                          setLightboxImage(img);
                        }}
                        className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
                      >
                        <Image
                          src={img}
                          alt={`${selectedItem.name} 图片 ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}

                {selectedItem.description && (
                  <p className="text-[14px] text-gray-600 leading-relaxed">
                    {selectedItem.description}
                  </p>
                )}

                {selectedItem.highlights && selectedItem.highlights.length > 0 && (
                  <div className="space-y-1.5">
                    {selectedItem.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <ChevronRight className="w-4 h-4 text-sakura-400" />
                        <span className="text-[13px] text-gray-700">{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部操作 */}
              {selectedItem.type === "upgrade" && (
                <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                  <button className="w-full py-3 bg-sakura-600 hover:bg-sakura-700 text-white text-[15px] font-semibold rounded-xl transition-colors">
                    添加到预订
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== Lightbox 图片查看器 ==================== */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* 图片 */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxImage}
              alt="放大查看"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 80vw"
              priority
              unoptimized
            />
          </div>

          {/* 图片信息 */}
          {selectedItem && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-full">
              <p className="text-white text-sm font-medium">
                {selectedItem.icon} {selectedItem.name}
              </p>
            </div>
          )}

          {/* 提示 */}
          <p className="absolute bottom-4 right-4 text-white/50 text-xs">
            点击任意处关闭
          </p>
        </div>
      )}
    </div>
  );
}
