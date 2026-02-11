# Backend & Data Model Review — Staff Engineer 审计报告

> 日期: 2026-02-10
> 审计范围: Prisma Schema, Supabase PostgreSQL, API Routes, Service Layer

---

## 概要

对 Kimono One 的后端和数据模型进行了全面审计，涵盖：
- Supabase PostgreSQL 实际数据库状态（表大小、索引使用率、RLS 策略）
- Prisma Schema 与数据库的一致性
- API 路由的查询效率和安全性
- Service 层的架构模式

共发现 **6 类问题**，按严重程度排序。

---

## 1. [Critical] 安全 — RLS 全面关闭

### 诊断

30 张表全部 `rls_enabled = false`。

### 风险

Supabase 的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 公开嵌入在前端 JS 中。任何人可以：
1. 从浏览器 DevTools 获取 anon key
2. 通过 Supabase REST API (`https://epxyusnhvqfhfbaqgsli.supabase.co/rest/v1/`) 直接查询任意表
3. `SELECT * FROM users` — 获取所有用户邮箱、电话、密码哈希
4. `SELECT * FROM bookings` — 获取所有预约记录

### 缓解因素

当前数据操作全部走 Prisma 直连 PostgreSQL，Supabase Client 仅用于 Storage（文件上传）。PostgREST 端口虽开放但前端代码未调用。

### 建议方案

**方案 A（最小修复，推荐）:** 给所有表开 RLS + 默认 deny all policy
```sql
-- 对每张表执行
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- 不创建任何 policy = 默认拒绝所有通过 anon/authenticated role 的访问
-- Prisma 走的是 postgres role（service_role 或 direct connection），不受 RLS 影响
```

**方案 B（彻底）:** 在 Supabase Dashboard → API Settings 中限制 public schema 的暴露。

---

## 2. [High] 数据一致性 — Booking 创建无事务保护

### 诊断

`src/app/api/bookings/route.ts:127-202`

多店铺预约时，for 循环内逐个 `prisma.booking.create()`，无 `$transaction` 包裹。

### 场景

用户预约 2 个店铺的套餐：
1. 店铺 A 预约创建成功 → 确认邮件已发送
2. 店铺 B 预约创建失败（如数据库约束冲突）
3. 结果：用户收到 1 封确认邮件，但预期预约了 2 个店铺，体验不一致

### 建议

```typescript
const bookings = await prisma.$transaction(
  storeEntries.map(([storeId, storeItems]) =>
    prisma.booking.create({ data: { ... }, include: { ... } })
  )
);
// 事务成功后再发邮件
for (const booking of bookings) {
  sendBookingConfirmationEmail(...).catch(console.error);
}
```

---

## 3. [Medium] 性能 — 首页全量查询

### 诊断

`src/server/services/plan.service.ts:648-832` — `getHomepagePlans()`

- 一次拉取 **所有活跃套餐**（`WHERE isActive = true AND themeId IS NOT NULL`）
- 每条套餐 include `planComponents → merchantComponent → template` + `planTags → tag`
- 拿到全量数据后在 JS 层做 `filter(themeId === theme.id).slice(0, limitPerTheme)`
- `getPlansPageData()` (line 838) 同样模式

### 当前状态

93 条套餐，5 个并行查询，延迟可接受。

### 风险

套餐 500+ 时：
- 数据库返回大量不需要的数据
- JS 层过滤浪费 CPU 和内存
- 5 个并行查询在 Supabase 免费/Pro 计划的连接池中可能竞争

### 建议

**短期:** 给 `getHomepagePlans` 加 `limitPerTheme` 推入数据库层：
```typescript
// 改为按主题分别查询，每个主题 LIMIT 8
const plansByTheme = await Promise.all(
  themes.map(theme =>
    prisma.rentalPlan.findMany({
      where: { isActive: true, themeId: theme.id },
      take: limitPerTheme,
      orderBy: [{ isFeatured: 'desc' }, { price: 'asc' }],
      select: { ... },
    })
  )
);
```

**长期:** 首页数据 ISR 缓存 + revalidate（Next.js `revalidate: 300`），避免每次请求都查库。

---

## 4. [Medium] Schema 漂移 — 数据库有废弃列

### 诊断

`pg_stat_statements` 中 rental_plans 的 UPDATE 语句包含以下列，但 `schema.prisma` 中已删除：
- `category` (enum)
- `includes` (数组)
- `tags` (数组)
- `isLimited` (布尔)
- `maxBookings` (整数)
- `currentBookings` (整数)
- `nameEn` (字符串)

### 风险

- 占用存储空间（虽然列值可能为 null）
- 下次 `prisma migrate` 可能因 schema 与实际数据库不一致而失败
- 新开发者看到数据库表结构会产生困惑

### 建议

创建 migration 清理废弃列：
```sql
ALTER TABLE rental_plans
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS includes,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS "isLimited",
  DROP COLUMN IF EXISTS "maxBookings",
  DROP COLUMN IF EXISTS "currentBookings",
  DROP COLUMN IF EXISTS "nameEn";
```

---

## 5. [Medium] 死表 & 无用索引

### 诊断

**死表（0 行，代码中未实际使用）:**

| 表名 | 行数 | 索引数 | 说明 |
|------|------|--------|------|
| `carts` | 0 | 5 | 购物车用 Zustand + localStorage 实现，服务端表从未写入 |
| `cart_items` | 0 | 1 | 同上 |
| `payouts` | 0 | 4 | 结算功能未实现 |
| `listings` | 0 | 3 | 用途不明，可能是旧版商品列表 |
| `sessions` | 0 | 2 | NextAuth sessions 表但无数据，认证可能走了 JWT 策略 |
| `accounts` | 0 | 2 | NextAuth accounts 表但无 OAuth 登录 |

**从未使用的索引 (idx_scan = 0):** 共 30+ 个

典型浪费：
- `plan_stores` 上的 4 个索引（表本身 0 行）
- `virtual_tryons` 上的 5 个索引（有数据但从未通过索引查询）
- `rental_plans_isActive_displayOrder_idx` 被 `themeId_isActive_displayOrder` 覆盖

### 影响

每次 INSERT/UPDATE 都需维护这些索引。当前数据量小（总表大小 < 2MB）感知不到，但会影响批量写入性能。

### 建议

1. 删除死表（或先 rename 加 `_deprecated` 后缀观察一段时间）
2. 清理未使用的索引
3. `plan_stores` 表为空但地点筛选依赖它 → 确认是使用 `region` 字段替代还是数据缺失

---

## 6. [Low] Favorites API 多余查询

### 诊断

`src/app/api/favorites/route.ts:90-112` — POST 创建收藏

```typescript
// 第一次：检查是否存在
const existing = await prisma.favorite.findFirst({ where: { userId, planId, imageUrl } });
// 第二次：创建
const favorite = await prisma.favorite.create({ data: { ... } });
// 第三次：再查一次带 include plan
const favoriteWithPlan = await prisma.favorite.findUnique({
  where: { id: favorite.id },
  include: { plan: { select: { ... } } },
});
```

3 次数据库往返，可优化为 1 次。

### 建议

```typescript
// 使用 upsert + include，一次搞定
const favorite = await prisma.favorite.upsert({
  where: { userId_planId_imageUrl: { userId, planId, imageUrl } },
  update: {},  // 已存在则不更新
  create: { userId, planId, imageUrl },
  include: { plan: { select: { ... } } },
});
```

---

## plan_stores 空表 — 功能性 Bug

### 特别注意

`plan_stores` 关联表有 **0 行数据**。但代码中多处依赖它：
- `planService.getList()` — 按地点筛选
- `planService.getDetailById()` — 获取套餐关联店铺
- 首页搜索

当前所有套餐靠 `region` 字符串字段标识地区（如 "京都"），而非通过 `plan_stores` JOIN `stores`。

这意味着：
1. 地点精确筛选功能实际上是**不工作的**
2. 套餐详情页的"可用店铺"列表永远为空
3. 有完整的 `Store` 表（5 行数据）但没有被关联

**需确认:** 这是 by design（MVP 阶段只用 region 字段）还是遗漏了数据填充？

---

## 总结 — 优先级排序

| 优先级 | 问题 | 修复复杂度 | 影响范围 |
|--------|------|-----------|---------|
| P0 | RLS 全关 | 低（一个 SQL 脚本） | 安全 |
| P1 | Booking 无事务 | 低（$transaction 包裹） | 数据一致性 |
| P1 | plan_stores 空表 | 中（需确认设计意图） | 功能正确性 |
| P2 | Schema 漂移 | 低（migration 清理） | 维护性 |
| P2 | 首页全量查询 | 中（重构查询或加缓存） | 未来性能 |
| P3 | 死表清理 | 低 | 维护性 |
| P3 | Favorites 多余查询 | 低 | 微小性能 |

---

## 关键决策记录

### 决策 1: plan_stores 关联表

**背景:** `plan_stores` 表为空，当前用 `region` 字符串做地点展示。

**决策:** 采用方案 B — 填充 `plan_stores` 数据 + 代码适配。

**理由:** 业务场景是一个套餐可在多个店铺销售（如"京都经典"在 3 家店都有），`region` 单值字符串无法表达多对多关系。

**影响范围:**
- 需要 migration 脚本根据 `region` + `stores.city` 自动填充 `plan_stores`
- `planService.getList()` 的地点筛选已经指向 `plan_stores`，代码层面已 ready
- 商家后台创建套餐时需要添加"可用店铺"选择
- `region` 字段可保留用于搜索/展示，但不再作为筛选数据源

---

## 下一步

运行 `/workflows:plan` 创建修复计划，优先级：
1. P0: RLS 全表开启
2. P1: Booking 事务保护
3. P1: plan_stores 数据填充
4. P2: Schema 漂移清理
5. P2: 首页查询优化
6. P3: 死表/索引清理 + Favorites 优化
