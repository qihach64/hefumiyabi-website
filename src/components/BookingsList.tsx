"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Package, ChevronDown, ChevronUp } from "lucide-react";
import CancelBookingButton from "./CancelBookingButton";

interface BookingsListProps {
  bookings: any[];
}

export default function BookingsList({ bookings }: BookingsListProps) {
  const router = useRouter();
  const [showCancelled, setShowCancelled] = useState(false);

  // 分离活跃预约和已取消预约
  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED");

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Calendar className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          您还没有任何预约记录
        </p>
        <Link
          href="/plans"
          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 h-10 px-6 py-2 shadow-sm"
        >
          浏览套餐
        </Link>
      </div>
    );
  }

  // 获取状态标签和样式
  const getStatusDisplay = (booking: any) => {
    // 优先显示支付状态，因为这是用户最关心的
    if (booking.paymentStatus === "PENDING") {
      return {
        label: "待支付",
        className: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
      };
    }

    if (booking.paymentStatus === "PARTIAL") {
      return {
        label: "已付定金",
        className: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      };
    }

    // 已支付后，显示预约确认状态
    if (booking.paymentStatus === "PAID") {
      if (booking.status === "PENDING") {
        return {
          label: "等待确认",
          className: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
        };
      }
      if (booking.status === "CONFIRMED") {
        return {
          label: "已确认",
          className: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        };
      }
      if (booking.status === "COMPLETED") {
        return {
          label: "已完成",
          className: "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700",
        };
      }
    }

    // 已取消
    if (booking.status === "CANCELLED") {
      return {
        label: "已取消",
        className: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
      };
    }

    // 默认
    return {
      label: booking.status,
      className: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    };
  };

  const renderBookingCard = (booking: any) => {
    const statusDisplay = getStatusDisplay(booking);

    return (
      <div
        key={booking.id}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition"
      >
        {/* 订单头部 */}
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                订单号:
              </span>
              <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {booking.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-medium ${statusDisplay.className}`}>
                {statusDisplay.label}
              </div>
              {/* 取消预约按钮 */}
              <CancelBookingButton
                bookingId={booking.id}
                bookingStatus={booking.status}
                paymentStatus={booking.paymentStatus}
                onCancelSuccess={() => router.refresh()}
              />
            </div>
          </div>
        </div>

          {/* 订单内容 */}
          <div className="p-6">
            {/* 预约项目列表 */}
            <div className="space-y-4 mb-6">
              {booking.items.map((item: any, idx: number) => {
                const itemImage = item.campaignPlan?.images?.[0] || null;
                const itemName = item.campaignPlan?.name || item.plan?.name || "和服租赁";

                return (
                  <div key={idx} className="flex gap-4">
                    {/* 套餐图片 */}
                    {itemImage ? (
                      <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                        <Image
                          src={itemImage}
                          alt={itemName}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <span className="text-3xl">👘</span>
                      </div>
                    )}

                    {/* 套餐信息 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {itemName}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{item.store.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          × {item.quantity}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          ¥{(item.totalPrice / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 预约信息 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  到店日期
                </span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(booking.visitDate).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  到店时间
                </span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {booking.visitTime}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  总金额
                </span>
                <span className="block text-sm font-semibold text-rose-600 dark:text-rose-400">
                  ¥{(booking.totalAmount / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  支付状态
                </span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {booking.paymentStatus === "PAID"
                    ? "已支付"
                    : booking.paymentStatus === "PARTIAL"
                    ? "部分支付"
                    : booking.paymentStatus === "PENDING"
                    ? "待支付"
                    : "已退款"}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    };

  return (
    <div className="space-y-6">
      {/* 活跃预约 */}
      {activeBookings.map((booking) => renderBookingCard(booking))}

      {/* 已取消预约区域 */}
      {cancelledBookings.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                已取消的预约
              </span>
              <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {cancelledBookings.length}
              </span>
            </div>
            {showCancelled ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {/* 已取消预约列表 */}
          {showCancelled && (
            <div className="mt-4 space-y-4 opacity-60">
              {cancelledBookings.map((booking) => renderBookingCard(booking))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
