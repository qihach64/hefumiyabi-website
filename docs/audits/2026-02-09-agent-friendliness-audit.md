# Agent 友好性审计报告

> 审计日期: 2026-02-09
> 审计范围: CLAUDE.md 准确性、文档覆盖度、Skills 缺口、代码可读性、Agent 工作流可操作性
> 总评分: **6.5 / 10**

---

## 一、CLAUDE.md 准确性审计

### 1.1 目录结构 — 偏差较大

CLAUDE.md 中的目录结构与实际代码存在多处不一致：

| 问题类型 | CLAUDE.md 描述 | 实际情况 |
|---------|---------------|---------|
| 路径错误 | `src/components/plans/` | 实际为 `src/components/plan/`（单数）和 `src/components/PlanCard/` |
| 缺失目录 | 未列出 | `src/types/` — 共 5 个类型定义文件 |
| 缺失目录 | 未列出 | `src/config/` — 配置目录 |
| 缺失目录 | 未列出 | `src/test/` — 测试工具 |
| 缺失目录 | 未列出 | `src/shared/lib/`, `src/shared/ui/`, `src/shared/components/` |
| 缺失目录 | 未列出 | `src/components/auth/`, `src/components/kimono/`, `src/components/merchant/` |
| 缺失目录 | 未列出 | `src/components/plan/` 子模块: InteractiveKimonoMap, JourneyTimeline, ServiceMap, SocialProof, VisualHub |
| 缺失目录 | 未列出 | `src/components/providers/`, `src/components/shared/`, `src/components/ui/`, `src/components/virtual-tryon/` |
| 缺失模块 | 未列出 | `src/features/merchant/` — 商家功能模块 |
| 缺失模块 | 未列出 | `src/features/platform/` — 平台功能模块 |

### 1.2 路由结构 — 严重缺失

CLAUDE.md 列出 9 个路由，实际存在 **20+** 个路由：

**未列出的路由：**

| 路由 | 说明 |
|------|------|
| `/about` | 关于我们 |
| `/contact` | 联系我们 |
| `/faq` | 常见问题 |
| `/campaigns` | 活动列表 |
| `/kimonos` | 和服列表 |
| `/search` | 搜索结果页 |
| `/profile` | 用户资料 |
| `/virtual-tryon` | AI 试穿 |
| `/investor-update` | 投资者更新 |
| `/merchants` | 商家列表 |
| `/login` | 登录 |
| `/register` | 注册 |
| `/verify-email` | 邮箱验证 |

另有两个管理页面位于 `src/app/admin/`（非 `(main)` 路由组下），未在文档中说明。

### 1.3 API 路由 — 部分缺失

**未列出的 API 路由：**
- `/api/kimonos` — 和服 CRUD
- `/api/service-components` — 服务组件
- `/api/test-db` — 数据库测试
- `/api/auth` — NextAuth 认证 API

**tRPC 路由更新：**
CLAUDE.md 列出 `plan.list, plan.getById, plan.featured, health.check`，但实际还有 `plan.searchAll` 和 `plan.relatedPlans` 两个 procedure。

### 1.4 数据模型 — 严重简化

CLAUDE.md 仅描述 7 个核心模型，但 Prisma schema 实际定义了 **36 个模型**：

**完全未提及的重要模型：**
- `Kimono`, `KimonoImage` — 和服实体
- `Theme` — 主题
- `Tag`, `TagCategory`, `PlanTag` — 标签系统
- `ServiceComponent`, `MerchantComponent`, `PlanComponent` — 服务组件体系
- `MapTemplate`, `MapHotspot` — 地图模板
- `Campaign` — 活动
- `Merchant` — 商家
- `Listing` — 商品列表
- `PlanUpgrade` — 套餐升级
- `Favorite`, `Review`, `VirtualTryOn` — 用户交互
- `Account`, `Session`, `VerificationToken` — NextAuth 认证
- 其他: `UserPreference`, `KimonoStore`, `BookingKimono`, `SocialPost`, `Payout`, `MerchantReview`, `UserBehavior`

### 1.5 useSearchState Hook — 轻微偏差

CLAUDE.md 示例缺少实际存在的 `storeId`, `region`, `clearFilters` 参数。

### 1.6 Tech Stack 版本 — 基本准确

| 技术 | CLAUDE.md | 实际版本 | 状态 |
|------|-----------|---------|------|
| Next.js | 15.5 | 15.5.7 | OK |
| Prisma | 6.17 | 6.17.1 | OK |
| NextAuth | 5.0 | 5.0.0-beta.29 | 应标注 beta |
| Zustand | 未标版本 | 5.0.8 | 可补充 |
| Vitest | 未标版本 | 3.2.4 | 可补充 |
| Tailwind CSS | 4 | ^4 | OK |

### 1.7 常用命令 — 准确

所有列出的命令均可用。

---

## 二、文档覆盖度审计

### 2.1 docs/architecture/ — 覆盖较好

| 文件 | 大小 | 状态 |
|------|------|------|
| overview.md | 37KB | 内容丰富，可能需要更新 |
| design-system.md | 13KB | 完整 |
| product-philosophy.md | 6.7KB | 完整 |
| product-positioning.md | 13.7KB | 完整 |
| ui-ux-guide.md | 16KB | 完整 |
| aws-image-system-design.md | 29KB | 完整 |
| decisions/ | 子目录 | 架构决策记录 |

### 2.2 docs/features/ — 覆盖较广但可能过时

共 15 个文档，涵盖预约、套餐、标签、地图、主题等。部分文档非常长（如 `rental-plan.md` 61KB、`tag-system.md` 54KB），可能包含过时内容。

**缺失的功能文档：**
- AI 试穿 (Virtual Try-On) 功能
- 购物车功能
- 用户认证流程
- 商家后台功能
- 管理后台功能
- 收藏功能

### 2.3 docs/guides/ — 实用但有断链

| 文件 | 状态 |
|------|------|
| quick-start.md | 完整 |
| database-setup.md | 完整 |
| database-connection.md | 完整 |
| deployment.md | 完整 |
| url-state-management.md | 完整 |
| supabase-setup.md | 完整 |
| performance-profiling.md | 完整 |

**问题：** CONTRIBUTING.md 引用了 `docs/guides/setup.md`，但该文件不存在。应改为 `docs/guides/quick-start.md`。

### 2.4 docs/plans/ — 需要归档

共 11 个计划文档（2026-01-10 至 2026-02-09）。较早的计划（如 2026-01-10 ~ 2026-01-22 的重构计划）可能已完成，应归档到 `docs/archive/`。

### 2.5 docs/brainstorms/ — 正常

共 7 个头脑风暴文档。作为历史记录保留合理。

### 2.6 docs/archive/ — 存在

包含 `2024-11/`（39 个文件）和 `2025-12-design-docs/` 两个子目录。归档机制已建立。

### 2.7 其他目录

- `docs/solutions/` — integration-issues 和 performance-issues 子目录
- `docs/performance/` — 3 个性能基线/验证文档
- `docs/checklists/` — 1 个部署检查清单
- `docs/prompts/` — 新增，未追踪

---

## 三、Skills 缺口分析

### 3.1 现有 Skills

| Skill/Agent | 类型 | 质量评分 |
|-------------|------|---------|
| `ui-design-system` | Skill | 9/10 — 非常详细，包含设计令牌、触发条件、使用指南 |
| `kimono-rental-competitor-research` | Agent | 8/10 — 结构清晰，研究框架完整 |

### 3.2 推荐新增 Skills

| 优先级 | Skill 名称 | 简要描述 |
|--------|-----------|---------|
| **P0** | `database-operations` | Prisma schema 变更流程、迁移策略、数据库种子数据管理。覆盖 36 个模型的关系和约束 |
| **P0** | `testing-strategy` | 测试模式（happy-dom 环境、mock 策略）、测试文件位置、当前 20 个测试文件的组织方式 |
| **P0** | `new-feature-workflow` | 端到端添加新功能的检查清单：页面 → 组件 → API → 类型 → 测试 → 文档 |
| **P1** | `api-development` | tRPC router 和 REST API 的创建模式、Zod schema 定义、错误处理 |
| **P1** | `state-management` | nuqs URL 状态、Zustand store、React Context 的使用边界和最佳实践 |
| **P1** | `performance-optimization` | Lighthouse 优化、bundle 分析、动态导入、ISR 缓存策略 |
| **P2** | `deployment-workflow` | Vercel 部署流程、环境变量管理、Supabase/AWS 数据库连接 |
| **P2** | `booking-flow` | 预约系统的业务逻辑、状态机、边界条件处理 |

---

## 四、代码可读性审计

### 4.1 抽样文件评估

| 文件 | 注释质量 | 类型安全 | 可读性 |
|------|---------|---------|--------|
| `server/services/plan.service.ts` | 优秀 — 区域注释、类型守卫文档化 | 优秀 | 8/10 |
| `shared/hooks/useSearchState.ts` | 良好 — 简洁但足够 | 优秀 | 9/10 |
| `store/cart.ts` | 优秀 — 每个字段都有中文注释 | 优秀 | 9/10 |
| `app/(main)/page.tsx` | 良好 — ISR 策略注释清晰 | 良好 | 8/10 |
| `app/(main)/HomeClient.tsx` | 良好 — 动态导入有注释说明 | 良好 | 7/10 |
| `server/trpc/routers/plan.ts` | 良好 — 关键 procedure 有注释 | 优秀 | 8/10 |
| `contexts/SearchBarContext.tsx` | 良好 — 接口注释完整 | 良好 | 7/10 |
| `components/PlanCard/index.tsx` | 良好 — 变体样式有文档 | 优秀 | 8/10 |

### 4.2 发现的问题

1. **调试日志未清理**: `SearchBarContext.tsx` 中留有 `console.log` 调试语句（第 54 行），生产代码不应保留
2. **注释语言不统一**: 大部分文件中文注释为主，但 `useSearchState.ts` 使用英文注释（如 `// Basic search params`、`// Filter params`），与 CLAUDE.md 要求的"注释用中文"不完全一致
3. **类型定义分散**: 类型定义分布在 `src/types/`、组件内联、service 文件内，缺乏统一的类型导出策略文档

### 4.3 总体评价

代码可读性 **7.5/10**。接口定义注释优秀，核心业务逻辑有足够注释。主要改进点是注释语言统一和移除调试代码。

---

## 五、Agent 工作流可操作性审计

### 5.1 添加新页面 — 基本可操作 (7/10)

CLAUDE.md 提供 3 步指南，Agent 可以跟随执行。

**缺失信息：**
- 未说明如何设置页面 metadata（SEO title, description）
- 未说明 layout.tsx 的复用规则
- 未说明 middleware 或权限控制（如商家/管理员页面）
- 未说明 `(main)` vs `(auth)` vs 顶层路由组的选择标准

### 5.2 添加新组件 — 基本可操作 (6/10)

CLAUDE.md 提供 3 步指南，但缺乏细节。

**缺失信息：**
- 未提供组件模板或代码示例
- 未说明 Server Component vs Client Component 的判断标准（仅一句"需要交互时用 `'use client'`"）
- 未说明 `src/components/` 和 `src/features/` 和 `src/shared/` 三者的边界
- 未说明 `index.ts` 导出桶文件的组织规范

### 5.3 修改数据模型 — 勉强可操作 (5/10)

CLAUDE.md 提供 3 步指南，但过于简化。

**缺失信息：**
- 未说明 `prisma generate` 步骤
- 未说明生产环境迁移策略（`db push` vs `migrate`）
- 未说明 36 个模型之间的关系图
- 未说明类型定义如何同步更新（`src/types/` 中的手动类型 vs Prisma 自动生成类型）

### 5.4 添加 API 路由 — 不可操作 (3/10)

CLAUDE.md 仅列出 API 路由清单，**未提供添加新 API 的任何指南**。

**需要补充：**
- tRPC router 创建模板（参考 `plan.ts` 的结构）
- REST API 创建模板（`route.ts` 的标准写法）
- 错误处理和验证模式
- 认证/授权中间件使用方式

### 5.5 运行和调试测试 — 基本可操作 (7/10)

CLAUDE.md 提供测试命令和模板。项目有 20 个测试文件可作参考。

**缺失信息：**
- 未说明 mock 策略（如何 mock Prisma、tRPC、外部 API）
- 未说明测试数据准备方式
- 未说明组件测试 vs Hook 测试 vs 服务测试的区别
- 未说明 `src/test/` 目录中测试工具的用途

---

## 六、综合评估

### 6.1 评分明细

| 维度 | 评分 | 说明 |
|------|------|------|
| CLAUDE.md 准确性 | 5/10 | 目录结构、路由、API、数据模型均有较大偏差 |
| 文档覆盖度 | 7/10 | 架构和功能文档丰富，但部分过时，有断链 |
| Skills 覆盖 | 4/10 | 仅 2 个 skill/agent，缺少数据库、测试、API 等核心开发流程 |
| 代码可读性 | 7.5/10 | 类型注释优秀，注释质量良好，少数问题 |
| Agent 工作流可操作性 | 5.5/10 | 基本任务可完成，但缺乏模板和边界条件说明 |
| **综合评分** | **6.5/10** | **文档基础好，但准确性和 skill 覆盖严重不足** |

### 6.2 改进优先级

#### P0 — 立即修复（影响 Agent 每次使用）

1. **更新 CLAUDE.md 目录结构** — 补充所有缺失目录，修正错误路径
2. **更新 CLAUDE.md 路由表** — 添加所有实际路由
3. **更新 CLAUDE.md API 路由表** — 添加缺失的 API 路由和 tRPC procedure
4. **更新 CLAUDE.md 数据模型** — 至少列出所有 36 个模型名称和简要说明
5. **修复 CONTRIBUTING.md 断链** — `docs/guides/setup.md` → `docs/guides/quick-start.md`

#### P1 — 短期补充（提升 Agent 效率）

6. **创建 `database-operations` skill** — Prisma 操作流程
7. **创建 `testing-strategy` skill** — 测试模式和 mock 策略
8. **创建 `new-feature-workflow` skill** — 端到端开发检查清单
9. **在 CLAUDE.md 添加"添加 API 路由"任务指南**
10. **清理调试 console.log** — `SearchBarContext.tsx` 等文件

#### P2 — 中期完善（提升 Agent 能力上限）

11. **归档已完成的计划文档** — `docs/plans/` 中 2026-01-10 到 2026-01-22 的文件
12. **创建 `api-development` skill**
13. **创建 `state-management` skill**
14. **创建 `performance-optimization` skill**
15. **补充缺失的功能文档** — AI 试穿、购物车、认证、商家后台

---

## 七、附录

### A. 实际目录结构完整版

```
src/
├── app/
│   ├── (auth)/                    # 认证页面
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── (main)/                    # 公开页面 (header/footer layout)
│   │   ├── about/
│   │   ├── admin/                 # 管理后台（另有 src/app/admin/）
│   │   ├── booking/
│   │   ├── campaigns/
│   │   ├── cart/
│   │   ├── contact/
│   │   ├── faq/
│   │   ├── investor-update/
│   │   ├── kimonos/
│   │   ├── merchant/
│   │   ├── merchants/
│   │   ├── plans/
│   │   ├── profile/
│   │   ├── search/
│   │   ├── stores/
│   │   ├── test-upload/
│   │   └── virtual-tryon/
│   ├── admin/                     # 管理后台（独立 layout）
│   │   ├── analytics/
│   │   ├── calendar/
│   │   └── tags/
│   └── api/
│       ├── admin/
│       ├── auth/
│       ├── bookings/
│       ├── chatbot/
│       ├── favorites/
│       ├── kimonos/
│       ├── locations/
│       ├── merchant/
│       ├── plans/
│       ├── service-components/
│       ├── stores/
│       ├── tags/
│       ├── test-db/
│       ├── themes/
│       ├── trpc/
│       ├── upload/
│       └── virtual-tryon/
├── components/
│   ├── auth/
│   ├── home/
│   ├── kimono/
│   ├── layout/
│   ├── merchant/
│   ├── plan/                      # 套餐详情子组件
│   │   ├── InteractiveKimonoMap/
│   │   ├── JourneyTimeline/
│   │   ├── ServiceMap/
│   │   ├── SocialProof/
│   │   └── VisualHub/
│   ├── PlanCard/
│   ├── providers/
│   ├── shared/
│   ├── ui/
│   └── virtual-tryon/
├── config/
├── contexts/
├── features/
│   ├── guest/
│   │   ├── booking/
│   │   ├── discovery/
│   │   └── plans/
│   ├── merchant/
│   └── platform/
├── lib/
├── server/
│   ├── services/
│   └── trpc/routers/
├── shared/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── ui/
├── store/
├── test/
└── types/
```

### B. Prisma 模型完整列表 (36 个)

User, Account, Session, VerificationToken, UserPreference, Kimono, KimonoImage, Merchant, Store, KimonoStore, Theme, RentalPlan, PlanStore, Listing, Cart, CartItem, Booking, BookingItem, BookingKimono, Favorite, Review, UserBehavior, VirtualTryOn, Campaign, SocialPost, Payout, MerchantReview, TagCategory, Tag, PlanTag, MapTemplate, MapHotspot, ServiceComponent, MerchantComponent, PlanUpgrade, PlanComponent

### C. 现有测试文件 (20 个)

```
src/components/merchant/__tests__/PlanComponentEditor.test.tsx
src/features/guest/booking/components/__tests__/CollapsibleDateTimePicker.test.tsx
src/features/guest/booking/components/__tests__/ContactForm.test.tsx
src/features/guest/booking/components/__tests__/InstantBookingModal.test.tsx
src/features/guest/booking/components/__tests__/MiniBookingBar.test.tsx
src/features/guest/booking/components/__tests__/MiniCalendar.test.tsx
src/features/guest/booking/components/__tests__/PriceBreakdown.test.tsx
src/features/guest/booking/components/__tests__/TimeSlotPicker.test.tsx
src/features/guest/discovery/components/__tests__/DateDropdown.test.tsx
src/features/guest/discovery/components/__tests__/HeroSearchBar.test.tsx
src/features/guest/discovery/components/__tests__/LocationDropdown.test.tsx
src/features/guest/discovery/components/__tests__/ThemeDropdown.test.tsx
src/features/guest/plans/components/__tests__/PlanCardPreview.test.tsx
src/features/guest/plans/hooks/__tests__/usePlanDetail.test.ts
src/features/guest/plans/hooks/__tests__/usePlanList.test.ts
src/features/merchant/plans/components/__tests__/PlanCardManagement.test.tsx
src/lib/__tests__/kimono-map.test.ts
src/server/services/__tests__/plan.service.test.ts
src/server/trpc/routers/__tests__/plan.test.ts
src/shared/hooks/__tests__/useSearchState.test.ts
```
