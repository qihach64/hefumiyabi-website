"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart, Zap, Sparkles, MapPin, Store as StoreIcon, Tag, X, Filter } from "lucide-react";
import { useCartStore } from "@/store/cart";

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

  // 立即预约函数
  const handleQuickBook = (plan: RentalPlan) => {
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
      router.push("/cart");
    }, 500);
  };

  // 套餐卡片组件
  const PlanCard = ({ plan }: { plan: RentalPlan }) => {
    // 计算优惠幅度
    const discountPercent = plan.originalPrice && plan.originalPrice > plan.price
      ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
      : 0;

    return (
    <div className="relative overflow-hidden rounded-lg border bg-card hover:shadow-xl transition-all duration-300 group">
      {/* 优惠标签 */}
      {discountPercent > 0 && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            省¥{((plan.originalPrice! - plan.price) / 100).toFixed(0)}
          </div>
          {discountPercent >= 30 && (
            <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              限时{discountPercent}% OFF
            </div>
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

        {/* 标签区域：地区、店铺、特色标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* 地区标签 */}
          {plan.region && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3 text-blue-600" />
              <span>{plan.region}</span>
            </div>
          )}
          
          {/* 店铺标签 */}
          {plan.storeName && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <StoreIcon className="w-3 h-3 text-green-600" />
              <span>{plan.storeName}</span>
            </div>
          )}
          
          {/* 特色标签 */}
          {plan.tags && plan.tags.slice(0, 2).map((tag, index) => (
            <div key={index} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <Tag className="w-3 h-3 text-amber-600" />
              <span>{tag}</span>
            </div>
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

        {/* 按钮 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleQuickBook(plan)}
            disabled={addingToCart === plan.id}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-50"
          >
            {addingToCart === plan.id ? (
              <>
                <Check className="w-4 h-4" />
                <span>处理中...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>立即预约</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleAddToCart(plan)}
            disabled={addingToCart === plan.id}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 disabled:opacity-50"
          >
            {addingToCart === plan.id ? (
              <>
                <Check className="w-4 h-4" />
                <span>已加入</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>加入购物车</span>
              </>
            )}
          </button>
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
              onClick={() => setShowOnlyCampaigns(!showOnlyCampaigns)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                showOnlyCampaigns
                  ? 'bg-amber-500 text-white font-medium'
                  : 'hover:bg-secondary'
              }`}
            >
              🎊 仅限时优惠
            </button>
            
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
            
            {/* 活动列表 */}
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => setSelectedCampaignId(campaign.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCampaignId === campaign.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-secondary'
                }`}
              >
                {campaign.title}
              </button>
            ))}
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
      {/* 精简的头部 */}
      <section className="bg-background border-b">
        <div className="container py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">租赁套餐</h1>
              <p className="text-sm text-muted-foreground mt-1">
                在线预订享受专属优惠价格
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 主内容区域 - 侧边栏布局 */}
      <section className="py-6 bg-background">
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-bold text-sm">限时优惠</span>
                    </div>
                    <span className="text-xl font-bold">🎉 最高享50%优惠</span>
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCampaignPlans.map((plan) => (
                      <div key={plan.id} className="relative">
                        {/* 活动徽章 */}
                        <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                          {plan.campaign?.title || '限时优惠'}
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

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredRegularPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} />
                    ))}
                  </div>
                </div>
              )}

              {/* 无结果提示 */}
              {filteredPlans.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold mb-2">未找到匹配的套餐</h3>
                  <p className="text-muted-foreground mb-6">
                    请尝试调整筛选条件
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
                  >
                    <X className="w-4 h-4" />
                    清除所有筛选
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 精简的服务说明 */}
      <section className="py-8 bg-secondary/20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">👘</span>
              <span className="text-muted-foreground">专业着装</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">💇</span>
              <span className="text-muted-foreground">免费发型</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="text-muted-foreground">配件齐全</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">💳</span>
              <span className="text-muted-foreground">在线优惠</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
