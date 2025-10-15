"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Clock, MapPin, Users, ShoppingCart } from "lucide-react";
import StoreFilter from "@/components/StoreFilter";
import { useCartStore } from "@/store/cart";

interface Store {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  nameEn?: string;
  originalPrice: number;
  image: string;
  description: string;
  features: string[];
  location: string;
  duration: string;
  gender: string;
  price: number;
  isSpecial?: boolean;
  planSlug: string;
  category?: string;
  dbPlan?: any;
}

interface PlansClientProps {
  featuredPlans: Plan[];
  stores: Store[];
}

export default function PlansClient({ featuredPlans, stores }: PlansClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  // 根据选中的店铺筛选套餐
  const filteredPlans = selectedStoreId
    ? featuredPlans.filter((plan) => {
        // 根据店铺名称匹配套餐的 location
        const selectedStore = stores.find((s) => s.id === selectedStoreId);
        if (!selectedStore) return true;

        // 检查套餐的 location 是否包含店铺名称
        return plan.location.includes(selectedStore.name);
      })
    : featuredPlans;

  // Get all database plans
  const dbPlans = featuredPlans
    .map(p => p.dbPlan)
    .filter(p => p !== null && p !== undefined);

  // 加入购物车函数
  const handleAddToCart = (plan: Plan) => {
    setAddingToCart(plan.id);

    // 根据套餐的 location 找到对应的店铺
    const storeName = plan.location;
    const matchingStore = stores.find((s) => storeName.includes(s.name));

    addItem({
      type: "PLAN",
      planId: plan.id,
      name: plan.name,
      price: plan.price,
      addOns: [],
      image: plan.image,
      storeId: matchingStore?.id,
      storeName: matchingStore?.name,
    });

    // 显示动画效果
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  // 为数据库套餐加入购物车
  const handleAddDbPlanToCart = (dbPlan: any) => {
    setAddingToCart(dbPlan.id);

    // 数据库套餐没有 location 信息，设为 undefined，让用户在购物车选择
    addItem({
      type: "PLAN",
      planId: dbPlan.id,
      name: dbPlan.name,
      price: dbPlan.price,
      addOns: [],
      storeId: undefined,
      storeName: undefined,
    });

    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  return (
    <>
      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">租赁套餐</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              精心设计的套餐方案，满足您不同场景的需求。从经济实惠到豪华体验，总有一款适合您。
            </p>

            {/* 店铺筛选器 */}
            <div className="flex justify-center">
              <StoreFilter
                stores={stores}
                selectedStoreId={selectedStoreId}
                onStoreChange={setSelectedStoreId}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 特色套餐展示 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">热门套餐</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              在线预订专享优惠，提前预约锁定心仪套餐
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-xl transition-all duration-300"
              >
                {/* 特别标签 */}
                {plan.isSpecial && (
                  <div className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg">
                    10周年特惠
                  </div>
                )}

                <div className="grid md:grid-cols-5 gap-6">
                  {/* 图片区域 */}
                  <div className="md:col-span-2 relative aspect-[3/4] md:aspect-auto overflow-hidden bg-secondary">
                    <Image
                      src={plan.image}
                      alt={plan.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  </div>

                  {/* 内容区域 */}
                  <div className="md:col-span-3 p-6">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.nameEn}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-primary">
                          ¥{(plan.price / 100).toLocaleString()}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-lg text-muted-foreground line-through">
                            ¥{plan.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {plan.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {plan.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {plan.gender}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(plan)}
                        disabled={addingToCart === plan.id}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-primary text-primary hover:bg-primary/10 h-10 px-4 disabled:opacity-50"
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
                      <Link
                        href={`/booking?planId=${plan.id}`}
                        className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                      >
                        立即预约
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 数据库中的套餐（如果有） */}
      {dbPlans.length > 0 && (
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                更多套餐选择
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                灵活的套餐组合，满足您的个性化需求
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {plan.category === "BASIC"
                        ? "基础套餐"
                        : plan.category === "STANDARD"
                        ? "标准套餐"
                        : plan.category === "PREMIUM"
                        ? "高级套餐"
                        : "豪华套餐"}
                    </span>
                    <h3 className="text-xl font-bold mt-2 mb-1">{plan.name}</h3>
                    {plan.nameEn && (
                      <p className="text-sm text-muted-foreground">
                        {plan.nameEn}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">
                        ¥{plan.price.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/人</span>
                    </div>
                    {plan.duration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.duration}
                      </p>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddDbPlanToCart(plan)}
                      disabled={addingToCart === plan.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-primary text-primary hover:bg-primary/10 h-10 px-4 disabled:opacity-50"
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
                    <Link
                      href={`/booking?planId=${plan.id}`}
                      className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                    >
                      立即预约
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 套餐特色 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">套餐特色</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              所有套餐均包含以下基础服务
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">👘</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">专业着装</h3>
              <p className="text-sm text-muted-foreground">
                专业着装师为您提供完整的和服着装服务
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">💇</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">免费发型</h3>
              <p className="text-sm text-muted-foreground">
                所有套餐均包含免费的发型设计服务
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">配件齐全</h3>
              <p className="text-sm text-muted-foreground">
                包含腰带、足袋、草履等全套配件
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">在线优惠</h3>
              <p className="text-sm text-muted-foreground">
                在线预订享受专属优惠价格
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 常见问题 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">常见问题</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-2">如何选择合适的套餐？</h3>
              <p className="text-sm text-muted-foreground">
                根据您的预算、使用时长和对服务的需求来选择。情侣推荐情侣套餐，团体推荐团体套餐。如需帮助，可联系我们的客服。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-2">在线预订有什么优惠？</h3>
              <p className="text-sm text-muted-foreground">
                在线预订可享受最高40%的优惠折扣，需提前支付定金。建议提前预订以获得更好的价格。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-2">套餐包含哪些服务？</h3>
              <p className="text-sm text-muted-foreground">
                所有套餐都包含和服租赁、专业着装、免费发型设计和全套配件。部分高级套餐还包含摄影服务。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-2">可以延长租赁时间吗？</h3>
              <p className="text-sm text-muted-foreground">
                可以。如需延长租赁时间，请提前告知店员。延长费用会根据套餐类型和延长时长计算。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0tNCAyOGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="container text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备好体验和服之美了吗？
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            选择适合您的套餐，立即预约，开启难忘的和服体验之旅
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-background text-foreground hover:bg-background/90 h-11 px-8"
            >
              立即预约
            </Link>
            <Link
              href="/kimonos"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 h-11 px-8"
            >
              浏览和服
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
