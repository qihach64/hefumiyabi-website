"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Check, MapPin } from "lucide-react";
import { Badge } from "@/components/ui";
import { useCartStore } from "@/store/cart";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

// 卡片变体类型
type CardVariant = 'default' | 'interactive' | 'soft' | 'zen' | 'glass';

// 卡片变体样式 - 统一白色背景，优雅过渡
const cardVariantStyles: Record<CardVariant, string> = {
  default: 'bg-white transition-all duration-500',
  interactive: 'bg-white hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-500',
  soft: 'bg-white rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] transition-all duration-500',
  zen: 'bg-white rounded-xl hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] transition-all duration-500',
  glass: 'glass-premium rounded-xl transition-all duration-500',
};

// 图片比例类型
type AspectRatio = 'square' | '3:4' | '4:3';

const aspectRatioStyles: Record<AspectRatio, string> = {
  'square': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
};

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    nameEn?: string;
    description?: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    merchantName?: string;
    region?: string;
    category?: string;
    duration?: number;
    isCampaign?: boolean;
    includes?: string[];
    planTags?: { tag: Tag }[];
  };
  variant?: CardVariant;
  showMerchant?: boolean;
  isRecommended?: boolean;
  // 主题感知
  themeSlug?: string;
  themeColor?: string;
  // 图片比例
  aspectRatio?: AspectRatio;
}

export default function PlanCard({
  plan,
  variant = 'default',
  showMerchant = false,
  isRecommended = false,
  themeSlug,
  themeColor = '#FF7A9A', // 默认樱花色
  aspectRatio = 'square', // 默认 1:1
}: PlanCardProps) {
  // 使用主题色作为点缀色
  const accentColor = themeColor;
  const [isAdding, setIsAdding] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const [lastAction, setLastAction] = useState<'add' | 'remove' | null>(null);

  const searchParams = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const items = useCartStore((state) => state.items);

  // 检查是否已在购物车中
  const cartItem = items.find(item => item.planId === plan.id);
  const isInCart = !!cartItem;

  // 构建详情页链接 - 保留搜索参数
  const planDetailHref = useMemo(() => {
    const params = new URLSearchParams();

    // 保留日期参数
    const date = searchParams.get('date');
    if (date) params.set('date', date);

    // 保留人数参数
    const guests = searchParams.get('guests');
    if (guests) params.set('guests', guests);

    // 保留详细人数参数
    const men = searchParams.get('men');
    if (men) params.set('men', men);

    const women = searchParams.get('women');
    if (women) params.set('women', women);

    const children = searchParams.get('children');
    if (children) params.set('children', children);

    const queryString = params.toString();
    return queryString ? `/plans/${plan.id}?${queryString}` : `/plans/${plan.id}`;
  }, [plan.id, searchParams]);

  // 计算优惠金额
  const discountAmount = plan.originalPrice && plan.originalPrice > plan.price
    ? plan.originalPrice - plan.price
    : 0;

  // 切换购物车状态
  const handleToggleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    if (isInCart && cartItem) {
      removeItem(cartItem.id);
      setLastAction('remove');
    } else {
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
      setLastAction('add');
    }

    setJustChanged(true);
    setTimeout(() => {
      setIsAdding(false);
      setJustChanged(false);
      setLastAction(null);
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
        href={planDetailHref}
        target="_blank"
        className={`group block overflow-hidden ${cardVariantStyles[variant]}`}
      >
        <div className="relative">
          {/* 图片容器 - 支持不同比例，四角圆角 */}
          <div className={`relative ${aspectRatioStyles[aspectRatio]} overflow-hidden rounded-xl bg-gray-100`}>
            {plan.imageUrl ? (
              <Image
                src={plan.imageUrl}
                alt={plan.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-sakura-50">
                <span className="text-6xl opacity-20">👘</span>
              </div>
            )}

            {/* 购物车按钮 - 右上角 */}
            <button
              onClick={handleToggleCart}
              disabled={isAdding}
              className={`absolute top-3 right-3 p-2.5 rounded-full transition-all glass-button z-10 ${
                justChanged
                  ? lastAction === 'add'
                    ? 'bg-green-50/90 text-green-600 scale-110 border-green-200'
                    : 'bg-gray-50/90 text-gray-400 scale-110'
                  : isInCart
                  ? 'bg-sakura-50/90 text-sakura-600 border-sakura-200'
                  : 'text-gray-700 hover:scale-110'
              }`}
              aria-label={isInCart ? "从购物车移除" : "加入购物车"}
              title={isInCart ? "点击从购物车移除" : "点击加入购物车"}
            >
              {justChanged ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingCart
                  className={`w-4 h-4 ${isInCart ? 'fill-current' : ''}`}
                />
              )}
            </button>


            {/* 底部标签组 */}
            {isRecommended && (
              <div className="absolute bottom-3 left-3">
                <Badge variant="warning" size="sm" className="shadow-md font-semibold">
                  ⭐ 为您推荐
                </Badge>
              </div>
            )}
          </div>

          {/* 信息区域 - 统一 padding */}
          <div className="px-3 pt-3 pb-3 space-y-1">
            {/* 商家名称 + 地区 */}
            {(showMerchant && plan.merchantName) || plan.region ? (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                {showMerchant && plan.merchantName && (
                  <span className="font-semibold tracking-wide uppercase">{plan.merchantName}</span>
                )}
                {showMerchant && plan.merchantName && plan.region && (
                  <div className="h-0.5 w-0.5 rounded-full bg-gray-300" />
                )}
                {plan.region && (
                  <div className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" style={{ color: accentColor }} />
                    <span>{plan.region}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* 套餐名称 */}
            <h3 className="font-medium text-[15px] text-gray-900 line-clamp-2 leading-snug group-hover:text-sakura-600 transition-colors duration-300">
              {plan.name}
            </h3>

            {/* 分隔线 - 主题色渐变 */}
            <div
              className="h-px transition-all duration-500 ease-out group-hover:w-12"
              style={{
                width: '28px',
                background: `linear-gradient(to right, ${accentColor}60, transparent)`,
              }}
            />

            {/* 价格区域 */}
            <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
              <span className="text-[16px] font-semibold text-gray-900 whitespace-nowrap">
                ¥{(plan.price / 100).toLocaleString()}/人
              </span>
              {plan.originalPrice && plan.originalPrice > 0 && plan.originalPrice > plan.price && (
                <>
                  <span className="text-[11px] text-gray-400 line-through">
                    ¥{(plan.originalPrice / 100).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                    省¥{((plan.originalPrice - plan.price) / 100).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            {/* 包含物 */}
            {plan.includes && plan.includes.length > 0 && (
              <p className="text-[12px] text-gray-500 line-clamp-1">
                含 {plan.includes.slice(0, 2).join(' · ')}
                {plan.includes.length > 2 && ` 等${plan.includes.length}项`}
              </p>
            )}

            {/* 标签 - 主题色边框 */}
            {plan.planTags && plan.planTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {plan.planTags.slice(0, 3).map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="text-[12px] tracking-wide px-2 py-0.5 text-gray-500 bg-white transition-all duration-300 hover:text-gray-700"
                    style={{
                      border: `1px solid ${accentColor}40`,
                    }}
                  >
                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                    {tag.name}
                  </span>
                ))}
                {plan.planTags.length > 3 && (
                  <span className="text-[12px] tracking-wide px-2 py-0.5 text-gray-400 bg-white border border-gray-200">
                    +{plan.planTags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
    </Link>
  );
}
