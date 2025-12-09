"use client";

import { useState, useEffect } from "react";
import { Star, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui";
import BookingCard from "@/components/BookingCard";
import VisualHub from "@/components/plan/VisualHub";
import ServiceMap from "@/components/plan/ServiceMap";
import SocialProof from "@/components/plan/SocialProof";
import JourneyTimeline from "@/components/plan/JourneyTimeline";
import type { MapData } from "@/components/plan/InteractiveKimonoMap/types";

interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  duration: number;
  depositAmount: number;
  description?: string;
  includes: string[];
  imageUrl?: string;
  region?: string;
  isCampaign?: boolean;
  availableUntil?: Date;
  campaign?: Campaign;
}

interface PlanDetailClientProps {
  plan: Plan;
  mapData?: MapData | null;
}

export default function PlanDetailClient({ plan, mapData }: PlanDetailClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="bg-white min-h-screen">
      {/* 主容器 */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 pt-6 pb-12">

        {/* ========================================
            标题区域 - 紧凑布局
        ======================================== */}
        <div className="mb-6">
          <h1 className="text-[24px] md:text-[28px] font-semibold text-gray-900 mb-2 leading-tight">
            {plan.name}
          </h1>

          <div className="flex items-center gap-2 flex-wrap text-[14px]">
            {/* 评分 */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
              <span className="font-semibold">4.8</span>
              <span className="text-gray-500">(128)</span>
            </div>

            <span className="text-gray-300">·</span>

            {/* 分类 + 时长 */}
            <span className="text-gray-600">
              {getCategoryLabel(plan.category)} · {plan.duration}小时
            </span>

            {/* 地区 */}
            {plan.region && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-900 font-medium">{plan.region}</span>
              </>
            )}

            {/* 限时优惠标签 */}
            {plan.isCampaign && (
              <>
                <span className="text-gray-300">·</span>
                <Badge variant="error" size="sm">限时优惠</Badge>
              </>
            )}
          </div>
        </div>

        {/* ========================================
            VISUAL HUB - 统一视觉中心
        ======================================== */}
        <div className="mb-10">
          <VisualHub
            plan={{
              id: plan.id,
              name: plan.name,
              price: plan.price,
              originalPrice: plan.originalPrice,
              imageUrl: plan.imageUrl,
              isCampaign: plan.isCampaign,
            }}
          />
        </div>

        {/* ========================================
            两栏布局：主内容 + 预订卡片
        ======================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* 左侧主内容区 - 占 2/3 */}
          <div className="lg:col-span-2 space-y-10">

            {/* 套餐简介 */}
            {plan.description && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-px bg-sakura-300" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-sakura-500 font-medium">
                    About This Plan
                  </span>
                </div>
                <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                  {plan.description}
                </p>
              </div>
            )}

            {/* SERVICE MAP - 包含项 + 和服配件图 + 升级选项 */}
            <ServiceMap
              includes={plan.includes}
              mapData={mapData}
            />

            {/* 活动信息 */}
            {plan.campaign && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🎊</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-amber-900 mb-1">
                      {plan.campaign.title}
                    </h3>
                    <p className="text-[14px] text-amber-800 leading-relaxed">
                      {plan.campaign.description}
                    </p>
                    {plan.availableUntil && (
                      <p className="text-[13px] text-amber-700 mt-2 font-medium">
                        活动截止：{new Date(plan.availableUntil).toLocaleDateString('zh-CN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* JOURNEY + FAQ - 体验旅程 */}
            <JourneyTimeline duration={plan.duration} />

            {/* SOCIAL PROOF - 评价系统 */}
            <SocialProof />

          </div>

          {/* ========================================
              右侧预订卡片 - Sticky 定位
          ======================================== */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <BookingCard plan={plan} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
