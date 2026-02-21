# WT-C: 用户中心完善 + 邮件模板系统化

> 分支: `feat/user-center-email` | 合并优先级: 第二（在 WT-A 之后）

## Context

用户个人中心已有预约历史和收藏管理，但缺少资料编辑、密码修改和通知设置。邮件系统已用 Nodemailer + SMTP 实现了验证邮件和预约确认邮件，但模板是内联 HTML，需要系统化重构。

## 现有关键文件

| 文件 | 当前状态 |
|------|---------|
| `src/app/(main)/profile/page.tsx` | 个人中心主页，展示用户信息+预约历史+收藏入口 |
| `src/app/(main)/profile/wishlist/page.tsx` | 心愿单页面，已完成 |
| `src/lib/email.ts` | Nodemailer，2个邮件函数（验证+预约确认），内联 HTML 模板 |
| `src/server/services/auth.service.ts` | 认证服务（WT-A 会扩展 changePassword 方法） |
| `src/server/trpc/routers/index.ts` | 7个 router 已注册 |
| `prisma/schema.prisma` | UserPreference 模型已有 emailNotification/smsNotification 字段 |
| `src/app/api/bookings/[id]/cancel/route.ts` | 预约取消 REST API |

## UserPreference 模型（已存在）

```prisma
model UserPreference {
  id                String  @id @default(cuid())
  userId            String  @unique
  emailNotification Boolean @default(true)
  smsNotification   Boolean @default(false)
  language          String  @default("zh")
  // ...
  user              User    @relation(fields: [userId], references: [id])
}
```

## 需修改的文件

- `src/app/(main)/profile/page.tsx` — 添加编辑/密码/通知设置入口
- `src/lib/email.ts` — 重构所有邮件函数使用模板引擎
- `src/server/schemas/index.ts` — 导出新 schema
- `src/server/trpc/routers/index.ts` — 注册 user router
- `src/app/api/bookings/[id]/cancel/route.ts` — 取消时发送通知邮件

## 需新建的文件

- `src/lib/email-templates.ts` — 邮件模板引擎
- `src/server/schemas/user.schema.ts` — 用户资料 Zod schema
- `src/server/services/user.service.ts` — 用户资料服务
- `src/server/trpc/routers/user.ts` — 用户 tRPC router
- `src/app/(main)/profile/edit/page.tsx` — 资料编辑页（Server Component）
- `src/app/(main)/profile/edit/ProfileEditClient.tsx` — 资料编辑（Client Component）
- `src/app/(main)/profile/password/page.tsx` — 密码修改页（Server Component）
- `src/app/(main)/profile/password/PasswordChangeClient.tsx` — 密码修改（Client Component）
- `src/app/(main)/profile/notifications/page.tsx` — 通知设置页（Server Component）
- `src/app/(main)/profile/notifications/NotificationSettingsClient.tsx` — 通知设置（Client Component）

## 实施步骤

### 步骤 1: 邮件模板系统化

新建 `src/lib/email-templates.ts`：

```typescript
interface EmailTemplateProps {
  title: string;        // 邮件标题（显示在正文中）
  greeting?: string;    // 问候语，如 "尊敬的 张三"
  content: string;      // HTML 主体内容
  ctaText?: string;     // 按钮文案
  ctaUrl?: string;      // 按钮链接
  notice?: string;      // 黄色提示框内容（HTML）
  footer?: string;      // 自定义页脚
}

export function renderEmailTemplate(props: EmailTemplateProps): { html: string; text: string } {
  // 统一品牌外壳：
  // - 粉色渐变背景 (linear-gradient #fce7f3 → #fbcfe8)
  // - 🌸 江戸和装工房雅 logo
  // - 品牌色按钮 (#be123c → #db2777)
  // - 白色内容卡片
  // - 页脚：联系信息
  // 同时生成纯文本版本 (text)
}
```

重构 `src/lib/email.ts`，保持函数签名不变，内部改用模板：

```typescript
import { renderEmailTemplate } from './email-templates';

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  const { html, text } = renderEmailTemplate({
    title: '欢迎注册！',
    content: '<p>感谢您注册江戸和装工房雅。请点击下方按钮验证您的邮箱地址：</p>',
    ctaText: '验证邮箱',
    ctaUrl: verificationUrl,
    footer: '此验证链接将在 24 小时后失效',
  });
  // ... 发送逻辑不变
}
```

**新增邮件函数：**
- `sendBookingStatusChangeEmail(email, name, booking, newStatus)` — 预约状态变更
- `sendBookingCancelledEmail(email, name, booking)` — 预约取消确认
- `sendVisitReminderEmail(email, name, booking)` — 到店前一天提醒

### 步骤 2: User Schema

新建 `src/server/schemas/user.schema.ts`：

```typescript
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50).optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url('头像链接格式不正确').optional(),
  birthday: z.string().optional(), // YYYY-MM-DD
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export const updateNotificationPrefsSchema = z.object({
  emailNotification: z.boolean().optional(),
  smsNotification: z.boolean().optional(),
  language: z.string().optional(),
});
```

在 `src/server/schemas/index.ts` 导出。

### 步骤 3: User Service

新建 `src/server/services/user.service.ts`：

```typescript
export const userService = {
  async getProfile(prisma, userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, birthday: true, gender: true,
        emailVerified: true, role: true,
        passwordHash: false, // 不返回密码
      },
    });
  },

  async updateProfile(prisma, userId, input) {
    return prisma.user.update({
      where: { id: userId },
      data: input,
    });
  },

  async getNotificationPrefs(prisma, userId) {
    // 如果不存在则创建默认值
    return prisma.userPreference.upsert({
      where: { userId },
      create: { userId, emailNotification: true, smsNotification: false },
      update: {},
    });
  },

  async updateNotificationPrefs(prisma, userId, input) {
    return prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });
  },

  // 检查用户是否有密码（区分 OAuth 用户）
  async hasPassword(prisma, userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    return !!user?.passwordHash;
  },
};
```

### 步骤 4: User Router

新建 `src/server/trpc/routers/user.ts`：

```typescript
export const userRouter = router({
  getProfile: protectedProcedure
    .query(({ ctx }) => userService.getProfile(ctx.prisma, ctx.user.id)),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(({ ctx, input }) => userService.updateProfile(ctx.prisma, ctx.user.id, input)),

  hasPassword: protectedProcedure
    .query(({ ctx }) => userService.hasPassword(ctx.prisma, ctx.user.id)),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(({ ctx, input }) => authService.changePassword(ctx.prisma, ctx.user.id, input)),

  getNotificationPrefs: protectedProcedure
    .query(({ ctx }) => userService.getNotificationPrefs(ctx.prisma, ctx.user.id)),

  updateNotificationPrefs: protectedProcedure
    .input(updateNotificationPrefsSchema)
    .mutation(({ ctx, input }) => userService.updateNotificationPrefs(ctx.prisma, ctx.user.id, input)),
});
```

在 `src/server/trpc/routers/index.ts` 注册：`user: userRouter`

### 步骤 5: 资料编辑页

**`src/app/(main)/profile/edit/page.tsx`（Server Component）：**
- 获取用户资料（通过 auth() + prisma 查询）
- 渲染 ProfileEditClient

**`src/app/(main)/profile/edit/ProfileEditClient.tsx`（Client Component）：**
- 表单字段：姓名、手机号、生日、性别
- 头像：URL 输入（暂不做上传）
- 提交调用 tRPC `user.updateProfile`
- 成功后显示提示 + 跳转回 /profile

### 步骤 6: 密码修改页

**`src/app/(main)/profile/password/page.tsx`（Server Component）：**
- 渲染 PasswordChangeClient

**`src/app/(main)/profile/password/PasswordChangeClient.tsx`（Client Component）：**
- 先调用 tRPC `user.hasPassword` 判断用户类型
- **有密码（邮箱注册用户）：** 显示旧密码+新密码+确认密码表单
- **无密码（OAuth 用户）：** 显示提示"您使用第三方账号登录，无需设置密码。如需添加密码登录方式，请使用以下功能设置密码。"
- 提交调用 tRPC `user.changePassword`
- 成功提示 + 返回 /profile

### 步骤 7: 通知设置页

**`src/app/(main)/profile/notifications/page.tsx`（Server Component）：**
- 渲染 NotificationSettingsClient

**`src/app/(main)/profile/notifications/NotificationSettingsClient.tsx`（Client Component）：**
- 开关组件：
  - 邮件通知（预约确认、状态变更、到店提醒）
  - 短信通知（预留，显示"即将推出"）
- 调用 tRPC `user.updateNotificationPrefs`
- 实时保存，无需提交按钮

### 步骤 8: 更新 Profile 主页

修改 `src/app/(main)/profile/page.tsx`：

在用户信息区域下方添加功能入口卡片：

```
┌─────────────────────────┐
│ 👤 编辑资料              → │
│ 修改姓名、手机号等个人信息    │
├─────────────────────────┤
│ 🔒 修改密码              → │
│ 更新您的登录密码            │
├─────────────────────────┤
│ 🔔 通知设置              → │
│ 管理邮件和短信通知偏好      │
└─────────────────────────┘
```

使用 `<Link>` 跳转到对应子页面。

### 步骤 9: 预约取消通知邮件

修改 `src/app/api/bookings/[id]/cancel/route.ts`：
- 取消预约成功后，调用 `sendBookingCancelledEmail()`
- 非阻塞，邮件失败不影响取消操作

### 步骤 10: 到店提醒（Vercel Cron，可选）

如果部署在 Vercel，可添加定时任务：

新建 `src/app/api/cron/visit-reminder/route.ts`：
```typescript
export async function GET(req: Request) {
  // 验证 CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 查询明天到店的预约
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
  const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

  const bookings = await prisma.booking.findMany({
    where: {
      visitDate: { gte: startOfDay, lte: endOfDay },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: { user: true, items: { include: { store: true, plan: true } } },
  });

  // 逐个发送提醒邮件（检查通知偏好）
  for (const booking of bookings) {
    const email = booking.guestEmail || booking.user?.email;
    if (email) {
      await sendVisitReminderEmail(email, booking.guestName || booking.user?.name || '', booking);
    }
  }

  return Response.json({ sent: bookings.length });
}
```

在 `vercel.json` 配置：
```json
{
  "crons": [{
    "path": "/api/cron/visit-reminder",
    "schedule": "0 9 * * *"
  }]
}
```

**注意：** 此步骤为可选功能，如果不部署在 Vercel 可暂时跳过。

## 验证清单

- [ ] `pnpm build` 编译通过
- [ ] 资料编辑：修改姓名 → 刷新 profile 看到更新
- [ ] 资料编辑：手机号、生日、性别保存正确
- [ ] 密码修改（邮箱用户）：旧密码验证 → 新密码 → 重新登录成功
- [ ] 密码修改（OAuth 用户）：显示提示信息，不显示旧密码输入
- [ ] 通知设置：开关切换 → 检查 DB UserPreference 记录
- [ ] 邮件模板：所有邮件使用统一品牌模板，视觉一致
- [ ] 预约取消邮件：取消预约后收到通知邮件
- [ ] Profile 主页：三个入口卡片正常跳转
- [ ] `pnpm test --run` 现有测试通过

## 冲突注意

- `src/lib/email.ts`: 本 WT 做系统化重构，合并时需处理 WT-A 追加的 `sendPasswordResetEmail()` 函数，将其也迁移到模板系统
- `src/server/trpc/routers/index.ts`: 只追加 user router 注册
- `src/server/schemas/index.ts`: 只追加 export 行
- `src/app/(main)/profile/page.tsx`: 本 WT 独占修改
- `changePasswordSchema`: 如果 WT-A 尚未合并，在 user.schema.ts 临时定义；合并后改为从 auth.schema.ts 导入
