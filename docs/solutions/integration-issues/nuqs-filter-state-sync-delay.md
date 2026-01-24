---
title: Theme Pill 选择后不加载对应套餐
slug: nuqs-filter-state-sync-delay
category: integration-issues
component: PlansClient.tsx
symptoms:
  - 点击 theme pill 后套餐列表不更新
  - URL 更新但数据未刷新
  - pendingTheme 状态与 URL 不同步
root_cause: 混用 router.push() 和 nuqs 状态管理导致 URL 与组件状态不同步
solved_date: 2026-01-23
tags:
  - nuqs
  - url-state
  - next-router
  - async-state
  - state-management
---

# Theme Pill 选择后套餐列表不更新

## Problem

在 `/plans` 页面，当用户点击 theme pill（主题标签）选择某个主题后，套餐列表不会立即更新显示对应主题的套餐。用户需要刷新页面才能看到正确的筛选结果。

**复现步骤：**
1. 访问 `/plans` 页面
2. 点击任意 theme pill（如"传统"、"现代"等）
3. 观察套餐列表 - 列表未更新，仍显示所有套餐

**预期行为：** 点击 theme pill 后，套餐列表应立即筛选显示对应主题的套餐。

## Root Cause

问题出在 `PlansClient.tsx` 的 `handleThemeChange` 函数实现上：

```typescript
// 文件: src/app/(main)/plans/(list)/PlansClient.tsx

const handleThemeChange = async (theme: Theme | null) => {
  setPendingTheme(theme);
  await clearFilters();

  // ❌ 问题1：使用 router.push 手动构建 URL
  // 这绕过了 nuqs 的状态同步机制
  const params = new URLSearchParams();
  if (theme) params.set("theme", theme.slug);
  router.push(queryString ? `/plans?${queryString}` : "/plans", { scroll: false });

  // ❌ 问题2：立即重置 pendingTheme
  // 但 router.push 是异步的，URL 更新还未完成
  setPendingTheme(undefined);
};
```

**根本原因：**

1. **绕过 nuqs 状态管理**：代码使用 `router.push()` 手动构建和推送 URL，而不是使用 nuqs 提供的 `setUrlTheme()` 函数。这导致 nuqs 的内部状态与 URL 不同步。

2. **过滤逻辑依赖 nuqs 状态**：套餐列表的过滤逻辑依赖 `urlThemeSlug`（来自 nuqs）：
   ```typescript
   if (urlThemeSlug) {
     const themeId = themes.find((t) => t.slug === urlThemeSlug)?.id;
     result = result.filter((plan) => plan.themeId === themeId);
   }
   ```

3. **状态不一致**：`router.push()` 更新了浏览器 URL，但 nuqs 的 `urlThemeSlug` 状态未更新，导致过滤条件未生效。

4. **时序问题**：`setPendingTheme(undefined)` 在 `router.push()` 之后立即执行，但 URL 更新是异步的。

**时序图解：**

```
用户点击 theme pill
  ↓
setPendingTheme(theme)     ← UI 显示新主题图标
  ↓
await clearFilters()       ← 清除筛选
  ↓
router.push(...)           ← 异步更新 URL（还没完成）
  ↓
setPendingTheme(undefined) ← 立即重置
  ↓
filteredAndSortedPlans     ← 使用旧的 urlThemeSlug，过滤结果不变！
  ↓
... 一段时间后 ...
  ↓
URL 更新完成              ← urlThemeSlug 才真正更新
```

## Solution

使用 nuqs 的 `setUrlTheme()` 替代 `router.push()`，确保状态同步：

```typescript
const handleThemeChange = async (theme: Theme | null) => {
  setPendingTheme(theme);

  // ✅ 使用 Promise.all 并行执行清除筛选和设置主题
  // 使用 nuqs 的 setUrlTheme 而不是 router.push
  await Promise.all([
    clearFilters(),
    setUrlTheme(theme?.slug ?? null),
  ]);

  // ✅ 等待 nuqs 状态更新完成后再重置 pendingTheme
  setPendingTheme(undefined);
};
```

**完整的修改对比：**

```diff
const handleThemeChange = async (theme: Theme | null) => {
  setPendingTheme(theme);
- await clearFilters();
-
- const params = new URLSearchParams();
- if (theme) params.set("theme", theme.slug);
- router.push(queryString ? `/plans?${queryString}` : "/plans", { scroll: false });
+
+ await Promise.all([
+   clearFilters(),
+   setUrlTheme(theme?.slug ?? null),
+ ]);

  setPendingTheme(undefined);
};
```

## Why This Works

### 1. nuqs 状态同步机制

nuqs 是一个 URL 状态管理库，它维护了 React 状态与 URL 查询参数之间的双向同步。当调用 `setUrlTheme()` 时：

```
setUrlTheme('traditional')
    ↓
nuqs 更新内部 React 状态 (urlThemeSlug = 'traditional')
    ↓
nuqs 同步更新浏览器 URL (?theme=traditional)
    ↓
React 组件重新渲染，过滤逻辑使用新的 urlThemeSlug
    ↓
套餐列表显示正确的筛选结果
```

### 2. 避免状态不一致

使用 `router.push()` 只更新了 URL，但没有通知 nuqs：

```
router.push('/plans?theme=traditional')
    ↓
浏览器 URL 更新
    ↓
nuqs 状态 (urlThemeSlug) 仍为旧值
    ↓
过滤逻辑使用旧的 urlThemeSlug
    ↓
套餐列表未更新 ❌
```

### 3. Promise.all 确保原子性

```typescript
await Promise.all([
  clearFilters(),      // 清除其他筛选条件
  setUrlTheme(theme?.slug ?? null),  // 设置主题
]);
```

- 并行执行两个操作，提高性能
- `await` 确保两个操作都完成后再继续
- 避免中间状态导致的闪烁或不一致

## Prevention

### 代码规范

| 场景 | 使用方式 |
|------|----------|
| 同页面状态更新（筛选、排序、主题） | `nuqs setters`（setTheme, setLocation...） |
| 跨页面导航 | `router.push()` 构建完整 URL |
| 禁止 | 在同一操作中同时调用两者 |

### 审查检查点

- [ ] 组件是否使用了 `useSearchState()`？
- [ ] 如果是，检查是否有 `router.push()` 修改 nuqs 管理的参数
- [ ] 同页面状态更新是否只用了 nuqs setters？

### 危险模式

```typescript
// ❌ 错误：混用两种方式
await setUrlTheme(theme);
router.push(`/plans?theme=${theme}`);  // 可能覆盖 nuqs 状态

// ❌ 错误：绕过 nuqs 直接操作 URL
router.push(`/plans?theme=${theme}`);  // nuqs 不知道状态变了

// ✅ 正确：统一使用 nuqs
await setUrlTheme(theme?.slug ?? null);
```

## Testing

验证主题切换即时生效的测试思路：

```typescript
// 单元测试：验证 setter 被调用
it('should call setTheme when theme is selected', async () => {
  const mockSetTheme = vi.fn();
  // ... mock useSearchState
  fireEvent.click(screen.getByText('传统'));
  expect(mockSetTheme).toHaveBeenCalledWith('traditional');
});

// 集成测试：验证 URL 更新
it('切换主题后 URL 立即更新', async () => {
  render(<ClientThemePills />, { wrapper: NuqsTestingAdapter });
  fireEvent.click(screen.getByText('传统'));
  await waitFor(() => {
    expect(window.location.search).toContain('theme=traditional');
  });
});
```

## Related Documentation

- [首页架构重构 Brainstorm](../brainstorms/2026-01-23-homepage-architecture-refactor-brainstorm.md)
- [/plans 页面优化 Brainstorm](../brainstorms/2026-01-23-plans-page-optimization-brainstorm.md)
- [/plans 页面性能验证](../performance/2026-01-23-plans-page-validation.md)
- [架构重构计划](../plans/2026-01-10-architecture-refactor.md) - 第 5 章状态管理

## Key Takeaway

当使用 URL 状态管理库（如 nuqs）时，必须通过其提供的 API 更新状态，而不是直接操作 URL。直接使用 `router.push()` 会绕过状态管理机制，导致 React 状态与 URL 不同步。
