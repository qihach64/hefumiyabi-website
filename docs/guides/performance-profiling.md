# 性能诊断工具

本文档介绍开发环境专用的全链路性能诊断工具，用于分析套餐详情页等页面的性能瓶颈。

## 工具概览

| 层级 | 工具 | 输出 |
|------|------|------|
| 数据库 | Prisma Query 日志 | SQL 语句 + 耗时 |
| 服务端 | Server Timing | 方法级计时 |
| 页面 | Page Timing | 页面渲染总耗时 |
| 客户端 | Lighthouse | Core Web Vitals |

## 使用方法

### 1. 启动开发服务器

```bash
pnpm dev
```

### 2. 访问目标页面

访问 `/plans/[id]` 页面，终端会自动输出性能日志：

```
prisma:query SELECT "RentalPlan".* FROM "RentalPlan" WHERE "id" = $1 -- 45ms
prisma:query SELECT "PlanComponent".* FROM "PlanComponent" WHERE "planId" = $1 -- 23ms
[planService.getDetailById] ⏱️ Total: 180ms
  ├─ DB Query: 150ms
  └─ Transform: 30ms
[PlanDetailPage] ⏱️ Total: 245ms
```

### 3. 日志解读

- **prisma:query**: Prisma 自动输出的 SQL 日志，包含实际执行的 SQL 和耗时
- **planService.getDetailById**: Service 层计时
  - DB Query: 数据库查询耗时（包含所有 include/select 的嵌套查询）
  - Transform: 数据转换耗时（从 Prisma 返回格式转为客户端格式）
- **PlanDetailPage**: 页面组件总耗时（包含 Service 调用 + 其他逻辑）

## Lighthouse 分析

使用 Lighthouse CLI 进行客户端性能分析：

```bash
# 基础分析
npx lighthouse http://localhost:3000/plans/[id] --view

# 生成 JSON 报告
npx lighthouse http://localhost:3000/plans/[id] --output=json --output-path=./lighthouse-report.json

# 只分析 Performance 指标
npx lighthouse http://localhost:3000/plans/[id] --only-categories=performance --view

# 模拟移动设备
npx lighthouse http://localhost:3000/plans/[id] --preset=desktop --view
```

### 关键指标

| 指标 | 目标 | 说明 |
|------|------|------|
| LCP | < 2.5s | 最大内容绘制 |
| FID | < 100ms | 首次输入延迟 |
| CLS | < 0.1 | 累积布局偏移 |
| TTFB | < 800ms | 首字节时间 |

## 配置说明

### Prisma Query 日志

配置位置：`src/lib/prisma.ts`

```typescript
log: process.env.NODE_ENV === "development"
  ? ["query", "error", "warn"]  // 开发环境启用 query 日志
  : ["error"],                   // 生产环境只记录错误
```

### Service 层计时

配置位置：`src/server/services/plan.service.ts`

在需要分析的方法中添加计时逻辑：

```typescript
async someMethod(): Promise<SomeType> {
  const startTime = performance.now();
  const queryStart = performance.now();

  const data = await prisma.xxx.findUnique({ ... });
  const queryTime = performance.now() - queryStart;

  // ... 数据处理逻辑 ...

  if (process.env.NODE_ENV === 'development') {
    const totalTime = performance.now() - startTime;
    console.log(`[serviceName.methodName] ⏱️ Total: ${totalTime.toFixed(1)}ms`);
    console.log(`  ├─ DB Query: ${queryTime.toFixed(1)}ms`);
    console.log(`  └─ Transform: ${(totalTime - queryTime).toFixed(1)}ms`);
  }

  return result;
}
```

### 页面层计时

配置位置：页面组件文件 (如 `src/app/(main)/plans/[id]/page.tsx`)

```typescript
export default async function SomePage({ params }) {
  const pageStart = performance.now();

  // ... 页面逻辑 ...

  if (process.env.NODE_ENV === 'development') {
    console.log(`[PageName] ⏱️ Total: ${(performance.now() - pageStart).toFixed(1)}ms`);
  }

  return <Component />;
}
```

## 性能优化检查清单

### 数据库层
- [ ] 使用 `select` 而非 `include` 精简返回字段
- [ ] 避免 N+1 查询（使用 `Promise.all` 并行）
- [ ] 添加必要的数据库索引
- [ ] 考虑查询缓存

### 服务端层
- [ ] 减少不必要的数据转换
- [ ] 使用流式处理大数据集
- [ ] 启用 ISR/SSG 静态缓存

### 客户端层
- [ ] 图片优化（WebP、懒加载、尺寸适配）
- [ ] JavaScript 代码分割
- [ ] 首屏内容优先加载

## 生产环境

这些日志工具仅在开发环境 (`NODE_ENV === 'development'`) 启用。

生产环境性能监控建议：
- Vercel Analytics（自动集成 Core Web Vitals）
- Sentry Performance Monitoring
- 自建 APM 方案（如 Prometheus + Grafana）
