# WT-A: 认证系统完善

> 分支: `feat/auth-complete` | 合并优先级: 最先合并

## Context

当前认证系统仅支持邮箱/密码登录（NextAuth Credentials Provider），需要补全 Google OAuth、密码重置流程和路由保护中间件。

## 现有关键文件

| 文件 | 当前状态 |
|------|---------|
| `src/auth.ts` | NextAuth 配置，仅 CredentialsProvider，JWT session + PrismaAdapter |
| `src/app/(auth)/login/page.tsx` | 登录页，邮箱+密码表单 |
| `src/app/(auth)/register/page.tsx` | 注册页，姓名+邮箱+密码+确认密码 |
| `src/lib/tokens.ts` | Token 生成/验证，用于邮箱验证（VerificationToken 模型） |
| `src/lib/email.ts` | Nodemailer SMTP，已有 sendVerificationEmail + sendBookingConfirmationEmail |
| `src/server/schemas/auth.schema.ts` | 认证相关 Zod schema |
| `src/server/services/auth.service.ts` | 认证业务逻辑（目前较简单） |
| `src/types/next-auth.d.ts` | Session/JWT TypeScript 扩展（含 id, role） |
| `prisma/schema.prisma` | User + Account + VerificationToken 模型已就绪 |

## 需修改的文件

- `src/auth.ts` — 添加 Google Provider
- `src/app/(auth)/login/page.tsx` — OAuth 按钮 + "忘记密码"链接
- `src/app/(auth)/register/page.tsx` — OAuth 按钮
- `src/lib/tokens.ts` — 支持密码重置 token（复用 VerificationToken，identifier 用 `reset:email` 前缀区分）
- `src/lib/email.ts` — 追加 `sendPasswordResetEmail()` 函数
- `src/server/schemas/auth.schema.ts` — 添加 forgotPasswordSchema + resetPasswordSchema + changePasswordSchema
- `src/server/services/auth.service.ts` — 添加 requestPasswordReset / confirmPasswordReset / changePassword
- `src/server/schemas/index.ts` — 导出新 schema
- `.env.example` — 添加 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET

## 需新建的文件

- `src/middleware.ts` — Next.js middleware 路由保护
- `src/app/(auth)/forgot-password/page.tsx` — 忘记密码页
- `src/app/(auth)/reset-password/page.tsx` — 重置密码页（?token=xxx）

## 实施步骤

### 步骤 1: Google OAuth

在 `src/auth.ts` 中添加 GoogleProvider：

```typescript
import GoogleProvider from "next-auth/providers/google";

// providers 数组中添加：
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
}),
```

**要点：**
- 已有 PrismaAdapter + JWT strategy，OAuth 用户会自动创建 User + Account 记录，session 仍通过 JWT 管理
- JWT callback 中 `user` 参数对 OAuth 用户同样包含 `id` 和 `role`（role 默认 USER）
- OAuth 用户的 `passwordHash` 为 null，后续密码修改页需处理此情况

### 步骤 2: 登录/注册页 UI 更新

**登录页 (`src/app/(auth)/login/page.tsx`):**
- 顶部添加 "Google 登录" 按钮，调用 `signIn("google")`
- 添加分割线 "或使用邮箱登录"
- 密码输入框下方添加 `<Link href="/forgot-password">忘记密码？</Link>`

**注册页 (`src/app/(auth)/register/page.tsx`):**
- 同样添加 "Google 登录" 按钮
- 添加分割线

### 步骤 3: 密码重置流程

**3a. Token 扩展 (`src/lib/tokens.ts`):**
- 复用 VerificationToken 模型
- `generatePasswordResetToken(email)`: identifier = `reset:${email}`，expires = 1 小时
- `verifyPasswordResetToken(token)`: 验证有效性和过期

**3b. 邮件 (`src/lib/email.ts`):**
- 追加 `sendPasswordResetEmail(email, token)` 函数
- HTML 模板风格与验证邮件一致（粉色渐变 + 按钮）
- 链接格式: `${NEXTAUTH_URL}/reset-password?token=${token}`
- 有效期提示: 1 小时

**3c. Schema (`src/server/schemas/auth.schema.ts`):**
```typescript
export const forgotPasswordSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, '密码至少6个字符'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
});
```

**3d. Service (`src/server/services/auth.service.ts`):**
- `requestPasswordReset(email)`: 查找用户 → 生成 token → 发送邮件（用户不存在也返回成功，防枚举）
- `confirmPasswordReset(token, newPassword)`: 验证 token → bcrypt hash → 更新 passwordHash → 删除 token
- `changePassword(userId, currentPassword, newPassword)`: 验证旧密码 → hash 新密码 → 更新

**3e. 忘记密码页 (`src/app/(auth)/forgot-password/page.tsx`):**
- Client Component
- 输入邮箱 → 调用 API → 显示"重置链接已发送到您的邮箱"
- 无论邮箱是否存在都显示相同提示

**3f. 重置密码页 (`src/app/(auth)/reset-password/page.tsx`):**
- Client Component
- URL: `/reset-password?token=xxx`
- 输入新密码 + 确认密码 → 调用 API → 成功跳转登录页

### 步骤 4: Middleware 路由保护

新建 `src/middleware.ts`：

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // /profile 需要登录
  if (pathname.startsWith("/profile") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录用户不需要登录/注册页
  if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/profile/:path*", "/login", "/register"],
};
```

**注意：**
- `/booking` 不做路由保护（支持游客预约）
- `/profile/*` 强制登录

### 步骤 5: 更新 .env.example

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 验证清单

- [ ] `pnpm build` 编译通过
- [ ] Google OAuth 登录/注册正常（需 Google Cloud Console 配置）
- [ ] 邮箱/密码登录仍然正常
- [ ] 忘记密码 → 发送邮件 → 点击链接 → 重置成功 → 登录
- [ ] 密码修改 API 正常（前端入口在 WT-C 中实现）
- [ ] 未登录访问 /profile → 重定向 /login?callbackUrl=/profile
- [ ] 已登录访问 /login → 重定向首页
- [ ] /booking 未登录仍可访问
- [ ] `pnpm test --run` 现有测试通过

## 冲突注意

- `src/lib/email.ts`: 本 WT 只追加 `sendPasswordResetEmail()` 函数，不修改已有代码
- `src/server/schemas/index.ts`: 只追加 export 行
