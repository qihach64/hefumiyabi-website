"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("缺少验证令牌");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("邮箱验证成功！");

          // 3秒后跳转到登录页
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "验证失败");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("验证失败，请稍后重试");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-16 h-16 bg-white rounded-full p-2 shadow-sm">
              <Image
                src="/logo.png"
                alt="江戸和装工房雅"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold text-gray-900">江戸和装工房雅</span>
          </Link>
        </div>

        {/* 验证状态卡片 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center">
            {/* 状态图标 */}
            <div className="mb-6">
              {status === "loading" && (
                <Loader2 className="w-20 h-20 mx-auto text-rose-600 animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle className="w-20 h-20 mx-auto text-green-600" />
              )}
              {status === "error" && (
                <XCircle className="w-20 h-20 mx-auto text-red-600" />
              )}
            </div>

            {/* 标题 */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {status === "loading" && "验证中..."}
              {status === "success" && "验证成功！"}
              {status === "error" && "验证失败"}
            </h1>

            {/* 消息 */}
            <p className="text-gray-600 mb-6">
              {status === "loading" && "正在验证您的邮箱地址，请稍候..."}
              {status === "success" &&
                "您的邮箱已成功验证！即将跳转到登录页面..."}
              {status === "error" && message}
            </p>

            {/* 操作按钮 */}
            {status === "success" && (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 h-10 px-6 py-2 transition shadow-md hover:shadow-lg"
              >
                前往登录
              </Link>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-rose-600 hover:to-pink-600 transition shadow-md hover:shadow-lg"
                >
                  返回登录
                </Link>
                <Link
                  href="/register"
                  className="block w-full border-2 border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition"
                >
                  重新注册
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 返回首页 */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 text-sm transition"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
