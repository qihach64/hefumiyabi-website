"use client";

import { useState, memo } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

interface NavMenuButtonProps {
  navLinks: Array<{
    href: string;
    label: string;
    special?: boolean;
  }>;
}

const NavMenuButton = memo(function NavMenuButton({ navLinks }: NavMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 菜单按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition-all duration-200 bg-white"
      >
        <Menu className="w-3.5 h-3.5 text-gray-700" />
        <span className="text-xs font-medium text-gray-700 hidden lg:inline">菜单</span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />

          {/* 菜单面板 */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  block px-4 py-3 text-sm hover:bg-gray-50 transition-colors
                  ${link.special ? "font-semibold text-sakura-600" : "text-gray-700"}
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
});

export default NavMenuButton;
