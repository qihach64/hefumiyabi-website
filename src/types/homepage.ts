/**
 * 首页数据类型定义
 * 用于 Server Component -> Client Component 数据传递
 * 只包含首页需要的字段，减少数据传输量
 */

// ============ 基础类型 ============

export interface HomepageTag {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface HomepagePlanTag {
  tag: HomepageTag;
}

// ============ 套餐卡片类型 ============

export interface HomepagePlanCard {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  region: string | null;
  merchantName: string;
  isCampaign: boolean;
  includes: string[];
  planTags: HomepagePlanTag[];
  themeId: string | null;
}

// ============ 主题分区类型 ============

export interface ThemeSection {
  id: string;
  slug: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  plans: HomepagePlanCard[];
}

// ============ 活动类型 ============

export interface HomepageCampaign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  startDate: Date;
  endDate: Date;
}

// ============ 店铺类型 ============

export interface HomepageStore {
  id: string;
  name: string;
  slug: string;
}

// ============ 标签分类类型 ============

export interface HomepageTagCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  tags: HomepageTag[];
}

// ============ 首页完整数据类型 ============

export interface HomepageData {
  themeSections: ThemeSection[];
  allPlans: HomepagePlanCard[];
  campaigns: HomepageCampaign[];
  stores: HomepageStore[];
  tagCategories: HomepageTagCategory[];
}

// ============ 服务层参数类型 ============

export interface GetHomepagePlansOptions {
  limitPerTheme?: number;
  searchLocation?: string;
}
