"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  description?: string | null;
}

interface ThemePillsProps {
  themes: Theme[];
  selectedTheme: Theme | null;
  onSelect: (theme: Theme | null) => void;
}

export default function ThemePills({
  themes,
  selectedTheme,
  onSelect,
}: ThemePillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 检查滚动状态
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, [themes]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative">
      {/* 左滚动按钮 */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg border border-gray-200 hover:scale-105 transition-transform"
          aria-label="向左滚动"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Pills 容器 */}
      <div
        ref={scrollRef}
        onScroll={checkScrollButtons}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
      >
        {/* 全部选项 */}
        <button
          onClick={() => onSelect(null)}
          className={`
            flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap
            transition-all duration-200 border-2
            ${
              !selectedTheme
                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }
          `}
        >
          <span className="flex items-center gap-1.5">
            <span>✨</span>
            全部
          </span>
        </button>

        {/* 主题选项 */}
        {themes.map((theme) => {
          const isSelected = selectedTheme?.id === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme)}
              className={`
                flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-200 border-2
                ${
                  isSelected
                    ? "bg-gray-900 text-white border-gray-900 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <span className="flex items-center gap-1.5">
                {theme.icon && <span>{theme.icon}</span>}
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* 右滚动按钮 */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg border border-gray-200 hover:scale-105 transition-transform"
          aria-label="向右滚动"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* 渐变边缘遮罩 */}
      {canScrollLeft && (
        <div className="absolute left-10 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-10 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      )}
    </div>
  );
}
