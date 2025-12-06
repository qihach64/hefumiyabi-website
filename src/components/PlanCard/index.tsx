"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Star, Check, Sparkles, RotateCcw, MapPin } from "lucide-react";
import { Badge } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { useTryOnStore } from "@/store/tryOn";
import TryOnModal from "@/components/TryOnModal";
import ImageComparison from "@/components/ImageComparison";

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
  glass: 'bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-lg transition-all duration-500',
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
  hideCampaignBadge?: boolean;
  hideDiscountBadge?: boolean;
  // 主题感知
  themeSlug?: string;
  themeColor?: string;
}

export default function PlanCard({
  plan,
  variant = 'default',
  showMerchant = false,
  isRecommended = false,
  hideCampaignBadge = false,
  hideDiscountBadge = false,
  themeSlug,
  themeColor = '#FF7A9A', // 默认樱花色
}: PlanCardProps) {
  // 使用主题色作为点缀色
  const accentColor = themeColor;
  const [isAdding, setIsAdding] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const [lastAction, setLastAction] = useState<'add' | 'remove' | null>(null);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const searchParams = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const items = useCartStore((state) => state.items);

  const getTryOnResult = useTryOnStore((state) => state.getTryOnResult);
  const removeTryOnResult = useTryOnStore((state) => state.removeTryOnResult);

  // 检查是否已在购物车中
  const cartItem = items.find(item => item.planId === plan.id);
  const isInCart = !!cartItem;

  // 检查是否有试穿记录（只在客户端挂载后读取）
  const tryOnResult = mounted ? getTryOnResult(plan.id) : null;
  const hasTryOn = !!tryOnResult;

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

  // 客户端挂载标记
  useEffect(() => {
    setMounted(true);
  }, []);

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
        // 如果有试穿记录，携带试穿照片
        tryOnPhoto: tryOnResult ? {
          originalPhoto: tryOnResult.originalPhoto,
          resultPhoto: tryOnResult.resultPhoto,
          timestamp: new Date(tryOnResult.timestamp),
          planImageUrl: tryOnResult.planImageUrl,
        } : undefined,
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

  // 打开试穿弹窗
  const handleTryOn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTryOnModal(true);
  };

  // 重新试穿
  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeTryOnResult(plan.id);
    setShowTryOnModal(true);
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
    <>
      {/* 试穿弹窗 */}
      <TryOnModal
        isOpen={showTryOnModal}
        onClose={() => setShowTryOnModal(false)}
        plan={{
          id: plan.id,
          name: plan.name,
          price: plan.price,
          originalPrice: plan.originalPrice,
          imageUrl: plan.imageUrl,
          isCampaign: plan.isCampaign,
        }}
      />

      <Link
        href={planDetailHref}
        className={`group block ${cardVariantStyles[variant]}`}
      >
        <div className={`relative ${variant !== 'default' && variant !== 'interactive' ? 'p-3' : ''}`}>
          {/* 图片容器 - 1:1 正方形，紧凑布局 */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {hasTryOn && tryOnResult ? (
              /* 已试穿：显示对比图 - 淡入效果 */
              <div
                className="absolute inset-0 animate-in fade-in duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <ImageComparison
                  beforeImage={plan.imageUrl || ''}
                  afterImage={tryOnResult.resultPhoto}
                  beforeLabel="套餐原图"
                  afterLabel="试穿效果"
                />
              </div>
            ) : (
              /* 未试穿：显示套餐图片 */
              <>
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
              </>
            )}

            {/* 试穿按钮 - 右上角，与购物车对齐 */}
            {!hasTryOn && (
              <button
                onClick={handleTryOn}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md hover:scale-110 transition-all z-10"
                aria-label="AI试穿"
                title="点击试穿看看"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            )}

            {/* 已试穿状态：重新试穿按钮 */}
            {hasTryOn && (
              <button
                onClick={handleRetry}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md hover:scale-110 transition-all z-10"
                aria-label="重新试穿"
                title="点击重新试穿"
              >
                <RotateCcw className="w-5 h-5 text-sakura-600" />
              </button>
            )}

            {/* 购物车按钮 - 右下角 */}
            <button
              onClick={handleToggleCart}
              disabled={isAdding}
              className={`absolute bottom-3 right-3 p-2 rounded-full shadow-md transition-all ${
                justChanged
                  ? lastAction === 'add'
                    ? 'bg-green-500 text-white scale-110'
                    : 'bg-gray-400 text-white scale-110'
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


            {/* 底部标签组 */}
            {(isRecommended || (plan.isCampaign && !hideCampaignBadge)) && (
              <div className="absolute bottom-3 left-3 flex flex-col gap-2">
                {isRecommended && (
                  <Badge variant="warning" size="sm" className="shadow-md font-semibold">
                    ⭐ 为您推荐
                  </Badge>
                )}
                {plan.isCampaign && !hideCampaignBadge && (
                  <Badge variant="error" size="sm" className="shadow-md">
                    限时优惠
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 信息区域 - 统一风格，padding 稍微减小以适应更紧凑的列表 */}
          <div className={`mt-3 space-y-1 ${variant !== 'default' && variant !== 'interactive' ? 'pb-2' : ''}`}>
            {/* 商家名称 + 地区 */}
            {(showMerchant && plan.merchantName) || plan.region ? (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 truncate">
                {showMerchant && plan.merchantName && (
                  <span className="font-medium tracking-wide">{plan.merchantName}</span>
                )}
                {showMerchant && plan.merchantName && plan.region && (
                  <div className="h-0.5 w-0.5 rounded-full bg-gray-300" />
                )}
                {plan.region && (
                  <div className="flex items-center gap-0.5 text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{plan.region}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* 套餐名称 */}
            <h3 className="font-medium text-[15px] text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors duration-500">
              {plan.name}
            </h3>

            {/* 分隔线 - 主题色 */}
            <div
              className="h-px transition-all duration-500 ease-out group-hover:w-10"
              style={{
                width: '24px',
                backgroundColor: `${accentColor}50`,
              }}
            />

            {/* 价格区域 */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] font-semibold text-gray-900 whitespace-nowrap">
                ¥{(plan.price / 100).toLocaleString()}/人
              </span>
              {plan.originalPrice && plan.originalPrice > 0 && plan.originalPrice > plan.price && (
                <span className="text-[11px] text-gray-400 line-through">
                  ¥{(plan.originalPrice / 100).toLocaleString()}
                </span>
              )}
            </div>

            {/* 包含物 */}
            {plan.includes && plan.includes.length > 0 && (
              <p className="text-[11px] text-gray-500 line-clamp-1">
                含 {plan.includes.slice(0, 2).join(' · ')}
                {plan.includes.length > 2 && ` 等${plan.includes.length}项`}
              </p>
            )}

            {/* 评分 - 暂时移除硬编码评分 */}
            {/* {showMerchant && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <Star
                  className="w-3 h-3"
                  style={{ fill: accentColor, color: accentColor }}
                />
                <span className="font-medium">4.8</span>
                <span className="text-gray-400">(128)</span>
              </div>
            )} */}

            {/* 标签 - 主题色边框 */}
            {plan.planTags && plan.planTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {plan.planTags.slice(0, 3).map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="text-[10px] tracking-wide px-2 py-0.5 text-gray-500 bg-white transition-all duration-300 hover:text-gray-700"
                    style={{
                      border: `1px solid ${accentColor}40`,
                    }}
                  >
                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                    {tag.name}
                  </span>
                ))}
                {plan.planTags.length > 3 && (
                  <span className="text-[10px] tracking-wide px-2 py-0.5 text-gray-400 bg-white border border-gray-200">
                    +{plan.planTags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </>
  );
}
