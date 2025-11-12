"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import PlanCard from "@/components/PlanCard";
import PlanCardGrid from "@/components/PlanCard/PlanCardGrid";
import ScrollableSection from "@/components/ScrollableSection";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import { Sparkles, MapPin, Store as StoreIcon, Tag, X, Filter, Users, Calendar, Loader2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useSearchLoading } from "@/contexts/SearchLoadingContext";

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
  storeName?: string;
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
}

interface CategorySection {
  id: string;
  icon: string;
  label: string;
  description: string;
  plans: RentalPlan[];
  isRecommended?: boolean; // 标记是否为推荐分区
}

interface HomeClientProps {
  categorySections: CategorySection[];
  allPlans: RentalPlan[];
  campaigns: Campaign[];
  stores: Store[];
  tagCategories: TagCategory[];
}

// 根据性别和年龄获取推荐分类
interface GuestsBreakdown {
  men: number;
  women: number;
  children: number;
}

function getRecommendedCategories(
  totalGuests: number,
  breakdown?: GuestsBreakdown
): string[] {
  if (breakdown) {
    const { men, women, children } = breakdown;
    const adults = men + women;

    if (men === 1 && women === 1 && children === 0) return ['COUPLE'];
    if (children > 0) return ['FAMILY'];
    if (adults >= 5) return ['GROUP'];
    if (women === 1 && men === 0 && children === 0) return ['LADIES'];
    if (men === 1 && women === 0 && children === 0) return ['MENS'];
    if (women >= 2 && men === 0 && children === 0) return ['LADIES', 'GROUP'];
    if (men >= 2 && women === 0 && children === 0) return ['MENS', 'GROUP'];
    if (adults >= 3 && adults <= 4 && children === 0) return ['GROUP', 'SPECIAL'];
    return ['SPECIAL'];
  }

  if (totalGuests === 1) return ['LADIES', 'MENS'];
  if (totalGuests === 2) return ['COUPLE'];
  if (totalGuests >= 3 && totalGuests <= 4) return ['FAMILY'];
  if (totalGuests >= 5) return ['GROUP'];
  return [];
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    'LADIES': '女士和服',
    'MENS': '男士和服',
    'COUPLE': '情侣套餐',
    'FAMILY': '亲子套餐',
    'GROUP': '团体套餐',
    'SPECIAL': '特别套餐',
  };
  return names[category] || category;
}

export default function HomeClient({
  categorySections,
  allPlans,
  campaigns,
  stores,
  tagCategories,
}: HomeClientProps) {
  const searchParams = useSearchParams();
  const { isSearching, searchTarget, stopSearch } = useSearchLoading();

  // 搜索参数
  const searchLocation = searchParams.get('location') || '';
  const searchDate = searchParams.get('date') || '';
  const guestsNum = parseInt(searchParams.get('guests') || '0');
  const menNum = parseInt(searchParams.get('men') || '0');
  const womenNum = parseInt(searchParams.get('women') || '0');
  const childrenNum = parseInt(searchParams.get('children') || '0');

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
  const isSearchMode = !!(searchLocation || searchDate || guestsNum > 0 || selectedStoreId || selectedRegion || selectedTagIds.length > 0);

  // 推荐分类
  const recommendedCategories = useMemo(() => {
    if (guestsNum > 0) {
      return getRecommendedCategories(guestsNum, {
        men: menNum,
        women: womenNum,
        children: childrenNum,
      });
    }
    return [];
  }, [guestsNum, menNum, womenNum, childrenNum]);

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

  // 推荐套餐
  const recommendedPlans = useMemo(() => {
    if (recommendedCategories.length === 0) return [];
    return filteredPlans.filter((plan) => recommendedCategories.includes(plan.category));
  }, [filteredPlans, recommendedCategories]);

  // 其他套餐
  const otherPlans = useMemo(() => {
    if (recommendedCategories.length === 0) return filteredPlans;
    return filteredPlans.filter((plan) => !recommendedCategories.includes(plan.category));
  }, [filteredPlans, recommendedCategories]);

  // 搜索模式的分类sections（按分类分组,推荐置顶）
  const searchCategorySections = useMemo(() => {
    const sections: CategorySection[] = [];

    // 1. 推荐分区
    if (recommendedPlans.length > 0 && recommendedCategories.length > 0) {
      recommendedCategories.forEach(categoryId => {
        const categoryInfo = categorySections.find(c => c.id === categoryId);
        const categoryPlans = recommendedPlans.filter(p => p.category === categoryId);

        if (categoryInfo && categoryPlans.length > 0) {
          sections.push({
            ...categoryInfo,
            plans: categoryPlans,
            isRecommended: true, // 标记为推荐
          });
        }
      });
    }

    // 2. 其他分类（按 category 分组）
    const categoryMap = new Map<string, typeof filteredPlans>();
    otherPlans.forEach(plan => {
      if (!categoryMap.has(plan.category)) {
        categoryMap.set(plan.category, []);
      }
      categoryMap.get(plan.category)!.push(plan);
    });

    // 按照 categorySections 的顺序添加其他分类
    categorySections.forEach(categoryInfo => {
      const plans = categoryMap.get(categoryInfo.id);
      if (plans && plans.length > 0) {
        sections.push({
          ...categoryInfo,
          plans,
          isRecommended: false,
        });
      }
    });

    return sections;
  }, [filteredPlans, recommendedPlans, recommendedCategories, otherPlans, categorySections]);

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

  // 过滤器侧边栏组件
  const FilterSidebar = () => (
    <aside className="lg:sticky lg:top-24">
      <div className="bg-card rounded-lg border p-6 space-y-6">
        {/* 筛选器标题 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选条件
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
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
              className="w-full text-sm font-semibold mb-3 flex items-center justify-between hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-sakura-500" />
                <span>选择店铺</span>
                {selectedStoreId && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </div>
              <span className="text-gray-400">{isStoreExpanded ? '▼' : '▶'}</span>
            </button>

            {isStoreExpanded && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedStoreId('')}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${selectedStoreId === ''
                      ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${selectedStoreId === store.id
                        ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className="w-full text-sm font-semibold mb-3 flex items-center justify-between hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sakura-500" />
                <span>选择地区</span>
                {selectedRegion && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </div>
              <span className="text-gray-400">{isRegionExpanded ? '▼' : '▶'}</span>
            </button>

            {isRegionExpanded && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedRegion('')}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${selectedRegion === ''
                      ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${selectedRegion === region
                        ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className="w-full text-sm font-semibold mb-3 flex items-center justify-between hover:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-base">{category.icon}</span>}
                  <span style={{ color: category.color || undefined }}>{category.name}</span>
                  {selectedCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
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
                          px-3 py-1.5 rounded-full text-xs font-medium transition-all
                          ${isSelected
                            ? 'bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                        style={isSelected && tag.color ? {
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        } : undefined}
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

              {/* 移动端筛选器按钮 */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
                >
                  <span className="flex items-center gap-2 font-medium text-gray-900">
                    <Filter className="w-5 h-5 text-sakura-500" />
                    筛选条件
                    {hasActiveFilters && (
                      <span className="bg-sakura-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {(selectedStoreId ? 1 : 0) + (selectedRegion ? 1 : 0) + selectedTagIds.length}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">点击筛选</span>
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

                {/* 分类sections（横向滚动） */}
                {searchCategorySections.map((section, index) => (
                  <section
                    key={section.id}
                    className={index < searchCategorySections.length - 1 ? "mb-6 md:mb-12" : ""}
                  >
                    {/* 推荐徽章（如果是推荐分区） */}
                    {section.isRecommended && (
                      <div className="mb-3 px-4 lg:px-0">
                        <Badge variant="warning" size="lg" className="shadow-lg">
                          <span className="text-lg">⭐</span>
                          为您推荐
                        </Badge>
                      </div>
                    )}

                    <ScrollableSection
                      title={section.label}
                      description={section.description}
                      icon={section.icon}
                      scrollerClassName="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-4 -mb-4 scrollbar-hide snap-x snap-mandatory px-4 md:px-0"
                    >
                      {section.plans.map((plan) => (
                        <div
                          key={plan.id}
                          className="snap-start flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] md:w-[260px] lg:w-[280px]"
                        >
                          <PlanCard plan={plan} showMerchant={true} />
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
        /* 🏠 探索模式 - 分类横向滚动 */
        <>
          <div className="py-6 md:py-12">
            {categorySections.map((section, index) => (
              <section
                key={section.id}
                className={index < categorySections.length - 1 ? "mb-6 md:mb-12" : ""}
              >
                <div className="container">
                  <ScrollableSection
                    title={section.label}
                    description={section.description}
                    icon={section.icon}
                    scrollerClassName="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-4 -mb-4 scrollbar-hide snap-x snap-mandatory px-4 md:px-0"
                  >
                    {section.plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="snap-start flex-shrink-0 w-[75vw] max-w-[280px] sm:w-[280px] md:w-[260px] lg:w-[280px]"
                      >
                        <PlanCard plan={plan} showMerchant={true} />
                      </div>
                    ))}
                  </ScrollableSection>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
