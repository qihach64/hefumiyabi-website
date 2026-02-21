"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Store as StoreIcon,
  HelpCircle,
  Info,
  Globe,
  ChevronRight,
  Heart,
} from "lucide-react";
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
}

export default function MobileMenu({ merchant }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // 客户端挂载后启用 portal
  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <>
      {/* 汉堡菜单按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="打开菜单"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 遮罩层 + 侧边抽屉 — 用 Portal 渲染到 body，避免 header 的 backdrop-filter 创建 containing block 导致 fixed 定位被截断 */}
      {mounted &&
        createPortal(
          <>
            {/* 遮罩层 */}
            {isOpen && (
              <div
                className="fixed inset-0 bg-black/40 z-[55] md:hidden transition-opacity backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* 侧边抽屉 - Miyabi 风格 */}
            <div
              className={cn(
                "fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-[60] md:hidden",
                "bg-white/95 backdrop-blur-xl pb-16",
                "transform transition-transform duration-300 ease-out",
                "shadow-2xl flex flex-col overflow-hidden",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              {/* 樱花装饰背景 */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  background: `
                    radial-gradient(circle at 20% 20%, rgba(212, 91, 71, 0.08) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(212, 91, 71, 0.06) 0%, transparent 50%),
                    radial-gradient(circle at 60% 40%, rgba(212, 91, 71, 0.04) 0%, transparent 40%)
                  `,
                }}
              />
              {/* 顶部区域 - 品牌家纹 */}
              <div className="relative flex items-center justify-between p-4 border-b border-sakura-100/50">
                <Link href="/" className="flex items-center gap-3 group">
                  {/* CSS 家纹 Kamon */}
                  <div className="relative w-10 h-10 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-sakura-500 transition-colors duration-300 group-hover:border-sakura-600" />
                    <div
                      className="absolute inset-1 rounded-full border border-sakura-400/50"
                      style={{
                        background:
                          "repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(212, 91, 71, 0.06) 30deg 60deg)",
                      }}
                    />
                    <div className="absolute inset-[6px] rounded-full bg-white" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="font-serif text-[14px] font-medium text-sakura-600 select-none"
                        style={{ fontFamily: '"Noto Serif JP", "Source Han Serif", serif' }}
                      >
                        一
                      </span>
                    </div>
                  </div>
                  {/* 品牌名 */}
                  <div className="flex flex-col leading-none">
                    <span className="font-serif text-[18px] text-sakura-600">
                      <span className="italic font-medium">Kimono</span>
                      <span className="font-light ml-1">One</span>
                    </span>
                    <span className="text-[10px] tracking-[0.25em] mt-1 font-medium text-sakura-500/70">
                      着物レンタル
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-sakura-50 transition-all duration-200"
                  aria-label="关闭菜单"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 主要导航区域 */}
              <div className="relative flex-1 overflow-y-auto">
                {/* 商家入口 */}
                <div className="p-4 border-b border-sakura-100/50">
                  <p className="px-4 mb-2 text-[11px] uppercase tracking-[0.15em] text-sakura-500 font-medium">
                    商家服务
                  </p>
                  {merchant?.status === "APPROVED" ? (
                    <Link
                      href="/merchant/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-sakura-50 transition-all duration-200 active:scale-[0.98]"
                    >
                      <StoreIcon className="w-5 h-5 text-sakura-600" />
                      <div className="flex-1">
                        <div className="font-medium">商家中心</div>
                        <div className="text-[12px] text-gray-500">管理您的店铺</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ) : merchant?.status === "PENDING" ? (
                    <Link
                      href="/merchant/pending"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-yellow-50 transition-all duration-200 active:scale-[0.98]"
                    >
                      <StoreIcon className="w-5 h-5 text-yellow-600" />
                      <div className="flex-1">
                        <div className="font-medium">申请审核中</div>
                        <div className="text-[12px] text-gray-500">查看申请状态</div>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        审核中
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href="/merchant/register"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-sakura-50 transition-all duration-200 active:scale-[0.98]"
                    >
                      <StoreIcon className="w-5 h-5 text-sakura-600" />
                      <div className="flex-1">
                        <div className="font-medium">成为商家</div>
                        <div className="text-[12px] text-gray-500">入驻 Kimono One 平台</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  )}
                </div>

                {/* 辅助导航 */}
                <div className="p-4">
                  <p className="px-4 mb-2 text-[11px] uppercase tracking-[0.15em] text-sakura-500 font-medium">
                    更多
                  </p>
                  <div className="space-y-1">
                    <Link
                      href="/favorites"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-sakura-50 transition-all duration-200 active:scale-[0.98]"
                    >
                      <Heart className="w-5 h-5 text-sakura-500" />
                      <span className="flex-1 font-medium">我的收藏</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link
                      href="/faq"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-sakura-50 transition-all duration-200 active:scale-[0.98]"
                    >
                      <HelpCircle className="w-5 h-5 text-sakura-500" />
                      <span className="flex-1 font-medium">常见问题</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link
                      href="/about"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-sakura-50 transition-all duration-200 active:scale-[0.98]"
                    >
                      <Info className="w-5 h-5 text-sakura-500" />
                      <span className="flex-1 font-medium">关于我们</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-sakura-50 transition-all duration-200 active:scale-[0.98] w-full">
                      <Globe className="w-5 h-5 text-sakura-500" />
                      <span className="flex-1 font-medium text-left">语言 / 货币</span>
                      <span className="text-[12px] text-gray-500">简中 / ¥</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
