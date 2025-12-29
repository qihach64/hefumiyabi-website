"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Shield,
  X,
  Sparkles,
  Check,
  ShoppingCart,
  Minus,
  Plus,
  Phone,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui";
import TryOnModal from "@/components/TryOnModal";
import InstantBookingModal from "@/components/InstantBookingModal";
import { useCartStore, type CartItemInput } from "@/store/cart";
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
  const router = useRouter();
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
  const [showTryOnModal, setShowTryOnModal] = useState(false);
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

  // Render price display based on pricing unit
  const renderPriceDisplay = () => {
    const showUpgradePrice = selectedUpgrades.length > 0;

    return (
      <div className="mb-6">
        {showUpgradePrice ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] px-2 py-0.5 bg-sakura-100 text-sakura-700 rounded-full font-medium">
                含增值服务
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[26px] font-semibold text-sakura-600">
                ¥{(unitPriceWithUpgrades / 100).toLocaleString()}
              </span>
              <span className="text-[14px] text-gray-600">
                / {unitLabel}
                {unitDescription && (
                  <span className="text-gray-400 ml-1">({unitDescription})</span>
                )}
              </span>
            </div>
            <div className="text-[12px] text-gray-500">
              基础 ¥{(basePrice / 100).toLocaleString()} + 增值 ¥{(upgradesPerUnit / 100).toLocaleString()}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[26px] font-semibold text-gray-900">
                ¥{(plan.price / 100).toLocaleString()}
              </span>
              <span className="text-[14px] text-gray-600">
                / {unitLabel}
                {unitDescription && (
                  <span className="text-gray-400 ml-1">({unitDescription})</span>
                )}
              </span>

              {plan.originalPrice && plan.originalPrice > plan.price && (
                <>
                  <span className="text-[16px] text-gray-400 line-through ml-2">
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
            <span className="text-[14px] text-gray-600">活动期间特惠价格</span>
          </div>
        )}
      </div>
    );
  };

  // Booking form content (shared between desktop and mobile)
  const BookingFormContent = () => (
    <>
      {/* Price display */}
      {renderPriceDisplay()}

      {/* Store info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 text-[14px]">
          <MapPin className="w-4 h-4 text-sakura-500" />
          <span className="text-gray-900 font-medium">{store.name}</span>
        </div>
      </div>

      {/* Selected upgrades list */}
      {selectedUpgrades.length > 0 && (
        <div className="mb-6 p-3 bg-sakura-50 rounded-xl border border-sakura-200">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-sakura-600" />
            <span className="text-[12px] font-semibold text-sakura-800">
              已选增值服务
            </span>
            <span className="text-[11px] text-sakura-600 ml-auto">
              /{unitLabel}
            </span>
          </div>
          <div className="space-y-1.5">
            {selectedUpgrades.map((upgrade) => (
              <div
                key={upgrade.id}
                className="flex items-center justify-between text-[12px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>{upgrade.icon}</span>
                  <span className="text-gray-700">{upgrade.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sakura-600 font-medium">
                    +¥{(upgrade.price / 100).toLocaleString()}/{unitLabel}
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

      {/* Booking form */}
      <div className="space-y-4 mb-6">
        {/* Date picker */}
        <div
          className={`border rounded-xl transition-colors cursor-pointer ${
            date && searchDate
              ? "border-green-500 bg-green-50/30"
              : "border-gray-300 hover:border-gray-900"
          }`}
          onClick={() => {
            const input = document.getElementById(
              "booking-date-input"
            ) as HTMLInputElement;
            input?.focus();
            try {
              input?.showPicker?.();
            } catch {
              input?.click();
            }
          }}
        >
          <div className="p-3">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 mb-2 cursor-pointer">
              <Calendar className="w-4 h-4 text-sakura-500" />
              到店日期
              {date && searchDate && (
                <span className="ml-auto text-[12px] text-green-600 font-normal">
                  已从搜索预填
                </span>
              )}
            </label>
            <input
              id="booking-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-[14px] text-gray-900 bg-transparent border-none outline-none cursor-pointer"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {/* Time picker */}
        <div className="border border-gray-300 rounded-xl hover:border-gray-900 transition-colors cursor-pointer relative">
          <div className="p-3">
            <label
              htmlFor="booking-time-select"
              className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 mb-2 cursor-pointer"
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
            <div className="text-[14px] text-gray-900 pointer-events-none">
              {time ? (
                <>
                  {time.startsWith("09") ||
                  time.startsWith("10") ||
                  time.startsWith("11")
                    ? "上午"
                    : time === "12:00"
                    ? "中午"
                    : "下午"}{" "}
                  {time}
                </>
              ) : (
                "请选择时间"
              )}
            </div>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="border border-gray-300 rounded-xl hover:border-gray-900 transition-colors">
          <div className="p-3">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 mb-2">
              {pricingUnit === "person" ? (
                <>
                  <span className="text-[16px]">👤</span>
                  人数
                </>
              ) : (
                <>
                  <span className="text-[16px]">📦</span>
                  数量
                </>
              )}
              {unitDescription && (
                <span className="text-[12px] text-gray-400 font-normal ml-1">
                  ({unitDescription})
                </span>
              )}
            </label>
            <div className="flex items-center justify-between">
              <button
                onClick={decreaseQuantity}
                disabled={quantity <= minQty}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-[16px] font-semibold text-gray-900">
                {quantity} {unitLabel}
              </span>
              <button
                onClick={increaseQuantity}
                disabled={quantity >= maxQty}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Phone input */}
        <div className="border border-gray-300 rounded-xl hover:border-gray-900 transition-colors">
          <div className="p-3">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 mb-2">
              <Phone className="w-4 h-4 text-sakura-500" />
              联系电话
              <span className="text-[12px] text-gray-400 font-normal">
                (可选)
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="用于预约确认通知"
              className="w-full text-[14px] text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Try-on button (secondary) */}
      <button
        onClick={() => setShowTryOnModal(true)}
        className="w-full mb-3 bg-white hover:bg-sakura-50 text-sakura-600 font-semibold py-3 px-6 rounded-lg border border-sakura-300 transition-all duration-300"
      >
        <span className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          试穿看看
        </span>
      </button>

      {/* Add to cart button */}
      <button
        onClick={handleAddToCart}
        disabled={!isFormValid}
        className={`w-full mb-3 font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
          ${
            addedToCart
              ? "bg-green-500 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Instant booking button (primary CTA) */}
      <button
        onClick={handleInstantBooking}
        disabled={!isFormValid}
        className="w-full mb-4 bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        立即预约
      </button>

      {/* Hint */}
      <div className="text-center text-[14px] text-gray-600 mb-6">
        预订前不会收费
      </div>

      {/* Price breakdown */}
      {(quantity > 1 || selectedUpgrades.length > 0) && (
        <div className="space-y-3 pt-6 border-t border-gray-200">
          {/* Unit price breakdown */}
          <div className="text-[12px] text-gray-500 mb-2">
            单价明细：套餐 ¥{(basePrice / 100).toLocaleString()}
            {selectedUpgrades.length > 0 && (
              <> + 增值 ¥{(upgradesPerUnit / 100).toLocaleString()}</>
            )}
            {" "}= ¥{(unitPriceWithUpgrades / 100).toLocaleString()}/{unitLabel}
          </div>

          {/* Total calculation */}
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-600">
              ¥{(unitPriceWithUpgrades / 100).toLocaleString()} × {quantity} {unitLabel}
            </span>
            <span className="text-gray-900 font-medium">
              ¥{(subtotal / 100).toLocaleString()}
            </span>
          </div>

          {/* Upgrades detail (collapsed style) */}
          {selectedUpgrades.length > 0 && (
            <div className="text-[12px] text-gray-500 pl-2 border-l-2 border-sakura-200">
              {selectedUpgrades.map((upgrade) => (
                <div key={upgrade.id} className="flex justify-between py-0.5">
                  <span>{upgrade.icon} {upgrade.name}</span>
                  <span>+¥{(upgrade.price / 100).toLocaleString()}/{unitLabel}</span>
                </div>
              ))}
            </div>
          )}

          {deposit > 0 && (
            <>
              <div className="flex justify-between text-[14px]">
                <span className="text-gray-600">定金</span>
                <span className="text-gray-900">
                  ¥{(deposit / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[14px] pt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-900">到店支付</span>
                <span className="font-semibold text-gray-900">
                  ¥{(balance / 100).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Security notice */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start gap-3 text-[14px] text-gray-600">
          <Shield className="w-4 h-4 text-sakura-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 mb-1">预订安全保障</p>
            <p className="text-[12px] leading-relaxed">
              我们承诺保护您的个人信息和支付安全，支持7天无理由取消政策
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Try-on modal */}
      <TryOnModal
        isOpen={showTryOnModal}
        onClose={() => setShowTryOnModal(false)}
        plan={plan}
      />

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

      {/* Desktop: Sidebar */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <BookingFormContent />
        </div>
      </div>

      {/* Mobile: Fixed bottom bar + modal */}
      <div className="lg:hidden">
        {/* Fixed bottom price bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl z-40 safe-area-bottom">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold text-gray-900">
                  ¥{(unitPriceWithUpgrades / 100).toLocaleString()}
                </span>
                <span className="text-[14px] text-gray-600">/ {unitLabel}</span>
              </div>
              {selectedUpgrades.length > 0 && (
                <div className="flex items-center gap-1 text-[12px] text-gray-500">
                  <span>含 {selectedUpgrades.length} 项增值</span>
                  <span className="text-sakura-500">
                    (+¥{(upgradesPerUnit / 100).toLocaleString()}/{unitLabel})
                  </span>
                </div>
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

        {/* Mobile modal */}
        {showMobileModal && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowMobileModal(false)}
            />

            {/* Bottom drawer */}
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 max-h-[90vh] overflow-y-auto safe-area-bottom">
              {/* Drag indicator */}
              <div className="flex justify-center py-3 border-b border-gray-200">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Title bar */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-[18px] font-semibold text-gray-900">
                  预订套餐
                </h2>
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Form content */}
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
