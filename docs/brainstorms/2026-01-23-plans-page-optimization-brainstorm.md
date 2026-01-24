# /plans 页面架构优化 Brainstorm

> 日期: 2026-01-23
> 状态: 设计完成
> 参考: `2026-01-23-homepage-architecture-refactor-brainstorm.md`

## 我们要解决什么问题

### 当前问题（与首页相同模式）

| 问题 | 位置 | 影响 |
|------|------|------|
| `force-dynamic` 禁用缓存 | `page.tsx:6` | 每次请求都查询数据库 |
| 4 个串行 Prisma 查询 | `page.tsx:36-161` | TTFB 增加 |
| 直接调用 Prisma | `page.tsx` | 未复用 service 层 |
| 555 行 Client Component | `PlansClient.tsx` | JS bundle 较大 |
| 数据过度获取 | `planComponents.template.*` | 获取 6 字段只用 1 个 |

### 当前数据查询

```typescript
// page.tsx 中的 4 个串行查询
1. prisma.theme.findMany()           // 主题列表
2. prisma.tagCategory.findMany()     // 标签分类
3. prisma.rentalPlan.findMany()      // 套餐列表 (深度嵌套)
4. prisma.rentalPlan.aggregate()     // 价格统计
```

## 选择的方案：完全复制首页模式

### 改进架构

```
改进前:
┌──────────────────────────────────────────────┐
│ page.tsx (Server Component)                  │
│   └─ force-dynamic (禁用缓存)                │
│   └─ 直接调用 Prisma (4个串行查询)            │
│   └─ 使用 searchParams (动态渲染)            │
└──────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ PlansClient.tsx (555 行单体组件)              │
│   └─ 筛选 + 排序 + 主题切换                   │
└──────────────────────────────────────────────┘

改进后:
┌──────────────────────────────────────────────┐
│ page.tsx (Server Component)                  │
│   └─ 调用 planService.getPlansPageData()     │
│   └─ revalidate: 60 (60秒缓存)               │
│   └─ Promise.all() 并行查询                  │
│   └─ 不使用 searchParams (客户端筛选)         │
│   └─ Suspense 包裹 Client Component          │
└──────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ PlansClient.tsx (保持现有结构)                │
│   └─ useSearchState() 读取 URL 参数          │
│   └─ 客户端筛选 (已有实现)                    │
└──────────────────────────────────────────────┘
```

## 关键改动

### 1. 新增 Service 方法

```typescript
// src/server/services/plan.service.ts

interface PlansPageData {
  themes: Theme[];
  plans: PlanCardData[];
  tagCategories: TagCategory[];
  maxPrice: number;
}

planService.getPlansPageData(): Promise<PlansPageData>
```

### 2. 修改 page.tsx

```typescript
// 改进前
export const dynamic = 'force-dynamic';

export default async function PlansPage({ searchParams }) {
  const params = await searchParams;
  // 使用 searchParams 做服务端预过滤
}

// 改进后
export const revalidate = 60;

export default async function PlansPage() {
  const data = await planService.getPlansPageData();

  return (
    <Suspense fallback={<PlansPageSkeleton />}>
      <PlansClient {...data} />
    </Suspense>
  );
}
```

### 3. 精简数据查询

```typescript
// 改进前: 获取过多字段
planComponents: {
  include: {
    merchantComponent: {
      select: {
        customName: true,
        template: {
          select: { id, code, name, type, icon, displayOrder }  // 6 字段
        }
      }
    }
  }
}

// 改进后: 只获取需要的字段
planComponents: {
  select: {
    merchantComponent: {
      select: {
        customName: true,
        template: { select: { name: true } }  // 只要 1 字段
      }
    }
  }
}
```

## 文件变更清单

### 修改文件
- `src/app/(main)/plans/(list)/page.tsx` - 移除 force-dynamic，使用 service 层，添加 Suspense
- `src/server/services/plan.service.ts` - 新增 getPlansPageData 方法
- `src/app/(main)/plans/(list)/PlansClient.tsx` - 移除服务端传入的初始状态，完全依赖 URL

### 不需要修改
- `PlansClient.tsx` 内部筛选逻辑 - 已经是客户端筛选，保持不变

## 预期改进

| 指标 | 改进前 | 改进后 | 提升 |
|------|--------|--------|------|
| 缓存 | force-dynamic | ISR 60s | 生效 |
| TTFB | ~300ms (估) | ~10ms | 97% |
| 构建类型 | ƒ (动态) | ○ (静态) | 可缓存 |

## 开放问题

1. **主题切换是否需要服务端查询？**
   - 当前：切换主题会触发 router.push，服务端重新查询
   - 建议：保持现有行为，因为不同主题可能有大量套餐，全部加载不现实

2. **是否需要骨架屏组件？**
   - 当前：PlansClient 内部已有 PlanCardSkeleton
   - 建议：复用现有骨架屏

## 下一步

运行 `/workflows:plan` 制定详细实施计划。
