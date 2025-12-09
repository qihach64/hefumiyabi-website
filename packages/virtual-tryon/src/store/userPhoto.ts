import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserPhotoStore {
  // Session-level photo cache (auto-cleared when tab closes)
  photo: string | null;

  // Save photo
  setPhoto: (photo: string) => void;

  // Clear photo
  clearPhoto: () => void;

  // Check if has cached photo
  hasPhoto: () => boolean;
}

export const useUserPhotoStore = create<UserPhotoStore>()(
  persist(
    (set, get) => ({
      photo: null,

      setPhoto: (photo) => {
        set({ photo });
        console.log('[UserPhotoStore] Photo saved to session cache');
      },

      clearPhoto: () => {
        set({ photo: null });
        console.log('[UserPhotoStore] Photo cache cleared');
      },

      hasPhoto: () => {
        return !!get().photo;
      },
    }),
    {
      name: 'user-photo-session', // sessionStorage key
      storage: createJSONStorage(() => {
        // Handle SSR - return a noop storage on server
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return sessionStorage;
      }),
    }
  )
);
