"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ShoppingCart,
  MapPin,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ContactForm, PriceBreakdown, type ContactFormValues } from "@/features/guest/booking";

// 格式化日期显示
function formatDate(dateStr?: string) {
  if (!dateStr) return "未设置";
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function BookingContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart, getTotalPrice, isReadyForCheckout } = useCartStore();

  // 联系信息 - 使用共享组件的类型
  const [contactValues, setContactValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 自动填充用户信息
  useEffect(() => {
    if (session?.user) {
      setContactValues((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || "",
        email: prev.email || session.user?.email || "",
      }));
    }
  }, [session]);

  // 如果购物车为空，引导用户选择套餐
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-wabi-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-sakura-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-sakura-500" />
          </div>
          <h1 className="text-[22px] font-semibold text-gray-900 mb-3">还没有选择套餐</h1>
          <p className="text-[15px] text-gray-500 mb-6">
            请先浏览并选择您喜欢的和服租赁套餐。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center bg-sakura-600 hover:bg-sakura-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              浏览套餐
            </Link>
            <Link
              href="/plans?sort=discount"
              className="inline-flex items-center justify-center border border-sakura-300 text-sakura-700 hover:bg-sakura-50 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              查看优惠活动
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 检查是否所有项目都选择了店铺
  const allItemsHaveStore = items.every((item) => item.storeId);
  if (!allItemsHaveStore) {
    return (
      <div className="min-h-screen bg-wabi-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-[22px] font-semibold text-gray-900 mb-3">请先选择店铺</h1>
          <p className="text-[15px] text-gray-500 mb-6">
            所有套餐都必须选择店铺后才能进行预约。
          </p>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center bg-sakura-600 hover:bg-sakura-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            返回购物车
          </Link>
        </div>
      </div>
    );
  }

  // 检查是否所有项目都有日期时间
  const allItemsHaveDateTime = isReadyForCheckout();
  if (!allItemsHaveDateTime) {
    return (
      <div className="min-h-screen bg-wabi-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-[22px] font-semibold text-gray-900 mb-3">请先选择预约时间</h1>
          <p className="text-[15px] text-gray-500 mb-6">
            所有套餐都必须设置到店日期和时间后才能进行预约。
          </p>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center bg-sakura-600 hover:bg-sakura-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            返回购物车设置时间
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();

  // 按店铺分组购物车项目
  const itemsByStore = items.reduce((acc, item) => {
    const storeKey = item.storeId || "unknown";
    if (!acc[storeKey]) {
      acc[storeKey] = [];
    }
    acc[storeKey].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证联系信息
    if (!contactValues.name) {
      setError("请输入姓名");
      return;
    }
    if (!contactValues.email) {
      setError("请输入邮箱");
      return;
    }
    if (!contactValues.phone) {
      setError("请输入手机号");
      return;
    }

    setIsSubmitting(true);

    try {
      // 每个 item 使用自己的 visitDate/visitTime
      const bookingData = {
        guestName: contactValues.name,
        guestEmail: contactValues.email,
        guestPhone: contactValues.phone,
        specialRequests: contactValues.notes,
        items: items.map((item) => ({
          storeId: item.storeId,
          type: item.type,
          planId: item.planId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          addOns: item.addOns,
          notes: item.notes,
          // 每个 item 自己的预约时间
          visitDate: item.visitDate,
          visitTime: item.visitTime,
        })),
        totalAmount: totalPrice,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "创建预约失败");
      }

      const result = await response.json();

      if (result.id) {
        // 跳转到支付页面选择支付方式
        const viewTokenParam = result.viewToken ? `&viewToken=${result.viewToken}` : '';
        router.push(`/booking/pay?bookingId=${result.id}${viewTokenParam}`);
        setTimeout(() => clearCart(), 100);
      } else if (result.ids && result.ids.length > 0) {
        // 多店铺拆分：跳转第一个预约的支付页
        router.push(`/booking/pay?bookingId=${result.ids[0]}`);
        setTimeout(() => clearCart(), 100);
      } else {
        router.push("/booking/success");
        setTimeout(() => clearCart(), 100);
      }
    } catch (err) {
      console.error("Booking error:", err);
      const errorMessage = err instanceof Error ? err.message : "创建预约失败，请重试";

      if (errorMessage.includes("套餐已不存在") || errorMessage.includes("不存在")) {
        setError(errorMessage + " - 您可以尝试清空购物车并重新选择套餐");
      } else {
        setError(errorMessage);
      }

      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-wabi-50">
      <div className="container py-8 md:py-12">
        {/* 头部 */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-sakura-600 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            返回购物车
          </Link>
          <h1 className="text-[28px] md:text-[32px] font-semibold text-gray-900">确认预约</h1>
          <p className="text-[15px] text-gray-500 mt-2">
            请确认预约信息并填写联系方式
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：预约表单 */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 错误提示 */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[14px]">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{error}</p>
                    {(error.includes("不存在") || error.includes("已不存在")) && (
                      <button
                        type="button"
                        onClick={() => {
                          clearCart();
                          router.push("/plans");
                        }}
                        className="mt-2 inline-flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        清空购物车并重新选择
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 联系信息 - 使用共享组件 */}
              <div className="bg-white rounded-xl border border-wabi-200 p-6">
                <ContactForm
                  values={contactValues}
                  onChange={setContactValues}
                  showTitle={true}
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4">
                <Link
                  href="/cart"
                  className="flex-1 inline-flex items-center justify-center border border-wabi-300 text-gray-700 hover:bg-wabi-50 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  返回购物车
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      确认预约
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 右侧：订单摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-wabi-200 p-6 sticky top-4">
              <h2 className="text-[18px] font-semibold text-gray-900 mb-6">订单摘要</h2>

              {/* 按店铺显示项目 */}
              <div className="space-y-6 mb-6 pb-6 border-b border-wabi-100">
                {Object.entries(itemsByStore).map(([storeId, storeItems]) => {
                  const storeName = storeItems[0]?.storeName || "未知店铺";
                  return (
                    <div key={storeId}>
                      <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 mb-3">
                        <MapPin className="w-4 h-4 text-sakura-500" />
                        <span>{storeName}</span>
                      </div>
                      <div className="space-y-4">
                        {storeItems.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            {item.image ? (
                              <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-wabi-100 shrink-0">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-20 rounded-lg bg-wabi-100 flex items-center justify-center shrink-0">
                                <span className="text-2xl">👘</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-gray-900 line-clamp-2">
                                {item.name}
                              </p>
                              {/* 显示每个 item 的预约时间 */}
                              <div className="flex items-center gap-3 mt-1 text-[12px] text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-sakura-400" />
                                  {formatDate(item.visitDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-sakura-400" />
                                  {item.visitTime || "未设置"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[12px] text-gray-400">
                                  × {item.quantity} {item.unitLabel || "人"}
                                </p>
                                <p className="text-[14px] font-semibold text-sakura-600">
                                  ¥{((item.price * item.quantity) / 100).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 价格明细 - 使用共享组件 */}
              <PriceBreakdown
                mode="multi"
                items={items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  image: item.image,
                  price: item.price,
                  quantity: item.quantity,
                  storeName: item.storeName,
                }))}
              />

              {/* 提示信息 */}
              <div className="mt-6 pt-6 border-t border-wabi-100">
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  预约成功后，您将收到确认邮件。请在预约时间准时到店，我们将为您准备好一切。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-wabi-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-sakura-500 animate-spin" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
