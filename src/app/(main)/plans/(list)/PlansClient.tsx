"use client";

import { Suspense, useState, useMemo } from "react";
import { PlanCard } from "@/features/guest/plans";
import { ThemeImageSelector, SearchFilterSidebar } from "@/features/guest/discovery";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { getThemeIcon } from "@/lib/themeIcons";
import { useSearchState } from "@/shared/hooks";
import type { Theme } from "@/types";

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
  duration?: number;
  isCampaign?: boolean;
  includes?: string[];
  planTags?: PlanTag[];
  themeId?: string;
  themeName?: string;
  themeIcon?: string;
}

interface PlansClientProps {
  themes: Theme[];
  plans: Plan[]; // 服务端提供的所有套餐，客户端负责筛选
  tagCategories: TagCategory[];
  maxPrice: number;
}

function PlansClientInner({
  themes,
  plans: serverPlans, // 服务端传来的完整套餐列表
  tagCategories,
  maxPrice,
}: PlansClientProps) {
  // 使用 useSearchState 管理 URL 状态
  const {
    theme: urlThemeSlug,
    setTheme: setUrlTheme,
    location: urlLocation,
    tags: urlTags,
    setTags: setUrlTags,
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
    setPriceRange: setUrlPriceRange,
    sort: urlSort,
    setSort: setUrlSort,
    clearFilters,
    clearAll,
  } = useSearchState();

  // 从 URL 派生当前主题
  const currentTheme = useMemo(
    () => (urlThemeSlug ? themes.find((t) => t.slug === urlThemeSlug) : null),
    [urlThemeSlug, themes]
  );

  // 本地 pending theme 状态 (用于即时 UI 反馈)
  const [pendingTheme, setPendingTheme] = useState<Theme | null | undefined>(undefined);

  // 计算显示的主题：如果有 pendingTheme（正在切换），立即显示 pendingTheme；否则显示当前主题
  const displayTheme = pendingTheme !== undefined ? pendingTheme : currentTheme;

  // ========== 客户端筛选状态 (从 URL 同步) ==========
  const selectedTags = urlTags ?? [];
  const priceRange: [number, number] = [urlMinPrice ?? 0, urlMaxPrice ?? maxPrice];
  const sortBy = urlSort ?? "recommended";

  // 移动端筛选抽屉状态
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // 注意：Pills 栏的 Sticky 状态检测已移到 ClientThemePills 组件

  // ========== 前端过滤逻辑 ==========
  const filteredAndSortedPlans = useMemo(() => {
    let result = [...serverPlans];

    // 1. 主题过滤
    if (urlThemeSlug) {
      const themeId = themes.find((t) => t.slug === urlThemeSlug)?.id;
      if (themeId) {
        result = result.filter((plan) => plan.themeId === themeId);
      }
    }

    // 2. 地区过滤
    if (urlLocation) {
      const locationLower = urlLocation.toLowerCase();
      result = result.filter(
        (plan) =>
          plan.region?.toLowerCase().includes(locationLower) ||
          plan.merchantName?.toLowerCase().includes(locationLower)
      );
    }

    // 3. 标签过滤 (AND 逻辑)
    if (selectedTags.length > 0) {
      result = result.filter((plan) => {
        const planTagCodes = plan.planTags?.map((pt) => pt.tag.code) || [];
        return selectedTags.every((tagCode) => planTagCodes.includes(tagCode));
      });
    }

    // 4. 价格过滤
    if (priceRange[0] > 0 || priceRange[1] < maxPrice) {
      result = result.filter((plan) => {
        const price = plan.price;
        const minOk = priceRange[0] <= 0 || price >= priceRange[0];
        const maxOk = priceRange[1] >= maxPrice || price <= priceRange[1];
        return minOk && maxOk;
      });
    }

    // 5. 排序
    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => {
          const aScore = (a.isCampaign ? 100 : 0) + (a.originalPrice ? 50 : 0);
          const bScore = (b.isCampaign ? 100 : 0) + (b.originalPrice ? 50 : 0);
          return bScore - aScore;
        });
        break;
      case "recommended":
      default:
        result.sort((a, b) => {
          if (a.isCampaign !== b.isCampaign) return a.isCampaign ? -1 : 1;
          if (!!a.originalPrice !== !!b.originalPrice) return a.originalPrice ? -1 : 1;
          return a.price - b.price;
        });
        break;
    }

    return result;
  }, [serverPlans, urlThemeSlug, urlLocation, selectedTags, priceRange, sortBy, maxPrice, themes]);

  // ========== 主题切换（客户端过滤，无需服务端重新查询）==========
  const handleThemeChange = async (theme: Theme | null) => {
    // 设置本地 pending 状态以实现即时 UI 反馈
    setPendingTheme(theme);

    // 使用 nuqs 同步更新主题和清除筛选条件
    await Promise.all([clearFilters(), setUrlTheme(theme?.slug ?? null)]);

    // 重置 pending 状态
    setPendingTheme(undefined);
  };

  // ========== 标签变更（前端过滤，URL 自动同步）==========
  const handleTagsChange = (tags: string[]) => {
    setUrlTags(tags.length > 0 ? tags : null);
  };

  // ========== 价格变更（前端过滤，URL 自动同步）==========
  const handlePriceChange = (range: [number, number]) => {
    setUrlPriceRange([range[0] > 0 ? range[0] : null, range[1] < maxPrice ? range[1] : null]);
  };

  // ========== 排序变更（前端过滤，URL 自动同步）==========
  const handleSortChange = (sort: string) => {
    setUrlSort(sort === "recommended" ? null : sort);
  };

  // ========== 重置所有筛选 ==========
  const handleReset = () => {
    clearFilters();
  };

  // 计算活跃筛选数量
  const activeFiltersCount =
    selectedTags.length +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (sortBy !== "recommended" ? 1 : 0);

  // 获取当前显示主题的颜色
  const themeColor = displayTheme?.color || "#D45B47";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部区域 - 微妙的主题色渐变背景 */}
      <div
        className="transition-colors duration-500"
        style={{
          background: `linear-gradient(to bottom, ${themeColor}08 0%, ${themeColor}03 50%, transparent 100%)`,
        }}
      >
        <div className="container">
          {/* 1. 主题选择器 - 放在最上方 */}
          <div className="pt-6 md:pt-8 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">
                选择主题
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <ThemeImageSelector
              themes={themes}
              selectedTheme={currentTheme || null}
              onSelect={handleThemeChange}
              isPending={pendingTheme !== undefined}
              pendingThemeSlug={pendingTheme?.slug ?? (pendingTheme === null ? null : undefined)}
            />
          </div>

          {/* 2. 主题介绍 + 筛选按钮 - 与首页 ScrollableSection 样式一致 */}
          <div className="pb-6 md:pb-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-4 md:gap-5 flex-1 min-w-0">
                {/* 主题图标 - 与首页一致的突出设计 */}
                {(() => {
                  const ThemeIcon = getThemeIcon(displayTheme?.icon);
                  return (
                    <div
                      className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}25 100%)`,
                        border: `2px solid ${themeColor}30`,
                        boxShadow: `0 4px 12px ${themeColor}20, 0 2px 4px ${themeColor}10`,
                      }}
                    >
                      <ThemeIcon className="w-7 h-7 md:w-8 md:h-8" style={{ color: themeColor }} />
                    </div>
                  );
                })()}

                {/* 标题和描述 - 与首页一致的视觉层次 */}
                <div className="flex flex-col flex-1 min-w-0">
                  <h1
                    className="text-2xl md:text-3xl lg:text-[36px] font-extrabold leading-[1.15] tracking-[-0.03em] mb-2.5"
                    style={{
                      color: themeColor,
                      textShadow: `0 2px 12px ${themeColor}20, 0 1px 3px ${themeColor}10`,
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {displayTheme ? displayTheme.name : "探索和服体验"}
                  </h1>

                  {/* 主题描述 */}
                  {displayTheme?.description ? (
                    <p
                      className="text-sm md:text-base font-medium leading-relaxed tracking-wide mb-2"
                      style={{ color: `${themeColor}aa` }}
                    >
                      {displayTheme.description}
                    </p>
                  ) : (
                    !displayTheme && (
                      <p
                        className="text-sm md:text-base font-medium leading-relaxed tracking-wide mb-2"
                        style={{ color: `${themeColor}aa` }}
                      >
                        浏览我们精心策划的所有和服体验套餐，找到最适合您的款式与风格。
                      </p>
                    )
                  )}

                  {/* 套餐数量 */}
                  <p className="text-[14px] text-gray-500">
                    共{" "}
                    <span className="font-medium text-gray-700">
                      {filteredAndSortedPlans.length}
                    </span>{" "}
                    个套餐
                    {activeFiltersCount > 0 &&
                      serverPlans.length !== filteredAndSortedPlans.length && (
                        <span className="text-gray-400 ml-1">· 已筛选</span>
                      )}
                  </p>
                </div>
              </div>

              {/* 移动端筛选按钮 */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                <span className="text-[14px] font-medium text-gray-700">筛选</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-gray-900 text-white text-[11px] font-medium w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* 分割线 - 与首页一致 */}
            <div
              className="h-[1px] transition-colors duration-300"
              style={{
                background: `linear-gradient(to right, transparent 0%, ${themeColor}25 20%, ${themeColor}30 50%, ${themeColor}25 80%, transparent 100%)`,
              }}
            />
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
              {/* 无结果提示 */}
              {filteredAndSortedPlans.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">暂无符合条件的套餐</h2>
                  <p className="text-gray-500 mb-6">试试调整筛选条件或查看其他主题</p>
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
                      onClick={() => {
                        setPendingTheme(null);
                        clearAll();
                      }}
                      className="px-6 py-2.5 bg-sakura-500 text-white font-medium rounded-full hover:bg-sakura-600 transition-colors"
                    >
                      查看全部套餐
                    </button>
                  </div>
                </div>
              ) : (
                /* 套餐网格 - 搜索页使用 3:4 比例 */
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

export default function PlansClient(props: PlansClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sakura-500 border-t-transparent"></div>
        </div>
      }
    >
      <PlansClientInner {...props} />
    </Suspense>
  );
}
