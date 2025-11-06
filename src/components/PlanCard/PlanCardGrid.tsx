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
  // 布局配置映射
  const layoutClasses = {
    'horizontal-scroll': 'grid gap-3 md:gap-6 pb-2 overflow-x-auto scrollbar-hide overscroll-x-contain snap-x snap-mandatory',
    'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-6',
    'grid-3': 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
    'grid-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  }[variant];

  // 水平滚动需要特殊的 style
  const style = variant === 'horizontal-scroll' ? {
    gridAutoFlow: 'column',
    gridAutoColumns: 'min(260px, 75vw)',
  } : undefined;

  return (
    <div
      className={cn(layoutClasses, className)}
      style={style}
    >
      {children}
    </div>
  );
}
