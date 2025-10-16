"use client";

import Link from "next/link";
import CartIcon from "../CartIcon";

interface HeaderActionsProps {
  isLoggedIn: boolean;
}

export default function HeaderActions({ isLoggedIn }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      {/* 购物车图标 */}
      <CartIcon />

      {/* 预约按钮 - 引导到套餐页面 */}
      <Link
        href="/plans"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 md:h-10 px-3 md:px-4 py-2"
      >
        <span className="hidden sm:inline">立即预约</span>
        <span className="sm:hidden">预约</span>
      </Link>
    </div>
  );
}
