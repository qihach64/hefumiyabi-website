import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CachedTryOnResult } from '../types';

interface TryOnStore {
  // Try-on cache Map: planId -> TryOnResult
  tryOnCache: Record<string, CachedTryOnResult>;

  // Add try-on result
  addTryOnResult: (result: CachedTryOnResult) => void;

  // Get try-on result for specific plan
  getTryOnResult: (planId: string) => CachedTryOnResult | null;

  // Remove try-on result for specific plan
  removeTryOnResult: (planId: string) => void;

  // Clear all try-on cache
  clearAllTryOns: () => void;

  // Clear expired try-on records (30 days)
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

          // Limit to 10 records max (to avoid localStorage quota exceeded)
          if (keys.length >= 10 && !cache[result.planId]) {
            // Remove oldest record
            const oldest = keys.reduce((min, key) =>
              cache[key].timestamp < cache[min].timestamp ? key : min
            );
            delete cache[oldest];
            console.log('[TryOnStore] Removed oldest result:', oldest);
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
          const newCache: Record<string, CachedTryOnResult> = {};
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
      name: 'tryon-storage', // localStorage key
    }
  )
);
