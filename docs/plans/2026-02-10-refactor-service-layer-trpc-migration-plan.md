---
title: "Service Layer 抽取 + tRPC 全面迁移"
type: refactor
date: 2026-02-10
source: docs/brainstorms/2026-02-10-architecture-refactor-brainstorm.md
---

# ♻️ Service Layer 抽取 + tRPC 全面迁移

## Overview

将 Kimono One 从 **46 个 REST 路由 + 1 个 service** 的分散架构，重构为 **tRPC 为主 + 8 个 service** 的统一架构。消除 14 处重复的商家权限检查、3 种不一致的错误响应格式、2 个无 auth 的安全漏洞，并通过 React Query 缓存为高频端点（themes 被 5 个组件独立 fetch）自动去重。

**当前状态** → **目标状态**

| 维度 | 现在 | 之后 |
|------|------|------|
| API 层 | 46 REST + 2 tRPC router | 5 REST (不可替代) + 12 tRPC router |
| Service 层 | 1 个 (plan.service.ts) | 8 个 (按领域分) |
| 权限检查 | 每个路由手写 (~24 处重复) | tRPC procedure 统一处理 |
| 错误格式 | `{error}` / `{message}` 混用 | ServiceError → TRPCError 自动映射 |
| 前端数据获取 | 48+ 处 `fetch()` | tRPC hooks + React Query 缓存 |
| 验证 | 手动 `if` + 散落的 Zod | 集中 Zod schema |

## Problem Statement

### 架构不一致导致的具体问题

1. **安全漏洞**: `/api/admin/bookings` 无任何 auth 检查，任何人可读取全部预约 PII 数据
2. **代码重复**: 14 个 merchant 路由各自重复 10 行商家权限检查代码
3. **无事务保护**: 预约创建（多店铺分组）和批量标签操作使用 `for...of` 循环逐个写入，中间失败导致数据不一致
4. **响应格式混乱**: 错误用 `{error}` 或 `{message}`，成功用 `{id}` 或 `{ids, bookings, status, message}`，前端难以统一处理
5. **无缓存共享**: `/api/themes` 被 5 个组件独立 fetch，`/api/locations` 被 4 个组件独立 fetch，每次页面加载 9 次重复请求
6. **空壳 procedure**: `merchantProcedure` 和 `adminProcedure` 只有 TODO 注释，零权限保护
7. **废弃字段残留**: 套餐创建路由仍在写入 `tags`, `isLimited`, `nameEn` 等已从 schema 移除的字段
8. **Tag usageCount 不减**: 更新套餐标签时只增加新标签计数，从不减少旧标签计数

## Proposed Solution

### 设计决策（已确认）

| 决策 | 选择 | 理由 |
|------|------|------|
| API 策略 | **tRPC 为主** | 类型安全、React Query 缓存、自动批量请求 |
| Service 粒度 | 按领域分 | 与现有 plan.service.ts 一致 |
| Service 风格 | 对象 + async 方法 | 与现有模式一致（`planService.getList()`） |
| 权限边界 | **Service 不管权限**，tRPC procedure 处理 | 解耦业务逻辑与认证 |
| 错误处理 | ServiceError → TRPCError 自动映射 | 统一错误格式 |
| Prisma 异常 | Service 层捕获并转为 ServiceError | 避免泄露数据库细节 |
| 邮件发送 | 事务成功后在 router 层发送 | 避免事务回滚但邮件已发 |
| 事务超时 | 批量操作 15 秒，默认 5 秒 | 防止大批量操作超时 |

### 必须保留为 REST 的端点

| 端点 | 原因 |
|------|------|
| `/api/auth/[...nextauth]` | NextAuth 内部路由 |
| `/api/upload/presign` | S3 presigned URL 直传 |
| `/api/chatbot` | SSE 流式响应 |
| `/api/virtual-tryon` | 外部 API 代理 + 轮询 |
| `/api/trpc/[trpc]` | tRPC 入口本身 |

## Technical Approach

### 架构

```
┌─────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│   Frontend   │───▷│   tRPC Routers        │───▷│   Services        │
│  (hooks)     │    │  (auth + validation)  │    │  (business logic) │
│              │    │                       │    │                   │
│ trpc.xxx     │    │ publicProcedure       │    │ planService       │
│  .useQuery() │    │ protectedProcedure    │    │ bookingService    │
│  .useMutation│    │ merchantProcedure ★   │    │ merchantPlanSvc   │
│              │    │ adminProcedure    ★   │    │ tagService        │
└─────────────┘    └──────────────────────┘    │ favoriteService   │
                           │                    │ storeService      │
                   ServiceError → TRPCError     │ merchantService   │
                   自动映射 middleware           │ authService       │
                                                └──────────────────┘
                                                        │
                                                   ┌────▼────┐
                                                   │ Prisma  │
                                                   │  + DB   │
                                                   └─────────┘
```

### 文件结构（最终态）

```
src/server/
├── errors.ts                         ← Phase 0: ServiceError 类
├── schemas/                          ← Phase 0: 集中 Zod schema
│   ├── plan.schema.ts
│   ├── booking.schema.ts
│   ├── tag.schema.ts
│   ├── merchant.schema.ts
│   └── auth.schema.ts
├── services/                         ← Phase 1: Service 层
│   ├── plan.service.ts               (已有，保持不变)
│   ├── booking.service.ts
│   ├── merchant-plan.service.ts
│   ├── tag.service.ts
│   ├── favorite.service.ts
│   ├── store.service.ts
│   ├── merchant.service.ts
│   └── auth.service.ts
└── trpc/
    ├── trpc.ts                       ← Phase 0: 补全 procedure + error 映射
    ├── context.ts                    ← Phase 0: 扩展 context 类型
    └── routers/                      ← Phase 2: tRPC router
        ├── index.ts                  (扩展 appRouter)
        ├── plan.ts                   (已有)
        ├── health.ts                 (已有)
        ├── booking.ts
        ├── store.ts
        ├── favorite.ts
        ├── tag.ts
        ├── theme.ts
        ├── location.ts
        ├── merchant.ts              (嵌套 router)
        ├── admin.ts                  (嵌套 router)
        └── auth.ts
```

---

## Implementation Phases

### Phase 0: 基础设施 (Hotfix + 基建)

> 所有后续 Phase 依赖此阶段完成

#### 0.0 安全 Hotfix (立即修复)

**修复 `/api/admin/bookings/route.ts` 的 auth 缺失**

```typescript
// src/app/api/admin/bookings/route.ts
// 在 GET handler 顶部添加:
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**评估 `/api/bookings/[id]/route.ts` 的 auth 需求**
- 当前无 auth 检查，游客预约后需要通过 booking ID 查看预约详情
- **决策**: 保持无 auth（游客场景需要），但此行为迁移到 tRPC 时需要用 `publicProcedure`

- [ ] 修复 `src/app/api/admin/bookings/route.ts` — 添加 admin auth 检查
- [ ] 确认 `src/app/api/bookings/[id]/route.ts` 保持公开访问（游客预约成功页依赖）

#### 0.1 ServiceError 错误类

**新建** `src/server/errors.ts`

```typescript
// src/server/errors.ts
export type ServiceErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export class ServiceError extends Error {
  constructor(
    public code: ServiceErrorCode,
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  // 工厂方法
  static notFound(entity: string) {
    return new ServiceError('NOT_FOUND', `${entity}が見つかりません`);
  }
  static forbidden(message = '権限がありません') {
    return new ServiceError('FORBIDDEN', message);
  }
  static badRequest(message: string) {
    return new ServiceError('BAD_REQUEST', message);
  }
  static validation(message: string, cause?: unknown) {
    return new ServiceError('VALIDATION_ERROR', message, cause);
  }
  static conflict(message: string) {
    return new ServiceError('CONFLICT', message);
  }
}
```

- [ ] 新建 `src/server/errors.ts`
- [ ] 测试 `src/server/__tests__/errors.test.ts`

#### 0.2 ServiceError → TRPCError 映射 middleware

**修改** `src/server/trpc/trpc.ts`

```typescript
// 映射规则:
// NOT_FOUND       → TRPCError('NOT_FOUND')
// FORBIDDEN       → TRPCError('FORBIDDEN')
// UNAUTHORIZED    → TRPCError('UNAUTHORIZED')
// BAD_REQUEST     → TRPCError('BAD_REQUEST')
// VALIDATION_ERROR → TRPCError('BAD_REQUEST', cause: 原始 ZodError)
// CONFLICT        → TRPCError('CONFLICT')
// INTERNAL_ERROR  → TRPCError('INTERNAL_SERVER_ERROR')

// Prisma 异常处理 (在 service 层捕获优先，middleware 作为兜底):
// P2002 (unique constraint) → ServiceError.conflict()
// P2025 (record not found)  → ServiceError.notFound()
// 其他 Prisma 错误          → ServiceError('INTERNAL_ERROR')
```

- [ ] 在 `src/server/trpc/trpc.ts` 添加 `errorHandlerMiddleware`
- [ ] 所有 procedure 都应用此 middleware
- [ ] 测试 `src/server/trpc/__tests__/error-mapping.test.ts`

#### 0.3 tRPC 角色 procedure 补全

**修改** `src/server/trpc/trpc.ts` (行 28-36)

`merchantProcedure`:
```typescript
export const merchantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: ctx.session.user.id },
    select: { id: true, status: true, businessName: true },
  });
  if (!merchant || merchant.status !== 'APPROVED') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '商家未审核通过' });
  }
  return next({ ctx: { ...ctx, merchant } });
});
```

`adminProcedure`:
```typescript
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.session.user.role;
  if (role !== 'ADMIN' && role !== 'STAFF') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' });
  }
  return next({ ctx });
});
```

**权限决策**: `adminProcedure` 统一为 `ADMIN || STAFF`。当前 tag 路由仅允许 ADMIN，迁移后 STAFF 也可管理标签。如需更细粒度，后续可拆分 `adminOnlyProcedure`。

**Context 类型扩展**:
```typescript
// src/server/trpc/context.ts — 扩展类型
export type MerchantContext = {
  merchant: { id: string; status: string; businessName: string };
};
```

- [ ] 实现 `merchantProcedure` — DB 查询 + APPROVED 检查 + ctx 注入
- [ ] 实现 `adminProcedure` — role 检查
- [ ] 扩展 `src/server/trpc/context.ts` 类型定义
- [ ] 测试 `src/server/trpc/__tests__/procedures.test.ts`

#### 0.4 Zod Schema 集中化

**新建** `src/server/schemas/` 目录

```
src/server/schemas/
├── plan.schema.ts       ← 从 merchant/plans/route.ts + [id]/route.ts 提取
│                           (createPlanSchema, updatePlanSchema,
│                            planComponentSchema, planUpgradeSchema)
├── booking.schema.ts    ← 从 bookings/route.ts 的手动 if 验证转为 Zod
├── tag.schema.ts        ← 从 admin/tags 提取
├── merchant.schema.ts   ← 从 merchant/register 的手动 regex 转为 Zod
└── auth.schema.ts       ← 从 auth/register 提取
```

**重点**: `plan.schema.ts` 优先级最高 — 当前有 ~100 行 schema 分散在两个路由文件且大量重叠。

- [ ] 新建 `src/server/schemas/plan.schema.ts` — 合并去重
- [ ] 新建 `src/server/schemas/booking.schema.ts` — 从 if 验证转 Zod
- [ ] 新建 `src/server/schemas/tag.schema.ts`
- [ ] 新建 `src/server/schemas/merchant.schema.ts` — 从 regex 转 Zod
- [ ] 新建 `src/server/schemas/auth.schema.ts`
- [ ] 修改原路由文件引用新 schema（保持现有功能不变）

#### Phase 0 验证

```bash
pnpm build                # 构建成功
pnpm test --run           # 全部通过
# 手动验证: 商家后台套餐 CRUD 仍正常
# 手动验证: /api/admin/bookings 现在需要登录
```

---

### Phase 1: Service 层抽取

> 按优先级顺序，每个 service 独立提交

#### P1: booking.service.ts

**来源**: `src/app/api/bookings/route.ts` (230 行) + `src/app/api/bookings/[id]/cancel/route.ts` (79 行)

```typescript
// src/server/services/booking.service.ts
export const bookingService = {
  // 事务化创建 — 按 storeId 分组，所有 Booking 在一个 $transaction 中创建
  async create(input: CreateBookingInput): Promise<BookingCreateResult> {},

  // 取消预约 — 检查状态 + 更新
  async cancel(bookingId: string, userId: string): Promise<void> {},

  // 获取单个预约 (公开 — 游客需要)
  async getById(id: string): Promise<BookingDetail | null> {},

  // 获取用户的预约列表
  async getByUserId(userId: string): Promise<BookingListItem[]> {},
};
```

**关键修复**:
- `create` 用 `prisma.$transaction()` 包裹多店铺创建（当前无事务，循环逐个创建）
- 事务超时设为 15 秒（默认 5 秒不够大订单）
- 邮件发送移到 tRPC router 层，事务成功后再调用
- 移除废弃字段写入

**注意**: `getById` 保持无 auth 检查（游客预约成功页依赖 booking ID 查看详情）

- [ ] 新建 `src/server/services/booking.service.ts`
- [ ] `create()` — $transaction + 按 storeId 分组
- [ ] `cancel()` — 检查 booking 所有权 + 状态
- [ ] `getById()` / `getByUserId()`
- [ ] 修改 REST 路由调用 service（验证功能不变）
- [ ] 测试 `src/server/services/__tests__/booking.service.test.ts`

#### P1: merchant-plan.service.ts

**来源**: `src/app/api/merchant/plans/[id]/route.ts` (520 行) + batch 路由 (~300 行) + create (111 行)

```typescript
// src/server/services/merchant-plan.service.ts
export const merchantPlanService = {
  async create(merchantId: string, input: CreatePlanInput): Promise<Plan> {},
  async update(planId: string, merchantId: string, input: UpdatePlanInput): Promise<Plan> {},
  async softDelete(planId: string, merchantId: string): Promise<void> {},
  async getForEdit(planId: string, merchantId: string): Promise<PlanEditData> {},

  // 批量操作 — 全部使用 $transaction
  async batchUpdateTags(planIds: string[], tagIds: string[], merchantId: string): Promise<void> {},
  async batchUpdateStatus(planIds: string[], status: PlanStatus, merchantId: string): Promise<void> {},
  async batchUpdateTheme(planIds: string[], themeId: string, merchantId: string): Promise<void> {},

  // 标签列表 (商家视角)
  async getTagsForMerchant(): Promise<TagWithCount[]> {},
};
```

**关键修复**:
- `batchUpdateTags` 用 `$transaction` 包裹（当前循环无事务）
- `create` 移除废弃字段 (`tags`, `isLimited`, `nameEn`) 的写入
- `softDelete` 同时设 `isActive: false` + `status: 'ARCHIVED'`
- **修复 tag usageCount**: 更新标签时正确递减旧标签的 usageCount

- [ ] 新建 `src/server/services/merchant-plan.service.ts`
- [ ] CRUD 方法 — 包含所有权检查 (merchantId)
- [ ] batch 方法 — $transaction + 所有权验证
- [ ] 修复 tag usageCount 递减逻辑
- [ ] 移除废弃字段写入
- [ ] 修改 REST 路由调用 service
- [ ] 测试 `src/server/services/__tests__/merchant-plan.service.test.ts`

#### P2: tag.service.ts

**来源**: `src/app/api/admin/tags/route.ts` (~120 行) + `[id]/route.ts` + categories 路由

```typescript
// src/server/services/tag.service.ts
export const tagService = {
  // Admin 操作
  async create(input: CreateTagInput): Promise<Tag> {},
  async update(id: string, input: UpdateTagInput): Promise<Tag> {},
  async delete(id: string): Promise<void> {},  // 检查引用计数
  async listForAdmin(): Promise<AdminTag[]> {},

  // 公开查询
  async listForFilter(): Promise<FilterTag[]> {},
  async listCategories(): Promise<TagCategory[]> {},

  // Category CRUD
  async createCategory(input: CreateCategoryInput): Promise<TagCategory> {},
  async updateCategory(id: string, input: UpdateCategoryInput): Promise<TagCategory> {},
  async deleteCategory(id: string): Promise<void> {},  // 检查是否有关联 tag
};
```

- [ ] 新建 `src/server/services/tag.service.ts`
- [ ] `delete` 检查引用计数 (PlanTag)
- [ ] `deleteCategory` 检查是否有关联 tag
- [ ] 测试

#### P3: 其余 service

**favorite.service.ts** — 来源: `/api/favorites/` (258 行)
```typescript
export const favoriteService = {
  async list(userId: string): Promise<FavoriteItem[]> {},
  async add(userId: string, planId: string, imageUrl: string): Promise<FavoriteItem> {},
  async remove(userId: string, planId: string, imageUrl: string): Promise<void> {},
  async sync(userId: string, localFavorites: LocalFavorite[]): Promise<FavoriteItem[]> {},
};
```
优化: `add` 使用 `upsert` (1 次 DB 往返替代 findFirst + create 的 2 次)

**store.service.ts** — 来源: `/api/stores/` (60 行)
```typescript
export const storeService = {
  async listActive(): Promise<Store[]> {},
  async getById(id: string): Promise<StoreDetail | null> {},
};
```

**merchant.service.ts** — 来源: register + profile + upgrades + customServices + componentOverrides (~600 行)
```typescript
export const merchantService = {
  async register(userId: string, input: RegisterInput): Promise<Merchant> {},
  async getProfile(userId: string): Promise<MerchantProfile | null> {},
  // 升级服务
  async listUpgrades(merchantId: string): Promise<Upgrade[]> {},
  async createUpgrade(merchantId: string, input: CreateUpgradeInput): Promise<Upgrade> {},
  async updateUpgrade(upgradeId: string, merchantId: string, input: UpdateUpgradeInput): Promise<Upgrade> {},
  async deleteUpgrade(upgradeId: string, merchantId: string): Promise<void> {},
  // 自定义服务
  async createCustomService(merchantId: string, input: CreateCustomServiceInput): Promise<ServiceComponent> {},
  // 组件覆盖
  async listComponentOverrides(merchantId: string): Promise<ComponentOverride[]> {},
  async updateComponentOverrides(merchantId: string, overrides: OverrideInput[]): Promise<void> {},
  async patchComponentOverride(overrideId: string, merchantId: string, input: PatchInput): Promise<void> {},
};
```
**关键决策**: `register` 方法允许 REJECTED 状态的商家重新申请（更新现有记录为 PENDING）

**auth.service.ts** — 来源: register + verify-email + send-verification (~200 行)
```typescript
export const authService = {
  async register(input: RegisterInput): Promise<User> {},         // 用 Zod 替代手动 regex
  async verifyEmail(token: string): Promise<void> {},             // 验证 token + 更新 emailVerified
  async sendVerification(userId: string): Promise<void> {},       // 生成 token + 发邮件
};
```

- [ ] 新建 `src/server/services/favorite.service.ts` — 使用 upsert 优化
- [ ] 新建 `src/server/services/store.service.ts`
- [ ] 新建 `src/server/services/merchant.service.ts` — REJECTED 可重新申请
- [ ] 新建 `src/server/services/auth.service.ts` — Zod 验证替代 regex
- [ ] 各自添加测试

#### Phase 1 验证

```bash
pnpm build                # 构建成功
pnpm test --run           # 全部通过
# REST 路由现在调用 service 而非直接 Prisma
# 手动验证: 预约流程（含多店铺） / 商家套餐 CRUD / 标签管理
```

---

### Phase 2: tRPC 全面迁移

> 每个 router 独立提交，包含: router 创建 + 前端迁移 + 删除 REST 路由

#### tRPC Router 总览

| Router | Procedure 类型 | Procedures | 对应前端 fetch 调用数 |
|--------|---------------|------------|---------------------|
| `booking` | public + protected | create, cancel, getById, myBookings | 3 |
| `store` | public | list, getById | 0 (SSR 直调) |
| `favorite` | protected | list, add, remove, sync | 2 (+ Zustand 3) |
| `tag` | public | list, filter, categories | 2 |
| `theme` | public | list | 5 |
| `location` | public | list | 4 |
| `merchant` | merchant | plan.\*, profile, upgrade.\*, customService.\*, componentOverride.\* | ~20 |
| `admin` | admin | tag.\*, tagCategory.\*, booking.list, merchant.\*, service.\*, mapTemplate.\*, activateThemedPlans | ~4 |
| `auth` | public + protected | register, verifyEmail, sendVerification | 3 |

#### 2.1 简单公开端点优先 (theme + location + store + tag)

**迁移策略**: 这些端点无 auth、逻辑简单、前端调用频繁。一次迁移可消除 ~15 个重复 fetch。

```typescript
// src/server/trpc/routers/theme.ts
export const themeRouter = router({
  list: publicProcedure.query(async () => {
    // 直接查 Prisma（太简单不需要 service）
    return prisma.theme.findMany({ where: { isActive: true } });
  }),
});
```

**前端迁移**: `fetch('/api/themes')` → `trpc.theme.list.useQuery()`
- `src/components/layout/HeroSearchBar.tsx` — fetch → useQuery
- `src/components/layout/HeaderSearchBar.tsx` — fetch → useQuery
- `src/components/layout/MobileSearchBar.tsx` — fetch → useQuery
- `src/features/guest/discovery/components/ThemeDropdown.tsx` — fetch → useQuery
- `src/features/guest/discovery/components/ClientThemePills.tsx` — fetch → useQuery

**注意**: tRPC 的 React Query 自动去重 — 5 个组件同时调用 `trpc.theme.list.useQuery()` 只会发 1 次请求。

**themeColorMap 处理**: 迁移时将硬编码的颜色映射写入 Theme 表的 `color` 字段，删除 `src/app/api/themes/route.ts` 和 `src/components/plan/RelatedPlans.tsx` 中的重复定义。

- [ ] 新建 `src/server/trpc/routers/theme.ts`
- [ ] 新建 `src/server/trpc/routers/location.ts`
- [ ] 新建 `src/server/trpc/routers/store.ts`
- [ ] 新建 `src/server/trpc/routers/tag.ts`
- [ ] 迁移前端 fetch → tRPC hooks (theme 5 处, location 4 处, tag 2 处)
- [ ] 消除 `themeColorMap` 重复定义
- [ ] 删除对应 REST 路由文件
- [ ] 注册到 `src/server/trpc/routers/index.ts`

#### 2.2 用户端点 (booking + favorite + auth)

**booking router**:
```typescript
// src/server/trpc/routers/booking.ts
export const bookingRouter = router({
  create: publicProcedure                // 游客也可预约
    .input(createBookingSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await bookingService.create(input);
      // 事务成功后发邮件
      await Promise.all(result.bookings.map(b => sendBookingEmail(b)));
      return result;
    }),
  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(({ input, ctx }) => bookingService.cancel(input.bookingId, ctx.session.user.id)),
  getById: publicProcedure               // 游客需要（预约成功页）
    .input(z.object({ id: z.string() }))
    .query(({ input }) => bookingService.getById(input.id)),
  myBookings: protectedProcedure
    .query(({ ctx }) => bookingService.getByUserId(ctx.session.user.id)),
});
```

**favorite router — Zustand 迁移策略**:

Zustand `favorites.ts` 中有 3 处 `fetch()` 不在 React 树中，无法使用 tRPC hooks。

**方案**: 创建 vanilla tRPC client 在 Zustand 中使用。

```typescript
// src/shared/api/trpc-vanilla.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/trpc/routers';

export const trpcVanilla = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc' })],
});

// src/store/favorites.ts 中:
// fetch('/api/favorites/sync') → trpcVanilla.favorite.sync.mutate(...)
```

**auth router**:
```typescript
// src/server/trpc/routers/auth.ts
export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(({ input }) => authService.register(input)),
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(({ input }) => authService.verifyEmail(input.token)),
  sendVerification: protectedProcedure
    .mutation(({ ctx }) => authService.sendVerification(ctx.session.user.id)),
});
```

- [ ] 新建 `src/server/trpc/routers/booking.ts`
- [ ] 新建 `src/server/trpc/routers/favorite.ts`
- [ ] 新建 `src/server/trpc/routers/auth.ts`
- [ ] 新建 `src/shared/api/trpc-vanilla.ts` — vanilla client
- [ ] 迁移 Zustand favorites store → vanilla tRPC client
- [ ] 迁移前端 fetch → tRPC hooks
- [ ] 创建 `src/features/guest/booking/hooks/useCreateBooking.ts`
- [ ] 删除对应 REST 路由文件

#### 2.3 商家端点 (merchant router)

**嵌套 router 结构**:
```typescript
// src/server/trpc/routers/merchant.ts
export const merchantRouter = router({
  plan: router({
    create: merchantProcedure.input(createPlanSchema).mutation(...)
    update: merchantProcedure.input(updatePlanSchema).mutation(...)
    delete: merchantProcedure.input(z.object({ id: z.string() })).mutation(...)
    get: merchantProcedure.input(z.object({ id: z.string() })).query(...)
    batchTags: merchantProcedure.input(...).mutation(...)
    batchStatus: merchantProcedure.input(...).mutation(...)
    batchTheme: merchantProcedure.input(...).mutation(...)
    tags: merchantProcedure.query(...)  // 获取可用标签
  }),
  profile: router({
    get: protectedProcedure.query(...)  // 不要求 APPROVED，查看自己的商家状态
  }),
  register: protectedProcedure.input(registerMerchantSchema).mutation(...)
  upgrade: router({
    list: merchantProcedure.query(...)
    create: merchantProcedure.input(...).mutation(...)
    update: merchantProcedure.input(...).mutation(...)
    delete: merchantProcedure.input(...).mutation(...)
  }),
  customService: router({
    create: merchantProcedure.input(...).mutation(...)
  }),
  componentOverride: router({
    list: merchantProcedure.query(...)
    update: merchantProcedure.input(...).mutation(...)
    patch: merchantProcedure.input(...).mutation(...)
  }),
});
```

**前端迁移文件** (~20 处 fetch):
- `src/app/(main)/merchant/listings/ListingsClient.tsx`
- `src/app/(main)/merchant/listings/new/page.tsx`
- `src/app/(main)/merchant/listings/[id]/edit/PlanEditForm.tsx`
- `src/app/(main)/merchant/components/ComponentsClient.tsx`
- `src/app/(main)/merchant/components/PlanComponentEditor.tsx`
- 其他 merchant 页面

- [ ] 新建 `src/server/trpc/routers/merchant.ts` — 嵌套 router
- [ ] 迁移 ~20 处前端 fetch → `trpc.merchant.*`
- [ ] 删除 `src/app/api/merchant/` 下所有路由文件 (除 REST 保留的)

#### 2.4 管理后台端点 (admin router)

```typescript
// src/server/trpc/routers/admin.ts
export const adminRouter = router({
  tag: router({ create, update, delete, get, list }),
  tagCategory: router({ create, update, delete, get, list }),
  booking: router({ list: adminProcedure.input(...).query(...) }),
  merchant: router({
    approve: adminProcedure.input(z.object({ id: z.string() })).mutation(...)
    reject: adminProcedure.input(z.object({ id: z.string(), reason: z.string().optional() })).mutation(...)
  }),
  service: router({
    approve: adminProcedure.input(...).mutation(...)
    reject: adminProcedure.input(...).mutation(...)
  }),
  mapTemplate: router({
    getHotspots: adminProcedure.input(...).query(...)
    updateHotspots: adminProcedure.input(...).mutation(...)
  }),
  activateThemedPlans: adminProcedure.input(...).mutation(...)
});
```

- [ ] 新建 `src/server/trpc/routers/admin.ts` — 嵌套 router
- [ ] 迁移前端 fetch → `trpc.admin.*`
- [ ] 删除 `src/app/api/admin/` 下所有路由文件

#### Phase 2 验证

```bash
pnpm build                  # 构建成功
pnpm test --run             # 全部通过

# 全局搜索确认无残留 REST 调用 (排除保留端点):
grep -r "fetch('/api/" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "auth/\[...nextauth\]" \
  | grep -v "upload" \
  | grep -v "chatbot" \
  | grep -v "virtual-tryon" \
  | grep -v "trpc"
# 期望: 0 结果

# 手动验证完整流程:
# 1. 游客: 浏览 → 筛选 → 加购物车 → 预约 → 邮件
# 2. 用户: 注册 → 验证邮箱 → 登录 → 收藏同步
# 3. 商家: 套餐 CRUD → 批量操作 → 组件编辑
# 4. 管理: 标签管理 → 商家审核 → 预约查看
```

---

## 迁移后删除的 REST 路由

```
删除: src/app/api/bookings/                          → trpc.booking
删除: src/app/api/plans/[id]/                        → trpc.plan (已有)
删除: src/app/api/stores/                            → trpc.store
删除: src/app/api/themes/                            → trpc.theme
删除: src/app/api/locations/                         → trpc.location
删除: src/app/api/tags/                              → trpc.tag
删除: src/app/api/service-components/                → trpc.tag
删除: src/app/api/favorites/                         → trpc.favorite
删除: src/app/api/merchant/plans/                    → trpc.merchant.plan
删除: src/app/api/merchant/profile/                  → trpc.merchant.profile
删除: src/app/api/merchant/register/                 → trpc.merchant.register
删除: src/app/api/merchant/upgrades/                 → trpc.merchant.upgrade
删除: src/app/api/merchant/custom-services/          → trpc.merchant.customService
删除: src/app/api/merchant/component-overrides/      → trpc.merchant.componentOverride
删除: src/app/api/admin/tags/                        → trpc.admin.tag
删除: src/app/api/admin/tags/categories/             → trpc.admin.tagCategory
删除: src/app/api/admin/bookings/                    → trpc.admin.booking
删除: src/app/api/admin/merchants/                   → trpc.admin.merchant
删除: src/app/api/admin/services/                    → trpc.admin.service
删除: src/app/api/admin/map-templates/               → trpc.admin.mapTemplate
删除: src/app/api/admin/activate-themed-plans/       → trpc.admin.activateThemedPlans
删除: src/app/api/auth/register/                     → trpc.auth.register
删除: src/app/api/auth/verify-email/                 → trpc.auth.verifyEmail
删除: src/app/api/auth/send-verification/            → trpc.auth.sendVerification

保留: src/app/api/auth/[...nextauth]/route.ts        ← NextAuth
保留: src/app/api/trpc/[trpc]/route.ts               ← tRPC 入口
保留: src/app/api/upload/                            ← S3 presign
保留: src/app/api/chatbot/                           ← SSE 流式
保留: src/app/api/virtual-tryon/                     ← 外部 API 代理
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] 所有 46 个 REST 路由中，41 个迁移到 tRPC + 5 个保留
- [ ] 8 个 service 文件覆盖所有业务逻辑
- [ ] 12 个 tRPC router 注册到 appRouter
- [ ] 前端 48+ 处 fetch 全部迁移到 tRPC hooks 或 vanilla client
- [ ] 预约创建使用 $transaction，多店铺原子性保证
- [ ] 批量标签操作使用 $transaction
- [ ] 邮件在事务成功后发送
- [ ] Tag usageCount 正确递增递减

### Non-Functional Requirements

- [ ] 高频端点 (themes, locations) 通过 React Query 自动去重，减少 ~80% 重复请求
- [ ] `merchantProcedure` 和 `adminProcedure` 实际执行权限检查
- [ ] `/api/admin/bookings` 安全漏洞已修复
- [ ] 统一错误格式: ServiceError → TRPCError
- [ ] 废弃字段不再被写入

### Quality Gates

- [ ] `pnpm build` 成功
- [ ] `pnpm test --run` 全部通过
- [ ] 新增 service 和 router 都有对应测试
- [ ] `grep -r "fetch('/api/" src/` 无残留调用（排除保留端点）
- [ ] TypeScript 无类型错误

---

## Commit Strategy

```
# Phase 0
hotfix(security): 修复 /api/admin/bookings 缺失 auth 检查
refactor(server): 添加 ServiceError 错误类
refactor(trpc): ServiceError → TRPCError 自动映射
refactor(trpc): 实现 merchantProcedure 和 adminProcedure 角色检查
refactor(schemas): Zod schema 集中到 src/server/schemas/

# Phase 1
refactor(services): 抽取 booking.service.ts + 事务化创建
refactor(services): 抽取 merchant-plan.service.ts + 修复 batch/usageCount
refactor(services): 抽取 tag.service.ts
refactor(services): 抽取 favorite / store / merchant / auth service

# Phase 2 (逐个 router 提交)
refactor(trpc): 迁移 theme + location + store + tag 到 tRPC + 删除 REST
refactor(trpc): 迁移 booking + favorite + auth 到 tRPC + 删除 REST
refactor(trpc): 迁移 merchant 全部操作到 tRPC + 删除 REST
refactor(trpc): 迁移 admin 全部操作到 tRPC + 删除 REST
```

---

## Risk Analysis & Mitigation

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 迁移期间旧 JS bundle 请求已删除的 REST URL | 低 | 中 | tRPC 和 REST 不共享 URL，无缓存混淆风险 |
| $transaction 超时导致预约失败 | 中 | 高 | 批量操作设 15 秒超时，监控事务耗时 |
| STAFF 获得标签管理权限（当前仅 ADMIN） | 低 | 低 | 可接受的扩权，后续按需拆分 |
| Zustand vanilla client 与 React Query 缓存不同步 | 中 | 中 | favorites sync 后主动 invalidate React Query 缓存 |
| 前端遗漏未迁移的 fetch 调用 | 中 | 高 | 每次提交用 grep 验证无残留 |

---

## Dependencies & Prerequisites

- Phase 0 必须在 Phase 1 之前完成（service 依赖 ServiceError）
- Phase 1 必须在 Phase 2 之前完成（router 依赖 service）
- Phase 2 内各 router 可并行开发，但建议按优先级顺序
- 与 `docs/plans/2026-02-10-refactor-backend-data-model-cleanup-plan.md` 的关系:
  - 数据模型清理计划的 Phase 1-3 已完成
  - 本计划的 Phase 1 中 `merchant-plan.service.ts` 会自然移除废弃字段的写入
  - 两个计划互不阻塞

---

## References

### Internal References

- 现有 service 参考: `src/server/services/plan.service.ts`
- 现有 router 参考: `src/server/trpc/routers/plan.ts`
- tRPC 配置: `src/server/trpc/trpc.ts` (行 12-36 — procedure 定义)
- tRPC 客户端: `src/shared/api/trpc.ts` + `TRPCProvider.tsx`
- Prisma schema: `prisma/schema.prisma`
- 数据模型清理: `docs/plans/2026-02-10-refactor-backend-data-model-cleanup-plan.md`
- 原始 brainstorm: `docs/brainstorms/2026-02-10-architecture-refactor-brainstorm.md`
- nuqs 状态管理: `docs/solutions/integration-issues/nuqs-filter-state-sync-delay.md`
