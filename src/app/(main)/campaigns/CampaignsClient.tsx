"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, MapPin, ShoppingCart, Zap } from "lucide-react";
import { useCartStore } from "@/store/cart";
import StoreFilter from "@/components/StoreFilter";

interface Store {
  id: string;
  name: string;
  slug: string;
}

interface CampaignPlan {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  campaignPrice: number;
  images: string[];
  includes: string[];
  applicableStores: string[];
}

interface CampaignsClientProps {
  campaignPlans: CampaignPlan[];
  stores: Store[];
}

export default function CampaignsClient({ campaignPlans, stores }: CampaignsClientProps) {
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { addItem } = useCartStore();

  // 根据选中的店铺筛选活动套餐
  const filteredPlans = selectedStoreId
    ? campaignPlans.filter((plan) => {
        const selectedStore = stores.find((s) => s.id === selectedStoreId);
        if (!selectedStore) return false;
        if (plan.applicableStores.length === 0) return false;

        // 检查套餐的 applicableStores 是否包含选中的店铺 slug
        return plan.applicableStores.includes(selectedStore.slug);
      })
    : campaignPlans;

  const handleAddToCart = (plan: CampaignPlan) => {
    setAddingToCart(plan.id);

    // 根据套餐的 applicableStores 找到对应的店铺
    let matchingStore: Store | undefined;
    if (plan.applicableStores.length > 0) {
      matchingStore = stores.find((s) =>
        plan.applicableStores.some((storeName) => storeName.includes(s.name))
      );
    }

    addItem({
      type: "CAMPAIGN",
      campaignPlanId: plan.id,
      name: plan.name,
      price: plan.campaignPrice,
      addOns: [],
      image: plan.images[0],
      storeId: matchingStore?.id,
      storeName: matchingStore?.name,
      applicableStores: plan.applicableStores, // 传递可用店铺列表
    });

    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  // 立即预约函数（Amazon模式的"Buy Now"）
  const handleQuickBook = (plan: CampaignPlan) => {
    setAddingToCart(plan.id);

    // 1. 添加当前套餐到购物车（不清空现有内容）
    let matchingStore: Store | undefined;
    if (plan.applicableStores.length > 0) {
      matchingStore = stores.find((s) =>
        plan.applicableStores.some((storeName) => storeName.includes(s.name))
      );
    }

    addItem({
      type: "CAMPAIGN",
      campaignPlanId: plan.id,
      name: plan.name,
      price: plan.campaignPrice,
      addOns: [],
      image: plan.images[0],
      storeId: matchingStore?.id,
      storeName: matchingStore?.name,
      applicableStores: plan.applicableStores, // 传递可用店铺列表
    });

    // 2. 跳转到预约页面
    setTimeout(() => {
      setAddingToCart(null);
      router.push('/booking');
    }, 500);
  };

  return (
    <>
      {/* 店铺筛选器 */}
      <div className="flex justify-center mb-8">
        <StoreFilter
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
        />
      </div>

      {/* 套餐网格 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">
              该店铺暂无适用的优惠套餐
            </p>
          </div>
        ) : (
          filteredPlans.map((plan) => {
        const discountPercent = Math.round(
          ((plan.originalPrice - plan.campaignPrice) /
            plan.originalPrice) *
            100
        );

        return (
          <div
            key={plan.id}
            className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-xl transition-all duration-300"
          >
            {/* 折扣标签 */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg">
                {discountPercent}% OFF
              </div>
            </div>

            {/* 图片区域 */}
            {plan.images.length > 0 ? (
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                <Image
                  src={plan.images[0]}
                  alt={plan.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary flex items-center justify-center">
                <span className="text-6xl">👘</span>
              </div>
            )}

            {/* 内容区域 */}
            <div className="p-6">
              {/* 标题 */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1 line-clamp-2">
                  {plan.name}
                </h3>
              </div>

              {/* 价格 */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-primary">
                    ¥{(plan.campaignPrice / 100).toLocaleString()}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ¥{(plan.originalPrice / 100).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-accent">
                  省 ¥
                  {(
                    (plan.originalPrice - plan.campaignPrice) /
                    100
                  ).toLocaleString()}
                </div>
              </div>

              {/* 描述 */}
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                {plan.description}
              </p>

              {/* 包含服务 */}
              <div className="mb-6 space-y-2">
                {plan.includes.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
                {plan.includes.length > 3 && (
                  <p className="text-sm text-muted-foreground ml-6">
                    +{plan.includes.length - 3} 更多服务
                  </p>
                )}
              </div>

              {/* 适用店铺 */}
              {plan.applicableStores.length > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {plan.applicableStores[0]}
                    {plan.applicableStores.length > 1 && ` +${plan.applicableStores.length - 1}`}
                  </span>
                </div>
              )}

              {/* Amazon模式的按钮布局 */}
              <div className="flex flex-col gap-2">
                {/* 主要操作：立即预约 */}
                <button
                  onClick={() => handleQuickBook(plan)}
                  disabled={addingToCart === plan.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4 disabled:opacity-50"
                  title="添加套餐到购物车并前往预约页面"
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
                
                {/* 次要操作：加入购物车 */}
                <button
                  onClick={() => handleAddToCart(plan)}
                  disabled={addingToCart === plan.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 disabled:opacity-50"
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
      })
        )}
      </div>
    </>
  );
}
