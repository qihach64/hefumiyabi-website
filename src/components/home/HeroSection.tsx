"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import HeroSearchPanel from "./HeroSearchPanel";

// Hero 背景图片
const HERO_IMAGES = [
  "https://i0.wp.com/www.touristjapan.com/wp-content/uploads/2025/04/Young-Japanese-woman-in-a-traditional-Kimono-dress-at-Kiyomizu-dera-temple-in-Kyoto-Japan-scaled.jpg?fit=2560%2C1707&ssl=1",
];

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
  const [imageLoaded, setImageLoaded] = useState(false);

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
      className="relative h-svh w-full overflow-hidden bg-white"
    >
      {/* Layer 1: 背景图片 */}
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGES[0]}
          alt="和服体验"
          fill
          priority
          className={`object-cover transition-opacity duration-1000 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="100vw"
        />
        {/* 加载占位 */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-sakura-50 to-sakura-100 animate-pulse" />
        )}
      </div>

      {/* Layer 2: Airy Gradient - 空气感渐变 */}
      {/* 顶部：极淡黑色渐变，保证导航栏可读性 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-transparent" />

      {/* 底部：白色渐变，与页面背景无缝过渡 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-white via-white/60 to-transparent" />

      {/* Layer 2.5: 中央径向渐变遮罩 - 提升文字可读性 */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 45%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)"
        }}
      />

      {/* Layer 3: 主内容区 */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 -mt-16 md:-mt-24">
        {/* 竖排装饰文字 - 左侧 (CSS 动画替代 framer-motion) */}
        <div className="hidden lg:block absolute left-8 xl:left-16 top-1/2 -translate-y-1/2 animate-hero-left">
          <div
            className="writing-vertical text-wabi-400/50 text-sm tracking-[0.5em] font-mincho select-none"
            style={{ writingMode: "vertical-rl" }}
          >
            京都・和服体験
          </div>
        </div>

        {/* 竖排装饰文字 - 右侧 (CSS 动画替代 framer-motion) */}
        <div className="hidden lg:block absolute right-8 xl:right-16 top-1/2 -translate-y-1/2 animate-hero-right">
          <div
            className="writing-vertical text-wabi-400/50 text-sm tracking-[0.5em] font-mincho select-none"
            style={{ writingMode: "vertical-rl" }}
          >
            伝統と現代の融合
          </div>
        </div>

        {/* 主标题区域 - 上移以避免底部截断 */}
        <div className="text-center mb-6 md:mb-10 relative -mt-8 md:-mt-12">
          {/* 主标题 (CSS 动画替代 framer-motion) */}
          <div className="relative animate-hero-title">
            {/* 主标题 - 优雅的深色 + 樱花色点缀 */}
            <h1 className="relative">
              <span
                className="block text-5xl md:text-7xl lg:text-8xl font-mincho font-medium tracking-[0.15em] text-wabi-800"
                style={{
                  textShadow: "0 2px 12px rgba(255, 122, 154, 0.2)"
                }}
              >
                一の着物
              </span>
            </h1>
          </div>

          {/* 副标题 - 细腻的磨砂背景 (CSS 动画替代 framer-motion) */}
          <div className="mt-6 md:mt-8 animate-hero-subtitle">
            <span
              className="inline-flex items-center px-6 py-2.5 rounded-full backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.65)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
              }}
            >
              <p
                className="text-sm md:text-base font-mincho tracking-[0.25em] text-wabi-700"
              >
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
