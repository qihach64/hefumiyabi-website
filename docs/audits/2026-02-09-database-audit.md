# 数据库审计报告

> 审计日期: 2026-02-09
> 审计范围: prisma/schema.prisma、src/server/services/、src/server/trpc/routers/、src/app/api/

---

## 目录

1. [Prisma 客户端配置问题](#1-prisma-客户端配置问题)
2. [缺失索引](#2-缺失索引)
3. [N+1 与查询效率](#3-n1-与查询效率)
4. [事务与数据一致性](#4-事务与数据一致性)
5. [级联删除与引用完整性](#5-级联删除与引用完整性)
6. [Schema 设计问题](#6-schema-设计问题)
7. [冗余字段与数据同步](#7-冗余字段与数据同步)
8. [字段命名一致性](#8-字段命名一致性)
9. [审计字段完整性](#9-审计字段完整性)
10. [枚举设计](#10-枚举设计)
11. [安全与权限](#11-安全与权限)
12. [优化建议总结](#12-优化建议总结)

---

## 1. Prisma 客户端配置问题

### 1.1 重复的 Prisma 实例 🔴 严重

**文件:**
- `src/lib/prisma.ts` — 主实例，含日志配置和连接预热
- `src/lib/db.ts` — 重复实例，无日志配置

**使用 `@/lib/db` 的文件:**
- `src/app/api/admin/bookings/route.ts`
- `src/app/api/kimonos/featured/route.ts`
- `src/app/api/admin/inventory/route.ts`

**问题:** 两个模块各自维护独立的 PrismaClient 全局缓存，在开发环境中可能创建两个连接池，浪费数据库连接。在 Supabase 的连接限制下（免费版 60 连接），这尤为危险。

**建议:** 删除 `src/lib/db.ts`，统一使用 `src/lib/prisma.ts`。将引用 `@/lib/db` 的 3 个文件改为 `@/lib/prisma`。

---

## 2. 缺失索引

### 2.1 BookingItem.bookingId 🔴 严重

```prisma
model BookingItem {
  bookingId String
  // ❌ 缺少 @@index([bookingId])
}
```

**影响:** 每次查询 Booking 并 include items 时，需全表扫描 booking_items。这是最高频的关联查询之一（商家订单列表、管理后台订单列表）。

### 2.2 KimonoImage.kimonoId 🟡 中等

```prisma
model KimonoImage {
  kimonoId String
  // ❌ 缺少 @@index([kimonoId])
}
```

**影响:** 查询和服图片时需全表扫描。

### 2.3 BookingKimono 联表索引 🟡 中等

```prisma
model BookingKimono {
  kimonoId      String
  bookingItemId String
  // ❌ 缺少 @@index([bookingItemId])
  // ❌ 缺少 @@index([kimonoId])
  // ❌ 建议添加 @@unique([bookingItemId, kimonoId])
}
```

### 2.4 Review 关联索引 🟡 中等

```prisma
model Review {
  userId    String
  bookingId String?
  // ❌ 缺少 @@index([userId])
  // ❌ 缺少 @@index([bookingId])
}
```

### 2.5 MerchantReview 补充索引 🟢 低

```prisma
model MerchantReview {
  userId    String
  bookingId String?
  // ❌ 缺少 @@index([userId])
  // ❌ 缺少 @@index([bookingId])
}
```

### 2.6 User.email / User.phone 冗余索引 🟢 低

```prisma
model User {
  email String? @unique   // @unique 已自动创建索引
  phone String? @unique   // @unique 已自动创建索引
  @@index([email])         // ⚠️ 与 @unique 重复
  @@index([phone])         // ⚠️ 与 @unique 重复
}
```

**说明:** `@unique` 约束在 PostgreSQL 中会自动创建唯一索引，`@@index` 是冗余的。不影响性能，但增加维护负担。

---

## 3. N+1 与查询效率

### 3.1 Booking 创建循环 🔴 严重

**文件:** `src/app/api/bookings/route.ts:127-202`

```typescript
for (const [storeId, storeItems] of itemsByStore) {
  const booking = await prisma.booking.create({ ... });  // ← 循环中执行 DB 操作
  await sendBookingConfirmationEmail(...);                // ← 且含异步邮件发送
}
```

**问题:**
- 按店铺循环创建预约，每次迭代执行一次 DB 写入
- 邮件发送虽有 try-catch，但仍在循环内 await（阻塞后续预约创建）
- 无事务包裹，部分成功部分失败时数据不一致

**建议:** 使用 `prisma.$transaction()` 包裹所有预约创建，邮件发送移到事务外异步执行。

### 3.2 Merchant Upgrades 三次查询 🟡 中等

**文件:** `src/app/api/merchant/upgrades/route.ts:30-112`

```typescript
// 查询 1: 获取 ADDON 类型模板
const addonTemplates = await prisma.serviceComponent.findMany({ ... });
// 查询 2: 获取已有商户组件
const existingMerchantComponents = await prisma.merchantComponent.findMany({ ... });
// 可能的写入: 创建缺失组件
await prisma.merchantComponent.createMany({ ... });
// 查询 3: 获取所有升级服务
const allMerchantUpgrades = await prisma.merchantComponent.findMany({ ... });
```

**问题:** 查询 1 和 2 可以合并，或直接用查询 3 替代前两次查询（在创建缺失组件后）。

### 3.3 首页数据查询优化已做得很好 🟢 表扬

`planService.getHomepagePlans()` 使用 `Promise.all` 并行 5 个查询，且精简 `select` 字段，是很好的实践。`getDetailById()` 使用单次查询 + 精简 select 也很高效。

### 3.4 plans/[id] API 重复查询 🟡 中等

**文件:** `src/app/api/plans/[id]/route.ts:12-37`

```typescript
let plan = await prisma.rentalPlan.findUnique({ where: { id } });
if (!plan) {
  plan = await prisma.rentalPlan.findUnique({ where: { slug: id } });
}
```

**建议:** 使用 `findFirst` + `OR` 合并为单次查询：

```typescript
const plan = await prisma.rentalPlan.findFirst({
  where: { OR: [{ id }, { slug: id }] },
});
```

---

## 4. 事务与数据一致性

### 4.1 Booking 创建缺少事务 🔴 严重

**文件:** `src/app/api/bookings/route.ts`

多店铺预约场景：如果第 2 个店铺的预约创建失败，第 1 个已创建的预约不会回滚，导致用户和系统状态不一致。

**建议:** 使用 `prisma.$transaction()` 包裹。

### 4.2 标签更新的 usageCount 准确性 🟡 中等

**文件:** `src/app/api/merchant/plans/[id]/route.ts:372-376`

```typescript
await tx.tag.updateMany({
  where: { id: { in: validatedData.tagIds } },
  data: { usageCount: { increment: 1 } },
});
```

**问题:** 只在更新标签时增加计数，不在删除旧标签时减少计数。随着标签的增删操作，`usageCount` 会持续膨胀。

**建议:** 删除旧标签时同步 `decrement`，或将 `usageCount` 改为实时聚合计算。

### 4.3 Favorite 创建后的冗余查询 🟢 低

**文件:** `src/app/api/favorites/route.ts:138-153`

```typescript
const favorite = await prisma.favorite.create({ data: { ... } });
// 创建后再次查询获取关联数据
const favoriteWithPlan = await prisma.favorite.findUnique({
  where: { id: favorite.id },
  include: { plan: { ... } },
});
```

**建议:** 直接在 `create` 中使用 `include` 获取关联数据。

---

## 5. 级联删除与引用完整性

### 5.1 级联删除规则汇总

| 关系                  | onDelete  | 风险评估                                            |
| --------------------- | --------- | --------------------------------------------------- |
| Account → User        | Cascade ✅ | 合理                                                |
| Session → User        | Cascade ✅ | 合理                                                |
| UserPreference → User | Cascade ✅ | 合理                                                |
| Merchant → User       | Cascade ⚠️ | 删除用户会级联删除商家及其所有数据                  |
| RentalPlan → Merchant | Cascade ⚠️ | 删除商家会级联删除所有套餐                          |
| Booking → User        | 无设定 🔴  | 删除用户时会被 FK 约束阻止                          |
| Booking → Merchant    | 无设定 🔴  | 删除商家时会被 FK 约束阻止                          |
| BookingItem → Plan    | 无设定 🔴  | 删除套餐时会被 FK 约束阻止                          |
| BookingItem → Store   | 无设定 🔴  | 删除店铺时会被 FK 约束阻止                          |
| Store → Merchant      | 无设定 ⚠️  | 删除商家时会被阻止（与 RentalPlan 的 Cascade 矛盾） |

### 5.2 级联删除链问题 🔴 严重

**User → Merchant (Cascade) → RentalPlan (Cascade)**

但 `Booking` 和 `BookingItem` 引用了 `RentalPlan` 且没有级联删除。这意味着：
- 如果有任何 Booking 关联了该商家的套餐，删除 User 会因为 FK 约束失败
- 这是好的（保护了订单数据），但错误信息可能不友好

**Store → Merchant (无 onDelete)** 与 **RentalPlan → Merchant (Cascade)** 矛盾：
- 删除商家时，套餐会被级联删除，但店铺不会，导致孤立的店铺记录

**建议:**
- `Booking.userId` 和 `Booking.merchantId` 添加 `onDelete: SetNull`（保留订单，清除用户引用）
- `BookingItem.planId` 添加 `onDelete: SetNull`（保留订单项，清除套餐引用）
- `Store.merchantId` 添加 `onDelete: Cascade` 或 `SetNull`（与套餐删除策略一致）

---

## 6. Schema 设计问题

### 6.1 RentalPlan.highlights 类型可疑 🟡 中等

**Schema:** `highlights String?` — 单个可选字符串

**代码中的使用:**
- `PlanDetailData` 接口定义为 `highlights: string[]`
- `getDetailById()` 中直接赋值 `highlights: plan.highlights`

**问题:** `String?` 和 `string[]` 类型不匹配。可能在运行时不会报错（JavaScript 弱类型），但语义不正确。

**建议:** 如果 highlights 是多个卖点列表，改为 `highlights String[] @default([])`。

### 6.2 RentalPlan 缺少 nameEn 字段 🟡 中等

**Schema:** `RentalPlan` 模型没有 `nameEn` 字段（使用 `translations Json?` 实现多语言）。

**代码中:** `src/app/api/merchant/plans/route.ts` 的 createPlanSchema 验证了 `nameEn`，且传入 `prisma.rentalPlan.create({ data: { nameEn: ... } })`。

**问题:** 这会导致 Prisma 运行时错误（传入了 schema 中不存在的字段）。

**建议:** 要么在 schema 中添加 `nameEn`，要么在 API 中移除 `nameEn`，改用 `translations` JSON 字段。

### 6.3 Favorite 表的多态设计 🟡 中等

```prisma
model Favorite {
  kimonoId  String?
  planId    String?      // 两个可选 FK，至少一个非空
  imageUrl  String?
  @@unique([userId, kimonoId])
  @@unique([userId, planId, imageUrl])
}
```

**问题:**
- 没有数据库级别的 CHECK 约束确保 `kimonoId` 和 `planId` 至少有一个非空
- 理论上可以创建两者都为 null 的记录
- PostgreSQL 中 null 值不参与 unique 约束，所以 `@@unique([userId, kimonoId])` 不会阻止重复的 `kimonoId = null` 记录

**建议:** 考虑拆分为 `PlanFavorite` 和 `KimonoFavorite` 两张表，或使用 Prisma 中间件/应用层确保数据完整性。

### 6.4 Cart.expiresAt 无清理机制 🟢 低

```prisma
model Cart {
  expiresAt DateTime
  @@index([expiresAt])
}
```

**问题:** 有 expiresAt 字段和索引，但未发现任何定时清理过期购物车的逻辑（cron job 或 Supabase Edge Function）。

---

## 7. 冗余字段与数据同步

### 7.1 RentalPlan.tags — 已废弃字段未移除 🟡 中等

```prisma
tags String[] @default([])  // 保留旧字段，后续可移除
```

**现状:** 已有 `PlanTag` 关联表实现标签系统。旧 `tags` 字段仍在，但新代码不再使用。

**建议:** 移除该字段，避免混淆。

### 7.2 聚合缓存字段无更新逻辑 🟡 中等

| 模型       | 缓存字段        | 是否有更新逻辑 |
| ---------- | --------------- | -------------- |
| Merchant   | totalBookings   | ❌ 未发现       |
| Merchant   | totalRevenue    | ❌ 未发现       |
| Merchant   | reviewCount     | ❌ 未发现       |
| Merchant   | rating          | ❌ 未发现       |
| Kimono     | viewCount       | ❌ 未发现       |
| Kimono     | bookingCount    | ❌ 未发现       |
| Tag        | usageCount      | ⚠️ 只增不减     |
| RentalPlan | currentBookings | ❌ 未发现       |

**问题:** 这些聚合缓存字段永远保持默认值 0，前端显示不准确。

**建议:** 要么实现更新逻辑（在创建 Booking/Review 时同步更新），要么移除这些字段改用实时聚合查询。

### 7.3 RentalPlan.storeName/region 与 PlanStore 冗余 🟡 中等

`RentalPlan` 同时有：
- `storeName String?` / `region String?` — 冗余的文本字段
- `planStores PlanStore[]` — 正式的关联表

**现状:** 两者并存，代码中 `merchantName` 的显示逻辑为 `merchant?.businessName || storeName || ''`。

**建议:** 逐步迁移到只使用 `PlanStore` 关联，通过 JOIN 获取店铺名称和地区。

---

## 8. 字段命名一致性

### 8.1 @map 使用不一致 🟢 低

**使用 snake_case @map 的模型:**
- PlanStore、PlanTag、Tag、TagCategory、MapTemplate、MapHotspot
- ServiceComponent、MerchantComponent、PlanComponent、PlanUpgrade

**不使用 @map 的模型:**
- User、Account、Session、Kimono、KimonoImage、KimonoStore
- Cart、CartItem、Booking、BookingItem、BookingKimono
- Favorite、Review、UserBehavior

**说明:** 新添加的模型倾向于使用 `@map`，旧模型不使用。数据库表列名分别是 camelCase 和 snake_case 混合。

**建议:** 对于新增字段/模型，统一使用 `@map` 映射到 snake_case。已有字段不建议迁移（风险大于收益）。

### 8.2 Account 模型 snake_case 字段 🟢 低

```prisma
model Account {
  refresh_token  String?   // NextAuth 适配器要求
  access_token   String?
  token_type     String?
  session_state  String?
}
```

**说明:** 这些是 NextAuth 适配器的标准字段名，不应修改。

---

## 9. 审计字段完整性

| 模型          | createdAt | updatedAt | 状态 |
| ------------- | --------- | --------- | ---- |
| User          | ✅         | ✅         | ✅    |
| Merchant      | ✅         | ✅         | ✅    |
| Store         | ✅         | ✅         | ✅    |
| RentalPlan    | ✅         | ✅         | ✅    |
| Booking       | ✅         | ✅         | ✅    |
| BookingItem   | ✅         | ❌         | ⚠️    |
| BookingKimono | ❌         | ❌         | 🔴    |
| CartItem      | ✅         | ❌         | ⚠️    |
| Favorite      | ✅         | ❌         | ⚠️    |
| Review        | ✅         | ✅         | ✅    |
| KimonoImage   | ❌         | ❌         | 🟡    |

**建议:** 为 `BookingKimono` 添加 `createdAt`。`BookingItem`、`CartItem`、`Favorite` 作为从属记录，缺少 `updatedAt` 可接受。

---

## 10. 枚举设计

### 10.1 枚举设计整体合理 🟢

- `BookingStatus`: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED → CANCELLED → NO_SHOW ✅ 覆盖完整
- `PaymentStatus`: PENDING → PARTIAL → PAID → REFUNDED ✅ 合理
- `PlanStatus`: DRAFT → PUBLISHED → ARCHIVED ✅ 简洁
- `MerchantStatus`: PENDING → APPROVED → REJECTED → SUSPENDED ✅ 合理

### 10.2 BehaviorEvent 枚举偏少 🟢 低

```prisma
enum BehaviorEvent {
  PAGE_VIEW
  KIMONO_VIEW
  KIMONO_FAVORITE
  BOOKING_START
  BOOKING_COMPLETE
}
```

**说明:** 缺少 `PLAN_VIEW`、`CART_ADD`、`SEARCH` 等事件类型。但作为 MVP 阶段，当前覆盖范围可接受。

---

## 11. 安全与权限

### 11.1 Admin 页面权限验证 ✅

Admin 页面在 `admin/layout.tsx` 级别进行 ADMIN/STAFF 角色检查，覆盖所有子路由。

### 11.2 Admin API 路由缺少权限验证 🔴 严重

**文件:** `src/app/api/admin/bookings/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // ❌ 没有 auth() 验证
  // ❌ 没有角色检查
  const bookings = await prisma.booking.findMany({ ... });
}
```

**问题:** Admin API 路由可以被任何人访问，无需认证。虽然页面有 layout 保护，但 API 路由可以直接通过 HTTP 请求访问。

**建议:** 所有 `/api/admin/*` 路由添加认证和角色验证中间件。

### 11.3 Kimonos API 使用 `any` 类型 🟢 低

**文件:** `src/app/api/kimonos/route.ts:20`

```typescript
const where: any = {};
```

**问题:** 绕过了 TypeScript 类型检查。应使用 `Prisma.KimonoWhereInput`。

---

## 12. 优化建议总结

### 🔴 严重 — 立即处理

| #   | 问题                           | 位置                    | 建议                        |
| --- | ------------------------------ | ----------------------- | --------------------------- |
| 1   | Prisma 客户端重复实例          | `src/lib/db.ts`         | 删除，统一为 `@/lib/prisma` |
| 2   | BookingItem.bookingId 缺少索引 | `schema.prisma`         | 添加 `@@index([bookingId])` |
| 3   | Booking 创建缺少事务           | `api/bookings/route.ts` | 使用 `$transaction` 包裹    |
| 4   | Admin API 缺少权限验证         | `api/admin/*`           | 添加 auth + role 检查       |
| 5   | 级联删除链矛盾                 | `schema.prisma`         | 统一 onDelete 策略          |

### 🟡 中等 — 下个迭代处理

| #   | 问题                     | 位置                      | 建议                    |
| --- | ------------------------ | ------------------------- | ----------------------- |
| 6   | 聚合缓存字段无更新逻辑   | 多处                      | 实现更新或移除字段      |
| 7   | RentalPlan.tags 废弃字段 | `schema.prisma`           | 移除                    |
| 8   | highlights 类型不匹配    | `schema.prisma` / service | 改为 `String[]`         |
| 9   | nameEn schema-代码不一致 | `merchant/plans`          | 统一                    |
| 10  | usageCount 只增不减      | `merchant/plans/[id]`     | 添加 decrement          |
| 11  | 多处缺失索引             | `schema.prisma`           | 批量添加                |
| 12  | Favorite 多态设计无约束  | `schema.prisma`           | 添加应用层校验          |
| 13  | plans/[id] 重复查询      | `api/plans/[id]`          | 改用 `findFirst` + `OR` |

### 🟢 低优先级 — 有时间再处理

| #   | 问题                   | 位置            | 建议                          |
| --- | ---------------------- | --------------- | ----------------------------- |
| 14  | User 冗余索引          | `schema.prisma` | 移除与 @unique 重复的 @@index |
| 15  | @map 使用不一致        | `schema.prisma` | 新模型统一使用 @map           |
| 16  | 审计字段不完整         | `schema.prisma` | BookingKimono 添加 createdAt  |
| 17  | Cart.expiresAt 无清理  | 缺失            | 添加 cron 清理逻辑            |
| 18  | BehaviorEvent 覆盖不全 | `schema.prisma` | 后续按需添加                  |

---

## 附录：索引优化 SQL 参考

如果需要直接在数据库执行索引创建（绕过 Prisma migration），参考以下 SQL：

```sql
-- 严重：BookingItem.bookingId
CREATE INDEX IF NOT EXISTS "booking_items_bookingId_idx" ON "booking_items" ("bookingId");

-- 中等：KimonoImage.kimonoId
CREATE INDEX IF NOT EXISTS "kimono_images_kimonoId_idx" ON "kimono_images" ("kimonoId");

-- 中等：BookingKimono
CREATE INDEX IF NOT EXISTS "booking_kimonos_bookingItemId_idx" ON "booking_kimonos" ("bookingItemId");
CREATE INDEX IF NOT EXISTS "booking_kimonos_kimonoId_idx" ON "booking_kimonos" ("kimonoId");

-- 中等：Review
CREATE INDEX IF NOT EXISTS "reviews_userId_idx" ON "reviews" ("userId");
CREATE INDEX IF NOT EXISTS "reviews_bookingId_idx" ON "reviews" ("bookingId");

-- 低：MerchantReview
CREATE INDEX IF NOT EXISTS "merchant_reviews_userId_idx" ON "merchant_reviews" ("userId");
CREATE INDEX IF NOT EXISTS "merchant_reviews_bookingId_idx" ON "merchant_reviews" ("bookingId");
```

推荐方式是在 `schema.prisma` 中添加 `@@index` 后运行 `pnpm prisma db push`。
