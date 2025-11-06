"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, MapPin, Star, Check } from "lucide-react";
import { Badge } from "@/components/ui";
import { useCartStore } from "@/store/cart";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

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
    includes?: string[];
    planTags?: { tag: Tag }[];
  };
  showMerchant?: boolean; // 是否显示商家信息（平台模式）
}

export default function PlanCard({ plan, showMerchant = false }: PlanCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const items = useCartStore((state) => state.items);

  // 检查是否已在购物车中，并获取 cartItemId
  const cartItem = items.find(item => item.planId === plan.id);
  const isInCart = !!cartItem;

  // 计算优惠金额
  const discountAmount = plan.originalPrice && plan.originalPrice > plan.price
    ? plan.originalPrice - plan.price
    : 0;

  // 切换购物车状态（添加/移除）
  const handleToggleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    if (isInCart && cartItem) {
      // 已在购物车：移除
      removeItem(cartItem.id);
    } else {
      // 不在购物车：添加
      addItem({
        type: 'PLAN',
        planId: plan.id,
        name: plan.name,
        nameEn: plan.nameEn,
        price: plan.price,
        originalPrice: plan.originalPrice,
        image: plan.imageUrl,
        addOns: [],
        isCampaign: plan.isCampaign,
      });
    }

    // 显示操作反馈
    setJustChanged(true);
    setTimeout(() => {
      setIsAdding(false);
      setJustChanged(false);
    }, 1000);
  };

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
        {/* 图片容器 - Airbnb 3:4 比例（和服更适合竖版） */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
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

          {/* 加入购物车按钮 - 切换开关 */}
          <button
            onClick={handleToggleCart}
            disabled={isAdding}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all ${
              justChanged
                ? isInCart
                  ? 'bg-gray-400 text-white scale-110'
                  : 'bg-green-500 text-white scale-110'
                : isInCart
                ? 'bg-sakura-500 text-white hover:bg-sakura-600'
                : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-110'
            }`}
            aria-label={isInCart ? "从购物车移除" : "加入购物车"}
            title={isInCart ? "点击从购物车移除" : "点击加入购物车"}
          >
            {justChanged ? (
              <Check className="w-5 h-5" />
            ) : (
              <ShoppingCart
                className={`w-5 h-5 ${isInCart ? 'fill-current' : ''}`}
              />
            )}
          </button>

          {/* 优惠标签 */}
          {discountAmount > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="error" size="md" className="shadow-md font-bold">
                省¥{(discountAmount / 100).toLocaleString()}
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

          {/* 标签 */}
          {plan.planTags && plan.planTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {plan.planTags.slice(0, 4).map(({ tag }) => (
                <Badge key={tag.id} variant="sakura" size="sm">
                  {tag.icon && <span className="mr-1">{tag.icon}</span>}
                  {tag.name}
                </Badge>
              ))}
              {plan.planTags.length > 4 && (
                <Badge variant="sakura" size="sm" className="opacity-60">
                  +{plan.planTags.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* 价格 - 简洁显示 */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-semibold text-gray-900">
              ¥{(plan.price / 100).toLocaleString()}
            </span>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <span className="text-xs text-gray-400 line-through">
                ¥{(plan.originalPrice / 100).toLocaleString()}
              </span>
            )}
            <span className="text-sm text-gray-600">/ 人</span>
          </div>

          {/* 包含内容 - 简化为一行 */}
          {plan.includes && plan.includes.length > 0 && (
            <div className="pt-2 mt-1 text-xs text-gray-600">
              含{plan.includes.slice(0, 2).join('·')}
              {plan.includes.length > 2 && `等${plan.includes.length}项`} ›
            </div>
          )}

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
