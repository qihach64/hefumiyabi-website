import { create } from "zustand";
import { persist } from "zustand/middleware";

// 表单数据类型（对应编辑器中的所有字段）
export interface PlanFormData {
  // 基本信息
  name: string;
  description: string;
  highlights: string;

  // 价格信息（以元为单位，提交时转换为分）
  price: number;
  originalPrice: number | string;
  depositAmount: number | string;

  // 计价单位
  pricingUnit: "person" | "group";
  unitLabel: string;
  unitDescription: string;
  minQuantity: number;
  maxQuantity: number;

  // 时长
  duration: number;

  // 图片
  imageUrl: string;
  images: string[];
  customMapImageUrl: string; // 自定义热点图背景

  // 店铺信息
  storeName: string;
  region: string;

  // 主题和标签
  themeId: string | null;
  selectedTagIds: string[];

  // 限量和时间限制
  isLimited: boolean;
  maxBookings: number | null;
  availableFrom: string | null;
  availableUntil: string | null;

  // 状态
  isFeatured: boolean;
  isActive: boolean;
}

// 组件配置类型
export interface ComponentConfig {
  merchantComponentId: string;
  hotmapX?: number | null;
  hotmapY?: number | null;
  hotmapLabelPosition?: string;
  hotmapLabelOffsetX?: number; // 标签 X 偏移（像素）
  hotmapLabelOffsetY?: number; // 标签 Y 偏移（像素）
  hotmapOrder?: number;
}

// 升级服务配置类型
export interface UpgradeConfig {
  merchantComponentId: string;
  priceOverride: number | null;
  isPopular: boolean;
  displayOrder: number;
}

// 草稿数据
export interface PlanDraft {
  formData: PlanFormData;
  componentConfigs: ComponentConfig[];
  selectedMerchantComponentIds: string[];
  upgradeConfigs: UpgradeConfig[]; // 新增：升级服务配置
  lastSaved: string; // ISO 日期字符串
  isDirty: boolean;
}

// 默认表单数据
export const defaultFormData: PlanFormData = {
  name: "",
  description: "",
  highlights: "",
  price: 0,
  originalPrice: "",
  depositAmount: "",
  pricingUnit: "person",
  unitLabel: "人",
  unitDescription: "",
  minQuantity: 1,
  maxQuantity: 10,
  duration: 4,
  imageUrl: "",
  images: [],
  customMapImageUrl: "",
  storeName: "",
  region: "",
  themeId: null,
  selectedTagIds: [],
  isLimited: false,
  maxBookings: null,
  availableFrom: null,
  availableUntil: null,
  isFeatured: false,
  isActive: true,
};

interface PlanDraftStore {
  // 草稿存储（按 planId 索引）
  drafts: Record<string, PlanDraft>;

  // 保存草稿
  saveDraft: (
    planId: string,
    formData: PlanFormData,
    componentConfigs: ComponentConfig[],
    selectedMerchantComponentIds: string[],
    upgradeConfigs?: UpgradeConfig[]
  ) => void;

  // 获取草稿
  getDraft: (planId: string) => PlanDraft | null;

  // 清除草稿
  clearDraft: (planId: string) => void;

  // 标记为脏（有未保存的更改）
  markDirty: (planId: string) => void;

  // 标记为已保存
  markSaved: (planId: string) => void;

  // 检查是否有草稿
  hasDraft: (planId: string) => boolean;

  // 获取上次保存时间
  getLastSaved: (planId: string) => Date | null;
}

export const usePlanDraftStore = create<PlanDraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (planId, formData, componentConfigs, selectedMerchantComponentIds, upgradeConfigs = []) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [planId]: {
              formData,
              componentConfigs,
              selectedMerchantComponentIds,
              upgradeConfigs,
              lastSaved: new Date().toISOString(),
              isDirty: false,
            },
          },
        }));
      },

      getDraft: (planId) => {
        return get().drafts[planId] || null;
      },

      clearDraft: (planId) => {
        set((state) => {
          const { [planId]: _, ...rest } = state.drafts;
          return { drafts: rest };
        });
      },

      markDirty: (planId) => {
        set((state) => {
          const draft = state.drafts[planId];
          if (!draft) return state;
          return {
            drafts: {
              ...state.drafts,
              [planId]: { ...draft, isDirty: true },
            },
          };
        });
      },

      markSaved: (planId) => {
        set((state) => {
          const draft = state.drafts[planId];
          if (!draft) return state;
          return {
            drafts: {
              ...state.drafts,
              [planId]: {
                ...draft,
                isDirty: false,
                lastSaved: new Date().toISOString(),
              },
            },
          };
        });
      },

      hasDraft: (planId) => {
        return !!get().drafts[planId];
      },

      getLastSaved: (planId) => {
        const draft = get().drafts[planId];
        return draft ? new Date(draft.lastSaved) : null;
      },
    }),
    {
      name: "plan-draft-storage",
      // 只持久化 drafts
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);

// Hook: 自动保存草稿（防抖）
export function useAutoSaveDraft(
  planId: string,
  formData: PlanFormData,
  componentConfigs: ComponentConfig[],
  selectedMerchantComponentIds: string[],
  upgradeConfigs: UpgradeConfig[] = [],
  debounceMs: number = 3000
) {
  const { saveDraft, markDirty } = usePlanDraftStore();

  // 使用 React 的 useEffect 和 setTimeout 实现防抖
  // 这个 hook 应该在组件中调用，这里只是返回必要的函数
  return {
    save: () => {
      saveDraft(planId, formData, componentConfigs, selectedMerchantComponentIds, upgradeConfigs);
    },
    markDirty: () => {
      markDirty(planId);
    },
  };
}
