# 架构重构设计文档

> 日期: 2026-01-10
> 状态: 待实施
> 预估工期: 2 周

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

### 2.1 Monorepo 结构

```
hefumiyabi/
│
├── apps/
│   ├── web/                              # 主站 (Next.js)
│   └── ai-chatbot/                       # AI 客服 (Python)
│
├── packages/
│   ├── virtual-tryon/                    # AI 试穿库 (TypeScript)
│   └── shared-types/                     # 跨服务共享类型
│
├── docs/
│   └── plans/
│
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

### 2.2 部署架构

```
┌─────────────────────────────────────────────────────────┐
│  Vercel                                                 │
│  └── apps/web (Next.js)                                 │
│      └── packages/virtual-tryon (集成)                  │
└─────────────────────────────────────────────────────────┘
                    │
                    │ REST API
                    ▼
┌─────────────────────────────────────────────────────────┐
│  AWS (Lambda / ECS)                                     │
│  └── apps/ai-chatbot (Python FastAPI)                   │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase → AWS RDS (未来迁移)                          │
│  └── PostgreSQL                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 主站 (apps/web) 详细结构

### 3.1 目录结构

```
apps/web/src/
│
├── app/                                  # Next.js App Router
│   ├── (main)/                           # 游客端路由
│   ├── (auth)/                           # 认证路由
│   ├── (merchant)/                       # 商户端路由
│   ├── (admin)/                          # 平台端路由
│   └── api/                              # API 路由 (轻量，调用 tRPC)
│
├── features/                             # 前端功能模块 (FSD)
│   ├── guest/                            # 游客端
│   │   ├── search/
│   │   ├── plans/
│   │   ├── plan-detail/
│   │   ├── service-map/
│   │   ├── upgrades/
│   │   ├── booking/
│   │   ├── cart/
│   │   ├── virtual-tryon/
│   │   ├── favorites/
│   │   ├── profile/
│   │   └── auth/
│   │
│   ├── merchant/                         # 商户端
│   │   ├── dashboard/
│   │   ├── plans/
│   │   ├── components-manager/
│   │   ├── orders/
│   │   ├── calendar/
│   │   ├── store-settings/
│   │   ├── payouts/
│   │   └── onboarding/
│   │
│   └── platform/                         # 平台端
│       ├── dashboard/
│       ├── merchant-review/
│       ├── content-management/
│       ├── service-components/
│       ├── bookings/
│       ├── users/
│       ├── analytics/
│       └── settings/
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

```bash
# 1. 备份数据库
pg_dump -h ... -U ... -d ... > backup.sql

# 2. 修改 schema.prisma

# 3. 生成迁移
pnpm prisma migrate dev --name cleanup-legacy-models

# 4. 验证
pnpm prisma studio
```

---

## 7. AI 模块整合

### 7.1 AI 试穿 (packages/virtual-tryon)

从同事仓库整合:

```bash
# 复制 package 到 monorepo
cp -r ../hefumiyabi-ai/packages/virtual-tryon packages/

# 配置 workspace
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'

# 主站引用
# apps/web/package.json
{
  "dependencies": {
    "@hefumiyabi/virtual-tryon": "workspace:*"
  }
}
```

### 7.2 AI 客服 (apps/ai-chatbot)

从 PR #5 整合:

```bash
# 复制到 apps 目录
cp -r ../hefumiyabi-ai-chatbot apps/ai-chatbot

# 添加 Dockerfile
# apps/ai-chatbot/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 8. 实施阶段

| 阶段 | 内容 | 预估 | 产出 |
|------|------|------|------|
| **0** | 建立 Monorepo 结构 | 1 天 | turbo.json, pnpm-workspace.yaml |
| **1** | 建立 shared/ + server/ 层 | 1 天 | tRPC 基础设施 |
| **2** | 数据库清理 | 1 天 | Prisma migration |
| **3** | 游客端核心功能 (booking, cart, plans) | 3-4 天 | 功能模块 |
| **4** | 游客端其他功能 | 2 天 | 剩余模块 |
| **5** | 整合 AI 试穿 | 1 天 | packages/virtual-tryon |
| **6** | 整合 AI 客服 | 1-2 天 | apps/ai-chatbot |
| **7** | 商户端整理 + UI 统一 | 2-3 天 | 商户模块 |
| **8** | 清理遗留 + 验证 | 1 天 | 文档更新 |

**总计: 约 2 周**

---

## 9. Git 策略

```bash
# 创建重构分支
git checkout main
git pull
git checkout -b refactor/monorepo

# 重构完成后合并
git checkout main
git merge refactor/monorepo
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
| Monorepo 工具 | Turbo | AI 试穿已使用，保持统一 |
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
