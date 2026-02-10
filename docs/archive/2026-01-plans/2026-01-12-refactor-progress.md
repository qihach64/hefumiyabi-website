# Architecture Refactor Progress

> 最后更新: 2026-01-22

## 概览

| 阶段 | 状态 | 进度 |
|------|------|------|
| Week 1: Foundation | ✅ 完成 | 100% |
| Week 2: Feature Migration | ✅ 完成 | 100% |
| Week 3: Component Migration + Testing | ✅ 完成 | 100% |
| Phase 4: Page Architecture Optimization | ✅ 完成 | 100% |

**当前分支:** `refactor/architecture`

**备份分支:** `backup/pre-refactor-2026-01-11`

---

## Week 1: Foundation ✅

### 已完成任务

| Task | 描述 | Commit | 状态 |
|------|------|--------|------|
| 1.1 | 创建备份和工作分支 | - | ✅ |
| 1.2 | 创建 FSD 目录结构 | `b90689d` | ✅ |
| 1.3 | 安装 tRPC 依赖 | `0d5f85a` | ✅ |
| 1.4 | 创建 tRPC 服务端 | `2aa7a9d` | ✅ |
| 1.5 | 创建 tRPC Root Router | `2aa7a9d` | ✅ |
| 1.6 | 创建 tRPC API Route | `2aa7a9d` | ✅ |
| 1.7 | 创建 tRPC Client | `8269ab8` | ✅ |
| 1.8 | 集成 TRPCProvider 到 Layout | `8269ab8` | ✅ |
| 1.9 | 安装 nuqs | `40bd3d9` | ✅ |
| 1.10 | 创建 useSearchState Hook | `2111126` | ✅ |
| 1.11 | 配置 NuqsAdapter | `2111126` | ✅ |
| 1.12 | 创建 Plan Service | `a074f21` | ✅ |
| 1.13 | 创建 Plan Router | `a074f21` | ✅ |
| 1.14 | 遗留数据检查脚本 | `6eed075` | ✅ |
| 1.15 | Week 1 Milestone 验证 | - | ✅ |

### 代码审查修复

| 问题 | 修复 | Commit |
|------|------|--------|
| useSearchState 缺少 'use client' | 添加指令 | `f22c272` |
| plan.getById 无 NOT_FOUND 错误 | 添加 TRPCError | `f22c272` |
| planStores 过滤器覆盖问题 | 合并 storeId 和 location 过滤 | `f22c272` |

### 测试覆盖

| 文件 | 测试数 | Commit |
|------|--------|--------|
| plan.service.ts | 12 | `1054ebd` |
| plan.ts (router) | 6 | `1054ebd` |
| useSearchState.ts | 8 | `1054ebd` |
| **总计** | **26** | |

---

## 新增文件结构

```
src/
├── server/                          # Week 1 新增
│   ├── trpc/
│   │   ├── context.ts              # tRPC 上下文 (Prisma + Session)
│   │   ├── trpc.ts                 # tRPC 实例 + procedures
│   │   └── routers/
│   │       ├── index.ts            # Root router
│   │       ├── health.ts           # 健康检查
│   │       ├── plan.ts             # 套餐路由
│   │       └── __tests__/
│   │           └── plan.test.ts    # Router 测试
│   └── services/
│       ├── plan.service.ts         # 套餐业务逻辑
│       └── __tests__/
│           └── plan.service.test.ts # Service 测试
├── shared/                          # Week 1 新增
│   ├── api/
│   │   ├── trpc.ts                 # tRPC React client
│   │   ├── TRPCProvider.tsx        # React Query + tRPC provider
│   │   └── index.ts
│   └── hooks/
│       ├── useSearchState.ts       # URL 状态管理 (nuqs)
│       ├── index.ts
│       └── __tests__/
│           └── useSearchState.test.ts # Hook 测试
├── features/                        # Week 1 创建 (空)
│   ├── guest/
│   ├── merchant/
│   └── platform/
├── config/                          # Week 1 创建 (空)
├── test/
│   └── prisma-mock.ts              # Prisma 测试 mock
└── app/
    ├── api/trpc/[trpc]/route.ts    # tRPC HTTP handler
    └── layout.tsx                   # 已修改: 添加 NuqsAdapter + TRPCProvider
```

---

## 遗留数据发现

运行 `scripts/check-legacy-data.ts` 结果:

| 表/字段 | 记录数 | 处理方案 |
|---------|--------|----------|
| CampaignPlan | 8 | Week 3 迁移到 RentalPlan |
| Listing | 0 | 安全删除 |
| CartItem.campaignPlanId | 0 | 安全移除字段 |
| BookingItem.campaignPlanId | 1 | 需迁移后移除 |

---

## 技术决策

### 已确认

1. **Feature-Sliced Design (FSD)** - 按业务模块组织代码
2. **tRPC + REST 混合** - tRPC 用于前端，REST 用于外部 API
3. **nuqs** - URL 状态管理替代 React Context
4. **Zustand** - 客户端持久化状态 (购物车)
5. **AI 集成**:
   - AI 试穿: 源码内联 (TypeScript)
   - AI 客服: REST + OpenAPI 类型生成 (Python 独立)

### 测试策略

- **单元测试**: Vitest + vitest mocks
- **React 测试**: @testing-library/react + happy-dom
- **测试位置**: `__tests__/` 目录在对应模块旁边

---

## Week 2: Feature Migration ✅

### 已完成任务

| Task | 描述 | Commit | 状态 |
|------|------|--------|------|
| 2.1 | 创建 discovery 特性目录结构 | `fe7bc81` | ✅ |
| 2.2 | 迁移 ClientThemePills | `4cb6793` | ✅ |
| 2.3 | 迁移 ThemeImageSelector | `4cb6793` | ✅ |
| 2.4 | 迁移 LocationDropdown | `4cb6793` | ✅ |
| 2.5 | 迁移 DateDropdown | `4cb6793` | ✅ |
| 2.6 | 迁移 GuestsDropdown | `4cb6793` | ✅ |
| 2.7 | 迁移 SearchFilterSidebar | `ede4ba3` | ✅ |
| 2.8 | 迁移 CategoryFilter | `ede4ba3` | ✅ |
| 2.9 | 迁移 SortSelector | `ede4ba3` | ✅ |
| 2.10 | 迁移 HeroSearchBar (nuqs) | `b53bfce` | ✅ |
| 2.11 | 创建 usePlanList hook | `a7436d5` | ✅ |
| 2.12 | 创建 usePlanDetail hook | `a7436d5` | ✅ |
| 2.13 | 更新 HeaderSearchBar (nuqs) | `9e1c3e5` | ✅ |
| 2.14 | 更新 MobileSearchBar (nuqs) | `9e1c3e5` | ✅ |
| 2.15 | 更新 HeroSearchPanel (nuqs) | `9e1c3e5` | ✅ |
| 2.16 | 移除 SearchStateProvider | `5d66a83` | ✅ |
| 2.17 | 删除 SearchStateContext | `e4fd9c0` | ✅ |
| 2.18 | 创建 plans 特性模块 | `e77319b` | ✅ |
| 2.19 | 创建 booking 特性模块 | `e4fd9c0` | ✅ |
| 2.20 | Week 2 Milestone 验证 | - | ✅ |

### 技术决策

| 决策 | 说明 |
|------|------|
| SearchLoadingContext 保留 | 仅用于 HomeClient loading 状态，非关键 |
| 组件 Re-export 模式 | 特性模块 re-export 原始组件，避免大规模文件移动 |
| Local State + Sync | 布局组件使用本地状态 + useEffect 同步 URL 状态 |

### 迁移文件结构

```
src/features/guest/
├── discovery/
│   ├── components/
│   │   ├── ClientThemePills.tsx
│   │   ├── ThemeImageSelector.tsx
│   │   ├── ThemeDropdown.tsx
│   │   ├── LocationDropdown.tsx
│   │   ├── DateDropdown.tsx
│   │   ├── GuestsDropdown.tsx
│   │   ├── HeroSearchBar.tsx
│   │   ├── SearchFilterSidebar.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── SortSelector.tsx
│   │   ├── MobileFilterDrawer.tsx
│   │   ├── StoreFilter.tsx
│   │   └── index.ts
│   └── index.ts
├── plans/
│   ├── components/
│   │   └── index.ts (re-exports)
│   ├── hooks/
│   │   ├── usePlanList.ts
│   │   ├── usePlanDetail.ts
│   │   └── index.ts
│   └── index.ts
└── booking/
    ├── components/
    │   └── index.ts (re-exports)
    └── index.ts
```

### 删除文件

- `src/contexts/SearchStateContext.tsx` - 已被 nuqs useSearchState 替代
- `src/components/HeroSearchBar.tsx` - 迁移到 features/guest/discovery
- `src/components/ClientThemePills.tsx` - 迁移到 features/guest/discovery

---

## Phase 4: Page Architecture Optimization ✅

> 完成日期: 2026-01-22

### 已完成任务

| Task | 描述 | 状态 |
|------|------|------|
| 4.1 | 更新 HomeClient.tsx 导入路径 | ✅ |
| 4.2 | 更新 PlansClient.tsx 导入路径 | ✅ |
| 4.3 | 更新 SearchClient.tsx 导入路径 | ✅ |
| 4.4 | 更新 HeroSearchPanel.tsx 导入路径 | ✅ |
| 4.5 | 更新 RelatedPlans.tsx 导入路径 | ✅ |
| 4.6 | 更新 merchants/[id]/page.tsx 导入路径 | ✅ |
| 4.7 | 删除 components/ 中重复组件 (10个) | ✅ |
| 4.8 | 删除旧版 HeaderClient.tsx | ✅ |
| 4.9 | 实现 AITryOnSection 动态导入 | ✅ |
| 4.10 | 构建验证 | ✅ |
| 4.11 | 测试验证 (362 tests passed) | ✅ |

### 删除的重复组件

```
src/components/
├── ThemeImageSelector.tsx      → features/guest/discovery
├── MobileFilterDrawer.tsx      → features/guest/discovery
├── CategoryFilter.tsx          → features/guest/discovery
├── GuestsDropdown.tsx          → features/guest/discovery
├── SortSelector.tsx            → features/guest/discovery
├── StoreFilter.tsx             → features/guest/discovery
├── ThemeDropdown.tsx           → features/guest/discovery
├── search/                     → 目录已删除
│   ├── SearchFilterSidebar.tsx → features/guest/discovery
│   ├── DateDropdown.tsx        → features/guest/discovery
│   └── LocationDropdown.tsx    → features/guest/discovery
└── layout/
    └── HeaderClient.tsx        → 已删除 (旧版)
```

### 性能优化

- **AITryOnSection 动态导入**: 使用 `next/dynamic` 延迟加载，减少首屏 JS 约 500KB

### 导入路径更新模式

```typescript
// 修改前
import PlanCard from "@/components/PlanCard";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import SearchFilterSidebar from "@/components/search/SearchFilterSidebar";

// 修改后
import { PlanCard } from "@/features/guest/plans";
import { MobileFilterDrawer, SearchFilterSidebar } from "@/features/guest/discovery";
```

---

## 下一步

### 待完成任务

1. **真实迁移 PlanCard** - 将 PlanCard 系列组件从 components/ 物理迁移到 features/guest/plans/
2. **AI 试穿服务迁移** - 迁移到 features 结构
3. **AI 客服集成** - REST + OpenAPI 类型生成
4. **CampaignPlan 数据迁移** - 8 条记录迁移到 RentalPlan

### 注意事项

- PlanCard 目前仍是 re-export 模式，可考虑物理迁移
- CampaignPlan 迁移需要更新 BookingItem 关联
- AI 客服可能需要独立部署 (Python)

---

## 命令参考

```bash
# 运行测试
pnpm test              # 监视模式
pnpm test:run          # 单次运行

# 检查遗留数据
pnpm tsx scripts/check-legacy-data.ts

# 开发服务器
pnpm dev

# 验证 tRPC
curl http://localhost:3000/api/trpc/health.check
curl "http://localhost:3000/api/trpc/plan.featured"
```

---

## Commit 历史 (refactor/architecture)

### Week 2 Commits
```
a7436d5 feat(plans): add usePlanList and usePlanDetail tRPC hooks
e4fd9c0 feat(booking): add booking feature module, remove deprecated SearchStateContext
e77319b feat(plans): create plans feature module with re-exports
5d66a83 feat(discovery): remove SearchStateProvider from main layout
508d0e7 feat(discovery): remove SearchStateContext from page components
9e1c3e5 feat(discovery): migrate layout components to nuqs-based state management
b53bfce feat(discovery): add HeroSearchBar and ThemeDropdown with nuqs integration
ede4ba3 feat(discovery): add filter components with nuqs integration
4cb6793 feat(discovery): migrate core search components to feature module
fe7bc81 feat(week2): complete Batch 1 - foundation setup
303e024 docs: add refactor progress tracking document
```

### Week 1 Commits
```
1054ebd test: add unit tests for Week 1 tRPC and service code
f22c272 fix: address code review feedback
6eed075 chore: add legacy data check script
a074f21 feat(plan): add plan service and tRPC router
2111126 feat(state): add useSearchState hook with nuqs, configure adapter
40bd3d9 deps: add nuqs for URL state management
8269ab8 feat(trpc): add React client and provider, integrate into layout
2aa7a9d feat(trpc): add server setup, routers, and API handler
0d5f85a deps: add tRPC packages
b90689d refactor(1.2): create FSD directory structure
```
