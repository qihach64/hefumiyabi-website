# 🚀 Vercel Connection Pooler 快速修复指南

## 问题症状

如果您看到以下任何错误：

### 错误 1: 无法连接到数据库
```
Error code: P1001
Can't reach database server at `db.xxxxx.supabase.co:5432`
```
→ **需要切换到 Connection Pooler**

### 错误 2: Prepared Statement 错误
```
Error code: 26000
prepared statement "s12" does not exist
```
→ **需要添加 `pgbouncer=true` 参数**

---

## ✅ 完整解决方案

### 第 1 步: 获取 Supabase Connection Pooler URL

1. **访问 Supabase 控制台**
   ```
   https://supabase.com/dashboard
   ```

2. **进入您的项目** → **Settings** ⚙️ → **Database**

3. **找到 Connection Pooling 部分**（向下滚动）

4. **复制 Connection String**
   - 在 "Connection Pooling" 下找到 **URI**
   - 点击 **Copy** 按钮
   - 应该类似这样：
     ```
     postgresql://postgres.epxyusnhvqfhfbaqgsli:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
     ```

### 第 2 步: 构建正确的 DATABASE_URL

**完整格式模板：**
```
postgresql://postgres.[PROJECT_REF]:[URL_ENCODED_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**关键配置：**

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **端口** | `6543` | ⚠️ 不是 5432！ |
| **主机名** | 包含 `.pooler.` | 例如: `aws-0-ap-northeast-1.pooler.supabase.com` |
| **密码编码** | URL 编码 | `^`→`%5E`, `$`→`%24`, `@`→`%40` |
| **sslmode** | `require` | 强制 SSL 加密 |
| **pgbouncer** | `true` | ⚠️ 关键参数！禁用 Prepared Statements |

**示例（假设密码是 `9DbHJf^dwS$@5$`）：**
```
postgresql://postgres.epxyusnhvqfhfbaqgsli:9DbHJf%5EdwS%24%405%24@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### 第 3 步: 更新 Vercel 环境变量

1. **访问 Vercel 控制台**
   ```
   https://vercel.com/dashboard
   ```

2. **进入项目设置**
   - 选择您的项目
   - 点击 **Settings** 标签
   - 点击 **Environment Variables**

3. **更新 DATABASE_URL**
   - 找到 `DATABASE_URL` 变量
   - 点击右侧的 **编辑（铅笔图标）** 按钮
   - 粘贴新的 Pooler 连接字符串
   - **确保勾选所有三个环境**：
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development

4. **保存** - 点击 **Save** 按钮

### 第 4 步: 重新部署

1. **在 Vercel 控制台**
   - 进入 **Deployments** 标签
   - 找到最新的部署
   - 点击右侧的 **三点菜单 (...)**
   - 选择 **Redeploy**
   - 点击确认

2. **等待部署完成**（约 2-3 分钟）

### 第 5 步: 验证连接

部署完成后，访问测试 API：
```
https://你的域名.vercel.app/api/test-db
```

**成功响应示例：**
```json
{
  "success": true,
  "message": "✅ 数据库连接正常",
  "data": {
    "rentalPlans": 76,
    "users": 20,
    "bookings": 89
  },
  "database": {
    "isPooler": true,
    "port": "6543",
    "recommendation": "✅ 使用 Connection Pooler"
  }
}
```

---

## 🔍 常见问题

### Q1: 为什么必须使用 Connection Pooler？

**答：** Vercel 使用 Serverless Functions，每个请求都会创建新的数据库连接。

| 连接类型 | 端口 | 适用场景 | Vercel 支持 |
|---------|------|---------|------------|
| Direct Connection | 5432 | 本地开发、长连接 | ❌ 通常被阻止 |
| Connection Pooler | 6543 | 生产环境、Serverless | ✅ 推荐使用 |

### Q2: 为什么需要 `pgbouncer=true` 参数？

**答：** Supabase Pooler 使用 **Transaction Mode**，不支持 Prisma 的 Prepared Statements。

添加 `pgbouncer=true` 会告诉 Prisma：
- 不使用 Prepared Statements
- 改用普通 SQL 查询
- 与 PgBouncer/Transaction Mode 兼容

### Q3: 本地开发需要修改吗？

**答：** 不需要！本地 `.env.local` 可以继续使用直接连接：

```env
# .env.local (本地开发)
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

只有 Vercel 环境变量需要使用 Pooler + `pgbouncer=true`。

### Q4: 密码如何 URL 编码？

**常见特殊字符编码对照表：**

| 字符 | URL 编码 | 示例 |
|-----|---------|------|
| `^` | `%5E` | `pass^word` → `pass%5Eword` |
| `$` | `%24` | `pass$word` → `pass%24word` |
| `@` | `%40` | `pass@word` → `pass%40word` |
| `#` | `%23` | `pass#word` → `pass%23word` |
| `%` | `%25` | `pass%word` → `pass%25word` |
| `&` | `%26` | `pass&word` → `pass%26word` |
| `+` | `%2B` | `pass+word` → `pass%2Bword` |
| ` ` (空格) | `%20` | `pass word` → `pass%20word` |

**在线工具：** https://www.urlencoder.org/

---

## 📋 检查清单

在重新部署前，确认以下所有项：

- [ ] DATABASE_URL 使用 Connection Pooler (端口 6543)
- [ ] 主机名包含 `.pooler.supabase.com`
- [ ] 密码中的特殊字符已 URL 编码
- [ ] 包含 `?sslmode=require` 参数
- [ ] 包含 `&pgbouncer=true` 参数（关键！）
- [ ] 在 Vercel 的 Production/Preview/Development 环境都已配置
- [ ] 修改环境变量后执行了重新部署

---

## 🆘 仍然失败？

### 检查 Vercel Function Logs

1. 进入 Vercel 项目
2. 点击最新的部署
3. 点击 **View Function Logs**
4. 查找具体错误信息

### 常见错误诊断

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `Can't reach database server` | 未使用 Pooler | 确认端口是 6543 |
| `prepared statement does not exist` | 缺少 pgbouncer 参数 | 添加 `&pgbouncer=true` |
| `SSL connection required` | 缺少 SSL 模式 | 添加 `?sslmode=require` |
| `Invalid database string` | URL 格式错误 | 检查 URL 编码和格式 |

---

## 📞 获取更多帮助

- 访问 `/api/test-db` 端点查看详细诊断信息
- 查看 `VERCEL-TROUBLESHOOTING.md` 完整指南
- Vercel Support: https://vercel.com/help
- Supabase Support: https://supabase.com/dashboard/support

---

**最后更新:** 2025-10-25
