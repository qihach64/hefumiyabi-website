"use client";

import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  kimonoId: string;
  className?: string;
}

export default function FavoriteButton({ kimonoId, className = "" }: FavoriteButtonProps) {
  const handleFavorite = () => {
    // TODO: 实现收藏功能
    console.log("收藏:", kimonoId);
  };

  return (
    <button
      className={className}
      onClick={handleFavorite}
      aria-label="收藏"
    >
      <Heart className="w-5 h-5" />
    </button>
  );
}
