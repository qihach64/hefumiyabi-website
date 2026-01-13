import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface PlanListParams {
  theme?: string;
  storeId?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

export const planService = {
  async getList(params: PlanListParams) {
    const { theme, storeId, location, limit = 20, offset = 0 } = params;

    const where: Prisma.RentalPlanWhereInput = {
      isActive: true,
    };

    if (theme) {
      where.theme = { slug: theme };
    }

    // Build planStores filter (combine storeId and location if both provided)
    if (storeId || location) {
      const storeFilter: Prisma.PlanStoreWhereInput = {};

      if (storeId) {
        storeFilter.storeId = storeId;
      }

      if (location) {
        storeFilter.store = {
          OR: [
            { city: { contains: location, mode: 'insensitive' } },
            { name: { contains: location, mode: 'insensitive' } },
          ],
        };
      }

      where.planStores = { some: storeFilter };
    }

    const [plans, total] = await Promise.all([
      prisma.rentalPlan.findMany({
        where,
        include: {
          theme: true,
          planStores: { include: { store: true } },
          planTags: { include: { tag: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'desc' }],
        take: limit,
        skip: offset,
      }),
      prisma.rentalPlan.count({ where }),
    ]);

    return { plans, total, limit, offset };
  },

  async getById(id: string) {
    return prisma.rentalPlan.findUnique({
      where: { id },
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
  },

  async getFeatured(limit = 8) {
    return prisma.rentalPlan.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        theme: true,
        planStores: { include: { store: true } },
      },
      orderBy: { displayOrder: 'desc' },
      take: limit,
    });
  },
};
