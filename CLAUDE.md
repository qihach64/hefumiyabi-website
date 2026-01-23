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
│   ├── (main)/            # 公开页面 (header/footer layout)
│   │   ├── plans/         # 套餐列表和详情
│   │   ├── booking/       # 预约流程
│   │   ├── cart/          # 购物车
│   │   ├── stores/        # 店铺
│   │   ├── merchant/      # 商家后台
│   │   └── admin/         # 管理后台
│   ├── (auth)/            # 认证页面 (login, register)
│   └── api/               # API 路由 + tRPC
├── features/              # 业务功能模块 (FSD)
│   └── guest/
│       ├── discovery/     # 搜索、筛选组件
│       │   └── components/
│       ├── plans/         # 套餐相关
│       │   ├── components/
│       │   └── hooks/     # usePlanList, usePlanDetail
│       └── booking/       # 预约相关
├── shared/                # 共享代码
│   ├── api/              # tRPC client, TRPCProvider
│   └── hooks/            # useSearchState (nuqs)
├── server/               # 服务端代码
│   ├── trpc/             # tRPC routers
│   │   └── routers/      # plan, health
│   └── services/         # 业务逻辑 (plan.service.ts)
├── components/           # 通用 UI 组件
│   ├── layout/           # Header, Footer, MobileSearchBar
│   ├── home/             # 首页组件
│   └── plans/            # 套餐展示组件
├── contexts/             # React Context
│   ├── SearchBarContext.tsx      # 搜索栏 UI 状态
│   └── SearchLoadingContext.tsx  # 搜索加载状态
├── store/                # Zustand stores
│   ├── cart.ts           # 购物车
│   ├── favorites.ts      # 收藏
│   ├── planDraft.ts      # 套餐草稿 (商家)
│   ├── tryOn.ts          # AI 试穿缓存
│   └── userPhoto.ts      # 用户照片
└── lib/                  # 工具函数
```

### 路由结构

| 路由               | 说明                |
| ------------------ | ------------------- |
| `/`                | 首页，特色套餐展示  |
| `/plans`           | 套餐列表，支持筛选  |
| `/plans/[id]`      | 套餐详情，加购/预约 |
| `/cart`            | 购物车              |
| `/booking`         | 预约确认页          |
| `/booking/success` | 预约成功            |
| `/stores`          | 店铺列表            |
| `/merchant/*`      | 商家后台            |
| `/admin/*`         | 管理后台            |

### 数据获取策略

| 场景           | 方式                       |
| -------------- | -------------------------- |
| 页面初始数据   | Server Component + Prisma  |
| URL 筛选状态   | nuqs (useSearchState hook) |
| 购物车         | Zustand + localStorage     |
| 客户端数据刷新 | tRPC hooks (已准备)        |

### 核心数据模型

```
User ─── Booking ─── BookingItem ─── RentalPlan
  │                                      │
  └── Cart ─── CartItem                  │
                                    PlanStore ─── Store
```

**关键模型:**
- `RentalPlan` - 套餐 (isCampaign 标记活动套餐)
- `Store` - 店铺 (多店铺支持)
- `PlanStore` - 套餐-店铺关联 (多对多)
- `Booking` / `BookingItem` - 预约记录
- `Cart` / `CartItem` - 购物车 (Zustand 管理)

详细 Schema: `prisma/schema.prisma`

## 关键模式

### 1. URL 状态管理 (nuqs)

```typescript
import { useSearchState } from '@/shared/hooks';

const {
  // 基础搜索参数
  location, setLocation,
  date, setDate,
  theme, setTheme,
  guests, setGuests,
  // 筛选参数
  minPrice, maxPrice, setPriceRange,
  sort, setSort,
  category, setCategory,
  tags, setTags,
  // 工具方法
  clearAll,      // 清空所有筛选
  hasFilters,    // 是否有筛选条件
} = useSearchState();

// URL 自动同步: /plans?location=京都&theme=traditional&minPrice=5000
```

### 2. 购物车 (Zustand)

```typescript
import { useCartStore } from '@/store/cart';

// 添加商品
useCartStore.getState().addItem({
  planId: plan.id,
  name: plan.name,
  price: plan.price,
  quantity: 1,
  date: '2025-01-20',
  time: '10:00',
  storeId: store.id,
});

// 读取购物车
const items = useCartStore((state) => state.items);
```

### 3. tRPC Hooks (服务端数据)

```typescript
import { usePlanList, usePlanDetail } from '@/features/guest/plans';

// 套餐列表 (带筛选)
const { data, isLoading } = usePlanList({
  theme: 'traditional',
  location: '京都',
  limit: 20,
});

// 套餐详情
const { data: plan } = usePlanDetail(planId);
```

### 4. 价格处理

**所有价格以"分"存储** (避免浮点精度问题)

```typescript
// 显示价格
const displayPrice = (cents: number) => `¥${(cents / 100).toLocaleString()}`;

// 折扣计算
const discount = ((originalPrice - price) / originalPrice) * 100;
```

### 5. 组件开发位置

| 组件类型  | 位置                                       |
| --------- | ------------------------------------------ |
| 搜索/筛选 | `src/features/guest/discovery/components/` |
| 套餐相关  | `src/features/guest/plans/`                |
| 预约相关  | `src/features/guest/booking/`              |
| 布局组件  | `src/components/layout/`                   |
| 通用 UI   | `src/components/`                          |

## API 路由

```
# tRPC (类型安全)
/api/trpc/[trpc]     # tRPC 入口 (plan.list, plan.getById, plan.featured, health.check)

# REST API
/api/bookings        # 预约 CRUD
/api/plans/[id]      # 套餐详情
/api/stores          # 店铺列表
/api/themes          # 主题列表
/api/locations       # 地点列表
/api/tags            # 标签系统
/api/favorites       # 收藏功能
/api/chatbot         # AI 聊天机器人
/api/virtual-tryon   # AI 试穿
/api/upload          # 文件上传
/api/merchant/*      # 商家后台 API
/api/admin/*         # 管理后台 API
```

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

## 常见任务

### 添加新页面
1. 创建 `src/app/(main)/[route]/page.tsx` (Server Component)
2. 需要交互？创建 `[Route]Client.tsx` (Client Component)
3. 数据获取放在 Server Component

### 添加新组件
1. 确定位置 (features/ 或 components/)
2. 创建组件文件
3. 添加到 index.ts 导出

### 修改数据模型
1. 更新 `prisma/schema.prisma`
2. 运行 `pnpm prisma db push`
3. 更新相关 API 和组件
