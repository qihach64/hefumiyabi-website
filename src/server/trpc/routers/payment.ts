import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { createCheckoutSchema, createRefundSchema } from '@/server/schemas';
import { paymentService } from '@/server/services/payment.service';

export const paymentRouter = router({
  // 创建 Stripe Checkout Session（游客和登录用户都可以）
  createCheckout: publicProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      return paymentService.createCheckoutSession(
        ctx.prisma,
        input.bookingId,
        input.customerEmail,
      );
    }),

  // 查询支付状态（通过 Stripe session_id）
  getStatus: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return paymentService.getSessionStatus(ctx.prisma, input.sessionId);
    }),

  // 创建退款（仅管理员）
  createRefund: adminProcedure
    .input(createRefundSchema)
    .mutation(async ({ ctx, input }) => {
      return paymentService.createRefund(ctx.prisma, input.bookingId, input.amount);
    }),
});
