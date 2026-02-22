import { router } from '../trpc';
import { healthRouter } from './health';
import { planRouter } from './plan';
import { storeRouter } from './store';
import { bookingRouter } from './booking';
import { favoriteRouter } from './favorite';
import { merchantRouter } from './merchant';
import { tagRouter } from './tag';
import { paymentRouter } from './payment';

export const appRouter = router({
  health: healthRouter,
  plan: planRouter,
  store: storeRouter,
  booking: bookingRouter,
  favorite: favoriteRouter,
  merchant: merchantRouter,
  tag: tagRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
