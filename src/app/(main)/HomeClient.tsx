"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import PlanCard from "@/components/PlanCard";
import PlanCardGrid from "@/components/PlanCard/PlanCardGrid";
import ScrollableSection from "@/components/ScrollableSection";
import FeaturedPlanCard from "@/components/PlanCard/FeaturedPlanCard";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import HeroSection from "@/components/home/HeroSection";
import { Sparkles, MapPin, Store as StoreIcon, Tag, X, Filter, Users, Calendar, Loader2, Plus, ArrowRight } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useSearchLoading } from "@/contexts/SearchLoadingContext";
import { useSearchBar } from "@/contexts/SearchBarContext";

// 类型定义 (从 PlansClient 复制)
interface Store {
  id: string;
  name: string;
  slug: string;
}

interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
}

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  categoryId?: string;
}

interface TagCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  tags: Tag[];
}

interface PlanTag {
  tag: Tag;
}

interface RentalPlan {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  duration: number;
  includes: string[];
  imageUrl?: string;
  merchantName?: string;
  region?: string;
  tags?: string[];
  planTags?: PlanTag[];
  isCampaign?: boolean;
  campaignId?: string;
  campaign?: Campaign;
  isLimited?: boolean;
  maxBookings?: number;
  currentBookings?: number;
  availableFrom?: Date | string;
  availableUntil?: Date | string;
  themeId?: string;
}

interface ThemeSection {
  id: string;
  slug: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  plans: RentalPlan[];
}

interface HomeClientProps {
  themeSections: ThemeSection[];
  allPlans: RentalPlan[];
  campaigns: Campaign[];
  stores: Store[];
  tagCategories: TagCategory[];
}

export default function HomeClient({
  themeSections,
  allPlans,
  campaigns,
  stores,
  tagCategories,
}: HomeClientProps) {
  const searchParams = useSearchParams();
  const { isSearching, searchTarget, stopSearch } = useSearchLoading();
  const { setIsHeroVisible } = useSearchBar();

  // 搜索参数
  const searchLocation = searchParams.get('location') || '';
  const searchDate = searchParams.get('date') || '';

  // Convert themeSections to Hero format
  const heroThemes = useMemo(() =>
    themeSections.map(section => ({
      id: section.id,
      slug: section.slug,
      name: section.label,
      icon: section.icon,
      color: section.color,
    })), [themeSections]);

  // 过滤器状态
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(tagCategories.map(c => c.id)) // 默认全部展开
  );

  // 店铺和地区分类的展开/折叠状态
  const [isStoreExpanded, setIsStoreExpanded] = useState(true);
  const [isRegionExpanded, setIsRegionExpanded] = useState(true);

  // 移动端过滤器抽屉状态
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 记录加载开始时间
  const loadingStartTimeRef = useRef<number>(0);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 统一管理加载状态
  useEffect(() => {
    const currentParams = searchParams.toString();

    // 开始加载
    if (isSearching && loadingStartTimeRef.current === 0) {
      loadingStartTimeRef.current = Date.now();
    }

    // 如果当前处于加载状态,且当前URL参数与目标参数匹配
    if (isSearching && searchTarget && currentParams === searchTarget) {
      const elapsedTime = Date.now() - loadingStartTimeRef.current;
      const minDisplayTime = 500; // 最小显示时间 500ms
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      // 清除之前的定时器(如果有)
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }

      stopTimeoutRef.current = setTimeout(() => {
        stopSearch();
        loadingStartTimeRef.current = 0; // 重置计时器
        stopTimeoutRef.current = null;
      }, remainingTime);
    }

    // 清理函数
    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
    };
  }, [searchParams, isSearching, searchTarget, stopSearch]);

  // 判断是否处于"搜索模式"
  const isSearchMode = !!(searchLocation || searchDate || selectedStoreId || selectedRegion || selectedTagIds.length > 0);

  // 过滤套餐逻辑
  const filteredPlans = useMemo(() => {
    return allPlans.filter((plan) => {
      // 地点筛选
      if (searchLocation && plan.region && !plan.region.includes(searchLocation)) {
        return false;
      }

      // 店铺筛选
      if (selectedStoreId && plan.storeName) {
        const store = stores.find(s => s.id === selectedStoreId);
        if (store && plan.storeName !== store.name) {
          return false;
        }
      }

      // 地区筛选
      if (selectedRegion && plan.region !== selectedRegion) {
        return false;
      }

      // 标签筛选
      if (selectedTagIds.length > 0 && plan.planTags) {
        const planTagIds = plan.planTags.map((pt) => pt.tag.id);
        const hasAllTags = selectedTagIds.every((tagId) => planTagIds.includes(tagId));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }, [allPlans, searchLocation, selectedStoreId, selectedRegion, selectedTagIds, stores]);

  // 搜索模式的 Theme Sections（按 themeId 分组）
  const searchThemeSections = useMemo(() => {
    return themeSections.map(section => ({
      ...section,
      plans: filteredPlans.filter(plan => plan.themeId === section.id),
    })).filter(section => section.plans.length > 0);
  }, [filteredPlans, themeSections]);

  // 地区列表
  const regions = useMemo(() => {
    const regionSet = new Set<string>();
    allPlans.forEach((plan) => {
      if (plan.region) regionSet.add(plan.region);
    });
    return Array.from(regionSet).sort();
  }, [allPlans]);

  // 切换标签选择
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  // 切换分类展开/折叠
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // 清除所有筛选
  const clearFilters = () => {
    setSelectedStoreId('');
    setSelectedRegion('');
    setSelectedTagIds([]);
  };

  // 过滤器侧边栏组件 - Zen 风格
  const FilterSidebar = () => (
    <aside className="lg:sticky lg:top-24">
      <div className="bg-white rounded-xl border border-wabi-200 p-6 space-y-6">
        {/* 筛选器标题 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-stone-900">
            <Filter className="w-5 h-5 text-stone-500" />
            筛选条件
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-wabi-500 hover:text-sakura-600 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              清除
            </button>
          )}
        </div>

        {/* 店铺筛选 - 可折叠风格 */}
        {stores.length > 0 && (
          <div>
            <button
              onClick={() => setIsStoreExpanded(!isStoreExpanded)}
              className="w-full text-sm font-semibold mb-3 flex items-center justify-between text-stone-700 hover:text-stone-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-sakura-500" />
                <span>选择店铺</span>
                {selectedStoreId && (
                  <span className="text-xs bg-sakura-500 text-white px-2 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </div>
              <span className="text-wabi-400 text-xs">{isStoreExpanded ? '▼' : '▶'}</span>
            </button>

            {isStoreExpanded && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedStoreId('')}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${selectedStoreId === ''
                      ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                      : 'bg-wabi-100 text-wabi-700 hover:bg-wabi-200'
                    }
                  `}
                >
                  🏪 全部店铺
                </button>
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                      ${selectedStoreId === store.id
                        ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                        : 'bg-wabi-100 text-wabi-700 hover:bg-wabi-200'
                      }
                    `}
                  >
                    🏪 {store.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 地区筛选 - 可折叠风格 */}
        {regions.length > 0 && (
          <div>
            <button
              onClick={() => setIsRegionExpanded(!isRegionExpanded)}
              className="w-full text-sm font-semibold mb-3 flex items-center justify-between text-stone-700 hover:text-stone-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sakura-500" />
                <span>选择地区</span>
                {selectedRegion && (
                  <span className="text-xs bg-sakura-500 text-white px-2 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </div>
              <span className="text-wabi-400 text-xs">{isRegionExpanded ? '▼' : '▶'}</span>
            </button>

            {isRegionExpanded && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedRegion('')}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${selectedRegion === ''
                      ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                      : 'bg-wabi-100 text-wabi-700 hover:bg-wabi-200'
                    }
                  `}
                >
                  📍 全部地区
                </button>
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                      ${selectedRegion === region
                        ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                        : 'bg-wabi-100 text-wabi-700 hover:bg-wabi-200'
                      }
                    `}
                  >
                    📍 {region}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 标签筛选 - 可折叠分类 */}
        {tagCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const selectedCount = category.tags.filter(tag => selectedTagIds.includes(tag.id)).length;

          return (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full text-sm font-semibold mb-3 flex items-center justify-between text-stone-700 hover:text-stone-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-base">{category.icon}</span>}
                  <span>{category.name}</span>
                  {selectedCount > 0 && (
                    <span className="text-xs bg-sakura-500 text-white px-2 py-0.5 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <span className="text-wabi-400 text-xs">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {category.tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                          ${isSelected
                            ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                            : 'bg-wabi-100 text-wabi-700 hover:bg-wabi-200'
                          }
                        `}
                      >
                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );

  const hasActiveFilters = !!(selectedStoreId || selectedRegion || selectedTagIds.length > 0);

  return (
    <div className="min-h-screen bg-white relative">
      {/* 搜索加载覆盖层 - 平滑过渡 */}
      {isSearching && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center transition-opacity duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-sakura-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-sakura-500 border-r-sakura-400 rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-1">正在搜索套餐</p>
              <p className="text-sm text-gray-500">即将为您呈现结果...</p>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区域 - 根据模式切换布局 */}
      {isSearchMode ? (
        /* 🔍 搜索模式 - 侧边栏 + 分类横向滚动 */
        <section className="py-6 bg-background min-h-screen">
          <div className="container">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* 左侧筛选器（桌面端） */}
              <div className="hidden lg:block lg:w-64 flex-shrink-0">
                <FilterSidebar />
              </div>

              {/* 移动端筛选器按钮 - Zen 风格 */}
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
                        {(selectedStoreId ? 1 : 0) + (selectedRegion ? 1 : 0) + selectedTagIds.length}
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
                onApply={() => {
                  // 应用筛选逻辑已在状态中，直接关闭即可
                }}
                onReset={() => {
                  setSelectedStoreId('');
                  setSelectedRegion('');
                  setSelectedTagIds([]);
                }}
                activeFiltersCount={(selectedStoreId ? 1 : 0) + (selectedRegion ? 1 : 0) + selectedTagIds.length}
              >
                <FilterSidebar />
              </MobileFilterDrawer>

              {/* 右侧内容区域 */}
              <div className="flex-1 min-w-0">
                {/* 结果数量提示 */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    找到 <span className="font-semibold text-gray-900">{filteredPlans.length}</span> 个符合条件的套餐
                  </p>
                </div>

                {/* 无结果提示 */}
                {filteredPlans.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-500 mb-4">没有找到符合条件的套餐</p>
                    <Button
                      variant="primary"
                      onClick={() => window.location.href = '/'}
                    >
                      查看全部套餐
                    </Button>
                  </div>
                )}

                {/* Theme sections（横向滚动） */}
                {searchThemeSections.map((section, index) => (
                  <section
                    key={section.id}
                    className={index < searchThemeSections.length - 1 ? "mb-6 md:mb-12" : ""}
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
      ) : (
        /* 🏠 探索模式 - Hero + Theme 分类横向滚动 */
        <>
          {/* Hero Section */}
          <HeroSection
            themes={heroThemes}
            onHeroVisibilityChange={setIsHeroVisible}
          />

          {/* Theme Sections - Miyabi 风格：背景色交替 + 无边框 */}
          <div>
            {themeSections.map((section, index) => (
              <section
                key={section.id}
                className={`py-8 md:py-12 ${index % 2 === 0 ? "bg-white" : "bg-[#FDFBF7]"}`}
              >
                <div className="container">
                  {section.plans.length > 0 ? (
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

                      {/* 占位卡片 1: 更多即将上线 - Zen line-frame 风格 */}
                      <div className="snap-start flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] md:w-[260px] lg:w-full lg:snap-start lg:h-full">
                        <div className="h-full flex flex-col bg-white rounded-xl border-2 border-dashed border-wabi-200 p-6 items-center justify-center text-center hover:border-sakura-200 transition-colors group">
                          <div className="w-12 h-12 rounded-full bg-wabi-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-6 h-6 text-wabi-400 group-hover:text-sakura-400 transition-colors" />
                          </div>
                          <h3 className="text-stone-800 font-semibold mb-2">更多款式筹备中</h3>
                          <p className="text-sm text-wabi-500 mb-4">
                            我们正在为您精心挑选更多{section.label}主题的和服
                          </p>
                          <span className="text-xs font-medium text-wabi-400 group-hover:text-sakura-500 transition-colors flex items-center gap-1">
                            敬请期待 <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* 占位卡片 2: 商家入驻 CTA - Zen line-frame 风格 */}
                      <div className="snap-start flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] md:w-[260px] lg:w-full lg:snap-start lg:h-full">
                        <div
                          className="h-full flex flex-col bg-white rounded-xl border-2 border-dashed border-wabi-200 p-6 items-center justify-center text-center relative overflow-hidden group cursor-pointer hover:border-sakura-200 transition-colors"
                          onClick={() => window.location.href = '/merchant/register'}
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-wabi-50 group-hover:scale-110 transition-transform duration-300"
                          >
                            <StoreIcon className="w-6 h-6 text-wabi-400 group-hover:text-sakura-500 transition-colors" />
                          </div>

                          <h3 className="font-bold text-stone-800 mb-2">我是商家</h3>
                          <p className="text-sm text-wabi-500 mb-6">
                            想要在这里展示您的和服？立即入驻平台
                          </p>

                          <button className="text-xs font-bold px-4 py-2 rounded-full bg-sakura-50 text-sakura-600 hover:bg-sakura-100 transition-all flex items-center gap-1.5">
                            免费入驻 <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </ScrollableSection>
                  ) : (
                    /* 即将上线的 Theme - Miyabi 风格 */
                    <div className="px-4 md:px-0">
                      <div className="flex items-center gap-3 mb-6">
                        {/* 渐变装饰线 */}
                        <div className="w-10 h-px bg-gradient-to-r from-wabi-300 to-transparent" />
                        <div className="flex flex-col">
                          {/* 英文小标题 */}
                          <span className="text-[12px] uppercase tracking-[0.25em] text-wabi-400 font-medium mb-1">
                            Coming Soon
                          </span>
                          {/* 主标题：使用 font-serif */}
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
                      <p className="text-sm md:text-base text-wabi-400 ml-[52px]">{section.description}</p>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
