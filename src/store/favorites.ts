import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteImage {
  planId: string;
  planName: string;
  imageUrl: string;
  savedAt: string;
}

interface FavoritesState {
  favorites: FavoriteImage[];
  isSynced: boolean;
  isSyncing: boolean;

  // 添加收藏
  addFavorite: (item: Omit<FavoriteImage, 'savedAt'>) => void;

  // 移除收藏
  removeFavorite: (planId: string, imageUrl: string) => void;

  // 切换收藏状态
  toggleFavorite: (item: Omit<FavoriteImage, 'savedAt'>) => boolean;

  // 检查是否已收藏
  isFavorite: (planId: string, imageUrl: string) => boolean;

  // 获取套餐的所有收藏图片
  getPlanFavorites: (planId: string) => FavoriteImage[];

  // 同步到服务器 (登录后调用)
  syncToServer: () => Promise<void>;

  // 添加单个收藏到服务器
  addToServer: (item: Omit<FavoriteImage, 'savedAt'>) => Promise<void>;

  // 从服务器删除收藏
  removeFromServer: (planId: string, imageUrl: string) => Promise<void>;

  // 清空所有收藏
  clearAll: () => void;

  // 设置同步状态
  setSynced: (synced: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isSynced: false,
      isSyncing: false,

      addFavorite: (item) => {
        const newFavorite: FavoriteImage = {
          ...item,
          savedAt: new Date().toISOString(),
        };
        set((state) => ({
          favorites: [...state.favorites, newFavorite],
        }));
      },

      removeFavorite: (planId, imageUrl) => {
        set((state) => ({
          favorites: state.favorites.filter(
            (f) => !(f.planId === planId && f.imageUrl === imageUrl)
          ),
        }));
      },

      toggleFavorite: (item) => {
        const { isFavorite, addFavorite, removeFavorite, addToServer, removeFromServer } = get();
        const isFav = isFavorite(item.planId, item.imageUrl);

        if (isFav) {
          removeFavorite(item.planId, item.imageUrl);
          // 异步删除服务器端
          removeFromServer(item.planId, item.imageUrl).catch(console.error);
          return false;
        } else {
          addFavorite(item);
          // 异步同步到服务器
          addToServer(item).catch(console.error);
          return true;
        }
      },

      isFavorite: (planId, imageUrl) => {
        return get().favorites.some(
          (f) => f.planId === planId && f.imageUrl === imageUrl
        );
      },

      getPlanFavorites: (planId) => {
        return get().favorites.filter((f) => f.planId === planId);
      },

      syncToServer: async () => {
        const { favorites, isSyncing } = get();
        if (isSyncing) return;

        set({ isSyncing: true });

        try {
          const response = await fetch('/api/favorites/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ localFavorites: favorites }),
          });

          if (response.ok) {
            const data = await response.json();
            // 合并服务器返回的收藏 (包含可能在其他设备添加的)
            const serverFavorites: FavoriteImage[] = data.favorites.map((f: any) => ({
              planId: f.planId,
              planName: f.plan?.name || '',
              imageUrl: f.imageUrl || '',
              savedAt: f.createdAt,
            }));

            // 合并本地和服务器收藏 (去重)
            const merged = new Map<string, FavoriteImage>();
            [...favorites, ...serverFavorites].forEach((f) => {
              const key = `${f.planId}:${f.imageUrl}`;
              if (!merged.has(key)) {
                merged.set(key, f);
              }
            });

            set({
              favorites: Array.from(merged.values()),
              isSynced: true,
            });
          }
        } catch (error) {
          console.error('Failed to sync favorites:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      addToServer: async (item) => {
        try {
          await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId: item.planId,
              imageUrl: item.imageUrl,
            }),
          });
        } catch (error) {
          console.error('Failed to add favorite to server:', error);
        }
      },

      removeFromServer: async (planId, imageUrl) => {
        try {
          await fetch(
            `/api/favorites?planId=${planId}&imageUrl=${encodeURIComponent(imageUrl)}`,
            { method: 'DELETE' }
          );
        } catch (error) {
          console.error('Failed to remove favorite from server:', error);
        }
      },

      clearAll: () => {
        set({ favorites: [], isSynced: false });
      },

      setSynced: (synced) => {
        set({ isSynced: synced });
      },
    }),
    {
      name: 'plan-favorites',
      partialize: (state) => ({
        favorites: state.favorites,
      }),
    }
  )
);
