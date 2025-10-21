import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button Component - Airbnb 风格 + 樱花美学
 *
 * 设计原则:
 * - 遵循 Airbnb 的圆角和阴影系统
 * - 使用樱花粉色作为主色调
 * - 平滑的悬停和点击动画
 */

const buttonVariants = cva(
  // 基础样式
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        // 主要按钮 - 樱花粉红渐变
        primary:
          "bg-gradient-to-r from-sakura-400 to-sakura-500 text-white shadow-md hover:shadow-lg hover:scale-105 focus:ring-sakura-400",

        // Airbnb 风格主按钮
        rausch:
          "bg-accent text-accent-foreground shadow-md hover:shadow-lg hover:scale-105 focus:ring-accent",

        // 次要按钮 - 白底边框
        secondary:
          "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-300",

        // 轮廓按钮 - 樱花粉描边
        outline:
          "border-2 border-sakura-400 text-sakura-500 bg-white hover:bg-sakura-50 focus:ring-sakura-400",

        // 幽灵按钮 - 无背景
        ghost:
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300",

        // 文本按钮
        text:
          "text-sakura-500 hover:text-sakura-600 hover:underline underline-offset-4",

        // 危险按钮
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:scale-105 focus:ring-destructive",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
        xl: "h-14 px-8 text-xl",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
