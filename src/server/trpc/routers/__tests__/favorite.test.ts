import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// mock favoriteService
vi.mock('@/server/services/favorite.service', () => ({
  favoriteService: {
    list: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    sync: vi.fn(),
  },
}));

import { favoriteService } from '@/server/services/favorite.service';
import { favoriteRouter } from '../favorite';

const mockFavoriteService = favoriteService as {
  list: ReturnType<typeof vi.fn>;
  add: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  sync: ReturnType<typeof vi.fn>;
};

const mockPrisma = {} as any;

// protectedProcedure（需要登录）
const createCaller = () =>
  favoriteRouter.createCaller({
    prisma: mockPrisma,
    user: { id: 'u1', role: 'USER' },
    session: {},
  } as any);

describe('favoriteRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('查询用户收藏列表', async () => {
      const mockFavorites = [
        { id: 'f1', planId: 'p1', plan: { name: '和服A' } },
      ];
      mockFavoriteService.list.mockResolvedValue(mockFavorites);

      const caller = createCaller();
      const result = await caller.list();

      expect(mockFavoriteService.list).toHaveBeenCalledWith(mockPrisma, 'u1');
      expect(result).toEqual(mockFavorites);
    });
  });

  describe('add', () => {
    it('添加收藏', async () => {
      const mockAdded = { id: 'f1', planId: 'p1' };
      mockFavoriteService.add.mockResolvedValue(mockAdded);

      const caller = createCaller();
      const result = await caller.add({ planId: 'p1' });

      expect(mockFavoriteService.add).toHaveBeenCalledWith(
        mockPrisma,
        'u1',
        'p1',
        undefined,
      );
      expect(result).toEqual(mockAdded);
    });

    it('添加收藏（含 imageUrl）', async () => {
      const mockAdded = { id: 'f2', planId: 'p1', imageUrl: 'https://img.example.com/1.jpg' };
      mockFavoriteService.add.mockResolvedValue(mockAdded);

      const caller = createCaller();
      const result = await caller.add({
        planId: 'p1',
        imageUrl: 'https://img.example.com/1.jpg',
      });

      expect(mockFavoriteService.add).toHaveBeenCalledWith(
        mockPrisma,
        'u1',
        'p1',
        'https://img.example.com/1.jpg',
      );
      expect(result).toEqual(mockAdded);
    });
  });

  describe('remove', () => {
    it('移除收藏', async () => {
      mockFavoriteService.remove.mockResolvedValue(undefined);

      const caller = createCaller();
      await caller.remove({ planId: 'p1' });

      expect(mockFavoriteService.remove).toHaveBeenCalledWith(
        mockPrisma,
        'u1',
        'p1',
        undefined,
      );
    });
  });

  describe('sync', () => {
    it('同步本地收藏到服务端', async () => {
      const localFavorites = [
        { planId: 'p1', imageUrl: 'https://img.example.com/1.jpg' },
        { planId: 'p2', imageUrl: 'https://img.example.com/2.jpg' },
      ];
      const mockSyncResult = {
        synced: 2,
        favorites: localFavorites.map((f, i) => ({ id: `f${i}`, ...f })),
      };
      mockFavoriteService.sync.mockResolvedValue(mockSyncResult);

      const caller = createCaller();
      const result = await caller.sync({ localFavorites });

      expect(mockFavoriteService.sync).toHaveBeenCalledWith(
        mockPrisma,
        'u1',
        localFavorites,
      );
      expect(result).toEqual(mockSyncResult);
    });
  });

  describe('权限', () => {
    it('未登录用户无法访问收藏', async () => {
      const caller = favoriteRouter.createCaller({
        prisma: mockPrisma,
        user: null,
        session: null,
      } as any);

      await expect(caller.list()).rejects.toThrow(TRPCError);
    });
  });
});
