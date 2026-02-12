import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// mock handlePrismaError
vi.mock('@/server/trpc/utils', () => ({
  handlePrismaError: vi.fn((error: unknown) => { throw error; }),
}));

import { tagService } from '../tag.service';

// mock prisma（tagService 接收 prisma 作为参数）
const mockPrisma = {
  tag: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  tagCategory: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as any;

describe('tagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== 标签 ==========

  describe('listTags', () => {
    it('无 categoryId 时列出所有标签', async () => {
      const mockTags = [{ id: 'tag-1', name: '传统' }];
      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      const result = await tagService.listTags(mockPrisma);

      expect(result).toEqual(mockTags);
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: { _count: { select: { plans: true } } },
        orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
      });
    });

    it('有 categoryId 时按分类筛选', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([]);

      await tagService.listTags(mockPrisma, 'cat-1');

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
        include: { _count: { select: { plans: true } } },
        orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
      });
    });
  });

  describe('getTag', () => {
    it('找到标签时返回', async () => {
      const mockTag = { id: 'tag-1', name: '传统' };
      mockPrisma.tag.findUnique.mockResolvedValue(mockTag);

      const result = await tagService.getTag(mockPrisma, 'tag-1');

      expect(result).toEqual(mockTag);
    });

    it('未找到时抛 NOT_FOUND', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await expect(
        tagService.getTag(mockPrisma, 'tag-999'),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '标签不存在' }));
    });
  });

  describe('createTag', () => {
    const input = {
      categoryId: 'cat-1',
      code: 'traditional',
      name: '传统',
    };

    it('正常创建标签', async () => {
      mockPrisma.tagCategory.findUnique.mockResolvedValue({ id: 'cat-1' });
      const mockCreated = { id: 'tag-1', ...input };
      mockPrisma.tag.create.mockResolvedValue(mockCreated);

      const result = await tagService.createTag(mockPrisma, input as any);

      expect(result).toEqual(mockCreated);
      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categoryId: 'cat-1',
          code: 'traditional',
          name: '传统',
        }),
        include: { _count: { select: { plans: true } } },
      });
    });

    it('分类不存在时抛 NOT_FOUND', async () => {
      mockPrisma.tagCategory.findUnique.mockResolvedValue(null);

      await expect(
        tagService.createTag(mockPrisma, input as any),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '标签分类不存在' }));
    });
  });

  describe('updateTag', () => {
    it('正常更新标签', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', code: 'old', categoryId: 'cat-1' });
      const updated = { id: 'tag-1', name: '新名称' };
      mockPrisma.tag.update.mockResolvedValue(updated);

      const result = await tagService.updateTag(mockPrisma, 'tag-1', { name: '新名称' });

      expect(result).toEqual(updated);
    });

    it('标签不存在时抛 NOT_FOUND', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await expect(
        tagService.updateTag(mockPrisma, 'tag-999', { name: '新名称' }),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '标签不存在' }));
    });

    it('code 冲突时抛 CONFLICT', async () => {
      // 第一次 findUnique: 找到当前标签
      mockPrisma.tag.findUnique
        .mockResolvedValueOnce({ id: 'tag-1', code: 'old', categoryId: 'cat-1' })
        // 第二次 findUnique: 检查 code 唯一性（使用复合键）
        .mockResolvedValueOnce({ id: 'tag-2', code: 'duplicate' });

      await expect(
        tagService.updateTag(mockPrisma, 'tag-1', { code: 'duplicate' }),
      ).rejects.toThrow(new TRPCError({ code: 'CONFLICT', message: '标签代码在该分类中已存在' }));
    });
  });

  describe('deleteTag', () => {
    it('正常删除标签', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', _count: { plans: 0 } });
      mockPrisma.tag.delete.mockResolvedValue({});

      await tagService.deleteTag(mockPrisma, 'tag-1');

      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: 'tag-1' } });
    });

    it('标签不存在时抛 NOT_FOUND', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);

      await expect(
        tagService.deleteTag(mockPrisma, 'tag-999'),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '标签不存在' }));
    });

    it('有关联套餐时抛 PRECONDITION_FAILED', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', _count: { plans: 3 } });

      await expect(
        tagService.deleteTag(mockPrisma, 'tag-1'),
      ).rejects.toThrow(new TRPCError({ code: 'PRECONDITION_FAILED', message: '无法删除，该标签被 3 个套餐使用中' }));
    });
  });

  // ========== 标签分类 ==========

  describe('listCategories', () => {
    it('返回活跃分类列表', async () => {
      const mockCategories = [{ id: 'cat-1', name: '风格' }];
      mockPrisma.tagCategory.findMany.mockResolvedValue(mockCategories);

      const result = await tagService.listCategories(mockPrisma);

      expect(result).toEqual(mockCategories);
      expect(mockPrisma.tagCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          tags: { where: { isActive: true }, orderBy: { order: 'asc' } },
          _count: { select: { tags: true } },
        },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('getCategory', () => {
    it('找到分类时返回', async () => {
      const mockCategory = { id: 'cat-1', name: '风格' };
      mockPrisma.tagCategory.findUnique.mockResolvedValue(mockCategory);

      const result = await tagService.getCategory(mockPrisma, 'cat-1');

      expect(result).toEqual(mockCategory);
    });

    it('未找到时抛 NOT_FOUND', async () => {
      mockPrisma.tagCategory.findUnique.mockResolvedValue(null);

      await expect(
        tagService.getCategory(mockPrisma, 'cat-999'),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '标签分类不存在' }));
    });
  });

  describe('createCategory', () => {
    it('正常创建分类', async () => {
      const input = { code: 'style', name: '风格' };
      const mockCreated = { id: 'cat-1', ...input };
      mockPrisma.tagCategory.create.mockResolvedValue(mockCreated);

      const result = await tagService.createCategory(mockPrisma, input as any);

      expect(result).toEqual(mockCreated);
    });
  });

  describe('updateCategory', () => {
    it('正常更新分类', async () => {
      mockPrisma.tagCategory.findUnique.mockResolvedValue({ id: 'cat-1', code: 'old' });
      const updated = { id: 'cat-1', name: '新分类名' };
      mockPrisma.tagCategory.update.mockResolvedValue(updated);

      const result = await tagService.updateCategory(mockPrisma, 'cat-1', { name: '新分类名' });

      expect(result).toEqual(updated);
    });

    it('分类不存在时抛 NOT_FOUND', async () => {
      mockPrisma.tagCategory.findUnique.mockResolvedValue(null);

      await expect(
        tagService.updateCategory(mockPrisma, 'cat-999', { name: '新名称' }),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '标签分类不存在' }));
    });

    it('code 冲突时抛 CONFLICT', async () => {
      mockPrisma.tagCategory.findUnique
        .mockResolvedValueOnce({ id: 'cat-1', code: 'old' })
        .mockResolvedValueOnce({ id: 'cat-2', code: 'duplicate' });

      await expect(
        tagService.updateCategory(mockPrisma, 'cat-1', { code: 'duplicate' }),
      ).rejects.toThrow(new TRPCError({ code: 'CONFLICT', message: '分类代码已存在' }));
    });
  });

  describe('deleteCategory', () => {
    it('正常删除分类', async () => {
      mockPrisma.tagCategory.findUnique.mockResolvedValue({ id: 'cat-1', _count: { tags: 0 } });
      mockPrisma.tagCategory.delete.mockResolvedValue({});

      await tagService.deleteCategory(mockPrisma, 'cat-1');

      expect(mockPrisma.tagCategory.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });

    it('分类不存在时抛 NOT_FOUND', async () => {
      mockPrisma.tagCategory.findUnique.mockResolvedValue(null);

      await expect(
        tagService.deleteCategory(mockPrisma, 'cat-999'),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '标签分类不存在' }));
    });

    it('有关联标签时抛 PRECONDITION_FAILED', async () => {
      mockPrisma.tagCategory.findUnique.mockResolvedValue({ id: 'cat-1', _count: { tags: 5 } });

      await expect(
        tagService.deleteCategory(mockPrisma, 'cat-1'),
      ).rejects.toThrow(new TRPCError({ code: 'PRECONDITION_FAILED', message: '无法删除，该分类下有 5 个标签' }));
    });
  });
});
