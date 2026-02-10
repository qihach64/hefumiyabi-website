# 首页全面优化计划（架构 + 性能 + UI）

## Context

首页已完成第一轮优化（First Load JS 251→163KB, TTFB 360→8ms）。本次目标是在**架构、性能、UI** 三个维度做进一步精打细磨，提升用户体验和代码可维护性。

---

## Phase 1: 性能优化

### 1.1 延迟加载 allPlans（搜索模式按需加载）

**问题**: `page.tsx` 将 `allPlans`（全部套餐数据）序列化到客户端 props，但探索模式（默认模式）完全不使用它，只有搜索模式才需要。

**文件**: `src/app/(main)/page.tsx`, `src/app/(main)/HomeClient.tsx`

**方案**:
- `page.tsx` 不再传递 `allPlans` 到 HomeClient
- HomeClient 进入搜索模式时，通过 tRPC 或 fetch 按需加载 allPlans
- 探索模式首屏 props 体积大幅减少

### 1.2 降低搜索加载动画最小展示时间

**问题**: `minDisplayTime = 500ms` 导致快速搜索时也有明显等待感。

**文件**: `src/app/(main)/HomeClient.tsx:143`

**方案**: 降低到 `200ms`。

### 1.3 动态导入 toast（sonner）

**问题**: `PlanCard` 和 `FeaturedPlanCard` 都直接 `import { toast } from "sonner"`，sonner 被打包到首屏 JS 中，但用户不一定会触发 toast。

**文件**: `src/components/PlanCard/index.tsx`, `src/components/PlanCard/FeaturedPlanCard.tsx`

**方案**: 将 toast 调用改为动态导入：
```ts
const { toast } = await import("sonner");
toast.success("已加入购物车");
```

### 1.4 标签筛选改为 OR 逻辑

**问题**: 当前标签筛选使用 `every`（AND 逻辑），用户选多个标签时结果越来越少，不符合直觉。

**文件**: `src/app/(main)/HomeClient.tsx:208`

**方案**: `every` → `some`，选多个标签时结果是并集。

---

## Phase 2: UI 优化

### 2.1 Hero 高度改为 svh（修复移动端）

**问题**: `h-screen` 在移动端浏览器中不扣除地址栏高度，导致内容被遮挡。

**文件**: `src/components/home/HeroSection.tsx:70`

**方案**: `h-screen` → `h-svh`，在 Tailwind 4 中已支持。

### 2.2 ScrollableSection 断点修复

**问题**: 滚动按钮在 `md:flex`（768px）显示，但网格布局在 `lg:`（1024px）激活。768-1024px 区间滚动按钮显示但布局还是单行，行为不一致。

**文件**: `src/components/ScrollableSection.tsx:86`

**方案**: 滚动按钮改为 `hidden lg:flex`，与网格布局断点一致。

### 2.3 FeaturedPlanCard 宽度响应式优化

**问题**: 当前 `lg:w-[340px] xl:w-[380px]` 固定宽度，在不同屏幕上比例不够协调。

**文件**: `src/components/ScrollableSection.tsx:124`

**方案**: 改为 `lg:w-[320px] xl:w-[360px] 2xl:w-[400px]`，更多断点覆盖。

### 2.4 移除 HeroSection debug log

**问题**: `console.log` 遗留在生产代码中。

**文件**: `src/components/home/HeroSection.tsx:55`

**方案**: 删除 `console.log` 调用。

---

## Phase 3: 架构优化

### 3.1 提取 useCartToggle Hook

**问题**: `PlanCard` 和 `FeaturedPlanCard` 的购物车切换逻辑完全重复（~30 行）。

**文件**: `src/components/PlanCard/index.tsx:79-156`, `src/components/PlanCard/FeaturedPlanCard.tsx:69-101`

**方案**: 提取 `useCartToggle(plan)` hook 到 `src/components/PlanCard/useCartToggle.ts`：
```ts
export function useCartToggle(plan: { id: string; name: string; ... }) {
  // 返回: isInCart, isAdding, justChanged, lastAction, handleToggleCart
}
```
两个组件共享此 hook。

### 3.2 HorizontalScroller 滚动距离计算优化

**问题**: 单行模式用 `clientWidth * 0.85` 魔数，未考虑实际卡片宽度和 gap。

**文件**: `src/components/HorizontalScroller.tsx:82`

**方案**: 统一使用基于子元素宽度的计算（与网格模式相同的逻辑），滚动整数个卡片宽度。

---

## 关键文件清单

| 文件                                           | 改动                                          |
| ---------------------------------------------- | --------------------------------------------- |
| `src/app/(main)/page.tsx`                      | 移除 allPlans props                           |
| `src/app/(main)/HomeClient.tsx`                | 按需加载 allPlans, 降低动画时间, 标签 OR 逻辑 |
| `src/components/PlanCard/index.tsx`            | 动态导入 sonner, 使用 useCartToggle           |
| `src/components/PlanCard/FeaturedPlanCard.tsx` | 动态导入 sonner, 使用 useCartToggle           |
| `src/components/PlanCard/useCartToggle.ts`     | 新建：购物车切换 hook                         |
| `src/components/home/HeroSection.tsx`          | svh 高度, 移除 console.log                    |
| `src/components/ScrollableSection.tsx`         | 断点修复, 响应式宽度                          |
| `src/components/HorizontalScroller.tsx`        | 滚动距离计算优化                              |

---

## 验证方案

1. **构建验证**: `pnpm build` 无错误，First Load JS 不增加
2. **功能验证**:
   - 首页探索模式正常展示所有主题区块
   - 搜索模式切换后数据正确加载
   - 购物车添加/移除正常
   - 标签筛选使用 OR 逻辑
3. **UI 验证**:
   - 移动端 Hero 不被浏览器地址栏遮挡
   - 768-1024px 区间无异常滚动按钮
   - FeaturedPlanCard 在各断点下宽度协调
4. **测试**: `pnpm test --run` 所有测试通过
