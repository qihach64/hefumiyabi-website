import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TryOnResult {
  planId: string;
  planName: string;
  planImageUrl: string;
  originalPhoto: string; // 用户原始照片 (base64)
  resultPhoto: string; // 试穿结果照片 (URL)
  timestamp: number; // 试穿时间戳
}

interface TryOnStore {
  // 试穿缓存 Map: planId -> TryOnResult
  tryOnCache: Record<string, TryOnResult>;

  // 添加试穿结果
  addTryOnResult: (result: TryOnResult) => void;

  // 获取指定套餐的试穿结果
  getTryOnResult: (planId: string) => TryOnResult | null;

  // 删除指定套餐的试穿结果
  removeTryOnResult: (planId: string) => void;

  // 清除所有试穿缓存
  clearAllTryOns: () => void;

  // 清除过期的试穿记录（30天）
  clearExpiredTryOns: () => void;
}

export const useTryOnStore = create<TryOnStore>()(
  persist(
    (set, get) => ({
      tryOnCache: {},

      addTryOnResult: (result) => {
        set((state) => ({
          tryOnCache: {
            ...state.tryOnCache,
            [result.planId]: result,
          },
        }));
      },

      getTryOnResult: (planId) => {
        return get().tryOnCache[planId] || null;
      },

      removeTryOnResult: (planId) => {
        set((state) => {
          const newCache = { ...state.tryOnCache };
          delete newCache[planId];
          return { tryOnCache: newCache };
        });
      },

      clearAllTryOns: () => {
        set({ tryOnCache: {} });
      },

      clearExpiredTryOns: () => {
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        set((state) => {
          const newCache: Record<string, TryOnResult> = {};
          Object.entries(state.tryOnCache).forEach(([planId, result]) => {
            if (now - result.timestamp < thirtyDays) {
              newCache[planId] = result;
            }
          });
          return { tryOnCache: newCache };
        });
      },
    }),
    {
      name: "tryon-storage", // localStorage key
    }
  )
);
