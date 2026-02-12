import { z } from 'zod';

// 商家注册
export const merchantRegisterSchema = z.object({
  businessName: z.string().min(1, '请填写商家名称').max(100),
  legalName: z.string().max(100).optional().nullable(),
  description: z.string().min(1, '请填写商家描述').max(1000),
  logo: z.string().url().optional().nullable(),
  taxId: z.string().min(1, '请填写税号'),
  bankAccount: z.string().min(1, '请填写银行账号'),
});

export type MerchantRegisterInput = z.infer<typeof merchantRegisterSchema>;
