"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Users, Clock, Shield, X, Sparkles } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import TryOnModal from "@/components/TryOnModal";

interface BookingCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    duration: number;
    depositAmount: number;
    isCampaign?: boolean;
    imageUrl?: string;
  };
}

export default function BookingCard({ plan }: BookingCardProps) {
  // 读取URL搜索参数
  const searchParams = useSearchParams();
  const searchDate = searchParams.get('date');
  const searchGuests = searchParams.get('guests');

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(1);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showTryOnModal, setShowTryOnModal] = useState(false);

  // 自动填充搜索参数
  useEffect(() => {
    if (searchDate) {
      setDate(searchDate);
    }
    if (searchGuests) {
      const guestsNum = parseInt(searchGuests);
      if (guestsNum > 0 && guestsNum <= 10) {
        setGuests(guestsNum);
      }
    }
  }, [searchDate, searchGuests]);

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

  // 预订表单内容（桌面端和移动端共用）
  const BookingFormContent = () => (
    <>
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
        <div className={`border rounded-xl overflow-hidden transition-colors ${date && searchDate ? 'border-green-500 bg-green-50/30' : 'border-gray-300 hover:border-gray-900'}`}>
          <div className="p-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-sakura-500" />
              到店日期
              {date && searchDate && (
                <span className="ml-auto text-xs text-green-600 font-normal">✓ 已从搜索预填</span>
              )}
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

      {/* 试穿按钮（主 CTA） */}
      <Button
        onClick={() => setShowTryOnModal(true)}
        className="w-full mb-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        试穿看看
      </Button>

      {/* 预订按钮（次要选项） */}
      <Button
        variant="outline"
        size="lg"
        onClick={handleBooking}
        disabled={!isBookingEnabled}
        className="w-full mb-4"
      >
        直接预订
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
    </>
  );

  return (
    <>
      {/* 试穿弹窗 */}
      <TryOnModal
        isOpen={showTryOnModal}
        onClose={() => setShowTryOnModal(false)}
        plan={plan}
      />

      {/* 桌面端：Sticky侧边栏 */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <BookingFormContent />
        </div>
      </div>

      {/* 移动端：底部固定栏 + 弹出模态框 */}
      <div className="lg:hidden">
        {/* 底部固定价格栏 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl z-40 safe-area-bottom">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">
                  ¥{(plan.price / 100).toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">/ 人</span>
              </div>
              {plan.isCampaign && (
                <Badge variant="warning" size="sm" className="mt-1">
                  限时优惠
                </Badge>
              )}
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowMobileModal(true)}
              className="px-8"
            >
              预订
            </Button>
          </div>
        </div>

        {/* 移动端模态框 */}
        {showMobileModal && (
          <>
            {/* 遮罩层 */}
            <div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowMobileModal(false)}
            />

            {/* 底部抽屉 */}
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto safe-area-bottom">
              {/* 拖动指示器 */}
              <div className="flex justify-center py-3 border-b border-gray-200">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* 标题栏 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">预订套餐</h2>
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="关闭"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="p-6">
                <BookingFormContent />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
