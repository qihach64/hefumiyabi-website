# 架构重构设计文档

> 日期: 2026-01-10
> 状态: 待实施
> 预估工期: 3 周
> 更新: 2026-01-11 (根据审核反馈调整)

## 1. 背景与目标

### 1.1 当前痛点

**前端:**
- 组件职责不清晰，UI 逻辑和业务逻辑混合
- 状态管理复杂，Zustand + Context + URL params 混用
- 代码复用困难，大量 props drilling
- 大组件难以维护 (BookingCard 536行, PlanDetailClient 514行)

**后端:**
- 业务逻辑混在 API route handler 里
- 数据库有废弃的 tables/fields (CampaignPlan, Listing 等)

**架构:**
- 缺乏模块化，团队并行开发困难
- AI 模块 (试穿、客服) 需要整合

### 1.2 目标

1. 建立清晰的代码组织结构 (Feature-Sliced Design)
2. 分离业务逻辑与 UI 渲染
3. 统一前后端交互方式 (tRPC + REST)
4. 清理数据库技术债务
5. 整合 AI 模块到 Monorepo

---

## 2. 整体架构

### 2.1 分阶段迁移策略

> **重要决策**: 不一次性迁移到 Monorepo，而是分阶段进行，降低风险。

```
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 1 (本次重构): 在现有 src/ 内重构                                    │
│  • 创建 features/ 目录结构                                               │
│  • 添加 server/ 服务层 + tRPC                                           │
│  • 清理数据库                                                           │
│  • 保持单体 Next.js 应用，不引入 Monorepo                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 2 (后续): AI 模块独立部署                                          │
│  • AI 客服保持独立仓库，部署到 AWS                                       │
│  • AI 试穿代码复制到主项目 features/guest/virtual-tryon/                 │
│  • 通过 REST API 集成                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  阶段 3 (需要时): 引入 Monorepo                                          │
│  • 当有 2+ TypeScript 包需要共享时再考虑                                 │
│  • 届时使用 Turbo + pnpm workspace                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 阶段 1 目标结构 (本次重构)

```
src/                                      # 保持现有根目录
│
├── app/                                  # Next.js App Router (保持)
│   ├── (main)/
│   ├── (auth)/
│   ├── (merchant)/
│   ├── (admin)/
│   └── api/
│
├── features/                             # 新增: 功能模块
│   ├── guest/
│   ├── merchant/
│   └── platform/
│
├── server/                               # 新增: 后端服务层
│   ├── trpc/
│   └── services/
│
├── shared/                               # 新增: 共享代码
│   ├── ui/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── store/                                # 保持: Zustand stores
├── types/                                # 保持: 类型定义
└── config/                               # 新增: 配置
```

### 2.3 部署架构 (阶段 1)

```
┌─────────────────────────────────────────────────────────┐
│  Vercel                                                 │
│  └── hefumiyabi-website (Next.js)                       │
│      ├── src/features/guest/virtual-tryon/ (集成)       │
│      └── src/server/ (tRPC API)                         │
└─────────────────────────────────────────────────────────┘
                    │
                    │ REST API (阶段 2 后)
                    ▼
┌─────────────────────────────────────────────────────────┐
│  AWS (Lambda / ECS)                                     │
│  └── ai-chatbot (独立仓库, Python FastAPI)              │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase → AWS RDS (阶段 3 后迁移)                     │
│  └── PostgreSQL                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 功能模块详细结构

### 3.1 Feature 模块划分 (简化版)

> **设计原则**: 按用户旅程划分，避免过度拆分。相关功能合并到一个模块。

```
src/features/
│
├── guest/                                # 游客端 (5 个模块)
│   │
│   ├── discovery/                        # 发现：搜索 + 浏览 + 筛选
│   │   ├── components/
│   │   │   ├── HeroSearchBar.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   ├── ThemePills.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   └── useSearch.ts
│   │   └── index.ts
│   │
│   ├── plans/                            # 套餐：列表 + 详情 + 服务地图 + 升级服务
│   │   ├── components/
│   │   │   ├── PlanGrid.tsx
│   │   │   ├── PlanDetail.tsx
│   │   │   ├── ServiceMap.tsx            # 原 service-map 合并到这里
│   │   │   ├── UpgradeSelector.tsx       # 原 upgrades 合并到这里
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── usePlanList.ts
│   │   │   ├── usePlanDetail.ts
│   │   │   └── useUpgradeSelection.ts
│   │   └── index.ts
│   │
│   ├── booking/                          # 预约：购物车 + 结账 + 确认
│   │   ├── components/
│   │   │   ├── BookingCard.tsx
│   │   │   ├── CartPage.tsx              # 原 cart 合并到这里
│   │   │   ├── CartItem.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── BookingSuccess.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useBookingForm.ts
│   │   │   ├── useCart.ts
│   │   │   └── usePricing.ts
│   │   ├── services/
│   │   │   └── pricing.ts
│   │   └── index.ts
│   │
│   ├── virtual-tryon/                    # AI 试穿 (独立，复杂度高)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   │
│   ├── profile/                          # 用户中心：收藏 + 历史 + 设置
│   │   ├── components/
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── FavoritesList.tsx         # 原 favorites 合并到这里
│   │   │   ├── BookingHistory.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   └── useProfile.ts
│   │   └── index.ts
│   │
│   └── auth/                             # 认证
│       ├── components/
│       └── index.ts
│
├── merchant/                             # 商户端 (6 个模块)
│   ├── dashboard/                        # 仪表盘 + 数据概览
│   ├── plans/                            # 套餐管理 + 组件配置
│   ├── orders/                           # 订单管理 + 日历
│   ├── store/                            # 店铺设置
│   ├── payouts/                          # 结算
│   └── onboarding/                       # 入驻流程
│
└── platform/                             # 平台端 (6 个模块)
    ├── dashboard/                        # 管理仪表盘
    ├── merchants/                        # 商户审核 + 管理
    ├── content/                          # 内容管理 (主题、标签、活动)
    ├── bookings/                         # 全平台订单
    ├── users/                            # 用户管理
    └── analytics/                        # 数据分析
│
├── server/                               # 后端业务层
│   ├── trpc/
│   │   ├── context.ts
│   │   ├── trpc.ts
│   │   └── routers/
│   │       ├── plan.ts
│   │       ├── booking.ts
│   │       ├── cart.ts
│   │       ├── merchant.ts
│   │       └── index.ts
│   │
│   ├── services/                         # 业务逻辑
│   │   ├── booking.service.ts
│   │   ├── plan.service.ts
│   │   ├── pricing.service.ts
│   │   ├── cart.service.ts
│   │   └── email.service.ts
│   │
│   └── repositories/                     # 数据访问层 (可选)
│       ├── booking.repo.ts
│       └── plan.repo.ts
│
├── shared/                               # 前端共享代码 (2+ 功能使用)
│   ├── ui/                               # 基础 UI (shadcn/ui + 自建)
│   ├── components/                       # 跨端业务组件
│   │   ├── PlanCard/
│   │   ├── BookingCard/
│   │   ├── StoreCard/
│   │   ├── ImageUploader/
│   │   ├── DateTimePicker/
│   │   └── PriceDisplay/
│   ├── hooks/
│   │   ├── useSearchState.ts              # nuqs 封装，替代 SearchStateContext
│   │   ├── useMediaQuery.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── contexts/                          # 仅保留真正需要的全局 Context
│   │   └── (按需添加)
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── types/                            # 前端扩展类型
│   │   └── index.ts
│   └── api/                              # API 客户端
│       ├── trpc.ts                       # tRPC client
│       └── ai-chatbot.ts                 # Python 服务 REST client
│
└── config/
    ├── constants.ts
    └── routes.ts
```

### 3.2 Feature 模块内部结构规范

每个 feature 模块遵循统一结构:

```
features/[端]/[功能名]/
├── components/                           # UI 组件
│   ├── ComponentA.tsx
│   └── index.ts                          # 统一导出
├── hooks/                                # 该功能的 hooks
│   └── useXxx.ts
├── services/                             # 前端业务逻辑 (纯函数)
│   └── xxxService.ts
├── store/                                # 状态管理 (如需要)
│   └── xxxStore.ts
├── types.ts                              # 功能专用类型
└── index.ts                              # 公共 API 导出
```

### 3.3 导入规则

```typescript
// ✅ 正确：通过 index.ts 导入其他功能
import { BookingCard } from '@/features/guest/booking';
import { useCart } from '@/features/guest/cart';

// ✅ 正确：导入共享层
import { Button, Modal } from '@/shared/ui';
import { formatPrice } from '@/shared/lib/format';
import { trpc } from '@/shared/api/trpc';

// ✅ 正确：导入 Prisma 类型 + 前端扩展
import type { Plan } from '@prisma/client';
import type { PlanWithStore } from '@/shared/types';

// ❌ 错误：直接导入其他功能内部文件
import { BookingCard } from '@/features/guest/booking/components/BookingCard';
```

---

## 4. 前后端交互

### 4.1 tRPC (TypeScript 服务)

主站所有业务 API 使用 tRPC:

```typescript
// server/trpc/routers/plan.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { planService } from '@/server/services/plan.service';
import { z } from 'zod';

export const planRouter = router({
  list: publicProcedure
    .input(z.object({
      theme: z.string().optional(),
      storeId: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return planService.getList(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return planService.getById(input.id);
    }),

  create: protectedProcedure
    .input(createPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return planService.create(input, ctx.user);
    }),
});
```

前端调用:

```typescript
// features/guest/plans/hooks/usePlanList.ts
import { trpc } from '@/shared/api/trpc';

export function usePlanList(params: { theme?: string }) {
  return trpc.plan.list.useQuery(params);
}
```

### 4.2 REST (Python AI 服务)

Python 服务使用 REST + OpenAPI:

```typescript
// shared/api/ai-chatbot.ts
const AI_CHATBOT_URL = process.env.AI_CHATBOT_URL;

export const aiChatbotApi = {
  async chat(message: string, sessionId: string): Promise<ChatResponse> {
    const res = await fetch(`${AI_CHATBOT_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });
    return res.json();
  },
};
```

---

## 5. 状态管理架构

### 5.1 分层状态管理

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         状态管理分层架构                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 服务端状态 (tRPC + React Query)                                  │   │
│  │ • 套餐列表、详情                                                  │   │
│  │ • 预约数据                                                       │   │
│  │ • 用户信息                                                       │   │
│  │ • 商户数据                                                       │   │
│  │ 特点：自动缓存、后台刷新、乐观更新、类型安全                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ URL 状态 (nuqs)                                                  │   │
│  │ • 搜索参数 (location, date, theme)                               │   │
│  │ • 筛选条件                                                       │   │
│  │ • 分页                                                           │   │
│  │ 特点：可分享、可书签、浏览器历史正常、SSR 友好                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 客户端持久状态 (Zustand + persist)                               │   │
│  │ • 购物车                                                         │   │
│  │ • 收藏                                                           │   │
│  │ • 草稿                                                           │   │
│  │ • AI 试穿缓存                                                     │   │
│  │ 特点：离线可用、跨页面持久                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 表单状态 (React Hook Form + Zod)                                 │   │
│  │ • 预约表单                                                       │   │
│  │ • 商户套餐编辑表单                                                │   │
│  │ • 用户资料表单                                                    │   │
│  │ 特点：声明式验证、性能优化、类型安全                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 组件本地状态 (useState / useReducer)                             │   │
│  │ • Modal 开关                                                     │   │
│  │ • 临时 UI 状态                                                    │   │
│  │ 特点：简单、无需共享                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 工具选择

| 状态类型 | 工具 | 说明 |
|----------|------|------|
| 服务端数据 | **tRPC + React Query** | 内置于 tRPC，自动缓存和类型安全 |
| URL 参数 | **nuqs** | 类型安全的 URL 状态管理，替代手动 searchParams |
| 客户端持久 | **Zustand** | 保持现有，轻量且足够 |
| 表单 | **React Hook Form + Zod** | 复杂表单的最佳实践 |
| 组件状态 | **useState** | 简单场景足够 |

### 5.3 需要迁移的状态

| 当前 | 迁移到 | 理由 |
|------|--------|------|
| `SearchStateContext` | **nuqs** | URL 作为唯一真相来源，消除双向同步问题 |
| `SearchBarContext` | **Zustand** 或组件内 | 简单 UI 状态不需要 Context |
| `SearchLoadingContext` | **删除** | tRPC 自带 loading 状态 |
| 直接 `fetch` 调用 | **tRPC** | 类型安全 + 自动缓存 |
| 表单 `useState` | **React Hook Form** | 复杂表单更好管理 |

### 5.4 URL 状态示例 (nuqs)

```typescript
// shared/hooks/useSearchState.ts
import { useQueryState, parseAsString } from 'nuqs';

export function useSearchState() {
  const [location, setLocation] = useQueryState('location', parseAsString);
  const [date, setDate] = useQueryState('date', parseAsString);
  const [theme, setTheme] = useQueryState('theme', parseAsString);

  return {
    location,
    date,
    theme,
    setLocation,
    setDate,
    setTheme,
  };
}

// 使用
function SearchBar() {
  const { location, setLocation } = useSearchState();

  return (
    <input
      value={location || ''}
      onChange={(e) => setLocation(e.target.value)}
    />
  );
}
// URL 自动更新: ?location=京都
```

### 5.5 Zustand 优化规范

```typescript
// ✅ 正确：使用选择器，精确订阅
const items = useCartStore((state) => state.items);
const addItem = useCartStore((state) => state.addItem);

// ✅ 正确：多个字段使用 shallow 比较
import { shallow } from 'zustand/shallow';
const { items, totalPrice } = useCartStore(
  (state) => ({
    items: state.items,
    totalPrice: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  }),
  shallow
);

// ❌ 错误：解构整个 store (任何变化都会重渲染)
const { items, addItem, removeItem, ... } = useCartStore();
```

### 5.6 表单状态示例 (React Hook Form)

```typescript
// features/guest/booking/components/BookingForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const bookingSchema = z.object({
  visitDate: z.string().min(1, '请选择日期'),
  visitTime: z.string().min(1, '请选择时间'),
  guestName: z.string().min(1, '请输入姓名'),
  guestPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效手机号'),
  guestEmail: z.string().email().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

function BookingForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = (data: BookingFormData) => {
    // 提交预约
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('guestName')} />
      {errors.guestName && <span>{errors.guestName.message}</span>}
      {/* ... */}
    </form>
  );
}
```

---

## 6. 数据库清理

### 6.1 删除模型

```prisma
// 删除整个模型
model CampaignPlan { ... }  // 删除
model Listing { ... }        // 删除，统一用 RentalPlan
```

### 6.2 删除字段

```prisma
model CartItem {
  // campaignPlanId String?  // 删除
}

model BookingItem {
  // campaignPlanId String?  // 删除
}

model RentalPlan {
  // tags       String[]     // 删除，已有 PlanTag 关联表
  // storeName  String?      // 删除，已有 PlanStore 关联
  // region     String?      // 删除，可从 Store.city 获取
}
```

### 6.3 迁移步骤

#### 步骤 1: 备份数据库

```bash
# 备份完整数据库
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d).sql
```

#### 步骤 2: 数据迁移 (删除模型前)

```typescript
// scripts/migrate-data-before-cleanup.ts

import prisma from '@/lib/prisma';

async function migrateData() {
  // 1. 检查 CampaignPlan 是否有关联数据
  const campaignPlanCount = await prisma.campaignPlan.count();
  console.log(`CampaignPlan 记录数: ${campaignPlanCount}`);

  // 2. 如果有 CampaignPlan 数据，迁移到 RentalPlan
  if (campaignPlanCount > 0) {
    const campaignPlans = await prisma.campaignPlan.findMany({
      include: { campaign: true },
    });

    for (const cp of campaignPlans) {
      // 检查是否已有对应的 RentalPlan
      const existing = await prisma.rentalPlan.findFirst({
        where: { name: cp.name },
      });

      if (!existing) {
        console.log(`迁移 CampaignPlan: ${cp.name}`);
        // 创建对应的 RentalPlan (isCampaign = true)
        await prisma.rentalPlan.create({
          data: {
            name: cp.name,
            price: cp.price,
            isCampaign: true,
            // ... 其他字段映射
          },
        });
      }
    }
  }

  // 3. 检查 Listing 是否有数据
  const listingCount = await prisma.listing.count();
  console.log(`Listing 记录数: ${listingCount}`);

  if (listingCount > 0) {
    console.warn('⚠️ Listing 有数据，需要手动处理迁移到 RentalPlan');
  }

  // 4. 更新 CartItem/BookingItem 中引用 campaignPlanId 的记录
  const cartItemsWithCampaign = await prisma.cartItem.count({
    where: { campaignPlanId: { not: null } },
  });
  console.log(`CartItem 引用 campaignPlanId: ${cartItemsWithCampaign}`);

  // 5. 输出迁移报告
  console.log('\n=== 迁移报告 ===');
  console.log(`CampaignPlan: ${campaignPlanCount} 条`);
  console.log(`Listing: ${listingCount} 条`);
  console.log(`CartItem 引用: ${cartItemsWithCampaign} 条`);
}

migrateData().catch(console.error);
```

#### 步骤 3: 运行数据迁移脚本

```bash
# 在开发环境验证
pnpm tsx scripts/migrate-data-before-cleanup.ts

# 确认无误后在生产环境执行
```

#### 步骤 4: 修改 schema.prisma

删除废弃的模型和字段 (见 6.1, 6.2)。

#### 步骤 5: 生成并应用迁移

```bash
# 生成迁移文件
pnpm prisma migrate dev --name cleanup-legacy-models

# 检查迁移 SQL
cat prisma/migrations/*/migration.sql

# 在生产环境应用
pnpm prisma migrate deploy
```

#### 步骤 6: 验证

```bash
# 打开 Prisma Studio 检查数据
pnpm prisma studio

# 运行应用验证功能正常
pnpm dev
```

---

## 7. AI 模块整合

> **策略**: AI 试穿代码直接整合到主项目；AI 客服保持独立仓库，通过 REST API 调用。

### 7.1 AI 试穿 (整合到 features/guest/virtual-tryon/)

从同事仓库复制代码到主项目:

```bash
# 1. 复制试穿相关代码到 features 目录
cp -r ../hefumiyabi-ai/packages/virtual-tryon/src/* src/features/guest/virtual-tryon/

# 2. 目录结构
src/features/guest/virtual-tryon/
├── components/
│   ├── TryOnUploader.tsx
│   ├── TryOnResult.tsx
│   └── index.ts
├── hooks/
│   └── useTryOn.ts
├── services/
│   └── tryonService.ts        # Replicate / Gemini API 调用
└── index.ts

# 3. 更新导入路径
# 旧: import { ... } from '@hefumiyabi/virtual-tryon'
# 新: import { ... } from '@/features/guest/virtual-tryon'
```

### 7.2 AI 客服 (独立仓库 + REST API)

保持独立仓库，部署到 AWS:

```bash
# AI 客服仓库保持独立
# 部署: AWS Lambda / ECS

# 主项目通过 REST API 调用
# src/shared/api/ai-chatbot.ts
```

```typescript
// shared/api/ai-chatbot.ts
const AI_CHATBOT_URL = process.env.NEXT_PUBLIC_AI_CHATBOT_URL;

export const aiChatbotApi = {
  async chat(message: string, sessionId: string) {
    const res = await fetch(`${AI_CHATBOT_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });
    return res.json();
  },
};
```

---

## 8. 实施阶段

> **时间预估**: 3 周 (15 个工作日)，包含缓冲时间处理意外问题

### 第 1 周: 基础架构

| 阶段 | 内容 | 预估 | 产出 |
|------|------|------|------|
| **1.1** | 建立 features/ + shared/ 目录结构 | 1 天 | 目录规范、index.ts 导出模板 |
| **1.2** | 建立 server/ 服务层 + tRPC | 1-2 天 | tRPC 基础设施、router 模板 |
| **1.3** | 数据迁移脚本 + 数据库清理 | 1-2 天 | 迁移脚本、Prisma migration |
| **1.4** | 状态管理迁移 (nuqs 替代 Context) | 1 天 | 搜索状态迁移 |

### 第 2 周: 功能模块重构

| 阶段 | 内容 | 预估 | 产出 |
|------|------|------|------|
| **2.1** | 游客端: discovery + plans | 2 天 | 搜索、浏览、套餐详情模块 |
| **2.2** | 游客端: booking (购物车+结账) | 2 天 | 预约流程模块 |
| **2.3** | 游客端: profile + auth | 1 天 | 用户中心模块 |

### 第 3 周: AI 整合 + 商户端 + 收尾

| 阶段 | 内容 | 预估 | 产出 |
|------|------|------|------|
| **3.1** | AI 试穿整合到 features/guest/ | 1 天 | virtual-tryon 模块 |
| **3.2** | 商户端整理 + UI 统一 | 2-3 天 | 商户模块 |
| **3.3** | 清理遗留代码 + 验证 | 1 天 | 删除旧组件、更新文档 |
| **3.4** | 缓冲时间 | 1 天 | 处理意外问题 |

**总计: 约 3 周**

### 里程碑

| 里程碑 | 时间点 | 验收标准 |
|--------|--------|----------|
| M1 | 第 1 周末 | tRPC 可用、数据库清理完成、搜索可用 |
| M2 | 第 2 周末 | 游客端完整预约流程可用 |
| M3 | 第 3 周末 | 全功能可用、旧代码删除、文档更新 |

---

## 9. Git 策略

```bash
# 创建重构分支
git checkout main
git pull
git checkout -b refactor/architecture

# 每个阶段完成后提交
git add .
git commit -m "refactor(stage-1.1): setup features/ and shared/ directory structure"

# 推送到远程，便于团队协作
git push -u origin refactor/architecture

# 重构完成后合并
git checkout main
git merge refactor/architecture
git push
```

### 备份策略

```bash
# 重构开始前，创建备份分支
git checkout main
git checkout -b backup/pre-refactor-2026-01-11
git push origin backup/pre-refactor-2026-01-11
```

---

## 10. 待清理清单

重构过程中发现的遗留问题，记录在此，后续统一处理:

- [ ] (待补充)

---

## 11. 决策记录

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 代码组织 | Feature-Sliced Design | 高内聚低耦合，团队并行开发 |
| **Monorepo 时机** | **分阶段，本次不用** | 降低风险，单体应用内重构即可满足需求 |
| **Feature 粒度** | **简化合并** | discovery/plans/booking 等合并相关功能，避免过度拆分 |
| 前后端交互 | tRPC + REST | TypeScript 类型安全 + Python 兼容 |
| UI 组件 | shadcn/ui + 自建 | 优先使用成熟组件库 |
| 类型定义 | Prisma + 前端扩展 | 基础用生成类型，扩展手动定义 |
| 共享代码规则 | 2+ 功能使用 → shared/ | 避免过度抽象 |
| 数据库 | 清理后保持 Supabase | 成本驱动，未来迁移 AWS |
| 服务端状态 | tRPC + React Query | 类型安全、自动缓存、内置于 tRPC |
| URL 状态 | nuqs | 替代 Context，URL 作为唯一真相来源 |
| 客户端状态 | Zustand (保持) | 轻量、够用、已有代码 |
| 表单状态 | React Hook Form + Zod | 复杂表单最佳实践 |
| 不使用 Redux | - | 项目规模不需要，工具组合已足够 |
| **iOS App** | **暂不考虑** | 优先完成 Web 重构，后续通过服务层支持 REST API |
| **时间规划** | **3 周** | 包含缓冲时间，审核反馈调整 |
