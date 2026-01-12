import { router } from '../trpc';
import { healthRouter } from './health';
import { planRouter } from './plan';

export const appRouter = router({
  health: healthRouter,
  plan: planRouter,
});

export type AppRouter = typeof appRouter;
