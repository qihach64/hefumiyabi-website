"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Package, Sparkles, Store as StoreIcon, HelpCircle, Info, User, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isLoggedIn: boolean;
  userName?: string | null;
  userEmail?: string | null;
  merchant: {
    id: string;
    status: string;
    businessName: string;
  } | null;
  isTransparent?: boolean;
}

export default function MobileMenu({ isLoggedIn, userName, userEmail, merchant, isTransparent }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 路由变化时关闭菜单
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navLinks = [
    {
      href: "/",
      label: "首页",
      icon: Home,
      description: "返回主页"
    },
    {
      href: "/plans",
      label: "租赁套餐",
      icon: Package,
      description: "浏览和服套餐"
    },
    {
      href: "/virtual-tryon",
      label: "AI 试穿",
      icon: Sparkles,
      description: "智能虚拟试穿",
      special: true
    },
    {
      href: "/stores",
      label: "店铺信息",
      icon: StoreIcon,
      description: "查找附近店铺"
    },
    {
      href: "/faq",
      label: "常见问题",
      icon: HelpCircle,
      description: "帮助与支持"
    },
    {
      href: "/about",
      label: "关于我们",
      icon: Info,
      description: "了解和缘"
    },
  ];

  return (
    <>
      {/* 汉堡菜单按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`md:hidden inline-flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${
          isTransparent
            ? 'text-white hover:text-white/90 hover:bg-white/20'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        style={isTransparent ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' } : undefined}
        aria-label="打开菜单"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 侧边抽屉 */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 md:hidden",
          "transform transition-transform duration-300 ease-out",
          "shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 顶部区域 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sakura-400 to-sakura-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              和
            </div>
            <div>
              <h2 className="font-bold text-gray-900">和缘</h2>
              <p className="text-xs text-gray-500">京都和服体验</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="关闭菜单"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 用户信息区域 */}
        {isLoggedIn && (
          <div className="p-4 bg-gradient-to-br from-sakura-50 to-rose-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sakura-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {userName?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {userName || "用户"}
                </p>
                {userEmail && (
                  <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                )}
              </div>
            </div>

            {/* 商家状态卡片 */}
            {merchant && (
              <div className="mt-3 p-3 bg-white rounded-lg shadow-sm border border-sakura-100">
                <div className="flex items-center gap-2 text-sm">
                  <StoreIcon className="w-4 h-4 text-sakura-600" />
                  <span className="font-medium text-gray-900">{merchant.businessName}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      merchant.status === "APPROVED" && "bg-green-100 text-green-700",
                      merchant.status === "PENDING" && "bg-amber-100 text-amber-700",
                      merchant.status === "REJECTED" && "bg-red-100 text-red-700"
                    )}
                  >
                    {merchant.status === "APPROVED" && "已认证"}
                    {merchant.status === "PENDING" && "审核中"}
                    {merchant.status === "REJECTED" && "已拒绝"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 导航链接 */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    "hover:bg-gray-50 active:scale-[0.98]",
                    isActive
                      ? "bg-sakura-50 text-sakura-700 font-semibold shadow-sm"
                      : "text-gray-700",
                    link.special && !isActive && "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 shrink-0",
                    isActive && "text-sakura-600",
                    link.special && !isActive && "text-pink-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      {link.label}
                      {link.special && <span className="text-sm">✨</span>}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {link.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-8 bg-sakura-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 商家相关链接 */}
          {isLoggedIn && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                商家中心
              </p>
              <div className="space-y-1">
                {merchant?.status === "APPROVED" ? (
                  <Link
                    href="/merchant/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    <StoreIcon className="w-5 h-5 text-sakura-600" />
                    <div className="flex-1">
                      <div className="font-medium">商家中心</div>
                      <div className="text-xs text-gray-500">管理您的店铺</div>
                    </div>
                  </Link>
                ) : merchant?.status === "PENDING" ? (
                  <Link
                    href="/merchant/pending"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    <StoreIcon className="w-5 h-5 text-amber-600" />
                    <div className="flex-1">
                      <div className="font-medium">申请审核中</div>
                      <div className="text-xs text-gray-500">查看申请状态</div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/merchant/register"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    <StoreIcon className="w-5 h-5 text-sakura-600" />
                    <div className="flex-1">
                      <div className="font-medium">成为商家</div>
                      <div className="text-xs text-gray-500">入驻和缘平台</div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* 底部区域 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          {isLoggedIn ? (
            <Link
              href="/api/auth/signout"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              退出登录
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-sakura-600 text-white rounded-xl font-medium hover:bg-sakura-700 transition-all active:scale-[0.98] shadow-md"
            >
              <LogIn className="w-5 h-5" />
              登录 / 注册
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
