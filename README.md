# 江戸和装工房雅 - 和服租赁网站

专业和服租赁平台，基于 Next.js 14 全栈开发。支持多店铺管理、在线预约、优惠活动等完整业务功能。

## 🚀 技术栈

- **前端框架**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **数据库**: PostgreSQL + Prisma ORM
- **认证系统**: NextAuth.js + 邮箱验证
- **状态管理**: Zustand (购物车) + React State
- **邮件服务**: Nodemailer + SMTP
- **UI 组件**: Lucide React + 自定义组件
- **部署**: Vercel (推荐)

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

## 🛠️ 快速开始 - 本地开发

### 前置要求

- **Node.js**: 18.0+ 
- **包管理器**: pnpm (推荐) 或 npm
- **数据库**: PostgreSQL 14+ (本地或云服务)

### 1. 克隆项目

```bash
git clone <repository-url>
cd hefumiyabi-website
```

### 2. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

配置必需的环境变量：

```env
# 数据库连接 (必需)
DATABASE_URL="postgresql://username:password@localhost:5432/hefumiyabi"

# NextAuth 配置 (必需)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# 邮件服务配置 (必需，用于邮箱验证)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="江戸和装工房雅 <your-email@gmail.com>"
```

#### 邮件配置说明

**Gmail 配置**：
1. 开启两步验证
2. 生成应用专用密码
3. 使用应用密码而非登录密码

**其他邮件服务**：
- Outlook: `smtp-mail.outlook.com:587`
- QQ邮箱: `smtp.qq.com:587` (需要授权码)
- 163邮箱: `smtp.163.com:465`

### 4. 数据库设置

```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev

# (可选) 填充示例数据
pnpm db:seed
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

### 6. 验证功能

#### 测试用户注册和邮箱验证：
1. 访问 `/register` 注册新用户
2. 检查邮箱收件箱（可能在垃圾邮件中）
3. 点击验证链接完成注册

#### 测试预约流程：
1. 浏览套餐页面 `/plans`
2. 添加套餐到购物车
3. 选择店铺
4. 完成预约流程

#### 数据库管理：
```bash
# 查看数据库
pnpm prisma studio

# 重置数据库
pnpm db:reset

# 测试数据库连接
pnpm tsx scripts/test-db-simple.ts
```

### 常见问题

#### Q: 邮件发送失败？
- 检查 SMTP 配置是否正确
- 确认使用应用专用密码（不是登录密码）
- 查看控制台错误日志

#### Q: 数据库连接失败？
- 确认 PostgreSQL 服务正在运行
- 检查 DATABASE_URL 格式是否正确
- 确认数据库用户权限

#### Q: 页面显示错误？
- 检查环境变量是否完整配置
- 确认数据库迁移已运行
- 查看浏览器控制台错误信息

## 📊 数据库 Schema

项目包含以下核心数据模型：

### 核心业务模型
- **User** - 用户系统（邮箱验证、推荐系统）
- **Store** - 店铺信息（多店铺支持、地理位置）
- **Kimono** - 和服信息（多图片、分类标签、库存管理）
- **RentalPlan** - 租赁套餐（价格、时长、包含服务）
- **Campaign** - 优惠活动（限时折扣、周年庆典）
- **CampaignPlan** - 活动套餐（原价、活动价、限制条件）

### 预约和购物系统
- **Booking** - 预约记录（支持游客预约、多店铺预约）
- **BookingItem** - 预约项目（套餐详情、附加服务）
- **Cart** - 购物车（用户/游客购物车、过期机制）
- **CartItem** - 购物车项目（套餐选择、店铺分配）

### 用户互动
- **Favorite** - 收藏功能
- **Review** - 用户评价
- **UserBehavior** - 用户行为分析

## 🎯 功能状态

### ✅ 已完成功能
- [x] **用户系统**: 注册登录、邮箱验证、个人中心
- [x] **套餐系统**: 套餐展示、分类筛选、价格管理
- [x] **活动系统**: 优惠活动、限时折扣、周年庆典
- [x] **购物车**: 套餐选择、店铺分配、持久化存储
- [x] **预约系统**: 在线预约、多店铺支持、预约管理
- [x] **店铺管理**: 多店铺展示、地理位置、营业时间
- [x] **和服展示**: 和服图库、详情页面、收藏功能
- [x] **邮件系统**: 注册验证、预约确认、HTML模板
- [x] **响应式设计**: 移动端适配、现代化UI

### 🚧 开发中功能
- [ ] **支付系统**: 在线支付、退款处理
- [ ] **库存管理**: 实时库存、和服预订
- [ ] **管理后台**: 数据管理、订单处理
- [ ] **数据爬虫**: 从现有网站导入数据

### 📋 计划功能
- [ ] **多语言支持**: 中文、日语、英语
- [ ] **SEO优化**: 搜索引擎优化
- [ ] **数据分析**: 用户行为分析、业务报表
- [ ] **客服系统**: 在线客服、FAQ
- [ ] **移动端App**: React Native应用

## 🧪 测试和调试

### 数据库测试
```bash
# 测试数据库连接
pnpm tsx scripts/test-db-simple.ts

# 查看数据库内容
pnpm prisma studio
```

### 功能测试
```bash
# 启动开发服务器
pnpm dev

# 在浏览器中访问以下页面进行测试：
# - 首页: http://localhost:3000
# - 套餐页面: http://localhost:3000/plans
# - 活动页面: http://localhost:3000/campaigns
# - 注册页面: http://localhost:3000/register
# - 登录页面: http://localhost:3000/login
```

## 📝 开发规范

- **代码格式化**: Prettier + ESLint
- **提交规范**: Conventional Commits
- **TypeScript**: 严格模式
- **Git工作流**: Feature Branch + Pull Request

## 📚 文档

- **架构文档**: [ARCHITECTURE.md](./ARCHITECTURE.md) - 详细的系统架构和实现说明
- **预约流程**: [BOOKING_FLOW.md](./BOOKING_FLOW.md) - 预约功能设计文档
- **邮箱验证**: [EMAIL_VERIFICATION_SETUP.md](./EMAIL_VERIFICATION_SETUP.md) - 邮箱验证系统设置

## 🚀 部署

### Vercel 部署 (推荐)
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### 其他平台
- **Railway**: 支持 PostgreSQL + Node.js
- **Supabase**: 提供 PostgreSQL + Edge Functions
- **Heroku**: 传统 PaaS 平台

## 🤝 贡献

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

**项目开始日期**: 2025-01-13  
**最后更新**: 2025-01-14
