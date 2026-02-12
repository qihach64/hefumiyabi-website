# Kimono One — 和服租赁电商平台

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.17-2D3748)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-677%20passed-brightgreen)]()

面向日本和服租赁市场的全栈电商平台。顾客可在线浏览套餐、加入购物车、预约到店体验；商家可独立管理套餐、组件和订单；管理员负责审核和全局配置。

## 核心功能

- **套餐浏览与筛选** — 按主题/标签/价格/店铺多维度搜索，支持 URL 状态同步
- **购物车与预约** — Zustand 本地购物车 → 选择日期时段 → 确认预约
- **商家后台** — 套餐管理、组件库管理、订单处理、数据看板
- **管理后台** — 商家审核、服务审核、用户管理、系统设置
- **AI 功能** — 智能客服聊天机器人、虚拟和服试穿
- **互动地图** — 和服服务热点地图，可视化展示各部位搭配

## 技术栈

| 类别     | 技术                                                          |
| -------- | ------------------------------------------------------------- |
| 框架     | Next.js 15.5 (App Router + Turbopack), React 19, TypeScript 5 |
| 数据库   | PostgreSQL + Prisma 6.17 (25 个数据模型)                      |
| 认证     | NextAuth.js 5.0 (邮箱/密码 + OAuth)                           |
| API      | tRPC 11 (7 个 Router) + Server Components                     |
| 状态管理 | Zustand (购物车), React Query (服务端), nuqs (URL)            |
| 样式     | Tailwind CSS 4, Framer Motion, Lucide Icons                   |
| 测试     | Vitest + Testing Library (677+ 测试用例)                      |
| 代码质量 | ESLint, Prettier, Husky + lint-staged, Knip                   |
| 存储     | AWS S3 (图片), Supabase (数据库托管)                          |

## 快速开始

**前置要求:** Node.js 20+, pnpm, PostgreSQL

```bash
# 克隆并安装
git clone <repo-url>
cd hefumiyabi-website
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，至少配置 DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET

# 初始化数据库
pnpm prisma db push
pnpm db:seed

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看效果。详细指南见 [快速开始文档](./docs/guides/quick-start.md)。

## 常用命令

```bash
# 开发
pnpm dev                # 启动开发服务器 (Turbopack)
pnpm build              # 生产构建
pnpm start              # 启动生产服务器

# 测试与质量
pnpm test               # 运行测试 (监视模式)
pnpm test --run         # 单次运行全部测试
pnpm typecheck          # TypeScript 类型检查
pnpm lint               # ESLint 检查
pnpm format:check       # Prettier 格式检查

# 数据库
pnpm prisma studio      # 数据库可视化管理
pnpm prisma db push     # 推送 schema 变更
pnpm db:seed            # 填充种子数据
pnpm db:reset           # 重置并重新填充数据库
```

## 项目结构

```
src/
├── app/                    # Next.js App Router (页面 + API)
│   ├── (main)/            #   公开页面 (带全局 layout)
│   ├── (auth)/            #   认证页面 (login, register)
│   └── api/               #   API 路由 (tRPC 入口 + 管理接口)
├── server/                # 服务端三层架构
│   ├── schemas/           #   Zod 输入校验
│   ├── services/          #   业务逻辑层 (8 个 service)
│   └── trpc/              #   tRPC 路由 (7 个 router)
├── features/              # 业务功能模块 (Feature-Sliced Design)
│   ├── guest/             #   游客功能 (搜索、套餐、预约)
│   └── merchant/          #   商家功能
├── components/            # 通用 UI 组件
├── store/                 # Zustand 状态管理
├── lib/                   # 工具函数
└── types/                 # TypeScript 类型定义
```

## 文档

### 架构

- [架构概览](./docs/architecture/overview.md) — 系统整体设计
- [设计系统](./docs/architecture/design-system.md) — UI/UX 规范
- [产品哲学](./docs/architecture/product-philosophy.md) — 产品理念
- [产品定位](./docs/architecture/product-positioning.md) — 市场策略

### 功能

- [预约流程](./docs/features/booking-flow.md) — 端到端预约设计
- [套餐系统](./docs/features/rental-plan.md) — 租赁套餐模型
- [标签系统](./docs/features/tag-system.md) — 套餐标签与筛选
- [互动地图](./docs/features/interactive-map.md) — 和服服务热点图
- [首页设计](./docs/features/homepage-redesign.md) — 首页改版方案

### 开发指南

- [快速开始](./docs/guides/quick-start.md) — 本地环境搭建
- [数据库设置](./docs/guides/database-setup.md) — PostgreSQL 配置
- [URL 状态管理](./docs/guides/url-state-management.md) — nuqs 使用指南
- [部署指南](./docs/guides/deployment.md) — Vercel 部署

### AI 开发者

项目配置文件 [CLAUDE.md](./CLAUDE.md) 包含完整的 AI 工作上下文，Claude Code 会自动读取。

## 贡献

请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发流程和代码规范。

## License

MIT License
