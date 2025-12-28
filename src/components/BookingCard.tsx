"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Users, Clock, Shield, X, Sparkles, Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui";
import TryOnModal from "@/components/TryOnModal";
import GuestsDropdown, { GuestsDetail } from "@/components/GuestsDropdown";
import type { SelectedUpgrade } from "@/components/PlanDetailClient";

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
  selectedUpgrades?: SelectedUpgrade[];
  onRemoveUpgrade?: (upgradeId: string) => void;
}

export default function BookingCard({ plan, selectedUpgrades = [], onRemoveUpgrade }: BookingCardProps) {
  // 读取URL搜索参数
  const searchParams = useSearchParams();
  const searchDate = searchParams.get('date');
  const searchGuests = searchParams.get('guests');
  const searchMen = searchParams.get('men');
  const searchWomen = searchParams.get('women');
  const searchChildren = searchParams.get('children');

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(1);
  const [guestsDetail, setGuestsDetail] = useState<GuestsDetail>({
    total: 1,
    men: 0,
    women: 1,
    children: 0,
  });
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
    // 填充详细人数信息
    if (searchMen || searchWomen || searchChildren) {
      const men = searchMen ? parseInt(searchMen) : 0;
      const women = searchWomen ? parseInt(searchWomen) : 0;
      const children = searchChildren ? parseInt(searchChildren) : 0;
      const total = men + women + children;

      setGuestsDetail({
        total: total || 1,
        men,
        women,
        children,
      });

      if (total > 0) {
        setGuests(total);
      }
    }
  }, [searchDate, searchGuests, searchMen, searchWomen, searchChildren]);

  // 计算优惠百分比
  const discountPercent = plan.originalPrice && plan.originalPrice > plan.price
    ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
    : 0;

  // 计算增值服务总价
  const upgradesTotal = selectedUpgrades.reduce((sum, u) => sum + u.price, 0);

  // 计算总价（含增值服务）
  const basePricePerPerson = plan.price;
  const totalPricePerPerson = basePricePerPerson + upgradesTotal;
  const subtotal = totalPricePerPerson * guests;
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
        {/* 有增值服务时显示含增值价格 */}
        {selectedUpgrades.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] px-2 py-0.5 bg-sakura-100 text-sakura-700 rounded-full font-medium">
                💫 含增值服务
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-sakura-600">
                ¥{(totalPricePerPerson / 100).toLocaleString()}
              </span>
              <span className="text-gray-600">/ 人</span>
              <span className="text-sm text-gray-400 line-through ml-1">
                ¥{(basePricePerPerson / 100).toLocaleString()}
              </span>
            </div>
            <div className="text-[12px] text-gray-500">
              基础 ¥{(basePricePerPerson / 100).toLocaleString()} + 增值 ¥{(upgradesTotal / 100).toLocaleString()}
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

        {plan.isCampaign && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="warning" size="sm">
              限时优惠
            </Badge>
            <span className="text-sm text-gray-600">
              活动期间特惠价格
            </span>
          </div>
        )}
      </div>

      {/* 已选增值服务列表 */}
      {selectedUpgrades.length > 0 && (
        <div className="mb-6 p-3 bg-sakura-50 rounded-xl border border-sakura-200">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-sakura-600" />
            <span className="text-[12px] font-semibold text-sakura-800">已选增值服务</span>
          </div>
          <div className="space-y-1.5">
            {selectedUpgrades.map((upgrade) => (
              <div key={upgrade.id} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-1.5">
                  <span>{upgrade.icon}</span>
                  <span className="text-gray-700">{upgrade.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sakura-600 font-medium">
                    +¥{(upgrade.price / 100).toLocaleString()}
                  </span>
                  <button
                    onClick={() => onRemoveUpgrade?.(upgrade.id)}
                    className="w-4 h-4 rounded-full bg-gray-200 hover:bg-red-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 预订表单 */}
      <div className="space-y-4 mb-6">
        {/* 日期选择 */}
        <div
          className={`border rounded-xl transition-colors cursor-pointer ${date && searchDate ? 'border-green-500 bg-green-50/30' : 'border-gray-300 hover:border-gray-900'}`}
          onClick={() => {
            const input = document.getElementById('booking-date-input') as HTMLInputElement;
            input?.focus();
            try {
              input?.showPicker?.();
            } catch (error) {
              input?.click();
            }
          }}
        >
          <div className="p-3">
            <label
              className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const input = document.getElementById('booking-date-input') as HTMLInputElement;
                input?.focus();
                try {
                  input?.showPicker?.();
                } catch (error) {
                  input?.click();
                }
              }}
            >
              <Calendar className="w-4 h-4 text-sakura-500" />
              到店日期
              {date && searchDate && (
                <span className="ml-auto text-xs text-green-600 font-normal">✓ 已从搜索预填</span>
              )}
            </label>
            <input
              id="booking-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm text-gray-900 bg-transparent border-none outline-none cursor-pointer"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* 时间选择 */}
        <div className="border border-gray-300 rounded-xl hover:border-gray-900 transition-colors cursor-pointer relative">
          <div className="p-3">
            <label
              htmlFor="booking-time-select"
              className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-sakura-500" />
              到店时间
            </label>
            <select
              id="booking-time-select"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
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
            <div className="text-sm text-gray-900 pointer-events-none">
              {time ? (
                <>
                  {time.startsWith('09') || time.startsWith('10') || time.startsWith('11') ? '上午' :
                   time === '12:00' ? '中午' : '下午'} {time}
                </>
              ) : (
                '请选择时间'
              )}
            </div>
          </div>
        </div>

        {/* 人数选择 */}
        <div className="border border-gray-300 rounded-xl hover:border-gray-900 transition-colors relative cursor-pointer">
          <div className="p-3 cursor-pointer">
            <GuestsDropdown
              value={guests}
              onChange={setGuests}
              onDetailChange={setGuestsDetail}
              initialDetail={guestsDetail}
              dropdownClassName="left-0 right-0 w-auto"
            />
          </div>
        </div>
      </div>

      {/* 试穿按钮（主 CTA） */}
      <button
        onClick={() => setShowTryOnModal(true)}
        className="w-full mb-3 bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        <span className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5" />
          试穿看看
        </span>
      </button>

      {/* 预订按钮（次要选项） */}
      <button
        onClick={handleBooking}
        disabled={!isBookingEnabled}
        className="w-full mb-4 bg-white hover:bg-sakura-50 text-sakura-600 font-semibold py-3 px-6 rounded-lg border border-sakura-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        直接预订
      </button>

      {/* 提示信息 */}
      <div className="text-center text-sm text-gray-600 mb-6">
        预订前不会收费
      </div>

      {/* 价格明细 */}
      {(guests > 1 || selectedUpgrades.length > 0) && (
        <div className="space-y-3 pt-6 border-t border-gray-200">
          {/* 套餐基础价 */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              套餐价格 ¥{(basePricePerPerson / 100).toLocaleString()} × {guests} 人
            </span>
            <span className="text-gray-900">
              ¥{((basePricePerPerson * guests) / 100).toLocaleString()}
            </span>
          </div>

          {/* 增值服务明细 */}
          {selectedUpgrades.length > 0 && (
            <>
              {selectedUpgrades.map((upgrade) => (
                <div key={upgrade.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {upgrade.icon} {upgrade.name} × {guests} 人
                  </span>
                  <span className="text-sakura-600">
                    +¥{((upgrade.price * guests) / 100).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-dashed border-gray-200">
                <span className="text-gray-700 font-medium">小计</span>
                <span className="text-gray-900 font-medium">
                  ¥{(subtotal / 100).toLocaleString()}
                </span>
              </div>
            </>
          )}

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

      {/* 桌面端：侧边栏 */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <BookingFormContent />
        </div>
      </div>

      {/* 移动端：底部固定栏 + 弹出模态框 */}
      <div className="lg:hidden">
        {/* 底部固定价格栏 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl z-40 safe-area-bottom">
          <div className="flex items-center justify-between gap-4">
            <div>
              {selectedUpgrades.length > 0 ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-sakura-600">
                      ¥{(totalPricePerPerson / 100).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-600">/ 人</span>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-gray-500">
                    <span>含 {selectedUpgrades.length} 项增值</span>
                    <span className="text-sakura-500">+¥{(upgradesTotal / 100).toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
            <button
              onClick={() => setShowMobileModal(true)}
              className="bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              预订
            </button>
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
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 max-h-[90vh] overflow-y-auto safe-area-bottom">
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
