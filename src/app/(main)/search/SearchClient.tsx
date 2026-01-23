"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useCallback, useMemo, useTransition, useEffect, useRef } from "react";
import { PlanCard } from "@/features/guest/plans";
import ThemePills from "@/components/ThemePills";
import { SearchFilterSidebar } from "@/features/guest/discovery";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { getThemeIcon } from "@/lib/themeIcons";

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
  const [isPending, startTransition] = useTransition();

  // 本地 pending theme 状态 (用于即时 UI 反馈)
  const [pendingTheme, setPendingTheme] = useState<Theme | null | undefined>(undefined);

  // 使用 URL 作为真正的数据源来检测外部导航
  const urlThemeSlug = searchParams.get('theme');
  const currentThemeSlug = currentTheme?.slug;
  const isUrlMismatch = urlThemeSlug !== (currentThemeSlug || null);

  // 检查 pendingTheme 是否与服务端数据匹配（表示加载完成）
  const pendingThemeSlug = pendingTheme?.slug ?? (pendingTheme === null ? null : undefined);
  const isPendingComplete = pendingTheme !== undefined && pendingThemeSlug === (currentThemeSlug || null);

  // 统一的加载状态：本地 transition + URL 不匹配
  const isLoading = isPending || isUrlMismatch;

  // 当 pendingTheme 与服务端数据匹配时（表示加载完成），重置 pending 状态
  useEffect(() => {
    if (isPendingComplete) {
      setPendingTheme(undefined);
    }
  }, [isPendingComplete]);

  // 计算显示的主题：如果有 pendingTheme（正在切换），立即显示 pendingTheme；否则显示当前主题
  // pendingTheme !== undefined 表示有正在进行的切换
  const displayTheme = pendingTheme !== undefined ? pendingTheme : currentTheme;

  // ========== 客户端筛选状态 ==========
  // 这些状态用于前端即时过滤，不触发后端请求
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);
  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange);
  const [sortBy, setSortBy] = useState<string>(initialSortBy);

  // 移动端筛选抽屉状态
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pills 栏 Sticky 状态检测
  const [isPillsSticky, setIsPillsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 使用 IntersectionObserver 检测 Pills 栏是否触顶
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 当哨兵元素离开视口时，Pills 栏变为 sticky
        setIsPillsSticky(!entry.isIntersecting);
      },
      {
        // 考虑 Header 高度的偏移 (mobile: 64px, desktop: 80px)
        rootMargin: '-80px 0px 0px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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
    // 设置本地 pending 状态以实现即时 UI 反馈
    setPendingTheme(theme);

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

  // 获取当前显示主题的颜色
  const themeColor = displayTheme?.color || '#FF7A9A';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 哨兵元素 - 用于检测 Pills 栏是否触顶 */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden="true" />

      {/* 主题 Pills - Sticky 到 Header 下方 */}
      <div
        className={`sticky top-16 md:top-20 z-30 transition-all duration-300 ${
          isPillsSticky
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        {/* 底部渐变遮罩 - 只在 sticky 状态显示 */}
        <div
          className={`absolute inset-x-0 -bottom-4 h-4 pointer-events-none transition-opacity duration-300 ${
            isPillsSticky ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, transparent 100%)',
          }}
        />
        <div className="container py-3 md:py-4">
          <ThemePills
            themes={themes}
            selectedTheme={currentTheme || null}
            onSelect={handleThemeChange}
            isPending={isLoading}
            pendingTheme={pendingTheme}
          />
        </div>
      </div>

      {/* 标题区域 - 主题色渐变背景 */}
      <div
        className="transition-colors duration-500"
        style={{
          background: displayTheme
            ? `linear-gradient(to bottom, ${themeColor}10 0%, ${themeColor}05 60%, transparent 100%)`
            : undefined,
        }}
      >
        <div className="container py-6 pb-8">
          {/* 搜索摘要 + 移动端筛选按钮 */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {displayTheme ? (
                  (() => {
                    const IconComponent = getThemeIcon(displayTheme.icon);
                    return (
                      <span className="flex items-center gap-3">
                        <span
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: `${themeColor}15`,
                            border: `1px solid ${themeColor}25`,
                          }}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: themeColor }} />
                        </span>
                        <span style={{ color: themeColor }}>{displayTheme.name}</span>
                      </span>
                    );
                  })()
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
                    <span className="font-semibold" style={{ color: displayTheme ? themeColor : '#111827' }}>
                      {filteredAndSortedPlans.length}
                    </span>{" "}
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
                <span
                  className="text-white text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: themeColor }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区：白色背景 */}
      <div className="bg-white">
        <div className="container py-6">
          {/* 侧边栏 + 套餐列表 */}
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
            {/* 加载中骨架屏 - 统一使用 isLoading */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <PlanCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* 无结果提示 */}
            {!isLoading && filteredAndSortedPlans.length === 0 && (
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

            {/* 套餐网格 - 搜索页使用 3:4 比例 */}
            {!isLoading && filteredAndSortedPlans.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {filteredAndSortedPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    variant="soft"
                    showMerchant={true}
                    themeColor={themeColor}
                    aspectRatio="3:4"
                  />
                ))}
              </div>
            )}
          </div>
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

// 套餐卡片骨架屏 - 匹配 soft variant PlanCard 样式
function PlanCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] p-3">
      {/* 图片骨架 - 3:4 比例，圆角 */}
      <div className="aspect-[3/4] bg-gray-100 animate-pulse rounded-xl" />

      {/* 内容骨架 */}
      <div className="mt-3 space-y-2">
        {/* 商家 + 地区 */}
        <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />

        {/* 标题 */}
        <div className="h-5 w-4/5 bg-gray-100 rounded animate-pulse" />

        {/* 分隔线 */}
        <div className="h-px w-6 bg-gray-100 animate-pulse" />

        {/* 价格 */}
        <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />

        {/* 包含物 */}
        <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />

        {/* 标签 */}
        <div className="flex gap-1.5 pt-0.5">
          <div className="h-5 w-14 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
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
