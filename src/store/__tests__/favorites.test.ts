import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useFavoritesStore, type FavoriteImage } from '../favorites';

// 辅助函数：创建测试用收藏项
function makeFav(overrides: Partial<Omit<FavoriteImage, 'savedAt'>> = {}): Omit<FavoriteImage, 'savedAt'> {
  return {
    planId: 'plan-1',
    planName: '经典和服',
    imageUrl: '/img/kimono1.jpg',
    ...overrides,
  };
}

describe('useFavoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({
      favorites: [],
      isSynced: false,
      isSyncing: false,
    });
    vi.restoreAllMocks();
  });

  // ==================== addFavorite ====================
  describe('addFavorite', () => {
    it('添加收藏项', () => {
      useFavoritesStore.getState().addFavorite(makeFav());

      const favs = useFavoritesStore.getState().favorites;
      expect(favs).toHaveLength(1);
      expect(favs[0].planId).toBe('plan-1');
      expect(favs[0].savedAt).toBeDefined();
    });

    it('多次添加不同项', () => {
      const { addFavorite } = useFavoritesStore.getState();
      addFavorite(makeFav({ planId: 'plan-1', imageUrl: '/img/a.jpg' }));
      addFavorite(makeFav({ planId: 'plan-2', imageUrl: '/img/b.jpg' }));

      expect(useFavoritesStore.getState().favorites).toHaveLength(2);
    });
  });

  // ==================== removeFavorite ====================
  describe('removeFavorite', () => {
    it('移除指定收藏', () => {
      useFavoritesStore.getState().addFavorite(makeFav({ planId: 'plan-1', imageUrl: '/a.jpg' }));
      useFavoritesStore.getState().addFavorite(makeFav({ planId: 'plan-2', imageUrl: '/b.jpg' }));

      useFavoritesStore.getState().removeFavorite('plan-1', '/a.jpg');

      const favs = useFavoritesStore.getState().favorites;
      expect(favs).toHaveLength(1);
      expect(favs[0].planId).toBe('plan-2');
    });

    it('移除不存在的项不报错', () => {
      useFavoritesStore.getState().addFavorite(makeFav());
      useFavoritesStore.getState().removeFavorite('non-existent', '/x.jpg');

      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    });
  });

  // ==================== toggleFavorite ====================
  describe('toggleFavorite', () => {
    beforeEach(() => {
      // mock fetch，toggleFavorite 内部会调用 addToServer / removeFromServer
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })));
    });

    it('未收藏时添加，返回 true', () => {
      const result = useFavoritesStore.getState().toggleFavorite(makeFav());

      expect(result).toBe(true);
      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    });

    it('已收藏时移除，返回 false', () => {
      useFavoritesStore.getState().addFavorite(makeFav());

      const result = useFavoritesStore.getState().toggleFavorite(makeFav());

      expect(result).toBe(false);
      expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    });

    it('添加时调用 addToServer', () => {
      useFavoritesStore.getState().toggleFavorite(makeFav());

      expect(fetch).toHaveBeenCalledWith('/api/favorites', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('移除时调用 removeFromServer', () => {
      useFavoritesStore.getState().addFavorite(makeFav());
      useFavoritesStore.getState().toggleFavorite(makeFav());

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/favorites?planId=plan-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // ==================== isFavorite ====================
  describe('isFavorite', () => {
    it('已收藏返回 true', () => {
      useFavoritesStore.getState().addFavorite(makeFav());

      expect(useFavoritesStore.getState().isFavorite('plan-1', '/img/kimono1.jpg')).toBe(true);
    });

    it('未收藏返回 false', () => {
      expect(useFavoritesStore.getState().isFavorite('plan-1', '/img/x.jpg')).toBe(false);
    });
  });

  // ==================== getPlanFavorites ====================
  describe('getPlanFavorites', () => {
    it('按 planId 筛选', () => {
      const { addFavorite } = useFavoritesStore.getState();
      addFavorite(makeFav({ planId: 'plan-1', imageUrl: '/a.jpg' }));
      addFavorite(makeFav({ planId: 'plan-1', imageUrl: '/b.jpg' }));
      addFavorite(makeFav({ planId: 'plan-2', imageUrl: '/c.jpg' }));

      const result = useFavoritesStore.getState().getPlanFavorites('plan-1');
      expect(result).toHaveLength(2);
      expect(result.every((f) => f.planId === 'plan-1')).toBe(true);
    });

    it('不存在的 planId 返回空数组', () => {
      expect(useFavoritesStore.getState().getPlanFavorites('none')).toEqual([]);
    });
  });

  // ==================== clearAll ====================
  describe('clearAll', () => {
    it('清空所有收藏并重置同步状态', () => {
      useFavoritesStore.getState().addFavorite(makeFav());
      useFavoritesStore.setState({ isSynced: true });

      useFavoritesStore.getState().clearAll();

      const state = useFavoritesStore.getState();
      expect(state.favorites).toHaveLength(0);
      expect(state.isSynced).toBe(false);
    });
  });

  // ==================== syncToServer ====================
  describe('syncToServer', () => {
    it('同步成功后合并服务器收藏', async () => {
      useFavoritesStore.getState().addFavorite(makeFav({ planId: 'local-1', imageUrl: '/l.jpg' }));

      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            favorites: [
              { planId: 'server-1', plan: { name: '服务端套餐' }, imageUrl: '/s.jpg', createdAt: '2025-01-01T00:00:00Z' },
            ],
          }),
        })
      ));

      await useFavoritesStore.getState().syncToServer();

      const state = useFavoritesStore.getState();
      expect(state.isSynced).toBe(true);
      expect(state.isSyncing).toBe(false);
      expect(state.favorites).toHaveLength(2);
    });

    it('正在同步时跳过重复调用', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ favorites: [] }) })
      ));

      useFavoritesStore.setState({ isSyncing: true });
      await useFavoritesStore.getState().syncToServer();

      expect(fetch).not.toHaveBeenCalled();
    });

    it('同步失败不崩溃', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('网络错误'))));

      // 不应抛出异常
      await useFavoritesStore.getState().syncToServer();
      expect(useFavoritesStore.getState().isSyncing).toBe(false);
    });
  });

  // ==================== addToServer ====================
  describe('addToServer', () => {
    it('调用 POST /api/favorites', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })));

      await useFavoritesStore.getState().addToServer(makeFav());

      expect(fetch).toHaveBeenCalledWith('/api/favorites', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ planId: 'plan-1', imageUrl: '/img/kimono1.jpg' }),
      }));
    });

    it('请求失败不抛异常', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('fail'))));

      // 不应抛出
      await useFavoritesStore.getState().addToServer(makeFav());
    });
  });

  // ==================== removeFromServer ====================
  describe('removeFromServer', () => {
    it('调用 DELETE /api/favorites', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })));

      await useFavoritesStore.getState().removeFromServer('plan-1', '/img/a.jpg');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/favorites?planId=plan-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('请求失败不抛异常', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('fail'))));

      await useFavoritesStore.getState().removeFromServer('plan-1', '/a.jpg');
    });
  });
});
