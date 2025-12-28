"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 下拉菜单是否打开

  // 滚动动画
  const { scrollY } = useScroll();

  // 背景缩放效果 - 初始略大，滚动时继续放大
  const bgScale = useTransform(scrollY, [0, 500], [1.05, 1.15]);

  // 视差效果 - 内容向上移动（下拉菜单打开时锁定）
  const contentYBase = useTransform(scrollY, [0, 500], [0, 150]);
  // 透明度渐变 - 滚动时淡出（下拉菜单打开时锁定）
  const contentOpacityBase = useTransform(scrollY, [0, 400], [1, 0]);

  // 使用 motion value 来手动控制，以便响应 isDropdownOpen 状态
  const contentY = useMotionValue(0);
  const contentOpacity = useMotionValue(1);

  // 订阅 base 值变化，根据 isDropdownOpen 状态决定是否更新
  useEffect(() => {
    // 当下拉菜单打开时，不订阅滚动变化（保持当前位置不变）
    if (isDropdownOpen) {
      return;
    }

    // 下拉菜单关闭时，订阅滚动变化并立即同步当前值
    contentY.set(contentYBase.get());
    contentOpacity.set(contentOpacityBase.get());

    const unsubY = contentYBase.on("change", (v) => {
      contentY.set(v);
    });
    const unsubOpacity = contentOpacityBase.on("change", (v) => {
      contentOpacity.set(v);
    });

    return () => {
      unsubY();
      unsubOpacity();
    };
  }, [isDropdownOpen, contentYBase, contentOpacityBase, contentY, contentOpacity]);

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

      {/* Layer 3: 主内容区 (视差滚动) - 整体上移以给日历下拉菜单留出空间 */}
      <motion.div
        className="relative z-10 h-full flex flex-col items-center justify-center px-4 -mt-16 md:-mt-24"
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
            className="writing-vertical text-[#B8A89A]/50 text-sm tracking-[0.5em] font-mincho select-none"
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
            className="writing-vertical text-[#B8A89A]/50 text-sm tracking-[0.5em] font-mincho select-none"
            style={{ writingMode: "vertical-rl" }}
          >
            伝統と現代の融合
          </div>
        </motion.div>

        {/* 主标题区域 - 上移以避免底部截断 */}
        <div className="text-center mb-6 md:mb-10 relative -mt-8 md:-mt-12">
          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* 主标题 - 优雅的深色 + 樱花色点缀 */}
            <h1 className="relative">
              <span
                className="block text-5xl md:text-7xl lg:text-8xl font-mincho font-medium tracking-[0.15em]"
                style={{
                  color: "#2D2A26",
                  textShadow: "0 2px 12px rgba(255, 122, 154, 0.2)"
                }}
              >
                一の着物
              </span>
            </h1>
          </motion.div>

          {/* 副标题 - 细腻的磨砂背景 */}
          <motion.div
            className="mt-6 md:mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <span
              className="inline-flex items-center px-6 py-2.5 rounded-full backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.65)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
              }}
            >
              <p
                className="text-sm md:text-base font-mincho tracking-[0.25em]"
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
          <HeroSearchPanel themes={themes} variant="light" onDropdownOpenChange={setIsDropdownOpen} />
        </motion.div>
      </motion.div>

    </section>
  );
}
