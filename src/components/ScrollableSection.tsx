"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HorizontalScroller, { HorizontalScrollerRef } from "./HorizontalScroller";
import { getThemeIcon } from "@/lib/themeIcons";

interface ScrollableSectionProps {
  title: string;
  description?: string;
  icon?: string;
  color?: string; // Theme color for icon
  children: React.ReactNode;
  scrollerClassName?: string;
  featuredChild?: React.ReactNode; // 左侧大卡片（featured plan）
}

export default function ScrollableSection({
  title,
  description,
  icon,
  color,
  children,
  scrollerClassName = "",
  featuredChild,
}: ScrollableSectionProps) {
  const scrollerRef = useRef<HorizontalScrollerRef>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScrollStateChange = (left: boolean, right: boolean) => {
    setCanScrollLeft(left);
    setCanScrollRight(right);
  };

  // 使用共享的图标工具获取图标组件
  const IconComponent = icon ? getThemeIcon(icon) : null;
  const iconColor = color || "#6b7280";

  return (
    <div>
      {/* 标题区域 - Miyabi 风格：装饰线 + Serif 字体 */}
      <div className="flex items-center justify-between mb-6 md:mb-8 px-1">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 渐变装饰线 */}
          <div
            className="w-10 h-px bg-gradient-to-r to-transparent flex-shrink-0"
            style={{ backgroundImage: `linear-gradient(to right, ${iconColor}, transparent)` }}
          />

          {/* 主题图标 */}
          {IconComponent && (
            <div
              className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: `${iconColor}15` }}
            >
              <IconComponent className="w-5 h-5 md:w-6 md:h-6" style={{ color: iconColor }} />
            </div>
          )}

          {/* 标题和描述 - Miyabi 风格 */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* 英文小标题 */}
            <span
              className="text-[11px] uppercase tracking-[0.2em] font-medium mb-0.5"
              style={{ color: iconColor }}
            >
              Collection
            </span>
            {/* 主标题：Serif 字体 */}
            <h2 className="text-[22px] md:text-[26px] lg:text-[28px] font-serif leading-tight text-stone-900">
              {title}
            </h2>
            {description && (
              <p className="text-[13px] md:text-sm text-wabi-500 leading-relaxed mt-1 hidden md:block">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* 左右箭头按钮 - Miyabi 风格 */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => scrollerRef.current?.scrollLeft()}
            disabled={!canScrollLeft}
            className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200
              ${
                !canScrollLeft
                  ? "bg-wabi-50 border-wabi-100 text-wabi-300 cursor-not-allowed"
                  : "bg-white border-wabi-200 text-wabi-600 hover:border-sakura-200 hover:text-sakura-500 active:scale-95"
              }`}
            aria-label="向左滚动"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollerRef.current?.scrollRight()}
            disabled={!canScrollRight}
            className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200
              ${
                !canScrollRight
                  ? "bg-wabi-50 border-wabi-100 text-wabi-300 cursor-not-allowed"
                  : "bg-white border-wabi-200 text-wabi-600 hover:border-sakura-200 hover:text-sakura-500 active:scale-95"
              }`}
            aria-label="向右滚动"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 分割线 - Miyabi 风格：渐变线 */}
      <div
        className="h-px mb-6 md:mb-8 bg-gradient-to-r to-transparent"
        style={{ backgroundImage: `linear-gradient(to right, ${iconColor}30, transparent)` }}
      />

      {/* 内容区域 - 左侧大卡片 + 右侧小卡片 */}
      {featuredChild ? (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* 左侧：大卡片 - 调整宽度以配合单行滚动 */}
          <div className="hidden lg:block lg:w-[320px] xl:w-[360px] 2xl:w-[400px] flex-shrink-0">
            {featuredChild}
          </div>

          {/* 右侧：小卡片两行网格横向滚动（桌面端） */}
          <div className="flex-1 min-w-0">
            <div className="relative -mx-4 md:mx-0">
              {/* 滚动箭头按钮 - 已移动到 Header，此处移除 */}

              {/* 桌面端：两行网格横向滚动 */}
              <HorizontalScroller
                ref={scrollerRef}
                className={`${scrollerClassName} lg:!grid lg:!grid-rows-2 lg:!grid-flow-col lg:!gap-4 lg:!snap-x lg:!snap-mandatory lg:!pr-4`}
                style={
                  {
                    gridAutoColumns: "250px", // 4列刚好适配 scroller 可用宽度
                  } as React.CSSProperties
                }
                onScrollStateChange={handleScrollStateChange}
              >
                {children}
              </HorizontalScroller>
            </div>
          </div>
        </div>
      ) : (
        /* 没有大卡片时，保持原有布局 */
        <div className="relative -mx-4 md:mx-0">
          <HorizontalScroller
            ref={scrollerRef}
            className={scrollerClassName}
            onScrollStateChange={handleScrollStateChange}
          >
            {children}
          </HorizontalScroller>
        </div>
      )}
    </div>
  );
}
