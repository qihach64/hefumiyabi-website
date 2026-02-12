import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { bookingService } from '../booking.service';

// mock prisma 对象（bookingService 接收 prisma 作为参数）
const mockTx = {
  booking: {
    create: vi.fn(),
  },
};

const mockPrisma = {
  rentalPlan: {
    findMany: vi.fn(),
  },
  booking: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
} as any;

// 基础合法输入
const validInput = {
  guestName: '田中太郎',
  guestEmail: 'tanaka@example.com',
  visitDate: '2025-03-01',
  visitTime: '10:00',
  items: [
    {
      storeId: 'store-1',
      type: 'rental',
      planId: 'plan-1',
      quantity: 1,
      unitPrice: 5000,
      totalPrice: 5000,
    },
  ],
};

describe('bookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重新设置 $transaction 的默认行为
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
  });

  describe('create', () => {
    it('游客无联系信息时抛 BAD_REQUEST', async () => {
      const input = { ...validInput, guestName: undefined, guestEmail: undefined, guestPhone: undefined };

      await expect(
        bookingService.create(mockPrisma, input as any, null, null, null),
      ).rejects.toThrow(new TRPCError({ code: 'BAD_REQUEST', message: '请提供姓名和联系方式（邮箱或电话）' }));
    });

    it('缺少日期时间时抛 BAD_REQUEST', async () => {
      const input = {
        ...validInput,
        visitDate: undefined,
        visitTime: undefined,
        items: [{ ...validInput.items[0], visitDate: undefined, visitTime: undefined }],
      };

      await expect(
        bookingService.create(mockPrisma, input as any, null, null, null),
      ).rejects.toThrow(new TRPCError({ code: 'BAD_REQUEST', message: '所有套餐必须选择到店日期和时间' }));
    });

    it('planId 不存在时抛 BAD_REQUEST', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([]);

      await expect(
        bookingService.create(mockPrisma, validInput as any, null, null, null),
      ).rejects.toThrow(new TRPCError({ code: 'BAD_REQUEST', message: '部分套餐已不存在，请刷新页面重新选择' }));
    });

    it('套餐已下架时抛 BAD_REQUEST', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([
        { id: 'plan-1', price: 5000, isActive: false },
      ]);

      await expect(
        bookingService.create(mockPrisma, validInput as any, null, null, null),
      ).rejects.toThrow(new TRPCError({ code: 'BAD_REQUEST', message: '部分套餐已下架，请刷新页面重新选择' }));
    });

    it('价格不匹配时抛 BAD_REQUEST', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([
        { id: 'plan-1', price: 9999, isActive: true },
      ]);

      await expect(
        bookingService.create(mockPrisma, validInput as any, null, null, null),
      ).rejects.toThrow(new TRPCError({ code: 'BAD_REQUEST', message: '套餐价格已变更，请刷新页面重新选择' }));
    });

    it('正常创建单店铺预约', async () => {
      mockPrisma.rentalPlan.findMany.mockResolvedValue([
        { id: 'plan-1', price: 5000, isActive: true },
      ]);
      mockTx.booking.create.mockResolvedValue({
        id: 'booking-1',
        items: [{ store: { name: '京都店' } }],
      });

      const result = await bookingService.create(mockPrisma, validInput as any, 'user-1', '田中', 'tanaka@example.com');

      expect(result).toEqual([
        { id: 'booking-1', storeId: 'store-1', storeName: '京都店' },
      ]);
      expect(mockTx.booking.create).toHaveBeenCalledTimes(1);
    });

    it('按 storeId 分组创建多个 booking', async () => {
      const multiStoreInput = {
        ...validInput,
        items: [
          { storeId: 'store-1', type: 'rental', planId: 'plan-1', quantity: 1, unitPrice: 5000, totalPrice: 5000 },
          { storeId: 'store-2', type: 'rental', planId: 'plan-2', quantity: 1, unitPrice: 3000, totalPrice: 3000 },
        ],
      };

      mockPrisma.rentalPlan.findMany.mockResolvedValue([
        { id: 'plan-1', price: 5000, isActive: true },
        { id: 'plan-2', price: 3000, isActive: true },
      ]);
      mockTx.booking.create
        .mockResolvedValueOnce({ id: 'booking-1', items: [{ store: { name: '京都店' } }] })
        .mockResolvedValueOnce({ id: 'booking-2', items: [{ store: { name: '大阪店' } }] });

      const result = await bookingService.create(mockPrisma, multiStoreInput as any, 'user-1', null, null);

      expect(result).toHaveLength(2);
      expect(mockTx.booking.create).toHaveBeenCalledTimes(2);
    });

    it('登录用户无需游客联系信息', async () => {
      const input = {
        ...validInput,
        guestName: undefined,
        guestEmail: undefined,
      };

      mockPrisma.rentalPlan.findMany.mockResolvedValue([
        { id: 'plan-1', price: 5000, isActive: true },
      ]);
      mockTx.booking.create.mockResolvedValue({
        id: 'booking-1',
        items: [{ store: { name: '京都店' } }],
      });

      const result = await bookingService.create(mockPrisma, input as any, 'user-1', '田中', 'tanaka@example.com');

      expect(result).toHaveLength(1);
    });
  });

  describe('listByDateRange', () => {
    it('按日期范围查询预约', async () => {
      const mockBookings = [{ id: 'booking-1' }];
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);

      const result = await bookingService.listByDateRange(mockPrisma, '2025-03-01', '2025-03-31');

      expect(result).toEqual(mockBookings);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          visitDate: {
            gte: new Date('2025-03-01'),
            lte: new Date('2025-03-31'),
          },
        },
        include: {
          items: {
            include: {
              store: { select: { name: true } },
              plan: { select: { name: true } },
            },
          },
        },
        orderBy: { visitDate: 'asc' },
      });
    });
  });
});
