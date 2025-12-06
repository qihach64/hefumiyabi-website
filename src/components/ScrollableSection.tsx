"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Camera, Crown, Users, Leaf, Footprints, Sparkles, LucideIcon } from "lucide-react";
import HorizontalScroller, { HorizontalScrollerRef } from "./HorizontalScroller";

// Lucide icon name to component mapping
const iconMap: Record<string, LucideIcon> = {
  Camera,
  Crown,
  Users,
  Leaf,
  Footprints,
  Sparkles,
};

interface ScrollableSectionProps {
  title: string;
  description?: string;
  icon?: string;
  color?: string; // Theme color for icon
  children: React.ReactNode;
  scrollerClassName?: string;
}

export default function ScrollableSection({
  title,
  description,
  icon,
  color,
  children,
  scrollerClassName = "",
}: ScrollableSectionProps) {
  const scrollerRef = useRef<HorizontalScrollerRef>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScrollStateChange = (left: boolean, right: boolean) => {
    setCanScrollLeft(left);
    setCanScrollRight(right);
  };

  return (
    <div>
      {/* 标题和按钮 - Airbnb 风格价值主张 */}
      <div className="flex items-center justify-between mb-4 md:mb-8 px-1">
        <div className="flex items-start gap-3 md:gap-4">
          {/* 主题图标 */}
          {icon && (
            iconMap[icon] ? (
              (() => {
                const IconComponent = iconMap[icon];
                return (
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{
                      backgroundColor: color ? `${color}15` : '#f3f4f6',
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <IconComponent
                      className="w-5 h-5 md:w-6 md:h-6"
                      style={{ color: color || '#6b7280' }}
                    />
                  </div>
                );
              })()
            ) : (
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor: color ? `${color}15` : '#f3f4f6',
                  border: `1px solid ${color}30`,
                }}
              >
                <span className="text-xl md:text-2xl">{icon}</span>
              </div>
            )
          )}
          {/* 标题和描述 */}
          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl lg:text-[28px] font-bold text-gray-900 leading-tight tracking-tight">
              {title}
            </h2>
            {description && (
              <p
                className="text-sm md:text-base text-gray-500 mt-1.5 font-medium tracking-wide"
                style={{ color: color ? `${color}cc` : undefined }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* 左右箭头按钮 */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scrollerRef.current?.scrollLeft()}
            disabled={!canScrollLeft}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-300 hover:border-gray-900 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:shadow-none"
            aria-label="向左滚动"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => scrollerRef.current?.scrollRight()}
            disabled={!canScrollRight}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-300 hover:border-gray-900 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:shadow-none"
            aria-label="向右滚动"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* 滚动容器 */}
      <div className="relative -mx-4 md:mx-0">
        <HorizontalScroller
          ref={scrollerRef}
          className={scrollerClassName}
          onScrollStateChange={handleScrollStateChange}
        >
          {children}
        </HorizontalScroller>
      </div>
    </div>
  );
}
