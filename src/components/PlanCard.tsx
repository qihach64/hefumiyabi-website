"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui";

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    nameEn?: string;
    description?: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    storeName?: string;
    region?: string;
    category: string;
    duration: number;
    isCampaign?: boolean;
  };
  showMerchant?: boolean; // 是否显示商家信息（平台模式）
}

export default function PlanCard({ plan, showMerchant = false }: PlanCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  // 计算优惠百分比
  const discountPercent = plan.originalPrice && plan.originalPrice > plan.price
    ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
    : 0;

  // 分类标签
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      LADIES: "女士",
      MENS: "男士",
      COUPLE: "情侣",
      FAMILY: "亲子",
      GROUP: "团体",
      SPECIAL: "特别",
    };
    return labels[category] || "套餐";
  };

  return (
    <Link
      href={`/plans/${plan.id}`}
      className="group block"
    >
      <div className="relative">
        {/* 图片容器 - Airbnb 4:3 比例 */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          {plan.imageUrl ? (
            <Image
              src={plan.imageUrl}
              alt={plan.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-sakura-50">
              <span className="text-6xl opacity-20">👘</span>
            </div>
          )}

          {/* 收藏按钮 - Airbnb 风格 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorited(!isFavorited);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white hover:scale-110 transition-all shadow-md"
            aria-label="收藏"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorited
                  ? 'fill-sakura-500 text-sakura-500'
                  : 'text-gray-700'
              }`}
            />
          </button>

          {/* 优惠标签 */}
          {discountPercent > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="error" size="md" className="shadow-md">
                -{discountPercent}%
              </Badge>
            </div>
          )}

          {/* 活动标签 */}
          {plan.isCampaign && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="warning" size="sm" className="shadow-md">
                限时优惠
              </Badge>
            </div>
          )}
        </div>

        {/* 信息区域 */}
        <div className="mt-3 space-y-1">
          {/* 商家信息 + 地区 - 平台模式才显示 */}
          {showMerchant && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {plan.storeName && (
                <span className="font-semibold">
                  {plan.storeName}
                </span>
              )}
              {plan.region && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {plan.region}
                  </span>
                </>
              )}
            </div>
          )}

          {/* 套餐名称 */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:underline">
            {plan.name}
          </h3>

          {/* 套餐类型 + 时长 */}
          <p className="text-sm text-gray-600">
            {getCategoryLabel(plan.category)} · {plan.duration}小时
          </p>

          {/* 价格 - Airbnb 风格 */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-semibold text-gray-900">
              ¥{(plan.price / 100).toLocaleString()}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-sm text-gray-500 line-through">
                ¥{(plan.originalPrice / 100).toLocaleString()}
              </span>
            )}
            <span className="text-sm text-gray-600">/ 人</span>
          </div>

          {/* 评分 - 平台模式才显示（暂时模拟数据） */}
          {showMerchant && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
              <span className="font-semibold">4.8</span>
              <span className="text-gray-600">(128条评价)</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
