"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";

interface MiniBookingBarProps {
  plan: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    isCampaign?: boolean;
  };
  visible: boolean;
  onScrollToBooking?: () => void;
}

/**
 * 迷你预订条 - 在全宽区域时显示于页面底部
 * 当用户滚动到两栏区域时隐藏，由完整 BookingCard 接管
 */
export default function MiniBookingBar({ plan, visible, onScrollToBooking }: MiniBookingBarProps) {
  // 计算优惠百分比
  const discountPercent = plan.originalPrice && plan.originalPrice > plan.price
    ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
    : 0;

  return (
    <div
      className={`
        hidden lg:block fixed bottom-0 left-0 right-0 z-40
        transition-transform duration-300 ease-out
        ${visible ? "translate-y-0" : "translate-y-full"}
      `}
    >
      {/* 背景 + 毛玻璃效果 */}
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
          <div className="flex items-center justify-between py-4">
            {/* 左侧：价格信息 */}
            <div className="flex items-center gap-6">
              {/* 价格 */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  ¥{(plan.price / 100).toLocaleString()}
                </span>
                <span className="text-gray-500">/ 人</span>

                {plan.originalPrice && plan.originalPrice > plan.price && (
                  <span className="text-base text-gray-400 line-through ml-1">
                    ¥{(plan.originalPrice / 100).toLocaleString()}
                  </span>
                )}
              </div>

              {/* 标签 */}
              {plan.isCampaign && (
                <div className="flex items-center gap-2">
                  <Badge variant="error" size="sm">
                    -{discountPercent}%
                  </Badge>
                  <Badge variant="warning" size="sm">
                    限时优惠
                  </Badge>
                </div>
              )}
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-3">
              {/* 查看详情按钮 */}
              <button
                onClick={onScrollToBooking}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                查看预订详情
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* 立即预订按钮 */}
              <button
                onClick={onScrollToBooking}
                className="flex items-center gap-2 bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                立即预订
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
