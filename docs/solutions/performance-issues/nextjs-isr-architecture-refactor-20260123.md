---
title: Next.js 页面架构重构 - ISR 优化
slug: nextjs-isr-architecture-refactor
date: 2026-01-23
problem_type: performance_issue
component: page_architecture
pages_affected:
  - HomePage (/)
  - PlansPage (/plans)
  - PlanDetailPage (/plans/[id])
symptoms:
  - "TTFB ~300-360ms (force-dynamic 禁用缓存)"
  - "每次请求都执行服务端数据库查询"
  - "构建类型为 ƒ (动态渲染)"
  - "串行数据库查询导致响应慢"
root_cause: force-dynamic + searchParams 依赖导致页面无法静态生成
severity: high
resolution_type: architecture_refactor
tags:
  - nextjs
  - isr
  - performance
  - caching
  - service-layer
  - suspense
  - nuqs
---

# Next.js 页面架构重构 - ISR 性能优化

## Problem

三个核心页面（首页、套餐列表页、套餐详情页）使用 `force-dynamic` 和 `searchParams` 依赖，导致：

1. **无法使用缓存** - 每次请求都执行完整服务端渲染
2. **TTFB 过高** - 300-360ms（数据库查询 + 渲染）
3. **构建类型为动态** - 无法预渲染，无法利用 CDN 缓存

**原始代码模式：**

```typescript
// ❌ 禁用缓存
export const dynamic = 'force-dynamic';

// ❌ searchParams 导致动态渲染
export default async function Page({ searchParams }) {
  const params = await searchParams;
  // 使用 searchParams 进行服务端筛选...
}
```

## Root Cause

### 1. Next.js 15 的 searchParams 行为

在 Next.js 15 中，使用 `searchParams` 会自动将页面标记为动态，覆盖任何 `revalidate` 设置。

### 2. 服务端筛选 vs 客户端筛选

原架构在服务端根据 URL 参数进行筛选，每次参数变化都触发完整页面刷新。

### 3. 缺少 Service 层

直接在 page.tsx 中调用 Prisma，查询逻辑分散，无法复用。

## Solution

### 架构模式

```
┌─────────────────────────────────────────────────────────┐
│  Page (Server Component)                                │
│  - revalidate = 60 (ISR)                               │
│  - 调用 Service 层获取完整数据                          │
│  - Suspense 包裹客户端组件                              │
├─────────────────────────────────────────────────────────┤
│  Client Component                                       │
│  - useSearchState() 读取 URL 参数                       │
│  - useMemo 客户端筛选                                   │
│  - 即时响应，无需服务端刷新                             │
├─────────────────────────────────────────────────────────┤
│  Service Layer                                          │
│  - Promise.all 并行查询                                 │
│  - 精简字段，减少数据传输                               │
│  - 可复用的数据获取方法                                 │
└─────────────────────────────────────────────────────────┘
```

### 实施步骤

#### Step 1: 移除 force-dynamic，启用 ISR

```diff
- export const dynamic = 'force-dynamic';
+ export const revalidate = 60;  // 60秒重新验证
```

#### Step 2: 创建 Service 层方法

```typescript
// src/server/services/plan.service.ts

async getHomepagePlans(): Promise<HomepageData> {
  // 并行执行 5 个查询
  const [themes, plans, campaigns, stores, tagCategories] = await Promise.all([
    prisma.theme.findMany({ ... }),
    prisma.rentalPlan.findMany({ ... }),
    prisma.campaign.findMany({ ... }),
    prisma.store.findMany({ ... }),
    prisma.tagCategory.findMany({ ... }),
  ]);

  return { themeSections, allPlans, campaigns, stores, tagCategories };
}

async getPlansPageData(): Promise<PlansPageData> {
  const [themes, plans, tagCategories, priceStats] = await Promise.all([...]);
  return { themes, plans, tagCategories, maxPrice };
}
```

#### Step 3: 移除 searchParams 依赖

```diff
- export default async function Page({ searchParams }) {
-   const params = await searchParams;
-   const filtered = await getFilteredData(params);
+ export default async function Page() {
+   const data = await planService.getHomepagePlans();
+
+   return (
+     <Suspense fallback={<PageSkeleton />}>
+       <PageClient {...data} />
+     </Suspense>
+   );
```

#### Step 4: 客户端筛选

```typescript
// PageClient.tsx
function PageClient({ allPlans, themes, ... }) {
  // 从 URL 读取状态
  const { theme, location, tags, minPrice, maxPrice, sort } = useSearchState();

  // 客户端筛选
  const filteredPlans = useMemo(() => {
    let result = [...allPlans];

    if (theme) {
      result = result.filter(p => p.themeId === themeId);
    }
    if (location) {
      result = result.filter(p => p.region?.includes(location));
    }
    // ... 更多筛选

    return result;
  }, [allPlans, theme, location, tags, minPrice, maxPrice, sort]);

  return <PlanGrid plans={filteredPlans} />;
}
```

## Results

### 性能改进

| 页面 | TTFB (改进前) | TTFB (改进后) | 改进幅度 |
|------|---------------|---------------|----------|
| 首页 `/` | ~360ms | ~8ms | **98%** |
| 套餐列表 `/plans` | ~300ms | ~7.5ms | **97.5%** |
| 套餐详情 `/plans/[id]` | ~200ms | ~5ms | **97.5%** |

### 构建输出对比

```diff
改进前:
- ƒ /                    10.9 kB    251 kB
- ƒ /plans               6.2 kB     246 kB
- ƒ /plans/[id]          4.3 kB     244 kB

改进后:
+ ○ /                    10.9 kB    251 kB     1m    1y
+ ○ /plans               6.1 kB     246 kB     1m    1y
+ ● /plans/[id]          4.0 kB     244 kB
```

- `ƒ` = 动态渲染（每次请求执行服务端逻辑）
- `○` = 静态预渲染 + ISR
- `●` = SSG (generateStaticParams)

### 缓存 Headers

```http
Cache-Control: s-maxage=60, stale-while-revalidate=31535940
x-nextjs-cache: HIT
x-nextjs-prerender: 1
```

## Key Patterns

### 1. URL 状态管理统一使用 nuqs

```typescript
// ✅ 正确：使用 nuqs setter
const { setTheme } = useSearchState();
await setTheme('traditional');

// ❌ 错误：绕过 nuqs 直接操作 URL
router.push('/plans?theme=traditional');
```

### 2. Suspense 边界必须包裹使用 useSearchParams 的组件

```typescript
// SSG 需要 Suspense 边界
<Suspense fallback={<Skeleton />}>
  <ClientComponent />  {/* 使用 useSearchState/useSearchParams */}
</Suspense>
```

### 3. Service 层并行查询

```typescript
// ✅ 并行
const [a, b, c] = await Promise.all([queryA(), queryB(), queryC()]);

// ❌ 串行
const a = await queryA();
const b = await queryB();
const c = await queryC();
```

## Prevention

### 代码审查检查点

- [ ] 页面是否需要 `force-dynamic`？优先考虑 ISR
- [ ] 是否使用 `searchParams`？考虑客户端筛选
- [ ] 多个查询是否可以并行？使用 `Promise.all`
- [ ] 是否有 Service 层方法可以复用？

### ESLint 规则建议

```javascript
// 禁止在页面级别使用 force-dynamic（需要审批）
'no-restricted-syntax': ['warn', {
  selector: 'ExportNamedDeclaration[declaration.declarations.0.id.name="dynamic"]',
  message: '使用 force-dynamic 前请确认是否必要，优先考虑 ISR'
}]
```

## Related Documentation

- [首页性能验证](../../performance/2026-01-23-validation-results.md)
- [/plans 页面性能验证](../../performance/2026-01-23-plans-page-validation.md)
- [首页架构 Brainstorm](../../brainstorms/2026-01-23-homepage-architecture-refactor-brainstorm.md)
- [/plans 优化 Brainstorm](../../brainstorms/2026-01-23-plans-page-optimization-brainstorm.md)
- [URL 状态管理规范](../../guides/url-state-management.md)
- [nuqs 状态同步 Bug 修复](../integration-issues/nuqs-filter-state-sync-delay.md)

## Commits

```
e1978d0 refactor(plans): ISR 优化 + 修复 theme pill 选择 bug
1700e74 refactor(plans): 套餐详情页性能优化
8dcf1db refactor(arch): 页面架构审计与优化
32084a7 feat(state): 统一状态管理 - 迁移 HomeClient/PlansClient 到 useSearchState
```
