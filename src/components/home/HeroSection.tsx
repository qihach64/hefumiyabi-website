"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroSearchPanel from "./HeroSearchPanel";
import ScrollIndicator from "./ScrollIndicator";

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

  // 滚动动画
  const { scrollY } = useScroll();

  // 视差效果 - 内容向上移动
  const contentY = useTransform(scrollY, [0, 500], [0, 150]);
  // 透明度渐变 - 滚动时淡出
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  // 背景缩放效果 - 初始略大，滚动时继续放大
  const bgScale = useTransform(scrollY, [0, 500], [1.05, 1.15]);

  // 监听 Hero 是否在视口内
  useEffect(() => {
    if (!heroRef.current || !onHeroVisibilityChange) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onHeroVisibilityChange(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [onHeroVisibilityChange]);

  return (
    <section
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden bg-white"
    >
      {/* Layer 1: 背景图片 */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ scale: bgScale }}
      >
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
      </motion.div>

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

      {/* Layer 3: 主内容区 (视差滚动) */}
      <motion.div
        className="relative z-10 h-full flex flex-col items-center justify-center px-4"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* 竖排装饰文字 - 左侧 */}
        <motion.div
          className="hidden lg:block absolute left-8 xl:left-16 top-1/2 -translate-y-1/2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <div
            className="writing-vertical text-[#B8A89A]/40 text-sm tracking-[0.5em] font-light select-none"
            style={{ writingMode: "vertical-rl" }}
          >
            京都・和服体験
          </div>
        </motion.div>

        {/* 竖排装饰文字 - 右侧 */}
        <motion.div
          className="hidden lg:block absolute right-8 xl:right-16 top-1/2 -translate-y-1/2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <div
            className="writing-vertical text-[#B8A89A]/40 text-sm tracking-[0.5em] font-light select-none"
            style={{ writingMode: "vertical-rl" }}
          >
            伝統と現代の融合
          </div>
        </motion.div>

        {/* 主标题区域 */}
        <div className="text-center mb-8 md:mb-12 relative">
          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* 顶部装饰线 - 樱花色调 */}
            <motion.div
              className="flex items-center justify-center gap-3 mb-6"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <span className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent to-sakura-400/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-sakura-500/70" />
              <span className="w-8 md:w-12 h-px bg-gradient-to-l from-transparent to-sakura-400/60" />
            </motion.div>

            {/* 主标题 - 日文品牌名 + 樱花渐变 */}
            <h1 className="relative">
              <span
                className="block text-5xl md:text-7xl lg:text-8xl font-serif tracking-[0.1em] bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #8B1634 0%, #A61D3F 25%, #4A4542 75%, #3D3A38 100%)",
                  filter: "drop-shadow(0 2px 4px rgba(139, 22, 52, 0.15))"
                }}
              >
                一の着物
              </span>
              {/* 樱花光晕效果 */}
              <span
                className="absolute inset-0 text-5xl md:text-7xl lg:text-8xl font-serif tracking-[0.1em] opacity-20 blur-[2px] pointer-events-none select-none"
                style={{ color: "#FF7A9A" }}
                aria-hidden="true"
              >
                一の着物
              </span>
            </h1>

            {/* 底部装饰线 - 樱花色调 */}
            <motion.div
              className="flex items-center justify-center gap-3 mt-6"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-sakura-400/50 to-transparent" />
            </motion.div>
          </motion.div>

          {/* 副标题 - 细腻的磨砂背景 */}
          <motion.div
            className="mt-8 md:mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <span
              className="inline-flex items-center px-6 py-2.5 rounded-full backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.6)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
              }}
            >
              <p
                className="text-sm md:text-base font-light tracking-[0.2em]"
                style={{ color: "#4A4542" }}
              >
                伝統の美、現代の心
              </p>
            </span>
          </motion.div>
        </div>

        {/* 搜索面板 - 亮色变体 */}
        <motion.div
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <HeroSearchPanel themes={themes} variant="light" />
        </motion.div>
      </motion.div>

      {/* Layer 4: 滚动指示器 */}
      <ScrollIndicator variant="light" />
    </section>
  );
}
