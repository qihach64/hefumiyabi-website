'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Star, Clock, MapPin } from 'lucide-react';
import BookingCard from '@/components/BookingCard';
import { MiniBookingBar } from '@/features/guest/booking';
import VisualHub from '@/components/plan/VisualHub';
import ServiceMap from '@/components/plan/ServiceMap';
import UpgradeServices from '@/components/plan/UpgradeServices';
import SocialProof from '@/components/plan/SocialProof';
import JourneyTimeline from '@/components/plan/JourneyTimeline';
import StoreLocationCard from '@/components/plan/StoreLocationCard';
import RelatedPlans from '@/components/plan/RelatedPlans';
import { useSearchBar } from '@/contexts/SearchBarContext';
import type { PlanDetailData, RelatedPlanData } from '@/types/plan-detail';
import type { MapData } from '@/components/plan/InteractiveKimonoMap/types';

// 动态导入 AITryOnSection (含 AI SDK ~500KB)
const AITryOnSection = dynamic(
  () => import('@/components/plan/AITryOnSection'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />,
    ssr: false,
  }
);

// 升级服务类型
export interface SelectedUpgrade {
  id: string;
  name: string;
  price: number;
  icon: string;
}

interface PlanDetailClientProps {
  plan: PlanDetailData;
  relatedPlans: RelatedPlanData[];
  mapData: MapData | null;
}

export function PlanDetailClient({
  plan,
  relatedPlans,
  mapData,
}: PlanDetailClientProps) {
  const [mounted, setMounted] = useState(false);
  const [isInFullWidthSection, setIsInFullWidthSection] = useState(true);
  const [selectedUpgrades, setSelectedUpgrades] = useState<SelectedUpgrade[]>([]);
  const { setHideSearchBar } = useSearchBar();
  const bookingCardRef = useRef<HTMLDivElement>(null);

  // 升级服务操作回调
  const handleAddUpgrade = useCallback((upgrade: SelectedUpgrade) => {
    setSelectedUpgrades((prev) => {
      if (prev.some((u) => u.id === upgrade.id)) return prev;
      return [...prev, upgrade];
    });
  }, []);

  const handleRemoveUpgrade = useCallback((upgradeId: string) => {
    setSelectedUpgrades((prev) => prev.filter((u) => u.id !== upgradeId));
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
  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInFullWidthSection(!entry.isIntersecting);
        });
      },
      {
        rootMargin: '-150px 0px 0px 0px',
        threshold: 0.1,
      }
    );

    if (bookingCardRef.current) {
      observer.observe(bookingCardRef.current);
    }

    return () => observer.disconnect();
  }, [mounted]);

  const scrollToBooking = () => {
    if (bookingCardRef.current) {
      bookingCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // 转换 store 为 BookingCard 需要的格式
  const storeForBookingCard = plan.defaultStore
    ? { id: plan.defaultStore.id, name: plan.defaultStore.name }
    : { id: 'default', name: '请选择店铺' };

  // 转换升级服务为旧格式
  const planUpgrades = plan.upgrades.map((u) => ({
    id: u.id,
    merchantComponentId: u.id,
    priceOverride: null as number | null,
    isPopular: false,
    displayOrder: 0,
    merchantComponent: {
      id: u.id,
      price: u.price,
      images: u.images,
      highlights: u.highlights,
      customName: u.name,
      customNameEn: u.nameEn || null,
      customDescription: u.description || null,
      customIcon: u.icon || null,
      template: null,
    },
  }));

  // 转换 relatedPlans 为旧格式
  const relatedPlansForComponent = relatedPlans.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice || null,
    imageUrl: p.imageUrl || null,
    isCampaign: p.isCampaign,
    includes: p.includes,
    merchantName: p.merchantName,
    region: p.region,
    planTags: p.tags.map((t) => ({
      tag: { id: t.id, code: t.code, name: t.name, icon: t.icon || null, color: t.color || null },
    })),
  }));

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 pt-8 md:pt-12 pb-16">
        {/* 面包屑导航 */}
        <nav className="mb-8 md:mb-10">
          <ol className="flex items-center gap-2 text-[14px]">
            <li>
              <Link href="/" className="text-gray-500 hover:text-sakura-600 transition-colors">
                首页
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/plans" className="text-gray-500 hover:text-sakura-600 transition-colors">
                全部套餐
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link
                href={`/plans?theme=${plan.theme.slug}`}
                className="text-gray-500 hover:text-sakura-600 transition-colors"
              >
                {plan.theme.name}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">{plan.name}</li>
          </ol>
        </nav>

        {/* 标题区域 */}
        <header className="mb-10 md:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
            <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
              {plan.theme.name} Plan
            </span>
          </div>

          <h1 className="text-[28px] md:text-[36px] lg:text-[42px] font-serif tracking-tight leading-tight mb-6 text-gray-900">
            {plan.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {/* 评分 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= 4
                        ? 'fill-sakura-500 text-sakura-500'
                        : 'fill-sakura-300 text-sakura-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[15px] font-semibold text-gray-900">4.8</span>
              <span className="text-[14px] text-gray-500">(128 条评价)</span>
            </div>

            <span className="w-1 h-1 rounded-full bg-gray-300" />

            <div className="flex items-center gap-1.5 text-[14px] text-gray-600">
              <Clock className="w-4 h-4 text-sakura-500" />
              <span>{plan.duration} 小时体验</span>
            </div>

            {plan.region && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1.5 text-[14px] text-gray-600">
                  <MapPin className="w-4 h-4 text-sakura-500" />
                  <span>{plan.region}</span>
                </div>
              </>
            )}

            {plan.isCampaign && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-sakura-50 text-sakura-700 border border-sakura-200">
                  限时优惠
                </span>
              </>
            )}
          </div>

          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-wabi-200 to-transparent" />
        </header>

        {/* 全宽区域 */}
        <div className="space-y-12 mb-12">
          <VisualHub
            plan={{
              id: plan.id,
              name: plan.name,
              price: plan.price,
              originalPrice: plan.originalPrice,
              imageUrl: plan.imageUrl,
              isCampaign: plan.isCampaign,
            }}
            officialImages={plan.images.length > 0 ? plan.images : plan.imageUrl ? [plan.imageUrl] : undefined}
          />

          {plan.description && (
            <section className="py-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
                <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
                  About This Plan
                </span>
              </div>
              <p className="text-[16px] leading-[1.9] whitespace-pre-line max-w-3xl text-gray-700">
                {plan.description}
              </p>
            </section>
          )}

          <AITryOnSection
            plan={{
              id: plan.id,
              name: plan.name,
              price: plan.price,
              originalPrice: plan.originalPrice,
              imageUrl: plan.imageUrl,
              isCampaign: plan.isCampaign,
            }}
          />

          <ServiceMap
            includes={plan.components.map((c) => c.name)}
            mapData={mapData}
          />

          {plan.campaign && (
            <section className="rounded-xl p-6 md:p-8 bg-gradient-to-br from-sakura-50 to-wabi-50 border border-sakura-200/30">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-sakura-400 to-sakura-600 shadow-lg shadow-sakura-500/25">
                  <span className="text-[26px]">🎊</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-[18px] font-serif tracking-wide mb-2 text-sakura-900">
                    {plan.campaign.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-sakura-800">
                    {plan.campaign.description}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 两栏区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-12">
            <UpgradeServices
              planUpgrades={planUpgrades}
              selectedUpgrades={selectedUpgrades}
              onAddUpgrade={handleAddUpgrade}
              onRemoveUpgrade={handleRemoveUpgrade}
            />

            {plan.defaultStore && <StoreLocationCard store={plan.defaultStore} />}

            <JourneyTimeline duration={plan.duration} />

            <SocialProof />
          </div>

          <div ref={bookingCardRef} className="lg:col-span-1 transition-all duration-300 rounded-xl">
            <div className="lg:sticky lg:top-24">
              <BookingCard
                plan={{
                  id: plan.id,
                  name: plan.name,
                  price: plan.price,
                  originalPrice: plan.originalPrice,
                  duration: plan.duration,
                  depositAmount: 0,
                  isCampaign: plan.isCampaign,
                  imageUrl: plan.imageUrl,
                }}
                store={storeForBookingCard}
                selectedUpgrades={selectedUpgrades}
                onRemoveUpgrade={handleRemoveUpgrade}
              />
            </div>
          </div>
        </div>

        {/* 猜你喜欢 */}
        {relatedPlansForComponent.length > 0 && (
          <RelatedPlans
            plans={relatedPlansForComponent}
            themeName={plan.theme.name}
            themeSlug={plan.theme.slug}
          />
        )}
      </div>

      {/* MiniBookingBar */}
      <MiniBookingBar
        plan={{
          id: plan.id,
          name: plan.name,
          price: plan.price,
          originalPrice: plan.originalPrice,
          isCampaign: plan.isCampaign,
        }}
        visible={isInFullWidthSection}
        onScrollToBooking={scrollToBooking}
      />
    </div>
  );
}
