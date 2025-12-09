"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Plus, X, Sparkles, ChevronRight } from "lucide-react";
import Hotspot from "../InteractiveKimonoMap/Hotspot";
import type { MapData, HotspotData } from "../InteractiveKimonoMap/types";

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
  price?: number;
  popular?: boolean;
  hotspot?: HotspotData;
}

export default function ServiceMap({
  includes,
  mapData,
  upgradeOptions = DEFAULT_UPGRADES,
}: ServiceMapProps) {
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  // 构建统一的项目列表
  const includedItems: UnifiedItem[] = mapData?.hotspots
    .filter(h => h.isIncluded !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(h => ({
      id: h.id,
      name: h.nameOverride || h.component.name,
      icon: h.component.icon || "◇",
      type: "included" as ItemType,
      description: h.descriptionOverride || h.component.description || undefined,
      highlights: h.highlightsOverride?.length ? h.highlightsOverride : h.component.highlights,
      hotspot: h,
    })) || [];

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

  // 处理热点点击
  const handleHotspotClick = (hotspot: HotspotData) => {
    const item = includedItems.find(i => i.id === hotspot.id);
    if (item) {
      setSelectedItem(selectedItem?.id === item.id ? null : item);
    }
  };

  // 处理卡片点击
  const handleItemClick = (item: UnifiedItem) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

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

        {/* 区域 1: 和服图片 (居中展示) */}
        {mapData && (
          <div className="relative p-6 md:p-8 bg-gradient-to-b from-gray-50/50 to-white">
            {/* 标题 */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-serif text-[#3D3A38] mb-1">
                套餐包含项目
              </h3>
              <p className="text-[13px] text-[#8B7355]">
                点击图片热点或下方卡片查看详情
              </p>
            </div>

            {/* 图片容器 - 居中 */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50 shadow-lg ring-1 ring-gray-200">
                  <Image
                    src={mapData.imageUrl}
                    alt="和服套餐配件示意图"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 400px"
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
                          isSelected={selectedItem?.id === hotspot.id}
                        />
                      ))}
                  </div>
                </div>

                {/* 图例 */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-sakura-500" />
                    <span className="text-[11px] text-gray-600">点击查看详情</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 区域 2: 已包含项目网格 */}
        {includedItems.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100">
            {/* 分组标题 */}
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-[13px] font-semibold text-[#3D3A38]">
                已包含
              </span>
              <span className="text-[11px] text-gray-400">
                {includedItems.length} 项
              </span>
            </div>

            {/* 网格卡片 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {includedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`
                    relative p-3 rounded-xl text-center transition-all duration-200
                    ${selectedItem?.id === item.id
                      ? "bg-sakura-50 ring-2 ring-sakura-400 shadow-sm"
                      : "bg-gray-50 hover:bg-gray-100 hover:shadow-sm"
                    }
                  `}
                >
                  {/* 图标 */}
                  <div className="text-2xl mb-1.5">{item.icon}</div>
                  {/* 名称 */}
                  <div className="text-[12px] font-medium text-gray-700 line-clamp-1">
                    {item.name}
                  </div>
                  {/* 已包含标记 */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 区域 3: 可升级项目网格 */}
        {upgradeItems.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 bg-gradient-to-b from-amber-50/30 to-white">
            {/* 分组标题 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-sakura-500" />
                <span className="text-[13px] font-semibold text-[#3D3A38]">
                  可升级
                </span>
                <span className="text-[11px] text-gray-400">
                  预订时可选
                </span>
              </div>
            </div>

            {/* 网格卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {upgradeItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`
                    relative p-4 rounded-xl text-left transition-all duration-200
                    ${selectedItem?.id === item.id
                      ? "bg-sakura-50 ring-2 ring-sakura-400 shadow-sm"
                      : "bg-white border border-gray-200 hover:border-sakura-300 hover:shadow-sm"
                    }
                  `}
                >
                  {/* 人气标记 */}
                  {item.popular && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-sakura-500 text-white text-[10px] font-semibold rounded-full shadow-sm">
                      人气
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* 图标 */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                      {item.icon}
                    </div>
                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-gray-800 mb-0.5">
                        {item.name}
                      </div>
                      <div className="text-[13px] font-bold text-sakura-600">
                        +¥{((item.price || 0) / 100).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 无 mapData 时的简化视图 */}
        {!mapData && upgradeItems.length === 0 && (
          <div className="p-8 text-center bg-gray-50/30">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-sakura-500" />
            </div>
            <h4 className="text-[16px] font-semibold text-gray-900 mb-2">
              精选和服套餐
            </h4>
            <p className="text-[14px] text-gray-500 max-w-md mx-auto">
              我们精心挑选了高品质和服及配件，确保您获得完美的和服体验
            </p>
          </div>
        )}
      </div>

      {/* 详情弹出层 */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />

          {/* 弹出卡片 */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            {/* 移动端拖拽指示 */}
            <div className="sm:hidden flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* 头部 */}
            <div className="flex items-start justify-between p-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center text-3xl
                  ${selectedItem.type === "included"
                    ? "bg-emerald-50"
                    : "bg-sakura-50"
                  }
                `}>
                  {selectedItem.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#3D3A38]">
                    {selectedItem.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedItem.type === "included" ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-emerald-600 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        套餐已包含
                      </span>
                    ) : (
                      <span className="text-[14px] font-bold text-sakura-600">
                        +¥{((selectedItem.price || 0) / 100).toLocaleString()}
                      </span>
                    )}
                    {selectedItem.popular && (
                      <span className="px-2 py-0.5 bg-sakura-100 text-sakura-700 text-[10px] font-semibold rounded-full">
                        人气推荐
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[50vh]">
              {/* 描述 */}
              {selectedItem.description && (
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  {selectedItem.description}
                </p>
              )}

              {/* 亮点 */}
              {selectedItem.highlights && selectedItem.highlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                    特点
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-[13px] rounded-full"
                      >
                        <ChevronRight className="w-3 h-3 text-sakura-400" />
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hotspot 特有信息 */}
              {selectedItem.hotspot?.tierLabel && (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-500">等级</span>
                  <span className="text-[13px] text-sakura-600 font-medium">
                    {selectedItem.hotspot.tierLabel}
                  </span>
                </div>
              )}

              {selectedItem.hotspot?.customNote && (
                <div className="p-3 bg-sakura-50 rounded-xl border border-sakura-100">
                  <p className="text-[13px] text-sakura-700">
                    💡 {selectedItem.hotspot.customNote}
                  </p>
                </div>
              )}
            </div>

            {/* 底部操作 */}
            {selectedItem.type === "upgrade" && (
              <div className="p-5 pt-4 border-t border-gray-100 bg-gray-50/50">
                <button className="w-full py-3 bg-sakura-600 hover:bg-sakura-700 text-white font-semibold rounded-xl transition-colors">
                  添加到预订
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
