"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ShoppingCart, MapPin, User, Mail, Phone, ArrowLeft, Check } from "lucide-react";

function BookingContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const searchParams = useSearchParams();

  // 读取URL搜索参数
  const searchDate = searchParams.get('date');
  const searchTime = searchParams.get('time');

  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [visitTime, setVisitTime] = useState("");
  const [guestName, setGuestName] = useState(session?.user?.name || "");
  const [guestEmail, setGuestEmail] = useState(session?.user?.email || "");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 自动填充搜索参数
  useEffect(() => {
    if (searchDate) {
      setVisitDate(new Date(searchDate));
    }
    if (searchTime) {
      setVisitTime(searchTime);
    }
  }, [searchDate, searchTime]);

  // 如果购物车为空，引导用户选择套餐
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">还没有选择套餐</h1>
          <p className="text-muted-foreground mb-6">
            请先浏览并选择您喜欢的和服租赁套餐。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              浏览套餐
            </Link>
            <Link
              href="/campaigns"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-primary text-primary hover:bg-primary/10 h-11 px-8"
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <MapPin className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">请先选择店铺</h1>
          <p className="text-muted-foreground mb-6">
            所有套餐都必须选择店铺后才能进行预约。
          </p>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
          >
            返回购物车
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

    // 验证
    if (!visitDate) {
      setError("请选择到店日期");
      return;
    }
    if (!visitTime) {
      setError("请选择到店时间");
      return;
    }
    if (!guestName) {
      setError("请输入姓名");
      return;
    }
    if (!guestEmail) {
      setError("请输入邮箱");
      return;
    }
    if (!guestPhone) {
      setError("请输入手机号");
      return;
    }

    setIsSubmitting(true);

    try {
      // 创建一个预约，包含所有购物车项目
      const bookingData = {
        visitDate: visitDate.toISOString(),
        visitTime,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        items: items.map((item) => ({
          storeId: item.storeId,
          type: item.type,
          planId: item.planId,
          campaignPlanId: item.campaignPlanId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          addOns: item.addOns,
          notes: item.notes,
        })),
        totalAmount: totalPrice,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "创建预约失败");
      }

      const result = await response.json();

      // 跳转到成功页面
      if (result.id) {
        const successUrl = `/booking/success?id=${result.id}`;
        router.push(successUrl);

        // 延迟清空购物车，避免用户看到空购物车页面
        setTimeout(() => {
          clearCart();
        }, 100);
      } else {
        router.push("/booking/success");
        setTimeout(() => {
          clearCart();
        }, 100);
      }
    } catch (err) {
      console.error("Booking error:", err);
      const errorMessage = err instanceof Error ? err.message : "创建预约失败，请重试";

      // 如果是套餐不存在的错误，提示用户清空购物车
      if (errorMessage.includes("套餐已不存在") || errorMessage.includes("不存在")) {
        setError(errorMessage + " - 您可以尝试清空购物车并重新选择套餐");
      } else {
        setError(errorMessage);
      }

      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 md:py-12">
        {/* 头部 */}
        <div className="mb-8">
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            继续浏览套餐
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">确认预约</h1>
          <p className="text-muted-foreground mt-2">
            请填写到店信息完成预约
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：预约表单 */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 错误提示 */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  <p className="mb-2">{error}</p>
                  {(error.includes("不存在") || error.includes("已不存在")) && (
                    <button
                      type="button"
                      onClick={() => {
                        clearCart();
                        router.push("/plans");
                      }}
                      className="mt-2 inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      清空购物车并重新选择
                    </button>
                  )}
                </div>
              )}

              {/* 到店信息 */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">到店信息</h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-foreground mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      到店日期 <span className="text-destructive ml-1">*</span>
                      {visitDate && searchDate && (
                        <span className="ml-auto text-xs text-green-600 font-normal">✓ 已从搜索预填</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={visitDate?.toISOString().split("T")[0] || ""}
                      onChange={(e) => setVisitDate(e.target.value ? new Date(e.target.value) : null)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className={`w-full px-4 py-3 rounded-md border text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition ${
                        visitDate && searchDate
                          ? 'border-green-500 bg-green-50/30'
                          : 'border-input bg-background'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-foreground mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      到店时间 <span className="text-destructive ml-1">*</span>
                      {visitTime && searchTime && (
                        <span className="ml-auto text-xs text-green-600 font-normal">✓ 已从搜索预填</span>
                      )}
                    </label>
                    <input
                      type="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      required
                      className={`w-full px-4 py-3 rounded-md border text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition ${
                        visitTime && searchTime
                          ? 'border-green-500 bg-green-50/30'
                          : 'border-input bg-background'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 联系信息 */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">联系信息</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      姓名 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      placeholder="请输入您的姓名"
                      className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      邮箱 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      placeholder="example@email.com"
                      className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      手机号 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                      placeholder="请输入您的手机号"
                      className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* 特殊要求 */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">特殊要求（可选）</h2>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="如有特殊要求或备注，请在此处填写..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition resize-none"
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4">
                <Link
                  href="/plans"
                  className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input hover:bg-accent hover:text-accent-foreground h-12 px-6"
                >
                  继续浏览
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>提交中...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>确认预约</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 右侧：订单摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6">订单摘要</h2>

              {/* 按店铺显示项目 */}
              <div className="space-y-6 mb-6 pb-6 border-b">
                {Object.entries(itemsByStore).map(([storeId, storeItems]) => {
                  const storeName = storeItems[0]?.storeName || "未知店铺";
                  return (
                    <div key={storeId}>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{storeName}</span>
                      </div>
                      <div className="space-y-3">
                        {storeItems.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            {item.image ? (
                              <div className="relative w-16 h-20 rounded-md overflow-hidden bg-secondary shrink-0">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-20 rounded-md bg-secondary flex items-center justify-center shrink-0">
                                <span className="text-2xl">👘</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                数量: {item.quantity}
                              </p>
                              <p className="text-sm font-semibold text-primary mt-1">
                                ¥{((item.price * item.quantity) / 100).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 总计 */}
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">套餐总数</span>
                  <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)} 个</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">小计</span>
                  <span className="font-medium">¥{(totalPrice / 100).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold">
                <span>总计</span>
                <span className="text-primary">¥{(totalPrice / 100).toLocaleString()}</span>
              </div>

              {/* 提示信息 */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
