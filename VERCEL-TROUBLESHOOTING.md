# Vercel 部署故障排除指南

## 🔴 问题：数据库连接失败

### 错误信息
```
Can't reach database server at `db.epxyusnhvqfhfbaqgsli.supabase.co:5432`
```

---

## ✅ 解决步骤

### 步骤 1: 验证本地数据库连接

首先确认数据库本身没问题：

```bash
node scripts/verify-db-connection.js
```

如果看到 "🎉 所有数据库测试通过！"，说明数据库正常，问题在 Vercel 配置。

---

### 步骤 2: 检查 Vercel 环境变量

#### 2.1 登录 Vercel 控制台

访问: https://vercel.com/dashboard

#### 2.2 进入项目设置

1. 选择您的项目
2. 点击 **Settings** 标签
3. 点击左侧 **Environment Variables**

#### 2.3 验证 DATABASE_URL

**正确的格式应该是:**

```
postgresql://postgres:9DbHJf%5EdwS%24%405%24@db.epxyusnhvqfhfbaqgsli.supabase.co:5432/postgres?sslmode=require
```

**关键检查点:**

- ✅ 特殊字符必须 URL 编码:
  - `^` → `%5E`
  - `$` → `%24`
  - `@` → `%40`

- ✅ 必须包含 `?sslmode=require`

- ✅ 端口号是 `5432`

- ✅ 数据库名是 `postgres`

#### 2.4 环境变量应该配置在哪些环境

**重要**: 需要为所有三个环境配置：

- ☑️ Production
- ☑️ Preview
- ☑️ Development

点击每个环境变量右侧的复选框，确保全部选中。

---

### 步骤 3: 重新部署

**关键**: 修改环境变量后，必须重新部署才能生效！

#### 方法 1: 通过 Vercel 控制台

1. 进入项目的 **Deployments** 页面
2. 找到最新的部署
3. 点击右侧的 **三个点 (...)** 菜单
4. 选择 **Redeploy**
5. 勾选 **Use existing Build Cache** (可选，加快构建)
6. 点击 **Redeploy**

#### 方法 2: 通过 Git 推送

```bash
# 做一个小修改并提交
git commit --allow-empty -m "chore: 触发 Vercel 重新部署"
git push
```

---

### 步骤 4: 测试数据库连接

部署完成后，访问测试 API：

```
https://你的域名.vercel.app/api/test-db
```

#### 成功的响应示例：

```json
{
  "success": true,
  "message": "数据库连接正常",
  "data": {
    "rentalPlans": 76,
    "users": 20,
    "bookings": 89
  },
  "environment": {
    "nodeEnv": "production",
    "hasDbUrl": true,
    "dbUrlPrefix": "postgresql://postgres:9DbHJf..."
  }
}
```

#### 失败的响应示例：

```json
{
  "success": false,
  "message": "数据库连接失败",
  "error": {
    "code": "P1001",
    "message": "Can't reach database server..."
  },
  "troubleshooting": [...]
}
```

---

### 步骤 5: 检查 Vercel 部署日志

如果测试 API 仍然失败：

1. 进入 Vercel 项目页面
2. 点击最新的部署
3. 点击 **View Function Logs**
4. 查找错误信息

**常见错误模式:**

#### 错误 1: 环境变量未设置
```
environment: { hasDbUrl: false }
```
→ 回到步骤 2，重新配置环境变量

#### 错误 2: DATABASE_URL 格式错误
```
error: { code: "P1017", message: "Invalid database string" }
```
→ 检查 URL 编码和格式

#### 错误 3: SSL 模式未配置
```
error: { message: "SSL connection required" }
```
→ 确保 URL 包含 `?sslmode=require`

---

## 🔍 进一步诊断

### 检查 Supabase 项目状态

1. 登录 Supabase: https://supabase.com/dashboard
2. 选择您的项目
3. 检查项目状态:
   - ✅ **Active** - 正常
   - ⏸️ **Paused** - 需要点击 "Resume" 恢复

### 检查 Supabase 连接池

Supabase 免费版连接池限制：

- **Direct Connection**: 最多 3 个并发连接
- **Pooler Connection**: 最多 15 个并发连接

**推荐使用 Pooler Connection:**

```
postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

注意端口是 `6543`（Pooler）而不是 `5432`（Direct）。

---

## ⚡ 快速修复检查清单

在重新部署前，确认以下所有项：

- [ ] DATABASE_URL 中的密码特殊字符已 URL 编码
- [ ] DATABASE_URL 包含 `?sslmode=require`
- [ ] 环境变量在 Production/Preview/Development 三个环境都配置了
- [ ] 修改环境变量后执行了重新部署
- [ ] Supabase 项目状态为 Active
- [ ] 本地运行 `node scripts/verify-db-connection.js` 通过

---

## 🆘 仍然无法解决？

### 方案 1: 使用 Supabase Pooler

替换 DATABASE_URL 为 Pooler 连接字符串：

```bash
# 在 Supabase 控制台 -> Settings -> Database 找到
# Connection Pooling -> Connection String

postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 方案 2: 检查 Vercel 区域限制

某些 Vercel 部署区域可能无法访问某些数据库区域。尝试：

1. 在项目设置中更改部署区域
2. 或者将 Supabase 项目迁移到更近的区域

### 方案 3: 启用详细日志

在 Vercel 环境变量中添加：

```
DEBUG=prisma:*
```

这会在部署日志中显示详细的 Prisma 调试信息。

---

## 📞 获取帮助

如果以上步骤都无法解决问题，请收集以下信息：

1. `/api/test-db` 的完整响应
2. Vercel Function Logs 中的错误信息
3. Supabase 项目区域（在 Settings -> General 查看）
4. DATABASE_URL 的前 50 个字符（隐藏密码部分）

然后联系:
- Vercel Support: https://vercel.com/help
- Supabase Support: https://supabase.com/dashboard/support

---

**最后更新:** 2025-10-25
