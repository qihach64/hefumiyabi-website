"use client";

import Link from "next/link";
import Image from "next/image";
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
  const { expandSearchBar, isHeaderSearchVisible } = useSearchBar();
  const [merchant, setMerchant] = useState<any>(null);

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

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* 左侧：Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 移动端汉堡菜单 */}
            <MobileMenu
              isLoggedIn={!!session?.user}
              userName={session?.user?.name}
              userEmail={session?.user?.email}
              merchant={merchant}
            />

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0 group">
              <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.svg"
                  alt="Kimono One"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-base md:text-lg font-bold text-sakura-600 transition-colors group-hover:text-sakura-700">
                Kimono One
              </span>
            </Link>
          </div>

          {/* 中间：搜索栏（桌面端，滚动时显示） */}
          <div className="flex-1 flex justify-center max-w-2xl mx-4">
            {isHeaderSearchVisible && (
              <HeaderSearchBar onExpand={expandSearchBar} />
            )}
          </div>

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
