"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart, Sparkles, MapPin, Store as StoreIcon, Tag, X, Filter } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { Button, Badge } from "@/components/ui";

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

interface RentalPlan {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  price: number;
  originalPrice?: number; // 原价（线下价格）
  category: string;
  duration: number;
  includes: string[];
  imageUrl?: string;
  storeName?: string; // 店铺名称
  region?: string; // 地区
  tags?: string[]; // 标签
  
  // 活动相关字段
  isCampaign?: boolean;
  campaignId?: string;
  campaign?: Campaign;
  isLimited?: boolean;
  maxBookings?: number;
  currentBookings?: number;
  availableFrom?: Date | string;
  availableUntil?: Date | string;
}

interface PlansClientProps {
  plans: RentalPlan[];
  campaigns: Campaign[];
  stores: Store[];
}

export default function PlansClient({
  plans,
  campaigns,
  stores,
}: PlansClientProps) {
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showOnlyCampaigns, setShowOnlyCampaigns] = useState<boolean>(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { addItem } = useCartStore();

  // 所有套餐
  const allPlans = plans;

  // 临时判断：通过套餐名称判断是否为活动套餐（数据库同步前的兼容方案）
  const isCampaignPlan = (plan: RentalPlan) => {
    if (plan.isCampaign !== undefined) {
      return plan.isCampaign; // 如果字段存在，使用它
    }
    // 否则通过名称判断
    const name = plan.name || '';
    return name.includes('10周年') || 
           name.includes('10週年') || 
           name.includes('10th') ||
           name.includes('优惠') ||
           name.includes('優惠') ||
           name.includes('限定') ||
           name.includes('special') ||
           name.includes('campaign');
  };

  // 提取所有唯一的地区
  const regions = Array.from(new Set(allPlans.map(p => p.region).filter(Boolean))) as string[];

  // 提取所有唯一的标签
  const allTags = Array.from(
    new Set(allPlans.flatMap(p => p.tags || []).filter(Boolean))
  ) as string[];

  // 只显示有对应套餐的活动
  const campaignsWithPlans = campaigns.filter(campaign => 
    allPlans.some(plan => plan.campaignId === campaign.id)
  );

  // 统一筛选逻辑
  const filteredPlans = allPlans.filter(plan => {
    // 仅显示活动套餐（使用兼容判断）
    if (showOnlyCampaigns && !isCampaignPlan(plan)) {
      return false;
    }
    
    // 活动筛选（使用兼容判断）
    if (selectedCampaignId) {
      // 如果没有 campaignId 字段，通过名称匹配
      if (!plan.campaignId && !isCampaignPlan(plan)) {
        return false;
      }
      // 如果有 campaignId 字段，使用它
      if (plan.campaignId && plan.campaignId !== selectedCampaignId) {
        return false;
      }
    }
    
    // 店铺筛选
    if (selectedStoreId) {
      const selectedStore = stores.find(s => s.id === selectedStoreId);
      if (selectedStore && plan.storeName && !plan.storeName.includes(selectedStore.name)) {
        return false;
      }
    }

    // 地区筛选
    if (selectedRegion && plan.region !== selectedRegion) {
      return false;
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      if (!plan.tags || !selectedTags.some(tag => plan.tags?.includes(tag))) {
        return false;
      }
    }

    return true;
  });
  
  // 分组：活动套餐和常规套餐（使用兼容判断）
  const filteredCampaignPlans = filteredPlans.filter(p => isCampaignPlan(p));
  const filteredRegularPlans = filteredPlans.filter(p => !isCampaignPlan(p));

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 清除所有筛选
  const clearFilters = () => {
    setSelectedStoreId(null);
    setSelectedRegion(null);
    setSelectedTags([]);
    setSelectedCampaignId(null);
    setShowOnlyCampaigns(false);
  };

  const hasActiveFilters = 
    selectedStoreId || 
    selectedRegion || 
    selectedTags.length > 0 || 
    selectedCampaignId || 
    showOnlyCampaigns;

  // 分类标签映射
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      LADIES: "女士套餐",
      MENS: "男士套餐",
      COUPLE: "情侣套餐",
      FAMILY: "亲子套餐",
      GROUP: "团体套餐",
      SPECIAL: "特别套餐",
    };
    return labels[category] || "套餐";
  };

  // 加入购物车函数
  const handleAddToCart = (plan: RentalPlan) => {
    setAddingToCart(plan.id);

    addItem({
      type: "PLAN",
      planId: plan.id,
      name: plan.name,
      price: plan.price,
      originalPrice: plan.originalPrice,
      addOns: [],
      image: plan.imageUrl,
      storeId: undefined,
      storeName: undefined,
      planStoreName: plan.storeName,
      isCampaign: plan.isCampaign,
    });

    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  // 套餐卡片组件
  const PlanCard = ({ plan }: { plan: RentalPlan }) => {
    // 计算优惠幅度
    const discountPercent = plan.originalPrice && plan.originalPrice > plan.price
      ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
      : 0;

    return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group">
      {/* 优惠标签 - 使用 Badge 组件 */}
      {discountPercent > 0 && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <Badge variant="error" size="md" className="shadow-md">
            省¥{((plan.originalPrice! - plan.price) / 100).toFixed(0)}
          </Badge>
          {discountPercent >= 30 && (
            <Badge variant="warning" size="md" className="shadow-md animate-pulse">
              限时{discountPercent}% OFF
            </Badge>
          )}
        </div>
      )}

      {/* 图片区域 */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        {plan.imageUrl ? (
          <Image
            src={plan.imageUrl}
            alt={plan.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <span className="text-6xl opacity-20">👘</span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        <div className="mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {getCategoryLabel(plan.category)}
          </span>
          <h3 className="text-lg font-bold mt-2 mb-1 line-clamp-2">
            {plan.name}
          </h3>
          {plan.nameEn && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {plan.nameEn}
            </p>
          )}
        </div>

        <div className="mb-4">
          {/* 价格对比 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                ¥{(plan.price / 100).toLocaleString()}
              </span>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <span className="text-sm text-muted-foreground line-through">
                  ¥{(plan.originalPrice / 100).toLocaleString()}
                </span>
              )}
            </div>
            {/* 线上预约标签 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-semibold">
                💰 线上预约优惠价
              </span>
              {discountPercent > 0 && (
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                  立省{discountPercent}%
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {plan.duration} 小时
          </p>
        </div>

        {plan.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
            {plan.description}
          </p>
        )}

        {/* 标签区域：地区、店铺、特色标签 - 使用 Badge 组件 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* 地区标签 */}
          {plan.region && (
            <Badge variant="info" size="sm" rounded="md">
              <MapPin className="w-3 h-3" />
              {plan.region}
            </Badge>
          )}

          {/* 店铺标签 */}
          {plan.storeName && (
            <Badge variant="success" size="sm" rounded="md">
              <StoreIcon className="w-3 h-3" />
              {plan.storeName}
            </Badge>
          )}

          {/* 特色标签 */}
          {plan.tags && plan.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="sakura" size="sm" rounded="md">
              <Tag className="w-3 h-3" />
              {tag}
            </Badge>
          ))}
        </div>

        {plan.includes && plan.includes.length > 0 && (
          <div className="space-y-1 mb-4">
            {plan.includes.slice(0, 3).map((feature: string, index: number) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                <span className="line-clamp-1">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* 按钮 - 使用新的 Button 组件 */}
        <div className="flex flex-col gap-3">
          {/* AI 试穿按钮 */}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => {
              // 传递套餐图片和名称到 AI 试穿页面
              const params = new URLSearchParams({
                kimonoImage: plan.imageUrl || '',
                kimonoName: plan.name,
                planId: plan.id,
              });
              router.push(`/virtual-tryon?${params.toString()}`);
            }}
          >
            <Sparkles className="w-4 h-4" />
            AI 试穿
          </Button>

          {/* 加入购物车按钮 */}
          <Button
            variant="secondary"
            size="md"
            fullWidth
            disabled={addingToCart === plan.id}
            onClick={() => handleAddToCart(plan)}
          >
            {addingToCart === plan.id ? (
              <>
                <Check className="w-4 h-4" />
                已加入
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                加入购物车
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
    );
  };

  // 侧边栏筛选器组件
  const FilterSidebar = () => (
    <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
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

        {/* 活动筛选 */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            限时活动
          </h3>
          <div className="space-y-2">
            {/* 仅显示活动套餐 */}
            <button
              onClick={() => {
                setShowOnlyCampaigns(!showOnlyCampaigns);
                // 如果只有一个活动，切换时清除具体活动选择
                if (campaignsWithPlans.length === 1) {
                  setSelectedCampaignId(null);
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                showOnlyCampaigns
                  ? 'bg-amber-500 text-white font-medium'
                  : 'hover:bg-secondary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>🎊 所有优惠套餐</span>
                <span className="text-xs opacity-75">
                  ({filteredCampaignPlans.length})
                </span>
              </div>
            </button>
            
            {/* 只在有多个活动时显示具体活动筛选器 */}
            {campaignsWithPlans.length > 1 && (
              <>
                {/* 全部活动 */}
                <button
                  onClick={() => setSelectedCampaignId(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !selectedCampaignId
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-secondary'
                  }`}
                >
                  全部活动
                </button>
                
                {/* 活动列表（只显示有套餐的） */}
                {campaignsWithPlans.map((campaign) => {
                  const planCount = allPlans.filter(p => p.campaignId === campaign.id).length;
                  return (
                    <button
                      key={campaign.id}
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCampaignId === campaign.id
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{campaign.title}</span>
                        <span className="text-xs opacity-75 ml-2 flex-shrink-0">
                          ({planCount})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* 地区筛选 */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            地区
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedRegion(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                !selectedRegion
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-secondary'
              }`}
            >
              全部地区
            </button>
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedRegion === region
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-secondary'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* 店铺筛选 */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-green-600" />
            店铺
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedStoreId(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                !selectedStoreId
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-secondary'
              }`}
            >
              全部店铺
            </button>
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedStoreId === store.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-secondary'
                }`}
              >
                {store.name}
              </button>
            ))}
          </div>
        </div>

        {/* 标签筛选 */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-600" />
            特色标签
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-amber-500 text-white'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 筛选结果统计 */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          找到 {filteredPlans.length} 个套餐
          {filteredCampaignPlans.length > 0 && (
            <span className="block text-xs mt-1 text-amber-600">
              🎊 {filteredCampaignPlans.length} 个活动优惠
            </span>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* 主内容区域 - 侧边栏布局 */}
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
                        {(selectedStoreId ? 1 : 0) + (selectedRegion ? 1 : 0) + selectedTags.length}
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
              {/* 活动套餐 */}
              {filteredCampaignPlans.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-4 mb-8">
                    <Badge variant="warning" size="lg" className="shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      限时优惠
                    </Badge>
                    <span className="text-2xl font-bold text-gray-900">🎉 最高享50%优惠</span>
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCampaignPlans.map((plan) => (
                      <div key={plan.id} className="relative">
                        {/* 活动徽章 - 使用 Badge 组件 */}
                        <div className="absolute top-4 right-4 z-10">
                          <Badge variant="warning" size="md" className="shadow-md animate-pulse">
                            {plan.campaign?.title || '限时优惠'}
                          </Badge>
                        </div>
                        <PlanCard plan={plan} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 常规套餐 */}
              {filteredRegularPlans.length > 0 && (
                <div>
                  {filteredCampaignPlans.length > 0 && (
                    <h2 className="text-xl font-bold mb-6">更多套餐</h2>
                  )}

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredRegularPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} />
                    ))}
                  </div>
                </div>
              )}

              {/* 无结果提示 */}
              {filteredPlans.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-7xl mb-6">🔍</div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">未找到匹配的套餐</h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    请尝试调整筛选条件
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={clearFilters}
                  >
                    <X className="w-5 h-5" />
                    清除所有筛选
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
