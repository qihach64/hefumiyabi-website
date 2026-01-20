# 邮箱验证系统设置指南

## 概述

我们已经为和服租赁网站实现了完整的邮箱验证系统，确保用户注册时使用的邮箱地址是真实有效的。

## 功能特性

### ✅ 已实现的功能

1. **注册时自动发送验证邮件** - 用户注册后立即收到验证邮件
2. **邮箱格式验证** - 使用正则表达式验证邮箱格式
3. **验证链接** - 点击邮件中的链接完成验证
4. **Token 过期机制** - 验证链接 24 小时后自动失效
5. **重发验证邮件** - 用户可以重新请求发送验证邮件
6. **验证状态提示** - 在用户个人中心显示验证状态
7. **精美的 HTML 邮件模板** - 品牌化的邮件设计

## 邮件配置

### 使用 Gmail（推荐用于测试）

1. **开启两步验证**
   - 访问 [Google 账户安全设置](https://myaccount.google.com/security)
   - 开启"两步验证"

2. **生成应用专用密码**
   - 访问 [应用专用密码](https://myaccount.google.com/apppasswords)
   - 选择"邮件"和您的设备
   - 生成密码（16 位字符，无空格）

3. **配置环境变量** (`.env` 文件)
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-16-char-app-password"
   SMTP_FROM="江戸和装工房雅 <your-email@gmail.com>"
   ```

### 使用其他邮件服务商

#### **Outlook/Hotmail**
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="江戸和装工房雅 <your-email@outlook.com>"
```

#### **QQ 邮箱**
1. 开启 SMTP 服务并获取授权码
2. 配置：
```env
SMTP_HOST="smtp.qq.com"
SMTP_PORT="587"
SMTP_USER="your-email@qq.com"
SMTP_PASSWORD="your-authorization-code"
SMTP_FROM="江戸和装工房雅 <your-email@qq.com>"
```

#### **163 邮箱**
```env
SMTP_HOST="smtp.163.com"
SMTP_PORT="465"
SMTP_USER="your-email@163.com"
SMTP_PASSWORD="your-authorization-code"
SMTP_FROM="江戸和装工房雅 <your-email@163.com>"
```

#### **专业邮件服务（生产环境推荐）**

**SendGrid**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM="江戸和装工房雅 <noreply@yourdomain.com>"
```

**Mailgun**
```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@yourdomain.com"
SMTP_PASSWORD="your-mailgun-password"
SMTP_FROM="江戸和装工房雅 <noreply@yourdomain.com>"
```

## 工作流程

### 1. 用户注册流程

```
用户填写注册表单
      ↓
验证邮箱格式
      ↓
创建用户账户（emailVerified = null）
      ↓
生成验证 Token（24小时有效）
      ↓
发送验证邮件
      ↓
显示提示信息
```

### 2. 邮箱验证流程

```
用户点击邮件中的验证链接
      ↓
跳转到 /verify-email?token=xxx
      ↓
验证 Token 是否有效
      ↓
更新 user.emailVerified = now()
      ↓
删除已使用的 Token
      ↓
显示成功消息并跳转到登录页
```

### 3. 重发验证邮件

```
用户在个人中心看到验证提示
      ↓
点击"重新发送验证邮件"
      ↓
删除旧 Token
      ↓
生成新 Token
      ↓
发送新邮件
      ↓
显示成功提示
```

## API 端点

### POST `/api/auth/register`
注册新用户并发送验证邮件

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

**响应：**
```json
{
  "user": {
    "id": "xxx",
    "email": "user@example.com",
    "name": "用户名"
  },
  "message": "注册成功！请检查您的邮箱以验证账户。"
}
```

### POST `/api/auth/verify-email`
验证邮箱地址

**请求体：**
```json
{
  "token": "verification-token"
}
```

**响应：**
```json
{
  "message": "邮箱验证成功",
  "email": "user@example.com"
}
```

### POST `/api/auth/send-verification`
重新发送验证邮件

**请求体：**
```json
{
  "email": "user@example.com"
}
```

**响应：**
```json
{
  "message": "验证邮件已发送，请检查您的邮箱"
}
```

## 数据库结构

### VerificationToken 表
```prisma
model VerificationToken {
  identifier String   // 用户邮箱
  token      String   @unique // 验证令牌
  expires    DateTime // 过期时间（24小时后）

  @@unique([identifier, token])
}
```

### User 表（相关字段）
```prisma
model User {
  email         String?   @unique
  emailVerified DateTime? // null = 未验证, Date = 已验证
  ...
}
```

## 测试步骤

### 1. 配置邮件服务
```bash
# 编辑 .env 文件
nano .env

# 添加您的 SMTP 配置
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="江戸和装工房雅 <your-email@gmail.com>"
```

### 2. 启动开发服务器
```bash
pnpm dev
```

### 3. 测试注册
1. 访问 `http://localhost:3000/register`
2. 填写注册表单
3. 提交后检查控制台是否有错误
4. 检查邮箱收件箱（可能在垃圾邮件中）

### 4. 测试验证
1. 打开验证邮件
2. 点击验证按钮
3. 应该跳转到验证页面并显示成功
4. 查看数据库确认 `emailVerified` 已更新

### 5. 测试重发
1. 如果邮箱未验证，登录后访问 `/profile`
2. 应该看到黄色的验证提示横幅
3. 点击"重新发送验证邮件"
4. 检查邮箱收到新的验证邮件

## 常见问题

### Q: 邮件发送失败怎么办？

**A:** 检查以下几点：
1. SMTP 配置是否正确
2. 邮箱密码是否使用"应用专用密码"（不是登录密码）
3. 防火墙是否阻止了 SMTP 端口
4. 查看控制台错误日志

### Q: 邮件进入垃圾邮件箱？

**A:** 这是正常的，因为我们使用的是非专业邮件服务。生产环境建议：
1. 使用专业邮件服务（SendGrid、Mailgun等）
2. 配置 SPF、DKIM 记录
3. 使用已验证的域名

### Q: 如何禁用邮箱验证（仅用于开发）？

**A:** 修改登录逻辑，允许未验证的邮箱登录：
```typescript
// 在 src/auth.ts 中
async authorize(credentials) {
  // ... 现有验证逻辑

  // 临时跳过邮箱验证检查
  // if (!user.emailVerified) {
  //   return null;
  // }

  return { ... };
}
```

### Q: Token 过期时间可以调整吗？

**A:** 可以，在 `src/lib/tokens.ts` 中修改：
```typescript
// 24小时 = 24 * 60 * 60 * 1000
const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

// 改为 1小时
const expires = new Date(Date.now() + 60 * 60 * 1000);
```

## 生产环境建议

1. **使用专业邮件服务** - SendGrid、Mailgun、AWS SES 等
2. **配置 DNS 记录** - SPF、DKIM、DMARC
3. **监控发送状态** - 跟踪邮件送达率
4. **实现速率限制** - 防止邮件轰炸
5. **添加邮件队列** - 使用 Bull、BullMQ 等队列系统
6. **记录发送日志** - 便于调试和审计

## 文件清单

- `src/lib/email.ts` - 邮件发送服务
- `src/lib/tokens.ts` - Token 生成和验证
- `src/app/api/auth/register/route.ts` - 注册 API（含邮件发送）
- `src/app/api/auth/verify-email/route.ts` - 验证邮箱 API
- `src/app/api/auth/send-verification/route.ts` - 重发验证邮件 API
- `src/app/(auth)/verify-email/page.tsx` - 验证页面
- `src/components/auth/EmailVerificationBanner.tsx` - 验证提示组件
- `prisma/schema.prisma` - 数据库模型（VerificationToken）

## 下一步优化

1. ✅ 实现密码重置功能
2. ✅ 添加邮件发送队列
3. ✅ 实现邮件发送统计
4. ✅ 支持多语言邮件模板
5. ✅ 添加邮件预览功能（开发环境）
