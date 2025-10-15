"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Clock, MapPin, Users } from "lucide-react";
import StoreFilter from "@/components/StoreFilter";

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
}

interface PlansClientProps {
  featuredPlans: Plan[];
  stores: Store[];
}

export default function PlansClient({ featuredPlans, stores }: PlansClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // 根据选中的店铺筛选套餐
  // TODO: 需要在数据库模型中添加套餐和店铺的关联关系
  const filteredPlans = featuredPlans; // 暂时显示所有

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

                    <Link
                      href={`/booking?planId=${plan.id}`}
                      className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                    >
                      选择此套餐
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
