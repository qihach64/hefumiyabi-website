"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Mail, Home, User, Package, Clock } from "lucide-react";

// 预约状态中文映射
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "待确认", color: "text-amber-700", bg: "bg-amber-100" },
  CONFIRMED: { label: "已确认", color: "text-blue-700", bg: "bg-blue-100" },
  IN_PROGRESS: { label: "进行中", color: "text-green-700", bg: "bg-green-100" },
  COMPLETED: { label: "已完成", color: "text-gray-700", bg: "bg-gray-100" },
  CANCELLED: { label: "已取消", color: "text-red-700", bg: "bg-red-100" },
  NO_SHOW: { label: "未到店", color: "text-red-700", bg: "bg-red-100" },
};

export default function BookingStatusClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("缺少查询凭证");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/status?token=${token}`);
        if (!response.ok) {
          setError(response.status === 404 ? "预约未找到" : "查询失败");
          setLoading(false);
          return;
        }
        const data = await response.json();
        setBooking(data);
        setLoading(false);
      } catch {
        setError("网络错误，请稍后重试");
        setLoading(false);
      }
    };

    fetchBooking();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || "预约信息未找到"}</p>
          <Link href="/" className="text-shu-600 hover:text-shu-700 font-medium">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[booking.status] || STATUS_MAP.PENDING;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF7F5]/60 via-white to-[#FFF7F5]/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 标题 + 状态 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">预约详情</h1>
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bg}`}>
            <Clock className="w-4 h-4" />
            {statusInfo.label}
          </span>
        </div>

        {/* 预约详情卡片 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">预约信息</h2>
              <span className="text-sm text-gray-500">编号: {booking.id.slice(0, 8)}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* 预约项目 */}
            {booking.items && booking.items.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">预约项目</p>
                </div>
                <div className="space-y-3">
                  {booking.items.map((item: any, idx: number) => {
                    const itemImage = item.plan?.imageUrl || null;
                    return (
                      <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        {itemImage ? (
                          <div className="relative w-16 h-20 rounded-md overflow-hidden bg-gray-200 shrink-0">
                            <Image
                              src={itemImage}
                              alt={item.plan?.name || "和服"}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-20 rounded-md bg-gray-200 flex items-center justify-center shrink-0">
                            <span className="text-2xl">👘</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {item.plan?.name || "和服租赁"}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            数量: {item.quantity} · ¥{(item.totalPrice / 100).toLocaleString()}
                          </div>
                          {item.store && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.store.name}
                            </div>
                          )}
                          {item.addOns && item.addOns.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              附加: {item.addOns.join("、")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* 合计 */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">合计</span>
                  <span className="text-lg font-bold text-shu-600">
                    ¥{(booking.totalAmount / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* 店铺信息 */}
            {booking.items && booking.items.length > 0 && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">店铺</p>
                  {Array.from(
                    new Set(
                      booking.items.map((item: any) =>
                        JSON.stringify({
                          name: item.store.name,
                          city: item.store.city,
                          address: item.store.address,
                        })
                      )
                    )
                  ).map((storeJson, idx: number) => {
                    const store = JSON.parse(String(storeJson));
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
            {(booking.guestEmail || booking.guestName) && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">预约人</p>
                  <p className="font-medium text-gray-900">
                    {booking.guestName}
                    {booking.guestEmail && (
                      <span className="text-gray-500 text-sm ml-2">{booking.guestEmail}</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* 备注 */}
            {booking.specialRequests && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">备注</p>
                <p className="text-gray-700">{booking.specialRequests}</p>
              </div>
            )}
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">温馨提示</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">·</span>
              <span>请在预约时间前15分钟到店</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">·</span>
              <span>如需取消或修改预约，请提前3天联系我们</span>
            </li>
          </ul>
        </div>

        {/* 游客注册提示 */}
        <div className="bg-shu-50 border border-shu-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-shu-900 mb-2">注册账户享受更多优惠</h3>
          <p className="text-sm text-shu-800 mb-4">
            注册后可以查看预约历史、获得会员折扣、优先预约特别活动
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-shu-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-shu-600 transition shadow-md hover:shadow-lg text-sm"
          >
            <User className="w-4 h-4" />
            立即注册
          </Link>
        </div>

        {/* 返回首页 */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 border-2 border-gray-300 text-gray-700 font-medium py-3 px-8 rounded-lg hover:bg-gray-50 transition"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
