# 🚀 快速启动指南

## 前置要求

在运行网站之前，请确保已安装以下工具：

### 1. 安装 Node.js (推荐 v20.x)

**使用 Homebrew (macOS)**:
```bash
brew install node@20
```

**或使用 nvm (跨平台)**:
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端后，安装 Node.js
nvm install 20
nvm use 20
```

### 2. 安装 pnpm

```bash
npm install -g pnpm
# 或
brew install pnpm
```

验证安装：
```bash
node --version   # 应显示 v20.x.x
pnpm --version   # 应显示 8.x.x 或更高
```

---

## 🎯 启动步骤

### 第一次运行（完整设置）

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的数据库连接信息

# 3. 生成 Prisma 客户端
pnpm prisma generate

# 4. 推送数据库 schema（包含标签系统）
pnpm prisma db push

# 5. 初始化标签系统 demo 数据
pnpm tsx scripts/seed-tags-demo.ts

# 6. 启动开发服务器
pnpm dev
```

### 日常开发（已设置过）

```bash
# 直接启动
pnpm dev
```

服务器将在 **http://localhost:3000** 启动

---

## 📊 标签系统 Demo 快速测试

启动网站后，按照以下流程测试标签系统：

### 1. 验证种子数据

打开 Prisma Studio 查看数据：
```bash
pnpm prisma studio
```

检查以下表：
- `tag_categories` - 应有 3 个分类（使用场景、价格区间、服务等级）
- `tags` - 应有 10 个标签
- `plan_tags` - 应有标签关联记录

### 2. 测试 API 端点

**获取所有标签分类**:
```bash
curl http://localhost:3000/api/tags?showInFilter=true
```

**获取管理员标签列表** (需要登录):
```bash
# 先登录获取 session cookie
# 然后
curl -H "Cookie: next-auth.session-token=xxx" \
  http://localhost:3000/api/admin/tags/categories
```

### 3. 测试前端页面

- **套餐列表**: http://localhost:3000/plans
  - 左侧应显示标签筛选器（使用场景、价格区间、服务等级）

- **管理员界面**: http://localhost:3000/admin/tags
  - 需要以 ADMIN 角色登录
  - 管理标签分类和标签

- **商家界面**: http://localhost:3000/merchant/plans
  - 需要以 MERCHANT 角色登录
  - 编辑套餐时可选择标签

---

## 🔧 常见问题

### 数据库连接失败

检查 `.env.local` 中的 `DATABASE_URL`：
```env
# 本地 PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/kimono_db"

# Supabase（生产环境）
DATABASE_URL="postgresql://user:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
```

### Prisma 客户端错误

重新生成客户端：
```bash
pnpm prisma generate
```

### 端口被占用

修改端口启动：
```bash
PORT=3001 pnpm dev
```

### 标签数据不显示

重新运行种子脚本：
```bash
pnpm tsx scripts/seed-tags-demo.ts
```

---

## 📚 相关文档

- **标签系统设计**: [docs/tag-management-system.md](docs/tag-management-system.md)
- **标签系统 Demo**: [docs/TAG_SYSTEM_DEMO.md](docs/TAG_SYSTEM_DEMO.md)
- **API 实现文档**: [docs/TAG_SYSTEM_API_IMPLEMENTATION.md](docs/TAG_SYSTEM_API_IMPLEMENTATION.md)
- **项目架构**: [CLAUDE.md](CLAUDE.md)

---

## 🎯 下一步开发任务

查看待办事项：
1. ✅ 数据库 schema（已完成）
2. ✅ 种子数据脚本（已完成）
3. ✅ API 层（已完成）
4. ⏳ 管理员标签管理 UI
5. ⏳ 商家标签编辑 UI
6. ⏳ 前端筛选器集成

**预计剩余时间**: 9 小时

---

## 💡 提示

- 使用 `pnpm dev --turbopack` 获得更快的热更新
- Prisma Studio 是查看数据库的最佳工具：`pnpm prisma studio`
- API 测试可以使用 Postman 或浏览器 DevTools
- 检查控制台日志以调试 API 错误
