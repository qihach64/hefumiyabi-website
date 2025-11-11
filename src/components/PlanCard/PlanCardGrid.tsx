"use client";

import { cn } from "@/lib/utils";

interface PlanCardGridProps {
  variant?: 'horizontal-scroll' | 'grid-2' | 'grid-3' | 'grid-4';
  children: React.ReactNode;
  className?: string;
}

export default function PlanCardGrid({
  variant = 'grid-4',
  children,
  className,
}: PlanCardGridProps) {
  // 布局配置映射 - 参考 Airbnb 优化间距和列数
  const layoutClasses = {
    'horizontal-scroll': 'flex gap-4 md:gap-5 overflow-x-auto scroll-smooth pb-4 -mb-4 scrollbar-hide snap-x snap-mandatory',
    'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
    'grid-3': 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4',
    'grid-4': 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4',
  }[variant];

  // 水平滚动需要特殊的 style - 参考 Airbnb 正方形卡片
  const style = variant === 'horizontal-scroll' ? undefined : undefined;

  return (
    <div
      className={cn(layoutClasses, className)}
      style={style}
    >
      {children}
    </div>
  );
}
