# Kimono One 架构重构 + 开源迁移计划

> 日期: 2026-02-10
> 范围: Service Layer, API Middleware, tRPC, 开源工具迁移

---

## Context

当前代码库存在架构不一致问题：47 个 REST 路由中约 50% 直接调用 Prisma，只有 `plan.service.ts` 一个服务层；tRPC 仅覆盖 plan + health；每个路由手动做 auth/error handling，格式不统一（`{error}` vs `{message}`）；`merchantProcedure`/`adminProcedure` 是空壳。此次重构旨在统一服务层、补全中间件、扩展 tRPC、并引入开源工具（React Email、Stripe 等）。

## 设计决策（已确认）

| 决策 | 选择 |
|------|------|
| Service 粒度 | 按领域分 (plan / booking / store / tag / ...) |
| API 风格 | 纯函数导出（与现有 plan.service.ts 一致） |
| 权限边界 | Service 不管权限，middleware 处理 |
| 错误处理 | 自定义 ServiceError + 统一映射 HTTP status |
| tRPC 策略 | REST 为主 + tRPC 辅助（未来需支持小程序/App） |
| plan.service | 拆出商家部分到 merchant-plan.service.ts |

---

## Phase 0: 基础设施 (2-3 天)

### 0.1 ServiceError 错误类
- **新建** `src/server/errors.ts`
- 错误码：`BAD_REQUEST` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` / `VALIDATION_ERROR` / `INTERNAL_ERROR`
- 工厂方法：`ServiceError.notFound('套餐')` / `.forbidden()` / `.badRequest()` / `.validation()`
- 自动映射 HTTP status：NOT_FOUND→404, FORBIDDEN→403, VALIDATION_ERROR→422 等

### 0.2 apiHandler 中间件
- **新建** `src/server/api-handler.ts`
- 认证级别：`'public'` / `'user'` / `'merchant'` / `'admin'`
- `merchant` 级别自动查询 `prisma.merchant.findUnique()` 验证 `status === 'APPROVED'`
- `admin` 级别检查 `session.user.role === 'ADMIN' || 'STAFF'`
- 统一捕获 `ServiceError` → JSON 响应，`ZodError` → 422 响应
- 统一响应格式：`{ success: boolean, data?, error?: { code, message, details? } }`
- Next.js 15 自动 await `params` Promise

### 0.3 统一响应类型
- **新建** `src/server/api-response.ts`
- `ApiSuccessResponse<T>` / `ApiErrorResponse` / `ApiResponse<T>`
- 前端通过 `response.success !== undefined` 区分新旧格式

### 0.4 tRPC 角色中间件
- **修改** `src/server/trpc/trpc.ts`
- 补全 `merchantProcedure`：DB 查询 merchant + 检查 status
- 补全 `adminProcedure`：检查 `user.role`

### 向后兼容
- 现有路由不动，新路由和迁移后的路由用新格式
- 前端 fetch wrapper 需要支持两种响应格式（过渡期）

---

## Phase 1: 服务层抽取 (5-7 天)

### 新增 service 文件（优先级顺序）

```
src/server/services/
├── errors.ts                  ← Phase 0 已建
├── plan.service.ts            ← 保持不变（guest-facing，989 行）
├── booking.service.ts         ← P1：从 /api/bookings/ 抽取
├── merchant-plan.service.ts   ← P1：从 /api/merchant/plans/ 抽取
├── tag.service.ts             ← P2：从 /api/admin/tags/ + /api/tags/ 抽取
├── favorite.service.ts        ← P3：从 /api/favorites/ 抽取
├── store.service.ts           ← P3：从 /api/stores/ 抽取
├── merchant.service.ts        ← P3：从 /api/merchant/register/ + admin/merchants/ 抽取
└── auth.service.ts            ← P3：从 /api/auth/register/ 抽取
```

### P1: booking.service.ts
- **来源**: `/api/bookings/route.ts` (231行), `/api/bookings/[id]/cancel/route.ts` (80行)
- **函数**: `create(input)` / `cancel(bookingId, userId)` / `getById(id)` / `getByUserId(userId)`
- **关键修复**: `create` 用 `$transaction` 包裹多店铺创建（当前无事务）
- **邮件发送留在路由层**（非阻塞，service 不关心）

### P1: merchant-plan.service.ts
- **来源**: `/api/merchant/plans/[id]/route.ts` (464行), batch-* 路由
- **函数**: `create()` / `update()` / `softDelete()` / `getForEdit()` / `batchUpdateTags()` / `batchUpdateStatus()` / `batchUpdateTheme()`
- **关键修复**: `batchUpdateTags` 用 `$transaction`（当前循环无事务）

### P2: tag.service.ts
- **来源**: `/api/admin/tags/route.ts` (~120行), `/api/admin/tags/[id]/route.ts`
- **函数**: `create()` / `update()` / `delete()` / `listForAdmin()` / `listForFilter()`
- delete 需检查引用计数

### P3: 其余 service
- `favorite.service.ts`: list / add / remove / sync
- `store.service.ts`: listActive / getById
- `merchant.service.ts`: register / approve / reject / getProfile
- `auth.service.ts`: register（加 Zod 验证，当前用手动 regex）/ verifyEmail

### Zod Schema 集中化
- **新建** `src/server/schemas/` 目录
- 从路由文件迁出：`booking.schema.ts` / `plan.schema.ts` / `tag.schema.ts` / `auth.schema.ts`
- tRPC 和 REST 共用同一套 schema

### 路由迁移模式
迁移后路由长这样（以 admin/tags POST 为例）：
```typescript
export const POST = apiHandler({
  auth: 'admin',
  handler: async (ctx) => {
    const data = createTagSchema.parse(await ctx.req.json());
    return tagService.create(data);
  },
});
```

---

## Phase 2: tRPC 扩展 (3-4 天)

### 新增 tRPC Router

| Router | Procedure 类型 | 调用的 Service |
|--------|---------------|---------------|
| `store.ts` | public | storeService |
| `booking.ts` | public(create) + protected(cancel, myBookings) | bookingService |
| `favorite.ts` | protected | favoriteService |
| `tag.ts` | public(list) | tagService |

- **修改** `src/server/trpc/routers/index.ts` — 注册新 router
- REST 路由全部保留（未来小程序/App 用）
- tRPC 和 REST 调用同一个 service，零重复

### 前端 hooks
- `src/features/guest/booking/hooks/useCreateBooking.ts`
- `src/features/guest/booking/hooks/useMyBookings.ts`
- `src/features/guest/plans/hooks/useFavorite.ts`（optimistic update）

---

## Phase 3: 开源工具迁移

### 3.1 Email: React Email + Resend (3 天) — 立即执行

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

### 3.2 Auth: 保持 NextAuth v5 (暂不迁移)

**理由**: 当前 auth 层工作正常；Phase 0 补全了 role checking；迁移 Better Auth 是高风险操作（改表结构 + 30+ 处 import）。等 NextAuth v5 正式发布或出现明确瓶颈后再评估。

### 3.3 Payments: Stripe + PayPay (1 周) — Phase 1-2 后执行

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

### 3.4 Medusa.js — 做 spike 评估（1 周）

**评估点**: Product 能否映射 RentalPlan 全部字段？Cart 支持预约日期/时间？Admin 比自建省维护？
**建议**: 如果 spike 正面，作为独立项目执行，不在本重构范围

### 3.5 Cal.com — Phase 2 后评估

**价值点**: 商家设置可用时间段、冲突检测、Google Calendar 同步
**建议**: 当前预约流程足够简单，等商家端需求明确后再引入

### 3.6 Refine Admin — Phase 2 后评估

**价值点**: 开箱即用 CRUD、表格筛选分页、审批工作流
**建议**: Admin 功能有限时自建够用，功能增长后再考虑

---

## 执行顺序

```
Phase 0 (2-3天) ─── ServiceError + apiHandler + tRPC role middleware
    │
Phase 1 (5-7天) ─── booking → merchant-plan → tag → 其余 service
    │
Phase 2 (3-4天) ─── tRPC routers + 前端 hooks
    │
Phase 3.1 (3天) ─── React Email + Resend
    │
Phase 3.3 (1周) ─── Stripe + PayPay 支付
    │
Phase 3.4-3.6 ─── Medusa / Cal.com / Refine spike（独立评估）
```

## 提交策略

```
# Phase 0
refactor(server): 添加 ServiceError 错误类
refactor(server): 添加 apiHandler 统一中间件
refactor(trpc): 实现 merchantProcedure 和 adminProcedure 角色检查

# Phase 1
refactor(services): 抽取 booking.service.ts + 事务化创建
refactor(services): 抽取 merchant-plan.service.ts + 修复 batch-tags 无事务
refactor(services): 抽取 tag.service.ts / favorite / store / merchant / auth
refactor(schemas): Zod schema 集中到 src/server/schemas/
refactor(routes): 迁移路由到 apiHandler + service 模式

# Phase 2
feat(trpc): 添加 store / booking / favorite / tag router
feat(hooks): 添加前端 tRPC hooks

# Phase 3
refactor(email): 迁移到 React Email + Resend
feat(payments): Stripe 支付集成
feat(payments): PayPay 支付集成
```

## 验证方式

每个 Phase 完成后：
1. `pnpm build` 成功
2. `pnpm test --run` 全部通过
3. 手动测试核心流程：套餐浏览 → 加购物车 → 预约 → 邮件接收
4. 检查 admin/merchant 后台功能正常
5. Phase 3.3 额外：Stripe 测试模式完成支付流程

## 关键文件索引

| 文件 | 角色 |
|------|------|
| `src/server/services/plan.service.ts` | 现有模式参考（纯函数、Prisma select、Promise.all） |
| `src/server/trpc/trpc.ts` | tRPC procedure 定义（需补全 role） |
| `src/app/api/bookings/route.ts` | booking.service 抽取来源 |
| `src/app/api/merchant/plans/[id]/route.ts` | merchant-plan.service 抽取来源（464行） |
| `src/app/api/admin/tags/route.ts` | tag.service 抽取来源 |
| `src/lib/email.ts` | React Email 迁移来源（328行） |
| `src/auth.ts` | NextAuth 配置（保持不变） |
| `prisma/schema.prisma` | 数据模型（Phase 3.3 需新增 Payment） |
