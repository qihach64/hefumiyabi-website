"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { User, LogOut, Calendar, ChevronDown } from "lucide-react";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* 用户头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-sakura-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 transition-transform hidden md:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          {/* 用户信息 */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="font-semibold text-gray-900 truncate">{user.name || "用户"}</p>
            {user.email && (
              <p className="text-sm text-gray-600 truncate mt-0.5">
                {user.email}
              </p>
            )}
          </div>

          {/* 菜单项 */}
          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">个人中心</span>
            </Link>
            <Link
              href="/profile#bookings"
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">我的预约</span>
            </Link>
          </div>

          {/* 退出登录 */}
          <div className="border-t border-gray-200 py-2">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition w-full text-left text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
