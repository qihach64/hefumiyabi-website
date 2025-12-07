"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, ArrowRight } from "lucide-react";
import CartIcon from "../CartIcon";
import { useState, useEffect } from "react";

interface HeaderActionsProps {
  isLoggedIn: boolean;
  merchant: {
    id: string;
    status: string;
    businessName: string;
  } | null;
  isTransparent?: boolean;
}

export default function HeaderActions({ isLoggedIn, merchant, isTransparent }: HeaderActionsProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const isMerchantPage = pathname?.startsWith("/merchant");

  // 等待客户端挂载完成，避免 hydration 不匹配
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 在挂载前渲染简化版本，避免 hydration 不匹配
  if (!isMounted) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        {/* 商家按钮骨架 */}
        {merchant && merchant.status === "APPROVED" && (
          <Link
            href="/merchant/dashboard"
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all bg-sakura-50 hover:bg-sakura-100 text-sakura-700 border border-sakura-200"
          >
            <Store className="w-4 h-4" />
            <span className="hidden md:inline">商家中心</span>
            <span className="md:hidden">商家</span>
          </Link>
        )}

        {merchant && (merchant.status === "PENDING" || merchant.status === "REJECTED") && (
          <Link
            href="/merchant/pending"
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
          >
            <Store className="w-4 h-4" />
            <span className="hidden md:inline">
              {merchant.status === "PENDING" ? "审核中" : "申请被拒"}
            </span>
            <span className="md:hidden">审核</span>
          </Link>
        )}

        {!merchant && (
          <Link
            href="/merchant/register"
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border-2 border-sakura-300 text-sakura-600 hover:bg-sakura-50"
          >
            <Store className="w-4 h-4" />
            <span className="hidden md:inline">成为商家</span>
            <span className="md:hidden">商家</span>
          </Link>
        )}

        <CartIcon isTransparent={isTransparent} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* 商家模式切换 - Airbnb风格 */}
      {merchant && merchant.status === "APPROVED" && (
        <>
          {isMerchantPage ? (
            // 在商家页面，显示"切换到客户模式"
            <Link
              href="/"
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-sakura-50 text-gray-700 hover:text-sakura-700"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span className="hidden md:inline">客户模式</span>
            </Link>
          ) : (
            // 在客户页面，显示"切换到商家模式"
            <Link
              href="/merchant/dashboard"
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all bg-sakura-50 hover:bg-sakura-100 text-sakura-700 border border-sakura-200"
            >
              <Store className="w-4 h-4" />
              <span className="hidden md:inline">商家中心</span>
              <span className="md:hidden">商家</span>
            </Link>
          )}
        </>
      )}

      {/* 商家申请状态 - PENDING 或 REJECTED */}
      {merchant && (merchant.status === "PENDING" || merchant.status === "REJECTED") && (
        <Link
          href="/merchant/pending"
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
        >
          <Store className="w-4 h-4" />
          <span className="hidden md:inline">
            {merchant.status === "PENDING" ? "审核中" : "申请被拒"}
          </span>
          <span className="md:hidden">审核</span>
        </Link>
      )}

      {/* 成为商家入口 - 未注册商家的用户显示（包括游客） */}
      {!merchant && (
        <Link
          href="/merchant/register"
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border-2 border-sakura-300 text-sakura-600 hover:bg-sakura-50"
        >
          <Store className="w-4 h-4" />
          <span className="hidden md:inline">成为商家</span>
          <span className="md:hidden">商家</span>
        </Link>
      )}

      {/* 购物车图标 - 仅在客户模式显示 */}
      {!isMerchantPage && <CartIcon isTransparent={isTransparent} />}
    </div>
  );
}
