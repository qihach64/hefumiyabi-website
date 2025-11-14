import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TryOnResult {
  planId: string;
  planName: string;
  planImageUrl: string;
  // 移除 originalPhoto，节省 localStorage 空间（1-2MB）
  resultPhoto: string; // 试穿结果照片 (URL，从 Supabase Storage)
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
        set((state) => {
          const cache = { ...state.tryOnCache };
          const keys = Object.keys(cache);

          // 限制最多存储 10 条记录（避免 localStorage quota 超限）
          if (keys.length >= 10 && !cache[result.planId]) {
            // 删除最老的记录
            const oldest = keys.reduce((min, key) =>
              cache[key].timestamp < cache[min].timestamp ? key : min
            );
            delete cache[oldest];
            console.log('🗑️ Removed oldest try-on result:', oldest);
          }

          cache[result.planId] = result;
          return { tryOnCache: cache };
        });
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
