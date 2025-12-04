# Supabase 数据库连接配置指南

## 概述

Supabase 提供两种数据库连接方式，需要根据不同场景选择：

| 连接类型 | 端口 | 用户名格式 | 适用场景 |
|---------|------|-----------|---------|
| **直连 (Direct)** | 5432 | `postgres` | 本地开发、长连接、Prisma 迁移 |
| **连接池 (Pooler)** | 6543 | `postgres.{project-id}` | Serverless、Vercel、高并发 |

---

## 连接字符串格式

### 直连 (Direct Connection)

```bash
postgresql://postgres:{PASSWORD}@db.{PROJECT_REF}.supabase.co:5432/postgres?sslmode=require
```

**特点**:
- 端口: `5432`
- 用户名: `postgres`（无需项目 ID）
- 主机: `db.{PROJECT_REF}.supabase.co`
- 适合持久连接

### 连接池 (Connection Pooler)

```bash
postgresql://postgres.{PROJECT_REF}:{PASSWORD}@aws-{N}-{REGION}.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**特点**:
- 端口: `6543`
- 用户名: `postgres.{PROJECT_REF}`（**必须包含项目 ID**）
- 主机: `aws-{N}-{REGION}.pooler.supabase.com`
- 必须添加 `&pgbouncer=true` 参数

---

## 场景配置

### 场景 1: 本地开发 (推荐用直连)

**`.env.local`**:
```bash
DATABASE_URL="postgresql://postgres:{PASSWORD}@db.{PROJECT_REF}.supabase.co:5432/postgres?sslmode=require"
```

**优点**:
- 简单，无需记忆复杂的用户名格式
- 支持所有 Prisma 操作（migrate、introspect 等）
- 连接稳定，适合长时间开发

**注意**: 如果你的网络环境阻止 5432 端口，可以使用连接池。

### 场景 2: 本地开发 (使用连接池)

如果直连不可用（网络限制、公司防火墙等），使用连接池：

**`.env.local`**:
```bash
DATABASE_URL="postgresql://postgres.{PROJECT_REF}:{PASSWORD}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

**注意事项**:
- 用户名必须是 `postgres.{PROJECT_REF}` 格式
- 必须添加 `&pgbouncer=true`
- Prisma 迁移可能需要单独配置 `directUrl`

### 场景 3: Vercel 生产环境 (必须用连接池)

Vercel 等 Serverless 平台**必须**使用连接池，因为：
- Serverless 函数短生命周期，频繁创建/销毁连接
- 直连会快速耗尽数据库连接数
- 连接池复用连接，提高性能

**Vercel Environment Variables**:
```bash
DATABASE_URL="postgresql://postgres.{PROJECT_REF}:{PASSWORD}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

### 场景 4: Prisma 迁移 (需要直连)

如果使用连接池开发，运行 `prisma migrate` 时需要直连：

**`prisma/schema.prisma`**:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 用于迁移
}
```

**`.env.local`**:
```bash
# 运行时使用连接池
DATABASE_URL="postgresql://postgres.{PROJECT_REF}:{PASSWORD}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# 迁移时使用直连
DIRECT_URL="postgresql://postgres:{PASSWORD}@db.{PROJECT_REF}.supabase.co:5432/postgres?sslmode=require"
```

---

## 环境变量优先级

Next.js 加载环境变量的优先级（从高到低）：

1. **Shell 环境变量** (`~/.zshrc`, `~/.bashrc` 中的 `export`)
2. `.env.local` (本地开发，不提交到 Git)
3. `.env.development` / `.env.production` (按环境)
4. `.env` (默认)

### 常见问题：Shell 变量覆盖

如果 `~/.zshrc` 中设置了 `DATABASE_URL`，它会**覆盖** `.env.local` 中的值！

**检查方法**:
```bash
# 查看当前环境变量
echo $DATABASE_URL

# 查看 zshrc 中的设置
grep DATABASE_URL ~/.zshrc
```

**解决方案**:

**选项 A**: 删除 `~/.zshrc` 中的 `DATABASE_URL`（推荐）
```bash
# 编辑 ~/.zshrc，删除或注释 DATABASE_URL 行
# 然后重新加载
source ~/.zshrc
```

**选项 B**: 在 `~/.zshrc` 中设置正确的值
```bash
export DATABASE_URL="postgresql://postgres.{PROJECT_REF}:{PASSWORD}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

**选项 C**: 临时取消（仅当前终端会话有效）
```bash
unset DATABASE_URL
pnpm dev
```

---

## 密码中的特殊字符

如果密码包含特殊字符，必须进行 URL 编码：

| 字符 | 编码 |
|-----|------|
| `^` | `%5E` |
| `$` | `%24` |
| `@` | `%40` |
| `!` | `%21` |
| `#` | `%23` |
| `&` | `%26` |
| `=` | `%3D` |
| `?` | `%3F` |
| `/` | `%2F` |
| `:` | `%3A` |

**示例**:
- 原始密码: `9DbHJf^dwS$@5$`
- 编码后: `9DbHJf%5EdwS%24%405%24`

**编码工具**:
```bash
# Node.js
node -e "console.log(encodeURIComponent('your-password'))"

# Python
python3 -c "import urllib.parse; print(urllib.parse.quote('your-password', safe=''))"
```

---

## 快速诊断

### 错误 1: "Can't reach database server at xxx:5432"

**原因**: 尝试直连但网络不通

**解决**: 使用连接池（6543 端口）

### 错误 2: "Tenant or user not found"

**原因**: 连接池用户名格式错误

**解决**: 确保用户名是 `postgres.{PROJECT_REF}` 而不是 `postgres`

### 错误 3: "password authentication failed"

**原因**: 密码错误或特殊字符未编码

**解决**: 检查密码并正确 URL 编码

### 错误 4: 环境变量被覆盖

**诊断**:
```bash
# 检查实际使用的值
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.DATABASE_URL)"

# 对比 Shell 环境变量
echo $DATABASE_URL
```

---

## 推荐配置

### 开发环境 (使用连接池)

**`~/.zshrc`** - 删除或注释任何 `DATABASE_URL` 设置

**`.env.local`**:
```bash
# 统一使用连接池，与生产环境一致
DATABASE_URL="postgresql://postgres.{PROJECT_REF}:{PASSWORD}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# 用于 Prisma 迁移（如需）
DIRECT_URL="postgresql://postgres:{PASSWORD}@db.{PROJECT_REF}.supabase.co:5432/postgres?sslmode=require"
```

### 生产环境 (Vercel)

**Vercel Dashboard > Settings > Environment Variables**:
```bash
DATABASE_URL="postgresql://postgres.{PROJECT_REF}:{PASSWORD}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

---

## 参考链接

- [Supabase Database Connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
