---
title: 首页架构重构
type: refactor
date: 2026-01-23
status: ready
---

# ♻️ 首页架构重构

## 概览

从 architecture-strategist 视角对首页进行全面审计后，发现多个严重的架构和性能问题。本次重构将统一 Service 层、优化数据获取、拆分组件、添加缓存策略。

**相关文档:** `docs/brainstorms/2026-01-23-homepage-architecture-refactor-brainstorm.md`

## 问题总结

| 问题                     | 位置                     | 影响                |
| ------------------------ | ------------------------ | ------------------- |
| 数据过度获取             | `page.tsx:40-98`         | 128KB → 40KB 可优化 |
| `force-dynamic` 禁用缓存 | `page.tsx:5`             | 每次请求全量查询    |
| 694 行单体 Client        | `HomeClient.tsx`         | 80-120KB JS         |
| O(n²) 过滤逻辑           | `HomeClient.tsx:188-219` | 性能瓶颈            |
| Service 层未复用         | page.tsx 直接调 Prisma   | 逻辑分散            |

## 实施计划

### Phase 1: Service 层统一 (优先级最高)

#### 1.1 新增 `planService.getHomepagePlans()` 方法

**文件:** `src/server/services/plan.service.ts`

```typescript
// 新增类型定义
export interface HomepagePlanCard {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  region: string | null;
  storeName: string | null;
  isFeatured: boolean;
  themeId: string | null;
  themeName: string | null;
  merchantName: string | null;
  includes: string[];  // planComponents 的名称列表
  planTags: { tag: { id: string; name: string; icon: string | null; color: string | null } }[];
}

export interface ThemeSection {
  id: string;
  slug: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  plans: HomepagePlanCard[];
}

export interface HomepageData {
  themes: Theme[];
  themeSections: ThemeSection[];
  allPlans: HomepagePlanCard[];
  campaigns: Campaign[];
  stores: { id: string; name: string; slug: string }[];
  tagCategories: TagCategory[];
}

// 新增方法
async getHomepagePlans(options?: { limitPerTheme?: number }): Promise<HomepageData>
```

**任务:**
- [ ] 定义 `HomepagePlanCard` 接口 (`plan.service.ts`)
- [ ] 定义 `ThemeSection` 接口 (`plan.service.ts`)
- [ ] 定义 `HomepageData` 接口 (`plan.service.ts`)
- [ ] 实现 `getHomepagePlans()` 方法
- [ ] 使用 `Promise.all()` 并行查询
- [ ] 精简 `select` 字段，删除 `campaign` 对象
- [ ] `planComponents` 只获取 `template.name` 和 `customName`
- [ ] 添加单元测试 (`plan.service.test.ts`)

#### 1.2 精简数据查询

**当前问题:**
```typescript
// 删除这些不需要的字段
campaign: { select: { id, slug, title, description } }  // 完全没用
planComponents.template: { id, code, type, icon, displayOrder }  // 只用 name
planTags.tag.categoryId  // 首页不需要
plan.category, plan.duration  // 首页不显示
```

**优化后查询:**
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
            template: { select: { name: true } }
          }
        }
      },
      orderBy: { hotmapOrder: 'asc' }
    },
  },
  orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'desc' }],
});
```

---

### Phase 2: 页面重构

#### 2.1 更新 `page.tsx`

**文件:** `src/app/(main)/page.tsx`

**任务:**
- [ ] 删除 `export const dynamic = 'force-dynamic'`
- [ ] 添加 `export const revalidate = 60`
- [ ] 替换直接 Prisma 调用为 `planService.getHomepagePlans()`
- [ ] 删除重复的数据转换逻辑 (第 111-143 行和 193-217 行)
- [ ] 简化 Props 传递

**修改后结构:**
```typescript
import { planService } from '@/server/services/plan.service';

export const revalidate = 60;

export default async function HomePage() {
  const homepageData = await planService.getHomepagePlans({ limitPerTheme: 8 });

  return (
    <HomeClient
      themeSections={homepageData.themeSections}
      allPlans={homepageData.allPlans}
      campaigns={homepageData.campaigns}
      stores={homepageData.stores}
      tagCategories={homepageData.tagCategories}
    />
  );
}
```

#### 2.2 添加 Server Action (缓存刷新)

**新增文件:** `src/app/(main)/actions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function refreshHomepage() {
  revalidatePath('/');
}
```

---

### Phase 3: 组件拆分

#### 3.1 提取 FilterSidebar 组件

**新增文件:** `src/features/guest/discovery/components/FilterSidebar.tsx`

**任务:**
- [ ] 从 `HomeClient.tsx` 第 264-441 行提取筛选侧边栏逻辑
- [ ] 创建独立的 `FilterSidebar` 组件 (~150 行)
- [ ] 定义 `FilterSidebarProps` 接口
- [ ] 使用 `Map` 优化店铺查找 (解决 O(n²) 问题)
- [ ] 导出到 `src/features/guest/discovery/index.ts`

**接口设计:**
```typescript
interface FilterSidebarProps {
  stores: { id: string; name: string }[];
  tagCategories: TagCategory[];
  regions: string[];
  maxPrice: number;
  // 筛选状态由 useSearchState 管理，组件内部调用
}
```

#### 3.2 拆分 HomeClient 为模式组件

**修改文件:** `src/app/(main)/HomeClient.tsx`

**任务:**
- [ ] 提取探索模式逻辑到 `HomepageExploreMode.tsx` (~200 行)
- [ ] 提取搜索模式逻辑到 `HomepageSearchMode.tsx` (~150 行)
- [ ] `HomeClient.tsx` 变为协调组件 (~100 行)，只负责模式切换

**新增文件:**
- `src/app/(main)/HomepageExploreMode.tsx`
- `src/app/(main)/HomepageSearchMode.tsx`

#### 3.3 添加刷新按钮组件

**新增文件:** `src/components/home/RefreshCacheButton.tsx`

```typescript
'use client';

import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshHomepage } from '@/app/(main)/actions';

export function RefreshCacheButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => refreshHomepage())}
      disabled={isPending}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      title="刷新数据"
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? '刷新中...' : '刷新'}
    </button>
  );
}
```

---

### Phase 4: 性能优化

#### 4.1 优化过滤逻辑

**文件:** `HomepageSearchMode.tsx` (新建)

**任务:**
- [ ] 使用 `Map` 预构建店铺索引
- [ ] 优化 tag 过滤逻辑
- [ ] 添加 `useMemo` 依赖优化

```typescript
// 使用 Map 优化 O(1) 查找
const storeMap = useMemo(
  () => new Map(stores.map(s => [s.id, s])),
  [stores]
);

const tagIdSet = useMemo(
  () => new Set(selectedTagIds),
  [selectedTagIds]
);
```

#### 4.2 类型安全增强

**新增文件:** `src/types/homepage.ts`

**任务:**
- [ ] 将 `HomeClient.tsx` 第 16-93 行的内联类型迁移到独立文件
- [ ] 确保类型与 `planService` 返回类型一致
- [ ] 更新所有相关文件的 import

---

## 文件变更清单

### 新增文件
| 文件                                                        | 描述                     |
| ----------------------------------------------------------- | ------------------------ |
| `src/app/(main)/actions.ts`                                 | Server Action (刷新缓存) |
| `src/app/(main)/HomepageExploreMode.tsx`                    | 探索模式组件             |
| `src/app/(main)/HomepageSearchMode.tsx`                     | 搜索模式组件             |
| `src/features/guest/discovery/components/FilterSidebar.tsx` | 独立筛选侧边栏           |
| `src/components/home/RefreshCacheButton.tsx`                | 刷新缓存按钮             |
| `src/types/homepage.ts`                                     | 首页类型定义             |

### 修改文件
| 文件                                                 | 变更                             |
| ---------------------------------------------------- | -------------------------------- |
| `src/server/services/plan.service.ts`                | 新增 `getHomepagePlans()`        |
| `src/server/services/__tests__/plan.service.test.ts` | 新增测试用例                     |
| `src/app/(main)/page.tsx`                            | 使用 Service 层，添加 revalidate |
| `src/app/(main)/HomeClient.tsx`                      | 重构为协调组件                   |
| `src/features/guest/discovery/index.ts`              | 导出 FilterSidebar               |

### 可能删除
| 文件                            | 条件                     |
| ------------------------------- | ------------------------ |
| `src/app/(main)/HomeClient.tsx` | 如果逻辑完全分散到子组件 |

---

## 验收标准

### 功能验收
- [ ] 首页正常渲染，所有套餐卡片显示正确
- [ ] 主题筛选正常工作
- [ ] 侧边栏筛选（地区、店铺、标签）正常工作
- [ ] 搜索模式和探索模式切换正常
- [ ] 刷新按钮可以更新缓存

### 性能验收
- [ ] TTFB < 100ms (当前 ~360ms)
- [ ] 数据传输 < 50KB (当前 ~128KB)
- [ ] 60 秒缓存生效 (验证 `Cache-Control` header)

### 代码质量
- [ ] 所有新代码通过 TypeScript 严格检查
- [ ] 新增测试覆盖 `planService.getHomepagePlans()`
- [ ] `pnpm build` 成功
- [ ] `pnpm test` 通过

---

## 验证步骤

```bash
# 1. 运行开发服务器
pnpm dev

# 2. 验证首页渲染
open http://localhost:3000

# 3. 验证缓存 header
curl -I http://localhost:3000 | grep -i cache

# 4. 运行测试
pnpm test --run

# 5. 生产构建
pnpm build
```

---

## 风险和注意事项

1. **缓存一致性**: 60 秒缓存可能导致数据短暂不一致，刷新按钮可手动更新
2. **组件拆分**: 确保状态正确传递，避免 props drilling
3. **类型迁移**: 确保所有类型引用更新正确
4. **测试覆盖**: 重点测试 `getHomepagePlans()` 的数据格式

---

## 预期成果

| 指标            | 改进前 | 改进后 | 提升  |
| --------------- | ------ | ------ | ----- |
| TTFB            | ~360ms | ~80ms  | 78% ↑ |
| 数据传输        | ~128KB | ~40KB  | 69% ↓ |
| JS Bundle       | ~100KB | ~40KB  | 60% ↓ |
| HomeClient 行数 | 694    | ~100   | 86% ↓ |
