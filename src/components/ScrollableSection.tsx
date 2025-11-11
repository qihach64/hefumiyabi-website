"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HorizontalScroller, { HorizontalScrollerRef } from "./HorizontalScroller";

interface ScrollableSectionProps {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
  scrollerClassName?: string;
}

export default function ScrollableSection({
  title,
  description,
  icon,
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
      {/* 标题和按钮 */}
      <div className="flex items-center justify-between mb-3 md:mb-6 px-1">
        <div className="flex items-center gap-2 md:gap-3">
          {icon && <span className="text-xl md:text-3xl">{icon}</span>}
          <div>
            <h2 className="text-lg md:text-2xl font-semibold text-gray-900">
              {title}
            </h2>
            {description && (
              <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">
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
