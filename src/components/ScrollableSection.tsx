"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Crown,
  Users,
  Leaf,
  Footprints,
  Sparkles,
  Heart,
  Gift,
  Star,
  Image,
  Calendar,
  MapPin,
  Palette,
  Flower,
  Gem,
  Zap,
  Award,
  LucideIcon,
} from "lucide-react";
import HorizontalScroller, { HorizontalScrollerRef } from "./HorizontalScroller";

// Lucide icon name to component mapping - 扩展图标库
const iconMap: Record<string, LucideIcon> = {
  Camera,
  Crown,
  Users,
  Leaf,
  Footprints,
  Sparkles,
  Heart,
  Gift,
  Star,
  Image,
  Calendar,
  MapPin,
  Palette,
  Flower,
  Gem,
  Zap,
  Award,
  // 常用别名映射
  Photo: Camera,
  Picture: Image,
  Love: Heart,
  Present: Gift,
  Lightning: Zap,
  Trophy: Award,
  Diamond: Gem,
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

  // 获取图标组件或使用默认图标
  const getIconComponent = () => {
    if (!icon) return null;
    
    // 如果是 Lucide 图标名称
    if (iconMap[icon]) {
      return iconMap[icon];
    }
    
    // 如果是 emoji，使用默认图标替代
    // 检测是否是 emoji（简单的 Unicode 范围检测）
    const isEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon);
    if (isEmoji) {
      // 根据常见 emoji 映射到对应图标
      const emojiToIcon: Record<string, LucideIcon> = {
        '📷': Camera,
        '📸': Camera,
        '👑': Crown,
        '👥': Users,
        '👫': Users,
        '🍂': Leaf,
        '🌸': Flower,
        '✨': Sparkles,
        '💎': Gem,
        '⚡': Zap,
        '🏆': Award,
        '🎁': Gift,
        '❤️': Heart,
        '⭐': Star,
        '🎨': Palette,
      };
      return emojiToIcon[icon] || Sparkles; // 默认使用 Sparkles
    }
    
    // 其他情况使用默认图标
    return Sparkles;
  };

  const IconComponent = getIconComponent();
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

        {/* 左右箭头按钮 - 优化样式 */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => scrollerRef.current?.scrollLeft()}
            disabled={!canScrollLeft}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:scale-100"
            aria-label="向左滚动"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => scrollerRef.current?.scrollRight()}
            disabled={!canScrollRight}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:scale-100"
            aria-label="向右滚动"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* 分割线 - Header 和卡片之间的分隔 */}
      <div 
        className="h-[1px] mb-6 md:mb-8 transition-colors duration-300"
        style={{
          background: color
            ? `linear-gradient(to right, transparent 0%, ${color}25 20%, ${color}30 50%, ${color}25 80%, transparent 100%)`
            : 'linear-gradient(to right, transparent 0%, #e5e7eb 20%, #d1d5db 50%, #e5e7eb 80%, transparent 100%)',
        }}
      />

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
