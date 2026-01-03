"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, ExternalLink, ChevronDown, ChevronRight, X } from "lucide-react";
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
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(
    // 默认展开第一个套餐
    new Set(initialFavorites.length > 0 ? [initialFavorites[0].plan.id] : [])
  );
  const [removingImages, setRemovingImages] = useState<Set<string>>(new Set());
  const { removeFavorite } = useFavoritesStore();

  // 切换展开/折叠
  const toggleExpand = (planId: string) => {
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  };

  // 删除单张图片
  const handleRemoveImage = async (planId: string, imageUrl: string, planName: string) => {
    const key = `${planId}:${imageUrl}`;
    setRemovingImages((prev) => new Set(prev).add(key));

    try {
      await fetch(
        `/api/favorites?planId=${planId}&imageUrl=${encodeURIComponent(imageUrl)}`,
        { method: "DELETE" }
      );

      // 同步更新本地 store
      removeFavorite(planId, imageUrl);

      // 更新本地状态
      setFavorites((prev) => {
        return prev.map((f) => {
          if (f.plan.id === planId) {
            const newImages = f.images.filter((img) => img !== imageUrl);
            // 如果没有图片了，移除整个套餐
            if (newImages.length === 0) {
              return null;
            }
            return { ...f, images: newImages };
          }
          return f;
        }).filter(Boolean) as FavoriteGroup[];
      });

      toast.success("已移除收藏图片");
    } catch (error) {
      toast.error("移除失败，请重试");
    } finally {
      setRemovingImages((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // 删除套餐的所有收藏
  const handleRemoveAll = async (planId: string, images: string[], planName: string) => {
    try {
      // 删除所有图片
      for (const imageUrl of images) {
        await fetch(
          `/api/favorites?planId=${planId}&imageUrl=${encodeURIComponent(imageUrl)}`,
          { method: "DELETE" }
        );
        removeFavorite(planId, imageUrl);
      }

      // 更新本地状态
      setFavorites((prev) => prev.filter((f) => f.plan.id !== planId));

      toast.success("已从心愿单移除", {
        description: planName,
      });
    } catch (error) {
      toast.error("移除失败，请重试");
    }
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {favorites.map(({ plan, images, createdAt }, index) => {
        const isExpanded = expandedPlans.has(plan.id);
        const discount = plan.originalPrice
          ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
          : 0;

        return (
          <div
            key={plan.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
          >
            {/* 套餐头部 - 点击展开/折叠 */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(plan.id)}
            >
              {/* 展开/折叠图标 */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>

              {/* 套餐缩略图 */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {(plan.imageUrl || images[0]) ? (
                  <Image
                    src={plan.imageUrl || images[0]}
                    alt={plan.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl">👘</span>
                  </div>
                )}
                {!plan.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs">已下架</span>
                  </div>
                )}
              </div>

              {/* 套餐信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{plan.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sakura-600 font-bold">
                    ¥{(plan.price / 100).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">/{plan.unitLabel}</span>
                  {discount > 0 && (
                    <span className="px-1.5 py-0.5 bg-sakura-100 text-sakura-600 text-xs font-medium rounded">
                      -{discount}%
                    </span>
                  )}
                </div>
              </div>

              {/* 收藏数量 */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-sakura-50 text-sakura-600 rounded-full text-sm font-medium">
                <Heart className="w-4 h-4 fill-current" />
                <span>{images.length} 张</span>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/plans/${plan.slug || plan.id}`}
                  className="p-2 hover:bg-sakura-50 rounded-lg text-gray-600 hover:text-sakura-600 transition-colors"
                  title="查看套餐"
                >
                  <ExternalLink className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => handleRemoveAll(plan.id, images, plan.name)}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  title="移除全部"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 展开的图片网格 */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map((imageUrl, imgIndex) => {
                    const isRemoving = removingImages.has(`${plan.id}:${imageUrl}`);
                    return (
                      <div
                        key={imgIndex}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden group ${
                          isRemoving ? "opacity-50" : ""
                        }`}
                      >
                        <Image
                          src={imageUrl}
                          alt={`${plan.name} - 收藏图片 ${imgIndex + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        />

                        {/* 悬停遮罩 */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                        {/* 删除按钮 */}
                        <button
                          onClick={() => handleRemoveImage(plan.id, imageUrl, plan.name)}
                          disabled={isRemoving}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          title="移除此图片"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* 图片序号 */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                          {imgIndex + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 收藏时间 */}
                <p className="text-xs text-gray-400 mt-4 text-center">
                  收藏于 {new Date(createdAt).toLocaleDateString("zh-CN")}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
