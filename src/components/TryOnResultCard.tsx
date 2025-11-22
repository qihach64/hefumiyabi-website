"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, RotateCcw, Maximize2 } from "lucide-react";
import ImageComparison from "./ImageComparison";

interface TryOnResult {
  planId: string;
  planName: string;
  planImageUrl: string;
  resultPhoto: string;
  timestamp: number;
}

interface TryOnResultCardProps {
  tryOnResult: TryOnResult;
  onRetry: () => void;
  onViewLarge: () => void;
}

export default function TryOnResultCard({
  tryOnResult,
  onRetry,
  onViewLarge,
}: TryOnResultCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-sakura-50 to-sakura-100 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sakura-600" />
          <h3 className="text-[16px] font-semibold text-gray-900">您的 AI 试穿效果</h3>
        </div>
      </div>

      {/* 对比图预览 */}
      <div className="p-3">
        <div className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group">
          {/* 使用小尺寸的对比图 */}
          <div
            className="relative w-full h-full"
            onClick={onViewLarge}
          >
            <Image
              src={tryOnResult.resultPhoto}
              alt="试穿效果"
              fill
              className="object-cover"
              style={{ objectPosition: 'top center' }}
              sizes="300px"
            />
          </div>

          {/* Hover 蒙层和图标 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center gap-3">
            {/* 查看大图图标 */}
            <button
              onClick={onViewLarge}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg"
              aria-label="查看大图"
            >
              <Maximize2 className="w-5 h-5 text-gray-900" />
            </button>

            {/* 重新试穿图标 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg"
              aria-label="重新试穿"
            >
              <RotateCcw className="w-5 h-5 text-sakura-600" />
            </button>
          </div>

          {/* AI 标识 */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-sakura-600 text-white text-[12px] font-semibold rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>AI 生成</span>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="px-4 pb-4">
        <div className="bg-sakura-50 rounded-lg px-3 py-2 text-[12px] text-sakura-700">
          💡 点击图片可对比原图和试穿效果
        </div>
      </div>
    </div>
  );
}
