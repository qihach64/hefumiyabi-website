# 首页 Bundle 性能优化计划

> 基于 `ANALYZE=true pnpm build` 分析结果，2026-02-09

## 现状

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 首页 First Load JS | **163 KB** | **< 140 KB** |
| Page JS | 12.9 KB | - |
| Shared by all | 102 KB | 不可减少 (React + Next.js 运行时) |
| 路由组专属 | ~48 KB | **< 25 KB** |

### 首页 Bundle 构成

```
163 KB (First Load JS)
├── 102 KB  Shared by all (不可优化)
│   ├── 54.2 KB  React + ReactDOM
│   ├── 46 KB    Next.js App Router 运行时
│   └── 1.94 KB  webpack runtime
└── ~61 KB  首页专属
    ├── ~52 KB  (main)/layout chunk
    │   ├── Header.tsx (274行)
    │   ├── HeaderSearchBar.tsx (835行) ← 最大
    │   ├── MobileSearchBar.tsx (425行)
    │   ├── Footer.tsx (92行)
    │   ├── UserMenu.tsx (next-auth/react)
    │   ├── SearchBarContext + SearchLoadingContext
    │   └── nuqs (useSearchState)
    └── ~31 KB  (main)/page chunk
        ├── HomeClient.tsx
        ├── HomepageExploreMode.tsx
        ├── HeroSection.tsx + HeroSearchPanel.tsx
        ├── PlanCard + FeaturedPlanCard (含 sonner, zustand cart)
        └── ScrollableSection.tsx
```

### 已完成的优化 (无需再动)

- ✅ framer-motion (151 KB) 已隔离到 AITryOnSection，首页不加载
- ✅ HomepageSearchMode 已 `dynamic()` 懒加载
- ✅ tRPC + React Query (76 KB) 未在首页加载
- ✅ Virtual TryOn + 地图 (104 KB) 未在首页加载

---

## 优化方案

### 方案 1: HeaderSearchBar 拆分 (预估 -15~20 KB)

**问题:** HeaderSearchBar (835行) 包含完整的日历面板、地点下拉、主题选择器，在每个页面都通过 layout 加载，但用户不一定会展开搜索栏。

**文件:** `src/components/layout/HeaderSearchBar.tsx`

**做法:**
1. 将展开后的搜索面板内容 (日历、地点选择器、主题下拉) 拆分为独立组件
2. 用 `dynamic()` + `ssr: false` 懒加载，只在用户点击搜索栏时加载
3. HeaderSearchBar 本体只保留收起状态的搜索栏 UI

```tsx
// 优化前
import { Calendar, LocationDropdown, ThemeSelector } from './SearchPanelContent';

// 优化后
const SearchPanelContent = dynamic(
  () => import('./SearchPanelContent'),
  { ssr: false, loading: () => <SearchPanelSkeleton /> }
);
```

**风险:** 低。展开时有短暂加载延迟，用骨架屏缓解。

---

### 方案 2: sonner (toast) 延迟加载 (预估 -5~8 KB)

**问题:** PlanCard 和 FeaturedPlanCard 引入了 `sonner` 的 `toast()`，sonner 源码 64KB。首页探索模式下用户看到卡片但不一定点击加购。

**文件:**
- `src/components/PlanCard/index.tsx`
- `src/components/PlanCard/FeaturedPlanCard.tsx`

**做法:**
用动态 import 替代顶层 import：

```tsx
// 优化前
import { toast } from "sonner";

const handleAddToCart = () => {
  // ...
  toast.success("已加入购物车");
};

// 优化后
const handleAddToCart = async () => {
  // ...
  const { toast } = await import("sonner");
  toast.success("已加入购物车");
};
```

**风险:** 极低。toast 只在用户操作后触发，动态 import 几乎无感。

---

### 方案 3: next-auth useSession 条件加载 (预估 -3~5 KB)

**问题:** Header.tsx 顶层引入 `useSession()`，每个页面都加载 next-auth/react 客户端代码。

**文件:** `src/components/layout/Header.tsx`

**做法:**
将依赖 session 的部分 (UserMenu, HeaderActions) 包裹在 `Suspense` + `dynamic()` 中：

```tsx
// 优化前 (Header.tsx)
import { useSession } from "next-auth/react";
import UserMenu from "./UserMenu";

export default function Header() {
  const { data: session } = useSession();
  return (
    <header>
      {/* ... */}
      {session ? <UserMenu /> : <LoginButton />}
    </header>
  );
}

// 优化后
const AuthSection = dynamic(() => import("./AuthSection"), { ssr: false });

export default function Header() {
  return (
    <header>
      {/* ... */}
      <Suspense fallback={<AuthSkeleton />}>
        <AuthSection />
      </Suspense>
    </header>
  );
}
```

**风险:** 低。登录状态区域会有短暂闪烁，用骨架屏或占位符缓解。

---

### 方案 4: HeroSearchPanel 直接引入替代 barrel export (预估 -2~5 KB)

**问题:** `HeroSearchPanel.tsx` 从 `@/features/guest/discovery` barrel 引入 3 个组件，barrel 还导出了 `SearchFilterSidebar`、`MobileFilterDrawer` 等不需要的组件。虽然 webpack tree-shaking 应该处理，但 barrel export 有时会阻碍 tree-shaking。

**文件:** `src/components/home/HeroSearchPanel.tsx`

**做法:**
```tsx
// 优化前
import { useLocationDropdown, DateDropdown, useDateDropdown } from "@/features/guest/discovery";

// 优化后 - 直接引入具体文件
import { useLocationDropdown } from "@/features/guest/discovery/components/LocationDropdown";
import { DateDropdown, useDateDropdown } from "@/features/guest/discovery/components/DateDropdown";
```

**风险:** 无。纯路径替换，无行为变化。

---

## 执行优先级

| 优先级 | 方案 | 预估收益 | 难度 | 风险 |
|--------|------|----------|------|------|
| ⭐ P0 | 方案 2: sonner 延迟 | -5~8 KB | 低 | 极低 |
| ⭐ P0 | 方案 4: barrel 直接引入 | -2~5 KB | 低 | 无 |
| ⭐ P1 | 方案 1: HeaderSearchBar 拆分 | -15~20 KB | 中 | 低 |
| P2 | 方案 3: next-auth 条件加载 | -3~5 KB | 低 | 低 |

**建议执行顺序:** 4 → 2 → 1 → 3

先做简单无风险的 (方案 4、2)，再做需要组件拆分的 (方案 1)。

## 预期结果

全部完成后: **163 KB → ~135~145 KB** (减少 ~15~20%)

## 验证方法

```bash
# 优化前后对比
ANALYZE=true pnpm build 2>&1 | grep "^┌\|^├\|^└\|First Load"
```
