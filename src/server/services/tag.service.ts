import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import type { CreateTagInput, CreateTagCategoryInput } from '@/server/schemas';
import { handlePrismaError } from '@/server/trpc/utils';

// 标签管理服务（管理后台）
export const tagService = {
  // ========== 标签 ==========

  async listTags(prisma: PrismaClient, categoryId?: string) {
    return prisma.tag.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { _count: { select: { plans: true } } },
      orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
    });
  },

  async getTag(prisma: PrismaClient, id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { plans: true } } },
    });
    if (!tag) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '标签不存在' });
    }
    return tag;
  },

  async createTag(prisma: PrismaClient, input: CreateTagInput) {
    // 验证分类存在
    const category = await prisma.tagCategory.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '标签分类不存在' });
    }

    try {
      return await prisma.tag.create({
        data: {
          categoryId: input.categoryId,
          code: input.code,
          name: input.name,
          nameEn: input.nameEn,
          icon: input.icon,
          color: input.color,
          order: input.order ?? 0,
        },
        include: { _count: { select: { plans: true } } },
      });
    } catch (error) {
      handlePrismaError(error); // P2002 → 标签代码已存在
    }
  },

  async updateTag(
    prisma: PrismaClient,
    id: string,
    data: Partial<{
      code: string;
      name: string;
      nameEn: string;
      icon: string;
      color: string;
      order: number;
      isActive: boolean;
    }>,
  ) {
    // 验证标签存在
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '标签不存在' });
    }

    // 检查 code 唯一性
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.tag.findUnique({
        where: { categoryId_code: { categoryId: existing.categoryId, code: data.code } },
      });
      if (duplicate) {
        throw new TRPCError({ code: 'CONFLICT', message: '标签代码在该分类中已存在' });
      }
    }

    return prisma.tag.update({
      where: { id },
      data,
      include: { _count: { select: { plans: true } } },
    });
  },

  async deleteTag(prisma: PrismaClient, id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { plans: true } } },
    });
    if (!tag) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '标签不存在' });
    }
    if (tag._count.plans > 0) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: `无法删除，该标签被 ${tag._count.plans} 个套餐使用中`,
      });
    }

    await prisma.tag.delete({ where: { id } });
  },

  // ========== 标签分类 ==========

  async listCategories(prisma: PrismaClient) {
    return prisma.tagCategory.findMany({
      where: { isActive: true },
      include: {
        tags: { where: { isActive: true }, orderBy: { order: 'asc' } },
        _count: { select: { tags: true } },
      },
      orderBy: { order: 'asc' },
    });
  },

  async getCategory(prisma: PrismaClient, id: string) {
    const category = await prisma.tagCategory.findUnique({
      where: { id },
      include: {
        tags: { orderBy: { order: 'asc' } },
        _count: { select: { tags: true } },
      },
    });
    if (!category) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '标签分类不存在' });
    }
    return category;
  },

  async createCategory(prisma: PrismaClient, input: CreateTagCategoryInput) {
    try {
      return await prisma.tagCategory.create({
        data: {
          code: input.code,
          name: input.name,
          nameEn: input.nameEn,
          description: input.description,
          icon: input.icon,
          color: input.color,
          order: input.order ?? 0,
          showInFilter: input.showInFilter ?? true,
          filterOrder: input.filterOrder ?? 0,
        },
        include: {
          tags: true,
          _count: { select: { tags: true } },
        },
      });
    } catch (error) {
      handlePrismaError(error); // P2002 → 分类代码已存在
    }
  },

  async updateCategory(
    prisma: PrismaClient,
    id: string,
    data: Partial<{
      code: string;
      name: string;
      nameEn: string;
      description: string;
      icon: string;
      color: string;
      order: number;
      isActive: boolean;
      showInFilter: boolean;
      filterOrder: number;
    }>,
  ) {
    const existing = await prisma.tagCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '标签分类不存在' });
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.tagCategory.findUnique({ where: { code: data.code } });
      if (duplicate) {
        throw new TRPCError({ code: 'CONFLICT', message: '分类代码已存在' });
      }
    }

    return prisma.tagCategory.update({
      where: { id },
      data,
      include: {
        tags: { orderBy: { order: 'asc' } },
        _count: { select: { tags: true } },
      },
    });
  },

  async deleteCategory(prisma: PrismaClient, id: string) {
    const category = await prisma.tagCategory.findUnique({
      where: { id },
      include: { _count: { select: { tags: true } } },
    });
    if (!category) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '标签分类不存在' });
    }
    if (category._count.tags > 0) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: `无法删除，该分类下有 ${category._count.tags} 个标签`,
      });
    }

    await prisma.tagCategory.delete({ where: { id } });
  },
};
