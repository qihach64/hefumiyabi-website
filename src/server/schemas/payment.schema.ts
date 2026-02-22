import { z } from 'zod';

// 创建 Stripe Checkout Session
export const createCheckoutSchema = z.object({
  bookingId: z.string().min(1, '预约ID不能为空'),
  customerEmail: z.string().email('邮箱格式不正确').optional(),
});

// 创建退款
export const createRefundSchema = z.object({
  bookingId: z.string().min(1, '预约ID不能为空'),
  amount: z.number().int().positive().optional(), // 不传=全额退款
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
