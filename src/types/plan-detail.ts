/**
 * 套餐详情页类型定义
 * 从 planService 导入核心类型，定义组件 Props
 */

// 从 Service 层导出的类型
export type {
  PlanDetailData,
  PlanDetailStoreData,
  PlanDetailComponentData,
  PlanDetailUpgradeData,
  PlanDetailTagData,
  RelatedPlanData,
} from '@/server/services/plan.service';

// 为组件方便使用的别名
export type StoreData = import('@/server/services/plan.service').PlanDetailStoreData;
export type UpgradeData = import('@/server/services/plan.service').PlanDetailUpgradeData;
export type TagData = import('@/server/services/plan.service').PlanDetailTagData;
export type ComponentData = import('@/server/services/plan.service').PlanDetailComponentData;

// 组件 Props 类型定义

export interface PlanDetailHeaderProps {
  breadcrumb: { themeName: string; planName: string };
  merchantName: string;
  region?: string;
  tags: TagData[];
}

export interface PlanDetailContentProps {
  plan: {
    id: string;
    name: string;
    description: string;
    images: string[];
    components: ComponentData[];
    price: number;
    originalPrice?: number;
    highlights: string[];
    isCampaign: boolean;
  };
  campaign?: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
  };
  mapData: unknown;
  showAITryOn: boolean;
}

export interface PlanDetailSidebarProps {
  upgrades: UpgradeData[];
  store: StoreData | null;
  stores: StoreData[];
  duration: number;
  selectedUpgrades: UpgradeData[];
  onUpgradeChange: (upgrades: UpgradeData[]) => void;
}

export interface BookingCardProps {
  planId: string;
  planName: string;
  price: number;
  originalPrice?: number;
  storeId: string | null;
  selectedUpgrades: UpgradeData[];
}

export interface MiniBookingBarProps {
  price: number;
  originalPrice?: number;
  onBook: () => void;
}

export interface RelatedPlansProps {
  plans: import('@/server/services/plan.service').RelatedPlanData[];
  currentStoreId?: string;
}
