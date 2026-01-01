"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import PlanCard from "@/components/PlanCard";

interface RelatedPlan {
  id: string;
  name: string;
  nameEn?: string | null;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  region?: string | null;
  isCampaign?: boolean;
  includes?: string[];
}

interface RelatedPlansProps {
  plans: RelatedPlan[];
  themeName?: string;
  themeSlug?: string;
  themeColor?: string;
}

// 主题色映射
const themeColorMap: Record<string, string> = {
  "trendy-photo": "#F28B82",
  "formal-ceremony": "#B39DDB",
  "together": "#80CBC4",
  "seasonal": "#AED581",
  "casual-stroll": "#90CAF9",
  "specialty": "#FFCC80",
};

export default function RelatedPlans({
  plans,
  themeName,
  themeSlug,
  themeColor,
}: RelatedPlansProps) {
  // 如果没有相关套餐，不显示
  if (!plans || plans.length === 0) {
    return null;
  }

  // 获取主题色
  const accentColor = themeSlug
    ? themeColorMap[themeSlug] || themeColor || "#FF7A9A"
    : "#FF7A9A";

  return (
    <section className="py-12 border-t border-wabi-100">
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-px"
              style={{
                background: `linear-gradient(to right, ${accentColor}, transparent)`,
              }}
            />
            <span className="text-[12px] uppercase tracking-[0.25em] text-gray-500 font-medium">
              You May Also Like
            </span>
          </div>
          <h2 className="text-[22px] font-semibold text-gray-900">
            猜你喜欢
            {themeName && (
              <span className="text-[16px] font-normal text-gray-500 ml-2">
                · {themeName}主题
              </span>
            )}
          </h2>
        </div>

        {/* 查看更多链接 */}
        {themeSlug && (
          <Link
            href={`/plans?theme=${themeSlug}`}
            className="flex items-center gap-1 text-[14px] text-gray-500 hover:text-sakura-600 transition-colors group"
          >
            查看全部
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* 套餐网格 - 移动端横向滚动，桌面端网格 */}
      <div className="relative">
        {/* 移动端横向滚动 */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:hidden -mx-4 px-4">
          {plans.map((plan) => (
            <div key={plan.id} className="flex-shrink-0 w-[200px]">
              <PlanCard
                plan={{
                  id: plan.id,
                  name: plan.name,
                  nameEn: plan.nameEn ?? undefined,
                  price: plan.price,
                  originalPrice: plan.originalPrice ?? undefined,
                  imageUrl: plan.imageUrl ?? undefined,
                  region: plan.region ?? undefined,
                  isCampaign: plan.isCampaign,
                  includes: plan.includes,
                }}
                variant="interactive"
                aspectRatio="square"
                themeSlug={themeSlug}
                themeColor={accentColor}
              />
            </div>
          ))}
        </div>

        {/* 桌面端网格 */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {plans.slice(0, 4).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={{
                id: plan.id,
                name: plan.name,
                nameEn: plan.nameEn ?? undefined,
                price: plan.price,
                originalPrice: plan.originalPrice ?? undefined,
                imageUrl: plan.imageUrl ?? undefined,
                region: plan.region ?? undefined,
                isCampaign: plan.isCampaign,
                includes: plan.includes,
              }}
              variant="interactive"
              aspectRatio="square"
              themeSlug={themeSlug}
              themeColor={accentColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
