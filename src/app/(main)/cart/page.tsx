"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    updateVisitDate,
    updateVisitTime,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getItemsByStore,
    isReadyForCheckout,
  } = useCartStore();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCart = () => {
    if (confirm("确定要清空购物车吗？")) {
      setIsClearing(true);
      clearCart();
      setTimeout(() => setIsClearing(false), 500);
    }
  };

  // Format time display
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    const [hour] = timeStr.split(":");
    const hourNum = parseInt(hour);
    if (hourNum < 12) return `上午 ${timeStr}`;
    if (hourNum === 12) return `中午 ${timeStr}`;
    return `下午 ${timeStr}`;
  };

  // Format date display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-16 md:py-24">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingCart className="w-16 h-16 text-gray-400" />
            </div>
            <h1 className="text-[26px] font-semibold text-gray-900 mb-4">
              购物车是空的
            </h1>
            <p className="text-[14px] text-gray-500 mb-8">
              还没有添加任何套餐到购物车，去看看有哪些精彩套餐吧！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
              >
                浏览套餐
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex items-center justify-center border border-sakura-600 text-sakura-600 hover:bg-sakura-50 font-semibold py-3 px-8 rounded-lg transition-all duration-300"
              >
                查看优惠活动
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const itemsByStore = getItemsByStore();
  const readyForCheckout = isReadyForCheckout();

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              继续浏览
            </Link>
            <h1 className="text-[26px] md:text-[32px] font-semibold text-gray-900">
              购物车
            </h1>
            <p className="text-[14px] text-gray-500 mt-2">
              共 {totalItems} 个套餐
            </p>
          </div>
          <button
            onClick={handleClearCart}
            disabled={isClearing}
            className="text-[14px] text-gray-500 hover:text-red-600 transition-colors"
          >
            清空购物车
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items grouped by store */}
          <div className="lg:col-span-2 space-y-6">
            {itemsByStore.map((storeGroup) => (
              <div
                key={storeGroup.storeId}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Store header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-[14px]">
                    <MapPin className="w-4 h-4 text-sakura-500" />
                    <span className="font-medium text-gray-900">
                      {storeGroup.storeName}
                    </span>
                    <span className="text-gray-400">
                      ({storeGroup.items.length} 个套餐)
                    </span>
                  </div>
                </div>

                {/* Items in this store */}
                <div className="divide-y divide-gray-100">
                  {storeGroup.items.map((item) => (
                    <div key={item.id} className="p-4 md:p-6">
                      <div className="flex gap-4">
                        {/* Image */}
                        {item.image ? (
                          <div className="relative w-24 h-32 md:w-28 md:h-36 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 96px, 112px"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-32 md:w-28 md:h-36 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <span className="text-[32px]">👘</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[16px] text-gray-900 mb-1 line-clamp-2">
                                {item.name}
                              </h3>
                              <p className="text-[12px] text-gray-500">
                                {item.pricingUnit === "group" && item.unitDescription
                                  ? item.unitDescription
                                  : `${item.unitLabel || "人"}`}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-2 -mt-1 -mr-1"
                              aria-label="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Date/Time selection */}
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {/* Date */}
                            <div
                              className={`relative border rounded-lg p-2 cursor-pointer transition-colors ${
                                item.visitDate
                                  ? "border-green-300 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1 cursor-pointer">
                                <Calendar className="w-3 h-3" />
                                到店日期
                              </label>
                              <input
                                type="date"
                                value={item.visitDate || ""}
                                onChange={(e) =>
                                  updateVisitDate(item.id, e.target.value)
                                }
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full text-[13px] text-gray-900 bg-transparent border-none outline-none cursor-pointer"
                              />
                              {item.visitDate && (
                                <Check className="absolute top-2 right-2 w-3 h-3 text-green-500" />
                              )}
                            </div>

                            {/* Time */}
                            <div
                              className={`relative border rounded-lg p-2 cursor-pointer transition-colors ${
                                item.visitTime
                                  ? "border-green-300 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1 cursor-pointer">
                                <Clock className="w-3 h-3" />
                                到店时间
                              </label>
                              <select
                                value={item.visitTime || ""}
                                onChange={(e) =>
                                  updateVisitTime(item.id, e.target.value)
                                }
                                className="w-full text-[13px] text-gray-900 bg-transparent border-none outline-none cursor-pointer"
                              >
                                <option value="">选择时间</option>
                                <option value="09:00">09:00</option>
                                <option value="09:30">09:30</option>
                                <option value="10:00">10:00</option>
                                <option value="10:30">10:30</option>
                                <option value="11:00">11:00</option>
                                <option value="11:30">11:30</option>
                                <option value="12:00">12:00</option>
                                <option value="13:00">13:00</option>
                                <option value="13:30">13:30</option>
                                <option value="14:00">14:00</option>
                                <option value="14:30">14:30</option>
                                <option value="15:00">15:00</option>
                                <option value="15:30">15:30</option>
                                <option value="16:00">16:00</option>
                              </select>
                              {item.visitTime && (
                                <Check className="absolute top-2 right-2 w-3 h-3 text-green-500" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Quantity control */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.max(
                                      item.minQuantity || 1,
                                      item.quantity - 1
                                    )
                                  )
                                }
                                disabled={
                                  item.quantity <= (item.minQuantity || 1)
                                }
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="减少数量"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center text-[14px] font-medium text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={
                                  item.quantity >= (item.maxQuantity || 10)
                                }
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="增加数量"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <div className="text-[18px] font-semibold text-gray-900">
                                ¥
                                {(
                                  (item.price * item.quantity) /
                                  100
                                ).toLocaleString()}
                              </div>
                              {item.quantity > 1 && (
                                <div className="text-[12px] text-gray-500">
                                  ¥{(item.price / 100).toLocaleString()} ×{" "}
                                  {item.quantity}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Add-ons */}
                          {item.addOns && item.addOns.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-[12px] text-gray-500">
                                附加服务: {item.addOns.join(", ")}
                              </p>
                            </div>
                          )}

                          {/* Notes */}
                          {item.notes && (
                            <div className="mt-2">
                              <p className="text-[12px] text-gray-500">
                                备注: {item.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Store subtotal */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-gray-600">店铺小计</span>
                    <span className="font-semibold text-gray-900">
                      ¥{(storeGroup.subtotal / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h2 className="text-[18px] font-semibold text-gray-900 mb-6">
                订单摘要
              </h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-[14px]">
                  <span className="text-gray-500">套餐数量</span>
                  <span className="font-medium text-gray-900">
                    {totalItems} 个
                  </span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-gray-500">店铺数</span>
                  <span className="font-medium text-gray-900">
                    {itemsByStore.length} 家
                  </span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-gray-500">小计</span>
                  <span className="font-medium text-gray-900">
                    ¥{(totalPrice / 100).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[18px] font-semibold mb-6">
                <span className="text-gray-900">总计</span>
                <span className="text-sakura-600">
                  ¥{(totalPrice / 100).toLocaleString()}
                </span>
              </div>

              {/* Validation warning */}
              {!readyForCheckout && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-yellow-800">
                    请为所有套餐选择到店日期和时间
                  </p>
                </div>
              )}

              <Link
                href="/booking"
                className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-lg transition-all duration-300 mb-3 ${
                  readyForCheckout
                    ? "bg-sakura-600 hover:bg-sakura-700 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!readyForCheckout) {
                    e.preventDefault();
                  }
                }}
              >
                <Check className="w-4 h-4" />
                去预约
              </Link>

              <Link
                href="/plans"
                className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                继续购物
              </Link>

              {/* Multi-store notice */}
              {itemsByStore.length > 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    您的订单包含 {itemsByStore.length}{" "}
                    家店铺的套餐，预约时将自动拆分为独立订单以便店铺处理。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
