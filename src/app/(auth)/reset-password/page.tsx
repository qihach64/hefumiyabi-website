"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("重置链接无效，请重新申请");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6个字符");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "重置失败，请重新申请");
        return;
      }

      setSuccess(true);
      // 3秒后跳转到登录页
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      {success ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">密码已重置</h1>
          <p className="text-gray-600">您的密码已成功更新，正在跳转到登录页...</p>
          <Link href="/login" className="inline-block mt-4 text-sakura-600 hover:text-sakura-700 font-medium">
            立即登录
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">设置新密码</h1>
            <p className="text-gray-600">请输入您的新密码</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sakura-500 focus:border-transparent outline-none transition disabled:bg-gray-50"
                placeholder="至少6位"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认新密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!token}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sakura-500 focus:border-transparent outline-none transition disabled:bg-gray-50"
                placeholder="再次输入新密码"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gradient-to-r from-sakura-500 to-sakura-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-sakura-600 hover:to-sakura-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
            >
              {loading ? "重置中..." : "确认重置"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/forgot-password" className="text-sakura-600 hover:text-sakura-700 font-medium text-sm">
              重新发送重置邮件
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense fallback={<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center text-gray-500">加载中...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
