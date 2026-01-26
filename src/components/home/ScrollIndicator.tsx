"use client";

import { ChevronDown } from "lucide-react";

interface ScrollIndicatorProps {
  variant?: "dark" | "light";
}

// CSS 动画替代 framer-motion，减少首屏 JS bundle
export default function ScrollIndicator({ variant = "dark" }: ScrollIndicatorProps) {
  const isLight = variant === "light";

  const handleClick = () => {
    // 滚动到 Hero 下方的内容区域
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer group animate-scroll-indicator"
      onClick={handleClick}
    >
      <span className={`text-xs uppercase tracking-[0.2em] mb-2 transition-colors ${
        isLight
          ? "text-gray-500 group-hover:text-gray-700"
          : "text-white/60 group-hover:text-white/80"
      }`}>
        向下探索
      </span>
      <div className="animate-bounce-arrow">
        <ChevronDown className={`w-6 h-6 transition-colors ${
          isLight
            ? "text-gray-500 group-hover:text-gray-700"
            : "text-white/60 group-hover:text-white/80"
        }`} />
      </div>
    </div>
  );
}
