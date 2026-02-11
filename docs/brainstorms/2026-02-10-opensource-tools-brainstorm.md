# Kimono One 开源工具迁移评估

> 日期: 2026-02-10
> 前置依赖: 架构重构 Phase 0-2 完成后执行

---

## 3.1 Email: React Email + Resend (3 天) — 立即执行

**当前**: `src/lib/email.ts` (328行), Nodemailer + 内联 HTML 字符串

**迁移到**:
```
src/server/email/
├── templates/
│   ├── layout.tsx                 ← 共享布局（品牌色 #be123c、logo、footer）
│   ├── verification.tsx           ← 验证邮件
│   └── booking-confirmation.tsx   ← 预约确认
├── send.ts                        ← Resend API 封装
└── index.ts
```

- 安装 `@react-email/components` + `resend`
- 移除 `nodemailer`
- 新增环境变量 `RESEND_API_KEY`
- 保持 `sendVerificationEmail` / `sendBookingConfirmationEmail` 函数签名不变

---

## 3.2 Auth: 保持 NextAuth v5 (暂不迁移)

**理由**: 当前 auth 层工作正常；Phase 0 补全了 role checking；迁移 Better Auth 是高风险操作（改表结构 + 30+ 处 import）。等 NextAuth v5 正式发布或出现明确瓶颈后再评估。

---

## 3.3 Payments: Stripe + PayPay (1 周) — Phase 1-2 后执行

**当前**: 无支付集成，Prisma schema 已有 PaymentStatus enum

**新增**:
```
src/server/payments/
├── stripe/client.ts + webhook.ts
└── paypay/client.ts + webhook.ts

src/server/services/payment.service.ts
  → createIntent(bookingId, provider)
  → handleWebhook(provider, payload)

src/app/api/payments/
├── create-intent/route.ts
├── webhook/route.ts          ← Stripe webhook
└── paypay/callback/route.ts  ← PayPay 回调

prisma/schema.prisma
  → 新增 Payment model (id, bookingId, amount, currency, provider, providerId, status)
```

---

## 3.4 Medusa.js — 做 spike 评估（1 周）

**评估点**: Product 能否映射 RentalPlan 全部字段？Cart 支持预约日期/时间？Admin 比自建省维护？
**建议**: 如果 spike 正面，作为独立项目执行，不在本重构范围

---

## 3.5 Cal.com — Phase 2 后评估

**价值点**: 商家设置可用时间段、冲突检测、Google Calendar 同步
**建议**: 当前预约流程足够简单，等商家端需求明确后再引入

---

## 3.6 Refine Admin — Phase 2 后评估

**价值点**: 开箱即用 CRUD、表格筛选分页、审批工作流
**建议**: Admin 功能有限时自建够用，功能增长后再考虑

---

## 执行顺序

```
Phase 3.1 (3天) ─── React Email + Resend
    │
Phase 3.3 (1周) ─── Stripe + PayPay 支付
    │
Phase 3.4-3.6 ─── Medusa / Cal.com / Refine spike（独立评估）
```

## 提交策略

```
refactor(email): 迁移到 React Email + Resend
feat(payments): Stripe 支付集成
feat(payments): PayPay 支付集成
```

## 验证方式

- Phase 3.1: 注册 → 收到验证邮件；预约 → 收到确认邮件
- Phase 3.3: Stripe 测试模式完成完整支付流程
