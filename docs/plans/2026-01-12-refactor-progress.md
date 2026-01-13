# Architecture Refactor Progress

> 最后更新: 2026-01-12

## 概览

| 阶段 | 状态 | 进度 |
|------|------|------|
| Week 1: Foundation | ✅ 完成 | 100% |
| Week 2: Feature Migration | 🔲 待开始 | 0% |
| Week 3: AI + Cleanup | 🔲 待开始 | 0% |

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

## 下一步: Week 2

### 待完成任务

1. **guest/discovery** - 搜索栏、过滤器迁移
2. **guest/plans** - 套餐列表、详情页迁移
3. **guest/booking** - 购物车、预约流程迁移
4. **guest/profile** - 用户中心迁移
5. **删除旧 Context** - SearchStateContext 等

### 注意事项

- 需要先理解现有组件的依赖关系
- 逐步迁移，每步验证功能正常
- 保持 git 历史清晰，每个模块一个 commit

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
