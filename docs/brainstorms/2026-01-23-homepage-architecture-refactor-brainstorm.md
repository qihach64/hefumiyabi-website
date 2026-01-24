# 首页架构重构 Brainstorm

> 日期: 2026-01-23
> 状态: 设计完成，待实施

## 背景

从 architecture-strategist 视角对首页进行了全面审计，发现多个严重的架构和性能问题。

## 我们要解决什么问题

### 🔴 严重问题

| 问题                        | 位置                       | 影响                              |
| --------------------------- | -------------------------- | --------------------------------- |
| N+1 查询 + 数据过度获取     | `page.tsx:40-98`           | TTFB 增加 200ms+，序列化 128KB    |
| `force-dynamic` 禁用缓存    | `page.tsx:5`               | 每次请求都全量查询数据库          |
| 694 行单体 Client Component | `HomeClient.tsx`           | 80-120KB JS，水合缓慢             |
| O(n²) 过滤逻辑              | `HomeClient.tsx:188-219`   | 大量套餐时明显卡顿                |
| Service 层未被复用          | `page.tsx` 直接调用 Prisma | tRPC 和 Server Component 逻辑分离 |

### 🟠 中等问题

| 问题         | 位置                          |
| ------------ | ----------------------------- |
| 状态管理混乱 | useSearchState + 本地状态重复 |
| 数据转换重复 | page.tsx:111-143 和 193-217   |
| 查询未并行化 | 5 个数据库查询串行执行        |

## 为什么选择这个方案

### 关键决策

1. **统一 Service 层**: Server Component 和 tRPC 都通过 `planService` 获取数据
   - 理由: 避免逻辑重复，便于测试，统一缓存策略

2. **60 秒缓存 + 手动刷新**: 使用 `revalidate: 60` 替代 `force-dynamic`
   - 理由: 平衡性能和数据新鲜度，提供手动刷新 UI

3. **中等粒度组件拆分**: HomeClient 拆成 3-4 个组件，每个 150-200 行
   - 理由: 足够细分以优化 bundle，又不至于过度拆分增加复杂度

4. **仅首页范围**: 先把首页做成标杆，再扩展到其他页面
   - 理由: 降低风险，验证方案可行性

## 改进后架构

```
改进前:
┌──────────────────────────────────────────────┐
│ page.tsx (Server Component)                  │
│   └─ 直接调用 Prisma (5个串行查询)            │
│   └─ force-dynamic (禁用缓存)                │
│   └─ 数据过度获取 (深度嵌套 include)          │
└──────────────────────────────────────────────┘
            │
            ▼ 传递大量 Props (128KB)
┌──────────────────────────────────────────────┐
│ HomeClient.tsx (694 行单体组件)               │
│   └─ 探索模式 + 搜索模式 + FilterSidebar      │
│   └─ O(n²) 过滤逻辑                          │
│   └─ 状态管理混乱                            │
└──────────────────────────────────────────────┘

改进后:
┌──────────────────────────────────────────────┐
│ page.tsx (Server Component)                  │
│   └─ 调用 planService.getHomepagePlans()     │
│   └─ revalidate: 60 (60秒缓存)               │
│   └─ Promise.all() 并行查询                  │
└──────────────────────────────────────────────┘
            │
            ▼ 精简 Props (~30KB)
┌──────────────────────────────────────────────┐
│ 拆分后的 Client Components                    │
│                                              │
│ ├─ HomepageExploreMode.tsx (~200行)          │
│ │    └─ HeroSection                          │
│ │    └─ ThemeCarousels                       │
│ │                                            │
│ ├─ HomepageSearchMode.tsx (~150行)           │
│ │    └─ 搜索结果列表                          │
│ │    └─ 使用 Map 优化过滤                     │
│ │                                            │
│ ├─ FilterSidebar.tsx (~150行)                │
│ │    └─ 独立可复用的侧边栏                    │
│ │                                            │
│ └─ RefreshCacheButton.tsx                    │
│      └─ 调用 revalidatePath('/') 刷新缓存    │
└──────────────────────────────────────────────┘
```

## Service 层设计

### 新增方法

```typescript
// src/server/services/plan.service.ts

interface HomepagePlansResult {
  themeSections: ThemeSection[];
  allPlans: PlanCardData[];
  totalCount: number;
}

interface ThemeSection {
  theme: Theme;
  plans: PlanCardData[];
}

interface PlanCardData {
  // 只包含卡片需要的字段，不包含深度嵌套
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  merchantName?: string;
  region?: string;
  themeId?: string;
  themeName?: string;
  tags: { id: string; name: string; icon?: string }[];
  // 不包含: planComponents, planUpgrades, campaign 详情等
}

planService.getHomepagePlans(options: {
  limitPerTheme?: number;  // 默认 8
}): Promise<HomepagePlansResult>
```

### 数据获取优化

```typescript
// 改进前: 串行查询
const themes = await prisma.theme.findMany({...});
const plans = await prisma.rentalPlan.findMany({...});  // 深度嵌套
const campaigns = await prisma.campaign.findMany({...});
const stores = await prisma.store.findMany({...});
const tagCategories = await prisma.tagCategory.findMany({...});

// 改进后: 并行查询 + 精简字段
const [themes, plans, campaigns, stores, tagCategories] = await Promise.all([
  prisma.theme.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
  prisma.rentalPlan.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      region: true,
      themeId: true,
      theme: { select: { name: true } },
      merchant: { select: { businessName: true } },
      planTags: { include: { tag: { select: { id: true, name: true, icon: true } } } },
      // 不包含 planComponents - 首页卡片不需要
    },
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'desc' }],
  }),
  prisma.campaign.findMany({ where: { isActive: true } }),
  prisma.store.findMany({ where: { isActive: true } }),
  prisma.tagCategory.findMany({ where: { isActive: true, showInFilter: true }, include: { tags: true } }),
]);
```

## 组件拆分设计

### 1. HomepageExploreMode.tsx (~200行)

职责:
- 显示 HeroSection
- 显示按主题分组的套餐轮播
- 处理"探索"模式的 UI

```typescript
interface HomepageExploreModeProps {
  themeSections: ThemeSection[];
  campaigns: Campaign[];
}
```

### 2. HomepageSearchMode.tsx (~150行)

职责:
- 显示搜索结果网格
- 使用 Map 优化过滤性能
- 处理"搜索"模式的 UI

```typescript
interface HomepageSearchModeProps {
  plans: PlanCardData[];
  stores: Store[];
  isLoading: boolean;
}

// 使用 Map 优化 O(n) 查找
const storeMap = useMemo(() => new Map(stores.map(s => [s.id, s])), [stores]);
```

### 3. FilterSidebar.tsx (~150行)

职责:
- 地区/店铺/标签/价格筛选
- 独立可复用（首页和列表页共用）

```typescript
interface FilterSidebarProps {
  stores: Store[];
  tagCategories: TagCategory[];
  maxPrice: number;
  onFilterChange: (filters: FilterState) => void;
}
```

### 4. RefreshCacheButton.tsx (~30行)

职责:
- 显示"刷新数据"按钮
- 调用 Server Action 刷新缓存

```typescript
'use client';

import { useTransition } from 'react';
import { refreshHomepage } from '@/app/(main)/actions';

export function RefreshCacheButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => refreshHomepage())}
      disabled={isPending}
    >
      {isPending ? '刷新中...' : '刷新数据'}
    </button>
  );
}

// src/app/(main)/actions.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function refreshHomepage() {
  revalidatePath('/');
}
```

## 性能预期

| 指标      | 改进前  | 改进后  | 提升  |
| --------- | ------- | ------- | ----- |
| TTFB      | ~360ms  | ~80ms   | 78% ↑ |
| 数据传输  | ~128KB  | ~30KB   | 77% ↓ |
| JS Bundle | ~100KB  | ~40KB   | 60% ↓ |
| FCP       | ~800ms  | ~400ms  | 50% ↑ |
| LCP       | ~2500ms | ~1200ms | 52% ↑ |

## 开放问题

1. **手动刷新按钮的位置**: 放在页面顶部还是底部？
2. **加载骨架屏**: 是否需要为 60 秒缓存过期时添加加载状态？
3. **预热缓存**: 是否需要在部署时预热首页缓存？

## 文件变更清单

### 新增文件
- `src/app/(main)/actions.ts` - Server Actions (刷新缓存)
- `src/app/(main)/HomepageExploreMode.tsx` - 探索模式组件
- `src/app/(main)/HomepageSearchMode.tsx` - 搜索模式组件
- `src/components/home/FilterSidebar.tsx` - 独立的筛选侧边栏
- `src/components/home/RefreshCacheButton.tsx` - 刷新缓存按钮

### 修改文件
- `src/app/(main)/page.tsx` - 使用 Service 层，并行查询，60s 缓存
- `src/server/services/plan.service.ts` - 新增 getHomepagePlans 方法
- `src/app/(main)/HomeClient.tsx` - 重构为协调组件或删除

### 可能删除
- `src/app/(main)/HomeClient.tsx` - 如果逻辑完全分散到子组件

## 浏览器分析：首页实际需要的数据

通过 agent-browser 打开首页实际查看渲染内容，发现以下问题：

### 套餐卡片实际显示的数据

**精选推荐卡片 (isFeatured=true)**
```
✓ 商家名称 (merchant.businessName)
✓ 地区 (region)
✓ 套餐名称 (name)
✓ 描述 (description)
✓ "包含" 列表 ← 来自 planComponents.template.name
✓ 标签列表 (planTags)
✓ 价格 / 原价 / 折扣
```

**普通卡片**
```
✓ 商家名称
✓ 地区
✓ 套餐名称
✓ 标签 (简化版)
✓ 价格 / 原价 / 折扣
✗ 不显示描述
✗ 不显示 "包含" 列表
```

### 当前获取 vs 实际需要

| 数据字段                               | 当前获取 | 实际使用   | 决策     |
| -------------------------------------- | -------- | ---------- | -------- |
| `campaign` 完整对象                    | ✓        | ✗ 完全没用 | **删除** |
| `planComponents.template.id`           | ✓        | ✗          | 删除     |
| `planComponents.template.code`         | ✓        | ✗          | 删除     |
| `planComponents.template.name`         | ✓        | ✓          | **保留** |
| `planComponents.template.type`         | ✓        | ✗          | 删除     |
| `planComponents.template.icon`         | ✓        | ✗          | 删除     |
| `planComponents.template.displayOrder` | ✓        | ✗          | 删除     |
| `planTags.tag.categoryId`              | ✓        | ✗          | 删除     |
| `plan.category`                        | ✓        | ✗          | 删除     |
| `plan.duration`                        | ✓        | ✗          | 删除     |

### 关键发现

**1. campaign 对象完全没用！**
```typescript
// 当前代码：获取了但没用
campaign: { select: { id, slug, title, description } }

// isCampaign 是通过价格计算的，不是 campaign 对象
isCampaign: !!plan.originalPrice && plan.originalPrice > plan.price
```

**2. planComponents 过度获取**
```typescript
// 当前：获取 6 个字段
template: { select: { id, code, name, type, icon, displayOrder } }

// 实际只用 1 个字段
includes: plan.planComponents.map(pc =>
  pc.merchantComponent.template?.name || pc.merchantComponent.customName
)
```

### 精简后的查询

```typescript
const plans = await prisma.rentalPlan.findMany({
  where: { isActive: true },
  select: {
    id: true,
    name: true,
    description: true,
    price: true,
    originalPrice: true,
    imageUrl: true,
    region: true,
    storeName: true,
    isFeatured: true,
    themeId: true,
    theme: { select: { name: true } },
    merchant: { select: { businessName: true } },
    planTags: {
      include: {
        tag: { select: { id: true, name: true, icon: true, color: true } }
      }
    },
    planComponents: {
      select: {
        merchantComponent: {
          select: {
            customName: true,
            template: { select: { name: true } }  // 只要 name！
          }
        }
      },
      orderBy: { hotmapOrder: 'asc' }
    },
    // 删除: campaign, category, duration
  },
});
```

### 数据量节省

| 场景     | 数据大小        |
| -------- | --------------- |
| 当前查询 | ~128KB          |
| 精简后   | ~40KB           |
| 节省     | **~88KB (69%)** |

## 下一步

运行 `/workflows:plan` 制定详细的实施计划。
