"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronRight, X } from "lucide-react";
import Hotspot from "./Hotspot";
import type { InteractiveKimonoMapProps, HotspotData } from "./types";

// 内联详情组件 - 极简设计
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
    <div className="pl-14 pr-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* 类型和状态 - 极简标签 */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-[11px] uppercase tracking-widest text-gray-400 font-medium">
          {getTypeLabel()}
        </span>
        <span className="text-gray-200">·</span>
        {isIncluded ? (
          <span className="text-[11px] uppercase tracking-widest text-emerald-600 font-medium">
            已包含
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-widest text-gray-400 font-medium">
            可加购
          </span>
        )}
      </div>

      {/* 等级标签 */}
      {hotspot.tierLabel && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400">等级</span>
          <span className="text-[12px] text-sakura-600 font-medium">
            {hotspot.tierLabel}
          </span>
        </div>
      )}

      {/* 描述 */}
      {displayDescription && (
        <p className="text-[13px] text-gray-500 leading-relaxed">
          {displayDescription}
        </p>
      )}

      {/* 亮点列表 - 更精致的样式 */}
      {displayHighlights && displayHighlights.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {displayHighlights.map((highlight, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-sakura-400 mt-2 flex-shrink-0" />
              <span className="text-[12px] text-gray-500">{highlight}</span>
            </div>
          ))}
        </div>
      )}

      {/* 自定义说明 */}
      {hotspot.customNote && (
        <div className="pl-3 border-l-2 border-sakura-200">
          <p className="text-[12px] text-sakura-600 italic">{hotspot.customNote}</p>
        </div>
      )}

      {/* 升级选项 */}
      {component.upgradesTo && component.upgradesTo.length > 0 && (
        <div className="pt-3 mt-3 border-t border-gray-100">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-medium mb-2">
            升级选项
          </p>
          <div className="space-y-1">
            {component.upgradesTo.map((upgrade) => (
              <div
                key={upgrade.id}
                className="flex items-center justify-between py-1.5 text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{upgrade.icon || "✦"}</span>
                  <span className="text-gray-600">{upgrade.name}</span>
                </div>
                <span className="text-sakura-600 font-medium tabular-nums">
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
      {/* 标题 - Japanese Modernism 风格 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-px bg-sakura-300" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-sakura-500 font-medium">
            Package Contents
          </span>
        </div>
        <h3 className="text-2xl font-serif text-gray-900 mb-2">
          套餐包含项目
        </h3>
        <p className="text-[14px] text-gray-400">
          点击图片上的标记或右侧列表查看详情
        </p>
      </div>

      {/* 主容器 - 左右分栏布局 */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* 左侧：热点映射图 - 添加阴影和圆角 */}
        <div className="w-full lg:w-[55%] lg:flex-shrink-0">
          <div className="relative bg-gradient-to-b from-gray-50 to-gray-100/50 rounded-2xl overflow-hidden shadow-lg ring-1 ring-gray-100">
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

            {/* 图例 - 更精致的设计 */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-8 bg-white/90 backdrop-blur-md rounded-xl px-6 py-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sakura-500 ring-4 ring-sakura-500/20" />
                <span className="text-[12px] text-gray-600">
                  已包含 <span className="text-gray-400">({includedCount})</span>
                </span>
              </div>
              {addonCount > 0 && (
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-gray-300/20" />
                  <span className="text-[12px] text-gray-600">
                    可加购 <span className="text-gray-400">({addonCount})</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：配件列表 - 极简设计 */}
        <div className="w-full lg:w-[45%] lg:flex-shrink-0">
          {/* 配件列表标题 - 衬线字体 */}
          <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-gray-100">
            <h4 className="text-lg font-serif text-gray-900">
              全部配件
            </h4>
            <span className="text-[12px] text-gray-400 tabular-nums">
              {sortedHotspots.length} 项
            </span>
          </div>

          {/* 配件列表 - 分割线设计 */}
          <div className="divide-y divide-gray-100">
            {sortedHotspots.map((hotspot) => {
              const { component, isIncluded = true } = hotspot;
              const displayName = hotspot.nameOverride || component.name;
              const icon = component.icon || "◇";
              const isSelected = selectedHotspot?.id === hotspot.id;

              return (
                <div key={hotspot.id} className="relative">
                  {/* 选中指示条 */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-all duration-300 ${
                      isSelected ? 'bg-sakura-500' : 'bg-transparent'
                    }`}
                  />

                  {/* 配件项 */}
                  <button
                    onClick={() => handleHotspotClick(hotspot)}
                    className={`
                      w-full flex items-center gap-3 py-4 pl-4 pr-2 text-left
                      transition-all duration-200 group
                      ${isSelected ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'}
                    `}
                  >
                    {/* 图标 - 透明背景 + 有色图标 */}
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <span
                        className={`text-2xl transition-transform duration-200 ${
                          isSelected ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                      >
                        {icon}
                      </span>
                    </div>

                    {/* 文字信息 */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[14px] transition-all duration-200 truncate ${
                          isSelected
                            ? 'font-semibold text-gray-900'
                            : 'font-medium text-gray-700 group-hover:text-gray-900'
                        }`}
                      >
                        {displayName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isIncluded ? (
                          <span className="text-[11px] text-emerald-600 font-medium tracking-wide">
                            已包含
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 tracking-wide">
                            可加购
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 展开图标 */}
                    <ChevronRight
                      className={`w-4 h-4 text-gray-300 transition-all duration-200 flex-shrink-0 ${
                        isSelected
                          ? 'rotate-90 text-sakura-500'
                          : 'group-hover:text-gray-400 group-hover:translate-x-0.5'
                      }`}
                    />
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClosePanel}
          />

          {/* 面板 */}
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] animate-in slide-in-from-bottom duration-300">
            {/* 拖拽指示条 */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* 头部 */}
            <div className="flex items-center justify-between px-6 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{selectedHotspot.component.icon || "◇"}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedHotspot.nameOverride || selectedHotspot.component.name}
                  </h3>
                  <span className="text-[11px] uppercase tracking-widest text-gray-400">
                    {selectedHotspot.component.type === "KIMONO" ? "和服本体" :
                     selectedHotspot.component.type === "STYLING" ? "造型服务" :
                     selectedHotspot.component.type === "EXPERIENCE" ? "增值体验" : "配件"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClosePanel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(75vh-100px)]">
              {/* 状态 */}
              <div className="flex items-center gap-3">
                {selectedHotspot.isIncluded !== false ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[13px] text-emerald-700 font-medium">套餐已包含</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-gray-200" />
                    <span className="text-[13px] text-gray-500">可加购项目</span>
                  </>
                )}
              </div>

              {/* 等级 */}
              {selectedHotspot.tierLabel && (
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-gray-400 uppercase tracking-wide">等级</span>
                  <span className="text-[13px] text-sakura-600 font-medium">
                    {selectedHotspot.tierLabel}
                  </span>
                </div>
              )}

              {/* 描述 */}
              {(selectedHotspot.descriptionOverride || selectedHotspot.component.description) && (
                <p className="text-[14px] text-gray-500 leading-relaxed">
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
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-sakura-400 mt-1.5 flex-shrink-0" />
                        <span className="text-[13px] text-gray-500">{h}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 自定义说明 */}
              {selectedHotspot.customNote && (
                <div className="pl-4 border-l-2 border-sakura-200">
                  <p className="text-[13px] text-sakura-600 italic">{selectedHotspot.customNote}</p>
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
