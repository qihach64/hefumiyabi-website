# Kimono One 架构重构计划

> 日期: 2026-02-10
> 范围: Service Layer, tRPC 全面迁移, REST 路由清理

---

## Context

当前代码库存在架构不一致问题：47 个 REST 路由中约 50% 直接调用 Prisma，只有 `plan.service.ts` 一个服务层；tRPC 仅覆盖 plan + health；每个路由手动做 auth/error handling，格式不统一（`{error}` vs `{message}`）；`merchantProcedure`/`adminProcedure` 是空壳。

此次重构目标：**tRPC 作为前端唯一 API 层**，所有业务逻辑沉入 service 层，删除可替代的 REST 路由。未来若需支持小程序/App，在 service 层上加 REST 薄壳即可。

## 设计决策（已确认）

| 决策         | 选择                                               |
| ------------ | -------------------------------------------------- |
| API 策略     | **tRPC 为主**，REST 仅保留不可替代端点             |
| Service 粒度 | 按领域分 (plan / booking / store / tag / ...)      |
| API 风格     | 纯函数导出（与现有 plan.service.ts 一致）          |
| 权限边界     | Service 不管权限，tRPC procedure 处理              |
| 错误处理     | ServiceError → tRPC TRPCError 自动映射             |
| plan.service | 拆出商家部分到 merchant-plan.service.ts            |
| 未来扩展     | App/小程序需要时，在 service 上加 REST 薄壳即可    |

---

## 必须保留为 REST 的端点

这些端点因技术限制无法用 tRPC 替代：

| 端点                          | 原因                          |
| ----------------------------- | ----------------------------- |
| `/api/auth/*`                 | NextAuth 内部路由，不可替代   |
| `/api/upload/presign`         | presigned URL，S3 直传        |
| `/api/chatbot`                | SSE 流式响应                  |
| `/api/virtual-tryon`          | 外部 API 代理 + 轮询         |
| `/api/payments/webhook/*`     | 未来 Stripe/PayPay webhook    |

其余全部迁移到 tRPC。

---

## Phase 0: 基础设施 (2-3 天)

### 0.1 ServiceError 错误类
- **新建** `src/server/errors.ts`
- 错误码：`BAD_REQUEST` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` / `VALIDATION_ERROR` / `INTERNAL_ERROR`
- 工厂方法：`ServiceError.notFound('套餐')` / `.forbidden()` / `.badRequest()` / `.validation()`

### 0.2 ServiceError → TRPCError 映射
- **修改** `src/server/trpc/trpc.ts`
- 在 procedure middleware 中捕获 ServiceError，转换为 TRPCError：
  ```
  NOT_FOUND    → TRPCError('NOT_FOUND')
  FORBIDDEN    → TRPCError('FORBIDDEN')
  BAD_REQUEST  → TRPCError('BAD_REQUEST')
  VALIDATION   → TRPCError('BAD_REQUEST', cause: ZodError)
  ```

### 0.3 tRPC 角色 procedure
- **修改** `src/server/trpc/trpc.ts`
- 补全 `merchantProcedure`：DB 查询 merchant + 检查 `status === 'APPROVED'`
- 补全 `adminProcedure`：检查 `user.role === 'ADMIN' || 'STAFF'`
- 共享 auth 检查函数（`src/server/auth-checks.ts`），REST 残留端点也可复用

### 0.4 Zod Schema 集中化
- **新建** `src/server/schemas/` 目录
- 从路由文件迁出：`booking.schema.ts` / `plan.schema.ts` / `tag.schema.ts` / `auth.schema.ts`
- tRPC input validation 直接用这些 schema

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
├── merchant.service.ts        ← P3：从 /api/merchant/ 抽取
└── auth.service.ts            ← P3：从 /api/auth/register/ 抽取
```

### P1: booking.service.ts
- **来源**: `/api/bookings/route.ts` (231行), `/api/bookings/[id]/cancel/route.ts` (80行)
- **函数**: `create(input)` / `cancel(bookingId, userId)` / `getById(id)` / `getByUserId(userId)`
- **关键修复**: `create` 用 `$transaction` 包裹多店铺创建（当前无事务）
- **邮件发送**: tRPC router 层调用，service 不关心

### P1: merchant-plan.service.ts
- **来源**: `/api/merchant/plans/[id]/route.ts` (464行), batch-* 路由
- **函数**: `create()` / `update()` / `softDelete()` / `getForEdit()` / `batchUpdateTags()` / `batchUpdateStatus()` / `batchUpdateTheme()`
- **关键修复**: `batchUpdateTags` 用 `$transaction`（当前循环无事务）

### P2: tag.service.ts
- **来源**: `/api/admin/tags/route.ts` (~120行), `/api/admin/tags/[id]/route.ts`, `/api/tags/`
- **函数**: `create()` / `update()` / `delete()` / `listForAdmin()` / `listForFilter()` / `listCategories()` / `createCategory()` / `updateCategory()` / `deleteCategory()`
- delete 需检查引用计数

### P3: 其余 service
- `favorite.service.ts`: list / add / remove / sync
- `store.service.ts`: listActive / getById
- `merchant.service.ts`: register / approve / reject / getProfile / upgrades / customServices / componentOverrides
- `auth.service.ts`: register（加 Zod 验证，当前用手动 regex）/ verifyEmail / sendVerification

---

## Phase 2: tRPC 全面迁移 (5-7 天)

### tRPC Router 结构

```
src/server/trpc/routers/
├── index.ts              ← appRouter（注册所有 router）
├── health.ts             ← 保持不变
├── plan.ts               ← 保持不变（已有）
├── booking.ts            ← 新增
├── store.ts              ← 新增
├── favorite.ts           ← 新增
├── tag.ts                ← 新增
├── theme.ts              ← 新增
├── location.ts           ← 新增
├── merchant.ts           ← 新增（嵌套: plans / profile / register / upgrades / customServices / componentOverrides）
└── admin.ts              ← 新增（嵌套: tags / bookings / merchants / services / mapTemplates）
```

### 各 Router 详情

| Router        | Procedure 类型  | Procedures                                                                 |
| ------------- | --------------- | -------------------------------------------------------------------------- |
| `booking`     | protected       | create, cancel, getById, myBookings                                       |
| `store`       | public          | list, getById                                                              |
| `favorite`    | protected       | list, add, remove, sync                                                    |
| `tag`         | public          | list, filter, categories                                                   |
| `theme`       | public          | list                                                                       |
| `location`    | public          | list                                                                       |
| `merchant`    | merchant        | plan.{create,update,delete,get,batchTags,batchStatus,batchTheme,getTags}  |
|               | merchant        | profile.get, register (protected)                                          |
|               | merchant        | upgrade.{list,create,get,update}                                           |
|               | merchant        | customService.{list,create}                                                |
|               | merchant        | componentOverride.{list,update,patch}                                      |
| `admin`       | admin           | tag.{create,update,delete,get,list}                                        |
|               | admin           | tagCategory.{create,update,delete,get,list}                                |
|               | admin           | booking.list                                                               |
|               | admin           | merchant.{approve,reject}                                                  |
|               | admin           | service.{approve,reject}                                                   |
|               | admin           | mapTemplate.{getHotspots,updateHotspots}                                   |
|               | admin           | activateThemedPlans                                                        |

### 前端迁移

每迁移一个 router，同步：
1. 创建 tRPC router + 调用 service
2. 前端 `fetch()` / `axios` 调用改为 `trpc.xxx.useQuery()` / `useMutation()`
3. **删除**对应的 REST route 文件
4. 验证功能正常

### 前端 hooks（按需创建）
- `src/features/guest/booking/hooks/useCreateBooking.ts`
- `src/features/guest/booking/hooks/useMyBookings.ts`
- `src/features/guest/plans/hooks/useFavorite.ts`（optimistic update）
- 商家/管理后台直接用 `trpc.merchant.xxx` / `trpc.admin.xxx`

---

## 迁移后删除的 REST 路由

迁移完成后，以下路由文件全部删除：

```
删除: src/app/api/bookings/          → trpc.booking
删除: src/app/api/plans/[id]/        → trpc.plan（已有）
删除: src/app/api/stores/            → trpc.store
删除: src/app/api/themes/            → trpc.theme
删除: src/app/api/locations/         → trpc.location
删除: src/app/api/tags/              → trpc.tag
删除: src/app/api/favorites/         → trpc.favorite
删除: src/app/api/merchant/plans/    → trpc.merchant.plan
删除: src/app/api/merchant/profile/  → trpc.merchant.profile
删除: src/app/api/merchant/register/ → trpc.merchant.register
删除: src/app/api/merchant/upgrades/ → trpc.merchant.upgrade
删除: src/app/api/merchant/custom-services/      → trpc.merchant.customService
删除: src/app/api/merchant/component-overrides/  → trpc.merchant.componentOverride
删除: src/app/api/admin/tags/        → trpc.admin.tag
删除: src/app/api/admin/bookings/    → trpc.admin.booking
删除: src/app/api/admin/merchants/   → trpc.admin.merchant
删除: src/app/api/admin/services/    → trpc.admin.service
删除: src/app/api/admin/map-templates/           → trpc.admin.mapTemplate
删除: src/app/api/admin/activate-themed-plans/   → trpc.admin.activateThemedPlans
删除: src/app/api/service-components/            → trpc.tag（或合并）
删除: src/app/api/admin/tags/categories/         → trpc.admin.tagCategory
删除: src/app/api/auth/register/     → trpc.auth.register
删除: src/app/api/auth/verify-email/ → trpc.auth.verifyEmail
删除: src/app/api/auth/send-verification/ → trpc.auth.sendVerification

保留: src/app/api/auth/[...nextauth]  ← NextAuth
保留: src/app/api/trpc/[trpc]         ← tRPC 入口
保留: src/app/api/upload/             ← S3 presign
保留: src/app/api/chatbot/            ← SSE 流式
保留: src/app/api/virtual-tryon/      ← 外部 API 代理
```

---

## 执行顺序

```
Phase 0 (2-3天) ─── ServiceError + tRPC procedure 补全 + Zod schema 集中
    │
Phase 1 (5-7天) ─── booking → merchant-plan → tag → 其余 service 抽取
    │
Phase 2 (5-7天) ─── tRPC router 创建 + 前端迁移 + 删除 REST 路由
```

## 提交策略

```
# Phase 0
refactor(server): 添加 ServiceError 错误类
refactor(trpc): ServiceError → TRPCError 自动映射
refactor(trpc): 实现 merchantProcedure 和 adminProcedure 角色检查
refactor(schemas): Zod schema 集中到 src/server/schemas/

# Phase 1
refactor(services): 抽取 booking.service.ts + 事务化创建
refactor(services): 抽取 merchant-plan.service.ts + 修复 batch-tags 无事务
refactor(services): 抽取 tag / favorite / store / merchant / auth service

# Phase 2（逐个 router 提交，每次包含: router + 前端迁移 + 删除 REST）
refactor(trpc): 迁移 booking 到 tRPC + 删除 REST 路由
refactor(trpc): 迁移 store / theme / location 到 tRPC + 删除 REST 路由
refactor(trpc): 迁移 tag / favorite 到 tRPC + 删除 REST 路由
refactor(trpc): 迁移 merchant 全部操作到 tRPC + 删除 REST 路由
refactor(trpc): 迁移 admin 全部操作到 tRPC + 删除 REST 路由
refactor(trpc): 迁移 auth (register/verify) 到 tRPC + 删除 REST 路由
```

## 验证方式

每个 Phase 完成后：
1. `pnpm build` 成功
2. `pnpm test --run` 全部通过
3. 手动测试核心流程：套餐浏览 → 加购物车 → 预约 → 邮件接收
4. 检查 admin/merchant 后台功能正常
5. 确认已删除的 REST 路由不再被任何前端代码引用（全局搜索 `/api/`）

## 关键文件索引

| 文件                                       | 角色                                               |
| ------------------------------------------ | -------------------------------------------------- |
| `src/server/services/plan.service.ts`      | 现有模式参考（纯函数、Prisma select、Promise.all） |
| `src/server/trpc/trpc.ts`                  | tRPC procedure 定义（需补全 role + error 映射）    |
| `src/server/trpc/routers/plan.ts`          | 现有 tRPC router 参考                              |
| `src/app/api/bookings/route.ts`            | booking.service 抽取来源                           |
| `src/app/api/merchant/plans/[id]/route.ts` | merchant-plan.service 抽取来源（464行）            |
| `src/app/api/admin/tags/route.ts`          | tag.service 抽取来源                               |
| `src/auth.ts`                              | NextAuth 配置（保持不变）                          |
| `prisma/schema.prisma`                     | 数据模型                                           |
