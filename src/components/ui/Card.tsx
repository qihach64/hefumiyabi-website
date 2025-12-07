import { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card Component - Airbnb 风格卡片
 *
 * 设计原则:
 * - 圆角设计 (12px)
 * - 微妙的阴影效果
 * - 平滑的悬停动画
 * - 清晰的内容层次
 */

const cardVariants = cva(
  "bg-card rounded-xl transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        // 默认卡片
        default: "border border-border shadow-sm",

        // 交互式卡片 - 带悬停效果
        interactive: "border border-border shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 cursor-pointer",

        // 樱花卡片 - 粉色边框
        sakura: "border-2 border-sakura-200 shadow-sakura hover:shadow-sakura-lg",

        // 扁平卡片 - 无阴影
        flat: "border border-border",

        // 浮动卡片 - 强阴影
        elevated: "shadow-lg",

        // 毛玻璃卡片 (Premium Glass)
        glass: "glass-premium border-0 shadow-lg",
        
        // 极简卡片 (Zen)
        zen: "bg-[#FDFBF7] border border-transparent hover:border-sakura-200/50 shadow-sm hover:shadow-md",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-bold leading-tight tracking-tight", className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

CardContent.displayName = "CardContent";

const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
