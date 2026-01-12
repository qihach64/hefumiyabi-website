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
