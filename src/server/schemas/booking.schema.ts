import { z } from 'zod';

// 预约单项
const bookingItemSchema = z.object({
  storeId: z.string().min(1, '店铺ID不能为空'),
  type: z.string(),
  planId: z.string().optional(),
  quantity: z.number().int().positive().optional().default(1),
  unitPrice: z.number().int().nonnegative(),
  totalPrice: z.number().int().nonnegative(),
  addOns: z.array(z.string()).optional().default([]),
  notes: z.string().max(500).optional().nullable(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式: YYYY-MM-DD').optional(),
  visitTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式: HH:MM').optional(),
});

// 创建预约
export const createBookingSchema = z.object({
  // 游客联系信息
  guestName: z.string().max(100).optional(),
  guestEmail: z.string().email('邮箱格式不正确').optional(),
  guestPhone: z.string().max(20).optional(),
  specialRequests: z.string().max(1000).optional(),

  // 预约时间（单店铺预约时的全局时间）
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  visitTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),

  // 商品列表
  items: z.array(bookingItemSchema).min(1, '至少需要一个套餐').max(50),

  // 预计算总额（可选，服务端会重新计算）
  totalAmount: z.number().int().nonnegative().optional(),
  depositAmount: z.number().int().nonnegative().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingItemInput = z.infer<typeof bookingItemSchema>;
