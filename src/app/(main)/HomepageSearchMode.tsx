"use client";

import { useMemo } from "react";
import { Filter } from "lucide-react";
import { PlanCard, FeaturedPlanCard } from "@/features/guest/plans";
import { FilterSidebar, MobileFilterDrawer } from "@/features/guest/discovery";
import ScrollableSection from "@/components/ScrollableSection";
import { Button } from "@/components/ui";
import type {
  HomepagePlanCard,
  ThemeSection,
  HomepageStore,
  HomepageTagCategory,
} from "@/types/homepage";

interface HomepageSearchModeProps {
  themeSections: ThemeSection[];
  filteredPlans: HomepagePlanCard[];
  stores: HomepageStore[];
  tagCategories: HomepageTagCategory[];
  regions: string[];
  selectedStoreId: string | null;
  setSelectedStoreId: (id: string | null) => void;
  selectedRegion: string | null;
  setSelectedRegion: (region: string | null) => void;
  selectedTagIds: string[];
  toggleTag: (tagId: string) => void;
  clearFilters: () => void;
  isMobileFilterOpen: boolean;
  setIsMobileFilterOpen: (open: boolean) => void;
}

export function HomepageSearchMode({
  themeSections,
  filteredPlans,
  stores,
  tagCategories,
  regions,
  selectedStoreId,
  setSelectedStoreId,
  selectedRegion,
  setSelectedRegion,
  selectedTagIds,
  toggleTag,
  clearFilters,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
}: HomepageSearchModeProps) {
  // 搜索模式的 Theme Sections（按 themeId 分组）
  const searchThemeSections = useMemo(
    () =>
      themeSections
        .map((section) => ({
          ...section,
          plans: filteredPlans.filter((plan) => plan.themeId === section.id),
        }))
        .filter((section) => section.plans.length > 0),
    [filteredPlans, themeSections]
  );

  const hasActiveFilters = !!(
    selectedStoreId ||
    selectedRegion ||
    selectedTagIds.length > 0
  );

  const activeFiltersCount =
    (selectedStoreId ? 1 : 0) +
    (selectedRegion ? 1 : 0) +
    selectedTagIds.length;

  return (
    <section className="py-6 bg-background min-h-screen">
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧筛选器（桌面端） */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <FilterSidebar
              stores={stores}
              tagCategories={tagCategories}
              regions={regions}
              selectedStoreId={selectedStoreId}
              setSelectedStoreId={setSelectedStoreId}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              selectedTagIds={selectedTagIds}
              toggleTag={toggleTag}
              clearFilters={clearFilters}
            />
          </div>

          {/* 移动端筛选器按钮 */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-wabi-200 rounded-xl hover:bg-wabi-50 hover:border-sakura-200 active:scale-[0.98] transition-all shadow-sm"
            >
              <span className="flex items-center gap-2 font-medium text-stone-900">
                <Filter className="w-5 h-5 text-sakura-500" />
                筛选条件
                {hasActiveFilters && (
                  <span className="bg-sakura-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </span>
              <span className="text-sm text-wabi-500">点击筛选</span>
            </button>
          </div>

          {/* 移动端筛选抽屉 */}
          <MobileFilterDrawer
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            onApply={() => {}}
            onReset={clearFilters}
            activeFiltersCount={activeFiltersCount}
          >
            <FilterSidebar
              stores={stores}
              tagCategories={tagCategories}
              regions={regions}
              selectedStoreId={selectedStoreId}
              setSelectedStoreId={setSelectedStoreId}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              selectedTagIds={selectedTagIds}
              toggleTag={toggleTag}
              clearFilters={clearFilters}
            />
          </MobileFilterDrawer>

          {/* 右侧内容区域 */}
          <div className="flex-1 min-w-0">
            {/* 结果数量提示 */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                找到{" "}
                <span className="font-semibold text-gray-900">
                  {filteredPlans.length}
                </span>{" "}
                个符合条件的套餐
              </p>
            </div>

            {/* 无结果提示 */}
            {filteredPlans.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">没有找到符合条件的套餐</p>
                <Button
                  variant="primary"
                  onClick={() => (window.location.href = "/")}
                >
                  查看全部套餐
                </Button>
              </div>
            )}

            {/* Theme sections（横向滚动） */}
            {searchThemeSections.map((section, index) => (
              <section
                key={section.id}
                className={
                  index < searchThemeSections.length - 1 ? "mb-6 md:mb-12" : ""
                }
              >
                <ScrollableSection
                  title={section.label}
                  description={section.description}
                  icon={section.icon}
                  color={section.color}
                  scrollerClassName="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-4 -mb-4 scrollbar-hide snap-x snap-mandatory px-4 md:px-0"
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
                      className="snap-start flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] md:w-[260px] lg:w-[280px]"
                    >
                      <PlanCard
                        plan={plan}
                        variant="interactive"
                        showMerchant={true}
                        themeSlug={section.slug}
                        themeColor={section.color}
                      />
                    </div>
                  ))}
                </ScrollableSection>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
