# 套餐详情页数据库查询优化 Brainstorm

> 日期: 2026-01-24
> 状态: 设计完成，待实施
> 前置文档: 2026-01-23-plan-detail-performance-brainstorm.md

## 背景

在 2026-01-23 的 brainstorm 后，大部分优化（ISR 60s 缓存、Service 层统一、select 精简字段）已实施。但在本地开发环境测试时，发现骨架屏显示后仍需较长时间才能看到实际内容。

**根本原因**: 本地 dev 模式下 ISR 缓存不生效，每次刷新都会执行完整的数据库查询，加上远程 Supabase 的网络延迟，导致加载缓慢。

## 我们要解决什么问题

### 🔴 核心问题

| 问题 | 位置 | 影响 |
|------|------|------|
| **getPlanMapData 重复查询 plan** | `lib/kimono-map.ts:76-95` | 浪费 ~80ms，plan 已在 getDetailById 查过 |
| **查询无法完全并行** | `page.tsx:29-32` | relatedPlans 依赖 plan.theme.id，必须串行 |

### 当前数据流分析

```
page.tsx 当前数据流:
────────────────────────────────────────────────────
1. planService.getDetailById(id)     ~150ms  ← 获取 plan
   └─ 包含 planComponents、theme 等

2. Promise.all([
     getRelatedPlans(theme.id),      ~100ms  ← 依赖 step1 的 themeId
     getPlanMapData(id)              ~120ms  ← 问题: 内部又查了一次 plan!
   ])
────────────────────────────────────────────────────
总延迟: ~370ms (含重复查询)
```

## 为什么选择这个方案

### 关键洞察

1. **getDetailById 已经查询了 planComponents**
   - 当前查询包含 `planComponents: { ... merchantComponent: { include: template } }`
   - 这正是 mapData 需要的热点数据来源

2. **只需额外查一次 mapTemplate**
   - mapTemplate 只需要 `imageUrl`, `imageWidth`, `imageHeight`
   - 可以通过 `theme.mapTemplate` 一并获取

3. **relatedPlans 在页面底部，不着急**
   - 首屏需要的是 plan 详情 + mapData
   - relatedPlans 串行加载完全可以接受

### 决策: 合并 mapData 到 getDetailById

**优点:**
- 消除重复查询，减少一次数据库往返
- 利用已有数据（planComponents），无需重新查询
- 页面代码更简洁，单一数据源

**对比其他方案:**

| 方案 | 描述 | 不选原因 |
|------|------|----------|
| 创建 getPlanMapDataLite | 新方法，不查 plan 详情 | 仍需两次并行查询，不如直接合并 |
| 预取 themeId 三路并行 | 先查 themeId，再三路并行 | 过度优化，relatedPlans 不需要首屏 |
| 本地开发缓存 | 给 dev 模式加内存缓存 | 治标不治本，生产也会有首次访问 |

## 改进后架构

```
优化后数据流:
────────────────────────────────────────────────────
1. planService.getDetailById(id)     ~150ms
   └─ 返回 plan 详情 + mapData (一次查询搞定)

2. getRelatedPlans(plan.theme.id)    ~100ms
   └─ 串行执行，因为在页面底部不着急
────────────────────────────────────────────────────
总延迟: ~250ms (减少约 120ms，降低 32%)
```

## 实施细节

### 1. 扩展 PlanDetailData 类型

```typescript
// src/server/services/plan.service.ts 或 src/types/plan-detail.ts

export interface PlanDetailData {
  // ... 现有字段
  mapData: MapData | null;  // 新增
}
```

### 2. 修改 getDetailById 查询

```typescript
// 在 theme select 中添加 mapTemplate
theme: {
  select: {
    id: true,
    slug: true,
    name: true,
    mapTemplate: {  // 新增
      select: {
        imageUrl: true,
        imageWidth: true,
        imageHeight: true
      }
    }
  },
},
```

### 3. 构建 mapData

```typescript
// 在 getDetailById 返回前构建 mapData
const hotspots: HotspotData[] = plan.planComponents
  .filter((pc) => pc.hotmapX != null && pc.hotmapY != null)
  .map((pc, index) => {
    const mc = pc.merchantComponent;
    const tpl = mc.template;
    return {
      id: pc.id,
      x: pc.hotmapX!,
      y: pc.hotmapY!,
      labelPosition: (pc.hotmapLabelPosition || 'right') as 'left' | 'right' | 'top' | 'bottom',
      labelOffsetX: pc.hotmapLabelOffsetX,
      labelOffsetY: pc.hotmapLabelOffsetY,
      displayOrder: pc.hotmapOrder ?? index,
      component: {
        id: tpl.id,
        code: tpl.code,
        name: tpl.name,
        nameJa: tpl.nameJa,
        nameEn: tpl.nameEn,
        description: tpl.description,
        type: tpl.type,
        icon: tpl.icon,
        highlights: mc.highlights.length > 0 ? mc.highlights : tpl.defaultHighlights,
        images: mc.images.length > 0 ? mc.images : tpl.defaultImages,
        isBaseComponent: true,
        outfitCategory: tpl.outfitCategory,
      },
      isIncluded: true,
    };
  });

const mapData: MapData | null = plan.theme?.mapTemplate ? {
  imageUrl: plan.theme.mapTemplate.imageUrl,
  imageWidth: plan.theme.mapTemplate.imageWidth,
  imageHeight: plan.theme.mapTemplate.imageHeight,
  hotspots,
} : null;

return {
  ...planData,
  mapData,
};
```

### 4. 简化 page.tsx

```typescript
// src/app/(main)/plans/[id]/page.tsx

export default async function PlanDetailPage({ params, searchParams }) {
  const { id } = await params;
  const { store: storeId } = await searchParams;

  const plan = await planService.getDetailById(id, storeId);

  if (!plan) {
    notFound();
  }

  // relatedPlans 串行获取 (页面底部，不着急)
  const relatedPlans = await planService.getRelatedPlans(plan.theme.id, id);

  return (
    <PlanDetailClient
      plan={plan}
      relatedPlans={relatedPlans}
      mapData={plan.mapData}  // 从 plan 中获取
    />
  );
}
```

## 性能预期

| 指标 | 改进前 | 改进后 | 提升 |
|------|--------|--------|------|
| 数据库往返次数 | 3 次 | 2 次 | 33% ↓ |
| 总延迟 (估计) | ~370ms | ~250ms | 32% ↓ |
| plan 重复查询 | 有 | 无 | 消除 |

## 未来优化方向 (不在本次范围)

1. **relatedPlans 懒加载**: 用 Suspense 流式加载，首屏不阻塞
2. **组件拆分**: PlanDetailClient 仍有 367 行，可进一步拆分
3. **图片懒加载**: relatedPlans 的图片使用 Intersection Observer

## 文件变更清单

### 修改文件

- `src/server/services/plan.service.ts`
  - `PlanDetailData` 类型添加 `mapData` 字段
  - `getDetailById` 查询添加 `theme.mapTemplate`
  - `getDetailById` 返回值构建 `mapData`

- `src/app/(main)/plans/[id]/page.tsx`
  - 移除 `getPlanMapData` 调用
  - 使用 `plan.mapData`

### 可能删除

- `src/lib/kimono-map.ts` 中的 `getPlanMapData` 函数（如果没有其他地方使用）

## 下一步

运行 `/workflows:plan` 制定详细的实施步骤。
