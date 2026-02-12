import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@prisma/client';

// Mock Prisma before importing the service
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    rentalPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  };
  return { default: mockPrisma };
});

// Import after mocking
import prisma from '@/lib/prisma';
import { planService } from '../plan.service';

const mockPrisma = prisma as unknown as {
  rentalPlan: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

describe('planService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getList', () => {
    it('returns plans with default pagination', async () => {
      const mockPlans = [
        { id: '1', name: 'Plan A', isActive: true },
        { id: '2', name: 'Plan B', isActive: true },
      ];
      mockPrisma.rentalPlan.findMany.mockResolvedValue(mockPlans);
      mockPrisma.rentalPlan.count.mockResolvedValue(2);

      const result = await planService.getList({});

      expect(result.plans).toEqual(mockPlans);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('applies custom pagination', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);
      mockPrisma.rentalPlan.count.mockResolvedValue(0);

      await planService.getList({ limit: 10, offset: 20 });

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('filters by theme slug', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);
      mockPrisma.rentalPlan.count.mockResolvedValue(0);

      await planService.getList({ theme: 'traditional' });

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            theme: { slug: 'traditional' },
          }),
        })
      );
    });

    it('filters by storeId', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);
      mockPrisma.rentalPlan.count.mockResolvedValue(0);

      await planService.getList({ storeId: 'store-123' });

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            planStores: { some: { storeId: 'store-123' } },
          }),
        })
      );
    });

    it('filters by location (city or store name)', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);
      mockPrisma.rentalPlan.count.mockResolvedValue(0);

      await planService.getList({ location: '京都' });

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            planStores: {
              some: {
                store: {
                  OR: [
                    { city: { contains: '京都', mode: 'insensitive' } },
                    { name: { contains: '京都', mode: 'insensitive' } },
                  ],
                },
              },
            },
          }),
        })
      );
    });

    it('combines storeId and location filters', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);
      mockPrisma.rentalPlan.count.mockResolvedValue(0);

      await planService.getList({ storeId: 'store-123', location: '京都' });

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            planStores: {
              some: {
                storeId: 'store-123',
                store: {
                  OR: [
                    { city: { contains: '京都', mode: 'insensitive' } },
                    { name: { contains: '京都', mode: 'insensitive' } },
                  ],
                },
              },
            },
          }),
        })
      );
    });

    it('includes related data (theme, planStores, planTags)', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);
      mockPrisma.rentalPlan.count.mockResolvedValue(0);

      await planService.getList({});

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            theme: true,
            planStores: { include: { store: true } },
            planTags: { include: { tag: true } },
          },
        })
      );
    });

    it('orders by isFeatured desc, then displayOrder desc', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);
      mockPrisma.rentalPlan.count.mockResolvedValue(0);

      await planService.getList({});

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'desc' }],
        })
      );
    });
  });

  describe('getById', () => {
    it('returns plan with full details', async () => {
      const mockPlan = {
        id: 'plan-123',
        name: 'Deluxe Plan',
        theme: { id: 'theme-1', name: 'Traditional' },
        planStores: [{ store: { id: 'store-1', name: 'Kyoto Store' } }],
        planTags: [{ tag: { id: 'tag-1', name: 'Popular' } }],
        planComponents: [{ merchantComponent: { id: 'comp-1' } }],
        planUpgrades: [{ merchantComponent: { id: 'upgrade-1' } }],
      };
      mockPrisma.rentalPlan.findUnique.mockResolvedValue(mockPlan);

      const result = await planService.getById('plan-123');

      expect(result).toEqual(mockPlan);
      expect(mockPrisma.rentalPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan-123' },
        include: {
          theme: true,
          planStores: { include: { store: true } },
          planTags: { include: { tag: true } },
          planComponents: {
            include: { merchantComponent: true },
            orderBy: { hotmapOrder: 'asc' },
          },
          planUpgrades: {
            include: { merchantComponent: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    });

    it('returns null for non-existent plan', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue(null);

      const result = await planService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getFeatured', () => {
    it('returns featured plans with default limit of 8', async () => {
      const mockPlans = [
        { id: '1', name: 'Featured A', isFeatured: true },
        { id: '2', name: 'Featured B', isFeatured: true },
      ];
      mockPrisma.rentalPlan.findMany.mockResolvedValue(mockPlans);

      const result = await planService.getFeatured();

      expect(result).toEqual(mockPlans);
      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true, isFeatured: true },
        include: {
          theme: true,
          planStores: { include: { store: true } },
        },
        orderBy: { displayOrder: 'desc' },
        take: 8,
      });
    });

    it('respects custom limit', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);

      await planService.getFeatured(4);

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 4,
        })
      );
    });
  });

  describe('getSearchPlans', () => {
    // 模拟 Prisma 返回的原始数据 (匹配 _planCardSelect 查询结果)
    const mockRawPlan = {
      id: 'plan-1',
      name: '经典和服体验',
      description: '含全套配饰',
      price: 5000,
      originalPrice: 8000,
      imageUrl: '/img/plan1.jpg',
      region: '京都',
      storeName: '祇園店',
      themeId: 'theme-1',
      isFeatured: true,
      isCampaign: false,
      merchant: { businessName: '和服屋' },
      planComponents: [
        { merchantComponent: { customName: null, template: { name: '振袖' } } },
        { merchantComponent: { customName: '特制帯', template: null } },
      ],
      planTags: [
        { tag: { id: 'tag-1', name: '人気', icon: '🔥', color: '#FF0000' } },
      ],
    };

    it('查询条件: isActive + themeId 不为 null', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);

      await planService.getSearchPlans();

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, themeId: { not: null } },
        })
      );
    });

    it('排序: isFeatured desc → isCampaign desc → price asc', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);

      await planService.getSearchPlans();

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isFeatured: 'desc' }, { isCampaign: 'desc' }, { price: 'asc' }],
        })
      );
    });

    it('返回值经过 _transformPlanCard 转换', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([mockRawPlan]);

      const result = await planService.getSearchPlans();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'plan-1',
        name: '经典和服体验',
        description: '含全套配饰',
        price: 5000,
        originalPrice: 8000,
        imageUrl: '/img/plan1.jpg',
        region: '京都',
        merchantName: '和服屋',
        isCampaign: true, // originalPrice > price → true
        includes: ['振袖', '特制帯'],
        planTags: [{ tag: { id: 'tag-1', name: '人気', icon: '🔥', color: '#FF0000' } }],
        themeId: 'theme-1',
      });
    });

    it('merchantName 回退: 无 merchant 时用 storeName', async () => {
      const planNoMerchant = { ...mockRawPlan, merchant: null };
      mockPrisma.rentalPlan.findMany.mockResolvedValue([planNoMerchant]);

      const result = await planService.getSearchPlans();

      expect(result[0].merchantName).toBe('祇園店');
    });

    it('isCampaign 计算: originalPrice 不大于 price 时为 false', async () => {
      const planSamePrice = { ...mockRawPlan, originalPrice: 5000 };
      mockPrisma.rentalPlan.findMany.mockResolvedValue([planSamePrice]);

      const result = await planService.getSearchPlans();

      expect(result[0].isCampaign).toBe(false);
    });
  });

  describe('getRelatedPlans', () => {
    const mockRawRelatedPlan = {
      id: 'related-1',
      name: '枫叶和服套餐',
      price: 6000,
      originalPrice: 9000,
      imageUrl: '/img/related.jpg',
      region: '岚山',
      storeName: '岚山店',
      isCampaign: false,
      merchant: { businessName: '京美' },
      planComponents: [
        { merchantComponent: { customName: null, template: { name: '小振袖' } } },
      ],
      planTags: [
        { tag: { id: 't1', code: 'popular', name: '人気', icon: '🔥', color: '#FF0000' } },
        { tag: { id: 't2', code: 'autumn', name: '秋季', icon: '🍂', color: '#FFA500' } },
      ],
    };

    it('themeId 为 null 时直接返回空数组', async () => {
      const result = await planService.getRelatedPlans(null, 'exclude-1');

      expect(result).toEqual([]);
      expect(mockPrisma.rentalPlan.findMany).not.toHaveBeenCalled();
    });

    it('查询条件: themeId + 排除当前 id + isActive', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);

      await planService.getRelatedPlans('theme-1', 'exclude-1');

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            themeId: 'theme-1',
            id: { not: 'exclude-1' },
            isActive: true,
          },
        })
      );
    });

    it('默认 limit = 8', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);

      await planService.getRelatedPlans('theme-1', 'exclude-1');

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 8 })
      );
    });

    it('支持自定义 limit', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);

      await planService.getRelatedPlans('theme-1', 'exclude-1', 4);

      expect(mockPrisma.rentalPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 4 })
      );
    });

    it('返回值正确转换', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([mockRawRelatedPlan]);

      const result = await planService.getRelatedPlans('theme-1', 'exclude-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'related-1',
        name: '枫叶和服套餐',
        price: 6000,
        originalPrice: 9000,
        imageUrl: '/img/related.jpg',
        region: '岚山',
        merchantName: '京美',
        isCampaign: true, // originalPrice > price
        includes: ['小振袖'],
        tags: [
          { id: 't1', code: 'popular', name: '人気', icon: '🔥', color: '#FF0000' },
          { id: 't2', code: 'autumn', name: '秋季', icon: '🍂', color: '#FFA500' },
        ],
      });
    });

    it('merchantName 回退: 无 merchant 时用 storeName', async () => {
      const planNoMerchant = { ...mockRawRelatedPlan, merchant: null };
      mockPrisma.rentalPlan.findMany.mockResolvedValue([planNoMerchant]);

      const result = await planService.getRelatedPlans('theme-1', 'exclude-1');

      expect(result[0].merchantName).toBe('岚山店');
    });

    it('includes 回退: 无 template 时用 customName', async () => {
      const planCustomName = {
        ...mockRawRelatedPlan,
        planComponents: [
          { merchantComponent: { customName: '手工帯', template: null } },
        ],
      };
      mockPrisma.rentalPlan.findMany.mockResolvedValue([planCustomName]);

      const result = await planService.getRelatedPlans('theme-1', 'exclude-1');

      expect(result[0].includes).toEqual(['手工帯']);
    });

    it('planTags 限制 3 个 (由 Prisma take 控制)', async () => {
      // getRelatedPlans 的 select 里 planTags 有 take: 3
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);

      await planService.getRelatedPlans('theme-1', 'exclude-1');

      const callArgs = mockPrisma.rentalPlan.findMany.mock.calls[0][0];
      expect(callArgs.select.planTags.take).toBe(3);
    });
  });
});
