import { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge Component - 徽章组件
 *
 * 设计原则:
 * - 圆润的外观 (全圆角或大圆角)
 * - 清晰的颜色语义
 * - 适合标签、状态指示等场景
 */

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-semibold transition-colors",
  {
    variants: {
      variant: {
        // 樱花粉
        sakura: "bg-sakura-100 text-sakura-700",

        // 主色
        primary: "bg-primary/10 text-primary",

        // 次要色
        secondary: "bg-secondary text-secondary-foreground",

        // 成功
        success: "bg-green-100 text-green-700",

        // 警告
        warning: "bg-yellow-100 text-yellow-700",

        // 错误
        error: "bg-red-100 text-red-700",

        // 危险（红色）
        danger: "bg-red-100 text-red-700",

        // 信息
        info: "bg-blue-100 text-blue-700",

        // 轮廓样式
        outline: "border-2 border-current bg-transparent",

        // 实心变体 - 更醒目的状态标签
        "success-solid": "bg-green-600/90 text-white shadow-sm backdrop-blur-sm",
        "secondary-solid": "bg-gray-600/90 text-white shadow-sm backdrop-blur-sm",
        "warning-solid": "bg-amber-500/90 text-white shadow-sm backdrop-blur-sm",
        "danger-solid": "bg-red-500/90 text-white shadow-sm backdrop-blur-sm",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
      },
      rounded: {
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "sakura",
      size: "md",
      rounded: "full",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, rounded, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, rounded, className }))}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
