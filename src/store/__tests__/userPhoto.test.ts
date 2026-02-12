import { describe, it, expect, beforeEach } from 'vitest';
import { useUserPhotoStore } from '../userPhoto';

describe('useUserPhotoStore', () => {
  beforeEach(() => {
    useUserPhotoStore.setState({ photo: null });
  });

  // ==================== setPhoto ====================
  describe('setPhoto', () => {
    it('保存照片', () => {
      useUserPhotoStore.getState().setPhoto('data:image/png;base64,abc123');

      expect(useUserPhotoStore.getState().photo).toBe('data:image/png;base64,abc123');
    });

    it('覆盖已有照片', () => {
      useUserPhotoStore.getState().setPhoto('old-photo');
      useUserPhotoStore.getState().setPhoto('new-photo');

      expect(useUserPhotoStore.getState().photo).toBe('new-photo');
    });
  });

  // ==================== clearPhoto ====================
  describe('clearPhoto', () => {
    it('清除照片', () => {
      useUserPhotoStore.getState().setPhoto('some-photo');
      useUserPhotoStore.getState().clearPhoto();

      expect(useUserPhotoStore.getState().photo).toBeNull();
    });

    it('没有照片时清除不报错', () => {
      useUserPhotoStore.getState().clearPhoto();
      expect(useUserPhotoStore.getState().photo).toBeNull();
    });
  });

  // ==================== hasPhoto ====================
  describe('hasPhoto', () => {
    it('有照片时返回 true', () => {
      useUserPhotoStore.getState().setPhoto('data:image/jpg;base64,xyz');

      expect(useUserPhotoStore.getState().hasPhoto()).toBe(true);
    });

    it('无照片时返回 false', () => {
      expect(useUserPhotoStore.getState().hasPhoto()).toBe(false);
    });

    it('清除后返回 false', () => {
      useUserPhotoStore.getState().setPhoto('photo');
      useUserPhotoStore.getState().clearPhoto();

      expect(useUserPhotoStore.getState().hasPhoto()).toBe(false);
    });
  });
});
