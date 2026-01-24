"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { refreshHomepage } from "@/app/(main)/actions";

interface RefreshCacheButtonProps {
  className?: string;
}

/**
 * 刷新首页缓存按钮
 * 用于管理员手动刷新数据
 */
export function RefreshCacheButton({ className }: RefreshCacheButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshHomepage();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    });
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium
        rounded-lg border transition-all duration-200
        ${
          showSuccess
            ? "bg-green-50 text-green-600 border-green-200"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <RefreshCw
        className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`}
      />
      {showSuccess ? "已刷新" : isPending ? "刷新中..." : "刷新缓存"}
    </button>
  );
}
