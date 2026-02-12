import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
}));

import { authService } from '../auth.service';

// mock prisma（authService 接收 prisma 作为参数）
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
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
});
