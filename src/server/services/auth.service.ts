import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { RegisterInput } from '@/server/schemas';

// 认证服务
export const authService = {
  async register(
    prisma: PrismaClient,
    input: RegisterInput,
    sendVerificationEmail?: (email: string, token: string) => Promise<void>,
    generateVerificationToken?: (email: string) => Promise<string>,
  ) {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new TRPCError({ code: 'CONFLICT', message: '该邮箱已被注册' });
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name || input.email.split('@')[0],
        emailVerified: null,
      },
    });

    // 发送验证邮件（非阻塞）
    if (generateVerificationToken && sendVerificationEmail) {
      try {
        const token = await generateVerificationToken(input.email);
        await sendVerificationEmail(input.email, token);
      } catch {
        // 邮件发送失败不影响注册
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  },
};
