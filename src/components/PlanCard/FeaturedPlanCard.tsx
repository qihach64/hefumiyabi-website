"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Star, Check, Sparkles, RotateCcw, Award, MapPin, Users } from "lucide-react";
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

interface FeaturedPlanCardProps {
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
  themeColor?: string;
}

export default function FeaturedPlanCard({
  plan,
  themeColor = '#FF7A9A',
}: FeaturedPlanCardProps) {
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

  const cartItem = items.find(item => item.planId === plan.id);
  const isInCart = !!cartItem;

  const tryOnResult = mounted ? getTryOnResult(plan.id) : null;
  const hasTryOn = !!tryOnResult;

  const planDetailHref = useMemo(() => {
    const params = new URLSearchParams();
    const date = searchParams.get('date');
    if (date) params.set('date', date);
    const guests = searchParams.get('guests');
    if (guests) params.set('guests', guests);
    const queryString = params.toString();
    return queryString ? `/plans/${plan.id}?${queryString}` : `/plans/${plan.id}`;
  }, [plan.id, searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const discountAmount = plan.originalPrice && plan.originalPrice > plan.price
    ? plan.originalPrice - plan.price
    : 0;

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

  const handleTryOn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTryOnModal(true);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeTryOnResult(plan.id);
    setShowTryOnModal(true);
  };

  return (
    <>
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
        target="_blank"
        className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-sakura-lg transition-all duration-500 border border-gray-100 hover:border-sakura-200/50 h-full relative"
      >
        <div className="flex flex-col h-full">
          {/* 图片容器 - 3:4 比例 */}
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 flex-shrink-0">
            {hasTryOn && tryOnResult ? (
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
              <>
                {plan.imageUrl ? (
                  <Image
                    src={plan.imageUrl}
                    alt={plan.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-sakura-50">
                    <span className="text-8xl opacity-20">👘</span>
                  </div>
                )}
              </>
            )}

            {/* 精选标签 - Sakura 品牌色（品牌元素用 sakura） */}
            <div className="absolute top-4 left-4 z-10">
              <div className="px-3 py-1.5 rounded-full bg-sakura-600 flex items-center gap-1.5 shadow-sm">
                <Award className="w-4 h-4 text-white" />
                <span className="text-[13px] font-semibold text-white">
                  精选推荐
                </span>
              </div>
            </div>

            {/* 试穿按钮 - Glass Button */}
            {!hasTryOn && (
              <button
                onClick={handleTryOn}
                className="absolute top-4 right-4 p-2.5 rounded-full glass-button text-gray-700 hover:text-sakura-600 z-10"
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
                className="absolute top-4 right-4 p-2.5 rounded-full glass-button hover:text-sakura-600 z-10"
                aria-label="重新试穿"
                title="点击重新试穿"
              >
                <RotateCcw className="w-5 h-5 text-sakura-600" />
              </button>
            )}

            {/* 购物车按钮 - Glass Button */}
            <button
              onClick={handleToggleCart}
              disabled={isAdding}
              className={`absolute bottom-4 right-4 p-3 rounded-full transition-all glass-button ${
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
                <Check className="w-6 h-6" />
              ) : (
                <ShoppingCart
                  className={`w-6 h-6 ${isInCart ? 'fill-current' : ''}`}
                />
              )}
            </button>

          </div>

          {/* 信息区域 - 重新排版，均匀留白 */}
          <div className="p-5 md:p-6 flex-1 flex flex-col bg-white/50 backdrop-blur-sm relative z-20">
            {/* 装饰性背景光晕 */}
             <div 
                className="absolute top-0 right-0 w-32 h-32 bg-sakura-100/30 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10 pointer-events-none"
             />

            {/* 第一区块：商家 + 地区 + 套餐名称 */}
            <div className="mb-4">
              {/* 商家名称 + 地区 */}
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                {plan.merchantName && (
                  <>
                    <span className="font-bold tracking-wide uppercase">
                      {plan.merchantName}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-gray-300" />
                  </>
                )}
                {plan.region && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" style={{ color: themeColor }} />
                    <span>{plan.region}</span>
                  </div>
                )}
              </div>

              {/* 套餐名称 */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-sakura-600 transition-colors duration-300">
                {plan.name}
              </h3>
            </div>

            {/* 第二区块：描述（弹性填充） */}
            {plan.description && (
              <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4">
                {plan.description}
              </p>
            )}

            {/* 第三区块：包含（带分割线） */}
            {plan.includes && plan.includes.length > 0 && (
              <div className="mb-5">
                {/* 分隔线 - 主题色渐变 */}
                <div
                  className="h-px mb-4 transition-all duration-500 ease-out group-hover:w-20"
                  style={{
                    width: '40px',
                    background: `linear-gradient(to right, ${themeColor}50, transparent)`,
                  }}
                />
                <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">
                  包含
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.includes.map((item, index) => (
                    <span
                      key={index}
                      className="text-xs px-2.5 py-1 rounded-md text-gray-600 font-medium bg-white/80 transition-colors duration-300"
                      style={{
                        border: `1px solid ${themeColor}30`,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 第四区块：标签（带分割线） */}
            {plan.planTags && plan.planTags.length > 0 && (
              <div className="mb-5">
                {/* 分隔线 - 主题色渐变 */}
                <div
                  className="h-px mb-4 transition-all duration-500 ease-out group-hover:w-20"
                  style={{
                    width: '40px',
                    background: `linear-gradient(to right, ${themeColor}50, transparent)`,
                  }}
                />
                <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">
                  标签
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.planTags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-1 rounded-md text-gray-600 font-medium bg-white/80 transition-colors duration-300"
                      style={{
                        border: `1px solid ${themeColor}30`,
                      }}
                    >
                      {tag.icon && <span className="mr-0.5">{tag.icon}</span>}
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 第五区块：价格 */}
            <div className="mt-auto pt-4 border-t border-gray-100/50">
              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <span className="text-3xl md:text-4xl font-bold text-gray-900 whitespace-nowrap">
                  ¥{(plan.price / 100).toLocaleString()}<span className="text-sm font-normal text-gray-500">/人</span>
                </span>
                {plan.originalPrice && plan.originalPrice > 0 && plan.originalPrice > plan.price && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-base text-gray-400 line-through">
                      ¥{(plan.originalPrice / 100).toLocaleString()}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100"
                    >
                      省¥{((plan.originalPrice - plan.price) / 100).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
