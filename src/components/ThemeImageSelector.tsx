"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import type { Theme } from "@/types";

// 主题默认图片（当 coverImage 为空时使用）
const defaultThemeImages: Record<string, string> = {
  'trendy-photo': 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80',
  'formal-ceremony': 'https://images.unsplash.com/photo-1545048702-79362596cdc9?w=400&q=80',
  'together': 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80',
  'seasonal': 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80',
  'casual-stroll': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
  'specialty': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80',
};

// "全部"选项的默认图片
const allThemeImage = 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400&q=80';

interface ThemeImageSelectorProps {
  themes: Theme[];
  selectedTheme: Theme | null;
  onSelect: (theme: Theme | null) => void;
  isPending?: boolean;
  pendingTheme?: Theme | null;
}

export default function ThemeImageSelector({
  themes,
  selectedTheme,
  onSelect,
  isPending = false,
  pendingTheme,
}: ThemeImageSelectorProps) {
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

  // 判断是否有正在进行的切换
  const hasPendingSwitch = isPending && pendingTheme !== undefined;

  return (
    <div className="relative">
      {/* 左滚动按钮 */}
      {canScrollLeft && (
        <>
          {/* 渐变遮罩 */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-[5]" />
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md border border-gray-200 hover:scale-110 hover:shadow-lg transition-all duration-200"
            aria-label="向左滚动"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
        </>
      )}

      {/* 主题选项容器 */}
      <div
        ref={scrollRef}
        onScroll={checkScrollButtons}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-2"
      >
        {/* 全部选项 */}
        {(() => {
          const isLoadingThis = hasPendingSwitch && pendingTheme === null;
          const isSelected = hasPendingSwitch
            ? pendingTheme === null
            : !selectedTheme;

          return (
            <button
              onClick={() => onSelect(null)}
              className="flex-shrink-0 flex flex-col items-center gap-2.5 group"
            >
              {/* 图片容器 - 更大的尺寸 */}
              <div
                className={`
                  relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden
                  transition-all duration-300 shadow-sm
                  ${isSelected
                    ? 'ring-2 ring-gray-900 ring-offset-2 shadow-md'
                    : 'hover:shadow-md hover:scale-[1.02]'
                  }
                `}
              >
                <Image
                  src={allThemeImage}
                  alt="全部套餐"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
                {/* 加载遮罩 */}
                {isLoadingThis && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-700" />
                  </div>
                )}
                {/* 未选中时的暗色遮罩 */}
                {!isSelected && !isLoadingThis && (
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                )}
              </div>
              {/* 文字标签 */}
              <span
                className={`
                  text-[13px] md:text-[14px] font-medium text-center whitespace-nowrap
                  transition-colors duration-300
                  ${isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}
                `}
              >
                全部
              </span>
              {/* 选中指示线 */}
              <div
                className={`
                  h-0.5 w-10 rounded-full transition-all duration-300
                  ${isSelected ? 'bg-gray-900' : 'bg-transparent'}
                `}
              />
            </button>
          );
        })()}

        {/* 主题选项 */}
        {themes.map((theme) => {
          const isLoadingThis = hasPendingSwitch && pendingTheme?.id === theme.id;
          const isSelected = hasPendingSwitch
            ? pendingTheme?.id === theme.id
            : selectedTheme?.id === theme.id;

          const imageUrl = theme.coverImage || defaultThemeImages[theme.slug] || allThemeImage;

          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme)}
              className="flex-shrink-0 flex flex-col items-center gap-2.5 group"
            >
              {/* 图片容器 - 更大的尺寸 */}
              <div
                className={`
                  relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden
                  transition-all duration-300 shadow-sm
                  ${isSelected
                    ? 'ring-2 ring-gray-900 ring-offset-2 shadow-md'
                    : 'hover:shadow-md hover:scale-[1.02]'
                  }
                `}
              >
                <Image
                  src={imageUrl}
                  alt={theme.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
                {/* 加载遮罩 */}
                {isLoadingThis && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-700" />
                  </div>
                )}
                {/* 未选中时的暗色遮罩 */}
                {!isSelected && !isLoadingThis && (
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                )}
              </div>
              {/* 文字标签 */}
              <span
                className={`
                  text-[13px] md:text-[14px] font-medium text-center whitespace-nowrap
                  transition-colors duration-300
                  ${isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}
                `}
              >
                {theme.name}
              </span>
              {/* 选中指示线 */}
              <div
                className={`
                  h-0.5 w-10 rounded-full transition-all duration-300
                  ${isSelected ? 'bg-gray-900' : 'bg-transparent'}
                `}
              />
            </button>
          );
        })}
      </div>

      {/* 右滚动按钮 */}
      {canScrollRight && (
        <>
          {/* 渐变遮罩 */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-[5]" />
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md border border-gray-200 hover:scale-110 hover:shadow-lg transition-all duration-200"
            aria-label="向右滚动"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
        </>
      )}
    </div>
  );
}
