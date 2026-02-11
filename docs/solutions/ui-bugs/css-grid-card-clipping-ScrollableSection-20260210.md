---
module: Homepage
date: 2026-02-10
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "Right-side cards clipped in horizontally scrollable CSS grid sections"
  - "4th column extends 16px beyond scroller visible area at 2xl breakpoint"
root_cause: config_error
resolution_type: code_fix
severity: medium
tags: [css-grid, overflow, horizontal-scroll, card-layout, tailwind]
---

# Troubleshooting: CSS Grid 卡片右侧被裁切

## Problem
在首页主题 Section（如"盛大礼遇"）中，两行网格横向滚动区域的第4列卡片右侧被截断约 16px，图片和内容显示不完整。

## Environment
- Module: Homepage / ScrollableSection 组件
- Framework: Next.js 15.5 + React 19 + Tailwind CSS 4
- Affected Component: `src/components/ScrollableSection.tsx`
- Date: 2026-02-10

## Symptoms
- 桌面端（2xl 断点，viewport 2048px）下，水平滚动区域最右侧可见卡片的图片被裁切
- 第4列卡片右边界（1785px）超出 scroller 可见区域（1769px），被截断 16px
- 只影响有 `featuredChild`（左侧大卡片）布局的 section

## What Didn't Work

**Attempted Solution 1:** 在 wrapper div 添加 `lg:pr-4`（16px padding-right）
- **Why it failed:** wrapper padding 缩窄了 scroller 可用宽度（从 1072px → 1056px），但 grid 列宽不变（260px），导致裁切反而从 16px 变成 32px，问题加剧

**Attempted Solution 2:** 在 HorizontalScroller 添加 `lg:!pr-4`（scroll padding）
- **Why it failed:** `padding-right` 在 `overflow-x: auto` 容器上只影响滚动到最末端时的尾部留白，不影响初始可见区域的裁切

## Solution

将 `gridAutoColumns` 从 `260px` 减小到 `250px`，使 4 列完整容纳在 scroller 可用宽度内。

**Code changes:**
```tsx
// Before (broken) - src/components/ScrollableSection.tsx:138
style={{
  gridAutoColumns: '260px', // 4×260 + 3×16 = 1088px > 1072px 可用宽度
} as React.CSSProperties}

// After (fixed):
style={{
  gridAutoColumns: '250px', // 4×250 + 3×16 = 1048px < 1072px 可用宽度
} as React.CSSProperties}
```

同时移除了无效的 wrapper `lg:pr-4`（保持 `<div className="flex-1 min-w-0">`）。

## Why This Works

1. **根本原因：** `gridAutoColumns` 固定列宽 260px，在 2xl 断点下 scroller 可用宽度约 1072px（container 1536px - padding 32px - featured card 400px - gap 32px），4 列 + 3 个 gap = 1088px，超出 16px
2. **解决方案：** 缩小列宽到 250px，4×250 + 3×16 = 1048px，完整容纳在 1072px 内，留有 24px 余量
3. **底层问题：** CSS Grid 的 `grid-auto-columns` 是固定值，不会自适应容器宽度。当 N×列宽 + (N-1)×gap 超过容器宽度时，溢出部分被 `overflow: hidden/auto` 裁切

## Prevention

- 设置 `gridAutoColumns` 时，始终计算：**N × columnWidth + (N-1) × gap <= 可用宽度**
- 在不同断点下验证：featured card 宽度变化（lg:320px / xl:360px / 2xl:400px）会改变 scroller 可用宽度
- 各断点可用宽度速查：
  - lg (1024px): 992 - 320 - 32 = 640px → 2 列 @ 250px
  - xl (1280px): 1248 - 360 - 32 = 856px → 3 列 @ 250px
  - 2xl (1536px): 1504 - 400 - 32 = 1072px → 4 列 @ 250px
- `padding-right` 在 `overflow-x: auto` 容器上的行为：只在滚动到末端时显示，不影响初始可见区域

## Related Issues

No related issues documented yet.
