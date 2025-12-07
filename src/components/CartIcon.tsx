"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface CartIconProps {
  isTransparent?: boolean;
}

export default function CartIcon({ isTransparent }: CartIconProps) {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  // 只在客户端渲染购物车数量，避免 hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      href="/cart"
      className={`relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 h-10 w-10 ${
        isTransparent
          ? 'text-white hover:bg-white/20'
          : 'text-gray-700 hover:bg-sakura-50 hover:text-sakura-700'
      }`}
      style={isTransparent ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' } : undefined}
      aria-label="购物车"
    >
      <ShoppingCart className="h-5 w-5" />
      {mounted && totalItems > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-sakura-600 text-white text-xs font-bold flex items-center justify-center animate-in zoom-in">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
