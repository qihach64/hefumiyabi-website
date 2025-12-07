"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

interface NavMenuButtonProps {
  navLinks: Array<{
    href: string;
    label: string;
    special?: boolean;
  }>;
  isTransparent?: boolean;
}

export default function NavMenuButton({ navLinks, isTransparent }: NavMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 菜单按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full px-3 py-2 transition-all duration-300 ${
          isTransparent
            ? 'border border-white/50 bg-white/10 backdrop-blur-sm hover:bg-white/20'
            : 'border border-gray-300 bg-white hover:shadow-md'
        }`}
      >
        <Menu className={`w-4 h-4 transition-colors duration-300 ${isTransparent ? 'text-white' : 'text-gray-700'}`} />
        <span
          className={`text-sm font-medium hidden lg:inline transition-colors duration-300 ${
            isTransparent ? 'text-white' : 'text-gray-700'
          }`}
          style={isTransparent ? { textShadow: '0 1px 2px rgba(0,0,0,0.3)' } : undefined}
        >
          菜单
        </span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 菜单面板 */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  block px-4 py-3 text-sm hover:bg-gray-50 transition-colors
                  ${link.special ? 'font-semibold text-sakura-600' : 'text-gray-700'}
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
