"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface CancelBookingButtonProps {
  bookingId: string;
  bookingStatus: string;
  paymentStatus: string;
  onCancelSuccess?: () => void;
}

export default function CancelBookingButton({
  bookingId,
  bookingStatus,
  paymentStatus,
  onCancelSuccess,
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

  // 如果预约已取消或已完成，不显示取消按钮
  if (bookingStatus === "CANCELLED" || bookingStatus === "COMPLETED") {
    return null;
  }

  const handleCancel = async () => {
    setIsCancelling(true);
    setError("");

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "取消预约失败");
      }

      // 成功后刷新页面
      setIsOpen(false);
      if (onCancelSuccess) {
        onCancelSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消预约失败");
      setIsCancelling(false);
    }
  };

  return (
    <>
      {/* 取消按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition"
      >
        <X className="w-3.5 h-3.5" />
        取消预约
      </button>

      {/* 确认对话框 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            {/* 标题 */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <X className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  确认取消预约
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  此操作无法撤销，请确认是否要取消此预约？
                </p>
              </div>
            </div>

            {/* 已付款提示 */}
            {paymentStatus === "PAID" && (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                  💰 该预约已付款
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  取消后，退款将在 3-5 个工作日内原路退回。如需加急处理，请联系客服。
                </p>
              </div>
            )}

            {/* 部分付款提示 */}
            {paymentStatus === "PARTIAL" && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  💳 该预约已部分付款
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  取消后，已支付的定金将在 3-5 个工作日内原路退回。
                </p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
              >
                保留预约
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? "取消中..." : "确认取消"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
