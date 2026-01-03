"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useFavoritesStore } from "@/store/favorites";
import type { PlanCategory } from "@prisma/client";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  images: string[];
  category: PlanCategory;
  isActive: boolean;
  pricingUnit: string;
  unitLabel: string;
}

interface FavoriteGroup {
  plan: Plan;
  images: string[];
  createdAt: Date;
}

interface WishlistClientProps {
  initialFavorites: FavoriteGroup[];
}

export default function WishlistClient({ initialFavorites }: WishlistClientProps) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const { removeFavorite } = useFavoritesStore();

  const handleRemove = async (planId: string, planName: string) => {
    setRemovingIds((prev) => new Set(prev).add(planId));

    try {
      // 删除该套餐的所有收藏图片
      const planFav = favorites.find((f) => f.plan.id === planId);
      if (planFav) {
        for (const imageUrl of planFav.images) {
          await fetch(
            `/api/favorites?planId=${planId}&imageUrl=${encodeURIComponent(imageUrl)}`,
            { method: "DELETE" }
          );
          // 同步更新本地 store
          removeFavorite(planId, imageUrl);
        }
        // 如果没有收藏具体图片，删除套餐级别的收藏
        if (planFav.images.length === 0) {
          await fetch(`/api/favorites?planId=${planId}`, { method: "DELETE" });
        }
      }

      // 更新本地状态
      setFavorites((prev) => prev.filter((f) => f.plan.id !== planId));

      toast.success("已从心愿单移除", {
        description: planName,
      });
    } catch (error) {
      toast.error("移除失败，请重试");
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(planId);
        return next;
      });
    }
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map(({ plan, images, createdAt }) => {
        const isRemoving = removingIds.has(plan.id);
        const displayImage = plan.imageUrl || plan.images[0] || images[0];
        const discount = plan.originalPrice
          ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
          : 0;

        return (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all ${
              isRemoving ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {/* 图片 */}
            <Link href={`/plans/${plan.slug || plan.id}`} className="block relative aspect-[4/3]">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={plan.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl">👘</span>
                </div>
              )}

              {/* 折扣标签 */}
              {discount > 0 && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-sakura-500 text-white text-xs font-bold rounded">
                  -{discount}%
                </div>
              )}

              {/* 收藏图片数量 */}
              {images.length > 0 && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                  <Heart className="w-3 h-3 fill-current" />
                  <span>{images.length} 张</span>
                </div>
              )}

              {/* 不可用标记 */}
              {!plan.isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-medium">已下架</span>
                </div>
              )}
            </Link>

            {/* 信息 */}
            <div className="p-4">
              <Link
                href={`/plans/${plan.slug || plan.id}`}
                className="block text-lg font-semibold text-gray-900 hover:text-sakura-600 transition-colors mb-2 line-clamp-1"
              >
                {plan.name}
              </Link>

              {/* 价格 */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xl font-bold text-sakura-600">
                  ¥{(plan.price / 100).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">
                  /{plan.unitLabel}
                </span>
                {plan.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ¥{(plan.originalPrice / 100).toLocaleString()}
                  </span>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/plans/${plan.slug || plan.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sakura-600 hover:bg-sakura-700 text-white rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>查看详情</span>
                </Link>
                <button
                  onClick={() => handleRemove(plan.id, plan.name)}
                  disabled={isRemoving}
                  className="p-2.5 border border-gray-200 hover:border-red-300 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                  title="从心愿单移除"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* 收藏时间 */}
              <p className="text-xs text-gray-400 mt-3">
                收藏于 {new Date(createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
