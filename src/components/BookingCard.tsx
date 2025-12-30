"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  X,
  Check,
  ShoppingCart,
  Minus,
  Plus,
  Phone,
  MapPin,
  Users,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui";
import InstantBookingModal from "@/components/InstantBookingModal";
import { useCartStore, type CartItemInput } from "@/store/cart";
import type { SelectedUpgrade } from "@/components/PlanDetailClient";
import CollapsibleDateTimePicker from "@/components/booking/CollapsibleDateTimePicker";

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
    // Pricing unit fields
    pricingUnit?: "person" | "group";
    unitLabel?: string;
    unitDescription?: string;
    minQuantity?: number;
    maxQuantity?: number;
  };
  // Store context (from search or plan detail page)
  store: {
    id: string;
    name: string;
  };
  selectedUpgrades?: SelectedUpgrade[];
  onRemoveUpgrade?: (upgradeId: string) => void;
}

export default function BookingCard({
  plan,
  store,
  selectedUpgrades = [],
  onRemoveUpgrade,
}: BookingCardProps) {
  const searchParams = useSearchParams();
  const searchDate = searchParams.get("date");

  // Cart store
  const addItem = useCartStore((state) => state.addItem);

  // Form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [quantity, setQuantity] = useState(plan.minQuantity || 1);
  const [phone, setPhone] = useState("");

  // Modal state
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showInstantBookingModal, setShowInstantBookingModal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Pricing unit info
  const pricingUnit = plan.pricingUnit || "person";
  const unitLabel = plan.unitLabel || "人";
  const unitDescription = plan.unitDescription;
  const minQty = plan.minQuantity || 1;
  const maxQty = plan.maxQuantity || 10;

  // Auto-fill date from search params
  useEffect(() => {
    if (searchDate) {
      setDate(searchDate);
    }
  }, [searchDate]);

  // Calculate discount percentage
  const discountPercent =
    plan.originalPrice && plan.originalPrice > plan.price
      ? Math.round(
          ((plan.originalPrice - plan.price) / plan.originalPrice) * 100
        )
      : 0;

  // Calculate upgrade services total PER UNIT (each person/group pays for upgrades)
  const upgradesPerUnit = selectedUpgrades.reduce((sum, u) => sum + u.price, 0);

  // Calculate totals - upgrades are per unit, multiplied by quantity
  const basePrice = plan.price;
  const unitPriceWithUpgrades = basePrice + upgradesPerUnit;
  const subtotal = unitPriceWithUpgrades * quantity;
  const deposit = plan.depositAmount * quantity;
  const balance = subtotal - deposit;

  // Quantity handlers
  const decreaseQuantity = () => {
    if (quantity > minQty) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < maxQty) {
      setQuantity(quantity + 1);
    }
  };

  // Build cart item
  const buildCartItem = (): CartItemInput => ({
    type: "PLAN",
    planId: plan.id,
    name: plan.name,
    price: plan.price,
    originalPrice: plan.originalPrice,
    image: plan.imageUrl,
    quantity,
    addOns: selectedUpgrades.map((u) => u.id),
    storeId: store.id,
    storeName: store.name,
    visitDate: date || undefined,
    visitTime: time || undefined,
    pricingUnit,
    unitLabel,
    unitDescription,
    minQuantity: minQty,
    maxQuantity: maxQty,
    duration: plan.duration,
    isCampaign: plan.isCampaign,
  });

  // Add to cart handler
  const handleAddToCart = () => {
    addItem(buildCartItem());
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Instant booking handler
  const handleInstantBooking = () => {
    if (!date || !time) {
      // Show mobile modal to fill date/time first
      setShowMobileModal(true);
      return;
    }
    setShowInstantBookingModal(true);
  };

  // Form validation
  const isFormValid = date && time;

  // Booking form content (shared between desktop and mobile)
  const BookingFormContent = () => (
    <>
      {/* ========================================
          价格展示 - 雅致排版
      ======================================== */}
      <div className="mb-6">
        {selectedUpgrades.length > 0 ? (
          <>
            {/* 含增值服务标签 */}
            <div className="mb-2">
              <span className="text-[11px] px-2 py-0.5 bg-sakura-50 text-sakura-600 rounded-full font-medium">
                含增值服务
              </span>
            </div>
            {/* 含增值价格 */}
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-semibold text-gray-900">
                ¥{(unitPriceWithUpgrades / 100).toLocaleString()}
              </span>
              <span className="text-[14px] text-gray-500">
                /{unitLabel}
              </span>
            </div>
            <p className="text-[12px] text-wabi-400 mt-1">
              套餐 ¥{(basePrice / 100).toLocaleString()} + 增值 ¥{(upgradesPerUnit / 100).toLocaleString()}
            </p>
          </>
        ) : (
          <>
            {/* 标准价格 */}
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-semibold text-gray-900">
                ¥{(plan.price / 100).toLocaleString()}
              </span>
              <span className="text-[14px] text-gray-500">
                /{unitLabel}
              </span>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <span className="text-[14px] text-wabi-400 line-through ml-1">
                  ¥{(plan.originalPrice / 100).toLocaleString()}
                </span>
              )}
            </div>
            {unitDescription && (
              <p className="text-[12px] text-wabi-400 mt-1">{unitDescription}</p>
            )}
          </>
        )}

        {/* 活动标签 */}
        {plan.isCampaign && (
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="error" size="sm">
              限时 -{discountPercent}%
            </Badge>
            <span className="text-[12px] text-gray-500">活动特惠</span>
          </div>
        )}
      </div>

      {/* ========================================
          店铺信息 - 温暖背景
      ======================================== */}
      <div className="mb-4 px-4 py-3 bg-wabi-50 rounded-xl border border-wabi-100">
        <div className="flex items-center gap-2 text-[14px]">
          <MapPin className="w-4 h-4 text-sakura-500" />
          <span className="text-gray-700 font-medium">{store.name}</span>
        </div>
      </div>

      {/* ========================================
          已选增值服务 - 樱花点缀
      ======================================== */}
      {selectedUpgrades.length > 0 && (
        <div className="mb-6 px-4 py-3 bg-sakura-50/50 rounded-xl border border-sakura-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-sakura-500" />
              <span className="text-[12px] font-semibold text-gray-700">
                已选增值服务
              </span>
            </div>
            <span className="text-[11px] text-sakura-500">/{unitLabel}</span>
          </div>
          <div className="space-y-1.5">
            {selectedUpgrades.map((upgrade) => (
              <div
                key={upgrade.id}
                className="flex items-center justify-between text-[12px] group"
              >
                <span className="text-gray-600">
                  {upgrade.icon} {upgrade.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sakura-600 font-medium">
                    +¥{(upgrade.price / 100).toLocaleString()}
                  </span>
                  <button
                    onClick={() => onRemoveUpgrade?.(upgrade.id)}
                    className="w-4 h-4 rounded-full bg-wabi-100 hover:bg-sakura-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-wabi-400 hover:text-sakura-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================
          预订表单 - 日式方格 (Grid Cells)
      ======================================== */}
      <div className="mb-6 space-y-3">
        {/* 日期时间选择 - 可折叠 */}
        <CollapsibleDateTimePicker
          date={date}
          time={time}
          onDateChange={setDate}
          onTimeChange={setTime}
          dateAutoFilled={!!searchDate && !!date}
        />

        {/* 人数和电话选择 */}
        <div className="rounded-xl border border-wabi-200 divide-y divide-wabi-200 overflow-hidden hover:border-sakura-300 transition-colors duration-300">
          {/* 人数选择 */}
          <div className="p-4 hover:bg-wabi-50/50 transition-colors">
            <label className="flex items-center gap-2 text-[12px] font-medium text-gray-600 mb-2">
              {pricingUnit === "person" ? (
                <Users className="w-4 h-4 text-sakura-500" />
              ) : (
                <Package className="w-4 h-4 text-sakura-500" />
              )}
              {pricingUnit === "person" ? "人数" : "数量"}
              {unitDescription && (
                <span className="text-wabi-400 font-normal">({unitDescription})</span>
              )}
            </label>
            <div className="flex items-center justify-between">
              <button
                onClick={decreaseQuantity}
                disabled={quantity <= minQty}
                className="w-8 h-8 rounded-lg border border-wabi-200 flex items-center justify-center text-gray-600 hover:bg-wabi-50 hover:border-sakura-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-[16px] font-semibold text-gray-900">
                {quantity} {unitLabel}
              </span>
              <button
                onClick={increaseQuantity}
                disabled={quantity >= maxQty}
                className="w-8 h-8 rounded-lg border border-wabi-200 flex items-center justify-center text-gray-600 hover:bg-wabi-50 hover:border-sakura-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 电话 (可选) */}
          <div className="p-4 hover:bg-wabi-50/50 transition-colors">
            <label className="flex items-center gap-2 text-[12px] font-medium text-gray-600 mb-1">
              <Phone className="w-4 h-4 text-sakura-500" />
              联系电话
              <span className="text-wabi-400 font-normal">(可选)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="用于预约确认通知"
              className="w-full text-[15px] text-gray-900 bg-transparent border-none outline-none placeholder:text-wabi-300"
            />
          </div>
        </div>
      </div>

      {/* ========================================
          按钮组 - 层次分明
      ======================================== */}
      <div className="space-y-3 mb-4">
        {/* 主按钮：立即预约 */}
        <button
          onClick={handleInstantBooking}
          disabled={!isFormValid}
          className="w-full bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sakura-200/50"
        >
          立即预约
        </button>

        {/* 次按钮：加入购物车 */}
        <button
          onClick={handleAddToCart}
          disabled={!isFormValid}
          className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            addedToCart
              ? "bg-green-500 text-white"
              : "bg-wabi-50 text-sakura-700 hover:bg-sakura-50 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {addedToCart ? (
            <>
              <Check className="w-4 h-4" />
              已加入购物车
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              加入购物车
            </>
          )}
        </button>
      </div>

      {/* 提示 */}
      <p className="text-center text-[13px] text-wabi-400 mb-6">
        预订前不会收费
      </p>

      {/* ========================================
          价格明细 - 简洁分割
      ======================================== */}
      {(quantity > 1 || selectedUpgrades.length > 0) && (
        <div className="space-y-2 pt-6 border-t border-wabi-100">
          {/* 单价说明 */}
          <p className="text-[12px] text-wabi-400">
            ¥{(unitPriceWithUpgrades / 100).toLocaleString()}/{unitLabel} × {quantity}
          </p>

          {/* 小计 */}
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-600">小计</span>
            <span className="text-gray-900 font-medium">
              ¥{(subtotal / 100).toLocaleString()}
            </span>
          </div>

          {/* 定金 */}
          {deposit > 0 && (
            <>
              <div className="flex justify-between text-[14px] text-gray-500">
                <span>定金</span>
                <span>¥{(deposit / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[14px] pt-2 border-t border-wabi-100">
                <span className="font-semibold text-gray-900">到店支付</span>
                <span className="font-semibold text-gray-900">
                  ¥{(balance / 100).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================
          安全保障 - 和纸便签风格
      ======================================== */}
      <div className="mt-6 pt-5 border-t border-wabi-100">
        <div className="px-4 py-3 bg-wabi-50/50 rounded-xl">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-sakura-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-gray-700 mb-0.5">
                预订安全保障
              </p>
              <p className="text-[11px] text-wabi-400 leading-relaxed">
                信息安全加密 · 7天无理由取消
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Instant booking modal */}
      <InstantBookingModal
        isOpen={showInstantBookingModal}
        onClose={() => setShowInstantBookingModal(false)}
        plan={plan}
        store={store}
        quantity={quantity}
        visitDate={date}
        visitTime={time}
        phone={phone}
        selectedUpgrades={selectedUpgrades}
        subtotal={subtotal}
        deposit={deposit}
      />

      {/* ========================================
          Desktop: 悬浮预订卡片
      ======================================== */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl border border-wabi-200 p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow duration-300">
          <BookingFormContent />
        </div>
      </div>

      {/* ========================================
          Mobile: 底部栏 + 抽屉
      ======================================== */}
      <div className="lg:hidden">
        {/* 固定底部栏 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-wabi-200 p-4 shadow-lg z-40 safe-area-bottom">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-[18px] font-semibold text-gray-900">
                  ¥{(unitPriceWithUpgrades / 100).toLocaleString()}
                </span>
                <span className="text-[13px] text-gray-500">/{unitLabel}</span>
              </div>
              {selectedUpgrades.length > 0 && (
                <p className="text-[11px] text-sakura-500">
                  含 {selectedUpgrades.length} 项增值
                </p>
              )}
            </div>
            <button
              onClick={() => setShowMobileModal(true)}
              className="bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
            >
              预订
            </button>
          </div>
        </div>

        {/* 移动端抽屉 */}
        {showMobileModal && (
          <>
            {/* 遮罩 */}
            <div
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowMobileModal(false)}
            />

            {/* 底部抽屉 */}
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 max-h-[90vh] overflow-y-auto safe-area-bottom shadow-2xl">
              {/* 拖动指示条 */}
              <div className="flex justify-center py-3 border-b border-wabi-100">
                <div className="w-10 h-1 bg-wabi-200 rounded-full" />
              </div>

              {/* 标题栏 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-wabi-100">
                <h2 className="text-[18px] font-semibold text-gray-900">
                  预订套餐
                </h2>
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="p-2 rounded-full hover:bg-wabi-50 transition-colors"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4 text-gray-500" />
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
