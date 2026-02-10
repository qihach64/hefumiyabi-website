# 架构审计报告

> 审计日期: 2026-02-09
> 审计范围: `src/` 目录全量代码
> 项目: Kimono One - 和服租赁电商平台

---

## 目录

1. [目录结构](#1-目录结构)
2. [Server/Client 组件边界](#2-serverclient-组件边界)
3. [数据获取模式](#3-数据获取模式)
4. [状态管理](#4-状态管理)
5. [代码复用与重复](#5-代码复用与重复)
6. [TypeScript 类型安全](#6-typescript-类型安全)
7. [导入和导出模式](#7-导入和导出模式)
8. [其他发现](#8-其他发现)

---

## 1. 目录结构

### 🔴 双重 Admin 路由目录

存在两套 admin 路由，分布在不同的 route group 中：

- `src/app/(main)/admin/` — 包含 merchants, users, settings, services 等页面
- `src/app/admin/` — 包含 analytics, calendar, tags 等页面

**影响**: 两者使用不同的布局（`(main)` 有 Header/Footer，`app/admin` 无布局），且 admin 页面分散在两个目录中，难以维护和统一权限控制。

| 文件 | 路由组 |
|------|--------|
| `src/app/(main)/admin/page.tsx` | `(main)` |
| `src/app/(main)/admin/merchants/page.tsx` | `(main)` |
| `src/app/(main)/admin/users/page.tsx` | `(main)` |
| `src/app/(main)/admin/settings/page.tsx` | `(main)` |
| `src/app/(main)/admin/services/page.tsx` | `(main)` |
| `src/app/admin/analytics/page.tsx` | 无 layout |
| `src/app/admin/calendar/page.tsx` | 无 layout |
| `src/app/admin/tags/page.tsx` | 无 layout |

**建议**: 统一到 `src/app/(main)/admin/` 或创建独立的 `(admin)` route group 配专属 layout。

---

### 🟡 kimonos 遗留路由

`/kimonos` 路由及其 API 似乎是早期遗留代码，与当前 `/plans` 体系功能重叠：

- `src/app/(main)/kimonos/page.tsx` — 使用直接 Prisma 查询，`any` 类型，旧样式
- `src/app/(main)/kimonos/[id]/page.tsx` — 和服详情页
- `src/app/api/kimonos/route.ts` — REST API，`any` 类型
- `src/app/api/kimonos/[id]/route.ts`
- `src/app/api/kimonos/featured/route.ts`
- `src/components/kimono/` — KimonoCard, KimonoGrid, KimonoFilter, FavoriteButton

这些页面使用旧的 `Kimono` 模型直接查询，没有通过 service 层，样式也与主站不一致。

**建议**: 评估是否需要保留 kimonos 模块。若不再使用，应移除相关代码以减少维护负担。

---

### 🟡 test-upload 遗留页面

`src/app/(main)/test-upload/page.tsx` 是一个开发测试页面，不应留在生产代码中。

**建议**: 移除或移到开发工具目录。

---

### 🟢 FSD 结构总体良好

Feature-Sliced Design 组织合理：

- `src/features/guest/discovery/` — 搜索、筛选组件
- `src/features/guest/plans/` — 套餐组件和 hooks
- `src/features/guest/booking/` — 预约组件
- `src/features/merchant/plans/` — 商家套餐管理

层次分明，职责清晰。

---

## 2. Server/Client 组件边界

### 🟢 页面级别使用合理

几乎所有 `page.tsx` 文件都是 Server Components，唯一的例外是 `test-upload/page.tsx`（开发页面）。核心模式正确：

- `page.tsx` (Server) 获取数据
- `*Client.tsx` (Client) 处理交互
- 示例: `src/app/(main)/page.tsx` → `HomeClient.tsx`

### 🟡 HomeClient.tsx 职责过重

`src/app/(main)/HomeClient.tsx` 作为客户端组件体量较大（~300 行），承担了：

- 搜索模式判断和切换
- URL 状态管理
- 标签过滤逻辑
- 加载状态管理（含 setTimeout 逻辑）
- 套餐过滤（filteredPlans 计算）
- 移动端筛选器状态

**建议**: 将过滤逻辑抽取为 custom hook（如 `useHomepageFilter`），将加载状态管理抽取为独立 hook。

---

### 🟡 SearchBarContext 性能关注

`src/contexts/SearchBarContext.tsx:28-70` — 在全局布局注入的 scroll 事件监听器：

```typescript
// 每次滚动都触发 requestAnimationFrame
const handleScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => { ... });
    ticking = true;
  }
};
window.addEventListener('scroll', handleScroll, { passive: true });
```

虽然使用了 rAF 节流，但该 Context 在所有 `(main)` 路由下都活跃，即使页面不需要搜索栏。

**建议**: 考虑按需挂载或使用 `IntersectionObserver` 替代 scroll 监听。

---

## 3. 数据获取模式

### 🔴 双重 Prisma 实例

项目中存在两个 Prisma 单例文件：

| 文件 | 导出方式 | 配置差异 |
|------|----------|----------|
| `src/lib/prisma.ts` | `export default prisma` + `export const prisma` | 含日志配置、生产环境预热 |
| `src/lib/db.ts` | `export const prisma` (命名导出) | 无日志、无预热 |

**引用混乱**:

- 大多数文件使用 `import prisma from '@/lib/prisma'`（默认导入）
- 部分文件使用 `import { prisma } from '@/lib/prisma'`（命名导入）
- 3 个文件使用 `import { prisma } from '@/lib/db'`：
  - `src/app/admin/analytics/page.tsx:1`
  - `src/app/api/admin/inventory/route.ts:2`
  - `src/app/api/kimonos/featured/route.ts:2`

由于两个文件创建了不同的 `PrismaClient` 实例，在开发环境可能导致连接池不共享甚至数据库连接泄漏。

**建议**: 删除 `src/lib/db.ts`，统一使用 `src/lib/prisma.ts`。同时统一导入方式（建议使用默认导入 `import prisma from '@/lib/prisma'`）。

---

### 🟡 REST API 与 tRPC 并存

tRPC 目前仅有 `plan` 和 `health` 两个 router，其余所有功能使用 REST API：

**tRPC 路由**:
- `plan.list`, `plan.getById`, `plan.featured`, `plan.searchAll`, `plan.relatedPlans`
- `health.check`

**REST API**（约 30+ 路由）:
- `/api/bookings/*`, `/api/stores/*`, `/api/tags/*`, `/api/favorites/*`
- `/api/merchant/*`, `/api/admin/*`
- `/api/chatbot`, `/api/virtual-tryon`, `/api/upload`

**现状**: tRPC 用于套餐查询（核心链路），REST 用于其他所有功能。这种混合模式本身不是问题，但应避免同一功能出现两种实现（如套餐既有 tRPC `plan.getById` 又有 REST `/api/plans/[id]`）。

---

### 🟡 API 路由缺乏 Service 层

大部分 REST API 路由直接在 route handler 中编写 Prisma 查询，没有抽象为 service：

```typescript
// src/app/api/kimonos/route.ts:20 - 直接在 API 中构建查询
const where: any = {};
if (category) { where.category = category; }
...
const kimonos = await prisma.kimono.findMany({ where, ... });
```

`planService` 是一个良好的模式示例，但其他域（bookings, stores, merchants）缺乏类似抽象。

**建议**: 对高频使用的域（booking, merchant）创建 service 层。

---

## 4. 状态管理

### 🟢 职责分工清晰

| 状态类型 | 技术方案 | 评价 |
|----------|----------|------|
| 购物车 | Zustand + localStorage | 结构良好，persist 合理 |
| 收藏 | Zustand + localStorage + API 同步 | 离线优先，设计周到 |
| URL 搜索状态 | nuqs (useSearchState) | 单一来源，封装完整 |
| 搜索栏 UI | React Context (SearchBarContext) | 合理但含调试日志 |
| 搜索加载 | React Context (SearchLoadingContext) | 轻量，职责单一 |

### 🟡 SearchBarContext 包含过多职责

`SearchBarContext` 管理了 4 个独立状态：

1. `isSearchBarExpanded` — 搜索栏展开/收起
2. `isHeroVisible` — Hero 区域可见性
3. `hideSearchBar` — 完全隐藏搜索栏
4. `hideThemeSelector` — 隐藏主题选择器

这些状态逻辑耦合度不高，可以考虑拆分或使用 Zustand 管理。

---

## 5. 代码复用与重复

### 🟡 套餐数据转换逻辑重复

`src/server/services/plan.service.ts` 中存在 3 处类似的 plan 转换逻辑：

1. **`getHomepagePlans`** (行 787-802) — `transformPlan` 函数
2. **`getPlansPageData`** (行 962-980) — 内联转换
3. **`getRelatedPlans`** (行 622-641) — 内联转换

三处都包含：
- `plan.merchant?.businessName || plan.storeName || ''` 商家名 fallback
- `pc.merchantComponent.template?.name || pc.merchantComponent.customName || '服务'` 组件名提取
- `plan.isCampaign || !!(plan.originalPrice && plan.originalPrice > plan.price)` 活动判断

**建议**: 提取为共享的转换函数。

---

### 🟡 预约状态映射重复

status/payment 映射逻辑在多个文件中重复出现：

- `src/app/(main)/merchant/dashboard/page.tsx:321-331` — `Record<string, { variant: any; label: string }>`
- `src/app/(main)/merchant/bookings/page.tsx:92-102` — 几乎相同的映射
- `src/app/(main)/merchant/bookings/[id]/page.tsx:79-89` — 再次重复
- `src/components/BookingsList.tsx:42-72` — 又一个变体

**建议**: 创建 `src/lib/booking-status.ts` 统一定义状态映射。

---

### 🟡 价格格式化散落各处

价格显示逻辑（分→元转换）在多处手动编写：

- `(plan.price / 100).toLocaleString()` — PlanCard, FeaturedPlanCard 等
- `(booking.totalAmount / 100).toFixed(2)` — BookingsList
- `(item.totalPrice / 100).toFixed(2)` — BookingsList
- `((style as any).price / 100).toLocaleString()` — VisualHub

**建议**: CLAUDE.md 中已定义 `displayPrice` 辅助函数模式，应实际创建并使用。

---

## 6. TypeScript 类型安全

### 🔴 大量 `any` 类型使用

共发现 **30+** 处 `any` 类型使用，集中在以下区域：

**严重 (组件 props 完全无类型)**:

| 文件 | 行号 | 使用方式 |
|------|------|----------|
| `src/components/BookingsList.tsx` | 12, 42, 74, 113 | `bookings: any[]`, `booking: any`, `item: any` |
| `src/components/plan/VisualHub/index.tsx` | 541 | `tryOnResult: any` |
| `src/lib/email.ts` | 217 | `booking: any` |

**中等 (查询条件无类型)**:

| 文件 | 行号 | 使用方式 |
|------|------|----------|
| `src/app/(main)/kimonos/page.tsx` | 25 | `const where: any = {}` |
| `src/app/api/kimonos/route.ts` | 20 | `const where: any = {}` |

**中等 (状态映射使用 any)**:

| 文件 | 行号 | 使用方式 |
|------|------|----------|
| `src/app/(main)/merchant/dashboard/page.tsx` | 321, 331 | `variant: any` |
| `src/app/(main)/merchant/bookings/page.tsx` | 92, 102 | `variant: any` |
| `src/app/(main)/merchant/bookings/[id]/page.tsx` | 79, 89 | `variant: any` |

**低 (catch 子句和外部 API)**:

- `src/app/api/virtual-tryon/route.ts` — 多处 `any`（Gemini API 响应）
- `src/app/api/chatbot/route.ts:106,134` — FAQ 匹配逻辑

### 🟡 `as any` 类型断言

5 处使用了 `as any` 断言：

| 文件 | 行号 | 说明 |
|------|------|------|
| `src/server/services/plan.service.ts` | 84, 90 | Prisma enum 类型转换（已有 eslint-disable 注释） |
| `src/components/plan/VisualHub/index.tsx` | 685 | 价格访问 |
| `src/app/(main)/admin/merchants/MerchantReviewList.tsx` | 111 | filter 状态设置 |
| `src/server/trpc/routers/__tests__/plan.test.ts` | 24 | 测试 mock |

**建议**:
- `BookingsList` 应定义 `Booking` 接口
- 状态映射的 `variant: any` 应改为 Badge 组件的 variant union type
- Prisma 查询条件应使用 `Prisma.XxxWhereInput` 类型

---

## 7. 导入和导出模式

### 🟡 Barrel Export 重导出问题

`src/features/guest/plans/components/index.ts` 完全从 `@/components/` 重导出：

```typescript
export { default as PlanCard } from "@/components/PlanCard";
export { default as FeaturedPlanCard } from "@/components/PlanCard/FeaturedPlanCard";
export { default as VisualHub } from "@/components/plan/VisualHub";
export { default as AITryOnSection } from "@/components/plan/AITryOnSection";
// ... 共 10 个组件
```

这意味着 `import { PlanCard } from '@/features/guest/plans'` 实际指向 `@/components/PlanCard`，增加了不必要的间接层。

**已有改进**: `HomepageExploreMode.tsx:6` 的注释表明团队已意识到这个问题：
```typescript
// 直接导入避免 barrel export 拉入 AITryOnSection (含 framer-motion)
import PlanCard from "@/components/PlanCard";
```

类似地，`src/features/guest/discovery/hooks/index.ts` 重导出了 `@/shared/hooks` 的 `useSearchState`。

**建议**: 清理不必要的重导出层，或确保消费者知道应该直接导入以避免 bundle 膨胀。

---

### 🟢 共享模块导出合理

以下 barrel exports 组织良好：

- `src/components/ui/index.ts` — Button, Card, Badge 等 UI 原子组件
- `src/shared/api/index.ts` — trpc, TRPCProvider
- `src/shared/hooks/index.ts` — useSearchState

---

## 8. 其他发现

### 🟡 大量 console.log 残留

发现 **50+** 处 `console.log`，大部分未做环境判断：

**生产代码中的调试日志**:

| 文件 | 行号 | 内容 |
|------|------|------|
| `src/contexts/SearchBarContext.tsx` | 54 | `console.log('[SearchBarContext] setIsSearchBarExpanded...')` |
| `src/components/layout/Header.tsx` | 43, 62 | 渲染计数和滚动日志 |
| `src/components/layout/HeaderSearchBar.tsx` | 14 | `console.log('[HeaderSearchBar] Render')` |
| `src/components/kimono/FavoriteButton.tsx` | 13 | `console.log("收藏:", kimonoId)` |
| `src/components/kimono/KimonoCard.tsx` | 53 | `console.log("收藏:", kimono.id)` |
| `src/store/userPhoto.ts` | 25, 30 | emoji 日志 |
| `src/store/tryOn.ts` | 50 | emoji 日志 |

**API 路由中的调试日志**:
- `src/app/api/bookings/route.ts` — 4 处
- `src/app/api/virtual-tryon/route.ts` — 10+ 处
- `src/app/api/merchant/upgrades/[id]/route.ts` — 5 处
- `src/app/api/test-db/route.ts` — 5 处

**planService 中的条件日志** (行 510-515) 是正确做法：
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(`[planService.getDetailById] Total: ${totalTime.toFixed(1)}ms`);
}
```

**建议**: 清理所有非条件 console.log，或引入统一的 logger 工具。

---

### 🟡 使用 `window.location.href` 代替 Next.js Router

| 文件 | 行号 | 代码 |
|------|------|------|
| `src/app/(main)/HomepageExploreMode.tsx` | 107 | `window.location.href = "/merchant/register"` |
| `src/app/(main)/HomepageSearchMode.tsx` | 154 | `window.location.href = "/"` |

使用 `window.location.href` 会导致全页面刷新，丢失客户端状态。应使用 `next/navigation` 的 `useRouter().push()`。

---

### 🟡 Analytics 页面使用虚假数据

`src/app/admin/analytics/page.tsx:17-19`:

```typescript
const pageViews = totalUsers * 10; // 假设每个用户平均浏览10次
const planViews = Math.floor(pageViews * 0.6); // 60%的人浏览套餐
const detailViews = Math.floor(planViews * 0.5); // 50%查看详情
```

转化漏斗和留存数据完全基于硬编码比例推算，可能误导运营决策。

**建议**: 如无真实埋点数据，应标注为"模拟数据"或接入真实分析工具。

---

### 🟢 性能优化实践良好

以下优化实践值得肯定：

- ISR 缓存 (`revalidate = 60`) 用于首页 — `src/app/(main)/page.tsx:8`
- 动态导入搜索模式组件 — `HomeClient.tsx:20-26`
- `Promise.all` 并行查询 — `planService.getHomepagePlans`
- `useMemo` + Map/Set 优化查找 — `HomeClient.tsx:187-196`
- Prisma `select` 精简字段 — `planService.getDetailById`
- Loading 骨架屏 — `plans/(list)/loading.tsx`, `search/loading.tsx`

---

## 改进优先级总结

| 优先级 | 发现 | 影响范围 |
|--------|------|----------|
| 🔴 高 | 双重 Prisma 实例 (`db.ts` vs `prisma.ts`) | 全局数据层 |
| 🔴 高 | 双重 Admin 路由目录 | 管理后台 |
| 🔴 高 | 大量 `any` 类型（BookingsList、API 路由） | 类型安全 |
| 🟡 中 | 50+ console.log 残留 | 生产性能、信息泄露 |
| 🟡 中 | kimonos 遗留代码 | 代码维护 |
| 🟡 中 | 套餐转换和状态映射重复 | 代码复用 |
| 🟡 中 | Barrel export 重导出 | Bundle 大小 |
| 🟡 中 | window.location.href | 用户体验 |
| 🟢 低 | SearchBarContext 职责过多 | 可维护性 |
| 🟢 低 | 价格格式化未抽象 | 一致性 |
| 🟢 低 | test-upload 遗留页面 | 代码整洁 |
