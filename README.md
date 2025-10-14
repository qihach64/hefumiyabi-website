# 江戸和装工房雅 - 和服租赁网站

专业和服租赁平台，基于 Next.js 14 全栈开发。

## 🚀 技术栈

- **前端框架**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **状态管理**: Zustand + TanStack Query
- **表单验证**: React Hook Form + Zod
- **UI 组件**: Shadcn/ui (计划中)
- **部署**: Vercel (计划中)

## 📦 项目结构

```
hefumiyabi-website/
├── prisma/
│   ├── schema.prisma          # 数据库 schema
│   └── migrations/            # 数据库迁移文件
├── scripts/
│   └── test-db-simple.ts      # 数据库测试脚本
├── src/
│   ├── app/
│   │   ├── (main)/            # 主站页面
│   │   ├── layout.tsx         # 根布局
│   │   └── globals.css
│   ├── components/
│   │   └── layout/            # 布局组件
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 客户端
│   │   └── utils.ts           # 工具函数
│   └── types/
│       └── index.ts           # TypeScript 类型定义
└── package.json
```

## 🛠️ 开发环境设置

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`:

```bash
cp .env.example .env
```

然后填入您的 Supabase 数据库连接字符串：

```env
DATABASE_URL="postgresql://..."
```

**注意**: 如果密码包含特殊字符，需要进行 URL 编码：
- `^` → `%5E`
- `$` → `%24`
- `@` → `%40`

### 3. 运行数据库迁移

```bash
pnpm prisma migrate dev
```

### 4. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 📊 数据库 Schema

项目包含以下核心数据模型：

- **User** - 用户系统（支持多种登录方式）
- **Kimono** - 和服信息（图片、风格、颜色、尺寸等）
- **Store** - 店铺信息（地址、营业时间、地理位置）
- **RentalPlan** - 租赁套餐（价格、时长、包含服务）
- **Booking** - 预约记录（支持游客预约）
- **Review** - 用户评价
- **Favorite** - 收藏功能
- **UserBehavior** - 用户行为分析

## 🎯 功能规划

### ✅ 已完成
- [x] 项目初始化和基础配置
- [x] 数据库设计和迁移
- [x] 首页布局
- [x] 导航栏和页脚

### 🚧 进行中
- [ ] 和服图库页面
- [ ] 和服详情页
- [ ] 店铺信息展示
- [ ] 租赁套餐展示

### 📋 待开发
- [ ] 用户认证系统
- [ ] 在线预约流程
- [ ] 支付集成
- [ ] 数据爬虫（从现有网站导入数据）
- [ ] 用户个人中心
- [ ] 管理后台
- [ ] 多语言支持（中文、日语、英语）
- [ ] SEO 优化

## 🧪 测试

测试数据库连接：

```bash
pnpm tsx scripts/test-db-simple.ts
```

## 📝 开发规范

- **代码格式化**: Prettier
- **代码检查**: ESLint
- **提交规范**: Conventional Commits
- **TypeScript**: 严格模式

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

**开始日期**: 2025-10-13
