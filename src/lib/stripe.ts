import Stripe from 'stripe';

// 延迟初始化，避免构建时报错（环境变量仅运行时可用）
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-04-30.basil',
      typescript: true,
    });
  }
  return _stripe;
}

// 便捷导出
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as Record<string | symbol, unknown>)[prop];
  },
});
