"use client";

import { useMemo } from "react";
import { Sparkles, Store as StoreIcon, ArrowRight, Plus } from "lucide-react";
// 直接导入避免 barrel export 拉入 AITryOnSection (含 framer-motion)
import PlanCard from "@/components/PlanCard";
import FeaturedPlanCard from "@/components/PlanCard/FeaturedPlanCard";
import ScrollableSection from "@/components/ScrollableSection";
import HeroSection from "@/components/home/HeroSection";
import type { ThemeSection } from "@/types/homepage";

interface HomepageExploreModeProps {
  themeSections: ThemeSection[];
  onHeroVisibilityChange: (visible: boolean) => void;
}

export function HomepageExploreMode({
  themeSections,
  onHeroVisibilityChange,
}: HomepageExploreModeProps) {
  // 转换为 Hero 格式
  const heroThemes = useMemo(
    () =>
      themeSections.map((section) => ({
        id: section.id,
        slug: section.slug,
        name: section.label,
        icon: section.icon,
        color: section.color,
      })),
    [themeSections]
  );

  return (
    <>
      {/* Hero Section */}
      <HeroSection
        themes={heroThemes}
        onHeroVisibilityChange={onHeroVisibilityChange}
      />

      {/* Theme Sections - Miyabi 风格：背景色交替 + 无边框 */}
      <div>
        {themeSections.map((section, index) => (
          <section
            key={section.id}
            className={`py-8 md:py-12 ${
              index % 2 === 0 ? "bg-white" : "bg-[#FDFBF7]"
            }`}
          >
            <div className="container">
              {section.plans.length > 0 ? (
                <ScrollableSection
                  title={section.label}
                  description={section.description}
                  icon={section.icon}
                  color={section.color}
                  scrollerClassName="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-4 -mb-4 scrollbar-hide snap-x snap-mandatory px-4 md:px-0 scroll-pl-4 md:scroll-pl-0 scroll-pad-fix"
                  featuredChild={
                    section.plans.length > 0 ? (
                      <FeaturedPlanCard
                        plan={section.plans[0]}
                        themeColor={section.color}
                      />
                    ) : undefined
                  }
                >
                  {/* 其他套餐（跳过第一个） */}
                  {section.plans.slice(1).map((plan) => (
                    <div
                      key={plan.id}
                      className="snap-start flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] md:w-[260px] lg:w-full lg:snap-start lg:h-full"
                    >
                      <PlanCard
                        plan={plan}
                        variant="soft"
                        showMerchant={true}
                        themeSlug={section.slug}
                        themeColor={section.color}
                      />
                    </div>
                  ))}

                  {/* 占位卡片 1: 更多即将上线 */}
                  <div className="snap-start flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] md:w-[260px] lg:w-full lg:snap-start lg:h-full">
                    <div className="h-full flex flex-col bg-white rounded-xl border-2 border-dashed border-wabi-200 p-6 items-center justify-center text-center hover:border-sakura-200 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-full bg-wabi-50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                        <Sparkles className="w-6 h-6 text-wabi-400 group-hover:text-sakura-400 transition-colors duration-300" />
                      </div>
                      <h3 className="text-stone-800 font-semibold mb-2">
                        更多款式筹备中
                      </h3>
                      <p className="text-[14px] text-wabi-500 mb-4">
                        我们正在为您精心挑选更多{section.label}主题的和服
                      </p>
                      <span className="text-[12px] font-medium text-wabi-400 group-hover:text-sakura-500 transition-colors duration-300 flex items-center gap-1">
                        敬请期待 <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* 占位卡片 2: 商家入驻 CTA */}
                  <div className="snap-start flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] md:w-[260px] lg:w-full lg:snap-start lg:h-full">
                    <div
                      className="h-full flex flex-col bg-white rounded-xl border-2 border-dashed border-wabi-200 p-6 items-center justify-center text-center relative overflow-hidden group cursor-pointer hover:border-sakura-200 hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
                      onClick={() =>
                        (window.location.href = "/merchant/register")
                      }
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-wabi-50 group-hover:scale-105 transition-transform duration-300">
                        <StoreIcon className="w-6 h-6 text-wabi-400 group-hover:text-sakura-500 transition-colors duration-300" />
                      </div>

                      <h3 className="font-bold text-stone-800 mb-2">我是商家</h3>
                      <p className="text-[14px] text-wabi-500 mb-6">
                        想要在这里展示您的和服？立即入驻平台
                      </p>

                      <button className="text-[12px] font-bold px-4 py-2 rounded-full bg-sakura-50 text-sakura-600 hover:bg-sakura-100 transition-all duration-200 flex items-center gap-1.5">
                        免费入驻 <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </ScrollableSection>
              ) : (
                /* 即将上线的 Theme - Miyabi 风格 */
                <div className="px-4 md:px-0">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-px bg-gradient-to-r from-wabi-300 to-transparent" />
                    <div className="flex flex-col">
                      <span className="text-[12px] uppercase tracking-[0.25em] text-wabi-400 font-medium mb-1">
                        Coming Soon
                      </span>
                      <div className="flex items-center gap-3">
                        <h2 className="text-[24px] md:text-[28px] font-serif text-wabi-400 leading-tight">
                          {section.label}
                        </h2>
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-wabi-100 text-wabi-500 rounded-full">
                          即将上线
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-wabi-400 ml-[52px]">
                    {section.description}
                  </p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
