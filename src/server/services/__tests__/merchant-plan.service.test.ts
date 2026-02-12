import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// mock handlePrismaError
vi.mock('@/server/trpc/utils', () => ({
  handlePrismaError: vi.fn((error: unknown) => { throw error; }),
}));

import { merchantPlanService } from '../merchant-plan.service';

// mock prisma 和 tx（merchantPlanService 接收 prisma 作为参数）
const mockTx = {
  rentalPlan: {
    update: vi.fn(),
  },
  planTag: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  tag: {
    updateMany: vi.fn(),
  },
  planComponent: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  planUpgrade: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
};

const mockPrisma = {
  rentalPlan: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
} as any;

describe('merchantPlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
  });

  describe('create', () => {
    it('正常创建套餐', async () => {
      const input = {
        name: '经典和服体验',
        description: '包含和服租赁和化妆服务',
        price: 5000,
        depositAmount: 0,
        duration: 120,
        isActive: true,
        isFeatured: false,
      };
      const mockCreated = { id: 'plan-1', ...input };
      mockPrisma.rentalPlan.create.mockResolvedValue(mockCreated);

      const result = await merchantPlanService.create(mockPrisma, input as any, 'merchant-1', 'user-1');

      expect(result).toEqual(mockCreated);
      expect(mockPrisma.rentalPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '经典和服体验',
          merchantId: 'merchant-1',
          createdBy: 'user-1',
        }),
      });
    });
  });

  describe('update', () => {
    const baseUpdateInput = {
      name: '更新套餐',
      description: '更新后的描述信息至少十个字符',
      price: 6000,
      depositAmount: 0,
      isActive: true,
      isFeatured: false,
    };

    it('套餐不存在时抛 NOT_FOUND', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue(null);

      await expect(
        merchantPlanService.update(mockPrisma, 'plan-999', baseUpdateInput as any, 'merchant-1', 'user-1'),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '套餐不存在' }));
    });

    it('无权限操作时抛 FORBIDDEN', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue({ merchantId: 'other-merchant' });

      await expect(
        merchantPlanService.update(mockPrisma, 'plan-1', baseUpdateInput as any, 'merchant-1', 'user-1'),
      ).rejects.toThrow(new TRPCError({ code: 'FORBIDDEN', message: '无权限操作此套餐' }));
    });

    it('正常更新基本信息', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue({ merchantId: 'merchant-1' });
      const updatedPlan = { id: 'plan-1', ...baseUpdateInput };
      mockTx.rentalPlan.update.mockResolvedValue(updatedPlan);

      const result = await merchantPlanService.update(
        mockPrisma, 'plan-1', baseUpdateInput as any, 'merchant-1', 'user-1',
      );

      expect(result).toEqual(updatedPlan);
      expect(mockTx.rentalPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'plan-1' },
          data: expect.objectContaining({ name: '更新套餐' }),
        }),
      );
    });

    it('同步标签（tagIds）', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue({ merchantId: 'merchant-1' });
      mockTx.rentalPlan.update.mockResolvedValue({ id: 'plan-1' });
      mockTx.planTag.findMany.mockResolvedValue([{ tagId: 'old-tag' }]);
      mockTx.planTag.deleteMany.mockResolvedValue({});
      mockTx.planTag.createMany.mockResolvedValue({});
      mockTx.tag.updateMany.mockResolvedValue({});

      const input = { ...baseUpdateInput, tagIds: ['new-tag-1', 'new-tag-2'] };
      await merchantPlanService.update(mockPrisma, 'plan-1', input as any, 'merchant-1', 'user-1');

      // 验证旧标签被删除
      expect(mockTx.planTag.deleteMany).toHaveBeenCalledWith({ where: { planId: 'plan-1' } });
      // 验证新标签被创建
      expect(mockTx.planTag.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ planId: 'plan-1', tagId: 'new-tag-1' }),
          expect.objectContaining({ planId: 'plan-1', tagId: 'new-tag-2' }),
        ]),
      });
    });

    it('同步组件配置（planComponents）', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue({ merchantId: 'merchant-1' });
      mockTx.rentalPlan.update.mockResolvedValue({ id: 'plan-1' });
      mockTx.planComponent.deleteMany.mockResolvedValue({});
      mockTx.planComponent.createMany.mockResolvedValue({});

      const input = {
        ...baseUpdateInput,
        planComponents: [
          { merchantComponentId: 'comp-1', hotmapX: 0.5, hotmapY: 0.3, hotmapOrder: 0 },
        ],
      };
      await merchantPlanService.update(mockPrisma, 'plan-1', input as any, 'merchant-1', 'user-1');

      expect(mockTx.planComponent.deleteMany).toHaveBeenCalledWith({ where: { planId: 'plan-1' } });
      expect(mockTx.planComponent.createMany).toHaveBeenCalled();
    });

    it('同步升级服务（planUpgrades）', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue({ merchantId: 'merchant-1' });
      mockTx.rentalPlan.update.mockResolvedValue({ id: 'plan-1' });
      mockTx.planUpgrade.deleteMany.mockResolvedValue({});
      mockTx.planUpgrade.createMany.mockResolvedValue({});

      const input = {
        ...baseUpdateInput,
        planUpgrades: [
          { merchantComponentId: 'upgrade-1', priceOverride: 1000, isPopular: true, displayOrder: 0 },
        ],
      };
      await merchantPlanService.update(mockPrisma, 'plan-1', input as any, 'merchant-1', 'user-1');

      expect(mockTx.planUpgrade.deleteMany).toHaveBeenCalledWith({ where: { planId: 'plan-1' } });
      expect(mockTx.planUpgrade.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            planId: 'plan-1',
            merchantComponentId: 'upgrade-1',
            priceOverride: 1000,
            isPopular: true,
          }),
        ],
      });
    });
  });

  describe('softDelete', () => {
    it('套餐不存在时抛 NOT_FOUND', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue(null);

      await expect(
        merchantPlanService.softDelete(mockPrisma, 'plan-999', 'merchant-1'),
      ).rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: '套餐不存在' }));
    });

    it('无权限操作时抛 FORBIDDEN', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue({ merchantId: 'other-merchant' });

      await expect(
        merchantPlanService.softDelete(mockPrisma, 'plan-1', 'merchant-1'),
      ).rejects.toThrow(new TRPCError({ code: 'FORBIDDEN', message: '无权限操作此套餐' }));
    });

    it('正常软删除套餐', async () => {
      mockPrisma.rentalPlan.findUnique.mockResolvedValue({ merchantId: 'merchant-1' });
      mockPrisma.rentalPlan.update.mockResolvedValue({});

      await merchantPlanService.softDelete(mockPrisma, 'plan-1', 'merchant-1');

      expect(mockPrisma.rentalPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { isActive: false },
      });
    });
  });
});
