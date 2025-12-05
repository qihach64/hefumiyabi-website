"use client";

import { X, Check, ChevronRight } from "lucide-react";
import type { HotspotData } from "./types";

interface ComponentDetailPanelProps {
  hotspot: HotspotData | null;
  onClose: () => void;
  /** 嵌入模式 - 桌面端内嵌在配件列表下方 */
  embedded?: boolean;
}

export default function ComponentDetailPanel({
  hotspot,
  onClose,
  embedded = false,
}: ComponentDetailPanelProps) {
  if (!hotspot) return null;

  const { component, isIncluded = true } = hotspot;
  const displayName = hotspot.nameOverride || component.name;
  const displayDescription =
    hotspot.descriptionOverride || component.description;
  const displayHighlights =
    hotspot.highlightsOverride && hotspot.highlightsOverride.length > 0
      ? hotspot.highlightsOverride
      : component.highlights;
  const icon = component.icon || "📍";

  // 获取组件类型标签
  const getTypeLabel = () => {
    switch (component.type) {
      case "KIMONO":
        return "和服本体";
      case "STYLING":
        return "造型服务";
      case "ACCESSORY":
        return "配件";
      case "EXPERIENCE":
        return "增值体验";
      default:
        return "配件";
    }
  };

  // 嵌入模式 - 简洁的内联面板
  if (embedded) {
    return (
      <div className="bg-white rounded-xl">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-sakura-50 flex items-center justify-center">
              <span className="text-[28px]">{icon}</span>
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-gray-900">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
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
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="space-y-4">
          {/* 等级标签 */}
          {hotspot.tierLabel && (
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-gray-600">等级：</span>
              <span className="px-2.5 py-1 bg-sakura-50 text-sakura-700 text-[13px] font-medium rounded-lg">
                {hotspot.tierLabel}
              </span>
            </div>
          )}

          {/* 描述 */}
          {displayDescription && (
            <p className="text-[15px] text-gray-600 leading-relaxed">
              {displayDescription}
            </p>
          )}

          {/* 亮点列表 */}
          {displayHighlights && displayHighlights.length > 0 && (
            <div className="space-y-2">
              {displayHighlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sakura-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[14px] text-gray-600">{highlight}</span>
                </div>
              ))}
            </div>
          )}

          {/* 自定义说明 */}
          {hotspot.customNote && (
            <div className="p-3 bg-sakura-50 rounded-lg">
              <p className="text-[14px] text-sakura-700">
                {hotspot.customNote}
              </p>
            </div>
          )}

          {/* 升级选项 */}
          {component.upgradesTo && component.upgradesTo.length > 0 && (
            <div>
              <h4 className="text-[14px] font-medium text-gray-700 mb-2">
                升级选项
              </h4>
              <div className="space-y-2">
                {component.upgradesTo.map((upgrade) => (
                  <div
                    key={upgrade.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{upgrade.icon || "📍"}</span>
                      <span className="text-[14px] text-gray-900">
                        {upgrade.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sakura-600">
                      <span className="text-[14px] font-medium">
                        +¥{upgrade.upgradeCost?.toLocaleString()}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 移动端模式 - 底部弹出面板
  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* 面板 */}
      <div
        className="
          fixed z-50 bg-white rounded-t-2xl shadow-xl
          inset-x-0 bottom-0 max-h-[75vh]
          animate-in slide-in-from-bottom duration-300
        "
      >
        {/* 拖拽指示条 */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 头部 */}
        <div className="flex items-start justify-between px-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-sakura-50 flex items-center justify-center">
              <span className="text-[28px]">{icon}</span>
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-gray-900">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
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
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(75vh-100px)]">
          {/* 等级标签 */}
          {hotspot.tierLabel && (
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-gray-600">等级：</span>
              <span className="px-2.5 py-1 bg-sakura-50 text-sakura-700 text-[13px] font-medium rounded-lg">
                {hotspot.tierLabel}
              </span>
            </div>
          )}

          {/* 描述 */}
          {displayDescription && (
            <div>
              <h4 className="text-[15px] font-medium text-gray-700 mb-2">
                说明
              </h4>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                {displayDescription}
              </p>
            </div>
          )}

          {/* 亮点列表 */}
          {displayHighlights && displayHighlights.length > 0 && (
            <div>
              <h4 className="text-[15px] font-medium text-gray-700 mb-3">
                亮点
              </h4>
              <ul className="space-y-2.5">
                {displayHighlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-sakura-500 mt-0.5 flex-shrink-0" />
                    <span className="text-[15px] text-gray-600">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 自定义说明 */}
          {hotspot.customNote && (
            <div className="p-4 bg-sakura-50 rounded-xl">
              <p className="text-[15px] text-sakura-700">
                {hotspot.customNote}
              </p>
            </div>
          )}

          {/* 升级选项 */}
          {component.upgradesTo && component.upgradesTo.length > 0 && (
            <div>
              <h4 className="text-[15px] font-medium text-gray-700 mb-3">
                升级选项
              </h4>
              <div className="space-y-2">
                {component.upgradesTo.map((upgrade) => (
                  <div
                    key={upgrade.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[20px]">{upgrade.icon || "📍"}</span>
                      <span className="text-[15px] text-gray-900 font-medium">
                        {upgrade.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sakura-600">
                      <span className="text-[15px] font-semibold">
                        +¥{upgrade.upgradeCost?.toLocaleString()}
                      </span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
