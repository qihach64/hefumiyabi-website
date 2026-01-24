# 首页性能验证结果

> 测量时间: 2026-01-23
> 对比基线: `2026-01-23-baseline.md`
> 环境: 生产构建 (pnpm build && pnpm start)

## 改进摘要

| 指标 | 改进前 | 改进后 | 改进幅度 |
|------|--------|--------|----------|
| TTFB | ~360ms | ~8ms | **98%** |
| 缓存状态 | no-cache | ISR (60s) | 生效 |
| 构建类型 | ƒ (动态) | ○ (静态) | 可缓存 |
| 页面状态 | 200 | 200 | 正常 |

## 缓存 Header 验证

```http
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
Cache-Control: s-maxage=60, stale-while-revalidate=31535940
Content-Length: 192295
```

## TTFB 测量 (5次)

```
Run 1: TTFB=0.010213s (10.2ms)
Run 2: TTFB=0.022372s (22.4ms)
Run 3: TTFB=0.004017s (4.0ms)
Run 4: TTFB=0.003453s (3.5ms)
Run 5: TTFB=0.003777s (3.8ms)

平均: ~8.7ms
最快: 3.5ms
最慢: 22.4ms
```

## 实施的改动

### 1. 移除 searchParams 依赖

**文件:** `src/app/(main)/page.tsx`

```diff
- export default async function HomePage({
-   searchParams,
- }: {
-   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
- }) {
-   const params = await searchParams;
-   const searchLocation = typeof params.location === 'string' ? params.location : undefined;
-
-   const homepageData = await planService.getHomepagePlans({
-     limitPerTheme: 8,
-     searchLocation,
-   });
+ export default async function HomePage() {
+   const homepageData = await planService.getHomepagePlans({
+     limitPerTheme: 8,
+   });
```

**原因:** Next.js 15 中使用 `searchParams` 会使页面变为动态，覆盖 `revalidate` 设置。

### 2. 添加 Suspense 边界

```tsx
import { Suspense } from "react";

// 加载骨架屏
function HomeSkeleton() { ... }

export default async function HomePage() {
  const homepageData = await planService.getHomepagePlans({ ... });

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeClient {...homepageData} />
    </Suspense>
  );
}
```

**原因:** `HomeClient` 使用 `useSearchParams()`，SSG 预渲染时需要 Suspense 边界。

### 3. 客户端筛选

筛选逻辑已完全移至 `HomeClient.tsx`：
- 使用 `useSearchState()` hook 读取 URL 参数
- 使用 `useMemo` 在客户端过滤 `allPlans`
- 服务端只获取完整数据，不做预过滤

## 构建输出对比

### 改进前
```
┌ ƒ /                                       10.9 kB         251 kB
```
`ƒ` = 动态渲染，每次请求都执行服务端逻辑

### 改进后
```
┌ ○ /                                       10.9 kB         251 kB
```
`○` = 静态预渲染 + ISR，缓存 60 秒

## 验证命令

```bash
# 构建并启动
pnpm build && pnpm start

# 验证缓存 Header
curl -I http://localhost:3000 | grep -i cache

# 测量 TTFB
curl -o /dev/null -s -w "TTFB: %{time_starttransfer}s\n" http://localhost:3000
```

## 后续优化建议

1. **图片优化** - 使用 next/image 自动优化，减少 17MB 总负载
2. **RSC Payload** - 精简传输数据，目前 192KB
3. **CDN 部署** - 生产环境使用 Vercel 边缘缓存进一步降低 TTFB
