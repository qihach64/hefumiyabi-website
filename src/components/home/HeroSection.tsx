"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroSearchPanel from "./HeroSearchPanel";
import ScrollIndicator from "./ScrollIndicator";

// Hero 背景图片 (Unsplash)
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2092&auto=format&fit=crop", // 和服女性
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
  // 背景缩放效果
  const bgScale = useTransform(scrollY, [0, 500], [1, 1.1]);

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
      className="relative h-screen w-full overflow-hidden bg-gray-900"
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
          <div className="absolute inset-0 bg-gradient-to-br from-sakura-100 to-sakura-200 animate-pulse" />
        )}
      </motion.div>

      {/* Layer 2: 渐变遮罩 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/20 to-black/70" />

      {/* 樱花色调遮罩 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-sakura-900/20 via-transparent to-transparent" />

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
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-2 drop-shadow-lg">
              <span className="font-serif">Kimono One</span>
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl text-white/90 font-light tracking-wider drop-shadow-md">
              一の和服
            </p>
          </motion.div>

          {/* 副标题 */}
          <motion.p
            className="mt-6 text-lg md:text-xl text-white/80 font-light tracking-[0.2em] drop-shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            伝統の美、現代の心
          </motion.p>
        </div>

        {/* 搜索面板 */}
        <motion.div
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <HeroSearchPanel themes={themes} />
        </motion.div>
      </motion.div>

      {/* Layer 4: 滚动指示器 */}
      <ScrollIndicator />
    </section>
  );
}
