# 🗄️ 数据库设置指南

## ⚠️ 重要提示

由于 Supabase 数据库连接配置问题，你需要先修复数据库连接才能完成重构部署。

## 🔍 当前问题

```
Error: P1011: Error opening a TLS connection: bad certificate format
```

这个错误通常是由于 SSL/TLS 证书配置问题导致的。

## 🔧 解决方案

### 方案1: 修改 DATABASE_URL（推荐）

检查你的 `.env` 文件中的 `DATABASE_URL`，确保格式正确：

```bash
# Supabase 连接字符串格式
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# 或者不使用 pgbouncer
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

#### SSL 参数选项

尝试添加以下 SSL 参数之一：

```bash
# 选项1: 禁用 SSL（仅用于开发/测试）
DATABASE_URL="postgresql://...?sslmode=disable"

# 选项2: 要求 SSL 但不验证证书
DATABASE_URL="postgresql://...?sslmode=require"

# 选项3: 首选 SSL
DATABASE_URL="postgresql://...?sslmode=prefer"
```

### 方案2: 使用 Supabase Direct URL

Supabase 提供两种连接方式：

1. **Connection Pooling URL** (pgBouncer) - 用于无服务器环境
2. **Direct Connection URL** - 用于长连接

在 Prisma 中，建议使用 Direct URL：

```env
# .env
DATABASE_URL="postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

然后在 `prisma/schema.prisma` 中：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 方案3: 本地 PostgreSQL（开发环境）

如果你有本地 PostgreSQL：

```bash
# 1. 启动 PostgreSQL
brew services start postgresql@16

# 2. 创建数据库
createdb hefumiyabi

# 3. 更新 .env
DATABASE_URL="postgresql://localhost:5432/hefumiyabi"

# 4. 同步 schema
pnpm prisma db push
```

## ✅ 验证连接

修复连接配置后，验证是否成功：

```bash
# 测试连接
pnpm prisma db pull

# 如果成功，同步 schema
pnpm prisma db push

# 打开 Prisma Studio 验证
pnpm prisma studio
```

## 🚀 完成数据库同步后

一旦数据库连接成功，执行以下步骤完成重构部署：

### 1. 同步 Schema（添加新字段）

```bash
pnpm prisma db push
```

**预期结果**:
```
✔ Applied the following changes to the database:
  [+] Added column `campaignId` to `rental_plans`
  [+] Added column `isCampaign` to `rental_plans`
  [+] Added column `isLimited` to `rental_plans`
  [+] Added column `maxBookings` to `rental_plans`
  [+] Added column `currentBookings` to `rental_plans`
  [+] Added column `availableFrom` to `rental_plans`
  [+] Added column `availableUntil` to `rental_plans`
  [+] Added column `isFeatured` to `rental_plans`
```

### 2. 导入数据

```bash
# 清空并导入所有套餐数据
pnpm run import:unified-plans:clear
```

### 3. 更新 page.tsx（恢复完整查询）

同步成功后，更新 `src/app/(main)/plans/page.tsx`:

```typescript
const allPlans = await prisma.rentalPlan.findMany({
  include: {
    campaign: {
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
      },
    },
  },
  orderBy: [
    { isCampaign: 'desc' }, // 活动套餐优先
    { price: 'asc' },
  ],
});
```

### 4. 启动应用

```bash
pnpm dev
```

访问 http://localhost:3000/plans 验证功能。

## 🆘 常见问题

### Q: 我在哪里找到 Supabase 连接字符串？

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧 "Project Settings" → "Database"
4. 复制 "Connection string" 下的 URI

### Q: 如何重置数据库？

```bash
# 警告：这会删除所有数据！
pnpm prisma migrate reset

# 然后重新导入
pnpm run import:unified-plans:clear
```

### Q: Prisma Studio 无法连接？

确保:
1. DATABASE_URL 配置正确
2. 数据库正在运行
3. 防火墙允许连接

## 📚 相关文档

- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Database Settings](https://supabase.com/docs/guides/database)
- [PostgreSQL SSL Modes](https://www.postgresql.org/docs/current/libpq-ssl.html)

---

**修复数据库连接后，继续查看 [REFACTOR_QUICK_START.md](./REFACTOR_QUICK_START.md) 完成部署。**

