import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { createBookingSchema } from '@/server/schemas';
import { bookingService } from '@/server/services/booking.service';

export const bookingRouter = router({
  // 创建预约（游客也可以，所以用 publicProcedure）
  create: publicProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? null;
      const userName = ctx.user?.name ?? null;
      const userEmail = ctx.user?.email ?? null;

      const bookings = await bookingService.create(
        ctx.prisma,
        input,
        userId,
        userName,
        userEmail,
      );

      if (bookings.length === 1) {
        return { id: bookings[0].id, status: 'success' as const };
      }
      return {
        ids: bookings.map((b) => b.id),
        bookings,
        status: 'success' as const,
        message: `已成功创建 ${bookings.length} 个预约（按店铺拆分）`,
      };
    }),

  // 管理后台：按日期范围查询
  listByDateRange: adminProcedure
    .input(z.object({
      start: z.string(),
      end: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return bookingService.listByDateRange(ctx.prisma, input.start, input.end);
    }),
});
