import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

/**
 * Prisma 异常 → TRPCError 转换
 * 在 service 层捕获已知异常，避免泄露数据库细节
 */
export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new TRPCError({ code: 'CONFLICT', message: '记录已存在' });
    }
    if (error.code === 'P2025') {
      throw new TRPCError({ code: 'NOT_FOUND', message: '记录不存在' });
    }
  }
  throw error;
}
