"use client";

import { useState } from "react";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";

interface EmailVerificationBannerProps {
  email: string;
}

export default function EmailVerificationBanner({
  email,
}: EmailVerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setSuccess(false);
        setMessage(data.error);
      }
    } catch (error) {
      console.error("Resend error:", error);
      setSuccess(false);
      setMessage("发送失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            您的邮箱尚未验证
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            请检查您的邮箱 <span className="font-medium">{email}</span>{" "}
            并点击验证链接。
          </p>

          {message && (
            <div
              className={`mb-3 text-sm ${
                success
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {success && <CheckCircle className="w-4 h-4 inline mr-1" />}
              {message}
            </div>
          )}

          <button
            onClick={handleResendEmail}
            disabled={loading || success}
            className="inline-flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            {loading ? "发送中..." : success ? "已发送" : "重新发送验证邮件"}
          </button>
        </div>
      </div>
    </div>
  );
}
