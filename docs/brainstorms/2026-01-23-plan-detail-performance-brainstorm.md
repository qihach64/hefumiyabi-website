# 套餐详情页性能优化 Brainstorm

> 日期: 2026-01-23
> 状态: 设计完成，待实施

## 背景

首页架构重构已完成设计，建立了 Service 层统一、60 秒缓存、组件拆分的模式。现在将同样的优化策略应用到套餐详情页 `/plans/[id]`。

## 我们要解决什么问题

### 🔴 严重问题

| 问题 | 位置 | 影响 |
|------|------|------|
| 无缓存配置 | `page.tsx` 无 revalidate | 每次访问都查数据库 |
| Service 层未被利用 | `page.tsx:23-91` 直接调 Prisma | 逻辑重复，难测试 |
| 相关套餐重复查询逻辑 | `page.tsx:197-271` | 无法复用于其他页面 |
| Store 3 层 fallback | `page.tsx:110-178` | N+1 查询 + 代码复杂 |

### 🟠 中等问题

| 问题 | 位置 |
|------|------|
| PlanDetailClient 过大 | 525 行单体组件 |
| planService.getById() 过度获取 | include: true 而非 select |
| 类型定义散落 | 13 个接口定义在组件内 |

## 为什么选择这个方案

### 关键决策

1. **60 秒缓存 + 手动刷新**: 与首页保持一致
   - 理由: 统一策略易于理解和维护

2. **分离 Service 方法**: 优化 `getById()` + 新增 `getRelatedPlans()`
   - 理由: 分离关注点，页面可并行调用，方法可独立复用
   - 对比统一方法: 更灵活，支持只获取详情不要相关套餐的场景

3. **完全拆分组件**: PlanDetailClient 拆成 5-6 个组件
   - 理由: 降低 JS Bundle，提升可维护性

4. **简化 Store Fallback**: Service 层统一处理
   - 理由: 去掉 3 层判断逻辑，消除 N+1

## 改进后架构

```
改进前:
┌──────────────────────────────────────────────┐
│ page.tsx (Server Component)                  │
│   └─ 直接调用 Prisma                         │
│   └─ 无缓存配置                              │
│   └─ 3 层 Store fallback (N+1)              │
│   └─ 相关套餐查询逻辑重复                    │
└──────────────────────────────────────────────┘
            │
            ▼ 传递大量 Props
┌──────────────────────────────────────────────┐
│ PlanDetailClient.tsx (525 行单体组件)         │
│   └─ 13 个接口定义                           │
│   └─ Header + Content + Sidebar + Footer    │
│   └─ Intersection Observer 混在一起          │
└──────────────────────────────────────────────┘

改进后:
┌──────────────────────────────────────────────┐
│ page.tsx (Server Component)                  │
│   └─ revalidate: 60                         │
│   └─ Promise.all([getById, getRelatedPlans])│
│   └─ Store 在 Service 层统一处理             │
└──────────────────────────────────────────────┘
            │
            ▼ 精简 Props
┌──────────────────────────────────────────────┐
│ 拆分后的 Client Components                    │
│                                              │
│ ├─ PlanDetailHeader.tsx (~100行)             │
│ │    └─ Breadcrumb + 基本信息                │
│ │                                            │
│ ├─ PlanDetailContent.tsx (~150行)            │
│ │    └─ VisualHub + Description + AITryOn   │
│ │                                            │
│ ├─ PlanDetailSidebar.tsx (~150行)            │
│ │    └─ Upgrades + Store + Timeline         │
│ │                                            │
│ ├─ BookingCard.tsx (~100行)                  │
│ │    └─ 预约卡片 (独立状态)                   │
│ │                                            │
│ ├─ MiniBookingBar.tsx (~50行)                │
│ │    └─ 移动端底部栏 (Intersection Observer) │
│ │                                            │
│ └─ RelatedPlans.tsx (~80行)                  │
│      └─ 相关套餐展示                          │
└──────────────────────────────────────────────┘
```

## Service 层设计

### 优化 getById()

```typescript
// 改进前: include: true 获取所有字段
async getById(id: string) {
  return prisma.rentalPlan.findUnique({
    where: { id },
    include: {
      theme: true,
      planStores: { include: { store: true } },
      // ... 过度获取
    },
  });
}

// 改进后: select 精选字段
interface PlanDetailData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  images: string[];
  duration: number;
  region?: string;
  highlights: string[];
  theme: { id: string; name: string };
  merchant: { businessName: string };
  defaultStore: StoreData | null;  // Service 层处理 fallback
  stores: StoreData[];
  components: ComponentData[];
  upgrades: UpgradeData[];
  tags: TagData[];
}

async getById(id: string, storeId?: string): Promise<PlanDetailData | null> {
  const plan = await prisma.rentalPlan.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      images: true,
      duration: true,
      region: true,
      highlights: true,
      theme: { select: { id: true, name: true } },
      merchant: { select: { businessName: true } },
      planStores: {
        include: { store: { select: { id: true, name: true, address: true, region: true } } }
      },
      planComponents: {
        select: {
          hotmapOrder: true,
          merchantComponent: {
            select: {
              customName: true,
              template: { select: { name: true, icon: true } }
            }
          }
        },
        orderBy: { hotmapOrder: 'asc' }
      },
      planUpgrades: {
        select: {
          merchantComponent: {
            select: { id: true, customName: true, price: true, images: true }
          }
        },
        orderBy: { displayOrder: 'asc' }
      },
      planTags: {
        include: { tag: { select: { id: true, name: true, icon: true, color: true } } }
      },
    },
  });

  if (!plan) return null;

  // Store fallback 在这里统一处理
  const stores = plan.planStores.map(ps => ps.store);
  const defaultStore = storeId
    ? stores.find(s => s.id === storeId) || stores[0]
    : stores[0] || null;

  return {
    ...plan,
    defaultStore,
    stores,
    components: plan.planComponents.map(pc => ({
      name: pc.merchantComponent.customName || pc.merchantComponent.template?.name,
      icon: pc.merchantComponent.template?.icon,
    })),
    upgrades: plan.planUpgrades.map(pu => ({
      id: pu.merchantComponent.id,
      name: pu.merchantComponent.customName,
      price: pu.merchantComponent.price,
      images: pu.merchantComponent.images,
    })),
    tags: plan.planTags.map(pt => pt.tag),
  };
}
```

### 新增 getRelatedPlans()

```typescript
interface RelatedPlanData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  region?: string;
  merchantName?: string;
  tags: { id: string; name: string }[];
}

async getRelatedPlans(
  themeId: string,
  excludeId: string,
  limit = 8
): Promise<RelatedPlanData[]> {
  const plans = await prisma.rentalPlan.findMany({
    where: {
      themeId,
      id: { not: excludeId },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      region: true,
      merchant: { select: { businessName: true } },
      planTags: {
        take: 3,
        include: { tag: { select: { id: true, name: true } } }
      },
    },
    take: limit,
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'desc' }],
  });

  return plans.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    region: p.region,
    merchantName: p.merchant?.businessName,
    tags: p.planTags.map(pt => pt.tag),
  }));
}
```

## 组件拆分设计

### 1. PlanDetailHeader.tsx (~100行)

```typescript
interface PlanDetailHeaderProps {
  breadcrumb: { theme: string; planName: string };
  merchantName: string;
  region?: string;
  tags: TagData[];
}
```

### 2. PlanDetailContent.tsx (~150行)

```typescript
interface PlanDetailContentProps {
  plan: {
    id: string;
    name: string;
    description: string;
    images: string[];
    components: ComponentData[];
  };
  showAITryOn: boolean;
}
```

### 3. PlanDetailSidebar.tsx (~150行)

```typescript
interface PlanDetailSidebarProps {
  upgrades: UpgradeData[];
  store: StoreData | null;
  stores: StoreData[];  // 店铺选择器
  duration: number;
}
```

### 4. BookingCard.tsx (~100行)

```typescript
interface BookingCardProps {
  planId: string;
  planName: string;
  price: number;
  originalPrice?: number;
  storeId: string;
  onUpgradeSelect: (upgrades: SelectedUpgrade[]) => void;
}
```

### 5. MiniBookingBar.tsx (~50行)

```typescript
// 使用 Intersection Observer 控制显示
interface MiniBookingBarProps {
  price: number;
  originalPrice?: number;
  onBook: () => void;
}
```

### 6. RelatedPlans.tsx (~80行)

```typescript
interface RelatedPlansProps {
  plans: RelatedPlanData[];
}
```

## 页面重构

```typescript
// src/app/(main)/plans/[id]/page.tsx

export const revalidate = 60;

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ storeId?: string }>;
}) {
  const { id } = await params;
  const { storeId } = await searchParams;

  // 并行获取数据
  const plan = await planService.getById(id, storeId);

  if (!plan) {
    notFound();
  }

  // 相关套餐可以并行获取
  const relatedPlans = await planService.getRelatedPlans(plan.theme.id, id);

  return (
    <>
      <PlanDetailHeader
        breadcrumb={{ theme: plan.theme.name, planName: plan.name }}
        merchantName={plan.merchant.businessName}
        region={plan.region}
        tags={plan.tags}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PlanDetailContent
            plan={plan}
            showAITryOn={true}
          />
        </div>

        <aside>
          <PlanDetailSidebar
            upgrades={plan.upgrades}
            store={plan.defaultStore}
            stores={plan.stores}
            duration={plan.duration}
          />

          <BookingCard
            planId={plan.id}
            planName={plan.name}
            price={plan.price}
            originalPrice={plan.originalPrice}
            storeId={plan.defaultStore?.id}
          />
        </aside>
      </div>

      <RelatedPlans plans={relatedPlans} />

      <MiniBookingBar
        price={plan.price}
        originalPrice={plan.originalPrice}
      />
    </>
  );
}
```

## 性能预期

| 指标 | 改进前 | 改进后 | 提升 |
|------|--------|--------|------|
| TTFB (缓存命中) | ~200ms | ~20ms | 90% ↑ |
| 数据传输量 | ~80KB | ~35KB | 56% ↓ |
| JS Bundle | ~80KB | ~45KB | 44% ↓ |
| Store 查询 | 最多 3 次 | 1 次 | 66% ↓ |

## 开放问题

1. **店铺切换交互**: 切换店铺时是否需要刷新整个页面？还是用 Client 端状态管理？
2. **RefreshCacheButton**: 详情页是否也需要手动刷新按钮？
3. **图片懒加载**: 相关套餐的图片是否需要懒加载？

## 文件变更清单

### 新增文件

- `src/components/plans/detail/PlanDetailHeader.tsx`
- `src/components/plans/detail/PlanDetailContent.tsx`
- `src/components/plans/detail/PlanDetailSidebar.tsx`
- `src/components/plans/detail/BookingCard.tsx`
- `src/components/plans/detail/MiniBookingBar.tsx`
- `src/components/plans/detail/RelatedPlans.tsx`
- `src/components/plans/detail/index.ts` (统一导出)
- `src/types/plan-detail.ts` (类型定义)

### 修改文件

- `src/app/(main)/plans/[id]/page.tsx` - 重构为使用 Service 层 + 60s 缓存
- `src/server/services/plan.service.ts` - 优化 getById + 新增 getRelatedPlans

### 可能删除

- `src/components/PlanDetailClient.tsx` - 逻辑分散到子组件后删除

## 下一步

运行 `/workflows:plan` 制定详细的实施计划。
