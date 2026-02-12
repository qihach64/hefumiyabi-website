import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock storeService
vi.mock('@/server/services/store.service', () => ({
  storeService: {
    list: vi.fn(),
    getById: vi.fn(),
  },
}));

import { storeService } from '@/server/services/store.service';
import { storeRouter } from '../store';

const mockStoreService = storeService as {
  list: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
};

const mockPrisma = {} as any;

// publicProcedure（需要 ctx.prisma）
const createCaller = () =>
  storeRouter.createCaller({ prisma: mockPrisma } as any);

describe('storeRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('查询所有店铺', async () => {
      const mockStores = [
        { id: 's1', name: '京都本店', city: '京都' },
        { id: 's2', name: '大阪分店', city: '大阪' },
      ];
      mockStoreService.list.mockResolvedValue(mockStores);

      const caller = createCaller();
      const result = await caller.list();

      expect(mockStoreService.list).toHaveBeenCalledWith(mockPrisma);
      expect(result).toEqual(mockStores);
    });
  });

  describe('getById', () => {
    it('查询单个店铺', async () => {
      const mockStore = { id: 's1', name: '京都本店', city: '京都' };
      mockStoreService.getById.mockResolvedValue(mockStore);

      const caller = createCaller();
      const result = await caller.getById({ id: 's1' });

      expect(mockStoreService.getById).toHaveBeenCalledWith(mockPrisma, 's1');
      expect(result).toEqual(mockStore);
    });
  });
});
