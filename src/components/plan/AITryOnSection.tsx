"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, Camera, RotateCcw, ZoomIn, Star, Users, ChevronRight } from "lucide-react";
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

  // Mock stats - 后期可接真实数据
  const stats = {
    tryOnCount: 328,
    rating: 4.9,
    reviewCount: 56,
  };

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
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-[14px] font-medium transition-colors"
            >
              关闭 ✕
            </button>
          </div>
        </div>
      )}

      {/* 主容器 */}
      <section className="relative">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
          <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
            AI Virtual Try-On
          </span>
        </div>

        {hasTryOn ? (
          // ============================================
          // 已试穿状态：显示对比结果
          // ============================================
          <div className="rounded-2xl overflow-hidden border border-sakura-200 bg-gradient-to-br from-sakura-50/50 to-white">
            {/* 对比图区域 */}
            <div className="grid grid-cols-2 gap-px bg-sakura-200">
              {/* 原图 */}
              <div className="relative aspect-[3/4] bg-white">
                <Image
                  src={plan.imageUrl || ""}
                  alt="套餐原图"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[12px] font-medium text-gray-700 shadow-sm">
                  套餐原图
                </div>
              </div>

              {/* 试穿效果 */}
              <div className="relative aspect-[3/4] bg-white">
                <Image
                  src={tryOnResult.resultPhoto}
                  alt="试穿效果"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-sakura-600 rounded-full text-[12px] font-medium text-white shadow-sm">
                  ✨ 你的试穿效果
                </div>
              </div>
            </div>

            {/* 操作栏 */}
            <div className="p-4 flex items-center justify-between">
              <div className="text-[14px] text-gray-600">
                <span className="text-sakura-600 font-medium">试穿成功！</span>
                <span className="ml-2">喜欢这个效果吗？</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新试穿
                </button>
                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sakura-600 hover:bg-sakura-700 text-white text-[13px] font-medium rounded-lg transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                  查看大图对比
                </button>
              </div>
            </div>
          </div>
        ) : (
          // ============================================
          // 未试穿状态：引导用户体验
          // ============================================
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-sakura-50/30 via-white to-wabi-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* 左侧：示意图 */}
              <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px] bg-gradient-to-br from-sakura-100 to-sakura-50 overflow-hidden">
                {/* 装饰背景 */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-sakura-300 blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-sakura-400 blur-3xl" />
                </div>

                {/* 示意图：原图 + 箭头 + 效果图 */}
                <div className="relative h-full flex items-center justify-center gap-4 p-6">
                  {/* 原图缩略 */}
                  <div className="relative w-24 h-32 md:w-32 md:h-44 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                    {plan.imageUrl ? (
                      <Image
                        src={plan.imageUrl}
                        alt="套餐图片"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-sakura-200 flex items-center justify-center">
                        <span className="text-4xl">👘</span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1 bg-white/90 backdrop-blur-sm rounded text-[10px] text-center py-0.5 font-medium text-gray-600">
                      套餐
                    </div>
                  </div>

                  {/* 箭头 */}
                  <div className="flex flex-col items-center gap-1">
                    <Sparkles className="w-6 h-6 text-sakura-500" />
                    <ChevronRight className="w-5 h-5 text-sakura-400" />
                  </div>

                  {/* 效果图占位 */}
                  <div className="relative w-24 h-32 md:w-32 md:h-44 rounded-xl overflow-hidden shadow-lg border-2 border-sakura-300 bg-white">
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-sakura-50 to-white">
                      <Camera className="w-8 h-8 text-sakura-400" />
                      <span className="text-[11px] text-sakura-500 font-medium">你的照片</span>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 bg-sakura-600 rounded text-[10px] text-center py-0.5 font-medium text-white">
                      试穿效果
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧：文案 + CTA */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                {/* 标题 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sakura-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-sakura-600" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-gray-900">
                      AI 虚拟试穿
                    </h3>
                    <p className="text-[12px] text-sakura-600 font-medium">
                      Kimono One 独家功能
                    </p>
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
                  上传一张您的照片，AI 将在<span className="text-sakura-600 font-medium">5秒内</span>生成您穿着这款和服的真实效果图。
                </p>

                {/* 社会证明 */}
                <div className="flex items-center gap-4 mb-6 text-[13px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sakura-500" />
                    <span><span className="font-semibold text-gray-700">{stats.tryOnCount}</span> 人已体验</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-sakura-500 fill-sakura-500" />
                    <span className="font-semibold text-gray-700">{stats.rating}</span>
                    <span className="text-gray-400">({stats.reviewCount})</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => setShowTryOnModal(true)}
                  className="w-full md:w-auto px-8 py-3.5 bg-sakura-600 hover:bg-sakura-700 text-white rounded-xl font-semibold text-[15px] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  上传照片，立即体验
                </button>

                {/* 提示 */}
                <p className="text-[12px] text-gray-400 mt-3">
                  支持 JPG、PNG 格式，建议正面半身照效果最佳
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
