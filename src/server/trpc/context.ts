import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function createContext() {
  const session = await auth();

  return {
    prisma,
    session,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// merchantProcedure 注入到 ctx 中的商家信息
export type MerchantContext = {
  merchant: { id: string; status: string; businessName: string };
};
