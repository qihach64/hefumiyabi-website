# 技术架构设计

> **目标**：构建一个高性能、可扩展、易维护的现代化 Web 应用

---

## 🏗️ 技术栈

### 前端技术栈
```
┌─────────────────────────────────────┐
│  Next.js 15.5 (App Router)          │  ← 框架
├─────────────────────────────────────┤
│  React 19 + TypeScript              │  ← UI 层
├─────────────────────────────────────┤
│  Tailwind CSS v4 + CVA              │  ← 样式
├─────────────────────────────────────┤
│  Zustand / Jotai                    │  ← 状态管理
├─────────────────────────────────────┤
│  React Query (TanStack Query)       │  ← 数据获取
├─────────────────────────────────────┤
│  Framer Motion                      │  ← 动画
└─────────────────────────────────────┘
```

### 后端技术栈
```
┌─────────────────────────────────────┐
│  Next.js API Routes + tRPC          │  ← API 层
├─────────────────────────────────────┤
│  Prisma ORM                         │  ← 数据库 ORM
├─────────────────────────────────────┤
│  PostgreSQL                         │  ← 主数据库
├─────────────────────────────────────┤
│  Redis                              │  ← 缓存层
├─────────────────────────────────────┤
│  NextAuth.js v5                     │  ← 认证
└─────────────────────────────────────┘
```

### 基础设施
```
┌─────────────────────────────────────┐
│  Vercel / AWS                       │  ← 部署平台
├─────────────────────────────────────┤
│  Cloudflare CDN                     │  ← CDN
├─────────────────────────────────────┤
│  AWS S3 / Cloudinary                │  ← 图片存储
├─────────────────────────────────────┤
│  Stripe                             │  ← 支付网关
├─────────────────────────────────────┤
│  SendGrid / Resend                  │  ← 邮件服务
└─────────────────────────────────────┘
```

---

## 🎯 架构原则

### 1. **性能优先**
- **代码分割**：按路由自动分割，按需加载
- **图片优化**：Next.js Image 组件 + WebP/AVIF
- **缓存策略**：ISR (Incremental Static Regeneration)
- **边缘计算**：Vercel Edge Functions

### 2. **可扩展性**
- **模块化设计**：功能模块独立
- **插件化架构**：支付、邮件、存储等可插拔
- **微前端**：未来可独立部署管理后台

### 3. **可维护性**
- **类型安全**：全栈 TypeScript
- **代码规范**：ESLint + Prettier
- **自动化测试**：Vitest + Playwright
- **文档化**：Storybook + TSDoc

### 4. **安全性**
- **认证授权**：NextAuth.js + JWT
- **数据验证**：Zod schema
- **XSS 防护**：Content Security Policy
- **CSRF 防护**：Token validation

---

## 📐 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户端                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  浏览器   │  │  移动端   │  │  小程序   │  │   APP    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │         Cloudflare CDN            │  ← 全球 CDN 加速
        └─────────────────┬─────────────────┘
                          │
┌─────────────────────────┴─────────────────────────────────┐
│                    Next.js 应用层                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │              App Router (RSC)                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │  主页     │  │  套餐页   │  │  预约页   │  ...    │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  └─────────────────────┬──────────────────────────────┘   │
│                        │                                   │
│  ┌─────────────────────┴──────────────────────────────┐   │
│  │              API Routes / tRPC                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │  认证     │  │  预约     │  │  支付     │  ...    │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  └─────────────────────┬──────────────────────────────┘   │
└────────────────────────┼──────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────┴────────┐              ┌─────────┴────────┐
│  数据库层       │              │   外部服务层      │
│  ┌──────────┐  │              │  ┌────────────┐  │
│  │PostgreSQL│  │              │  │   Stripe   │  │
│  └──────────┘  │              │  └────────────┘  │
│  ┌──────────┐  │              │  ┌────────────┐  │
│  │  Redis   │  │              │  │  SendGrid  │  │
│  └──────────┘  │              │  └────────────┘  │
└────────────────┘              │  ┌────────────┐  │
                                │  │Cloudinary  │  │
                                │  └────────────┘  │
                                └──────────────────┘
```

---

## 🗂️ 项目结构

```
hefumiyabi-website/
├── src/
│   ├── app/                    # App Router 页面
│   │   ├── (main)/            # 主站路由组
│   │   │   ├── page.tsx       # 首页
│   │   │   ├── plans/         # 套餐页
│   │   │   ├── stores/        # 店铺页
│   │   │   ├── booking/       # 预约页
│   │   │   └── profile/       # 个人中心
│   │   ├── (auth)/            # 认证路由组
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/               # API Routes
│   │   │   └── trpc/          # tRPC endpoints
│   │   └── layout.tsx         # 根布局
│   │
│   ├── components/            # React 组件
│   │   ├── ui/                # 设计系统组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   ├── booking/           # 预约相关组件
│   │   ├── cart/              # 购物车组件
│   │   └── shared/            # 共享组件
│   │
│   ├── lib/                   # 工具库
│   │   ├── prisma.ts          # Prisma 客户端
│   │   ├── utils.ts           # 工具函数
│   │   ├── validations/       # Zod schemas
│   │   └── trpc/              # tRPC 配置
│   │
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useCart.ts
│   │   ├── useBooking.ts
│   │   └── useUser.ts
│   │
│   ├── stores/                # 状态管理 (Zustand)
│   │   ├── cartStore.ts
│   │   └── userStore.ts
│   │
│   ├── server/                # 服务端代码
│   │   ├── routers/           # tRPC routers
│   │   ├── services/          # 业务逻辑
│   │   └── middleware/        # 中间件
│   │
│   └── types/                 # TypeScript 类型
│       ├── models.ts          # 数据模型
│       └── api.ts             # API 类型
│
├── prisma/
│   ├── schema.prisma          # 数据库 schema
│   └── migrations/            # 迁移文件
│
├── public/                    # 静态资源
│   ├── images/
│   └── icons/
│
├── docs/                      # 文档
│   ├── refactoring/           # 重构文档
│   └── api/                   # API 文档
│
└── tests/                     # 测试
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🔄 数据流设计

### 1. **服务端渲染流程 (SSR)**
```
用户请求
  ↓
Next.js Server
  ↓
数据获取 (Prisma)
  ↓
React 渲染 (RSC)
  ↓
HTML 响应
  ↓
客户端水合 (Hydration)
```

### 2. **客户端交互流程**
```
用户操作
  ↓
React 组件
  ↓
tRPC Client
  ↓
API Route
  ↓
业务逻辑层
  ↓
数据库 / 外部服务
  ↓
响应数据
  ↓
React Query 缓存
  ↓
UI 更新
```

### 3. **购物车流程**
```
加入购物车
  ↓
Zustand Store 更新
  ↓
LocalStorage 持久化
  ↓
结算
  ↓
API 提交订单
  ↓
支付网关
  ↓
订单确认
```

---

## 🚀 性能优化策略

### 1. **渲染优化**
- **React Server Components**：减少客户端 JS
- **Streaming SSR**：渐进式渲染
- **Partial Prerendering**：静态 + 动态混合

### 2. **资源优化**
- **图片优化**：
  - Next.js Image 自动优化
  - WebP/AVIF 格式
  - Lazy loading + Blur placeholder
  - Responsive images

- **代码优化**：
  - Tree shaking
  - Code splitting
  - Dynamic imports
  - Bundle 分析

### 3. **缓存策略**
```typescript
// ISR - 增量静态再生成
export const revalidate = 3600; // 1小时

// On-demand Revalidation
revalidatePath('/plans');

// Redis 缓存
const cachedData = await redis.get(key);
if (cachedData) return JSON.parse(cachedData);
```

### 4. **CDN 策略**
```
- 静态资源：永久缓存
- HTML：短期缓存 (5分钟)
- API：不缓存
- 图片：长期缓存 (1年)
```

---

## 🔐 安全架构

### 1. **认证授权**
```typescript
// NextAuth.js 配置
export const authOptions = {
  providers: [
    CredentialsProvider,
    GoogleProvider,
    // ... 其他 OAuth
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      // 添加自定义字段
    },
    session: async ({ session, token }) => {
      // 会话管理
    },
  },
};
```

### 2. **数据验证**
```typescript
// Zod schema
const BookingSchema = z.object({
  storeId: z.string().uuid(),
  visitDate: z.date().min(new Date()),
  items: z.array(BookingItemSchema).min(1),
});

// tRPC procedure
bookingRouter.create = procedure
  .input(BookingSchema)
  .mutation(async ({ input }) => {
    // 业务逻辑
  });
```

### 3. **支付安全**
- Stripe Checkout：托管支付页面
- Webhook 验证：签名校验
- 幂等性：防重复支付

---

## 📊 监控和分析

### 1. **性能监控**
- Vercel Analytics：Web Vitals
- Sentry：错误追踪
- LogRocket：会话回放

### 2. **业务分析**
- Google Analytics 4：用户行为
- Mixpanel：事件追踪
- Hotjar：热力图

### 3. **日志系统**
```typescript
// 结构化日志
logger.info('Booking created', {
  userId,
  bookingId,
  amount,
  timestamp: new Date(),
});
```

---

## 🔮 未来扩展

### 1. **微服务化**
- 预约服务
- 支付服务
- 通知服务
- 用户服务

### 2. **多租户架构**
- 多品牌支持
- 多店铺管理
- 白标解决方案

### 3. **国际化扩展**
- 多语言支持
- 多币种支付
- 多时区处理

---

**最后更新**: 2025-10-20
