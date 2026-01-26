---
module: Homepage
date: 2026-01-25
problem_type: performance_issue
component: frontend_stimulus
symptoms:
  - "First Load JS 251KB，目标 < 180KB"
  - "Lighthouse Performance 得分 41"
  - "framer-motion 被打包到首页，尽管未直接导入"
root_cause: config_error
resolution_type: code_fix
severity: high
tags: [barrel-export, bundle-size, framer-motion, nextjs, tree-shaking]
---

# Barrel Export 导致 Bundle 膨胀

## 问题描述

首页 Lighthouse 性能优化过程中，即使移除了 HeroSection 和 ScrollIndicator 中的 framer-motion 直接导入，First Load JS 仍为 252KB（目标 < 180KB）。

### 症状

- First Load JS: 251-252KB
- Lighthouse Performance Score: 41
- framer-motion (~50KB) 被打包到首页 bundle

## 调查过程

### 尝试 1: CSS 动画替代 framer-motion ❌

修改 `HeroSection.tsx` 和 `ScrollIndicator.tsx`，移除 framer-motion 导入，使用 CSS 动画替代。

**结果**: 构建后 bundle 大小未变化。

### 尝试 2: 动态导入 HomepageSearchMode ❌

使用 `next/dynamic` 动态导入搜索模式组件。

**结果**: bundle 大小仍为 252KB。

### 尝试 3: 检查导入链 ✅

检查 `HomepageExploreMode.tsx` 的导入：

```typescript
// 问题代码
import { PlanCard, FeaturedPlanCard } from "@/features/guest/plans";
```

发现 `@/features/guest/plans/components/index.ts` 的 barrel export：

```typescript
// 导出了包含 framer-motion 的组件！
export { default as AITryOnSection } from "@/components/plan/AITryOnSection";
```

## 根本原因

**Barrel export 副作用**：即使只导入 `PlanCard`，webpack 会分析整个 barrel 文件的依赖。由于 `AITryOnSection` 使用 framer-motion，整个 framer-motion 库被打包到首页 bundle。

```
HomepageExploreMode
  └── @/features/guest/plans (barrel)
        └── AITryOnSection
              └── framer-motion (~50KB) ← 被拉入首页！
```

## 解决方案

将 barrel import 改为直接路径导入，绕过包含重型依赖的 barrel：

```typescript
// ❌ 错误：使用 barrel export
import { PlanCard, FeaturedPlanCard } from "@/features/guest/plans";

// ✅ 正确：直接路径导入
import PlanCard from "@/components/PlanCard";
import FeaturedPlanCard from "@/components/PlanCard/FeaturedPlanCard";
```

### 修改文件

1. `src/app/(main)/HomepageExploreMode.tsx`
2. `src/app/(main)/HomepageSearchMode.tsx`

## 结果

| 指标          | 优化前 | 优化后 | 变化    |
| ------------- | ------ | ------ | ------- |
| First Load JS | 251 kB | 163 kB | -35%    |
| 目标达成      | ❌      | ✅      | < 180KB |

## 预防措施

### 1. Barrel Export 设计原则

**不要**在 barrel export 中包含重型依赖组件：

```typescript
// ❌ 避免：一个 barrel 混合轻量和重型组件
export { PlanCard } from "./PlanCard";           // 轻量
export { AITryOnSection } from "./AITryOnSection"; // 重型 (framer-motion)
```

**推荐**：按依赖权重分离 barrel：

```typescript
// @/features/guest/plans/components/index.ts - 轻量组件
export { PlanCard } from "./PlanCard";
export { FeaturedPlanCard } from "./FeaturedPlanCard";

// @/features/guest/plans/components/heavy.ts - 重型组件 (按需导入)
export { AITryOnSection } from "./AITryOnSection";
```

### 2. Bundle 分析

定期检查 bundle 组成：

```bash
# Next.js bundle analyzer
ANALYZE=true pnpm build
```

### 3. 代码审查检查项

- [ ] 新增 barrel export 时检查依赖大小
- [ ] 首页组件避免从混合 barrel 导入
- [ ] 重型组件使用动态导入

## 相关资源

- [Next.js Dynamic Imports](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
- [Barrel Files and Tree Shaking](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/)
