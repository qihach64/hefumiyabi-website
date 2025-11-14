import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserPhotoStore {
  // 会话级照片缓存（关闭标签页自动清除）
  photo: string | null;

  // 保存照片
  setPhoto: (photo: string) => void;

  // 清除照片
  clearPhoto: () => void;

  // 检查是否有缓存照片
  hasPhoto: () => boolean;
}

export const useUserPhotoStore = create<UserPhotoStore>()(
  persist(
    (set, get) => ({
      photo: null,

      setPhoto: (photo) => {
        set({ photo });
        console.log('📸 照片已保存到会话缓存');
      },

      clearPhoto: () => {
        set({ photo: null });
        console.log('🗑️ 照片缓存已清除');
      },

      hasPhoto: () => {
        return !!get().photo;
      },
    }),
    {
      name: "user-photo-session", // sessionStorage key
      storage: createJSONStorage(() => sessionStorage), // 使用 sessionStorage
    }
  )
);
