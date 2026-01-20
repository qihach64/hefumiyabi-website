# 🚀 和缘网站部署指南

## 方案对比

| 方案 | 成本 | 难度 | 推荐度 |
|------|------|------|--------|
| **Vercel + Supabase** | 免费 | ⭐ | ⭐⭐⭐⭐⭐ |
| Railway | ~$5-10/月 | ⭐⭐ | ⭐⭐⭐⭐ |
| Render | 免费（有限制） | ⭐⭐ | ⭐⭐⭐ |

---

## 🏆 推荐方案：Vercel + Supabase（完全免费）

### 为什么选这个？
- ✅ Next.js 官方平台，零配置部署
- ✅ 自动 CI/CD（推送代码自动部署）
- ✅ 免费 SSL 证书
- ✅ 全球 CDN 加速
- ✅ 已有 Supabase 数据库，无需迁移
- ✅ **总成本：$0/月**

---

## 📋 部署步骤

### Step 1: 准备 Supabase 数据库

**你已经有 Supabase 了！** 只需确认：
- 数据库 URL：`postgresql://postgres:...@db.epxyusnhvqfhfbaqgsli.supabase.co:5432/postgres`
- 数据已导入（76 个租赁套餐）

### Step 2: 部署到 Vercel

#### 方式 A：通过 Vercel 网站（推荐，最简单）

1. **访问 Vercel 并登录**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   ```
   点击 "Add New..." → "Project"
   → 选择你的 GitHub 仓库 "hefumiyabi-website"
   → 点击 "Import"
   ```

3. **配置环境变量**（⚠️ 重要！）
   在 "Environment Variables" 部分添加以下变量：

   ```bash
   # 数据库（使用你现有的 Supabase）
   DATABASE_URL=postgresql://postgres:9DbHJf%5EdwS%24%405%24@db.epxyusnhvqfhfbaqgsli.supabase.co:5432/postgres?sslmode=require

   # Next-Auth 认证（生成随机密钥）
   AUTH_SECRET=你的随机密钥（下面会告诉你如何生成）

   # 应用 URL（部署后会自动生成，先留空）
   NEXT_PUBLIC_APP_URL=https://你的项目名.vercel.app

   # 环境
   NODE_ENV=production
   ```

   **🔑 如何生成 AUTH_SECRET？**

   在本地终端运行：
   ```bash
   openssl rand -base64 32
   ```
   复制输出的字符串作为 `AUTH_SECRET` 的值。

4. **点击 "Deploy"**
   - Vercel 会自动构建和部署
   - 大约 2-3 分钟完成
   - 部署成功后会得到一个 URL：`https://hefumiyabi-website-xxxx.vercel.app`

5. **更新 NEXT_PUBLIC_APP_URL**
   - 复制你的部署 URL
   - 回到 Vercel 项目设置 → Environment Variables
   - 更新 `NEXT_PUBLIC_APP_URL` 为实际 URL
   - 点击右上角 "Redeploy" 重新部署

#### 方式 B：通过 Vercel CLI（开发者友好）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 添加环境变量
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel env add NODE_ENV

# 5. 生产部署
vercel --prod
```

---

## 🔧 环境变量配置清单

| 变量名 | 必需 | 说明 | 示例值 |
|--------|------|------|--------|
| `DATABASE_URL` | ✅ | Supabase 数据库连接 | `postgresql://...` |
| `AUTH_SECRET` | ✅ | NextAuth 密钥 | `openssl rand -base64 32` 生成 |
| `NEXT_PUBLIC_APP_URL` | ✅ | 网站 URL | `https://hefumiyabi.vercel.app` |
| `NODE_ENV` | ✅ | 环境 | `production` |

---

## ✅ 部署后检查清单

- [ ] 网站能正常访问
- [ ] 主页显示套餐卡片（76 个套餐）
- [ ] 搜索栏正常工作
- [ ] 分类筛选正常
- [ ] 登录/注册功能正常
- [ ] 图片能正常加载

---

## 🎯 常见问题

### Q1: 部署失败，提示 Prisma 错误
**A**: 确保添加了 `DATABASE_URL` 环境变量，并且格式正确。

### Q2: 页面显示但没有数据
**A**: 检查 Supabase 数据库是否有数据，确认 `DATABASE_URL` 正确。

### Q3: 登录功能不工作
**A**: 检查 `AUTH_SECRET` 是否已设置，并且足够长（至少 32 字符）。

### Q4: 图片不显示
**A**: Vercel 需要在 `next.config.ts` 中配置图片域名：

```typescript
// next.config.ts
export default {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hefumiyabi.com',
      },
    ],
  },
};
```

### Q5: 如何自定义域名？
1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名（例如 `hefumiyabi.com`）
3. 按照提示在域名注册商处添加 DNS 记录
4. 等待 DNS 生效（通常 10-60 分钟）

---

## 💰 成本估算

### Vercel 免费版限制
- ✅ 100GB 带宽/月
- ✅ 无限部署
- ✅ 自动 HTTPS
- ✅ 边缘网络 CDN
- ⚠️ 如果流量大，可能需要升级到 Pro ($20/月)

### Supabase 免费版限制
- ✅ 500MB 数据库
- ✅ 1GB 文件存储
- ✅ 50,000 月活用户
- ⚠️ 数据库 1 周无活动会暂停（访问即恢复）

---

## 🔄 自动部署

**已配置！** 每次 `git push` 到 `main` 分支，Vercel 会自动：
1. 拉取最新代码
2. 运行 `npm install` 和 `prisma generate`
3. 构建 `npm run build`
4. 部署到生产环境

**PR 预览：** 每个 Pull Request 都会得到独立的预览 URL！

---

## 🎨 其他推荐方案

### 方案 2: Railway（适合需要更多控制）

**优点：**
- 支持 PostgreSQL 内置
- 配置灵活
- 部署简单

**成本：** ~$5-10/月

**部署步骤：**
1. 访问 https://railway.app
2. 用 GitHub 登录
3. "New Project" → "Deploy from GitHub repo"
4. 选择仓库
5. 添加 PostgreSQL 数据库插件
6. Railway 会自动设置 `DATABASE_URL`
7. 添加其他环境变量
8. 部署

### 方案 3: Render（免费但有限制）

**优点：**
- 完全免费（有限制）
- 支持 PostgreSQL

**缺点：**
- 免费数据库会在 90 天后删除
- 无活动时服务器会休眠（首次访问慢）

---

## 📞 需要帮助？

如果部署遇到问题，可以：
1. 查看 Vercel 部署日志
2. 检查 Supabase 数据库连接
3. 确认所有环境变量已正确设置

---

**预计总耗时：5-10 分钟** ⏱️

**预计成本：$0/月** 💰

---

*生成时间：2025-10-24*
*项目：和缘和服租赁平台*
