"use client";

import Link from "next/link";
import Image from "next/image";
import { KimonoWithImages } from "@/types";
import { Heart } from "lucide-react";

interface KimonoCardProps {
  kimono: KimonoWithImages;
}

export default function KimonoCard({ kimono }: KimonoCardProps) {
  const mainImage = kimono.images[0];
  const categoryNames = {
    WOMEN: "女士",
    MEN: "男士",
    CHILDREN: "儿童",
  };

  return (
    <Link
      href={`/kimonos/${kimono.id}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={mainImage.alt || kimono.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            暂无图片
          </div>
        )}

        {/* 状态标签 */}
        {!kimono.isAvailable && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            已租出
          </div>
        )}

        {/* 收藏按钮 */}
        <button
          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
          onClick={(e) => {
            e.preventDefault();
            // TODO: 实现收藏功能
            console.log("收藏:", kimono.id);
          }}
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        {/* 分类标签 */}
        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-primary/10 text-primary mb-2">
          {categoryNames[kimono.category]}
        </span>

        {/* 名称 */}
        <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {kimono.name}
        </h3>

        {/* 风格 */}
        <p className="text-sm text-muted-foreground mb-2">{kimono.style}</p>

        {/* 颜色标签 */}
        <div className="flex flex-wrap gap-1">
          {kimono.color.slice(0, 3).map((color) => (
            <span
              key={color}
              className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
            >
              {color}
            </span>
          ))}
          {kimono.color.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
              +{kimono.color.length - 3}
            </span>
          )}
        </div>

        {/* 浏览次数 */}
        {kimono.viewCount > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {kimono.viewCount} 次浏览
          </p>
        )}
      </div>
    </Link>
  );
}
