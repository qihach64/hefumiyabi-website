# CLAUDE.md

> AI 工作上下文 - 精简版。详细文档见 `docs/`

## 交互偏好

- **语言:** 全程中文 (对话、代码注释、commit 信息、文档)
- **风格:** 简洁直接，不啰嗦
- **代码:** 变量名/函数名用英文，注释用中文

## 项目概述

**Kimono One** - 和服租赁电商平台 (Next.js 15 + Prisma + PostgreSQL)

**核心功能:** 套餐浏览 → 加购物车 → 预约 → 到店体验

## Tech Stack

| 类别   | 技术                                               |
| ------ | -------------------------------------------------- |
| 框架   | Next.js 15.5 (App Router), React 19, TypeScript 5  |
| 数据库 | PostgreSQL + Prisma 6.17 (Supabase 托管)           |
| 认证   | NextAuth.js 5.0                                    |
| 状态   | Zustand (购物车), React Query (服务端), nuqs (URL) |
| 样式   | Tailwind CSS 4, Lucide Icons                       |
| 测试   | Vitest + @testing-library/react                    |

## 常用命令

```bash
pnpm dev              # 开发服务器
pnpm build            # 生产构建
pnpm test             # 运行测试 (监视模式)
pnpm test --run       # 单次运行测试
pnpm prisma studio    # 数据库 GUI
pnpm prisma db push   # 推送 schema 变更
```

## 架构

### 目录结构 (Feature-Sliced Design)

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # 公开页面 (带 header/footer layout)
│   ├── (auth)/            # 认证页面 (login, register, verify-email)
│   └── api/               # REST API + tRPC 入口
├── server/                # 服务端三层架构
│   ├── schemas/           # Zod 输入校验 (集中导出: schemas/index.ts)
│   ├── services/          # 业务逻辑层 (8 个 service 文件)
│   └── trpc/              # tRPC 路由定义
│       ├── trpc.ts        # 4 种 procedure 权限定义
│       ├── context.ts     # 请求上下文
│       └── routers/       # 7 个 router (注册在 routers/index.ts)
├── features/              # 业务功能模块 (FSD)
│   ├── guest/             # 游客功能
│   │   ├── discovery/     # 搜索、筛选
│   │   ├── plans/         # 套餐 (hooks + components)
│   │   └── booking/       # 预约
│   └── merchant/          # 商家功能
├── components/            # 通用 UI 组件
│   ├── layout/            # Header, Footer
│   ├── home/              # 首页
│   ├── plan/              # 套餐详情子组件
│   ├── PlanCard/          # 套餐卡片
│   └── ui/                # 基础 UI 元素
├── shared/                # 共享代码
│   ├── api/               # tRPC client
│   ├── hooks/             # useSearchState 等
│   ├── components/        # 跨功能共享组件
│   ├── lib/               # 共享工具
│   └── ui/                # 共享 UI
├── store/                 # Zustand stores (cart, favorites 等)
├── contexts/              # React Context
├── types/                 # TypeScript 类型定义
├── config/                # 配置
└── lib/                   # 工具函数
```

### 路由结构

| 路由 | 说明 |
|------|------|
| `/` | 首页，特色套餐展示 |
| `/plans` | 套餐列表，支持筛选 |
| `/plans/[id]` | 套餐详情，加购/预约 |
| `/cart` | 购物车 |
| `/booking` | 预约确认页 |
| `/booking/success` | 预约成功 |
| `/stores` | 店铺列表 |
| `/search` | 搜索结果 |
| `/campaigns` | 活动列表 |
| `/about`, `/contact`, `/faq` | 信息页面 |
| `/login`, `/register` | 认证 |
| `/profile` | 用户资料 |
| `/virtual-tryon` | AI 试穿 |
| `/merchant/*` | 商家后台 |
| `/admin/*` | 管理后台 |

### 数据获取策略

| 场景           | 方式                       |
| -------------- | -------------------------- |
| 页面初始数据   | Server Component + Prisma  |
| URL 筛选状态   | nuqs (useSearchState hook) |
| 购物车         | Zustand + localStorage     |
| 客户端数据刷新 | tRPC hooks (已准备)        |

### 核心数据模型

完整定义: `prisma/schema.prisma` (25 个模型)

**核心业务关系:**
```
User ─── Booking ─── BookingItem ─── RentalPlan
  │                                      │
  └── Favorite                       PlanStore ─── Store
```

**按业务域分组:**
- **用户:** User, Account, Session, VerificationToken, UserPreference
- **商品:** RentalPlan, PlanStore, PlanTag, PlanComponent, PlanUpgrade, Store, Theme
- **交易:** Booking, BookingItem, Cart/CartItem (Zustand 管理，不在 DB)
- **商家:** Merchant, MerchantComponent, ServiceComponent, MerchantReview
- **互动:** Favorite, VirtualTryOn, Campaign
- **地图:** MapTemplate, MapHotspot
- **标签:** Tag, TagCategory, PlanTag

### 服务端三层架构

新 API 一律用 tRPC router（不要创建 REST API）。

**数据流:** Schema (Zod 校验) → Router (tRPC 端点) → Service (业务逻辑) → Prisma

**现有 7 个 Router:**
health, plan, store, booking, favorite, merchant, tag
(注册在 `src/server/trpc/routers/index.ts`)

**4 种权限级别** (`src/server/trpc/trpc.ts`):
- `publicProcedure` — 任何人
- `protectedProcedure` — 需登录
- `merchantProcedure` — 需商家身份 (已审核)
- `adminProcedure` — 需管理员/职员

## 关键模式

### URL 状态管理 (nuqs)
用 `useSearchState` hook（`src/shared/hooks/useSearchState.ts`）管理搜索筛选状态。
**重要**: 同页面用 nuqs setters，跨页面用 `router.push()`，不要混用。详见 `docs/guides/url-state-management.md`

### 购物车 (Zustand)
`src/store/cart.ts` — 用 `useCartStore` 管理购物车，数据持久化到 localStorage。

### tRPC Hooks
`src/features/guest/plans/hooks/` — `usePlanList`, `usePlanDetail` 等 hooks 封装了 tRPC 调用。

### 价格处理
所有价格以**分**存储。显示时除以 100：`¥${(cents / 100).toLocaleString()}`

## 测试

```bash
pnpm test                              # 监视模式
pnpm test --run                        # 单次运行
pnpm test src/features/                # 测试特定目录
pnpm test src/shared/hooks/__tests__/  # 测试特定文件夹
```

**测试文件位置:** `[模块]/__tests__/*.test.ts(x)`

**测试模式:**
```typescript
/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

describe('useMyHook', () => {
  it('should work', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBeDefined();
  });
});
```

## 环境变量

必需的 `.env.local` 配置:

```bash
DATABASE_URL="postgresql://..."      # PostgreSQL 连接
NEXTAUTH_URL="http://localhost:3000" # NextAuth URL
NEXTAUTH_SECRET="..."                # NextAuth 密钥
```

可选:
```bash
GOOGLE_AI_API_KEY="..."              # AI 聊天机器人
REPLICATE_API_TOKEN="..."            # AI 试穿
```

## Agent 导航速查

| 要做什么 | 先看哪里 |
|---------|---------|
| 加/改后端 API | `src/server/` — schemas → services → trpc/routers 三层 |
| 加/改页面 | `src/app/(main)/` — page.tsx (Server) + Client.tsx (交互) |
| 加/改前端组件 | `src/features/guest/` 或 `src/components/` |
| 改数据模型 | `prisma/schema.prisma` → `pnpm prisma db push && pnpm prisma generate` |
| 参考完整功能实现 | booking 全链路最完整: schema → service → router → test |
| UI 设计规范 | 使用 ui-design-system skill |

## 绝对不要做

- 改了 `prisma/schema.prisma` 但不运行 `pnpm prisma db push && pnpm prisma generate`
- 把 Client Component 逻辑写在 `page.tsx` 里（page.tsx 是 Server Component）
- 在 `src/app/api/` 创建新 REST 路由（新 API 一律用 tRPC router）
- 用 `next/font/google` 加载 CJK 字体

## 文档索引

| 需求       | 文档                                      |
| ---------- | ----------------------------------------- |
| 新人入门   | `CONTRIBUTING.md`                         |
| 快速开始   | `docs/guides/quick-start.md`              |
| 数据库设置 | `docs/guides/database-setup.md`           |
| 部署指南   | `docs/guides/deployment.md`               |
| 架构详解   | `docs/architecture/`                      |
| 功能设计   | `docs/features/`                          |
| 产品哲学   | `docs/architecture/product-philosophy.md` |
| 重构计划   | `docs/plans/`                             |

## 代码规范

- **TypeScript:** 严格模式，避免 `any`
- **组件:** 优先 Server Component，需要交互时用 `'use client'`
- **路径别名:** `@/` 指向 `src/`
- **提交信息:** `feat|fix|docs|test|refactor(scope): 中文描述`
- **CJK 字体:** 禁止用 `next/font/google` 加载 CJK 字体（会生成上百个 woff2 分片，严重拖慢 LCP）。CJK 项目首选系统字体栈，如需自定义字体用 `pyftsubset` 自托管最小子集（< 50KB）

## 常见任务

### 添加新功能（端到端）
1. 数据层: 更新 `prisma/schema.prisma` → `pnpm prisma db push` → `pnpm prisma generate`
2. Schema: `src/server/schemas/{name}.schema.ts` → 导出到 `schemas/index.ts`
3. Service: `src/server/services/{name}.service.ts`
4. Router: `src/server/trpc/routers/{name}.ts` → 注册到 `routers/index.ts`
5. 前端: `src/app/(main)/{route}/page.tsx` + 交互组件
6. 测试: `src/server/services/__tests__/{name}.service.test.ts`

### 添加新页面
1. `src/app/(main)/[route]/page.tsx` (Server Component)
2. 需要交互？创建 `[Route]Client.tsx` (Client Component, 加 `'use client'`)
3. 数据获取放在 Server Component

### 常见错误急救

| 错误症状 | 修复方法 |
|---------|---------|
| `PrismaClientKnownRequestError` | `pnpm prisma db push` |
| `Cannot find module '@prisma/client'` | `pnpm prisma generate` |
| `No "xxx" query found` (tRPC) | 检查 `src/server/trpc/routers/index.ts` 是否注册 |
| 页面空白 / hydration error | 交互逻辑放 `'use client'` 文件里 |
| `Module not found: '@/xxx'` | `@/` = `src/`，检查文件路径 |
