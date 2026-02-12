import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { favoriteService } from '@/server/services/favorite.service';

export const favoriteRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return favoriteService.list(ctx.prisma, ctx.user.id);
  }),

  add: protectedProcedure
    .input(z.object({
      planId: z.string(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return favoriteService.add(ctx.prisma, ctx.user.id, input.planId, input.imageUrl);
    }),

  remove: protectedProcedure
    .input(z.object({
      planId: z.string(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return favoriteService.remove(ctx.prisma, ctx.user.id, input.planId, input.imageUrl);
    }),

  sync: protectedProcedure
    .input(z.object({
      localFavorites: z.array(z.object({
        planId: z.string(),
        imageUrl: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      return favoriteService.sync(ctx.prisma, ctx.user.id, input.localFavorites);
    }),
});
