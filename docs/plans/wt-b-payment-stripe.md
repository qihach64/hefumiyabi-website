# WT-B: Stripe 支付集成

> 分支: `feat/payment-stripe` | 合并优先级: 最后合并

## Context

预约系统已完整（多店铺预约、事务保护、服务端价格校验），但缺少在线支付。需集成 Stripe Hosted Checkout，支持登录用户和游客在线支付，同时保留"到店付款"选项。

## 现有关键文件

| 文件 | 当前状态 |
|------|---------|
| `prisma/schema.prisma` | Booking 模型已有 totalAmount/depositAmount/paidAmount/paymentStatus/paymentMethod 字段 |
| `src/server/services/booking.service.ts` | 预约创建逻辑（158行），含多店铺拆分、事务保护、服务端价格校验 |
| `src/server/trpc/routers/booking.ts` | create (publicProcedure) + listByDateRange (adminProcedure) |
| `src/server/schemas/booking.schema.ts` | 预约创建 Zod schema |
| `src/app/(main)/booking/page.tsx` | 预约确认页（Server Component） |
| `src/app/(main)/booking/success/page.tsx` | 预约成功页 |
| `src/app/api/bookings/route.ts` | REST API 创建预约（同时存在 tRPC 和 REST 两种方式） |
| `src/lib/email.ts` | Nodemailer，已有预约确认邮件 |
| `src/store/cart.ts` | Zustand 购物车，完整实现 |
| `.env.example` | 已有 Stripe 配置注释 |

## PaymentStatus 枚举（已有）

```prisma
enum PaymentStatus {
  PENDING   // 待支付
  PARTIAL   // 部分支付
  PAID      // 已支付
  REFUNDED  // 已退款
}
```

## 需修改的文件

- `prisma/schema.prisma` — Booking 添加 stripeSessionId/paidAt/refundedAt/refundAmount 字段
- `src/app/(main)/booking/page.tsx` — 提交后跳转支付选择页
- `src/server/schemas/index.ts` — 导出新 schema
- `src/server/trpc/routers/index.ts` — 注册 payment router
- `src/lib/email.ts` — 追加支付成功/失败邮件函数
- `.env.example` — 取消 Stripe 配置注释并补充 webhook secret

## 需新建的文件

- `src/lib/stripe.ts` — Stripe 服务端客户端初始化
- `src/server/services/payment.service.ts` — 支付业务逻辑
- `src/server/schemas/payment.schema.ts` — 支付 Zod schema
- `src/server/trpc/routers/payment.ts` — 支付 tRPC router
- `src/app/api/webhooks/stripe/route.ts` — Stripe webhook（唯一新 REST 端点，Stripe 直接回调所以无法用 tRPC）
- `src/app/(main)/booking/pay/page.tsx` — 支付页（Server Component）
- `src/app/(main)/booking/pay/PaymentClient.tsx` — 支付页客户端组件

## 实施步骤

### 步骤 1: 安装依赖

```bash
pnpm add stripe @stripe/stripe-js
```

注意：使用 Stripe Hosted Checkout（跳转模式），不需要 `@stripe/react-stripe-js`（那是嵌入式 Elements 用的）。

### 步骤 2: Prisma Schema 更新

在 Booking 模型中添加：

```prisma
model Booking {
  // ... 现有字段 ...
  stripeSessionId  String?   @map("stripe_session_id")
  paidAt           DateTime? @map("paid_at")
  refundedAt       DateTime? @map("refunded_at")
  refundAmount     Int       @default(0) @map("refund_amount")

  @@index([stripeSessionId])
}
```

执行 `pnpm prisma db push && pnpm prisma generate`

### 步骤 3: Stripe 客户端初始化

新建 `src/lib/stripe.ts`：

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

### 步骤 4: 支付 Service

新建 `src/server/services/payment.service.ts`：

**核心方法：**

1. `createCheckoutSession(bookingId, customerEmail?)`
   - 从 DB 查询 Booking + BookingItems
   - 构建 `line_items`（从 BookingItem 生成，name/unitPrice/quantity）
   - 价格单位：当前以分存储，Stripe CNY 也是最小单位（分），直接传入
   - `success_url`: `/booking/success?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/booking/pay?bookingId={bookingId}`
   - `metadata`: `{ bookingId }`
   - `customer_email`: 传入游客邮箱或登录用户邮箱
   - 创建后更新 Booking.stripeSessionId
   - 返回 checkout session URL

2. `handleWebhookEvent(event)`
   - `checkout.session.completed`: 从 metadata 取 bookingId → 更新 paymentStatus=PAID, paidAmount=totalAmount, paidAt=now, paymentMethod="stripe"
   - `charge.refunded`: 更新 paymentStatus=REFUNDED, refundedAt=now

3. `createRefund(bookingId, amount?)`
   - 查询 Booking.stripeSessionId → 获取 payment_intent → 创建 refund
   - 部分退款：传 amount；全额退款：不传
   - 更新 Booking 的 refundAmount 和 paymentStatus

### 步骤 5: 支付 Schema + Router

新建 `src/server/schemas/payment.schema.ts`：

```typescript
import { z } from 'zod';

export const createCheckoutSchema = z.object({
  bookingId: z.string().min(1, '预约ID不能为空'),
  customerEmail: z.string().email().optional(), // 游客提供邮箱
});

export const createRefundSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().int().positive().optional(), // 部分退款金额（分），不传则全额
});
```

新建 `src/server/trpc/routers/payment.ts`：

```typescript
export const paymentRouter = router({
  // 创建 Checkout Session（游客和登录用户都可以）
  createCheckout: publicProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ input, ctx }) => {
      const email = ctx.user?.email || input.customerEmail;
      return paymentService.createCheckoutSession(input.bookingId, email);
    }),

  // 查询支付状态
  getStatus: publicProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(/* ... */),

  // 退款（仅管理员）
  createRefund: adminProcedure
    .input(createRefundSchema)
    .mutation(/* ... */),
});
```

在 `src/server/trpc/routers/index.ts` 注册：
```typescript
import { paymentRouter } from './payment';
// appRouter 中添加: payment: paymentRouter,
```

### 步骤 6: Stripe Webhook

新建 `src/app/api/webhooks/stripe/route.ts`：

```typescript
import { stripe } from '@/lib/stripe';
import { paymentService } from '@/server/services/payment.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text(); // raw body
  const signature = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: '签名验证失败' }, { status: 400 });
  }

  await paymentService.handleWebhookEvent(event);
  return NextResponse.json({ received: true });
}
```

### 步骤 7: 支付页面

**`src/app/(main)/booking/pay/page.tsx`（Server Component）：**
- 从 URL 获取 `bookingId` 参数
- 查询 Booking 信息
- 渲染 PaymentClient

**`src/app/(main)/booking/pay/PaymentClient.tsx`（Client Component）：**
- 显示订单摘要（套餐名、店铺、日期、金额）
- 两个按钮：
  - "在线支付" → 调用 tRPC payment.createCheckout → 获取 URL → `window.location.href = url`
  - "到店付款" → 直接跳转 `/booking/success?bookingId=xxx`
- 鼓励在线支付：在线支付按钮更突出（primary），到店付款是次要按钮（secondary/outline）
- 显示"在线支付可享受更快确认"等引导文案

### 步骤 8: 修改预约提交流程

修改 `src/app/(main)/booking/page.tsx`：
- 预约提交成功后，不再直接跳转成功页
- 改为跳转到 `/booking/pay?bookingId=xxx`
- 让用户选择支付方式

### 步骤 9: 更新成功页

修改 `src/app/(main)/booking/success/page.tsx`：
- 支持 `session_id` 参数（Stripe 支付完成后跳转带此参数）
- 支持 `bookingId` 参数（到店付款跳转带此参数）
- 已支付：显示"支付成功，预约已确认"
- 到店付款：显示"预约已提交，请到店时支付"

### 步骤 10: 支付邮件

在 `src/lib/email.ts` 追加：

- `sendPaymentSuccessEmail(email, name, booking)` — 支付成功通知，包含订单号/金额/到店信息
- `sendPaymentFailedEmail(email, name, booking)` — 支付失败通知，提供重试链接

这些邮件从 webhook handler 中触发（payment.service.ts 的 handleWebhookEvent）。

### 步骤 11: 更新 .env.example

```bash
# Stripe 支付
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## 支付流程总结

```
用户选套餐 → 加购物车 → 预约确认页
                              ↓
                    提交预约（创建 Booking, paymentStatus=PENDING）
                              ↓
                    跳转 /booking/pay?bookingId=xxx
                       ↙              ↘
              "在线支付"              "到店付款"
                  ↓                      ↓
         创建 Stripe Session        跳转成功页
                  ↓                 (paymentStatus=PENDING)
         跳转 Stripe Checkout
                  ↓
         支付成功/取消
           ↙         ↘
    webhook 回调    返回支付页重试
    更新 PAID
    发送邮件
    跳转成功页
```

## 验证清单

- [ ] `pnpm prisma db push && pnpm prisma generate` 成功
- [ ] `pnpm build` 编译通过
- [ ] Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] 测试卡 `4242 4242 4242 4242` 支付成功
- [ ] 登录用户在线支付完整流程
- [ ] 游客在线支付完整流程（填邮箱后支付）
- [ ] 到店付款流程（跳过支付直接成功）
- [ ] Webhook 正确更新 paymentStatus
- [ ] 支付成功邮件发送
- [ ] 退款 API 正常
- [ ] `pnpm test --run` 现有测试通过

## 冲突注意

- `src/lib/email.ts`: 只追加支付相关邮件函数，不修改已有代码
- `src/server/trpc/routers/index.ts`: 只追加 payment router 注册
- `src/server/schemas/index.ts`: 只追加 export 行
- `src/app/(main)/booking/page.tsx`: 修改提交后的跳转逻辑，合并时注意
- `prisma/schema.prisma`: 本 WT 独占修改，无冲突风险
