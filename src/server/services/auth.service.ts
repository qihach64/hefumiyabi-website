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

  // 申请密码重置（用户不存在也返回成功，防枚举攻击）
  async requestPasswordReset(
    prisma: PrismaClient,
    email: string,
    generateResetToken: (email: string) => Promise<string>,
    sendResetEmail: (email: string, token: string) => Promise<unknown>,
  ) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true }; // 防枚举：不泄露用户是否存在

    try {
      const token = await generateResetToken(email);
      await sendResetEmail(email, token);
    } catch {
      // 邮件发送失败不影响响应（避免信息泄露）
    }

    return { success: true };
  },

  // 确认密码重置
  async confirmPasswordReset(
    prisma: PrismaClient,
    token: string,
    newPassword: string,
    verifyResetToken: (token: string) => Promise<{ valid: boolean; email?: string; error?: string }>,
    deleteUsedToken: (token: string) => Promise<void>,
  ) {
    const result = await verifyResetToken(token);
    if (!result.valid || !result.email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: result.error || '无效的重置链接',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: result.email },
      data: { passwordHash },
    });

    await deleteUsedToken(token);

    return { success: true };
  },

  // 修改密码（已登录用户）
  async changePassword(
    prisma: PrismaClient,
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
    }

    // OAuth 用户没有密码
    if (!user.passwordHash) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '您的账户通过 Google 登录，不支持密码修改',
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '当前密码错误' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { success: true };
  },
};
