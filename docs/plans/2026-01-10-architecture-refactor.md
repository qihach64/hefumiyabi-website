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
│   │   ├── useMediaQuery.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── contexts/
│   │   └── SearchStateContext.tsx
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

## 5. 数据库清理

### 5.1 删除模型

```prisma
// 删除整个模型
model CampaignPlan { ... }  // 删除
model Listing { ... }        // 删除，统一用 RentalPlan
```

### 5.2 删除字段

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

### 5.3 迁移步骤

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

## 6. AI 模块整合

### 6.1 AI 试穿 (packages/virtual-tryon)

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

### 6.2 AI 客服 (apps/ai-chatbot)

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

## 7. 实施阶段

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

## 8. Git 策略

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

## 9. 待清理清单

重构过程中发现的遗留问题，记录在此，后续统一处理:

- [ ] (待补充)

---

## 10. 决策记录

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 代码组织 | Feature-Sliced Design | 高内聚低耦合，团队并行开发 |
| Monorepo 工具 | Turbo | AI 试穿已使用，保持统一 |
| 前后端交互 | tRPC + REST | TypeScript 类型安全 + Python 兼容 |
| UI 组件 | shadcn/ui + 自建 | 优先使用成熟组件库 |
| 类型定义 | Prisma + 前端扩展 | 基础用生成类型，扩展手动定义 |
| 共享代码规则 | 2+ 功能使用 → shared/ | 避免过度抽象 |
| 数据库 | 清理后保持 Supabase | 成本驱动，未来迁移 AWS |
