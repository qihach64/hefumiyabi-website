"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, Maximize2 } from "lucide-react";
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
      <AnimatePresence>
        {showComparison && hasTryOn && tryOnResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowComparison(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主容器 */}
      <section className="relative">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
          <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
            AI Virtual Try-On
          </span>
        </div>

        {hasTryOn ? (
          // ============================================
          // 已试穿状态
          // ============================================
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[#FDFBF7] rounded-xl border border-wabi-200 overflow-hidden"
          >
            {/* AI 成功标识 */}
            <div className="absolute top-4 right-4 z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sakura-600 rounded-full shadow-lg"
              >
                <Sparkles className="w-3 h-3 text-white" />
                <span className="text-[10px] font-semibold text-white tracking-wide">
                  AI 生成
                </span>
              </motion.div>
            </div>

            {/* 对比图区域 */}
            <div className="grid grid-cols-2">
              {/* 原图 */}
              <div className="relative aspect-[3/4] border-r border-wabi-200">
                <Image
                  src={plan.imageUrl || ""}
                  alt="套餐原图"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[11px] font-medium text-gray-600 tracking-wide">
                    Original
                  </span>
                </div>
              </div>

              {/* 试穿效果 */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={tryOnResult.resultPhoto}
                  alt="试穿效果"
                  fill
                  className="object-cover"
                />
                {/* 微光扫描效果 */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-sakura-200/20 to-transparent"
                  initial={{ y: "-100%" }}
                  animate={{ y: "200%" }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 8,
                    ease: "easeInOut",
                  }}
                />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1.5 bg-sakura-600 rounded-lg text-[11px] font-medium text-white tracking-wide shadow-lg">
                    Your Look
                  </span>
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="px-6 py-4 bg-white/50 border-t border-wabi-100 flex items-center justify-between">
              <p className="text-[14px] text-gray-600">
                <span className="text-gray-900 font-medium">AI 为您量身定制</span>
                <span className="text-gray-400 ml-2">· 优雅，一如所见</span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-500 hover:text-gray-900 transition-colors duration-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重新体验</span>
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sakura-600 hover:bg-sakura-700 text-white text-[13px] font-medium rounded-lg transition-all duration-300 hover:shadow-lg"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>查看细节</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          // ============================================
          // 未试穿状态：流动的镜子
          // ============================================
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[#FDFBF7] rounded-xl border border-wabi-200 overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* 左侧：流动的镜子 */}
              <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[420px] overflow-hidden">
                {/* 主图片 */}
                {plan.imageUrl && (
                  <Image
                    src={plan.imageUrl}
                    alt={plan.name}
                    fill
                    className="object-cover"
                  />
                )}

                {/* 呼吸光晕 - 极其微弱 */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    boxShadow: [
                      "inset 0 0 60px 20px rgba(244,163,187,0)",
                      "inset 0 0 80px 30px rgba(244,163,187,0.08)",
                      "inset 0 0 60px 20px rgba(244,163,187,0)",
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* 扫描线 - 缓慢优雅 */}
                <motion.div
                  className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(244,163,187,0.6) 50%, transparent 100%)",
                  }}
                  animate={{
                    top: ["-5%", "105%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* 顶部毛玻璃边缘 */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#FDFBF7]/80 via-[#FDFBF7]/40 to-transparent backdrop-blur-[2px]" />

                {/* 底部毛玻璃边缘 */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/60 to-transparent" />

                {/* 右侧渐变融合 (桌面端) */}
                <div className="hidden lg:block absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-[#FDFBF7] via-[#FDFBF7]/80 to-transparent" />

                {/* 镜面反光效果 */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
                  }}
                  animate={{
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* AI 扫描指示器 */}
                <motion.div
                  className="absolute bottom-8 left-6 flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-md rounded-lg border border-white/60 shadow-sm"
                  animate={{
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4 text-sakura-500" />
                  </motion.div>
                  <span className="text-[11px] text-gray-600 font-medium tracking-wide">
                    AI 准备就绪
                  </span>
                </motion.div>
              </div>

              {/* 右侧：文案区域 */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                {/* 小标签 */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sakura-50 rounded-full border border-sakura-100">
                    <Sparkles className="w-3 h-3 text-sakura-500" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-sakura-600 font-medium">
                      Exclusive Feature
                    </span>
                  </span>
                </motion.div>

                {/* 主标题 */}
                <motion.h3
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-serif text-[26px] lg:text-[32px] text-gray-900 leading-[1.3] mb-4"
                >
                  先睹为快<br />
                  <span className="text-sakura-600">你穿和服的样子</span>
                </motion.h3>

                {/* 描述 */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[15px] text-gray-500 leading-[1.8] mb-8"
                >
                  上传一张您的照片，AI 将为您量身合成试穿效果。
                  <br />
                  <span className="text-gray-400">无需到店，先睹为快。</span>
                </motion.p>

                {/* CTA 按钮 */}
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowTryOnModal(true)}
                  className="group relative w-full lg:w-auto px-8 py-4 bg-sakura-600 hover:bg-sakura-700 text-white rounded-xl font-medium text-[15px] transition-all duration-300 hover:shadow-xl overflow-hidden"
                >
                  {/* 光扫过效果 */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "200%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />

                  {/* 按钮内容 */}
                  <span className="relative flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                    开始 AI 试穿
                  </span>
                </motion.button>

                {/* 辅助信息 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 flex items-center gap-4 text-[12px] text-gray-400"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400" />
                    10秒生成
                  </span>
                  <span>·</span>
                  <span>免费体验</span>
                  <span>·</span>
                  <span>正面照效果最佳</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </>
  );
}
