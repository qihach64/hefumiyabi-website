import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// mock merchantService 和 merchantPlanService
vi.mock('@/server/services/merchant.service', () => ({
  merchantService: {
    register: vi.fn(),
  },
}));

vi.mock('@/server/services/merchant-plan.service', () => ({
  merchantPlanService: {
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

import { merchantService } from '@/server/services/merchant.service';
import { merchantPlanService } from '@/server/services/merchant-plan.service';
import { merchantRouter } from '../merchant';

const mockMerchantService = merchantService as {
  register: ReturnType<typeof vi.fn>;
};

const mockMerchantPlanService = merchantPlanService as {
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  softDelete: ReturnType<typeof vi.fn>;
};

// merchantProcedure 内部会查询 prisma.merchant.findUnique
const mockPrisma = {
  merchant: {
    findUnique: vi.fn(),
  },
} as any;

// protectedProcedure（注册用）
const createProtectedCaller = () =>
  merchantRouter.createCaller({
    prisma: mockPrisma,
    user: { id: 'u1', role: 'USER' },
    session: {},
  } as any);

// merchantProcedure（套餐管理用）- 通过父 router caller 访问 plan 子路由
const createMerchantCaller = () => {
  // mock 返回已审核通过的商家
  mockPrisma.merchant.findUnique.mockResolvedValue({
    id: 'm1',
    status: 'APPROVED',
    businessName: 'Test Store',
  });
  return merchantRouter.createCaller({
    prisma: mockPrisma,
    user: { id: 'u1', role: 'USER' },
    session: {},
  } as any);
};

describe('merchantRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    const registerInput = {
      businessName: '京都和服店',
      description: '提供高品质和服租赁服务',
      taxId: '1234567890',
      bankAccount: '0001-0001-0001',
    };

    it('登录用户注册商家', async () => {
      const mockResult = { id: 'm1', businessName: '京都和服店', status: 'PENDING' };
      mockMerchantService.register.mockResolvedValue(mockResult);

      const caller = createProtectedCaller();
      const result = await caller.register(registerInput);

      expect(mockMerchantService.register).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ businessName: '京都和服店' }),
        'u1',
      );
      expect(result).toEqual(mockResult);
    });

    it('未登录用户无法注册', async () => {
      const caller = merchantRouter.createCaller({
        prisma: mockPrisma,
        user: null,
        session: null,
      } as any);

      await expect(caller.register(registerInput)).rejects.toThrow(TRPCError);
    });
  });

  describe('plan.create', () => {
    const planInput = {
      name: '经典和服套餐',
      description: '包含传统和服、腰带、配饰等完整套装',
      price: 8000,
      depositAmount: 0,
      duration: 480,
      isActive: true,
      isFeatured: false,
    };

    it('商家创建套餐', async () => {
      const mockPlan = { id: 'p1', name: '经典和服套餐' };
      mockMerchantPlanService.create.mockResolvedValue(mockPlan);

      const caller = createMerchantCaller();
      const result = await caller.plan.create(planInput);

      expect(mockMerchantPlanService.create).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ name: '经典和服套餐' }),
        'm1',  // merchantId
        'u1',  // userId
      );
      expect(result).toEqual(mockPlan);
    });

    it('未审核商家无法创建套餐', async () => {
      mockPrisma.merchant.findUnique.mockResolvedValue({
        id: 'm1',
        status: 'PENDING',
        businessName: 'Test',
      });

      const caller = merchantRouter.createCaller({
        prisma: mockPrisma,
        user: { id: 'u1', role: 'USER' },
        session: {},
      } as any);

      await expect(caller.plan.create(planInput)).rejects.toThrow(TRPCError);
    });

    it('被暂停商家无法创建套餐', async () => {
      mockPrisma.merchant.findUnique.mockResolvedValue({
        id: 'm1',
        status: 'SUSPENDED',
        businessName: 'Test',
      });

      const caller = merchantRouter.createCaller({
        prisma: mockPrisma,
        user: { id: 'u1', role: 'USER' },
        session: {},
      } as any);

      await expect(caller.plan.create(planInput)).rejects.toThrow(TRPCError);
    });

    it('无商家账户的用户无法创建套餐', async () => {
      mockPrisma.merchant.findUnique.mockResolvedValue(null);

      const caller = merchantRouter.createCaller({
        prisma: mockPrisma,
        user: { id: 'u1', role: 'USER' },
        session: {},
      } as any);

      await expect(caller.plan.create(planInput)).rejects.toThrow(TRPCError);
    });
  });

  describe('plan.update', () => {
    it('商家更新套餐', async () => {
      const mockUpdated = { id: 'p1', name: '更新套餐' };
      mockMerchantPlanService.update.mockResolvedValue(mockUpdated);

      const caller = createMerchantCaller();
      const result = await caller.plan.update({
        id: 'p1',
        data: {
          name: '更新套餐',
          description: '更新后的描述信息更长一些',
          price: 10000,
          depositAmount: 0,
          isActive: true,
        },
      });

      expect(mockMerchantPlanService.update).toHaveBeenCalledWith(
        mockPrisma,
        'p1',
        expect.objectContaining({ name: '更新套餐' }),
        'm1',
        'u1',
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('plan.delete', () => {
    it('商家软删除套餐', async () => {
      mockMerchantPlanService.softDelete.mockResolvedValue(undefined);

      const caller = createMerchantCaller();
      const result = await caller.plan.delete({ id: 'p1' });

      expect(mockMerchantPlanService.softDelete).toHaveBeenCalledWith(
        mockPrisma,
        'p1',
        'm1',
      );
      expect(result).toEqual({ success: true });
    });
  });
});
