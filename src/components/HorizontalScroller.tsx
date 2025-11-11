"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";

interface HorizontalScrollerProps {
  children: React.ReactNode;
  className?: string;
  onScrollStateChange?: (canScrollLeft: boolean, canScrollRight: boolean) => void;
}

export interface HorizontalScrollerRef {
  scrollLeft: () => void;
  scrollRight: () => void;
}

const HorizontalScroller = forwardRef<HorizontalScrollerRef, HorizontalScrollerProps>(
  ({ children, className = "", onScrollStateChange }, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 检查滚动位置，决定显示哪些按钮
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;

      const canScrollLeft = scrollLeft > 10;
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 10;

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

    // 滚动函数
    const scroll = (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollAmount = container.clientWidth * 0.8; // 滚动80%的可视宽度
      const targetScroll = direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    };

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      scrollLeft: () => scroll("left"),
      scrollRight: () => scroll("right"),
    }));

    return (
      <div ref={scrollContainerRef} className={className}>
        {children}
      </div>
    );
  }
);

HorizontalScroller.displayName = "HorizontalScroller";

export default HorizontalScroller;
