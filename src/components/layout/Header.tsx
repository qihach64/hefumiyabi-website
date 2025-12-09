"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import UserMenu from "./UserMenu";
import HeaderActions from "./HeaderActions";
import MobileMenu from "./MobileMenu";
import HeaderSearchBar from "./HeaderSearchBar";
import NavMenuButton from "./NavMenuButton";
import { useSearchBar } from "@/contexts/SearchBarContext";

export default function Header() {
  const { data: session } = useSession();
  const { isSearchBarExpanded, isHeroVisible, hideSearchBar } = useSearchBar();
  const [merchant, setMerchant] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // 监听滚动，控制 Header 透明度
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // 初始检查
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 检查用户是否有商家账户
  useEffect(() => {
    const fetchMerchant = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/merchant/profile');
          if (response.ok) {
            const data = await response.json();
            setMerchant(data.merchant);
          }
        } catch (error) {
          console.error('Failed to fetch merchant:', error);
        }
      } else {
        setMerchant(null);
      }
    };

    fetchMerchant();
  }, [session?.user?.id]);

  // 导航链接配置
  const navLinks = [
    {
      href: "/virtual-tryon",
      label: "AI 试穿",
      special: true
    },
    { href: "/stores", label: "店铺信息" },
    { href: "/faq", label: "常见问题" },
    { href: "/about", label: "关于我们" },
  ];

  // 判断是否应该显示透明模式（首页 Hero 可见且未滚动）
  const isTransparent = isHeroVisible && !isScrolled;

  return (
    <header
      className={`w-full sticky top-0 z-50 border-b transition-all duration-300 ease-in-out ${
        isTransparent
          ? 'bg-transparent border-transparent'
          : 'bg-white/80 backdrop-blur-md shadow-sm border-gray-200/50'
      }`}
    >
      <div className="container">
        {/* 动态高度：展开搜索栏时增加 padding，让内容有更多空间 */}
        <div className={`flex items-center justify-between gap-4 transition-all duration-300 ease-in-out ${
          isSearchBarExpanded && !isHeroVisible && !hideSearchBar
            ? 'h-20 md:h-24 py-2'
            : 'h-16 md:h-20'
        }`}>
          {/* 左侧：Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 移动端汉堡菜单 */}
            <MobileMenu
              isLoggedIn={!!session?.user}
              userName={session?.user?.name}
              userEmail={session?.user?.email}
              merchant={merchant}
            />

            {/* Logo - 家紋スタイル CSS Version - Sakura Theme */}
            <Link href="/" className="flex items-center gap-2.5 md:gap-3 shrink-0 group">
              {/* 家紋 Kamon - CSS Rendered */}
              <div className="relative w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:scale-105">
                {/* Outer ring */}
                <div
                  className={`absolute inset-0 rounded-full border-2 transition-colors duration-300 ${
                    isTransparent
                      ? 'border-sakura-600 shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                      : 'border-sakura-500 group-hover:border-sakura-600'
                  }`}
                />
                {/* Decorative middle ring with pattern simulation */}
                <div
                  className={`absolute inset-[3px] md:inset-1 rounded-full transition-colors duration-300 ${
                    isTransparent
                      ? 'border border-sakura-500/60'
                      : 'border border-sakura-400/50'
                  }`}
                  style={{
                    background: isTransparent
                      ? 'repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(236, 72, 153, 0.08) 30deg 60deg)'
                      : 'repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(236, 72, 153, 0.06) 30deg 60deg)',
                  }}
                />
                {/* Inner circle - background */}
                <div
                  className={`absolute inset-[6px] md:inset-2 rounded-full transition-colors duration-300 ${
                    isTransparent
                      ? 'bg-white/90 backdrop-blur-sm'
                      : 'bg-white'
                  }`}
                />
                {/* Center character 一 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`font-serif text-base md:text-lg font-medium transition-colors duration-300 select-none ${
                      isTransparent
                        ? 'text-sakura-700'
                        : 'text-sakura-600 group-hover:text-sakura-700'
                    }`}
                    style={{
                      fontFamily: '"Noto Serif JP", "Source Han Serif", serif',
                      marginTop: '1px',
                    }}
                  >
                    一
                  </span>
                </div>
                {/* Decorative dots - 桜 petals hint (5 points like cherry blossom) */}
                {[0, 72, 144, 216, 288].map((angle, i) => {
                  const radius = 17; // pixels from center
                  const rad = (angle - 90) * (Math.PI / 180);
                  const x = Math.cos(rad) * radius;
                  const y = Math.sin(rad) * radius;
                  return (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 rounded-full transition-all duration-300 ${
                        isTransparent
                          ? 'bg-sakura-500/70'
                          : 'bg-sakura-400/60 group-hover:bg-sakura-500/70'
                      }`}
                      style={{
                        top: `calc(50% + ${y}px)`,
                        left: `calc(50% + ${x}px)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  );
                })}
              </div>

              {/* Typography - 和モダン Style - Sakura Theme */}
              <div className="flex flex-col leading-none">
                {/* Main brand name */}
                <span
                  className={`font-serif text-lg md:text-xl tracking-tight transition-all duration-300 ${
                    isTransparent
                      ? 'text-sakura-700 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'
                      : 'text-sakura-600 group-hover:text-sakura-700'
                  }`}
                >
                  <span className="italic font-medium">Kimono</span>
                  <span className="font-light ml-1">One</span>
                </span>
                {/* Japanese subtitle */}
                <span
                  className={`hidden md:block text-[10px] tracking-[0.25em] mt-1 font-medium transition-colors duration-300 ${
                    isTransparent
                      ? 'text-sakura-600/80 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]'
                      : 'text-sakura-500/70 group-hover:text-sakura-600/80'
                  }`}
                >
                  着物レンタル
                </span>
              </div>
            </Link>
          </div>

          {/* 中间：搜索栏（Hero 可见时隐藏，滚动后显示；详情页完全隐藏） */}
          {!hideSearchBar && (
            <div
              className={`flex-1 flex justify-center max-w-2xl mx-4 transition-all duration-300 ${
                isHeroVisible ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
              }`}
            >
              <HeaderSearchBar />
            </div>
          )}

          {/* 右侧：菜单和用户 */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* 购物车按钮 */}
            <HeaderActions
              isLoggedIn={!!session?.user}
              merchant={merchant}
            />

            {/* 导航菜单 + 用户头像（合并按钮，Airbnb 风格） */}
            <div className="hidden md:flex items-center gap-2 relative">
              <NavMenuButton navLinks={navLinks} />

              {session?.user ? (
                <UserMenu user={session.user} />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-sakura-50 hover:text-sakura-700 h-10 px-4 border border-gray-300"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
