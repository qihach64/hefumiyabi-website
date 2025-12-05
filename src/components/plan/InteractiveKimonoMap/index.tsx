"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import Hotspot from "./Hotspot";
import type { InteractiveKimonoMapProps, HotspotData } from "./types";

// 内联详情组件
function InlineDetail({ hotspot, onClose }: { hotspot: HotspotData; onClose: () => void }) {
  const { component, isIncluded = true } = hotspot;
  const displayDescription = hotspot.descriptionOverride || component.description;
  const displayHighlights =
    hotspot.highlightsOverride && hotspot.highlightsOverride.length > 0
      ? hotspot.highlightsOverride
      : component.highlights;

  const getTypeLabel = () => {
    switch (component.type) {
      case "KIMONO": return "和服本体";
      case "STYLING": return "造型服务";
      case "ACCESSORY": return "配件";
      case "EXPERIENCE": return "增值体验";
      default: return "配件";
    }
  };

  return (
    <div className="mt-2 p-4 bg-white border border-gray-200 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
      {/* 类型和状态 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-gray-500">{getTypeLabel()}</span>
          {isIncluded ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[12px] font-medium rounded-full">
              <Check className="w-3 h-3" />
              已包含
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[12px] font-medium rounded-full">
              可加购
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* 等级标签 */}
      {hotspot.tierLabel && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-gray-500">等级：</span>
          <span className="px-2 py-0.5 bg-sakura-50 text-sakura-700 text-[12px] font-medium rounded-lg">
            {hotspot.tierLabel}
          </span>
        </div>
      )}

      {/* 描述 */}
      {displayDescription && (
        <p className="text-[14px] text-gray-600 leading-relaxed">
          {displayDescription}
        </p>
      )}

      {/* 亮点列表 */}
      {displayHighlights && displayHighlights.length > 0 && (
        <div className="space-y-1.5">
          {displayHighlights.map((highlight, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-sakura-500 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600">{highlight}</span>
            </div>
          ))}
        </div>
      )}

      {/* 自定义说明 */}
      {hotspot.customNote && (
        <div className="p-2.5 bg-sakura-50 rounded-lg">
          <p className="text-[13px] text-sakura-700">{hotspot.customNote}</p>
        </div>
      )}

      {/* 升级选项 */}
      {component.upgradesTo && component.upgradesTo.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[13px] text-gray-500 mb-2">升级选项</p>
          <div className="space-y-1.5">
            {component.upgradesTo.map((upgrade) => (
              <div
                key={upgrade.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-[13px]"
              >
                <div className="flex items-center gap-2">
                  <span>{upgrade.icon || "📍"}</span>
                  <span className="text-gray-900">{upgrade.name}</span>
                </div>
                <span className="text-sakura-600 font-medium">
                  +¥{upgrade.upgradeCost?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InteractiveKimonoMap({
  mapData,
  onHotspotClick,
  className = "",
}: InteractiveKimonoMapProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);

  const handleHotspotClick = (hotspot: HotspotData) => {
    // 点击同一个则折叠，否则切换
    if (selectedHotspot?.id === hotspot.id) {
      setSelectedHotspot(null);
    } else {
      setSelectedHotspot(hotspot);
      onHotspotClick?.(hotspot);
    }
  };

  const handleClosePanel = () => {
    setSelectedHotspot(null);
  };

  // 按 displayOrder 排序热点
  const sortedHotspots = [...mapData.hotspots].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  // 统计已包含和可加购数量
  const includedCount = sortedHotspots.filter((h) => h.isIncluded !== false).length;
  const addonCount = sortedHotspots.filter((h) => h.isIncluded === false).length;

  return (
    <div className={`relative ${className}`}>
      {/* 标题 */}
      <div className="mb-6">
        <h3 className="text-[22px] font-semibold text-gray-900 mb-2">
          套餐包含项目
        </h3>
        <p className="text-[15px] text-gray-500">
          点击图片上的标记或右侧列表查看配件详情
        </p>
      </div>

      {/* 主容器 - 左右分栏布局 */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* 左侧：热点映射图 */}
        <div className="w-full lg:w-[55%] lg:flex-shrink-0">
          <div className="relative bg-gray-50 rounded-2xl overflow-hidden">
            {/* 图片容器 */}
            <div className="relative aspect-[2/3]">
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
                {sortedHotspots.map((hotspot) => (
                  <Hotspot
                    key={hotspot.id}
                    hotspot={hotspot}
                    onClick={() => handleHotspotClick(hotspot)}
                    isSelected={selectedHotspot?.id === hotspot.id}
                  />
                ))}
              </div>
            </div>

            {/* 图例 */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-6 bg-white/95 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-sakura-500" />
                <span className="text-[13px] text-gray-700 font-medium">
                  已包含 ({includedCount})
                </span>
              </div>
              {addonCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-400" />
                  <span className="text-[13px] text-gray-700 font-medium">
                    可加购 ({addonCount})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：配件列表（Accordion 模式） */}
        <div className="w-full lg:w-[45%] lg:flex-shrink-0">
          {/* 配件列表标题 */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[16px] font-semibold text-gray-900">
              全部配件
            </h4>
            <span className="text-[14px] text-gray-500">
              {sortedHotspots.length} 项
            </span>
          </div>

          {/* 配件列表 - Accordion */}
          <div className="space-y-2">
            {sortedHotspots.map((hotspot) => {
              const { component, isIncluded = true } = hotspot;
              const displayName = hotspot.nameOverride || component.name;
              const icon = component.icon || "📍";
              const isSelected = selectedHotspot?.id === hotspot.id;

              return (
                <div key={hotspot.id}>
                  {/* 配件项 */}
                  <button
                    onClick={() => handleHotspotClick(hotspot)}
                    className={`
                      w-full flex items-center gap-3 p-3 lg:p-4 rounded-xl text-left
                      transition-all duration-200
                      ${
                        isSelected
                          ? "bg-sakura-50 border-2 border-sakura-400"
                          : "bg-white border border-gray-200 hover:border-sakura-300 hover:bg-sakura-50/50"
                      }
                    `}
                  >
                    {/* 图标 */}
                    <div
                      className={`
                        w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${isIncluded ? "bg-sakura-100" : "bg-gray-100"}
                      `}
                    >
                      <span className="text-[20px] lg:text-[22px]">{icon}</span>
                    </div>

                    {/* 文字信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] lg:text-[15px] font-medium text-gray-900 truncate">
                        {displayName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isIncluded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-sakura-600" />
                            <span className="text-[12px] lg:text-[13px] text-sakura-600 font-medium">
                              已包含
                            </span>
                          </>
                        ) : (
                          <span className="text-[12px] lg:text-[13px] text-gray-400">
                            可加购
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 展开/折叠图标 */}
                    <div className={`transition-transform duration-200 ${isSelected ? "rotate-180" : ""}`}>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>

                  {/* 展开的详情 - 桌面端 */}
                  {isSelected && (
                    <div className="hidden lg:block">
                      <InlineDetail hotspot={hotspot} onClose={handleClosePanel} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 详情面板 - 移动端底部弹出 */}
      {selectedHotspot && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleClosePanel}
          />

          {/* 面板 */}
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl max-h-[75vh] animate-in slide-in-from-bottom duration-300">
            {/* 拖拽指示条 */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* 头部 */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sakura-50 flex items-center justify-center">
                  <span className="text-[24px]">{selectedHotspot.component.icon || "📍"}</span>
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-gray-900">
                    {selectedHotspot.nameOverride || selectedHotspot.component.name}
                  </h3>
                  <span className="text-[13px] text-gray-500">
                    {selectedHotspot.component.type === "KIMONO" ? "和服本体" :
                     selectedHotspot.component.type === "STYLING" ? "造型服务" :
                     selectedHotspot.component.type === "EXPERIENCE" ? "增值体验" : "配件"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClosePanel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(75vh-100px)]">
              {/* 状态 */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${selectedHotspot.isIncluded !== false ? "bg-green-50" : "bg-gray-50"}`}>
                {selectedHotspot.isIncluded !== false ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-[14px] text-green-700 font-medium">套餐已包含</span>
                  </>
                ) : (
                  <span className="text-[14px] text-gray-600">可加购项目</span>
                )}
              </div>

              {/* 等级 */}
              {selectedHotspot.tierLabel && (
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-gray-600">等级：</span>
                  <span className="px-2.5 py-1 bg-sakura-50 text-sakura-700 text-[13px] font-medium rounded-lg">
                    {selectedHotspot.tierLabel}
                  </span>
                </div>
              )}

              {/* 描述 */}
              {(selectedHotspot.descriptionOverride || selectedHotspot.component.description) && (
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  {selectedHotspot.descriptionOverride || selectedHotspot.component.description}
                </p>
              )}

              {/* 亮点 */}
              {(() => {
                const highlights = selectedHotspot.highlightsOverride?.length
                  ? selectedHotspot.highlightsOverride
                  : selectedHotspot.component.highlights;
                return highlights?.length > 0 && (
                  <div className="space-y-2">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-sakura-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[14px] text-gray-600">{h}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 自定义说明 */}
              {selectedHotspot.customNote && (
                <div className="p-3 bg-sakura-50 rounded-lg">
                  <p className="text-[14px] text-sakura-700">{selectedHotspot.customNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 导出类型供外部使用
export type { InteractiveKimonoMapProps, MapData, HotspotData } from "./types";
