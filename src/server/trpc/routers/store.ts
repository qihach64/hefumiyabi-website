import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { storeService } from '@/server/services/store.service';

export const storeRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return storeService.list(ctx.prisma);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return storeService.getById(ctx.prisma, input.id);
    }),
});
