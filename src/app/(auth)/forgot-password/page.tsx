"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      // 无论成功与否都显示相同提示（防枚举攻击）
      setSubmitted(true);
    } catch {
      setError("请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF5F7]/60 via-white to-[#FFF5F7]/30 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-sakura-500 transition-colors duration-300 group-hover:border-sakura-600" />
              <div
                className="absolute inset-1 rounded-full border border-sakura-400/50"
                style={{
                  background:
                    "repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(236, 72, 153, 0.06) 30deg 60deg)",
                }}
              />
              <div className="absolute inset-2 rounded-full bg-white" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-serif text-[18px] font-medium text-sakura-600 select-none"
                  style={{ fontFamily: '"Noto Serif JP", "Source Han Serif", serif' }}
                >
                  一
                </span>
              </div>
            </div>
            <span className="text-[22px] font-semibold text-gray-900">Kimono One</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {submitted ? (
            /* 发送成功提示 */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">邮件已发送</h1>
              <p className="text-gray-600 mb-6">
                如果 <span className="font-medium text-gray-900">{email}</span> 已在我们系统中注册，
                您将在几分钟内收到密码重置邮件。
              </p>
              <p className="text-sm text-gray-500 mb-6">没有收到？请检查垃圾邮件文件夹，或稍后重试。</p>
              <Link
                href="/login"
                className="inline-block text-sakura-600 hover:text-sakura-700 font-medium"
              >
                返回登录
              </Link>
            </div>
          ) : (
            /* 输入邮箱表单 */
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">忘记密码？</h1>
                <p className="text-gray-600">输入您的邮箱，我们将发送重置链接</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sakura-500 focus:border-transparent outline-none transition"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sakura-500 to-sakura-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-sakura-600 hover:to-sakura-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
                >
                  {loading ? "发送中..." : "发送重置链接"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sakura-600 hover:text-sakura-700 font-medium text-sm">
                  ← 返回登录
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
