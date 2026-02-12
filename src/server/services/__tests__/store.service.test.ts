import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { storeService } from '../store.service';

// mock prisma（storeService 接收 prisma 作为参数）
const mockPrisma = {
  store: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
} as any;

describe('storeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('返回活跃店铺列表', async () => {
      const mockStores = [
        { id: 'store-1', name: '京都店', slug: 'kyoto', city: '京都', address: '京都市東山区' },
        { id: 'store-2', name: '大阪店', slug: 'osaka', city: '大阪', address: '大阪市中央区' },
      ];
      mockPrisma.store.findMany.mockResolvedValue(mockStores);

      const result = await storeService.list(mockPrisma);

      expect(result).toEqual(mockStores);
      expect(mockPrisma.store.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { city: 'asc' },
        select: { id: true, name: true, slug: true, city: true, address: true },
      });
    });
  });

  describe('getById', () => {
    it('找到店铺时返回', async () => {
      const mockStore = { id: 'store-1', name: '京都店', slug: 'kyoto', city: '京都', address: '京都市東山区' };
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);

      const result = await storeService.getById(mockPrisma, 'store-1');

      expect(result).toEqual(mockStore);
      expect(mockPrisma.store.findUnique).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        select: { id: true, name: true, slug: true, city: true, address: true },
      });
    });

    it('未找到时抛 NOT_FOUND', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(null);

      await expect(
        storeService.getById(mockPrisma, 'store-999'),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '店铺不存在' }));
    });
  });
});
