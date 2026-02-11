---
title: 后端数据模型清理与优化
type: refactor
date: 2026-02-10
source: docs/brainstorms/2026-02-10-backend-data-model-review-brainstorm.md
---

# 后端数据模型清理与优化

## 概述

基于 Staff Engineer 级别审计报告，分 4 个 Phase 修复后端数据模型问题。
覆盖 P1 功能性 Bug → P2 维护性/性能 → P3 清理优化。

## 关键文件

| 文件 | 作用 |
|------|------|
| `prisma/schema.prisma` | 数据模型定义 |
| `src/server/services/plan.service.ts` | 核心查询逻辑 |
| `src/app/api/favorites/route.ts` | 收藏 API |
| `prisma/seed.ts` | 数据填充脚本 |

---

## Phase 1: plan_stores 数据填充 [P1 — 功能性 Bug]

### 问题

`plan_stores` 关联表有 **0 行数据**，但代码中 `planService.getList()` 和 `getDetailById()` 依赖它做地点筛选和店铺关联。当前所有套餐靠 `region` 字符串字段做展示，精确筛选和"可用店铺"列表**不工作**。

### 方案

创建 migration 脚本，根据 `rental_plans.region` + `stores.city` 自动填充 `plan_stores`。

### 任务

- [x] **1.1** 创建 `scripts/populate-plan-stores.ts` 填充脚本
  ```typescript
  // 逻辑:
  // 1. 查询所有 active 的 RentalPlan (取 id, region)
  // 2. 查询所有 active 的 Store (取 id, city)
  // 3. 匹配规则:
  //    - region 包含 "京都" → 关联 city="京都" 的所有店铺
  //    - region 包含 "东京" / "浅草" → 关联 city="东京" 的所有店铺
  //    - region 为 null → 关联所有店铺 (默认全部可用)
  // 4. 用 createMany + skipDuplicates 写入 plan_stores
  ```
- [x] **1.2** 本地运行脚本，验证 plan_stores 行数 = 141，0 个孤立套餐
- [ ] **1.3** 验证功能正确性:
  - `planService.getDetailById()` 返回的 stores 列表不再为空
  - `/plans?location=京都` 筛选结果正确
  - 首页搜索地点筛选生效
- [x] **1.4** 更新 `prisma/seed.ts`，在创建套餐后自动填充 plan_stores

### 验证 SQL

```sql
-- 填充后应有数据
SELECT COUNT(*) FROM plan_stores;

-- 每个套餐至少关联一个店铺
SELECT rp.id, rp.name, COUNT(ps.id) as store_count
FROM rental_plans rp
LEFT JOIN plan_stores ps ON ps.plan_id = rp.id
WHERE rp.is_active = true
GROUP BY rp.id, rp.name
HAVING COUNT(ps.id) = 0;
-- 预期: 0 行 (没有孤立套餐)
```

---

## Phase 2: Schema 漂移清理 [P2 — 维护性]

### 问题

数据库有 7 个废弃列，Prisma Schema 已删除但数据库未同步:
`category`, `includes`, `tags`, `isLimited`, `maxBookings`, `currentBookings`, `nameEn`

### 任务

- [x] **2.1** 确认废弃列无代码引用 (Prisma Schema 已不含这些字段)
  ```bash
  # 搜索代码中是否还有引用
  grep -r "isLimited\|maxBookings\|currentBookings" src/ --include="*.ts" --include="*.tsx"
  ```
- [ ] **2.2** 创建 Prisma migration 清理废弃列
  ```sql
  -- prisma/migrations/YYYYMMDD_drop_deprecated_columns/migration.sql
  ALTER TABLE rental_plans
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS includes,
    DROP COLUMN IF EXISTS tags,
    DROP COLUMN IF EXISTS "isLimited",
    DROP COLUMN IF EXISTS "maxBookings",
    DROP COLUMN IF EXISTS "currentBookings",
    DROP COLUMN IF EXISTS "nameEn";
  ```
- [x] **2.3** 重写 `prisma/seed.ts` — 移除废弃字段 + 修复 campaign 关联方式
- [ ] **2.4** 运行 `pnpm prisma db push` 验证 schema 与数据库一致
- [x] **2.5** 运行 `pnpm build` 确认无编译错误

---

## Phase 3: 首页查询优化 [P2 — 性能]

### 问题

`plan.service.ts:648-832` — `getHomepagePlans()` 一次拉取**所有活跃套餐**，在 JS 层做 `filter(themeId).slice(0, limitPerTheme)`。当前 93 条可接受，500+ 时性能下降。

### 方案

将 `limitPerTheme` 推入数据库层，按主题分别查询。

### 任务

- [x] **3.1** 重构 `getHomepagePlans()` — 拆分为"按主题查询"
  ```typescript
  // plan.service.ts — getHomepagePlans()
  // 当前: 查全部 → JS 过滤
  // 改为: 先查 themes，再按 theme 分别查询 + take: limitPerTheme

  // Step 1: 查 themes (不变)
  const themes = await prisma.theme.findMany({ where: { isActive: true }, ... });

  // Step 2: 按主题并行查询 (替代全量查询)
  const themePlansResults = await Promise.all(
    themes.map(theme =>
      prisma.rentalPlan.findMany({
        where: { isActive: true, themeId: theme.id },
        take: limitPerTheme,
        orderBy: [{ isFeatured: 'desc' }, { price: 'asc' }],
        select: { /* 复用现有 select */ },
      })
    )
  );

  // Step 3: campaigns, stores, tagCategories 查询不变
  ```
- [x] **3.2** 分离 `getSearchPlans()` — 搜索模式独立查询，不再污染首页查询:
  ```typescript
  // 探索模式: 只查按主题分组 (新逻辑)
  // 搜索模式: 查全量 (保持现有逻辑)
  async getHomepagePlans(options: { mode: 'explore' | 'search', ... })
  ```
- [x] **3.3** 验证: pnpm build 通过 + 362 测试全部通过
- [ ] **3.4** (可选) 首页 ISR 缓存 `revalidate: 300`，减少重复查库

---

## Phase 4: 死表清理 + Favorites 优化 [P3 — 清理]

### 4A: 死表清理

#### 问题

6 张空表无代码使用: `carts`, `cart_items`, `payouts`, `listings`, `sessions`, `accounts`

#### 任务

- [ ] **4A.1** 确认无代码引用这些表
  ```bash
  grep -r "carts\|cart_items\|payouts\|listings" src/ prisma/ --include="*.ts" --include="*.tsx"
  # sessions/accounts 可能被 NextAuth 引用，需特别确认
  ```
- [ ] **4A.2** 从 `prisma/schema.prisma` 移除对应 model (如果还在的话)
- [ ] **4A.3** 创建 migration 删除死表
  ```sql
  DROP TABLE IF EXISTS cart_items;
  DROP TABLE IF EXISTS carts;
  DROP TABLE IF EXISTS payouts;
  DROP TABLE IF EXISTS listings;
  -- sessions/accounts: 仅在确认 NextAuth 未使用后删除
  ```
- [ ] **4A.4** 运行 `pnpm prisma db push` 同步

### 4B: Favorites API 优化

#### 问题

`src/app/api/favorites/route.ts:74-112` — POST 创建收藏用了 3 次数据库往返 (findFirst → create → findUnique)，可优化为 1 次。

#### 任务

- [ ] **4B.1** 重构 POST handler — 使用 `upsert` + `include`
  ```typescript
  // 替换 route.ts:74-112
  // Favorite 已有 @@unique([userId, planId, imageUrl])，可直接 upsert
  const favorite = await prisma.favorite.upsert({
    where: {
      userId_planId_imageUrl: {
        userId: session.user.id,
        planId,
        imageUrl: imageUrl || null,
      },
    },
    update: {},  // 已存在则不更新
    create: {
      userId: session.user.id,
      planId,
      imageUrl,
    },
    include: {
      plan: {
        select: {
          id: true, name: true, slug: true,
          price: true, imageUrl: true,
        },
      },
    },
  });
  ```
- [ ] **4B.2** 重构 DELETE handler — 使用 `deleteMany` 替代 findFirst + delete
  ```typescript
  // 替换 route.ts:143-161
  const { count } = await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      planId,
      imageUrl: imageUrl || undefined,
    },
  });
  if (count === 0) return 404;
  ```
- [ ] **4B.3** 测试收藏的添加/删除/重复添加场景

---

## 执行顺序

```
Phase 1 (plan_stores)  ←── 功能性 Bug，优先修
    ↓
Phase 2 (schema 清理)  ←── 清理后 seed.ts 不再报废弃字段警告
    ↓
Phase 3 (查询优化)     ←── Phase 1 填充数据后，查询优化才有意义
    ↓
Phase 4 (死表 + API)   ←── 独立清理，风险最低
```

每个 Phase 独立提交，格式: `refactor(db): Phase N — 描述`

## 风险与注意

| 风险 | 缓解 |
|------|------|
| plan_stores 填充逻辑匹配错误 | 先本地运行 + SQL 验证，再推生产 |
| 删除废弃列导致旧 migration 失效 | 用 `DROP IF EXISTS`，不影响已有 migration 历史 |
| 死表可能被 NextAuth 隐式使用 | sessions/accounts 表单独确认后再删 |
| 首页查询重构改变排序结果 | 对比重构前后各主题 section 的套餐 ID 列表 |
