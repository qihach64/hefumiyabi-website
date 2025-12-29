"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Shield,
  X,
  Check,
  ShoppingCart,
  Minus,
  Plus,
  Phone,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui";
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

  // Focus state for Airbnb-style input group
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  // Format time display
  const formatTimeDisplay = (t: string) => {
    if (!t) return null;
    const period = t.startsWith("09") || t.startsWith("10") || t.startsWith("11")
      ? "上午"
      : t === "12:00"
      ? "中午"
      : "下午";
    return `${period} ${t}`;
  };

  // Booking form content (shared between desktop and mobile)
  const BookingFormContent = () => (
    <>
      {/* ========================================
          Price Display - Refined Typography
      ======================================== */}
      <div className="mb-6">
        {selectedUpgrades.length > 0 ? (
          <>
            {/* With upgrades badge */}
            <div className="mb-2">
              <span className="inline-flex items-center text-[11px] px-2 py-0.5 bg-sakura-50 text-sakura-600 rounded-full font-medium tracking-wide">
                含增值服务
              </span>
            </div>
            {/* Price with upgrades */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold text-stone-800 tracking-tight">
                ¥{(unitPriceWithUpgrades / 100).toLocaleString()}
              </span>
              <span className="text-[14px] text-stone-400 font-normal">
                /{unitLabel}
              </span>
            </div>
            {/* Breakdown hint */}
            <p className="text-[12px] text-stone-400 mt-1">
              基础 ¥{(basePrice / 100).toLocaleString()} + 增值 ¥{(upgradesPerUnit / 100).toLocaleString()}
            </p>
          </>
        ) : (
          <>
            {/* Standard price */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold text-stone-800 tracking-tight">
                ¥{(plan.price / 100).toLocaleString()}
              </span>
              <span className="text-[14px] text-stone-400 font-normal">
                /{unitLabel}
              </span>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <span className="text-[14px] text-stone-300 line-through ml-2">
                  ¥{(plan.originalPrice / 100).toLocaleString()}
                </span>
              )}
            </div>
            {unitDescription && (
              <p className="text-[12px] text-stone-400 mt-1">{unitDescription}</p>
            )}
          </>
        )}

        {/* Campaign badge */}
        {plan.isCampaign && (
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="error" size="sm">
              限时 -{discountPercent}%
            </Badge>
          </div>
        )}
      </div>

      {/* ========================================
          Store Info - Subtle Card
      ======================================== */}
      <div className="mb-5 px-4 py-3 bg-stone-50/80 rounded-xl">
        <div className="flex items-center gap-2 text-[13px]">
          <MapPin className="w-3.5 h-3.5 text-sakura-500" />
          <span className="text-stone-700 font-medium">{store.name}</span>
        </div>
      </div>

      {/* ========================================
          Selected Upgrades - Compact List
      ======================================== */}
      {selectedUpgrades.length > 0 && (
        <div className="mb-5 px-4 py-3 bg-sakura-50/50 rounded-xl border border-sakura-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-sakura-500" />
              <span className="text-[11px] font-semibold text-sakura-700 uppercase tracking-wider">
                已选增值
              </span>
            </div>
            <span className="text-[10px] text-sakura-400">/{unitLabel}</span>
          </div>
          <div className="space-y-1">
            {selectedUpgrades.map((upgrade) => (
              <div
                key={upgrade.id}
                className="flex items-center justify-between text-[12px] group"
              >
                <span className="text-stone-600">
                  {upgrade.icon} {upgrade.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sakura-600 font-medium">
                    +¥{(upgrade.price / 100).toLocaleString()}
                  </span>
                  <button
                    onClick={() => onRemoveUpgrade?.(upgrade.id)}
                    className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full bg-stone-200 hover:bg-red-100 flex items-center justify-center transition-all"
                  >
                    <X className="w-2.5 h-2.5 text-stone-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================
          Airbnb-Style Input Group
      ======================================== */}
      <div className={`mb-5 rounded-xl border transition-colors duration-200 overflow-hidden ${
        focusedField ? "border-stone-800" : "border-stone-200"
      }`}>
        {/* Date + Time Row */}
        <div className="grid grid-cols-2 divide-x divide-stone-200">
          {/* Date */}
          <div
            className={`relative p-3 cursor-pointer transition-colors ${
              focusedField === "date" ? "bg-white" : "hover:bg-stone-50/50"
            } ${date && searchDate ? "bg-green-50/30" : ""}`}
            onClick={() => {
              setFocusedField("date");
              const input = document.getElementById("booking-date-input") as HTMLInputElement;
              input?.focus();
              try {
                input?.showPicker?.();
              } catch {
                input?.click();
              }
            }}
          >
            <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
              到店日期
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sakura-500" />
              <input
                id="booking-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={() => setFocusedField("date")}
                onBlur={() => setFocusedField(null)}
                className="w-full text-[14px] text-stone-800 bg-transparent border-none outline-none cursor-pointer"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            {date && searchDate && (
              <span className="absolute top-2 right-2 text-[9px] text-green-600 font-medium">
                ✓ 预填
              </span>
            )}
          </div>

          {/* Time */}
          <div
            className={`relative p-3 cursor-pointer transition-colors ${
              focusedField === "time" ? "bg-white" : "hover:bg-stone-50/50"
            }`}
          >
            <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
              到店时间
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sakura-500" />
              <select
                id="booking-time-select"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onFocus={() => setFocusedField("time")}
                onBlur={() => setFocusedField(null)}
                className="flex-1 text-[14px] text-stone-800 bg-transparent border-none outline-none cursor-pointer appearance-none"
              >
                <option value="">选择时间</option>
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
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quantity Row - Full Width Below */}
        <div
          className={`p-3 border-t border-stone-200 cursor-pointer transition-colors ${
            focusedField === "quantity" ? "bg-white" : "hover:bg-stone-50/50"
          }`}
          onClick={() => setFocusedField("quantity")}
        >
          <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
            {pricingUnit === "person" ? "人数" : "数量"}
            {unitDescription && (
              <span className="text-stone-400 font-normal ml-1 normal-case">
                ({unitDescription})
              </span>
            )}
          </label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">{pricingUnit === "person" ? "👤" : "📦"}</span>
              <span className="text-[14px] text-stone-800 font-medium">
                {quantity} {unitLabel}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decreaseQuantity();
                }}
                disabled={quantity <= minQty}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:border-stone-400 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  increaseQuantity();
                }}
                disabled={quantity >= maxQty}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:border-stone-400 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          Phone Input - Optional, Separated
      ======================================== */}
      <div
        className={`mb-6 p-3 rounded-xl border transition-colors ${
          focusedField === "phone" ? "border-stone-800" : "border-stone-200 hover:border-stone-300"
        }`}
      >
        <label className="flex items-center gap-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
          <Phone className="w-3.5 h-3.5 text-sakura-500" />
          联系电话
          <span className="text-stone-300 font-normal normal-case">(可选)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onFocus={() => setFocusedField("phone")}
          onBlur={() => setFocusedField(null)}
          placeholder="用于预约确认通知"
          className="w-full text-[14px] text-stone-800 bg-transparent border-none outline-none placeholder:text-stone-300"
        />
      </div>

      {/* ========================================
          Action Buttons
      ======================================== */}
      <div className="space-y-3 mb-4">
        {/* Primary: Instant Booking - Gradient */}
        <button
          onClick={handleInstantBooking}
          disabled={!isFormValid}
          className="w-full bg-gradient-to-r from-sakura-500 to-sakura-600 hover:from-sakura-600 hover:to-sakura-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(236,72,153,0.25)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.35)] hover:-translate-y-0.5"
        >
          立即预约
        </button>

        {/* Secondary: Add to Cart - Ghost Style */}
        <button
          onClick={handleAddToCart}
          disabled={!isFormValid}
          className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            addedToCart
              ? "bg-green-500 text-white border border-green-500"
              : "bg-transparent text-stone-700 border border-stone-200 hover:border-stone-400 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* No charge hint */}
      <p className="text-center text-[12px] text-stone-400 mb-6">
        预订前不会收费
      </p>

      {/* ========================================
          Price Breakdown - Compact
      ======================================== */}
      {(quantity > 1 || selectedUpgrades.length > 0) && (
        <div className="pt-5 border-t border-stone-100 space-y-2">
          {/* Unit breakdown */}
          <p className="text-[11px] text-stone-400">
            ¥{(unitPriceWithUpgrades / 100).toLocaleString()}/{unitLabel} × {quantity}
          </p>

          {/* Subtotal */}
          <div className="flex justify-between text-[14px]">
            <span className="text-stone-600">小计</span>
            <span className="text-stone-800 font-medium">
              ¥{(subtotal / 100).toLocaleString()}
            </span>
          </div>

          {/* Deposit breakdown */}
          {deposit > 0 && (
            <>
              <div className="flex justify-between text-[13px] text-stone-500">
                <span>定金</span>
                <span>¥{(deposit / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[14px] pt-2 border-t border-stone-100">
                <span className="font-medium text-stone-800">到店支付</span>
                <span className="font-semibold text-stone-800">
                  ¥{(balance / 100).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================
          Security Notice - Minimal
      ======================================== */}
      <div className="mt-6 pt-5 border-t border-stone-100">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-sakura-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-medium text-stone-600 mb-0.5">预订安全保障</p>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              信息安全加密 · 7天无理由取消
            </p>
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
          Desktop: Floating Sidebar Card
      ======================================== */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-shadow duration-300">
          <BookingFormContent />
        </div>
      </div>

      {/* ========================================
          Mobile: Fixed Bottom Bar + Drawer
      ======================================== */}
      <div className="lg:hidden">
        {/* Fixed bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 safe-area-bottom">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-[20px] font-semibold text-stone-800">
                  ¥{(unitPriceWithUpgrades / 100).toLocaleString()}
                </span>
                <span className="text-[13px] text-stone-400">/{unitLabel}</span>
              </div>
              {selectedUpgrades.length > 0 && (
                <p className="text-[11px] text-sakura-500">
                  含 {selectedUpgrades.length} 项增值
                </p>
              )}
            </div>
            <button
              onClick={() => setShowMobileModal(true)}
              className="bg-gradient-to-r from-sakura-500 to-sakura-600 text-white font-semibold py-3 px-8 rounded-xl shadow-[0_4px_12px_rgba(236,72,153,0.3)] transition-all duration-300"
            >
              预订
            </button>
          </div>
        </div>

        {/* Mobile drawer modal */}
        {showMobileModal && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowMobileModal(false)}
            />

            {/* Bottom drawer */}
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto safe-area-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
              {/* Drag handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-stone-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-stone-100">
                <h2 className="text-[18px] font-semibold text-stone-800">
                  预订套餐
                </h2>
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              {/* Content */}
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
