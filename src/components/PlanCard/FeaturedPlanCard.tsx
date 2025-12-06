"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Star, Check, Sparkles, RotateCcw, Award, Clock, MapPin, Users } from "lucide-react";
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
        className="group block bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-sakura-200 h-full"
      >
        <div className="flex flex-col h-full">
          {/* 图片容器 - 3:4 比例，不随父容器高度拉伸，保持优雅比例 */}
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

            {/* 精选标签 - 更突出 */}
            <div className="absolute top-4 left-4 z-10">
              <div
                className="px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
                }}
              >
                <Award className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">精选推荐</span>
              </div>
            </div>

            {/* 试穿按钮 */}
            {!hasTryOn && (
              <button
                onClick={handleTryOn}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-lg hover:scale-110 transition-all z-10"
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
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-lg hover:scale-110 transition-all z-10"
                aria-label="重新试穿"
                title="点击重新试穿"
              >
                <RotateCcw className="w-5 h-5 text-sakura-600" />
              </button>
            )}

            {/* 购物车按钮 */}
            <button
              onClick={handleToggleCart}
              disabled={isAdding}
              className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all ${
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
                <Check className="w-6 h-6" />
              ) : (
                <ShoppingCart
                  className={`w-6 h-6 ${isInCart ? 'fill-current' : ''}`}
                />
              )}
            </button>

            {/* 优惠标签 */}
            {discountAmount > 0 && (
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="error" size="lg" className="shadow-lg font-bold text-base px-3 py-1.5">
                  省¥{(discountAmount / 100).toLocaleString()}
                </Badge>
              </div>
            )}
          </div>

          {/* 信息区域 - 重新排版，均匀留白 */}
          <div className="p-5 md:p-6 flex-1 flex flex-col">
            {/* 第一区块：商家 + 套餐名称 */}
            <div className="mb-4">
              {/* 商家名称 */}
              {plan.merchantName && (
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                    {plan.merchantName}
                  </p>
                  <div className="h-1 w-1 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-400">认证商家</span>
                </div>
              )}

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

            {/* 分隔线 */}
            <div
              className="h-px mb-5 transition-all duration-500 ease-out group-hover:w-20"
              style={{
                width: '40px',
                backgroundColor: `${themeColor}40`,
              }}
            />

            {/* 第三区块：包含服务（放在价格上方） */}
            {plan.includes && plan.includes.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">
                  包含服务
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.includes.map((item, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded-md text-gray-600 font-medium"
                      style={{
                        backgroundColor: `${themeColor}08`,
                        border: `1px solid ${themeColor}20`,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 第四区块：价格 + 地区 */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              {/* 价格行 */}
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  ¥{(plan.price / 100).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">/人</span>
                {plan.originalPrice && plan.originalPrice > 0 && plan.originalPrice > plan.price && (
                  <>
                    <span className="text-base text-gray-400 line-through ml-3">
                      ¥{(plan.originalPrice / 100).toLocaleString()}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded ml-2"
                      style={{
                        backgroundColor: `${themeColor}15`,
                        color: themeColor,
                      }}
                    >
                      省¥{((plan.originalPrice - plan.price) / 100).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* 地区 + 标签行 */}
              <div className="flex items-center flex-wrap gap-3">
                {/* 地区 */}
                {plan.region && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" style={{ color: themeColor }} />
                    <span>{plan.region}</span>
                  </div>
                )}

                {/* 时长 */}
                {plan.duration && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" style={{ color: themeColor }} />
                    <span>{plan.duration}小时</span>
                  </div>
                )}

                {/* 标签（精简显示） */}
                {plan.planTags && plan.planTags.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    {plan.planTags.slice(0, 3).map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded text-gray-500 bg-gray-50"
                      >
                        {tag.icon && <span className="mr-0.5">{tag.icon}</span>}
                        {tag.name}
                      </span>
                    ))}
                    {plan.planTags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{plan.planTags.length - 3}
                      </span>
                    )}
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
