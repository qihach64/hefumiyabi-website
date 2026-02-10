---
date: 2026-01-25
topic: performance-profiling-tools
---

# 套餐详情页性能瓶颈检测方案

## What We're Building

为套餐详情页 (`/plans/[id]`) 建立一套开发环境专用的性能诊断工具链，覆盖全链路：

1. **服务端计时** - Server Component 渲染各阶段耗时
2. **数据库分析** - Prisma 查询日志，定位慢查询和 N+1
3. **前端指标** - Lighthouse CLI 生成完整报告

## Why This Approach

### 背景

刚完成了 mapData 查询合并优化（3→2 DB 往返），但实际感知不明显。需要准确的数据来：
- 确认优化是否生效
- 找出真正的瓶颈在哪里
- 为后续优化提供基准

### 为什么选择组合方案

| 单一工具的局限 | 组合方案的优势 |
|---------------|---------------|
| Lighthouse 只看前端指标 | 全链路覆盖 |
| Prisma 日志只看 DB | 可以定位是 DB 还是渲染慢 |
| Console Timing 需要手动埋点 | 结合自动化日志 |

### 为什么是开发环境专用

- 零生产影响
- 不需要集成外部服务（Sentry/Datadog）
- 快速迭代，验证优化效果

## Key Decisions

- **Console Timing**：在 `planService.getDetailById` 和页面组件中添加 `console.time/timeEnd`
- **Prisma 日志**：开发环境开启 `query` 级别日志
- **Lighthouse**：用 CLI 跑，不需要集成到 CI
- **输出方式**：终端日志为主，保持简单

## Open Questions

- 是否需要把计时结果写入文件持久化？（目前认为不需要）
- 是否需要 Server-Timing header？（本次不做，后续可加）

## 实施要点

### 1. Console Timing 结构

```
[PlanDetail] ⏱️ Total: 245ms
  ├─ getDetailById: 180ms
  │   ├─ DB Query: 150ms
  │   └─ Transform: 30ms
  └─ getRelatedPlans: 65ms
```

### 2. Prisma 日志配置

```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]  // 添加 "query"
    : ["error"],
});
```

### 3. Lighthouse CLI 用法

```bash
# 跑完整报告
npx lighthouse http://localhost:3000/plans/[id] --view

# 只看性能分数
npx lighthouse http://localhost:3000/plans/[id] --only-categories=performance
```

## Next Steps

→ `/workflows:plan` 制定具体实施计划
