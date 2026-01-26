"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useSearchLoading } from "@/contexts/SearchLoadingContext";
import { useSearchBar } from "@/contexts/SearchBarContext";
import { useSearchState } from "@/shared/hooks";
import { HomepageExploreMode } from "./HomepageExploreMode";
import type {
  ThemeSection,
  HomepagePlanCard,
  HomepageCampaign,
  HomepageStore,
  HomepageTagCategory,
} from "@/types/homepage";

// 动态导入搜索模式组件 - 减少首屏 JS bundle (~50KB)
const HomepageSearchMode = dynamic(
  () => import("./HomepageSearchMode").then((mod) => ({ default: mod.HomepageSearchMode })),
  {
    ssr: false,
    loading: () => <SearchModeSkeleton />,
  }
);

// 搜索模式骨架屏
function SearchModeSkeleton() {
  return (
    <section className="py-6 bg-background min-h-screen animate-pulse">
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧筛选器骨架 */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-wabi-200 p-6 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="h-6 w-24 bg-gray-200 rounded" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-8 w-16 bg-gray-100 rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 移动端筛选按钮骨架 */}
          <div className="lg:hidden mb-6">
            <div className="w-full h-12 bg-gray-100 rounded-xl" />
          </div>
          {/* 右侧内容骨架 */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <div className="h-4 w-40 bg-gray-200 rounded" />
            </div>
            {[1, 2].map((section) => (
              <div key={section} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="h-6 w-32 bg-gray-200 rounded" />
                </div>
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3, 4].map((card) => (
                    <div key={card} className="flex-shrink-0 w-[260px]">
                      <div className="bg-white rounded-xl overflow-hidden">
                        <div className="aspect-square bg-gray-200" />
                        <div className="p-3 space-y-2">
                          <div className="h-4 w-2/3 bg-gray-200 rounded" />
                          <div className="h-5 w-20 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface HomeClientProps {
  themeSections: ThemeSection[];
  allPlans: HomepagePlanCard[];
  campaigns: HomepageCampaign[];
  stores: HomepageStore[];
  tagCategories: HomepageTagCategory[];
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

  // URL 状态管理
  const {
    location: searchLocation,
    date: searchDate,
    storeId: selectedStoreId,
    setStoreId: setSelectedStoreId,
    region: selectedRegion,
    setRegion: setSelectedRegion,
    tags: urlTags,
    setTags: setUrlTags,
    clearFilters: clearUrlFilters,
  } = useSearchState();

  // 标签状态
  const selectedTagIds = urlTags ?? [];
  const setSelectedTagIds = (tags: string[]) => {
    setUrlTags(tags.length > 0 ? tags : null);
  };

  // 移动端筛选器抽屉状态
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 加载状态管理
  const loadingStartTimeRef = useRef<number>(0);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentParams = searchParams.toString();

    if (isSearching && loadingStartTimeRef.current === 0) {
      loadingStartTimeRef.current = Date.now();
    }

    if (isSearching && searchTarget && currentParams === searchTarget) {
      const elapsedTime = Date.now() - loadingStartTimeRef.current;
      const minDisplayTime = 500;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }

      stopTimeoutRef.current = setTimeout(() => {
        stopSearch();
        loadingStartTimeRef.current = 0;
        stopTimeoutRef.current = null;
      }, remainingTime);
    }

    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
    };
  }, [searchParams, isSearching, searchTarget, stopSearch]);

  // 判断是否处于搜索模式
  const isSearchMode = !!(
    searchLocation ||
    searchDate ||
    selectedStoreId ||
    selectedRegion ||
    selectedTagIds.length > 0
  );

  // 使用 Map 优化 O(1) 店铺查找
  const storeMap = useMemo(
    () => new Map(stores.map((s) => [s.id, s])),
    [stores]
  );

  // 使用 Set 优化 O(1) 标签查找
  const tagIdSet = useMemo(
    () => new Set(selectedTagIds),
    [selectedTagIds]
  );

  // 过滤套餐
  const filteredPlans = useMemo(() => {
    return allPlans.filter((plan) => {
      // 地点筛选
      if (searchLocation && plan.region && !plan.region.includes(searchLocation)) {
        return false;
      }

      // 店铺筛选
      if (selectedStoreId) {
        const store = storeMap.get(selectedStoreId);
        if (store && plan.merchantName !== store.name) {
          return false;
        }
      }

      // 地区筛选
      if (selectedRegion && plan.region !== selectedRegion) {
        return false;
      }

      // 标签筛选
      if (selectedTagIds.length > 0 && plan.planTags) {
        const hasAllTags = selectedTagIds.every((tagId) =>
          plan.planTags.some((pt) => pt.tag.id === tagId)
        );
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }, [allPlans, searchLocation, selectedStoreId, selectedRegion, selectedTagIds, storeMap]);

  // 地区列表
  const regions = useMemo(() => {
    const regionSet = new Set<string>();
    allPlans.forEach((plan) => {
      if (plan.region) regionSet.add(plan.region);
    });
    return Array.from(regionSet).sort();
  }, [allPlans]);

  // 切换标签
  const toggleTag = (tagId: string) => {
    if (tagIdSet.has(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* 搜索加载覆盖层 */}
      {isSearching && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center transition-opacity duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-sakura-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-sakura-500 border-r-sakura-400 rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-1">
                正在搜索套餐
              </p>
              <p className="text-sm text-gray-500">即将为您呈现结果...</p>
            </div>
          </div>
        </div>
      )}

      {/* 根据模式切换布局 */}
      {isSearchMode ? (
        <HomepageSearchMode
          themeSections={themeSections}
          filteredPlans={filteredPlans}
          stores={stores}
          tagCategories={tagCategories}
          regions={regions}
          selectedStoreId={selectedStoreId}
          setSelectedStoreId={setSelectedStoreId}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedTagIds={selectedTagIds}
          toggleTag={toggleTag}
          clearFilters={clearUrlFilters}
          isMobileFilterOpen={isMobileFilterOpen}
          setIsMobileFilterOpen={setIsMobileFilterOpen}
        />
      ) : (
        <HomepageExploreMode
          themeSections={themeSections}
          onHeroVisibilityChange={setIsHeroVisible}
        />
      )}
    </div>
  );
}
