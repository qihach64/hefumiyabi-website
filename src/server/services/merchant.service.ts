import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import type { MerchantRegisterInput } from '@/server/schemas';

// 商家服务
export const merchantService = {
  async register(prisma: PrismaClient, input: MerchantRegisterInput, userId: string) {
    // 检查是否已注册
    const existing = await prisma.merchant.findUnique({
      where: { ownerId: userId },
    });
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: '您已经注册为商家' });
    }

    const merchant = await prisma.merchant.create({
      data: {
        ownerId: userId,
        businessName: input.businessName,
        legalName: input.legalName || null,
        description: input.description,
        logo: input.logo || null,
        bankAccount: input.bankAccount,
        taxId: input.taxId,
        status: 'PENDING',
        verified: false,
        commissionRate: 0.15,
      },
    });

    return {
      id: merchant.id,
      businessName: merchant.businessName,
      status: merchant.status,
    };
  },
};
