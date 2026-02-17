import Link from "next/link";
import { Instagram, Youtube, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* 品牌区域 */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              {/* CSS 家纹 Logo */}
              <div className="relative w-10 h-10 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-sakura-500" />
                <div
                  className="absolute inset-1 rounded-full border border-sakura-400/50"
                  style={{
                    background:
                      "repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(236, 72, 153, 0.06) 30deg 60deg)",
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
              <div className="flex flex-col leading-none">
                <span className="font-serif text-[18px] text-sakura-600">
                  <span className="italic font-medium">Kimono</span>
                  <span className="font-light ml-1">One</span>
                </span>
                <span className="text-[10px] tracking-[0.25em] mt-1 font-medium text-sakura-500/70">
                  着物レンタル
                </span>
              </div>
            </div>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-4">
              专业和服租赁服务，让每一位游客都能体验日本传统之美
            </p>
            <p
              className="font-serif text-[13px] text-gray-400 italic mb-6"
              style={{ fontFamily: '"Noto Serif JP", "Source Han Serif", serif' }}
            >
              伝統の美、現代の心
            </p>

            {/* 社交媒体 */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-sakura-50 flex items-center justify-center text-sakura-500 hover:bg-sakura-100 hover:text-sakura-600 transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-sakura-50 flex items-center justify-center text-sakura-500 hover:bg-sakura-100 hover:text-sakura-600 transition-colors duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-sakura-50 flex items-center justify-center text-sakura-500 hover:bg-sakura-100 hover:text-sakura-600 transition-colors duration-300"
                aria-label="Youtube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 快速链接 */}
          <div className="md:col-span-2 md:col-start-6">
            <h4 className="text-[14px] font-semibold text-gray-900 mb-4">快速链接</h4>
            <ul className="space-y-3 text-[14px]">
              <li>
                <Link
                  href="/plans"
                  className="text-gray-600 hover:text-sakura-600 transition-colors duration-300"
                >
                  和服套餐
                </Link>
              </li>
              <li>
                <Link
                  href="/stores"
                  className="text-gray-600 hover:text-sakura-600 transition-colors duration-300"
                >
                  店铺信息
                </Link>
              </li>
              <li>
                <Link
                  href="/campaigns"
                  className="text-gray-600 hover:text-sakura-600 transition-colors duration-300"
                >
                  优惠活动
                </Link>
              </li>
            </ul>
          </div>

          {/* 客户服务 */}
          <div className="md:col-span-2">
            <h4 className="text-[14px] font-semibold text-gray-900 mb-4">客户服务</h4>
            <ul className="space-y-3 text-[14px]">
              <li>
                <Link
                  href="/faq"
                  className="text-gray-600 hover:text-sakura-600 transition-colors duration-300"
                >
                  常见问题
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-sakura-600 transition-colors duration-300"
                >
                  联系我们
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-sakura-600 transition-colors duration-300"
                >
                  关于我们
                </Link>
              </li>
            </ul>

            <h4 className="text-[14px] font-semibold text-gray-900 mb-4 mt-8">合作伙伴</h4>
            <ul className="space-y-3 text-[14px]">
              <li>
                <Link
                  href="/merchant/register"
                  className="text-sakura-500 hover:text-sakura-600 font-medium transition-colors duration-300"
                >
                  成为商家
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系方式 */}
          <div className="md:col-span-2">
            <h4 className="text-[14px] font-semibold text-gray-900 mb-4">联系方式</h4>
            <ul className="space-y-3 text-[14px] text-gray-600">
              <li>info@kimono-one.com</li>
              <li>东京 · 浅草 · 京都</li>
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-12 pt-8">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />
          <p className="text-center text-[12px] text-gray-400">
            &copy; {new Date().getFullYear()} Kimono One. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
