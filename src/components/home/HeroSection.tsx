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
        <div className="text-center mb-8 md:mb-12">
          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-4">
              <span className="font-serif italic tracking-tight">Kimono One</span>
            </h1>

            {/* 日文标题 - 带装饰线 */}
            <div className="flex items-center justify-center gap-4">
              <span className="hidden md:block w-12 h-px bg-gray-400" />
              <p className="text-2xl md:text-3xl lg:text-4xl text-gray-700 font-light tracking-[0.2em]">
                一の和服
              </p>
              <span className="hidden md:block w-12 h-px bg-gray-400" />
            </div>
          </motion.div>

          {/* 副标题 - 磨砂胶囊背景 */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <span className="inline-block px-6 py-2 rounded-full bg-black/10 backdrop-blur-sm">
              <p className="text-base md:text-lg text-gray-700 font-light tracking-[0.15em]">
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
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <HeroSearchPanel themes={themes} variant="light" />
        </motion.div>
      </motion.div>

      {/* Layer 4: 滚动指示器 */}
      <ScrollIndicator variant="light" />
    </section>
  );
}
