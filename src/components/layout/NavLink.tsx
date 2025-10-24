"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  special?: boolean;
  mobile?: boolean;
}

export default function NavLink({ href, children, special, mobile }: NavLinkProps) {
  const pathname = usePathname();
  // 特殊处理：首页精确匹配，其他页面匹配开头
  const isActive = href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(href + "/");

  if (special) {
    // AI试穿特殊样式
    return (
      <Link
        href={href}
        className={cn(
          "relative px-3 py-2 rounded-lg text-sm font-medium transition-all",
          "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500",
          "hover:from-pink-600 hover:to-rose-600",
          isActive && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-pink-500 after:to-rose-500",
          mobile && "px-2 text-xs"
        )}
      >
        {children} {!mobile && "✨"}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "relative px-3 py-2 rounded-lg text-sm font-medium transition-all",
        "hover:text-gray-900 hover:bg-gray-50",
        isActive
          ? "text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sakura-600 after:rounded-full"
          : "text-gray-600",
        mobile && "px-2 text-xs"
      )}
    >
      {children}
    </Link>
  );
}
