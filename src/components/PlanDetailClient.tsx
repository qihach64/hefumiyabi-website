"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Star, ChevronRight, Clock, MapPin } from "lucide-react";
import BookingCard from "@/components/BookingCard";
import MiniBookingBar from "@/components/MiniBookingBar";
import VisualHub from "@/components/plan/VisualHub";
import ServiceMap from "@/components/plan/ServiceMap";
import UpgradeServices from "@/components/plan/UpgradeServices";
import SocialProof from "@/components/plan/SocialProof";
import JourneyTimeline from "@/components/plan/JourneyTimeline";
import { useSearchBar } from "@/contexts/SearchBarContext";
import type { MapData } from "@/components/plan/InteractiveKimonoMap/types";

// 升级服务类型
export interface SelectedUpgrade {
  id: string;
  name: string;
  price: number;
  icon: string;
}

interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
}

interface Theme {
  id: string;
  slug: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  duration: number;
  depositAmount: number;
  description?: string | null;
  includes: string[];
  imageUrl?: string | null;
  region?: string | null;
  isCampaign?: boolean;
  availableUntil?: Date | null;
  campaign?: Campaign | null;
  theme?: Theme | null;
}

interface PlanDetailClientProps {
  plan: Plan;
  mapData?: MapData | null;
}

export default function PlanDetailClient({ plan, mapData }: PlanDetailClientProps) {
  const [mounted, setMounted] = useState(false);
  const [isInFullWidthSection, setIsInFullWidthSection] = useState(true);
  const [selectedUpgrades, setSelectedUpgrades] = useState<SelectedUpgrade[]>([]);
  const { setHideSearchBar } = useSearchBar();

  const bookingCardRef = useRef<HTMLDivElement>(null);

  // 升级服务操作回调
  const handleAddUpgrade = useCallback((upgrade: SelectedUpgrade) => {
    setSelectedUpgrades(prev => {
      if (prev.some(u => u.id === upgrade.id)) return prev;
      return [...prev, upgrade];
    });
  }, []);

  const handleRemoveUpgrade = useCallback((upgradeId: string) => {
    setSelectedUpgrades(prev => prev.filter(u => u.id !== upgradeId));
  }, []);

  // 滚动到预订卡片（带高亮动画）
  const scrollToBookingWithHighlight = useCallback(() => {
    if (bookingCardRef.current) {
      bookingCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // 添加高亮动画类
      bookingCardRef.current.classList.add("ring-2", "ring-sakura-400", "ring-offset-2");
      setTimeout(() => {
        bookingCardRef.current?.classList.remove("ring-2", "ring-sakura-400", "ring-offset-2");
      }, 2000);
    }
  }, []);

  // 隐藏 Header 搜索栏
  useEffect(() => {
    setHideSearchBar(true);
    return () => setHideSearchBar(false);
  }, [setHideSearchBar]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Intersection Observer: 检测 BookingCard 是否进入视口
  // 当 BookingCard 可见时隐藏 MiniBookingBar
  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当 BookingCard 进入视口时，隐藏 MiniBookingBar
          setIsInFullWidthSection(!entry.isIntersecting);
        });
      },
      {
        // 当 BookingCard 顶部距离视口顶部 150px 时触发
        rootMargin: "-150px 0px 0px 0px",
        threshold: 0.1, // 10% 可见时触发
      }
    );

    if (bookingCardRef.current) {
      observer.observe(bookingCardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [mounted]);

  const scrollToBooking = () => {
    if (bookingCardRef.current) {
      bookingCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // 分类标签 - 中英文
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { zh: string; en: string }> = {
      LADIES: { zh: "女士", en: "Ladies" },
      MENS: { zh: "男士", en: "Men's" },
      COUPLE: { zh: "情侣", en: "Couple" },
      FAMILY: { zh: "亲子", en: "Family" },
      GROUP: { zh: "团体", en: "Group" },
      SPECIAL: { zh: "特别", en: "Special" },
    };
    return labels[category] || { zh: "套餐", en: "Plan" };
  };

  const categoryInfo = getCategoryLabel(plan.category);

  return (
    // 米白色纸张质感背景
    <div className="min-h-screen" style={{ backgroundColor: "#FDFCFB" }}>
      {/* 主容器 - 增加顶部留白 */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 pt-8 md:pt-12 pb-16">

        {/* ========================================
            面包屑导航 - 精致斜杠分隔
            结构：首页 / 全部套餐 / 主题名称 / 套餐名称
        ======================================== */}
        <nav className="mb-8 md:mb-10">
          <ol className="flex items-center gap-2 text-[13px]">
            <li>
              <Link
                href="/"
                className="text-[#8B7355] hover:text-sakura-600 transition-colors"
              >
                首页
              </Link>
            </li>
            <li className="text-[#C4B5A5]">/</li>
            <li>
              <Link
                href="/plans"
                className="text-[#8B7355] hover:text-sakura-600 transition-colors"
              >
                全部套餐
              </Link>
            </li>
            {plan.theme && (
              <>
                <li className="text-[#C4B5A5]">/</li>
                <li>
                  <Link
                    href={`/plans?theme=${plan.theme.slug}`}
                    className="text-[#8B7355] hover:text-sakura-600 transition-colors"
                  >
                    {plan.theme.name}
                  </Link>
                </li>
              </>
            )}
            <li className="text-[#C4B5A5]">/</li>
            <li className="text-[#3D3A38] font-medium truncate max-w-[200px]">
              {plan.name}
            </li>
          </ol>
        </nav>

        {/* ========================================
            标题区域 - Japanese Modernism 风格
        ======================================== */}
        <header className="mb-10 md:mb-12">
          {/* 装饰线 + 分类标签 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
              {categoryInfo.en} Plan
            </span>
          </div>

          {/* 主标题 - 衬线体 + 深炭灰 */}
          <h1
            className="text-[28px] md:text-[36px] lg:text-[42px] font-serif tracking-tight leading-tight mb-6"
            style={{ color: "#3D3A38" }}
          >
            {plan.name}
          </h1>

          {/* 元信息行 */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* 评分 - 樱花色星星 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= 4
                        ? "fill-sakura-500 text-sakura-500"
                        : i === 5
                        ? "fill-sakura-300 text-sakura-300"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[15px] font-semibold text-[#3D3A38]">4.8</span>
              <span className="text-[14px] text-[#8B7355]">(128 条评价)</span>
            </div>

            {/* 分隔点 */}
            <span className="w-1 h-1 rounded-full bg-[#C4B5A5]" />

            {/* 时长 */}
            <div className="flex items-center gap-1.5 text-[14px] text-[#5C5854]">
              <Clock className="w-4 h-4 text-[#8B7355]" />
              <span>{plan.duration} 小时体验</span>
            </div>

            {/* 地区 */}
            {plan.region && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#C4B5A5]" />
                <div className="flex items-center gap-1.5 text-[14px] text-[#5C5854]">
                  <MapPin className="w-4 h-4 text-[#8B7355]" />
                  <span>{plan.region}</span>
                </div>
              </>
            )}

            {/* 限时优惠标签 - Glass 风格 */}
            {plan.isCampaign && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#C4B5A5]" />
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium backdrop-blur-sm"
                  style={{
                    background: "rgba(139, 22, 52, 0.08)",
                    color: "#8B1634",
                    border: "1px solid rgba(139, 22, 52, 0.15)",
                  }}
                >
                  限时优惠
                </span>
              </>
            )}
          </div>

          {/* 渐变分割线 */}
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-[#E8E2DC] to-transparent" />
        </header>

        {/* ========================================
            全宽区域：VisualHub + ServiceMap
            使用 space-y-12 (48px) 作为统一垂直节奏
        ======================================== */}
        <div className="space-y-12 mb-12">
          {/* VISUAL HUB */}
          <VisualHub
            plan={{
              id: plan.id,
              name: plan.name,
              price: plan.price,
              originalPrice: plan.originalPrice ?? undefined,
              imageUrl: plan.imageUrl ?? undefined,
              isCampaign: plan.isCampaign,
            }}
          />

          {/* 套餐简介 - 更大留白 */}
          {plan.description && (
            <section className="py-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
                <span className="text-[11px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
                  About This Plan
                </span>
              </div>
              <p
                className="text-[16px] leading-[1.9] whitespace-pre-line max-w-3xl"
                style={{ color: "#5C5854" }}
              >
                {plan.description}
              </p>
            </section>
          )}

          {/* SERVICE MAP - 只展示包含项 */}
          <ServiceMap
            includes={plan.includes}
            mapData={mapData}
          />

          {/* 活动信息 - 更精致的设计 */}
          {plan.campaign && (
            <section
              className="rounded-2xl p-6 md:p-8"
              style={{
                background: "linear-gradient(135deg, rgba(255, 251, 235, 0.8) 0%, rgba(254, 243, 199, 0.6) 100%)",
                border: "1px solid rgba(217, 119, 6, 0.15)",
              }}
            >
              <div className="flex items-start gap-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    boxShadow: "0 4px 12px rgba(217, 119, 6, 0.25)",
                  }}
                >
                  <span className="text-2xl">🎊</span>
                </div>
                <div className="flex-1">
                  <h3
                    className="text-[18px] font-serif tracking-wide mb-2"
                    style={{ color: "#78350F" }}
                  >
                    {plan.campaign.title}
                  </h3>
                  <p
                    className="text-[15px] leading-relaxed"
                    style={{ color: "#92400E" }}
                  >
                    {plan.campaign.description}
                  </p>
                  {plan.availableUntil && (
                    <p
                      className="text-[13px] mt-3 font-medium"
                      style={{ color: "#B45309" }}
                    >
                      活动截止：{new Date(plan.availableUntil).toLocaleDateString('zh-CN')}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ========================================
            两栏区域：Upgrades + Journey + Reviews | BookingCard
        ======================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* 左侧主内容区 */}
          <div className="lg:col-span-2 space-y-12">
            {/* 升级服务 - 独立区块，与 BookingCard 同视野 */}
            <UpgradeServices
              selectedUpgrades={selectedUpgrades}
              onAddUpgrade={handleAddUpgrade}
              onRemoveUpgrade={handleRemoveUpgrade}
            />

            <JourneyTimeline duration={plan.duration} />
            <SocialProof />
          </div>

          {/* 右侧预订卡片 */}
          <div ref={bookingCardRef} className="lg:col-span-1 transition-all duration-300 rounded-2xl">
            <div className="lg:sticky lg:top-24">
              <BookingCard
                plan={{
                  id: plan.id,
                  name: plan.name,
                  price: plan.price,
                  originalPrice: plan.originalPrice ?? undefined,
                  duration: plan.duration,
                  depositAmount: plan.depositAmount,
                  isCampaign: plan.isCampaign,
                  imageUrl: plan.imageUrl ?? undefined,
                }}
                selectedUpgrades={selectedUpgrades}
                onRemoveUpgrade={handleRemoveUpgrade}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MiniBookingBar */}
      <MiniBookingBar
        plan={{
          id: plan.id,
          name: plan.name,
          price: plan.price,
          originalPrice: plan.originalPrice ?? undefined,
          isCampaign: plan.isCampaign,
        }}
        visible={isInFullWidthSection}
        onScrollToBooking={scrollToBooking}
      />
    </div>
  );
}
