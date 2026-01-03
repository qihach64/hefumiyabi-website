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

  // 清空所有收藏
  clearAll: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

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
        const { isFavorite, addFavorite, removeFavorite } = get();
        const isFav = isFavorite(item.planId, item.imageUrl);

        if (isFav) {
          removeFavorite(item.planId, item.imageUrl);
          return false;
        } else {
          addFavorite(item);
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

      clearAll: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: 'plan-favorites',
    }
  )
);
