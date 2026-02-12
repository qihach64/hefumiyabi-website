import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// mock bookingService
vi.mock('@/server/services/booking.service', () => ({
  bookingService: {
    create: vi.fn(),
    listByDateRange: vi.fn(),
  },
}));

import { bookingService } from '@/server/services/booking.service';
import { bookingRouter } from '../booking';

const mockBookingService = bookingService as {
  create: ReturnType<typeof vi.fn>;
  listByDateRange: ReturnType<typeof vi.fn>;
};

const mockPrisma = {} as any;

// publicProcedure（可选用户）
const createCaller = (user?: any) =>
  bookingRouter.createCaller({
    prisma: mockPrisma,
    user: user || null,
    session: user ? {} : null,
  } as any);

// adminProcedure（需要管理员角色）
const createAdminCaller = () =>
  bookingRouter.createCaller({
    prisma: mockPrisma,
    user: { id: 'u1', role: 'ADMIN' },
    session: {},
  } as any);

describe('bookingRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    const validInput = {
      guestName: '田中太郎',
      guestEmail: 'tanaka@example.com',
      visitDate: '2025-03-01',
      visitTime: '10:00',
      items: [
        {
          storeId: 's1',
          type: 'rental',
          planId: 'p1',
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000,
        },
      ],
    };

    it('游客创建单个预约，返回 {id, status}', async () => {
      mockBookingService.create.mockResolvedValue([{ id: 'b1' }]);

      const caller = createCaller();
      const result = await caller.create(validInput);

      expect(mockBookingService.create).toHaveBeenCalledWith(
        mockPrisma,
        expect.objectContaining({ guestName: '田中太郎' }),
        null,  // userId
        null,  // userName
        null,  // userEmail
      );
      expect(result).toEqual({ id: 'b1', status: 'success' });
    });

    it('登录用户创建预约，传入 user 信息', async () => {
      const user = { id: 'u1', name: '用户A', email: 'a@test.com' };
      mockBookingService.create.mockResolvedValue([{ id: 'b2' }]);

      const caller = createCaller(user);
      const result = await caller.create(validInput);

      expect(mockBookingService.create).toHaveBeenCalledWith(
        mockPrisma,
        expect.any(Object),
        'u1',
        '用户A',
        'a@test.com',
      );
      expect(result).toEqual({ id: 'b2', status: 'success' });
    });

    it('多店铺预约返回批量结果', async () => {
      mockBookingService.create.mockResolvedValue([
        { id: 'b1' },
        { id: 'b2' },
      ]);

      const caller = createCaller();
      const result = await caller.create(validInput);

      expect(result).toEqual({
        ids: ['b1', 'b2'],
        bookings: [{ id: 'b1' }, { id: 'b2' }],
        status: 'success',
        message: '已成功创建 2 个预约（按店铺拆分）',
      });
    });
  });

  describe('listByDateRange', () => {
    it('管理员查询日期范围预约', async () => {
      const mockBookings = [{ id: 'b1', visitDate: '2025-03-01' }];
      mockBookingService.listByDateRange.mockResolvedValue(mockBookings);

      const caller = createAdminCaller();
      const result = await caller.listByDateRange({
        start: '2025-03-01',
        end: '2025-03-31',
      });

      expect(mockBookingService.listByDateRange).toHaveBeenCalledWith(
        mockPrisma,
        '2025-03-01',
        '2025-03-31',
      );
      expect(result).toEqual(mockBookings);
    });

    it('非管理员用户无权访问', async () => {
      const caller = bookingRouter.createCaller({
        prisma: mockPrisma,
        user: { id: 'u1', role: 'USER' },
        session: {},
      } as any);

      await expect(
        caller.listByDateRange({ start: '2025-03-01', end: '2025-03-31' }),
      ).rejects.toThrow(TRPCError);
    });

    it('未登录用户无权访问', async () => {
      const caller = createCaller();

      await expect(
        caller.listByDateRange({ start: '2025-03-01', end: '2025-03-31' }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
