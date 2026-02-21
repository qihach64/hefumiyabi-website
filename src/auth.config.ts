import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth 基础配置 — Edge 兼容（不引入 Prisma / bcrypt）
 * middleware 使用此配置，避免 Edge Function 体积超限
 */
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  // providers 在 auth.ts 中补充（Credentials / Google 依赖 Node.js 运行时）
  providers: [],
} satisfies NextAuthConfig;
