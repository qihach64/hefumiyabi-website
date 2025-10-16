"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart, Zap, Sparkles, MapPin, Store as StoreIcon, Tag } from "lucide-react";
import StoreFilter from "@/components/StoreFilter";
import { useCartStore } from "@/store/cart";

interface Store {
  id: string;
  name: string;
  slug: string;
}

interface RentalPlan {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  price: number;
  originalPrice?: number; // 原价（线下价格）
  category: string;
  duration: number;
  includes: string[];
  imageUrl?: string;
  storeName?: string; // 店铺名称
  region?: string; // 地区
  tags?: string[]; // 标签
}

interface PlansClientProps {
  anniversaryPlans: RentalPlan[];
  regularPlans: RentalPlan[];
  stores: Store[];
}

export default function PlansClient({
  anniversaryPlans,
  regularPlans,
  stores,
}: PlansClientProps) {
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { addItem } = useCartStore();

  // 分类标签映射
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      LADIES: "女士套餐",
      MENS: "男士套餐",
      COUPLE: "情侣套餐",
      FAMILY: "亲子套餐",
      GROUP: "团体套餐",
      SPECIAL: "特别套餐",
    };
    return labels[category] || "套餐";
  };

  // 加入购物车函数
  const handleAddToCart = (plan: RentalPlan) => {
    setAddingToCart(plan.id);

    addItem({
      type: "PLAN",
      planId: plan.id,
      name: plan.name,
      price: plan.price,
      addOns: [],
      image: plan.imageUrl,
      storeId: undefined,
      storeName: undefined,
    });

    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  // 立即预约函数
  const handleQuickBook = (plan: RentalPlan) => {
    setAddingToCart(plan.id);

    addItem({
      type: "PLAN",
      planId: plan.id,
      name: plan.name,
      price: plan.price,
      addOns: [],
      image: plan.imageUrl,
      storeId: undefined,
      storeName: undefined,
    });

    setTimeout(() => {
      setAddingToCart(null);
      router.push("/booking");
    }, 500);
  };

  // 套餐卡片组件
  const PlanCard = ({ plan }: { plan: RentalPlan }) => {
    // 计算优惠幅度
    const discountPercent = plan.originalPrice && plan.originalPrice > plan.price
      ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
      : 0;

    return (
    <div className="relative overflow-hidden rounded-lg border bg-card hover:shadow-xl transition-all duration-300 group">
      {/* 优惠标签 */}
      {discountPercent > 0 && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            省¥{((plan.originalPrice! - plan.price) / 100).toFixed(0)}
          </div>
          {discountPercent >= 30 && (
            <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              限时{discountPercent}% OFF
            </div>
          )}
        </div>
      )}

      {/* 图片区域 */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        {plan.imageUrl ? (
          <Image
            src={plan.imageUrl}
            alt={plan.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <span className="text-6xl opacity-20">👘</span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        <div className="mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {getCategoryLabel(plan.category)}
          </span>
          <h3 className="text-lg font-bold mt-2 mb-1 line-clamp-2">
            {plan.name}
          </h3>
          {plan.nameEn && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {plan.nameEn}
            </p>
          )}
        </div>

        <div className="mb-4">
          {/* 价格对比 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                ¥{(plan.price / 100).toLocaleString()}
              </span>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <span className="text-sm text-muted-foreground line-through">
                  ¥{(plan.originalPrice / 100).toLocaleString()}
                </span>
              )}
            </div>
            {/* 线上预约标签 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-semibold">
                💰 线上预约优惠价
              </span>
              {discountPercent > 0 && (
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                  立省{discountPercent}%
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {plan.duration} 小时
          </p>
        </div>

        {plan.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
            {plan.description}
          </p>
        )}

        {/* 标签区域：地区、店铺、特色标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* 地区标签 */}
          {plan.region && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3 text-blue-600" />
              <span>{plan.region}</span>
            </div>
          )}
          
          {/* 店铺标签 */}
          {plan.storeName && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <StoreIcon className="w-3 h-3 text-green-600" />
              <span>{plan.storeName}</span>
            </div>
          )}
          
          {/* 特色标签 */}
          {plan.tags && plan.tags.slice(0, 2).map((tag, index) => (
            <div key={index} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <Tag className="w-3 h-3 text-amber-600" />
              <span>{tag}</span>
            </div>
          ))}
        </div>

        {plan.includes && plan.includes.length > 0 && (
          <div className="space-y-1 mb-4">
            {plan.includes.slice(0, 3).map((feature: string, index: number) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                <span className="line-clamp-1">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* 按钮 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleQuickBook(plan)}
            disabled={addingToCart === plan.id}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-50"
          >
            {addingToCart === plan.id ? (
              <>
                <Check className="w-4 h-4" />
                <span>处理中...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>立即预约</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleAddToCart(plan)}
            disabled={addingToCart === plan.id}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 disabled:opacity-50"
          >
            {addingToCart === plan.id ? (
              <>
                <Check className="w-4 h-4" />
                <span>已加入</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>加入购物车</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <>
      {/* 精简的头部区域 */}
      <section className="bg-background border-b">
        <div className="container py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* 标题 */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">租赁套餐</h1>
              <p className="text-sm text-muted-foreground mt-1">
                在线预订享受专属优惠价格
              </p>
            </div>

            {/* 店铺筛选器 */}
            <div className="flex justify-start md:justify-end">
              <StoreFilter
                stores={stores}
                selectedStoreId={selectedStoreId}
                onStoreChange={setSelectedStoreId}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 十周年特别优惠套餐 */}
      {anniversaryPlans.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 relative overflow-hidden">
          {/* 装饰背景 */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmYjkyM2MiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0tNCAyOGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

          <div className="container relative">
            {/* 精简的标题区域 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full mb-3 shadow-lg">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-sm">10周年特惠</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                🎉 最高享50%优惠
              </h2>
            </div>

            {/* 套餐网格 */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {anniversaryPlans.map((plan) => (
                <div key={plan.id} className="relative">
                  {/* 10周年徽章 */}
                  <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                    10周年限定
                  </div>
                  <PlanCard plan={plan} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 常规套餐 */}
      {regularPlans.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container">
            <h2 className="text-xl md:text-2xl font-bold mb-6">更多套餐</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 精简的服务说明 */}
      <section className="py-8 bg-secondary/20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">👘</span>
              <span className="text-muted-foreground">专业着装</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">💇</span>
              <span className="text-muted-foreground">免费发型</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="text-muted-foreground">配件齐全</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">💳</span>
              <span className="text-muted-foreground">在线优惠</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
