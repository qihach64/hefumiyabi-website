"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavoritesStore } from "@/store/favorites";

export default function WishlistIcon() {
  const [mounted, setMounted] = useState(false);
  const favorites = useFavoritesStore((state) => state.favorites);
  const totalItems = favorites.length;

  // 只在客户端渲染数量，避免 hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      href="/profile/wishlist"
      className="relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-sakura-50 hover:text-sakura-700 h-10 w-10"
      aria-label="心愿单"
    >
      <Heart className="h-5 w-5" />
      {mounted && totalItems > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-sakura-600 text-white text-xs font-bold flex items-center justify-center animate-in zoom-in">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
