"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import HeroSearchPanel from "./HeroSearchPanel";

// Hero 背景图片 — ローカル最適化済み (1920×1280, ~745KB)
// Next.js Image コンポーネントが WebP/AVIF 変換 + サイズ最適化を自動実行
const HERO_IMAGE = "/images/hero-kimono.jpg";

interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface HeroSectionProps {
  themes: Theme[];
  onHeroVisibilityChange?: (isVisible: boolean) => void;
}

export default function HeroSection({ themes, onHeroVisibilityChange }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  // 监听 Hero 是否在视口内
  // 使用 hysteresis（迟滞）防止边界抖动：进入需要 20%，离开需要 5%
  useEffect(() => {
    if (!heroRef.current || !onHeroVisibilityChange) return;

    let lastVisible: boolean | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;

        // Hysteresis: 不同的阈值用于进入和离开
        // 从不可见变为可见：需要 ratio > 0.2
        // 从可见变为不可见：需要 ratio < 0.05
        let isVisible: boolean;
        if (lastVisible === null) {
          isVisible = ratio > 0.1;
        } else if (lastVisible) {
          // 当前可见，只有 ratio < 0.05 才变为不可见
          isVisible = ratio >= 0.05;
        } else {
          // 当前不可见，只有 ratio > 0.2 才变为可见
          isVisible = ratio > 0.2;
        }

        if (isVisible !== lastVisible) {
          lastVisible = isVisible;
          onHeroVisibilityChange(isVisible);
        }
      },
      { threshold: [0, 0.05, 0.1, 0.2, 0.5] }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [onHeroVisibilityChange]);

  return (
    <section
      ref={heroRef}
      className="hidden md:block relative h-svh w-full overflow-hidden bg-white -mt-20"
    >
      {/* Layer 1: 背景图片 - Ken Burns 缓慢缩放 */}
      <div className="absolute inset-0 z-0 animate-ken-burns">
        {/* Shimmer 占位 — z-0, 图片加载后自然被遮盖 */}
        <div className="absolute inset-0 shimmer-wabi" />
        {/* LCP 关键图片 — 不使用 opacity-0 过渡（会阻塞 LCP 测量）
            priority 确保 <link rel="preload"> 被注入到 <head> */}
        <Image
          src={HERO_IMAGE}
          alt="和服体験"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={80}
        />
      </div>

      {/* Layer 2: Airy Gradient - 空气感渐变 */}
      {/* 顶部：极淡黑色渐变，保证导航栏可读性 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-transparent" />

      {/* 底部：白色渐变，与页面背景无缝过渡 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-white via-white/60 to-transparent" />

      {/* Layer 2.5: 中央径向渐变遮罩 - 柔和聚焦标题区域 */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 42%, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.35) 45%, transparent 72%)",
        }}
      />

      {/* Layer 3: 主内容区 */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 -mt-4 md:-mt-10">
        {/* 竖排装饰文字 - 左侧 */}
        <div className="hidden lg:block absolute left-8 xl:left-16 top-1/2 -translate-y-1/2 animate-hero-left">
          <div
            className="text-wabi-400/40 text-[13px] tracking-[0.6em] font-mincho select-none leading-[2]"
            style={{ writingMode: "vertical-rl" }}
          >
            京都・和服体験
          </div>
        </div>

        {/* 竖排装饰文字 - 右侧 */}
        <div className="hidden lg:block absolute right-8 xl:right-16 top-1/2 -translate-y-1/2 animate-hero-right">
          <div
            className="text-wabi-400/40 text-[13px] tracking-[0.6em] font-mincho select-none leading-[2]"
            style={{ writingMode: "vertical-rl" }}
          >
            伝統と現代の融合
          </div>
        </div>

        {/* 主标题区域 */}
        <div className="text-center mb-4 md:mb-12 relative">
          {/* 主标题 */}
          <div className="relative animate-hero-title">
            <h1 className="relative">
              <span
                className="block text-[40px] md:text-[72px] lg:text-[88px] font-mincho font-medium tracking-[0.15em] text-wabi-800"
                style={{
                  textShadow: "0 2px 12px rgba(212, 91, 71, 0.2)",
                }}
              >
                一の着物
              </span>
            </h1>
          </div>

          {/* 副标题 - 磨砂胶囊 */}
          <div className="mt-4 md:mt-8 animate-hero-subtitle">
            <span className="inline-flex items-center px-8 py-3 rounded-full glass-panel-light">
              <p className="text-[14px] md:text-[16px] font-mincho tracking-[0.25em] text-wabi-700">
                伝統の美、現代の心
              </p>
            </span>
          </div>
        </div>

        {/* 搜索面板 - 亮色变体 (CSS 动画替代 framer-motion) */}
        <div className="w-full max-w-4xl animate-hero-search">
          <HeroSearchPanel themes={themes} variant="light" />
        </div>
      </div>
    </section>
  );
}
