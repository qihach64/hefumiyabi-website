"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";

interface HorizontalScrollerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onScrollStateChange?: (canScrollLeft: boolean, canScrollRight: boolean) => void;
}

export interface HorizontalScrollerRef {
  scrollLeft: () => void;
  scrollRight: () => void;
}

const HorizontalScroller = forwardRef<HorizontalScrollerRef, HorizontalScrollerProps>(
  ({ children, className = "", style, onScrollStateChange }, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 检查滚动位置，决定显示哪些按钮
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;

      // 使用更小的阈值，让按钮状态更准确
      const threshold = 5;
      const canScrollLeft = scrollLeft > threshold;
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - threshold;

      if (onScrollStateChange) {
        onScrollStateChange(canScrollLeft, canScrollRight);
      }
    };

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // 初始检查
      checkScroll();

      // 监听滚动和窗口大小变化
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);

      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }, [onScrollStateChange]);

    // 滚动函数 - 优化分页逻辑，让滑动更丝滑
    const scroll = (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // 检测是否是网格布局（桌面端两行布局）
      const isGrid = container.classList.contains('grid');
      
      if (isGrid) {
        // 网格布局：滚动一列的距离（卡片宽度 + gap）
        const firstChild = container.firstElementChild as HTMLElement;
        if (firstChild) {
          const cardWidth = firstChild.offsetWidth;
          const gap = parseInt(getComputedStyle(container).gap) || 16;
          const scrollAmount = cardWidth + gap;
          
          const targetScroll = direction === "left"
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;

          container.scrollTo({
            left: targetScroll,
            behavior: "smooth",
          });
        }
      } else {
        // 单行布局：滚动到下一个snap点
        const scrollAmount = container.clientWidth * 0.85; // 稍微小于可视宽度，确保能触发snap
        const targetScroll = direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

        container.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      }
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      scrollLeft: () => scroll("left"),
      scrollRight: () => scroll("right"),
    }));

    return (
      <div ref={scrollContainerRef} className={className} style={style}>
        {children}
      </div>
    );
  }
);

HorizontalScroller.displayName = "HorizontalScroller";

export default HorizontalScroller;
