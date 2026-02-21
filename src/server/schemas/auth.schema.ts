import { z } from 'zod';

// 用户注册
export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少8个字符'),
  name: z.string().max(50).optional(),
});

// 登录（如需）
export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// 忘记密码（申请重置）
export const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
});

// 重置密码（凭 token 设置新密码）
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'token 不能为空'),
  password: z.string().min(6, '密码至少6个字符'),
});

// 修改密码（已登录用户）
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
