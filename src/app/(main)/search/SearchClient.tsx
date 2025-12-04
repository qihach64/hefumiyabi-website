"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useCallback, useMemo, useTransition, useEffect } from "react";
import PlanCard from "@/components/PlanCard";
import ThemePills from "@/components/ThemePills";
import SearchFilterSidebar from "@/components/search/SearchFilterSidebar";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchState } from "@/contexts/SearchStateContext";

// 与 ThemePills 组件共享的 Theme 类型
interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  description?: string | null;
}

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface TagCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  tags: Tag[];
}

interface PlanTag {
  tag: Tag;
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  merchantName?: string;
  region?: string;
  category?: string;
  duration?: number;
  isCampaign?: boolean;
  includes?: string[];
  planTags?: PlanTag[];
  themeId?: string;
  themeName?: string;
  themeIcon?: string;
}

interface SearchClientProps {
  themes: Theme[];
  plans: Plan[]; // 服务端已按主题/地点预过滤的所有套餐
  currentTheme: Theme | null | undefined;
  searchLocation: string;
  searchDate: string;
  tagCategories: TagCategory[];
  selectedTags: string[];
  priceRange: [number, number];
  maxPrice: number;
  sortBy: string;
}

function SearchClientInner({
  themes,
  plans: allPlans, // 重命名为 allPlans，表示这是服务端传来的完整列表
  currentTheme,
  searchLocation,
  searchDate,
  tagCategories,
  selectedTags: initialSelectedTags,
  priceRange: initialPriceRange,
  maxPrice,
  sortBy: initialSortBy,
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchState, setTheme } = useSearchState();
  const [isPending, startTransition] = useTransition();
  const [pendingTheme, setPendingTheme] = useState<Theme | null | undefined>(undefined);

  // 使用 URL 作为真正的数据源来检测外部导航
  // 当 URL 中的 theme 参数与当前服务端渲染的 theme 不同时，说明正在导航
  const urlThemeSlug = searchParams.get('theme');
  const currentThemeSlug = currentTheme?.slug;

  // 外部导航检测：URL 参数与服务端数据不匹配
  // 这发生在 HeaderSearchBar 更新 URL 但服务端数据还未更新时
  const isExternalNavigation = urlThemeSlug !== (currentThemeSlug || null);

  // 当外部导航发生时，更新 pendingTheme 用于显示即将切换到的主题
  useEffect(() => {
    if (isExternalNavigation) {
      if (urlThemeSlug) {
        // 从 themes 列表中查找即将切换到的主题
        const targetTheme = themes.find(t => t.slug === urlThemeSlug);
        if (targetTheme) {
          setPendingTheme(targetTheme);
        }
      } else {
        // urlThemeSlug 为 null，表示切换到"全部"
        setPendingTheme(null);
      }
    } else {
      setPendingTheme(undefined);
    }
  }, [isExternalNavigation, urlThemeSlug, themes]);

  // ========== 客户端筛选状态 ==========
  // 这些状态用于前端即时过滤，不触发后端请求
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);
  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange);
  const [sortBy, setSortBy] = useState<string>(initialSortBy);

  // 移动端筛选抽屉状态
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // ========== 前端过滤逻辑 ==========
  const filteredAndSortedPlans = useMemo(() => {
    let result = [...allPlans];

    // 1. 标签过滤 (AND 逻辑)
    if (selectedTags.length > 0) {
      result = result.filter((plan) => {
        const planTagCodes = plan.planTags?.map((pt) => pt.tag.code) || [];
        // 必须包含所有选中的标签
        return selectedTags.every((tagCode) => planTagCodes.includes(tagCode));
      });
    }

    // 2. 价格过滤
    if (priceRange[0] > 0 || priceRange[1] < maxPrice) {
      result = result.filter((plan) => {
        const price = plan.price;
        const minOk = priceRange[0] <= 0 || price >= priceRange[0];
        const maxOk = priceRange[1] >= maxPrice || price <= priceRange[1];
        return minOk && maxOk;
      });
    }

    // 3. 排序
    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        // 按 isCampaign 和原价折扣排序（作为"热门"的替代）
        result.sort((a, b) => {
          const aScore = (a.isCampaign ? 100 : 0) + (a.originalPrice ? 50 : 0);
          const bScore = (b.isCampaign ? 100 : 0) + (b.originalPrice ? 50 : 0);
          return bScore - aScore;
        });
        break;
      case "recommended":
      default:
        // 默认排序：isCampaign > 折扣 > 价格
        result.sort((a, b) => {
          if (a.isCampaign !== b.isCampaign) return a.isCampaign ? -1 : 1;
          if (!!a.originalPrice !== !!b.originalPrice) return a.originalPrice ? -1 : 1;
          return a.price - b.price;
        });
        break;
    }

    return result;
  }, [allPlans, selectedTags, priceRange, sortBy, maxPrice]);

  // ========== URL 同步（仅用于分享链接，不触发页面刷新）==========
  const updateUrlSilently = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "0") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      const newUrl = queryString ? `/search?${queryString}` : "/search";

      // 使用 replaceState 静默更新 URL，不触发页面刷新
      window.history.replaceState(null, "", newUrl);
    },
    [searchParams]
  );

  // ========== 主题切换（需要服务端重新查询）==========
  const handleThemeChange = (theme: Theme | null) => {
    setTheme(theme);
    setPendingTheme(theme); // 设置正在切换到的主题

    // 主题切换需要后端重新过滤，使用 router.push
    const params = new URLSearchParams(searchParams.toString());
    if (theme) {
      params.set("theme", theme.slug);
    } else {
      params.delete("theme");
    }
    // 切换主题时重置筛选条件
    params.delete("tags");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("sort");

    setSelectedTags([]);
    setPriceRange([0, maxPrice]);
    setSortBy("recommended");

    const queryString = params.toString();

    // 使用 startTransition 包装导航，实现即时反馈
    startTransition(() => {
      router.push(queryString ? `/search?${queryString}` : "/search");
    });
  };

  // ========== 标签变更（前端过滤）==========
  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    updateUrlSilently({ tags: tags.length > 0 ? tags.join(",") : null });
  };

  // ========== 价格变更（前端过滤）==========
  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
    updateUrlSilently({
      minPrice: range[0] > 0 ? String(range[0]) : null,
      maxPrice: range[1] < maxPrice ? String(range[1]) : null,
    });
  };

  // ========== 排序变更（前端过滤）==========
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateUrlSilently({ sort: sort === "recommended" ? null : sort });
  };

  // ========== 重置所有筛选 ==========
  const handleReset = () => {
    setSelectedTags([]);
    setPriceRange([0, maxPrice]);
    setSortBy("recommended");
    updateUrlSilently({
      tags: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
    });
  };

  // 计算活跃筛选数量
  const activeFiltersCount =
    selectedTags.length +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (sortBy !== "recommended" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 主题 Pills - 固定在顶部 */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container py-4">
          <ThemePills
            themes={themes}
            selectedTheme={currentTheme || null}
            onSelect={handleThemeChange}
            isPending={isPending || isExternalNavigation}
            pendingTheme={pendingTheme}
          />
        </div>
      </div>

      {/* 搜索结果内容 */}
      <div className="container py-8">
        {/* 搜索摘要 + 移动端筛选按钮 */}
        {(() => {
          // 显示的主题：优先显示 pending 主题（切换中），否则显示当前主题
          const isLoading = isPending || isExternalNavigation;
          const displayTheme = isLoading ? pendingTheme : currentTheme;

          return (
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {displayTheme ? (
                    <span className="flex items-center gap-2">
                      {displayTheme.icon && (
                        <span className="text-3xl">{displayTheme.icon}</span>
                      )}
                      {displayTheme.name}
                    </span>
                  ) : (
                    "探索和服体验"
                  )}
                </h1>
                <p className="text-gray-600">
                  {displayTheme?.description || "发现适合你的和服租赁套餐"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-20 bg-gray-200 rounded animate-pulse inline-block" />
                    </span>
                  ) : (
                    <>
                      共{" "}
                      <span className="font-semibold text-gray-900">{filteredAndSortedPlans.length}</span>{" "}
                      个套餐
                      {activeFiltersCount > 0 && allPlans.length !== filteredAndSortedPlans.length && (
                        <span className="text-gray-400">
                          {" "}（已从 {allPlans.length} 个中筛选）
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>

              {/* 移动端筛选按钮 */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">筛选</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-sakura-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          );
        })()}

        {/* 主内容区：侧边栏 + 套餐列表 */}
        <div className="flex gap-8">
          {/* 桌面端侧边栏 */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <SearchFilterSidebar
                categories={tagCategories}
                selectedTags={selectedTags}
                onTagsChange={handleTagsChange}
                priceRange={priceRange}
                onPriceChange={handlePriceChange}
                maxPrice={maxPrice}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* 套餐列表 */}
          <div className="flex-1 min-w-0">
            {/* 加载中骨架屏 - 内部或外部导航时显示 */}
            {(isPending || isExternalNavigation) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <PlanCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* 无结果提示 */}
            {!isPending && !isExternalNavigation && filteredAndSortedPlans.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  暂无符合条件的套餐
                </h2>
                <p className="text-gray-500 mb-6">
                  试试调整筛选条件或查看其他主题
                </p>
                <div className="flex items-center justify-center gap-3">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleReset}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors"
                    >
                      清除筛选
                    </button>
                  )}
                  <button
                    onClick={() => handleThemeChange(null)}
                    className="px-6 py-2.5 bg-sakura-500 text-white font-medium rounded-full hover:bg-sakura-600 transition-colors"
                  >
                    查看全部套餐
                  </button>
                </div>
              </div>
            )}

            {/* 套餐网格 - Airbnb 风格大卡片 */}
            {!isPending && !isExternalNavigation && filteredAndSortedPlans.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedPlans.map((plan) => (
                  <div key={plan.id} className="search-plan-card">
                    <PlanCard plan={plan} showMerchant={true} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端筛选抽屉 */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* 抽屉内容 */}
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">筛选条件</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 抽屉内容 - 滚动区域 */}
            <div className="flex-1 overflow-y-auto">
              <SearchFilterSidebar
                categories={tagCategories}
                selectedTags={selectedTags}
                onTagsChange={handleTagsChange}
                priceRange={priceRange}
                onPriceChange={handlePriceChange}
                maxPrice={maxPrice}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                onReset={handleReset}
              />
            </div>

            {/* 抽屉底部 */}
            <div className="border-t border-gray-200 px-5 py-4 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                重置
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 px-4 py-3 bg-sakura-500 text-white font-medium rounded-xl hover:bg-sakura-600 transition-colors"
              >
                查看 {filteredAndSortedPlans.length} 个结果
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 套餐卡片骨架屏 - 匹配搜索页 PlanCard 样式
function PlanCardSkeleton() {
  return (
    <div>
      {/* 图片骨架 - 4:3 比例，圆角 */}
      <div className="aspect-[4/3] bg-gray-200 animate-pulse rounded-xl" />

      {/* 内容骨架 */}
      <div className="mt-3 space-y-1">
        {/* 标题 */}
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />

        {/* 商家名称 */}
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />

        {/* 价格 */}
        <div className="flex items-baseline gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* 包含物 */}
        <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />

        {/* 标签 */}
        <div className="flex gap-1 pt-0.5">
          <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function SearchClient(props: SearchClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sakura-500 border-t-transparent"></div>
        </div>
      }
    >
      <SearchClientInner {...props} />
    </Suspense>
  );
}
