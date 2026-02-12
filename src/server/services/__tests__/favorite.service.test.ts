import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { favoriteService } from '../favorite.service';

// mock prisma（favoriteService 接收 prisma 作为参数）
const mockPrisma = {
  favorite: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
} as any;

describe('favoriteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('返回收藏列表', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          planId: 'plan-1',
          imageUrl: null,
          createdAt: new Date(),
          plan: { id: 'plan-1', name: '经典和服' },
        },
      ];
      mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites);

      const result = await favoriteService.list(mockPrisma, 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('planId', 'plan-1');
      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', planId: { not: null } },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('add', () => {
    it('正常 upsert 收藏', async () => {
      const mockResult = { id: 'fav-1', planId: 'plan-1' };
      mockPrisma.favorite.upsert.mockResolvedValue(mockResult);

      const result = await favoriteService.add(mockPrisma, 'user-1', 'plan-1');

      expect(result).toEqual(mockResult);
      expect(mockPrisma.favorite.upsert).toHaveBeenCalledWith({
        where: {
          userId_planId_imageUrl: {
            userId: 'user-1',
            planId: 'plan-1',
            imageUrl: null,
          },
        },
        update: {},
        create: { userId: 'user-1', planId: 'plan-1', imageUrl: undefined },
        include: expect.any(Object),
      });
    });

    it('planId 为空时抛 BAD_REQUEST', async () => {
      await expect(
        favoriteService.add(mockPrisma, 'user-1', ''),
      ).rejects.toThrow(new TRPCError({ code: 'BAD_REQUEST', message: 'planId 不能为空' }));
    });
  });

  describe('remove', () => {
    it('正常删除收藏', async () => {
      mockPrisma.favorite.deleteMany.mockResolvedValue({ count: 1 });

      await favoriteService.remove(mockPrisma, 'user-1', 'plan-1');

      expect(mockPrisma.favorite.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', planId: 'plan-1', imageUrl: undefined },
      });
    });

    it('收藏不存在时抛 NOT_FOUND', async () => {
      mockPrisma.favorite.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        favoriteService.remove(mockPrisma, 'user-1', 'plan-1'),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '收藏不存在' }));
    });

    it('planId 为空时抛 BAD_REQUEST', async () => {
      await expect(
        favoriteService.remove(mockPrisma, 'user-1', ''),
      ).rejects.toThrow(new TRPCError({ code: 'BAD_REQUEST', message: 'planId 不能为空' }));
    });
  });

  describe('sync', () => {
    it('合并本地和服务器收藏', async () => {
      // 服务器已有收藏
      mockPrisma.favorite.findMany
        .mockResolvedValueOnce([
          { planId: 'plan-1', imageUrl: null },
        ])
        // 合并后返回完整列表
        .mockResolvedValueOnce([
          {
            id: 'fav-1', planId: 'plan-1', imageUrl: null, createdAt: new Date(),
            plan: { id: 'plan-1', name: '经典和服' },
          },
          {
            id: 'fav-2', planId: 'plan-2', imageUrl: null, createdAt: new Date(),
            plan: { id: 'plan-2', name: '豪华和服' },
          },
        ]);
      mockPrisma.favorite.createMany.mockResolvedValue({ count: 1 });

      const localFavorites = [
        { planId: 'plan-1', imageUrl: '' },  // 已存在
        { planId: 'plan-2', imageUrl: '' },  // 需新增
      ];

      const result = await favoriteService.sync(mockPrisma, 'user-1', localFavorites);

      expect(result.synced).toBe(1);
      expect(result.favorites).toHaveLength(2);
      // 只新增 plan-2
      expect(mockPrisma.favorite.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-1', planId: 'plan-2', imageUrl: '' }],
        skipDuplicates: true,
      });
    });
  });
});
