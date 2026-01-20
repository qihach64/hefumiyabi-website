# Documentation Cleanup & Agent-Friendly Restructure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure project documentation to be agent-friendly for Claude Code and easy for new developers to onboard.

**Architecture:** Two-layer documentation: CLAUDE.md (精简AI上下文, <500行) + docs/ (人类详细参考). 过时文档归档到 docs/archive/，不删除。

**Tech Stack:** Markdown, Git

---

## Phase 1: Directory Structure & Cleanup

### Task 1: Create New Directory Structure

**Files:**
- Create: `docs/archive/2024-11/.gitkeep`
- Create: `docs/guides/.gitkeep`
- Create: `docs/features/.gitkeep`
- Create: `docs/architecture/.gitkeep`
- Create: `docs/architecture/decisions/.gitkeep`

**Step 1: Create directories**

```bash
mkdir -p docs/archive/2024-11
mkdir -p docs/guides
mkdir -p docs/features
mkdir -p docs/architecture/decisions
touch docs/archive/2024-11/.gitkeep
touch docs/guides/.gitkeep
touch docs/features/.gitkeep
touch docs/architecture/.gitkeep
touch docs/architecture/decisions/.gitkeep
```

**Step 2: Commit**

```bash
git add docs/
git commit -m "docs: create new documentation structure"
```

---

### Task 2: Delete Duplicate Files

**Files:**
- Delete: `claude.md` (duplicate of CLAUDE.md)
- Delete: `CURSOR_PROXY_SETUP.md` (personal tool config)

**Step 1: Remove duplicates**

```bash
rm claude.md
rm CURSOR_PROXY_SETUP.md
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: remove duplicate and irrelevant files"
```

---

### Task 3: Archive Outdated Root Documents

**Files to move to `docs/archive/2024-11/`:**
- `CAMPAIGN_PLAN_REFACTOR_PROPOSAL.md`
- `REFACTOR_SUMMARY.md`
- `REFACTOR_QUICK_START.md`
- `QUICK_BOOK_FIX_SUMMARY.md`
- `QUICK_BOOK_UX_IMPROVEMENT.md`
- `DATABASE_IMPORT_SUCCESS.md`
- `SCRAPING_SUMMARY.md`
- `VERCEL-POOLER-FIX.md`
- `VERCEL-TROUBLESHOOTING.md`
- `AMAZON_STYLE_BUTTON_STRATEGY.md`
- `BUTTON_STRATEGY_ANALYSIS.md`
- `PRICE_COMPARISON_FEATURE.md`
- `BOOKING_FLOW_OPTIMIZATION.md`
- `IMPLEMENTATION_GUIDE.md`
- `PLAN_TAGS_FEATURE.md`
- `PLANS_PAGE_SIMPLIFICATION.md`
- `SIDEBAR_FILTER_DESIGN.md`
- `SOCIAL_MEDIA_MARKETING_STRATEGY.md`
- `EMAIL_VERIFICATION_SETUP.md`
- `RUN_TAG_SYSTEM.md`
- `收藏功能与购物车对比.md`

**Step 1: Move files to archive**

```bash
mv CAMPAIGN_PLAN_REFACTOR_PROPOSAL.md docs/archive/2024-11/
mv REFACTOR_SUMMARY.md docs/archive/2024-11/
mv REFACTOR_QUICK_START.md docs/archive/2024-11/
mv QUICK_BOOK_FIX_SUMMARY.md docs/archive/2024-11/
mv QUICK_BOOK_UX_IMPROVEMENT.md docs/archive/2024-11/
mv DATABASE_IMPORT_SUCCESS.md docs/archive/2024-11/
mv SCRAPING_SUMMARY.md docs/archive/2024-11/
mv VERCEL-POOLER-FIX.md docs/archive/2024-11/
mv VERCEL-TROUBLESHOOTING.md docs/archive/2024-11/
mv AMAZON_STYLE_BUTTON_STRATEGY.md docs/archive/2024-11/
mv BUTTON_STRATEGY_ANALYSIS.md docs/archive/2024-11/
mv PRICE_COMPARISON_FEATURE.md docs/archive/2024-11/
mv BOOKING_FLOW_OPTIMIZATION.md docs/archive/2024-11/
mv IMPLEMENTATION_GUIDE.md docs/archive/2024-11/
mv PLAN_TAGS_FEATURE.md docs/archive/2024-11/
mv PLANS_PAGE_SIMPLIFICATION.md docs/archive/2024-11/
mv SIDEBAR_FILTER_DESIGN.md docs/archive/2024-11/
mv SOCIAL_MEDIA_MARKETING_STRATEGY.md docs/archive/2024-11/
mv EMAIL_VERIFICATION_SETUP.md docs/archive/2024-11/
mv RUN_TAG_SYSTEM.md docs/archive/2024-11/
mv 收藏功能与购物车对比.md docs/archive/2024-11/
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: archive outdated root-level documents"
```

---

### Task 4: Archive Old Refactoring Docs

**Files:**
- Move: `docs/refactoring/*` → `docs/archive/2024-11/refactoring/`

**Step 1: Move refactoring folder**

```bash
mv docs/refactoring docs/archive/2024-11/refactoring
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: archive old refactoring documentation"
```

---

### Task 5: Archive Miscellaneous Docs

**Files to move to `docs/archive/2024-11/`:**
- `docs/SCRAPING_METHODS.md`
- `docs/TAG_SYSTEM_API_IMPLEMENTATION.md`
- `docs/TAG_SYSTEM_DEMO.md`
- `docs/CAMPAIGN_BANNER_USAGE.md`
- `docs/GALLERY_SOCIAL_FEATURES.md`
- `docs/card-layout-analysis.md`
- `docs/rakuraku-kimono-booking-analysis.md`
- `docs/merchant-plan-ownership-fix.md`
- `docs/migration-v10.1-component-system.md`
- `docs/performance-analysis-plan-b.md`

**Step 1: Move files**

```bash
mv docs/SCRAPING_METHODS.md docs/archive/2024-11/
mv docs/TAG_SYSTEM_API_IMPLEMENTATION.md docs/archive/2024-11/
mv docs/TAG_SYSTEM_DEMO.md docs/archive/2024-11/
mv docs/CAMPAIGN_BANNER_USAGE.md docs/archive/2024-11/
mv docs/GALLERY_SOCIAL_FEATURES.md docs/archive/2024-11/
mv docs/card-layout-analysis.md docs/archive/2024-11/
mv docs/rakuraku-kimono-booking-analysis.md docs/archive/2024-11/
mv docs/merchant-plan-ownership-fix.md docs/archive/2024-11/
mv docs/migration-v10.1-component-system.md docs/archive/2024-11/
mv docs/performance-analysis-plan-b.md docs/archive/2024-11/
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: archive miscellaneous outdated docs"
```

---

## Phase 2: Organize Active Documents

### Task 6: Move Setup Guides

**Files:**
- Move: `DATABASE_SETUP.md` → `docs/guides/database-setup.md`
- Move: `SUPABASE_SETUP.md` → `docs/guides/supabase-setup.md`
- Move: `DEPLOYMENT.md` → `docs/guides/deployment.md`
- Move: `docs/DATABASE_CONNECTION_GUIDE.md` → `docs/guides/database-connection.md`

**Step 1: Move files**

```bash
mv DATABASE_SETUP.md docs/guides/database-setup.md
mv SUPABASE_SETUP.md docs/guides/supabase-setup.md
mv DEPLOYMENT.md docs/guides/deployment.md
mv docs/DATABASE_CONNECTION_GUIDE.md docs/guides/database-connection.md
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: organize setup and deployment guides"
```

---

### Task 7: Move Architecture Documents

**Files:**
- Move: `ARCHITECTURE.md` → `docs/architecture/overview.md`
- Move: `DESIGN_SYSTEM.md` → `docs/architecture/design-system.md`
- Move: `UI_UX_DESIGN_GUIDE.md` → `docs/architecture/ui-ux-guide.md`
- Move: `产品设计哲学.md` → `docs/architecture/product-philosophy.md`
- Move: `PRODUCT_POSITIONING.md` → `docs/architecture/product-positioning.md`

**Step 1: Move files**

```bash
mv ARCHITECTURE.md docs/architecture/overview.md
mv DESIGN_SYSTEM.md docs/architecture/design-system.md
mv UI_UX_DESIGN_GUIDE.md docs/architecture/ui-ux-guide.md
mv 产品设计哲学.md docs/architecture/product-philosophy.md
mv PRODUCT_POSITIONING.md docs/architecture/product-positioning.md
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: organize architecture documentation"
```

---

### Task 8: Move Feature Documents

**Files:**
- Move: `BOOKING_FLOW.md` → `docs/features/booking-flow.md`
- Move: `docs/seamless-booking-flow.md` → `docs/features/seamless-booking.md`
- Move: `docs/booking-flow-analysis.md` → `docs/features/booking-analysis.md`
- Move: `docs/inventory-booking-system-design.md` → `docs/features/inventory-system.md`
- Move: `docs/rental-plan-redesign.md` → `docs/features/rental-plan.md`
- Move: `docs/plan-store-selector.md` → `docs/features/plan-store-selector.md`
- Move: `docs/tag-management-system.md` → `docs/features/tag-system.md`
- Move: `docs/plan-component-system.md` → `docs/features/plan-components.md`
- Move: `docs/套餐重构分析报告.md` → `docs/features/plan-refactor-analysis.md`
- Move: `docs/THEME_BASED_HOMEPAGE_PLAN.md` → `docs/features/theme-homepage.md`
- Move: `docs/HOMEPAGE_PLATFORM_REDESIGN.md` → `docs/features/homepage-redesign.md`

**Step 1: Move files**

```bash
mv BOOKING_FLOW.md docs/features/booking-flow.md
mv docs/seamless-booking-flow.md docs/features/seamless-booking.md
mv docs/booking-flow-analysis.md docs/features/booking-analysis.md
mv docs/inventory-booking-system-design.md docs/features/inventory-system.md
mv docs/rental-plan-redesign.md docs/features/rental-plan.md
mv docs/plan-store-selector.md docs/features/plan-store-selector.md
mv docs/tag-management-system.md docs/features/tag-system.md
mv docs/plan-component-system.md docs/features/plan-components.md
mv docs/套餐重构分析报告.md docs/features/plan-refactor-analysis.md
mv docs/THEME_BASED_HOMEPAGE_PLAN.md docs/features/theme-homepage.md
mv docs/HOMEPAGE_PLATFORM_REDESIGN.md docs/features/homepage-redesign.md
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: organize feature documentation"
```

---

### Task 9: Move Design Documents

**Files:**
- Move: `docs/design/interactive-kimono-map.md` → `docs/features/interactive-map.md`
- Move: `service-hotmap-design.md` → `docs/features/service-hotmap.md` (暂时保留，后续合并更新)
- Move: `PLAN_DETAIL_PAGE_DESIGN.md` → `docs/features/plan-detail-design.md` (暂时保留，后续合并更新)

**Step 1: Move files**

```bash
mv docs/design/interactive-kimono-map.md docs/features/interactive-map.md
mv service-hotmap-design.md docs/features/service-hotmap.md
mv PLAN_DETAIL_PAGE_DESIGN.md docs/features/plan-detail-design.md
rmdir docs/design 2>/dev/null || true
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: move design documents to features"
```

---

### Task 10: Archive Remaining Root Documents

**Files to move to `docs/archive/2024-11/`:**
- `PLAN.md`
- `refactor-strategy.md`

**Step 1: Move remaining files**

```bash
mv PLAN.md docs/archive/2024-11/
mv refactor-strategy.md docs/archive/2024-11/
```

**Step 2: Verify root is clean**

```bash
ls *.md
# Should only show: CLAUDE.md, README.md
```

**Step 3: Commit**

```bash
git add -A
git commit -m "docs: archive remaining root-level documents"
```

---

## Phase 3: CLAUDE.md Optimization

### Task 11: Backup Current CLAUDE.md

**Files:**
- Copy: `CLAUDE.md` → `docs/archive/2024-11/CLAUDE.md.backup`

**Step 1: Backup**

```bash
cp CLAUDE.md docs/archive/2024-11/CLAUDE.md.backup
```

**Step 2: Commit**

```bash
git add docs/archive/2024-11/CLAUDE.md.backup
git commit -m "docs: backup CLAUDE.md before optimization"
```

---

### Task 12: Rewrite CLAUDE.md (Part 1 - Header & Tech Stack)

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Read current file and understand structure**

Read the current CLAUDE.md to understand what sections exist.

**Step 2: Write new optimized header**

Replace the beginning of CLAUDE.md with:

```markdown
# CLAUDE.md

> AI 工作上下文 - 精简版。详细文档见 `docs/`

## 项目概述

**江戸和装工房雅** - 和服租赁电商平台 (Next.js 15 + Prisma + PostgreSQL)

**核心功能:** 套餐浏览 → 加购物车 → 预约 → 到店体验

## Tech Stack

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15.5 (App Router), React 19, TypeScript 5 |
| 数据库 | PostgreSQL + Prisma 6.17 (Supabase 托管) |
| 认证 | NextAuth.js 5.0 |
| 状态 | Zustand (购物车), React Query (服务端) |
| 样式 | Tailwind CSS 4, Lucide Icons |
| 测试 | Vitest + @testing-library/react |

## 常用命令

```bash
pnpm dev              # 开发服务器
pnpm build            # 生产构建
pnpm test             # 运行测试
pnpm test --run       # 单次运行测试
pnpm prisma studio    # 数据库 GUI
```
```

---

### Task 13: Rewrite CLAUDE.md (Part 2 - Architecture)

**Step 1: Add architecture section**

Add after the commands section:

```markdown
## 架构

### 目录结构 (Feature-Sliced Design)

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # 公开页面 (header/footer layout)
│   ├── (auth)/            # 认证页面
│   └── api/               # API 路由 + tRPC
├── features/              # 业务功能模块
│   └── guest/
│       ├── discovery/     # 搜索、筛选组件
│       ├── plans/         # 套餐列表、详情
│       └── booking/       # 预约流程
├── shared/                # 共享代码
│   ├── api/              # tRPC client
│   └── hooks/            # useSearchState 等
├── server/               # 服务端代码
│   ├── trpc/             # tRPC routers
│   └── services/         # 业务逻辑
├── components/           # 通用 UI 组件
├── contexts/             # React Context
├── store/                # Zustand stores
└── lib/                  # 工具函数
```

### 数据获取策略

| 场景 | 方式 |
|------|------|
| 页面初始数据 | Server Component + Prisma |
| URL 筛选状态 | nuqs (useSearchState) |
| 购物车 | Zustand + localStorage |
| 未来实时更新 | tRPC hooks (已准备) |

### 核心数据模型

```
User (用户) ─┬─ Booking (预约)
             └─ Cart (购物车)

Store (店铺) ─── PlanStore ─── RentalPlan (套餐)
                                    │
                              BookingItem
```

详细 Schema 见 `prisma/schema.prisma`
```

---

### Task 14: Rewrite CLAUDE.md (Part 3 - Key Patterns)

**Step 1: Add key patterns section**

```markdown
## 关键模式

### 1. 套餐系统

- 使用 `RentalPlan` 模型，`isCampaign` 标记活动套餐
- 一个套餐可在多店铺销售 (PlanStore 多对多)
- 价格单位: `pricingUnit` = "person" | "group"

### 2. 预约流程

```
套餐详情页 → BookingCard 填写 → 加购物车 或 立即预约
                                    ↓
                              /booking 确认页
                                    ↓
                              创建 Booking 记录
```

必填字段: 日期、时间、姓名、手机

### 3. URL 状态管理

使用 nuqs 管理搜索参数:

```typescript
import { useSearchState } from '@/shared/hooks';

const { location, setLocation, theme, setTheme } = useSearchState();
// URL 自动同步: /plans?location=京都&theme=traditional
```

### 4. 组件开发位置

| 组件类型 | 位置 |
|----------|------|
| 搜索/筛选 | `src/features/guest/discovery/components/` |
| 套餐相关 | `src/features/guest/plans/components/` |
| 预约相关 | `src/features/guest/booking/components/` |
| 通用 UI | `src/components/` |

## API 路由

```
/api/trpc/[trpc]     # tRPC 入口
/api/bookings        # 预约 CRUD
/api/plans/[id]      # 套餐详情
/api/stores          # 店铺列表
/api/themes          # 主题列表
/api/locations       # 地点列表
```

## 测试

```bash
pnpm test                           # 监视模式
pnpm test --run                     # 单次运行
pnpm test src/features/             # 测试特定目录
```

测试文件放在 `__tests__/` 目录，与源码同级。

## 文档索引

| 需求 | 文档 |
|------|------|
| 新人入门 | `CONTRIBUTING.md` |
| 架构详解 | `docs/architecture/` |
| 功能设计 | `docs/features/` |
| 部署指南 | `docs/guides/deployment.md` |
| 数据库设置 | `docs/guides/database-setup.md` |
```

**Step 2: Remove old verbose sections**

Delete the following sections from CLAUDE.md (they're now in docs/):
- "Product Design Philosophy" (产品设计哲学) - ~300 lines
- "Booking Flow Design" detailed flowcharts - ~200 lines
- Detailed API route descriptions
- Legacy migration notes about CampaignPlan

**Step 3: Verify line count**

```bash
wc -l CLAUDE.md
# Target: ~400 lines (down from 952)
```

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: optimize CLAUDE.md for AI readability"
```

---

## Phase 4: New Documents

### Task 15: Create CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

**Step 1: Write CONTRIBUTING.md**

```markdown
# Contributing Guide

## 快速开始

```bash
# 1. 克隆并安装
git clone <repo>
cd hefumiyabi-website
pnpm install

# 2. 配置环境
cp .env.example .env.local
# 编辑 .env.local 填入数据库连接等

# 3. 启动开发
pnpm dev
```

## 用 Claude Code 开发

### 推荐工作流

1. **理解项目** - Claude 会自动读取 CLAUDE.md
2. **描述任务** - 清晰说明要实现什么
3. **探索代码** - 让 AI 用 Explore agent 搜索相关代码
4. **制定计划** - 用 `/plan` 生成实施方案
5. **逐步实现** - 每步完成后验证

### 常见任务示例

**添加新组件:**
```
"在 discovery 模块添加一个价格范围筛选器，参考 CategoryFilter.tsx 的实现"
```

**修改数据模型:**
```
"给 RentalPlan 添加 maxGroupSize 字段，需要更新 Prisma schema 和相关 API"
```

**修复 Bug:**
```
"DateDropdown 在移动端点击没反应，帮我调试"
```

**写测试:**
```
"给 usePlanList hook 添加测试，参考 useSearchState.test.ts 的模式"
```

## 代码规范

### 文件位置

| 类型 | 位置 |
|------|------|
| 页面 | `src/app/(main)/[route]/page.tsx` |
| 搜索组件 | `src/features/guest/discovery/components/` |
| 套餐组件 | `src/features/guest/plans/components/` |
| 共享 Hook | `src/shared/hooks/` |
| API 路由 | `src/app/api/` |
| 测试 | `[模块]/__tests__/` |

### 命名规范

- 组件: PascalCase (`DateDropdown.tsx`)
- Hook: camelCase with use prefix (`usePlanList.ts`)
- 测试: `[name].test.ts(x)`

### 提交信息

```
feat(scope): 添加新功能
fix(scope): 修复问题
docs: 更新文档
test: 添加测试
refactor: 重构代码
```

## 测试

```bash
pnpm test              # 监视模式
pnpm test --run        # 单次运行全部
pnpm test [file]       # 运行特定文件
```

### 测试文件结构

```typescript
/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

describe('useMyHook', () => {
  it('should do something', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(expected);
  });
});
```

## 获取帮助

- 项目文档: `docs/` 目录
- 架构说明: `docs/architecture/`
- 功能设计: `docs/features/`
```

**Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md for new developers"
```

---

### Task 16: Update README.md

**Files:**
- Modify: `README.md`

**Step 1: Read current README**

Check what's in the current README.md.

**Step 2: Update README with streamlined content**

Ensure README.md has:
- Project name and one-line description
- Quick start (3 commands)
- Link to CONTRIBUTING.md for details
- Link to docs/ for detailed documentation
- Remove duplicate content that's now in other docs

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README.md with streamlined content"
```

---

### Task 17: Create docs/guides/setup.md (Consolidated)

**Files:**
- Create: `docs/guides/setup.md`

**Step 1: Consolidate setup information**

Merge key information from:
- `docs/guides/database-setup.md`
- `docs/guides/supabase-setup.md`
- `docs/guides/database-connection.md`

Into one comprehensive `setup.md` that covers:
1. Prerequisites (Node, pnpm, PostgreSQL)
2. Environment variables
3. Database setup (local vs Supabase)
4. Common issues and solutions

**Step 2: Commit**

```bash
git add docs/guides/setup.md
git commit -m "docs: create consolidated setup guide"
```

---

## Phase 5: Large Document Updates

### Task 18: Update service-hotmap and plan-detail Documents

**Files:**
- Modify: `docs/features/service-hotmap.md`
- Modify: `docs/features/plan-detail-design.md`

**Step 1: Analyze current code for hotmap feature**

```bash
# Find hotmap related files
find src -name "*hotmap*" -o -name "*hotspot*" | head -20
grep -r "hotspot\|hotmap" src --include="*.tsx" -l | head -10
```

**Step 2: Analyze current code for plan detail page**

```bash
# Find plan detail related files
ls -la src/app/\(main\)/plans/\[id\]/
grep -r "PlanDetail\|plan-detail" src --include="*.tsx" -l | head -10
```

**Step 3: Update service-hotmap.md**

- Remove outdated implementation details
- Update with current file paths and component names
- Keep design decisions and rationale
- Add "Current Implementation" section with actual code references

**Step 4: Update plan-detail-design.md**

- Remove outdated implementation details
- Update with current file paths and component names
- Keep UX decisions and rationale
- Add "Current Implementation" section with actual code references

**Step 5: Commit**

```bash
git add docs/features/service-hotmap.md docs/features/plan-detail-design.md
git commit -m "docs: update hotmap and plan-detail design docs with current implementation"
```

---

### Task 19: Final Cleanup and Verification

**Step 1: Verify root directory is clean**

```bash
ls *.md
# Expected: CLAUDE.md, README.md, CONTRIBUTING.md
```

**Step 2: Verify docs structure**

```bash
tree docs -L 2
# Expected structure:
# docs/
# ├── archive/
# │   └── 2024-11/
# ├── architecture/
# │   ├── decisions/
# │   ├── design-system.md
# │   ├── overview.md
# │   ├── product-philosophy.md
# │   ├── product-positioning.md
# │   └── ui-ux-guide.md
# ├── features/
# │   ├── booking-*.md
# │   ├── plan-*.md
# │   ├── ...
# ├── guides/
# │   ├── database-*.md
# │   ├── deployment.md
# │   └── setup.md
# └── plans/
#     └── 2026-01-*.md
```

**Step 3: Verify CLAUDE.md size**

```bash
wc -l CLAUDE.md
# Target: ~400 lines
```

**Step 4: Run tests to ensure nothing broke**

```bash
pnpm test --run
```

**Step 5: Final commit**

```bash
git add -A
git commit -m "docs: complete documentation restructure"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-5 | Directory structure & cleanup |
| 2 | 6-10 | Organize active documents |
| 3 | 11-14 | CLAUDE.md optimization |
| 4 | 15-17 | New documents (CONTRIBUTING, setup) |
| 5 | 18-19 | Large document updates & verification |

**Expected Results:**
- Root directory: 3 md files (CLAUDE.md, README.md, CONTRIBUTING.md)
- CLAUDE.md: ~400 lines (down from 952)
- Organized docs/ with clear categories
- All outdated docs preserved in archive/
- 203 tests still passing
