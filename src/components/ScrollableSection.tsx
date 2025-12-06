"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
  const iconColor = color || '#6b7280';

  return (
    <div>
      {/* 标题区域 - 优化设计，更突出 */}
      <div className="flex items-center justify-between mb-6 md:mb-8 px-1">
        <div className="flex items-start gap-4 md:gap-5 flex-1 min-w-0">
          {/* 主题图标 - 更突出的设计 */}
          {IconComponent && (
            <div
              className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105"
              style={{
                background: color
                  ? `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`
                  : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                border: `2px solid ${color ? `${color}30` : '#e5e7eb'}`,
                boxShadow: color
                  ? `0 4px 12px ${color}20, 0 2px 4px ${color}10`
                  : '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              <IconComponent
                className="w-7 h-7 md:w-8 md:h-8"
                style={{ color: iconColor }}
              />
            </div>
          )}
          
          {/* 标题和描述 - 优化布局，增加视觉层次和区分度 */}
          <div className="flex flex-col flex-1 min-w-0">
            <h2 
              className="text-2xl md:text-3xl lg:text-[36px] font-extrabold leading-[1.15] tracking-[-0.03em] mb-2.5"
              style={{
                // 使用主题色，如果没有则使用深色
                color: color ? color : '#111827',
                // 添加更明显的文字阴影
                textShadow: color 
                  ? `0 2px 12px ${color}20, 0 1px 3px ${color}10`
                  : '0 2px 4px rgba(0, 0, 0, 0.08)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                className="text-sm md:text-base font-medium leading-relaxed tracking-wide"
                style={{ 
                  color: color ? `${color}aa` : '#6b7280',
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* 左右箭头按钮 - 统一在 Header 显示 */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => scrollerRef.current?.scrollLeft()}
            disabled={!canScrollLeft}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200
              ${!canScrollLeft 
                ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm active:scale-95'
              }`}
            aria-label="向左滚动"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollerRef.current?.scrollRight()}
            disabled={!canScrollRight}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200
              ${!canScrollRight 
                ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm active:scale-95'
              }`}
            aria-label="向右滚动"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 分割线 */}
      <div 
        className="h-[1px] mb-6 md:mb-8 transition-colors duration-300"
        style={{
          background: color
            ? `linear-gradient(to right, transparent 0%, ${color}25 20%, ${color}30 50%, ${color}25 80%, transparent 100%)`
            : 'linear-gradient(to right, transparent 0%, #e5e7eb 20%, #d1d5db 50%, #e5e7eb 80%, transparent 100%)',
        }}
      />

      {/* 内容区域 - 左侧大卡片 + 右侧小卡片 */}
      {featuredChild ? (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* 左侧：大卡片 - 调整宽度以配合单行滚动 */}
          <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0">
            {featuredChild}
          </div>

          {/* 右侧：小卡片两行网格横向滚动（桌面端） */}
          <div className="flex-1 min-w-0">
            <div className="relative -mx-4 md:mx-0">
              {/* 滚动箭头按钮 - 已移动到 Header，此处移除 */}
              
              {/* 桌面端：两行网格横向滚动 */}
              <HorizontalScroller
                ref={scrollerRef}
                className={`${scrollerClassName} lg:!grid lg:!grid-rows-2 lg:!grid-flow-col lg:!gap-4 lg:!snap-x lg:!snap-mandatory`}
                style={{
                  gridAutoColumns: '260px', // 稍微调窄一点，适应两行
                } as React.CSSProperties}
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
