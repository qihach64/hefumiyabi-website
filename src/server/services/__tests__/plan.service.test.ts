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
});
