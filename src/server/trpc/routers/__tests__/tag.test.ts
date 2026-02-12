import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// mock tagService
vi.mock('@/server/services/tag.service', () => ({
  tagService: {
    listTags: vi.fn(),
    getTag: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
    listCategories: vi.fn(),
    getCategory: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

import { tagService } from '@/server/services/tag.service';
import { tagRouter } from '../tag';

const mockTagService = tagService as {
  listTags: ReturnType<typeof vi.fn>;
  getTag: ReturnType<typeof vi.fn>;
  createTag: ReturnType<typeof vi.fn>;
  updateTag: ReturnType<typeof vi.fn>;
  deleteTag: ReturnType<typeof vi.fn>;
  listCategories: ReturnType<typeof vi.fn>;
  getCategory: ReturnType<typeof vi.fn>;
  createCategory: ReturnType<typeof vi.fn>;
  updateCategory: ReturnType<typeof vi.fn>;
  deleteCategory: ReturnType<typeof vi.fn>;
};

const mockPrisma = {} as any;

// adminProcedure 需要 ADMIN 角色
const createAdminCaller = () =>
  tagRouter.createCaller({
    prisma: mockPrisma,
    user: { id: 'u1', role: 'ADMIN' },
    session: {},
  } as any);

// 嵌套子路由通过父 caller 访问
// category 的测试也使用 createAdminCaller()，通过 caller.category.xxx 调用

describe('tagRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== 标签 ==========

  describe('list', () => {
    it('查询全部标签（无 categoryId）', async () => {
      const mockTags = [{ id: 't1', name: '和风' }];
      mockTagService.listTags.mockResolvedValue(mockTags);

      const caller = createAdminCaller();
      const result = await caller.list();

      expect(mockTagService.listTags).toHaveBeenCalledWith(mockPrisma, undefined);
      expect(result).toEqual(mockTags);
    });

    it('按分类筛选标签', async () => {
      mockTagService.listTags.mockResolvedValue([]);

      const caller = createAdminCaller();
      await caller.list({ categoryId: 'cat1' });

      expect(mockTagService.listTags).toHaveBeenCalledWith(mockPrisma, 'cat1');
    });
  });

  describe('get', () => {
    it('查询单个标签', async () => {
      const mockTag = { id: 't1', name: '和风' };
      mockTagService.getTag.mockResolvedValue(mockTag);

      const caller = createAdminCaller();
      const result = await caller.get({ id: 't1' });

      expect(mockTagService.getTag).toHaveBeenCalledWith(mockPrisma, 't1');
      expect(result).toEqual(mockTag);
    });
  });

  describe('create', () => {
    it('创建新标签', async () => {
      const input = {
        categoryId: 'cat1',
        code: 'traditional',
        name: '传统和服',
      };
      const mockCreated = { id: 't1', ...input };
      mockTagService.createTag.mockResolvedValue(mockCreated);

      const caller = createAdminCaller();
      const result = await caller.create(input);

      expect(mockTagService.createTag).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ categoryId: 'cat1', code: 'traditional', name: '传统和服' }),
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('更新标签', async () => {
      const mockUpdated = { id: 't1', name: '更新名称' };
      mockTagService.updateTag.mockResolvedValue(mockUpdated);

      const caller = createAdminCaller();
      const result = await caller.update({
        id: 't1',
        data: { name: '更新名称' },
      });

      expect(mockTagService.updateTag).toHaveBeenCalledWith(mockPrisma, 't1', { name: '更新名称' });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('删除标签返回 success', async () => {
      mockTagService.deleteTag.mockResolvedValue(undefined);

      const caller = createAdminCaller();
      const result = await caller.delete({ id: 't1' });

      expect(mockTagService.deleteTag).toHaveBeenCalledWith(mockPrisma, 't1');
      expect(result).toEqual({ success: true });
    });
  });

  // ========== 权限测试 ==========

  describe('权限', () => {
    it('普通用户无权访问标签管理', async () => {
      const caller = tagRouter.createCaller({
        prisma: mockPrisma,
        user: { id: 'u1', role: 'USER' },
        session: {},
      } as any);

      await expect(caller.list()).rejects.toThrow(TRPCError);
    });

    it('STAFF 角色可以访问', async () => {
      mockTagService.listTags.mockResolvedValue([]);

      const caller = tagRouter.createCaller({
        prisma: mockPrisma,
        user: { id: 'u1', role: 'STAFF' },
        session: {},
      } as any);

      const result = await caller.list();
      expect(result).toEqual([]);
    });
  });

  // ========== 标签分类（子路由） ==========

  describe('category', () => {
    describe('list', () => {
      it('查询所有分类', async () => {
        const mockCategories = [{ id: 'cat1', name: '风格' }];
        mockTagService.listCategories.mockResolvedValue(mockCategories);

        const caller = createAdminCaller();
        const result = await caller.category.list();

        expect(mockTagService.listCategories).toHaveBeenCalledWith(mockPrisma);
        expect(result).toEqual(mockCategories);
      });
    });

    describe('get', () => {
      it('查询单个分类', async () => {
        const mockCategory = { id: 'cat1', name: '风格' };
        mockTagService.getCategory.mockResolvedValue(mockCategory);

        const caller = createAdminCaller();
        const result = await caller.category.get({ id: 'cat1' });

        expect(mockTagService.getCategory).toHaveBeenCalledWith(mockPrisma, 'cat1');
        expect(result).toEqual(mockCategory);
      });
    });

    describe('create', () => {
      it('创建新分类', async () => {
        const input = { code: 'style', name: '风格' };
        const mockCreated = { id: 'cat1', ...input };
        mockTagService.createCategory.mockResolvedValue(mockCreated);

        const caller = createAdminCaller();
        const result = await caller.category.create(input);

        expect(mockTagService.createCategory).toHaveBeenCalledWith(
          mockPrisma,
          expect.objectContaining({ code: 'style', name: '风格' }),
        );
        expect(result).toEqual(mockCreated);
      });
    });

    describe('update', () => {
      it('更新分类', async () => {
        const mockUpdated = { id: 'cat1', name: '新风格' };
        mockTagService.updateCategory.mockResolvedValue(mockUpdated);

        const caller = createAdminCaller();
        const result = await caller.category.update({
          id: 'cat1',
          data: { name: '新风格' },
        });

        expect(mockTagService.updateCategory).toHaveBeenCalledWith(mockPrisma, 'cat1', { name: '新风格' });
        expect(result).toEqual(mockUpdated);
      });
    });

    describe('delete', () => {
      it('删除分类返回 success', async () => {
        mockTagService.deleteCategory.mockResolvedValue(undefined);

        const caller = createAdminCaller();
        const result = await caller.category.delete({ id: 'cat1' });

        expect(mockTagService.deleteCategory).toHaveBeenCalledWith(mockPrisma, 'cat1');
        expect(result).toEqual({ success: true });
      });
    });
  });
});
