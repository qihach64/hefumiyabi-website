"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, type LucideIcon } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useSearchBar } from "@/contexts/SearchBarContext";
import { useScrollDirection } from "@/shared/hooks/useScrollDirection";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}

function NavItem({ icon: Icon, label, href, onClick, active, badge }: NavItemProps) {
  const content = (
    <>
      <div className="relative">
        <Icon
          className={`w-6 h-6 transition-colors duration-200 ${
            active ? "text-sakura-500" : "text-wabi-400"
          }`}
        />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-sakura-500 text-white text-[10px] font-bold rounded-full">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span
        className={`text-[10px] font-medium mt-0.5 transition-colors duration-200 ${
          active ? "text-sakura-500" : "text-wabi-400"
        }`}
      >
        {label}
      </span>
    </>
  );

  const className = `flex flex-col items-center justify-center flex-1 h-full
    transition-transform duration-200 active:scale-90`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  // 延迟读取购物车数量，避免 SSR/客户端 hydration 不匹配
  const storeItemCount = useCartStore((state) => state.getTotalItems());
  const [itemCount, setItemCount] = useState(0);
  useEffect(() => {
    setItemCount(storeItemCount);
  }, [storeItemCount]);
  const { openMobileSearchModal, isMobileSearchModalOpen } = useSearchBar();
  const scrollDirection = useScrollDirection();

  // 搜索模态框打开时隐藏底部导航
  if (isMobileSearchModalOpen) return null;

  const isHidden = scrollDirection === "down";

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50
                 border-t border-wabi-100
                 h-16 pb-safe md:hidden
                 transition-transform duration-300"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transform: isHidden
          ? "translateY(calc(100% + env(safe-area-inset-bottom, 0px)))"
          : "translateY(0)",
      }}
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto">
        <NavItem icon={Home} label="首页" href="/" active={pathname === "/"} />
        <NavItem icon={Search} label="搜索" onClick={openMobileSearchModal} />
        <NavItem
          icon={ShoppingBag}
          label="购物车"
          href="/cart"
          active={pathname === "/cart"}
          badge={itemCount}
        />
        <NavItem
          icon={User}
          label="我的"
          href="/profile"
          active={pathname === "/profile" || pathname.startsWith("/profile/")}
        />
      </div>
    </nav>
  );
}
