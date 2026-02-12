import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

// 商家 procedure: DB 查询 + APPROVED 检查 + ctx 注入
export const merchantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const merchant = await ctx.prisma.merchant.findUnique({
    where: { ownerId: ctx.user.id },
    select: { id: true, status: true, businessName: true },
  });

  if (!merchant) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '未找到商家账户' });
  }
  if (merchant.status === 'SUSPENDED') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '商家账户已被暂停' });
  }
  if (merchant.status !== 'APPROVED') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '商家账户未审核通过' });
  }

  return next({ ctx: { ...ctx, merchant } });
});

// 管理员 procedure: ADMIN 或 STAFF
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user.role;
  if (role !== 'ADMIN' && role !== 'STAFF') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' });
  }
  return next({ ctx });
});
