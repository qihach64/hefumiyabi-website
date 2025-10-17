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

      {/* 套餐网格 - 优化布局 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
        const savings = (plan.originalPrice - plan.campaignPrice) / 100;

        return (
          <div
            key={plan.id}
            className="group relative overflow-hidden rounded-xl border-2 bg-card hover:border-primary/50 hover:shadow-2xl transition-all duration-300"
          >
            {/* 超大折扣标签 - 左上角 */}
            <div className="absolute top-0 left-0 z-10">
              <div className="bg-gradient-to-br from-accent to-primary text-accent-foreground px-6 py-3 rounded-br-2xl shadow-lg">
                <div className="text-2xl font-black leading-none">-{discountPercent}%</div>
                <div className="text-xs font-medium mt-0.5">限时特惠</div>
              </div>
            </div>

            {/* 图片区域 */}
            {plan.images.length > 0 ? (
              <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                <Image
                  src={plan.images[0]}
                  alt={plan.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* 图片上的价格叠加 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="text-white">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-black">
                        ¥{(plan.campaignPrice / 100).toLocaleString()}
                      </span>
                      <span className="text-lg line-through opacity-70">
                        ¥{(plan.originalPrice / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-accent">
                      立省 ¥{savings.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative aspect-[4/5] overflow-hidden bg-secondary flex items-center justify-center">
                <span className="text-6xl">👘</span>
              </div>
            )}

            {/* 内容区域 - 简化信息 */}
            <div className="p-4">
              {/* 标题 */}
              <h3 className="text-base font-bold mb-3 line-clamp-2 leading-tight">
                {plan.name}
              </h3>

              {/* 关键服务点 - 精简显示 */}
              <div className="mb-4 space-y-1.5">
                {plan.includes.slice(0, 2).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
                {plan.includes.length > 2 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-3.5 h-3.5 text-center">+</span>
                    <span>含 {plan.includes.length - 2} 项其他服务</span>
                  </div>
                )}
              </div>

              {/* 适用店铺 - 简化 */}
              {plan.applicableStores.length > 0 && (
                <div className="mb-3 flex items-center gap-1.5 text-xs bg-secondary/50 px-2 py-1.5 rounded-md">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">
                    {plan.applicableStores[0]}
                    {plan.applicableStores.length > 1 && ` 等${plan.applicableStores.length}店`}
                  </span>
                </div>
              )}

              {/* 按钮 - 淡雅风格 */}
              <div className="flex flex-col gap-2">
                {/* 主CTA：立即预约 - 超大按钮 */}
                <button
                  onClick={() => handleQuickBook(plan)}
                  disabled={addingToCart === plan.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-base font-bold transition-all bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl h-12 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart === plan.id ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>处理中...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>立即预约</span>
                    </>
                  )}
                </button>

                {/* 次要CTA：加入购物车 */}
                <button
                  onClick={() => handleAddToCart(plan)}
                  disabled={addingToCart === plan.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all border-2 border-input hover:border-primary hover:bg-primary/5 h-10 px-4 disabled:opacity-50"
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
