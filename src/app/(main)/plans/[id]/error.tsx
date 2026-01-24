'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function PlanDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 可以发送到错误追踪服务
    console.error('套餐详情页加载错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        {/* 装饰线 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-px bg-gradient-to-r from-transparent to-sakura-300" />
          <span className="text-sakura-400 text-2xl">🌸</span>
          <div className="w-10 h-px bg-gradient-to-l from-transparent to-sakura-300" />
        </div>

        <h2 className="text-2xl font-serif text-gray-900 mb-3">
          页面加载失败
        </h2>

        <p className="text-gray-600 mb-8 leading-relaxed">
          抱歉，套餐信息加载出现问题。
          <br />
          请稍后重试或返回套餐列表。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sakura-500 text-white rounded-lg font-medium hover:bg-sakura-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>

          <Link
            href="/plans"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回套餐列表
          </Link>
        </div>

        {/* 错误摘要（仅开发环境显示） */}
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="mt-8 text-xs text-gray-400">
            错误标识: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
