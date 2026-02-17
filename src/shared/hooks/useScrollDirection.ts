"use client";

import { useState, useEffect, useRef } from "react";

type ScrollDirection = "up" | "down" | null;

/**
 * 监听滚动方向，返回 'up' | 'down' | null
 * - 防抖阈值：累计 ≥ threshold px 才切换方向
 * - 顶部安全区：scrollY < topThreshold 时始终返回 'up'
 */
export function useScrollDirection(threshold = 10, topThreshold = 50) {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        // 顶部安全区：始终显示
        if (currentY < topThreshold) {
          setScrollDirection("up");
          lastScrollY.current = currentY;
          ticking.current = false;
          return;
        }

        const diff = currentY - lastScrollY.current;

        if (diff > threshold) {
          setScrollDirection("down");
          lastScrollY.current = currentY;
        } else if (diff < -threshold) {
          setScrollDirection("up");
          lastScrollY.current = currentY;
        }

        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, topThreshold]);

  return scrollDirection;
}
