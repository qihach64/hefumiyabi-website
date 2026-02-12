import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

// 收藏 select 复用
const favoriteInclude = {
  plan: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      images: true,
      isActive: true,
    },
  },
} as const;

// 收藏服务
export const favoriteService = {
  async list(prisma: PrismaClient, userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId, planId: { not: null } },
      include: favoriteInclude,
      orderBy: { createdAt: "desc" },
    });

    return favorites.map((f) => ({
      id: f.id,
      planId: f.planId,
      imageUrl: f.imageUrl,
      createdAt: f.createdAt,
      plan: f.plan,
    }));
  },

  async add(prisma: PrismaClient, userId: string, planId: string, imageUrl?: string) {
    if (!planId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "planId 不能为空" });
    }

    // upsert：已存在则返回，不存在则创建
    return prisma.favorite.upsert({
      where: {
        userId_planId_imageUrl: {
          userId,
          planId,
          imageUrl: imageUrl || "",
        },
      },
      update: {},
      create: { userId, planId, imageUrl },
      include: {
        plan: {
          select: { id: true, name: true, slug: true, price: true, imageUrl: true },
        },
      },
    });
  },

  async remove(prisma: PrismaClient, userId: string, planId: string, imageUrl?: string) {
    if (!planId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "planId 不能为空" });
    }

    const { count } = await prisma.favorite.deleteMany({
      where: { userId, planId, imageUrl: imageUrl || undefined },
    });

    if (count === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "收藏不存在" });
    }
  },

  async sync(
    prisma: PrismaClient,
    userId: string,
    localFavorites: { planId: string; imageUrl: string }[]
  ) {
    // 获取已有收藏
    const existing = await prisma.favorite.findMany({
      where: { userId, planId: { not: null } },
      select: { planId: true, imageUrl: true },
    });

    const existingSet = new Set(existing.map((f) => `${f.planId}:${f.imageUrl || ""}`));
    const toAdd = localFavorites.filter((f) => !existingSet.has(`${f.planId}:${f.imageUrl || ""}`));

    if (toAdd.length > 0) {
      await prisma.favorite.createMany({
        data: toAdd.map((f) => ({ userId, planId: f.planId, imageUrl: f.imageUrl })),
        skipDuplicates: true,
      });
    }

    // 返回合并后的完整收藏列表
    const allFavorites = await prisma.favorite.findMany({
      where: { userId, planId: { not: null } },
      include: favoriteInclude,
      orderBy: { createdAt: "desc" },
    });

    return {
      synced: toAdd.length,
      favorites: allFavorites.map((f) => ({
        id: f.id,
        planId: f.planId,
        imageUrl: f.imageUrl,
        createdAt: f.createdAt,
        plan: f.plan,
      })),
    };
  },
};
