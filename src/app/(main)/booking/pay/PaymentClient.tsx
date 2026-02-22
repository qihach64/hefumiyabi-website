'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  CreditCard,
  Store,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface BookingItem {
  id: string;
  planName: string;
  planImage: string | null;
  storeName: string;
  storeCity: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BookingData {
  id: string;
  totalAmount: number;
  visitDate: string;
  visitTime: string;
  guestEmail: string | null;
  items: BookingItem[];
}

export default function PaymentClient({ booking }: { booking: BookingData }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<'online' | 'store' | null>(null);
  const [error, setError] = useState('');

  const visitDate = new Date(booking.visitDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 在线支付 → 创建 Stripe Checkout Session
  const handleOnlinePayment = async () => {
    setIsLoading('online');
    setError('');

    try {
      const res = await fetch('/api/trpc/payment.createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            bookingId: booking.id,
            ...(booking.guestEmail ? { customerEmail: booking.guestEmail } : {}),
          },
        }),
      });

      const data = await res.json();

      if (data.result?.data?.json?.url) {
        window.location.href = data.result.data.json.url;
      } else {
        throw new Error('无法创建支付会话');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '支付失败，请重试');
      setIsLoading(null);
    }
  };

  // 到店付款 → 直接跳转成功页
  const handleStorePayment = () => {
    setIsLoading('store');
    router.push(`/booking/success?bookingId=${booking.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 md:py-12 max-w-4xl mx-auto px-4">
        {/* 头部 */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-sakura-600 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            返回购物车
          </Link>
          <h1 className="text-[28px] md:text-[32px] font-semibold text-gray-900">选择支付方式</h1>
          <p className="text-[15px] text-gray-500 mt-2">
            预约已提交，请选择您偏好的支付方式
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* 左侧：支付方式 */}
          <div className="lg:col-span-3 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[14px]">
                {error}
              </div>
            )}

            {/* 在线支付 */}
            <button
              onClick={handleOnlinePayment}
              disabled={isLoading !== null}
              className="w-full bg-white rounded-xl border-2 border-sakura-200 hover:border-sakura-400 p-6 text-left transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sakura-50 flex items-center justify-center shrink-0 group-hover:bg-sakura-100 transition-colors">
                  {isLoading === 'online' ? (
                    <Loader2 className="w-6 h-6 text-sakura-600 animate-spin" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-sakura-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-gray-900">在线支付</span>
                    <span className="text-[12px] bg-sakura-50 text-sakura-600 px-2 py-0.5 rounded-lg font-medium">
                      推荐
                    </span>
                  </div>
                  <p className="text-[14px] text-gray-500 mt-1">
                    使用信用卡/借记卡安全支付，即时确认预约
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[12px] text-gray-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>由 Stripe 提供安全支付保障</span>
                  </div>
                </div>
              </div>
            </button>

            {/* 到店付款 */}
            <button
              onClick={handleStorePayment}
              disabled={isLoading !== null}
              className="w-full bg-white rounded-xl border border-gray-200 hover:border-gray-300 p-6 text-left transition-all duration-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors">
                  {isLoading === 'store' ? (
                    <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                  ) : (
                    <Store className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-[16px] font-semibold text-gray-900">到店付款</span>
                  <p className="text-[14px] text-gray-500 mt-1">
                    到店后现场支付，支持现金和刷卡
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* 右侧：订单摘要 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
              <h2 className="text-[16px] font-semibold text-gray-900 mb-4">订单摘要</h2>

              {/* 到店时间 */}
              <div className="flex items-center gap-4 text-[14px] text-gray-600 mb-4 pb-4 border-b border-gray-100">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sakura-400" />
                  {visitDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sakura-400" />
                  {booking.visitTime}
                </span>
              </div>

              {/* 商品列表 */}
              <div className="space-y-4 mb-4 pb-4 border-b border-gray-100">
                {booking.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.planImage ? (
                      <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <Image
                          src={item.planImage}
                          alt={item.planName}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-18 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Store className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-gray-900 line-clamp-1">
                        {item.planName}
                      </p>
                      <p className="text-[12px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {item.storeName}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12px] text-gray-400">x{item.quantity}</span>
                        <span className="text-[14px] font-medium text-gray-900">
                          ¥{(item.totalPrice / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 合计 */}
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-gray-900">合计</span>
                <span className="text-[22px] font-semibold text-sakura-600">
                  ¥{(booking.totalAmount / 100).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
