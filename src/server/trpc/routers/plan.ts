import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { planService } from '@/server/services/plan.service';

export const planRouter = router({
  list: publicProcedure
    .input(
      z.object({
        theme: z.string().optional(),
        storeId: z.string().optional(),
        location: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return planService.getList(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const plan = await planService.getById(input.id);
      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }
      return plan;
    }),

  featured: publicProcedure
    .input(z.object({ limit: z.number().default(8) }).optional())
    .query(async ({ input }) => {
      return planService.getFeatured(input?.limit);
    }),

  // 获取首页搜索模式的所有套餐（按需加载）
  searchAll: publicProcedure
    .query(async () => {
      const data = await planService.getHomepagePlans();
      return data.allPlans;
    }),

  // 获取相关套餐（客户端懒加载用）
  relatedPlans: publicProcedure
    .input(
      z.object({
        themeId: z.string(),
        excludeId: z.string(),
        limit: z.number().default(8),
      })
    )
    .query(async ({ input }) => {
      return planService.getRelatedPlans(input.themeId, input.excludeId, input.limit);
    }),
});
