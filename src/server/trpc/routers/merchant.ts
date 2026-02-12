import { z } from 'zod';
import { router, protectedProcedure, merchantProcedure } from '../trpc';
import { merchantRegisterSchema, createPlanSchema, updatePlanSchema } from '@/server/schemas';
import { merchantService } from '@/server/services/merchant.service';
import { merchantPlanService } from '@/server/services/merchant-plan.service';

export const merchantRouter = router({
  // 商家注册（仅需登录）
  register: protectedProcedure
    .input(merchantRegisterSchema)
    .mutation(async ({ ctx, input }) => {
      return merchantService.register(ctx.prisma, input, ctx.user.id);
    }),

  // 套餐管理（需商家认证）
  plan: router({
    create: merchantProcedure
      .input(createPlanSchema)
      .mutation(async ({ ctx, input }) => {
        return merchantPlanService.create(ctx.prisma, input, ctx.merchant.id, ctx.user.id);
      }),

    update: merchantProcedure
      .input(z.object({
        id: z.string(),
        data: updatePlanSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        return merchantPlanService.update(
          ctx.prisma,
          input.id,
          input.data,
          ctx.merchant.id,
          ctx.user.id,
        );
      }),

    delete: merchantProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await merchantPlanService.softDelete(ctx.prisma, input.id, ctx.merchant.id);
        return { success: true };
      }),
  }),
});
