# URL 状态管理规范

> 预防 nuqs 与 router.push() 混用导致的状态不同步问题

## 问题根因

在使用 `nuqs` 管理 URL 状态的组件中，混用 `router.push()` 会导致：
- nuqs 内部状态与实际 URL 不同步
- 组件不响应 URL 变化
- 筛选/主题切换不生效

## 核心原则

| 场景 | 使用方式 | 说明 |
|------|----------|------|
| 同页面状态更新 | `nuqs setters` | 筛选、排序、主题切换 |
| 跨页面导航 | `router.push()` | 从首页到列表页、登录后跳转 |
| 跨页面 + 带参数 | `router.push()` 构建完整 URL | 搜索框提交、表单完成 |

## 最佳实践

### 1. 同页面状态更新 - 使用 nuqs

```typescript
// 正确 - /plans 页面内切换主题
const { setTheme } = useSearchState();

const handleThemeChange = async (theme: Theme | null) => {
  await setTheme(theme?.slug || null);
  // nuqs 自动更新 URL，组件自动响应
};
```

### 2. 跨页面导航 - 使用 router.push()

```typescript
// 正确 - 从首页导航到列表页
const router = useRouter();

const handleSearch = () => {
  const params = new URLSearchParams();
  if (location) params.set('location', location);
  if (theme) params.set('theme', theme);
  router.push(`/plans?${params.toString()}`);
};
```

### 3. 混合场景 - 先 nuqs 后 router

当需要「更新状态 + 跨页面导航」时：

```typescript
// 正确 - 在非 /plans 页面选择主题
const handleThemeChange = async (theme: Theme | null) => {
  const newSlug = theme?.slug || null;

  if (pathname === '/plans') {
    // 同页面：只用 nuqs
    await setUrlTheme(newSlug);
  } else {
    // 跨页面：直接用 router.push 构建完整 URL
    router.push(newSlug ? `/plans?theme=${newSlug}` : '/plans');
  }
};
```

**注意**：不要在同一操作中同时调用 `setUrlTheme()` 和 `router.push()`，这会导致竞态条件。

### 4. 危险模式 - 必须避免

```typescript
// 错误 - 混用导致状态不同步
const handleThemeChange = async (theme: Theme | null) => {
  await setUrlTheme(theme?.slug);  // nuqs 更新状态
  router.push(`/plans?theme=${theme?.slug}`);  // router 再次更新，可能覆盖
};

// 错误 - 在 nuqs 管理的页面用 router 更新同一参数
// 页面使用了 useSearchState() 监听 theme
const handleClick = () => {
  router.push('/plans?theme=traditional');  // nuqs 状态不会更新！
};
```

## 代码审查检查点

### PR Review Checklist

- [ ] 组件是否使用了 `useSearchState()`？
- [ ] 如果是，检查是否有 `router.push()` 修改 nuqs 管理的参数
- [ ] 跨页面导航是否构建了完整的目标 URL？
- [ ] 同页面状态更新是否只用了 nuqs setters？

### ESLint 规则建议

```javascript
// .eslintrc.js - 自定义规则提示
{
  rules: {
    // 在使用 useSearchState 的文件中警告 router.push
    // (需要自定义 ESLint 插件或使用注释标记)
  }
}
```

### 代码注释标记

在使用 nuqs 的组件顶部添加注释：

```typescript
/**
 * URL 状态由 nuqs (useSearchState) 管理
 *
 * - 同页面状态更新：使用 setTheme, setLocation 等
 * - 跨页面导航：使用 router.push() 构建完整 URL
 * - 禁止：router.push() 修改 nuqs 管理的参数后又在同页面监听
 */
```

## 组件分类

### 使用 nuqs 管理状态的组件

| 组件 | 位置 | 管理的参数 |
|------|------|-----------|
| PlansClient | `src/app/(main)/plans/(list)/` | 全部筛选参数 |
| HomeClient | `src/app/(main)/` | theme, storeId, region |
| ClientThemePills | `src/features/guest/discovery/` | theme |
| SortSelector | `src/features/guest/discovery/` | sort |
| CategoryFilter | `src/features/guest/discovery/` | category |

### 跨页面导航组件

| 组件 | 位置 | 用途 |
|------|------|-----|
| HeroSearchBar | `src/features/guest/discovery/` | 首页搜索 → /plans |
| HeroSearchPanel | `src/components/home/` | 首页搜索 → /plans |
| HeaderSearchBar | `src/components/layout/` | 全局搜索 → /plans |
| MobileSearchBar | `src/components/layout/` | 移动端搜索 → /plans |

## 测试策略

### 单元测试：nuqs setter 行为

```typescript
// src/features/guest/discovery/components/__tests__/ClientThemePills.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientThemePills } from '../ClientThemePills';

// Mock nuqs
vi.mock('nuqs', () => ({
  useQueryState: vi.fn(() => [null, vi.fn()]),
  parseAsString: { withDefault: vi.fn() },
}));

describe('ClientThemePills', () => {
  it('should call setTheme when theme is selected', async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useQueryState).mockReturnValue(['', mockSetTheme]);

    render(<ClientThemePills serverThemes={mockThemes} />);

    fireEvent.click(screen.getByText('传统'));

    expect(mockSetTheme).toHaveBeenCalledWith('traditional');
  });

  it('should NOT call router.push when on /plans page', async () => {
    // 验证在 /plans 页面只用 nuqs，不用 router
  });
});
```

### 集成测试：主题切换即时生效

```typescript
// src/features/guest/discovery/components/__tests__/ThemeSwitch.integration.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

describe('主题切换集成测试', () => {
  it('切换主题后 URL 立即更新', async () => {
    const { container } = render(
      <NuqsTestingAdapter searchParams="?theme=">
        <ClientThemePills serverThemes={mockThemes} />
      </NuqsTestingAdapter>
    );

    // 点击「传统」主题
    fireEvent.click(screen.getByText('传统'));

    // 验证 URL 参数更新
    await waitFor(() => {
      expect(window.location.search).toContain('theme=traditional');
    });
  });

  it('切换主题后列表数据刷新', async () => {
    // 验证 PlansClient 响应 theme 变化
  });
});
```

### E2E 测试思路 (Playwright)

```typescript
// e2e/theme-filter.spec.ts
test('主题筛选即时生效', async ({ page }) => {
  await page.goto('/plans');

  // 点击主题
  await page.click('[data-testid="theme-traditional"]');

  // 验证 URL 更新
  await expect(page).toHaveURL(/theme=traditional/);

  // 验证列表更新（检查加载状态或数据变化）
  await expect(page.locator('[data-testid="plan-card"]')).toHaveCount(greaterThan(0));
});
```

## 快速参考

```
同页面更新状态？
  └─ 是 → 使用 nuqs setter (setTheme, setLocation...)
  └─ 否 → 跨页面导航？
           └─ 是 → 使用 router.push() 构建完整 URL
           └─ 否 → 检查场景，可能不需要 URL 更新
```

## 相关文件

- `src/shared/hooks/useSearchState.ts` - nuqs hook 封装
- `src/app/(main)/plans/(list)/PlansClient.tsx` - 典型使用示例
- `src/features/guest/discovery/components/ClientThemePills.tsx` - 主题选择器
