# 首页 Lighthouse 性能优化

**日期:** 2026-01-24
**状态:** 分析完成，待实施

## 问题概述

首页 Lighthouse 性能得分 **41/100**，是整个应用中性能最差的页面。

## Lighthouse 测试结果

| 指标 | 当前值 | 目标值 | 状态 |
|------|--------|--------|------|
| Performance Score | 41 | 90+ | 差 |
| FCP (首次内容绘制) | 6.3s | <1.8s | 差 |
| LCP (最大内容绘制) | 异常高* | <2.5s | 差 |
| TBT (总阻塞时间) | 560ms | <200ms | 差 |
| CLS (布局偏移) | 0.012 | <0.1 | 好 |

*LCP 异常可能因本地测试环境，但 Hero 图片加载确实是瓶颈

## 已识别的性能瓶颈

### 1. CSS 渲染阻塞 (高优先级)

**问题:** 4 个 CSS 文件阻塞渲染，累计约 2.7s

| 文件 | 阻塞时间 | 未使用字节 |
|------|----------|------------|
| 2ba94efdb0d8c319.css | 2705ms | 159KB |
| 307f97b206b53846.css | 2255ms | 129KB |
| 1004cffe2598d267.css | 1805ms | 97KB |
| 3b98a268a7a90113.css | 755ms | - |

**根因:** Tailwind CSS 4 生成了大量未使用的样式代码 (~385KB 未使用)

**优化方案:**
- 检查 Tailwind 的 `content` 配置，确保只扫描必要文件
- 考虑按路由拆分 CSS
- 启用 CSS 压缩和 tree-shaking

### 2. JS Bundle 过大 (高优先级)

**问题:** 首页 First Load JS 为 **251KB**，是应用中最大的页面

| 组成 | 大小 |
|------|------|
| 共享 bundle | 102KB |
| 首页特有 | ~149KB |

**主要依赖:**
- `framer-motion`: ~50KB (Hero 动画)
- 大型 Client Component 边界

**根因分析:**
- `HomeClient.tsx` 是一个巨大的 Client Component
- 所有首页组件都标记为 `"use client"`
- framer-motion 仅用于简单的 Hero 动画

**优化方案:**
1. **激进方案:** 用 CSS 动画替代 framer-motion (-50KB)
2. **渐进方案:**
   - 动态导入 `HomepageSearchMode` (仅搜索时加载)
   - 拆分 Client Component 边界，纯展示组件改 Server Component
   - 使用 `next/dynamic` 延迟加载 framer-motion

### 3. LCP - Hero 图片加载慢 (中优先级)

**问题:** LCP 元素是 Hero 背景图

```html
<img src="/_next/image?url=https://i0.wp.com/www.touristjapan.com/..." />
```

**根因:**
- 图片托管在外部域名 (touristjapan.com)
- 需要经过 Next.js Image Optimization 代理
- 没有使用 `placeholder="blur"`

**优化方案:**
- 将 Hero 图片迁移到 CDN (CloudFront/S3)
- 添加 `placeholder="blur"` + `blurDataURL`
- 预连接外部域名: `<link rel="preconnect" href="..." />`

### 4. 未使用的 JavaScript (低优先级)

两个 chunk 有约 48KB 未使用代码:
- `5350-*.js`: 24KB 未使用
- `6229-*.js`: 24KB 未使用

需要进一步分析这些 chunk 包含什么模块。

## 架构问题

当前首页组件结构:

```
page.tsx (Server Component)
└── HomeClient.tsx (Client Component - 巨大边界)
    ├── HomepageExploreMode (Client)
    │   ├── HeroSection (Client - framer-motion)
    │   ├── ScrollableSection (Client)
    │   └── FeaturedPlanCard (Client)
    └── HomepageSearchMode (Client)
        ├── FilterSidebar (Client)
        └── MobileFilterDrawer (Client)
```

**问题:** 整个首页被一个大的 Client Component 包裹，导致:
- 所有子组件都被打包到客户端 bundle
- 无法利用 Server Component 的 streaming
- 组件代码无法 tree-shake

**理想结构:**
```
page.tsx (Server Component)
├── HeroSection (Server Component + 小型 Client 动画)
├── ThemeSection (Server Component)
│   └── PlanCard (Server Component + 小型 Client 交互)
└── SearchMode (动态导入的 Client Component)
```

## 优化优先级

| 优先级 | 优化项 | 预期收益 | 工作量 |
|--------|--------|----------|--------|
| P0 | 拆分 Client Component 边界 | -100KB bundle | 中 |
| P0 | 优化 Tailwind CSS 配置 | -385KB CSS | 小 |
| P1 | 替换/延迟加载 framer-motion | -50KB bundle | 中 |
| P1 | Hero 图片迁移到 CDN | LCP -2s | 小 |
| P2 | 动态导入 SearchMode | -50KB 首屏 | 小 |
| P2 | 添加图片 blur placeholder | 更好的感知性能 | 小 |

## 下一步

运行 `/workflows:plan` 创建详细实施计划。

## 相关文件

- `src/app/(main)/page.tsx` - 首页入口
- `src/app/(main)/HomeClient.tsx` - 客户端主组件
- `src/components/home/HeroSection.tsx` - Hero 区域
- `src/app/globals.css` - 全局样式
- `tailwind.config.ts` - Tailwind 配置
- `next.config.ts` - Next.js 配置
