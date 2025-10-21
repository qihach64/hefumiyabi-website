"use client";

import { useState } from "react";
import { Calendar, Users, Clock, Shield } from "lucide-react";
import { Button, Badge } from "@/components/ui";

interface BookingCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    duration: number;
    depositAmount: number;
    isCampaign?: boolean;
  };
}

export default function BookingCard({ plan }: BookingCardProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(1);

  // 计算优惠百分比
  const discountPercent = plan.originalPrice && plan.originalPrice > plan.price
    ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
    : 0;

  // 计算总价
  const subtotal = plan.price * guests;
  const deposit = plan.depositAmount * guests;
  const balance = subtotal - deposit;

  const handleBooking = () => {
    // 构建查询参数
    const params = new URLSearchParams({
      planId: plan.id,
      date: date,
      time: time,
      guests: guests.toString(),
    });

    // 跳转到预订页面
    window.location.href = `/booking?${params.toString()}`;
  };

  const isBookingEnabled = date && time && guests > 0;

  return (
    <div className="sticky top-24">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        {/* 价格区域 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">
              ¥{(plan.price / 100).toLocaleString()}
            </span>
            <span className="text-gray-600">/ 人</span>

            {plan.originalPrice && plan.originalPrice > plan.price && (
              <>
                <span className="text-lg text-gray-400 line-through ml-2">
                  ¥{(plan.originalPrice / 100).toLocaleString()}
                </span>
                {plan.isCampaign && (
                  <Badge variant="error" size="sm">
                    -{discountPercent}%
                  </Badge>
                )}
              </>
            )}
          </div>

          {plan.isCampaign && (
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm">
                限时优惠
              </Badge>
              <span className="text-sm text-gray-600">
                活动期间特惠价格
              </span>
            </div>
          )}
        </div>

        {/* 预订表单 */}
        <div className="space-y-4 mb-6">
          {/* 日期选择 */}
          <div className="border border-gray-300 rounded-xl overflow-hidden hover:border-gray-900 transition-colors">
            <div className="p-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-sakura-500" />
                到店日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm text-gray-900 bg-transparent border-none outline-none"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* 时间选择 */}
          <div className="border border-gray-300 rounded-xl overflow-hidden hover:border-gray-900 transition-colors">
            <div className="p-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Clock className="w-4 h-4 text-sakura-500" />
                到店时间
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm text-gray-900 bg-transparent border-none outline-none"
              >
                <option value="">请选择时间</option>
                <option value="09:00">上午 9:00</option>
                <option value="09:30">上午 9:30</option>
                <option value="10:00">上午 10:00</option>
                <option value="10:30">上午 10:30</option>
                <option value="11:00">上午 11:00</option>
                <option value="11:30">上午 11:30</option>
                <option value="12:00">中午 12:00</option>
                <option value="13:00">下午 1:00</option>
                <option value="13:30">下午 1:30</option>
                <option value="14:00">下午 2:00</option>
                <option value="14:30">下午 2:30</option>
                <option value="15:00">下午 3:00</option>
                <option value="15:30">下午 3:30</option>
                <option value="16:00">下午 4:00</option>
              </select>
            </div>
          </div>

          {/* 人数选择 */}
          <div className="border border-gray-300 rounded-xl overflow-hidden hover:border-gray-900 transition-colors">
            <div className="p-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 text-sakura-500" />
                人数
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900">
                  {guests} 位客人
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={guests <= 1}
                  >
                    −
                  </button>
                  <button
                    onClick={() => setGuests(Math.min(10, guests + 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={guests >= 10}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 预订按钮 */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleBooking}
          disabled={!isBookingEnabled}
          className="w-full mb-4"
        >
          立即预订
        </Button>

        {/* 提示信息 */}
        <div className="text-center text-sm text-gray-600 mb-6">
          预订前不会收费
        </div>

        {/* 价格明细 */}
        {guests > 1 && (
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                ¥{(plan.price / 100).toLocaleString()} × {guests} 人
              </span>
              <span className="text-gray-900">
                ¥{(subtotal / 100).toLocaleString()}
              </span>
            </div>

            {deposit > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">定金</span>
                  <span className="text-gray-900">
                    ¥{(deposit / 100).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">到店支付</span>
                  <span className="font-semibold text-gray-900">
                    ¥{(balance / 100).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* 安全提示 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Shield className="w-5 h-5 text-sakura-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 mb-1">预订安全保障</p>
              <p className="text-xs leading-relaxed">
                我们承诺保护您的个人信息和支付安全，支持7天无理由取消政策
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
