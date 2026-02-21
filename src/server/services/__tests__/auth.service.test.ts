import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}));

import bcrypt from 'bcryptjs';
import { authService } from '../auth.service';

// mock prisma（authService 接收 prisma 作为参数）
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    const input = {
      email: 'test@example.com',
      password: 'password123',
      name: '测试用户',
    };

    it('邮箱已存在时抛 CONFLICT', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        authService.register(mockPrisma, input),
      ).rejects.toThrow(new TRPCError({ code: 'CONFLICT', message: '该邮箱已被注册' }));
    });

    it('正常注册（密码加密）', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: '测试用户',
      });

      const result = await authService.register(mockPrisma, input);

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: '测试用户',
      });
      // 验证密码加密后存储
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          name: '测试用户',
        }),
      });
    });

    it('可选验证邮件回调', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: '测试用户',
      });

      const mockGenerateToken = vi.fn().mockResolvedValue('token-123');
      const mockSendEmail = vi.fn().mockResolvedValue(undefined);

      await authService.register(mockPrisma, input, mockSendEmail, mockGenerateToken);

      expect(mockGenerateToken).toHaveBeenCalledWith('test@example.com');
      expect(mockSendEmail).toHaveBeenCalledWith('test@example.com', 'token-123');
    });

    it('邮件发送失败不影响注册', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: '测试用户',
      });

      const mockGenerateToken = vi.fn().mockResolvedValue('token-123');
      const mockSendEmail = vi.fn().mockRejectedValue(new Error('SMTP error'));

      const result = await authService.register(mockPrisma, input, mockSendEmail, mockGenerateToken);

      // 注册仍然成功
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: '测试用户',
      });
    });
  });

  describe('requestPasswordReset', () => {
    const mockGenerate = vi.fn().mockResolvedValue('reset-token-123');
    const mockSend = vi.fn().mockResolvedValue({ success: true });

    it('用户不存在时仍返回成功（防枚举）', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.requestPasswordReset(
        mockPrisma, 'nouser@example.com', mockGenerate, mockSend,
      );

      expect(result).toEqual({ success: true });
      // 不应调用 token 生成或发邮件
      expect(mockGenerate).not.toHaveBeenCalled();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('正常时生成 token 并发邮件', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

      const result = await authService.requestPasswordReset(
        mockPrisma, 'test@example.com', mockGenerate, mockSend,
      );

      expect(result).toEqual({ success: true });
      expect(mockGenerate).toHaveBeenCalledWith('test@example.com');
      expect(mockSend).toHaveBeenCalledWith('test@example.com', 'reset-token-123');
    });
  });

  describe('confirmPasswordReset', () => {
    const mockVerify = vi.fn();
    const mockDelete = vi.fn().mockResolvedValue(undefined);

    it('token 无效时抛错', async () => {
      mockVerify.mockResolvedValue({ valid: false, error: '无效的重置链接' });

      await expect(
        authService.confirmPasswordReset(mockPrisma, 'bad-token', 'newpass', mockVerify, mockDelete),
      ).rejects.toThrow('无效的重置链接');
    });

    it('token 过期时抛错', async () => {
      mockVerify.mockResolvedValue({ valid: false, error: '重置链接已过期' });

      await expect(
        authService.confirmPasswordReset(mockPrisma, 'old-token', 'newpass', mockVerify, mockDelete),
      ).rejects.toThrow('重置链接已过期');
    });

    it('成功时更新密码并删除 token', async () => {
      mockVerify.mockResolvedValue({ valid: true, email: 'test@example.com' });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.confirmPasswordReset(
        mockPrisma, 'valid-token', 'newpass123', mockVerify, mockDelete,
      );

      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { passwordHash: 'hashed-password' },
      });
      expect(mockDelete).toHaveBeenCalledWith('valid-token');
    });
  });

  describe('changePassword', () => {
    it('用户不存在时抛 NOT_FOUND', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword(mockPrisma, 'user-1', 'old', 'new'),
      ).rejects.toThrow('用户不存在');
    });

    it('OAuth 用户（passwordHash 为 null）抛错', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: null });

      await expect(
        authService.changePassword(mockPrisma, 'user-1', 'old', 'new'),
      ).rejects.toThrow('通过 Google 登录');
    });

    it('旧密码错误时抛 UNAUTHORIZED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'hash' });
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.changePassword(mockPrisma, 'user-1', 'wrong', 'new'),
      ).rejects.toThrow('当前密码错误');
    });

    it('成功时更新密码', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'old-hash' });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.changePassword(mockPrisma, 'user-1', 'correct', 'newpass');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'hashed-password' },
      });
    });
  });
});
