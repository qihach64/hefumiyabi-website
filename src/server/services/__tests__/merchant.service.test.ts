import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { merchantService } from '../merchant.service';

// mock prisma（merchantService 接收 prisma 作为参数）
const mockPrisma = {
  merchant: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
} as any;

describe('merchantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    const input = {
      businessName: '京都和服店',
      description: '专注传统和服租赁',
      taxId: 'TAX-123',
      bankAccount: 'BANK-456',
    };

    it('已注册时抛 CONFLICT', async () => {
      mockPrisma.merchant.findUnique.mockResolvedValue({ id: 'existing-merchant' });

      await expect(
        merchantService.register(mockPrisma, input as any, 'user-1'),
      ).rejects.toThrow(new TRPCError({ code: 'CONFLICT', message: '您已经注册为商家' }));
    });

    it('正常注册', async () => {
      mockPrisma.merchant.findUnique.mockResolvedValue(null);
      mockPrisma.merchant.create.mockResolvedValue({
        id: 'merchant-1',
        businessName: '京都和服店',
        status: 'PENDING',
      });

      const result = await merchantService.register(mockPrisma, input as any, 'user-1');

      expect(result).toEqual({
        id: 'merchant-1',
        businessName: '京都和服店',
        status: 'PENDING',
      });
      expect(mockPrisma.merchant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ownerId: 'user-1',
          businessName: '京都和服店',
          status: 'PENDING',
          verified: false,
          commissionRate: 0.15,
        }),
      });
    });
  });
});
