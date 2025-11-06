"use client";

import { useState } from "react";
import PlanCard from "@/components/PlanCard";
import PlanCardGrid from "@/components/PlanCard/PlanCardGrid";
import { Sparkles, MapPin, Store as StoreIcon, Tag, X, Filter } from "lucide-react";
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
  originalPrice?: number; // 原价（线下价格）
  category: string;
  duration: number;
  includes: string[];
  imageUrl?: string;
  storeName?: string; // 店铺名称
  region?: string; // 地区
  tags?: string[]; // 旧的标签字段(兼容)
  planTags?: PlanTag[]; // 新的标签关联

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
  tagCategories: TagCategory[];
}

export default function PlansClient({
  plans,
  campaigns,
  stores,
  tagCategories,
}: PlansClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showOnlyCampaigns, setShowOnlyCampaigns] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(tagCategories.map(c => c.id)) // 默认全部展开
  );

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

    // 标签筛选 (使用新的标签系统)
    if (selectedTagIds.length > 0) {
      const planTagIds = plan.planTags?.map(pt => pt.tag.id) || [];
      if (!selectedTagIds.some(tagId => planTagIds.includes(tagId))) {
        return false;
      }
    }

    return true;
  });
  
  // 分组：活动套餐和常规套餐（使用兼容判断）
  const filteredCampaignPlans = filteredPlans.filter(p => isCampaignPlan(p));
  const filteredRegularPlans = filteredPlans.filter(p => !isCampaignPlan(p));

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
    setSelectedStoreId(null);
    setSelectedRegion(null);
    setSelectedTagIds([]);
    setSelectedCampaignId(null);
    setShowOnlyCampaigns(false);
  };

  const hasActiveFilters =
    selectedStoreId ||
    selectedRegion ||
    selectedTagIds.length > 0 ||
    selectedCampaignId ||
    showOnlyCampaigns;


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

        {/* 标签筛选 - 按分类分组(可折叠) */}
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
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isExpanded && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {category.tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        selectedTagIds.includes(tag.id)
                          ? 'text-white shadow-md scale-105'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      style={{
                        backgroundColor: selectedTagIds.includes(tag.id)
                          ? (tag.color || category.color || '#FF5580')
                          : undefined
                      }}
                    >
                      {tag.icon && <span className="mr-1">{tag.icon}</span>}
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

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

                  {/* Airbnb 风格网格：更宽松的间距 */}
                  <PlanCardGrid variant="grid-4">
                    {filteredCampaignPlans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        showMerchant={true}
                      />
                    ))}
                  </PlanCardGrid>
                </div>
              )}

              {/* 常规套餐 */}
              {filteredRegularPlans.length > 0 && (
                <div>
                  {filteredCampaignPlans.length > 0 && (
                    <h2 className="text-xl font-bold mb-6">更多套餐</h2>
                  )}

                  {/* Airbnb 风格网格 */}
                  <PlanCardGrid variant="grid-4">
                    {filteredRegularPlans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        showMerchant={true}
                      />
                    ))}
                  </PlanCardGrid>
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
