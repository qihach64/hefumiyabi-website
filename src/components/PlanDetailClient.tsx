"use client";

import { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui";
import BookingCard from "@/components/BookingCard";
import MiniBookingBar from "@/components/MiniBookingBar";
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
  // 追踪是否在全宽区域（显示 MiniBookingBar）
  const [isInFullWidthSection, setIsInFullWidthSection] = useState(true);

  // 两栏区域的 ref，用于 Intersection Observer
  const twoColumnSectionRef = useRef<HTMLDivElement>(null);
  // BookingCard 区域的 ref，用于滚动定位
  const bookingCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Intersection Observer: 检测两栏区域是否进入视口
  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当两栏区域进入视口时，隐藏 MiniBookingBar
          // 当两栏区域离开视口时，显示 MiniBookingBar
          setIsInFullWidthSection(!entry.isIntersecting);
        });
      },
      {
        // 当两栏区域顶部接近视口顶部时触发
        rootMargin: "-100px 0px 0px 0px",
        threshold: 0,
      }
    );

    if (twoColumnSectionRef.current) {
      observer.observe(twoColumnSectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [mounted]);

  // 滚动到 BookingCard 区域
  const scrollToBooking = () => {
    if (bookingCardRef.current) {
      bookingCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
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
            全宽区域：VisualHub + ServiceMap
            这部分独立于 Grid，可以全宽展示
        ======================================== */}
        <div className="space-y-10 mb-10">
          {/* VISUAL HUB - 全宽视觉中心 */}
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

          {/* SERVICE MAP - 全宽配件热点图 + 升级选项 */}
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
        </div>

        {/* ========================================
            两栏区域：Journey + Reviews + BookingCard
            BookingCard 在这里 sticky 显示
        ======================================== */}
        <div
          ref={twoColumnSectionRef}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {/* 左侧主内容区 - 占 2/3 */}
          <div className="lg:col-span-2 space-y-10">
            {/* JOURNEY + FAQ - 体验旅程 */}
            <JourneyTimeline duration={plan.duration} />

            {/* SOCIAL PROOF - 评价系统 */}
            <SocialProof />
          </div>

          {/* 右侧预订卡片 - Sticky 定位 */}
          <div ref={bookingCardRef} className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <BookingCard plan={plan} />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          MiniBookingBar - 全宽区域时显示
          使用 Intersection Observer 智能切换
      ======================================== */}
      <MiniBookingBar
        plan={plan}
        visible={isInFullWidthSection}
        onScrollToBooking={scrollToBooking}
      />
    </div>
  );
}
