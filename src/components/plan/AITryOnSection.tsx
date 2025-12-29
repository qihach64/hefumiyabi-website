"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Camera, RotateCcw, Maximize2 } from "lucide-react";
import TryOnModal from "@/components/TryOnModal";
import ImageComparison from "@/components/ImageComparison";
import { useTryOnStore } from "@/store/tryOn";

interface AITryOnSectionProps {
  plan: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    isCampaign?: boolean;
  };
}

export default function AITryOnSection({ plan }: AITryOnSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const getTryOnResult = useTryOnStore((state) => state.getTryOnResult);
  const removeTryOnResult = useTryOnStore((state) => state.removeTryOnResult);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tryOnResult = mounted ? getTryOnResult(plan.id) : null;
  const hasTryOn = !!tryOnResult;

  const handleRetry = () => {
    removeTryOnResult(plan.id);
    setShowTryOnModal(true);
  };

  return (
    <>
      {/* Modals */}
      <TryOnModal
        isOpen={showTryOnModal}
        onClose={() => setShowTryOnModal(false)}
        plan={plan}
      />

      {/* 对比图弹窗 */}
      {showComparison && hasTryOn && tryOnResult && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowComparison(false)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageComparison
              beforeImage={plan.imageUrl || ""}
              afterImage={tryOnResult.resultPhoto}
              beforeLabel="套餐原图"
              afterLabel="你的试穿效果"
            />
            <button
              onClick={() => setShowComparison(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white text-[14px] font-medium transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 主容器 */}
      <section className="relative">
        {/* Section Header - 和风极简风格 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-px bg-gradient-to-r from-stone-300 to-transparent" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-medium">
            Virtual Try-On
          </span>
        </div>

        {hasTryOn ? (
          // ============================================
          // 已试穿状态：优雅的对比展示
          // ============================================
          <div className="bg-[#FDFBF7] rounded-2xl border border-stone-200/60 overflow-hidden">
            {/* 对比图区域 */}
            <div className="grid grid-cols-2">
              {/* 原图 */}
              <div className="relative aspect-[3/4] border-r border-stone-200/40">
                <Image
                  src={plan.imageUrl || ""}
                  alt="套餐原图"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded text-[11px] font-medium text-stone-600 tracking-wide">
                    Original
                  </span>
                </div>
              </div>

              {/* 试穿效果 */}
              <div className="relative aspect-[3/4]">
                <Image
                  src={tryOnResult.resultPhoto}
                  alt="试穿效果"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1.5 bg-sakura-600 rounded text-[11px] font-medium text-white tracking-wide">
                    Your Look
                  </span>
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="px-6 py-4 bg-white/50 border-t border-stone-100 flex items-center justify-between">
              <p className="text-[14px] text-stone-600">
                <span className="text-stone-800 font-medium">优雅，一如所见。</span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-stone-500 hover:text-stone-800 transition-colors duration-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重新体验</span>
                </button>
                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-[13px] font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>查看细节</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          // ============================================
          // 未试穿状态：雅致的邀请
          // ============================================
          <div className="relative bg-[#FDFBF7] rounded-2xl border border-stone-200/60 overflow-hidden">
            {/* 主内容区 */}
            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* 左侧：视觉区域 (3/5) */}
              <div className="lg:col-span-3 relative">
                {/* 背景图片 - 套餐图作为氛围 */}
                <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[280px] lg:min-h-[360px]">
                  {plan.imageUrl && (
                    <Image
                      src={plan.imageUrl}
                      alt={plan.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  {/* 渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#FDFBF7]/95 lg:to-[#FDFBF7]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7]/80 via-transparent to-transparent lg:hidden" />

                  {/* 悬浮的"照片"暗示 - 拍立得风格 */}
                  <div className="absolute bottom-6 right-6 lg:bottom-auto lg:top-1/2 lg:right-8 lg:-translate-y-1/2">
                    <div className="w-20 h-24 lg:w-28 lg:h-36 bg-white rounded shadow-xl rotate-6 p-1.5 lg:p-2">
                      <div className="w-full h-3/4 bg-stone-100 rounded-sm flex items-center justify-center">
                        <Camera className="w-6 h-6 lg:w-8 lg:h-8 text-stone-300" />
                      </div>
                      <div className="mt-1 lg:mt-2 text-center">
                        <span className="text-[8px] lg:text-[10px] text-stone-400 tracking-wider">YOUR PHOTO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧：文案区域 (2/5) */}
              <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center">
                {/* 小标签 */}
                <span className="text-[10px] uppercase tracking-[0.35em] text-sakura-500 font-medium mb-4">
                  Exclusive Feature
                </span>

                {/* 主标题 - Serif */}
                <h3 className="font-serif text-[24px] lg:text-[28px] text-stone-800 leading-tight mb-4">
                  预见你的<br />
                  <span className="text-sakura-600">优雅</span>时刻
                </h3>

                {/* 描述文案 - 情感化 */}
                <p className="text-[14px] lg:text-[15px] text-stone-500 leading-relaxed mb-8">
                  上传一张您的照片，<br className="hidden lg:block" />
                  让和服与您的气质相遇，<br className="hidden lg:block" />
                  遇见另一个自己。
                </p>

                {/* CTA 按钮 */}
                <button
                  onClick={() => setShowTryOnModal(true)}
                  className="group w-full lg:w-auto px-8 py-3.5 bg-sakura-600 hover:bg-sakura-700 text-white rounded-lg font-medium text-[14px] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  <span>开始体验</span>
                </button>

                {/* 辅助信息 - 极度克制 */}
                <p className="text-[11px] text-stone-400 mt-4 tracking-wide">
                  支持 JPG / PNG · 正面半身照效果最佳
                </p>
              </div>
            </div>

            {/* 装饰元素 - 和风纹样暗示 */}
            <div className="absolute top-4 right-4 w-16 h-16 opacity-[0.03]">
              <svg viewBox="0 0 100 100" fill="currentColor" className="text-stone-900">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
