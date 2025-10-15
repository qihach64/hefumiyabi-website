"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Mail, Phone, UserPlus, LogIn } from "lucide-react";
import type { Session } from "next-auth";
import type { BookingData } from "../page";

interface Step2Props {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onPrev: () => void;
  session: Session | null;
}

export default function Step2PersonalInfo({
  bookingData,
  updateBookingData,
  onNext,
  onPrev,
  session,
}: Step2Props) {
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 已登录用户验证
    if (session) {
      onNext();
      return;
    }

    // 游客验证
    if (!bookingData.guestName?.trim()) {
      setError("请填写您的姓名");
      return;
    }
    if (!bookingData.guestEmail?.trim()) {
      setError("请填写您的邮箱");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.guestEmail)) {
      setError("请填写有效的邮箱地址");
      return;
    }
    if (!bookingData.guestPhone?.trim()) {
      setError("请填写您的手机号");
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">个人信息</h2>
        <p className="text-gray-600">请填写您的联系方式以便我们确认预约</p>
      </div>

      {/* 已登录用户 */}
      {session ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {session.user?.name || "用户"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {session.user?.email}
              </p>
              <p className="text-xs text-green-700 mt-2">
                ✓ 已登录，您的预约将自动关联到您的账户
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 游客预约提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 mb-2">
                  登录可享受更多优惠
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  登录或注册后可以查看预约历史、获得会员折扣、优先预约特别活动
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(
                      window.location.href
                    )}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition"
                  >
                    <LogIn className="w-4 h-4" />
                    快速登录
                  </Link>
                  <span className="text-gray-400">|</span>
                  <Link
                    href={`/register?callbackUrl=${encodeURIComponent(
                      window.location.href
                    )}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    立即注册
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 游客信息表单 */}
          <div className="space-y-4">
            <p className="text-sm text-gray-600">或作为游客继续预约：</p>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 姓名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bookingData.guestName || ""}
                onChange={(e) =>
                  updateBookingData({ guestName: e.target.value })
                }
                placeholder="您的姓名"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                邮箱 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={bookingData.guestEmail || ""}
                onChange={(e) =>
                  updateBookingData({ guestEmail: e.target.value })
                }
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                我们将向此邮箱发送预约确认信息
              </p>
            </div>

            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={bookingData.guestPhone || ""}
                onChange={(e) =>
                  updateBookingData({ guestPhone: e.target.value })
                }
                placeholder="您的手机号"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        </>
      )}

      {/* 按钮 */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="border-2 border-gray-300 text-gray-700 font-medium py-3 px-8 rounded-lg hover:bg-gray-50 transition"
        >
          上一步
        </button>
        <button
          type="submit"
          className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-lg hover:from-rose-600 hover:to-pink-600 transition shadow-md hover:shadow-lg"
        >
          下一步
        </button>
      </div>
    </form>
  );
}
