import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';

// 店铺服务
export const storeService = {
  async list(prisma: PrismaClient) {
    return prisma.store.findMany({
      where: { isActive: true },
      orderBy: { city: 'asc' },
      select: { id: true, name: true, slug: true, city: true, address: true },
    });
  },

  async getById(prisma: PrismaClient, id: string) {
    const store = await prisma.store.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, city: true, address: true },
    });
    if (!store) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '店铺不存在' });
    }
    return store;
  },
};
