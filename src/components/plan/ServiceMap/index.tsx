"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Check, Sparkles, ChevronRight, Package, Info, Plus } from "lucide-react";
import ImageGalleryModal from "@/components/ImageGalleryModal";
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

interface ServiceMapProps {
  includes: string[];
  mapData?: MapData | null;
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

// 项目类型
interface IncludedItem {
  id: string;
  name: string;
  icon: string;
  description?: string;
  highlights?: string[];
  images?: string[];
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
  items: IncludedItem[];
}

export default function ServiceMap({
  includes,
  mapData,
}: ServiceMapProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showGuideAnimation, setShowGuideAnimation] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");
  // 图片画廊状态
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  // 构建包含项目列表
  const includedItems: IncludedItem[] = mapData?.hotspots
    .filter(h => h.isIncluded !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(h => ({
      id: h.id,
      name: h.component.name,
      icon: h.component.icon || "◇",
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

  // 获取当前选中的项目
  const selectedItem = includedItems.find(item => item.id === selectedItemId);

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
  const handleItemClick = useCallback((item: IncludedItem) => {
    setSelectedItemId(item.id);
    setActiveTab("detail"); // 自动切换到详情 Tab
    setShowMobileDetail(true);
  }, []);

  // 打开图片画廊
  const openGallery = useCallback((images: string[], index: number) => {
    setGalleryImages(images);
    setGalleryIndex(index);
    setShowGallery(true);
  }, []);

  // 如果没有热图数据，不渲染
  if (!mapData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 区块标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
        <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
          Package Contents
        </span>
      </div>

      {/* 主容器 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* 桌面端：双栏布局 + Tab 切换（热图 70% | Tab 30%） */}
        <div className="hidden lg:flex h-[780px]">

          {/* ==================== 左侧：热图区域 (70%) ==================== */}
          {mapData && (
            <div className="w-[70%] flex-shrink-0 py-3 px-2 bg-gradient-to-b from-wabi-50/30 to-white border-r border-gray-100 flex flex-col">
              {/* 图片容器 - 高度优先填满 */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="relative h-full aspect-[3/4]">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-wabi-100 to-wabi-50 shadow-lg ring-1 ring-wabi-200">
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
              <div className="mt-2 flex items-center justify-center gap-2 text-[12px] text-gray-500">
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
                            <span className="text-[12px] text-gray-400">({group.items.length})</span>
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
                                    ? "bg-sakura-100 ring-1 ring-sakura-400"
                                    : hoveredItemId === item.id
                                      ? "bg-sakura-50"
                                      : "bg-wabi-50 hover:bg-wabi-100"
                                  }
                                `}
                              >
                                <span className="text-[15px]">{item.icon}</span>
                                <span className="text-[12px] font-medium text-gray-700 truncate flex-1">
                                  {item.name}
                                </span>
                                <Check className="w-3.5 h-3.5 text-sakura-500 flex-shrink-0" />
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
                                    ? "bg-sakura-100 ring-1 ring-sakura-400"
                                    : hoveredItemId === item.id
                                      ? "bg-sakura-50"
                                      : "bg-wabi-50 hover:bg-wabi-100"
                                  }
                                `}
                              >
                                <span className="text-[15px]">{item.icon}</span>
                                <span className="text-[12px] font-medium text-gray-700 truncate flex-1">
                                  {item.name}
                                </span>
                                <Check className="w-3.5 h-3.5 text-sakura-500 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-sakura-100">
                          {selectedItem.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[16px] font-semibold text-gray-900 mb-1">
                            {selectedItem.name}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-sakura-600 font-medium">
                            <Check className="w-4 h-4" />
                            套餐已包含
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 详情内容 */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      {/* 图片画廊 */}
                      {selectedItem.images && selectedItem.images.length > 0 && (
                        <div>
                          <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-[0.25em] mb-3">
                            实物展示
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedItem.images.slice(0, 4).map((img, i) => (
                              <button
                                key={i}
                                onClick={() => openGallery(selectedItem.images!, i)}
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
                            <p className="text-[12px] text-gray-400 mt-2 text-center">
                              +{selectedItem.images.length - 4} 更多图片
                            </p>
                          )}
                        </div>
                      )}

                      {/* 描述 */}
                      {selectedItem.description && (
                        <div>
                          <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-[0.25em] mb-2">
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
                          <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-[0.25em] mb-2">
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

                    </div>
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
            <div className="p-4 bg-gradient-to-b from-wabi-50/50 to-white border-b border-wabi-100">
              <div className="flex justify-center">
                <div className="relative w-full max-w-xs">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-b from-wabi-100 to-wabi-50 shadow-lg ring-1 ring-wabi-200">
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
                  <Check className="w-4 h-4 text-sakura-500" />
                  <span className="text-[14px] font-semibold text-gray-900">套餐包含</span>
                  <span className="text-[12px] text-gray-400">{includedItems.length} 项</span>
                </div>

                <div className="space-y-3">
                  {categoryGroups.map((group) => (
                    <div key={group.key}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[14px]">{group.icon}</span>
                        <span className="text-[12px] text-gray-500">{group.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`
                              relative flex flex-col items-center p-2.5 rounded-xl transition-all duration-200
                              ${selectedItemId === item.id
                                ? "bg-sakura-50 ring-2 ring-emerald-400"
                                : "bg-gray-50 hover:bg-gray-100"
                              }
                            `}
                          >
                            <span className="text-xl mb-1">{item.icon}</span>
                            <span className="text-[12px] font-medium text-gray-700 text-center line-clamp-1">
                              {item.name}
                            </span>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-sakura-500 rounded-full flex items-center justify-center">
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
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* 拖拽指示 */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* 头部 */}
              <div className="flex items-start justify-between px-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-sakura-100">
                    {selectedItem.icon}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-gray-900">
                      {selectedItem.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[13px] text-sakura-600 font-medium">
                      <Check className="w-4 h-4" />
                      套餐已包含
                    </span>
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
                          openGallery(selectedItem.images!, i);
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

            </div>
          </div>
        )}
      </div>

      {/* 图片画廊 - 复用 ImageGalleryModal */}
      <ImageGalleryModal
        images={galleryImages}
        initialIndex={galleryIndex}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        planName={selectedItem?.name || "服务详情"}
      />
    </div>
  );
}
