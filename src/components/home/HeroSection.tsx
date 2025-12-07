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
          {/* 背景装饰 - 大号「雅」字 */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          >
            <span
              className="text-[12rem] md:text-[18rem] lg:text-[22rem] font-serif text-[#3D3A38]/[0.03] leading-none"
            >
              雅
            </span>
          </div>

          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* 顶部装饰线 */}
            <motion.div
              className="flex items-center justify-center gap-3 mb-6"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <span className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent to-[#8B7355]/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B7355]/60" />
              <span className="w-8 md:w-12 h-px bg-gradient-to-l from-transparent to-[#8B7355]/60" />
            </motion.div>

            {/* 英文品牌名 - 使用衬线体，优雅的字间距 */}
            <h1 className="relative">
              <span
                className="block text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight"
                style={{
                  color: "#3D3A38",
                  textShadow: "0 2px 20px rgba(255,255,255,0.8)"
                }}
              >
                Kimono One
              </span>
            </h1>

            {/* 日文品牌名 - 无衬线体，宽松字间距 */}
            <motion.div
              className="mt-3 md:mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <span
                className="text-xl md:text-2xl lg:text-3xl font-light tracking-[0.3em]"
                style={{ color: "#5C5552" }}
              >
                一の和服
              </span>
            </motion.div>

            {/* 底部装饰线 */}
            <motion.div
              className="flex items-center justify-center gap-3 mt-6"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-[#8B7355]/40 to-transparent" />
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
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.6)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
              }}
            >
              {/* 左侧印章装饰 */}
              <span
                className="hidden sm:flex items-center justify-center w-6 h-6 rounded border text-[10px] font-serif"
                style={{
                  borderColor: "#8B5A5A",
                  color: "#8B5A5A"
                }}
              >
                雅
              </span>
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
