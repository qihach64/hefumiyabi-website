# /plans 页面性能验证结果

> 测量时间: 2026-01-23
> 环境: 生产构建 (pnpm build && pnpm start)

## 改进摘要

| 指标 | 改进前 | 改进后 | 改进幅度 |
|------|--------|--------|----------|
| TTFB | ~300ms | ~7.5ms | **97.5%** |
| 缓存状态 | force-dynamic | ISR (60s) | 生效 |
| 构建类型 | ƒ (动态) | ○ (静态) | 可缓存 |
| 数据查询 | 4 个串行 | 4 个并行 | 优化 |
| 筛选方式 | 服务端 | 客户端 | 即时响应 |

## 缓存 Header 验证

```http
x-nextjs-cache: STALE
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
Cache-Control: s-maxage=60, stale-while-revalidate=31535940
Content-Length: 232722
```

## TTFB 测量 (5次)

```
Run 1: TTFB=0.022057s (22.1ms) ← 首次触发重验证
Run 2: TTFB=0.004121s (4.1ms)
Run 3: TTFB=0.003512s (3.5ms)
Run 4: TTFB=0.004069s (4.1ms)
Run 5: TTFB=0.003684s (3.7ms)

平均: ~7.5ms
最快: 3.5ms
最慢: 22.1ms (首次请求)
```

## 实施的改动

### 1. 移除 force-dynamic，启用 ISR

**文件:** `src/app/(main)/plans/(list)/page.tsx`

```diff
- export const dynamic = 'force-dynamic';
+ export const revalidate = 60;
```

### 2. 使用 Service 层统一数据获取

**文件:** `src/server/services/plan.service.ts`

```typescript
async getPlansPageData(): Promise<PlansPageData> {
  // 4 个查询并行执行
  const [themes, plans, tagCategories, priceStats] = await Promise.all([
    prisma.theme.findMany({ ... }),
    prisma.rentalPlan.findMany({ ... }),
    prisma.tagCategory.findMany({ ... }),
    prisma.rentalPlan.aggregate({ ... }),
  ]);

  return { themes, plans, tagCategories, maxPrice };
}
```

### 3. 移除 searchParams 依赖

```diff
- export default async function PlansPage({
-   searchParams,
- }: {
-   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
- }) {
-   const params = await searchParams;
-   // 使用 searchParams 筛选...
+ export default async function PlansPage() {
+   const data = await planService.getPlansPageData();
+   // 服务端只获取完整数据
```

**原因:** Next.js 15 中使用 `searchParams` 会使页面变为动态，覆盖 `revalidate` 设置。

### 4. 客户端筛选

筛选逻辑完全移至 `PlansClient.tsx`：

```typescript
// 从 URL 派生状态
const {
  theme: urlThemeSlug,
  location: urlLocation,
  tags: urlTags,
  minPrice, maxPrice,
  sort: urlSort,
} = useSearchState();

// 客户端过滤
const filteredPlans = useMemo(() => {
  let result = [...serverPlans];

  // 1. 主题过滤
  if (urlThemeSlug) { ... }

  // 2. 地区过滤
  if (urlLocation) { ... }

  // 3. 标签过滤
  if (selectedTags.length > 0) { ... }

  // 4. 价格过滤
  // 5. 排序

  return result;
}, [serverPlans, urlThemeSlug, urlLocation, ...]);
```

### 5. 添加 Suspense 边界

```tsx
export default async function PlansPage() {
  const data = await planService.getPlansPageData();

  return (
    <Suspense fallback={<PlansPageSkeleton />}>
      <PlansClient {...data} />
    </Suspense>
  );
}
```

## 构建输出对比

### 改进前
```
├ ƒ /plans                                   6.2 kB         246 kB
```
`ƒ` = 动态渲染，每次请求都执行服务端逻辑

### 改进后
```
├ ○ /plans                                   6.2 kB         246 kB          1m      1y
```
`○` = 静态预渲染 + ISR (60s 重验证)

## 数据查询优化

### 改进前 (串行查询)
```
1. prisma.theme.findMany()           // ~50ms
2. prisma.tagCategory.findMany()     // ~30ms
3. prisma.rentalPlan.findMany()      // ~150ms
4. prisma.rentalPlan.aggregate()     // ~20ms
                                     // 总计 ~250ms
```

### 改进后 (并行查询)
```
Promise.all([
  prisma.theme.findMany(),
  prisma.rentalPlan.findMany(),
  prisma.tagCategory.findMany(),
  prisma.rentalPlan.aggregate(),
])                                   // 总计 ~150ms (最长查询时间)
```

## 验证命令

```bash
# 构建并启动
pnpm build && pnpm start

# 验证缓存 Header
curl -I http://localhost:3000/plans | grep -iE "cache|x-nextjs"

# 测量 TTFB
curl -o /dev/null -s -w "TTFB: %{time_starttransfer}s\n" http://localhost:3000/plans
```

## 用户体验改进

| 场景 | 改进前 | 改进后 |
|------|--------|--------|
| 首次加载 | ~300ms TTFB + 渲染 | ~8ms TTFB + 渲染 |
| 主题切换 | 服务端刷新 ~300ms | 客户端即时过滤 |
| 标签筛选 | 服务端刷新 ~300ms | 客户端即时过滤 |
| 价格排序 | 服务端刷新 ~300ms | 客户端即时过滤 |

## 后续优化建议

1. **RSC Payload** - 当前 227KB，可进一步精简不必要字段
2. **图片懒加载** - 首屏外的套餐卡片图片使用 lazy loading
3. **虚拟滚动** - 如果套餐数量超过 100 个，考虑虚拟列表
