# 江戸和装工房雅 - 和服租赁平台

专业和服租赁电商平台，支持多店铺管理、在线预约、优惠活动等完整业务功能。

## 技术栈

- **框架**: Next.js 15.5 (App Router) + React 19 + TypeScript
- **数据库**: PostgreSQL + Prisma ORM (Supabase 托管)
- **认证**: NextAuth.js 5.0
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand (购物车) + React Query (服务端状态)

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境
cp .env.example .env.local
# 编辑 .env.local 配置数据库和其他服务

# 启动开发服务器
pnpm dev
```

详细设置指南请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 开发命令

```bash
pnpm dev           # 启动开发服务器
pnpm build         # 构建生产版本
pnpm test          # 运行测试
pnpm prisma studio # 打开数据库管理界面
```

## 文档

### 架构与设计
- [架构概览](./docs/architecture/overview.md) - 系统架构和模块划分
- [设计系统](./docs/architecture/design-system.md) - UI/UX 设计规范
- [产品定位](./docs/architecture/product-positioning.md) - 产品策略和差异化

### 功能说明
- [预约流程](./docs/features/booking-flow.md) - 完整预约流程设计
- [套餐系统](./docs/features/rental-plan.md) - 租赁套餐模型
- [标签系统](./docs/features/tag-system.md) - 套餐标签和筛选

### 开发指南
- [快速开始](./docs/guides/quick-start.md) - 本地开发环境搭建
- [数据库设置](./docs/guides/database-setup.md) - PostgreSQL 配置
- [部署指南](./docs/guides/deployment.md) - Vercel 部署说明

### Claude Code 用户
项目配置文件 [CLAUDE.md](./CLAUDE.md) 包含完整的项目上下文，Claude 会自动读取。

## 贡献

请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发流程和代码规范。

## License

MIT License
