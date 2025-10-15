"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Calendar, MapPin, Mail, Home, User } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("id");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      router.push("/");
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        const data = await response.json();
        setBooking(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching booking:", error);
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">预约信息未找到</p>
          <Link
            href="/"
            className="text-rose-600 hover:text-rose-700 font-medium"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 成功图标 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            预约成功！
          </h1>
          <p className="text-gray-600">
            感谢您的预约，我们已收到您的预约信息
          </p>
        </div>

        {/* 预约详情卡片 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">预约详情</h2>
              <span className="text-sm text-gray-500">
                预约编号: {booking.id.slice(0, 8)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* 预约项目 */}
            {booking.items && booking.items.length > 0 && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">预约项目</p>
                  <div className="space-y-1 mt-1">
                    {booking.items.map((item: any, idx: number) => (
                      <div key={idx} className="font-medium text-gray-900">
                        {item.plan?.name || "和服租赁"} × {item.quantity}
                        {item.store && (
                          <span className="text-sm text-gray-600 ml-2">
                            ({item.store.name})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 店铺信息 */}
            {booking.items && booking.items.length > 0 && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">店铺</p>
                  {Array.from(new Set(booking.items.map((item: any) => JSON.stringify({
                    name: item.store.name,
                    city: item.store.city,
                    address: item.store.address,
                  })))).map((storeJson: string, idx: number) => {
                    const store = JSON.parse(storeJson);
                    return (
                      <div key={idx} className="mt-1">
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-600">
                          {store.city} - {store.address}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 日期信息 */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">到店时间</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.visitDate).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  {booking.visitTime}
                </p>
              </div>
            </div>

            {/* 联系信息 */}
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">确认邮件已发送至</p>
                <p className="font-medium text-gray-900">
                  {booking.guestEmail || booking.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">温馨提示</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>我们已向您的邮箱发送预约确认信息，请注意查收</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>我们将在24小时内与您联系确认预约详情</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>请在预约时间前15分钟到店</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>如需取消或修改预约，请提前3天联系我们</span>
            </li>
          </ul>
        </div>

        {/* 游客注册提示 */}
        {!booking.userId && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-rose-900 mb-2">
              注册账户享受更多优惠
            </h3>
            <p className="text-sm text-rose-800 mb-4">
              注册后可以查看预约历史、获得会员折扣、优先预约特别活动
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-2 px-6 rounded-lg hover:from-rose-600 hover:to-pink-600 transition shadow-md hover:shadow-lg text-sm"
            >
              <User className="w-4 h-4" />
              立即注册
            </Link>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4">
          {booking.userId && (
            <Link
              href="/profile#bookings"
              className="flex-1 text-center bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-rose-600 hover:to-pink-600 transition shadow-md hover:shadow-lg"
            >
              查看我的预约
            </Link>
          )}
          <Link
            href="/"
            className="flex-1 text-center border-2 border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition"
          >
            <Home className="w-5 h-5 inline mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">加载中...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
