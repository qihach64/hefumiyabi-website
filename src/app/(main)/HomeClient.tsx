"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PlanCard from "@/components/PlanCard";
import PlanCardGrid from "@/components/PlanCard/PlanCardGrid";
import HeroSearchBar from "@/components/HeroSearchBar";
import ScrollableSection from "@/components/ScrollableSection";
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
  const { isSearching, stopSearch } = useSearchLoading();

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

  // 当搜索参数变化时,停止加载状态(说明新数据已经加载)
  useEffect(() => {
    if (isSearching) {
      // 搜索参数已经更新,数据已准备好,停止加载
      stopSearch();
    }
  }, [searchLocation, searchDate, guestsNum, selectedStoreId, selectedRegion, selectedTagIds.join(','), isSearching, stopSearch]);

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
    <div className="min-h-screen bg-white">
      {/* 搜索栏 - Sticky,始终可见可编辑 */}
      <section className="sticky top-14 md:top-16 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="container py-2 md:py-4">
          <HeroSearchBar />
        </div>
      </section>

      {/* 主内容区域 - 根据模式切换布局 */}
      {isSearchMode ? (
        /* 🔍 搜索模式 - 侧边栏 + 网格 */
        <section className="py-6 bg-background min-h-screen">
          <div className="container">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* 左侧筛选器（桌面端） */}
              <div className="hidden lg:block lg:w-64 flex-shrink-0">
                <FilterSidebar />
              </div>

              {/* 移动端筛选器（折叠） */}
              <div className="lg:hidden">
                <details className="bg-card rounded-lg border mb-6">
                  <summary className="px-4 py-3 cursor-pointer flex items-center justify-between font-medium">
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      筛选条件
                      {hasActiveFilters && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          {(selectedStoreId ? 1 : 0) + (selectedRegion ? 1 : 0) + selectedTagIds.length}
                        </span>
                      )}
                    </span>
                  </summary>
                  <div className="px-4 pb-4">
                    <FilterSidebar />
                  </div>
                </details>
              </div>

              {/* 右侧内容区域 */}
              <div className="flex-1 min-w-0">
                {isSearching ? (
                  /* 加载状态 */
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 border-4 border-sakura-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-sakura-500 border-r-sakura-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">正在搜索套餐</p>
                    <p className="text-sm text-gray-500">请稍候...</p>
                  </div>
                ) : (
                  <>
                    {/* 结果数量和推荐提示 */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-600">
                          找到 <span className="font-semibold text-gray-900">{filteredPlans.length}</span> 个符合条件的套餐
                        </p>
                        {guestsNum > 0 && recommendedCategories.length > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sakura-100 rounded-full text-sm">
                            <span>⭐</span>
                            <span className="font-semibold text-sakura-700">
                              为您推荐：{recommendedCategories.map(cat => getCategoryName(cat)).join('、')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                {/* 推荐区域 */}
                {recommendedPlans.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-4 mb-8">
                      <Badge variant="warning" size="lg" className="shadow-lg">
                        <span className="text-lg">⭐</span>
                        为您推荐
                      </Badge>
                      <span className="text-2xl font-bold text-gray-900">
                        {recommendedCategories.map(cat => getCategoryName(cat)).join('、')}
                      </span>
                    </div>
                    <PlanCardGrid variant="grid-4">
                      {recommendedPlans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} showMerchant={true} />
                      ))}
                    </PlanCardGrid>
                  </div>
                )}

                {/* 其他套餐 */}
                {otherPlans.length > 0 && (
                  <div>
                    {recommendedPlans.length > 0 && (
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">其他套餐</h2>
                    )}
                    <PlanCardGrid variant="grid-4">
                      {otherPlans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} showMerchant={true} />
                      ))}
                    </PlanCardGrid>
                  </div>
                )}

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
                  </>
                )}
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
                        className="snap-start flex-shrink-0 w-[240px] sm:w-[260px] md:w-[240px] lg:w-[260px]"
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
