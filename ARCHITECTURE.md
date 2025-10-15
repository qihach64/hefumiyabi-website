# 江戸和装工房雅 - 和服租赁网站架构文档

## 📋 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [数据库模型详解](#3-数据库模型详解)
4. [核心业务流程](#4-核心业务流程)
5. [目录结构说明](#5-目录结构说明)
6. [关键功能实现](#6-关键功能实现)
7. [开发和部署指南](#7-开发和部署指南)

---

## 1. 项目概述

### 1.1 项目定位
江戸和装工房雅是一个专业的和服租赁平台，主要面向在日本的游客和当地用户提供传统和服租赁服务。网站支持多店铺管理、套餐预订、优惠活动等功能。

### 1.2 主要功能
- **用户系统**: 注册登录、邮箱验证、个人中心
- **和服展示**: 和服图库、分类筛选、详情展示
- **套餐管理**: 租赁套餐、价格管理、特色服务
- **活动系统**: 优惠活动、限时折扣、周年庆典
- **预约系统**: 在线预约、多店铺支持、预约管理
- **购物车**: 套餐选择、店铺分配、数量管理
- **店铺管理**: 多店铺支持、地理位置、营业时间

### 1.3 技术选型原因

| 技术 | 选择原因 |
|------|----------|
| **Next.js 14** | 全栈框架，支持 SSR/SSG，优秀的开发体验 |
| **TypeScript** | 类型安全，提高代码质量和开发效率 |
| **Prisma** | 现代化 ORM，类型安全，优秀的开发工具 |
| **PostgreSQL** | 可靠的关系型数据库，支持复杂查询 |
| **NextAuth.js** | 成熟的认证解决方案，支持多种登录方式 |
| **Zustand** | 轻量级状态管理，简单易用 |
| **Tailwind CSS** | 实用优先的 CSS 框架，快速开发 |
| **Nodemailer** | 邮件发送，支持多种 SMTP 服务 |

---

## 2. 技术架构

### 2.1 前端技术栈

```typescript
// 核心技术
Next.js 14 (App Router) + TypeScript + Tailwind CSS

// 状态管理
Zustand (购物车状态) + TanStack Query (服务端状态)

// 表单处理
React Hook Form + Zod (验证)

// UI 组件
Lucide React (图标) + 自定义组件

// 样式系统
Tailwind CSS + CSS Variables (主题)
```

### 2.2 后端技术栈

```typescript
// API 路由
Next.js API Routes (RESTful)

// 数据库
PostgreSQL + Prisma ORM

// 认证系统
NextAuth.js + Prisma Adapter

// 邮件服务
Nodemailer + SMTP

// 密码加密
bcryptjs
```

### 2.3 数据库设计

```mermaid
erDiagram
    User ||--o{ Booking : "creates"
    User ||--o{ Favorite : "likes"
    User ||--o{ Review : "writes"
    User ||--|| Cart : "has"
    User ||--|| UserPreference : "has"
    
    Booking ||--o{ BookingItem : "contains"
    BookingItem }o--|| Store : "at"
    BookingItem }o--o| RentalPlan : "uses"
    BookingItem ||--o{ BookingKimono : "includes"
    
    Store ||--o{ KimonoStore : "stocks"
    KimonoStore }o--|| Kimono : "references"
    Kimono ||--o{ KimonoImage : "has"
    
    Cart ||--o{ CartItem : "contains"
    CartItem }o--o| RentalPlan : "references"
    
    Campaign ||--o{ CampaignPlan : "contains"
    CampaignPlan ||--o{ CartItem : "added_to_cart"
```

### 2.4 认证系统架构

```typescript
// 认证流程
用户注册 → 邮箱验证 → 登录 → JWT Session

// 支持的认证方式
- 邮箱密码登录
- 邮箱验证（强制）
- 游客预约（无需登录）

// Session 管理
- NextAuth.js JWT Strategy
- 自动过期处理
- 安全的密码哈希
```

### 2.5 状态管理架构

```typescript
// 客户端状态
- Zustand: 购物车状态（持久化到 localStorage）
- React State: 组件内部状态
- URL State: 路由参数和查询参数

// 服务端状态
- Next.js Server Components: 服务端数据获取
- TanStack Query: 客户端数据缓存和同步
```

---

## 3. 数据库模型详解

### 3.1 用户系统

#### User 模型
```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  emailVerified DateTime?
  phone         String?   @unique
  passwordHash  String?
  
  name     String?
  avatar   String?
  role     Role      @default(USER)
  language Language  @default(ZH)
  birthday DateTime?
  gender   Gender?
  
  // 营销数据
  source       String?
  referralCode String?   @unique
  referredBy   String?
  
  // 关联数据
  preference UserPreference?
  cart       Cart?
  bookings   Booking[]
  favorites  Favorite[]
  reviews    Review[]
  accounts   Account[]
  sessions   Session[]
}
```

**核心特性**:
- 支持邮箱/手机号登录
- 邮箱验证机制
- 推荐系统支持
- 多语言偏好
- 完整的用户画像

#### 认证相关模型
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  // OAuth 相关字段...
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
}
```

### 3.2 和服系统

#### Kimono 模型
```prisma
model Kimono {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  nameEn      String?
  description String?
  
  category KimonoCategory
  style    String
  color    String[]
  pattern  String[]
  season   Season[]
  
  size        String
  isAvailable Boolean  @default(true)
  
  // 关联数据
  images      KimonoImage[]
  stores      KimonoStore[]
  favorites   Favorite[]
  bookings    BookingKimono[]
  
  // 统计信息
  viewCount    Int @default(0)
  bookingCount Int @default(0)
}
```

**核心特性**:
- 多语言支持（中文/英文）
- 丰富的属性标签（颜色、图案、季节）
- 多图片支持
- 多店铺库存管理
- 统计信息追踪

#### KimonoImage 模型
```prisma
model KimonoImage {
  id       String @id @default(cuid())
  kimonoId String
  url      String
  alt      String?
  order    Int     @default(0)
}
```

### 3.3 店铺系统

#### Store 模型
```prisma
model Store {
  id   String @id @default(cuid())
  slug String @unique
  
  name   String
  nameEn String?
  city   String
  
  address      String
  addressEn    String?
  phone        String?
  email        String?
  
  latitude  Float?
  longitude Float?
  openingHours Json? // 营业时间配置
  
  isActive Boolean @default(true)
  
  // 关联数据
  kimonos      KimonoStore[]
  bookingItems BookingItem[]
}
```

**核心特性**:
- 多语言支持
- 地理位置信息
- 灵活的营业时间配置
- 与和服的库存关联

### 3.4 套餐系统

#### RentalPlan 模型
```prisma
model RentalPlan {
  id   String @id @default(cuid())
  slug String @unique
  
  name        String
  nameEn      String?
  description String
  
  category PlanCategory
  
  price         Int // 人民币（分）
  depositAmount Int @default(0)
  duration      Int // 小时
  
  includes String[] // 包含的服务
  
  isActive Boolean @default(true)
  
  // 关联数据
  bookingItems BookingItem[]
  cartItems    CartItem[]
}
```

### 3.5 活动系统

#### Campaign 模型
```prisma
model Campaign {
  id   String @id @default(cuid())
  slug String @unique
  
  title       String
  titleEn     String?
  description String
  subtitle    String?
  
  // 时间管理
  startDate DateTime
  endDate   DateTime
  usageStartDate DateTime?
  usageEndDate   DateTime?
  
  // 活动配置
  isActive  Boolean @default(true)
  isPinned  Boolean @default(false)
  priority  Int     @default(0)
  
  // 媒体资源
  coverImage String?
  bannerImage String?
  
  type CampaignType @default(DISCOUNT)
  restrictions String[]
  terms String?
  
  campaignPlans CampaignPlan[]
}
```

#### CampaignPlan 模型
```prisma
model CampaignPlan {
  id         String @id @default(cuid())
  campaignId String
  
  name        String
  nameEn      String?
  description String
  
  // 价格配置
  originalPrice Int // 原价（分）
  campaignPrice Int // 活动价（分）
  
  // 套餐详情
  duration     Int?
  includes     String[]
  applicableStores String[] // 适用店铺
  images       String[]
  
  // 限制条件
  maxBookings Int?
  currentBookings Int @default(0)
  isFeatured Boolean @default(false)
}
```

### 3.6 预约系统

#### Booking 模型
```prisma
model Booking {
  id String @id @default(cuid())
  
  // 用户信息（支持游客预约）
  userId     String?
  guestName  String?
  guestEmail String?
  guestPhone String?
  
  // 到店信息
  visitDate DateTime
  visitTime String
  
  // 预约项（支持多个套餐，跨店铺）
  items BookingItem[]
  
  // 支付信息
  totalAmount   Int
  depositAmount Int
  paidAmount    Int            @default(0)
  paymentStatus PaymentStatus  @default(PENDING)
  paymentMethod String?
  
  // 状态管理
  status BookingStatus @default(PENDING)
  specialRequests String?
}
```

#### BookingItem 模型
```prisma
model BookingItem {
  id        String  @id @default(cuid())
  bookingId String
  
  // 店铺信息
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])
  
  // 套餐类型
  type           String  // 'PLAN' | 'CAMPAIGN'
  planId         String?
  campaignPlanId String?
  
  // 数量和价格
  quantity   Int @default(1)
  unitPrice  Int
  totalPrice Int
  
  // 附加信息
  addOns String[]
  notes  String?
  kimonos BookingKimono[]
}
```

### 3.7 购物车系统

#### Cart 模型
```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String?  @unique // null 表示游客购物车
  sessionId String?  @unique // 游客使用 sessionId
  
  items     CartItem[]
  expiresAt DateTime // 购物车过期时间（7天后）
}
```

#### CartItem 模型
```prisma
model CartItem {
  id     String @id @default(cuid())
  cartId String
  
  type           String  // 'PLAN' | 'CAMPAIGN'
  planId         String?
  campaignPlanId String?
  
  quantity Int      @default(1)
  addOns   String[] // 附加服务
  notes    String?  // 备注
}
```

---

## 4. 核心业务流程

### 4.1 用户注册和邮箱验证流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant A as API
    participant DB as 数据库
    participant E as 邮件服务
    
    U->>F: 填写注册表单
    F->>A: POST /api/auth/register
    A->>DB: 创建用户记录(emailVerified=null)
    A->>E: 发送验证邮件
    E->>U: 验证邮件
    A->>F: 返回注册成功
    F->>U: 显示验证提示
    
    U->>E: 点击验证链接
    E->>A: GET /verify-email?token=xxx
    A->>DB: 验证token并更新emailVerified
    A->>F: 显示验证成功
    F->>U: 跳转到登录页
```

**关键实现**:
```typescript
// 注册API实现
export async function POST(request: Request) {
  const { email, password, name } = await request.json();
  
  // 密码加密
  const passwordHash = await bcrypt.hash(password, 12);
  
  // 创建用户
  const user = await prisma.user.create({
    data: { email, passwordHash, name }
  });
  
  // 生成验证token
  const token = await generateVerificationToken(email);
  
  // 发送验证邮件
  await sendVerificationEmail(email, token);
  
  return NextResponse.json({ message: "注册成功" });
}
```

### 4.2 套餐浏览和选择流程

```mermaid
flowchart TD
    A[访问套餐页面] --> B[加载套餐数据]
    B --> C[显示套餐列表]
    C --> D[用户筛选/搜索]
    D --> E[选择套餐]
    E --> F[加入购物车]
    F --> G[选择店铺]
    G --> H[更新购物车]
    H --> I[继续购物或去结算]
```

**关键实现**:
```typescript
// 套餐页面数据获取
export default async function PlansPage() {
  const featuredPlans = await prisma.rentalPlan.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    take: 6,
  });
  
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  
  return <PlansClient featuredPlans={featuredPlans} stores={stores} />;
}
```

### 4.3 购物车管理流程

```mermaid
stateDiagram-v2
    [*] --> 空购物车
    空购物车 --> 有商品: 添加套餐
    有商品 --> 有商品: 修改数量/店铺
    有商品 --> 空购物车: 清空购物车
    有商品 --> 预约页面: 去预约
    空购物车 --> 套餐页面: 继续购物
```

**状态管理实现**:
```typescript
// Zustand 购物车状态
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const existingIndex = get().items.findIndex(
          (i) => i.type === item.type && i.planId === item.planId
        );
        
        if (existingIndex >= 0) {
          // 增加数量
          set(state => ({
            items: state.items.map((item, index) =>
              index === existingIndex 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          }));
        } else {
          // 添加新项
          set(state => ({
            items: [...state.items, { ...item, id: generateId(), quantity: 1 }]
          }));
        }
      },
      
      updateStore: (id, storeId, storeName) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, storeId, storeName } : item
          )
        }));
      },
    }),
    { name: "cart-storage" } // localStorage 持久化
  )
);
```

### 4.4 预约下单流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant C as 购物车
    participant B as 预约页面
    participant A as API
    participant DB as 数据库
    participant E as 邮件服务
    
    U->>C: 确认购物车商品
    C->>B: 跳转到预约页面
    U->>B: 填写预约信息
    B->>A: POST /api/bookings
    A->>DB: 按店铺分组创建预约
    A->>E: 发送确认邮件
    E->>U: 预约确认邮件
    A->>B: 返回预约成功
    B->>U: 显示成功页面
```

**预约创建实现**:
```typescript
// 预约API实现
export async function POST(request: Request) {
  const data = await request.json();
  const session = await auth();
  
  // 按店铺分组创建预约
  const bookingPromises = Object.entries(itemsByStore).map(async ([storeId, storeItems]) => {
    const booking = await prisma.booking.create({
      data: {
        userId: session?.user?.id || null,
        guestName: data.guestName || session?.user?.name,
        guestEmail: data.guestEmail || session?.user?.email,
        visitDate: new Date(data.visitDate),
        visitTime: data.visitTime,
        totalAmount: calculateTotal(storeItems),
        items: {
          create: storeItems.map(item => ({
            storeId,
            type: item.type,
            planId: item.planId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          }))
        }
      }
    });
    
    return booking;
  });
  
  const bookings = await Promise.all(bookingPromises);
  
  // 发送确认邮件
  await sendBookingConfirmationEmail(email, name, bookings[0]);
  
  return NextResponse.json({ bookings });
}
```

### 4.5 预约管理流程

```mermaid
flowchart TD
    A[用户个人中心] --> B[查看预约列表]
    B --> C{预约状态}
    C -->|待确认| D[等待确认]
    C -->|已确认| E[准备到店]
    C -->|进行中| F[使用中]
    C -->|已完成| G[已完成]
    C -->|可取消| H[取消预约]
    
    H --> I[发送取消邮件]
    I --> J[更新预约状态]
```

---

## 5. 目录结构说明

### 5.1 项目根目录

```
hefumiyabi-website/
├── prisma/                    # 数据库相关
│   ├── schema.prisma         # 数据库模型定义
│   ├── migrations/           # 数据库迁移文件
│   ├── seed.ts              # 数据种子文件
│   └── update-*.ts          # 数据更新脚本
├── public/                   # 静态资源
│   ├── logo.png            # 网站Logo
│   └── *.svg               # 图标文件
├── scripts/                 # 脚本文件
│   ├── scraper.ts          # 数据爬虫
│   └── test-db.ts          # 数据库测试
├── src/                     # 源代码
└── 配置文件...
```

### 5.2 src 目录结构

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # 认证相关页面
│   │   ├── layout.tsx      # 认证页面布局
│   │   ├── login/          # 登录页面
│   │   ├── register/       # 注册页面
│   │   └── verify-email/   # 邮箱验证页面
│   ├── (main)/             # 主要页面
│   │   ├── layout.tsx      # 主页面布局
│   │   ├── page.tsx        # 首页
│   │   ├── about/          # 关于我们
│   │   ├── booking/        # 预约相关
│   │   ├── campaigns/      # 优惠活动
│   │   ├── cart/           # 购物车
│   │   ├── contact/        # 联系我们
│   │   ├── faq/            # 常见问题
│   │   ├── kimonos/        # 和服展示
│   │   ├── plans/          # 租赁套餐
│   │   ├── profile/        # 用户中心
│   │   └── stores/         # 店铺信息
│   ├── api/                # API 路由
│   │   ├── auth/           # 认证API
│   │   ├── bookings/       # 预约API
│   │   ├── kimonos/        # 和服API
│   │   ├── plans/          # 套餐API
│   │   └── stores/         # 店铺API
│   ├── globals.css         # 全局样式
│   └── layout.tsx          # 根布局
├── components/             # 组件库
│   ├── auth/              # 认证组件
│   ├── booking/           # 预约组件
│   ├── kimono/            # 和服组件
│   ├── layout/            # 布局组件
│   ├── providers/         # 上下文提供者
│   └── ui/                # UI 组件
├── hooks/                 # 自定义Hooks
├── lib/                   # 工具库
│   ├── prisma.ts         # 数据库客户端
│   ├── email.ts          # 邮件服务
│   ├── tokens.ts         # Token管理
│   └── utils.ts          # 通用工具
├── store/                # 状态管理
│   └── cart.ts           # 购物车状态
├── types/                # 类型定义
│   ├── index.ts          # 通用类型
│   └── next-auth.d.ts    # NextAuth类型扩展
└── auth.ts               # 认证配置
```

### 5.3 组件结构

```
components/
├── auth/
│   └── EmailVerificationBanner.tsx  # 邮箱验证提示
├── booking/
│   ├── Step1SelectStore.tsx         # 选择店铺步骤
│   ├── Step2PersonalInfo.tsx        # 个人信息步骤
│   ├── Step3AddOns.tsx             # 附加服务步骤
│   ├── Step4Confirm.tsx            # 确认订单步骤
│   └── StepIndicator.tsx           # 步骤指示器
├── kimono/
│   ├── FavoriteButton.tsx          # 收藏按钮
│   ├── KimonoCard.tsx              # 和服卡片
│   ├── KimonoFilter.tsx            # 和服筛选器
│   └── KimonoGrid.tsx              # 和服网格
├── layout/
│   ├── Footer.tsx                   # 页脚
│   ├── Header.tsx                   # 页头
│   ├── HeaderActions.tsx            # 头部操作按钮
│   ├── HeaderClient.tsx             # 头部客户端组件
│   └── UserMenu.tsx                 # 用户菜单
├── providers/
│   └── SessionProvider.tsx          # 会话提供者
└── ui/                             # 基础UI组件
    ├── button.tsx
    ├── input.tsx
    └── ...
```

### 5.4 API 路由结构

```
api/
├── auth/
│   ├── [...nextauth]/
│   │   └── route.ts                # NextAuth配置
│   ├── register/
│   │   └── route.ts                # 用户注册
│   ├── send-verification/
│   │   └── route.ts                # 重发验证邮件
│   └── verify-email/
│       └── route.ts                # 邮箱验证
├── bookings/
│   ├── route.ts                    # 创建预约
│   └── [id]/
│       ├── route.ts                # 获取/更新预约
│       └── cancel/
│           └── route.ts            # 取消预约
├── kimonos/
│   ├── route.ts                    # 获取和服列表
│   └── [id]/
│       └── route.ts                # 获取和服详情
├── plans/
│   ├── route.ts                    # 获取套餐列表
│   └── [id]/
│       └── route.ts                # 获取套餐详情
└── stores/
    ├── route.ts                    # 获取店铺列表
    └── [id]/
        └── route.ts                # 获取店铺详情
```

---

## 6. 关键功能实现

### 6.1 NextAuth 认证系统

#### 认证配置
```typescript
// src/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
```

#### 会话管理
```typescript
// 服务端获取会话
import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  // 使用会话数据...
}

// 客户端获取会话
"use client";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  
  return (
    <div>
      {session?.user ? (
        <UserMenu user={session.user} />
      ) : (
        <LoginButton />
      )}
    </div>
  );
}
```

### 6.2 Zustand 状态管理

#### 购物车状态实现
```typescript
// src/store/cart.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  type: "PLAN" | "CAMPAIGN";
  planId?: string;
  campaignPlanId?: string;
  name: string;
  price: number;
  quantity: number;
  addOns: string[];
  storeId?: string;
  storeName?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  updateStore: (id: string, storeId: string, storeName: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.type === item.type && i.planId === item.planId
        );

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          set({
            items: [
              ...items,
              {
                ...item,
                id: `cart-${Date.now()}-${Math.random()}`,
                quantity: 1,
              },
            ],
          });
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      updateStore: (id, storeId, storeName) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, storeId, storeName } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage", // localStorage key
    }
  )
);
```

### 6.3 邮件系统

#### 邮件服务配置
```typescript
// src/lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "验证您的邮箱 - 江戸和装工房雅",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            /* 精美的邮件样式 */
            .container {
              background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
              border-radius: 20px;
              padding: 40px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌸 江戸和装工房雅</div>
            <h1>欢迎注册！</h1>
            <p>请点击下方按钮验证您的邮箱地址：</p>
            <a href="${verificationUrl}" class="button">验证邮箱</a>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}
```

#### 预约确认邮件
```typescript
export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  booking: any
) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "预约确认 - 江戸和装工房雅",
    html: `
      <div class="container">
        <div class="logo">🌸 江戸和装工房雅</div>
        <h1>预约确认</h1>
        <p>尊敬的 ${name}，感谢您的预约！</p>
        
        <div class="booking-info">
          <h3>预约详情</h3>
          <div class="info-row">
            <div class="info-label">预约编号：</div>
            <div class="info-value">${booking.id}</div>
          </div>
          <div class="info-row">
            <div class="info-label">到店日期：</div>
            <div class="info-value">${new Date(booking.visitDate).toLocaleDateString("zh-CN")}</div>
          </div>
          <div class="info-row">
            <div class="info-label">到店时间：</div>
            <div class="info-value">${booking.visitTime}</div>
          </div>
        </div>
        
        <div class="notice">
          <strong>温馨提示：</strong>
          <ul>
            <li>请在预约时间前15分钟到店</li>
            <li>到店后工作人员将为您选择合适的和服</li>
            <li>如需取消或修改预约，请提前3天联系我们</li>
          </ul>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
```

### 6.4 购物车持久化

#### 本地存储策略
```typescript
// 购物车状态持久化到 localStorage
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // 状态逻辑...
    }),
    {
      name: "cart-storage",
      // 自定义序列化
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),
      // 部分状态持久化
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
```

#### 游客购物车处理
```typescript
// 游客购物车使用 sessionId
const cart = await prisma.cart.upsert({
  where: { sessionId: sessionId },
  update: {
    items: {
      create: cartItemData,
    },
  },
  create: {
    sessionId: sessionId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天过期
    items: {
      create: cartItemData,
    },
  },
});
```

### 6.5 多店铺预约

#### 按店铺分组预约
```typescript
// 预约创建时按店铺分组
export async function POST(request: Request) {
  const data = await request.json();
  const { items } = data;
  
  // 按店铺分组
  const itemsByStore = items.reduce((acc, item) => {
    const storeId = item.storeId;
    if (!acc[storeId]) {
      acc[storeId] = [];
    }
    acc[storeId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);
  
  // 为每个店铺创建预约
  const bookingPromises = Object.entries(itemsByStore).map(async ([storeId, storeItems]) => {
    const booking = await prisma.booking.create({
      data: {
        userId: session?.user?.id || null,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        visitDate: new Date(data.visitDate),
        visitTime: data.visitTime,
        totalAmount: storeItems.reduce((sum, item) => sum + item.totalPrice, 0),
        items: {
          create: storeItems.map(item => ({
            storeId,
            type: item.type,
            planId: item.planId,
            campaignPlanId: item.campaignPlanId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            addOns: item.addOns,
            notes: item.notes,
          }))
        }
      },
      include: {
        items: {
          include: {
            store: true,
            plan: true,
          }
        }
      }
    });
    
    return booking;
  });
  
  const bookings = await Promise.all(bookingPromises);
  return NextResponse.json({ bookings });
}
```

---

## 7. 开发和部署指南

### 7.1 环境配置

#### 必需的环境变量
```bash
# .env.local
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/hefumiyabi"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# 邮件服务
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="江戸和装工房雅 <your-email@gmail.com>"
```

#### 开发环境设置
```bash
# 1. 安装依赖
pnpm install

# 2. 设置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 3. 运行数据库迁移
pnpm prisma migrate dev

# 4. 生成 Prisma 客户端
pnpm prisma generate

# 5. 种子数据（可选）
pnpm db:seed

# 6. 启动开发服务器
pnpm dev
```

### 7.2 开发流程

#### 数据库开发流程
```bash
# 1. 修改 schema.prisma
# 2. 创建迁移
pnpm prisma migrate dev --name "add_new_field"

# 3. 重置数据库（开发时）
pnpm db:reset

# 4. 查看数据库
pnpm prisma studio
```

#### 代码开发流程
```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
# - 修改/添加组件
# - 更新API路由
# - 测试功能

# 3. 代码检查
pnpm lint

# 4. 构建测试
pnpm build

# 5. 提交代码
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### 7.3 数据库迁移

#### 迁移文件结构
```
prisma/
├── migrations/
│   ├── 20250114053455_init/
│   │   └── migration.sql
│   ├── 20250114194920_add_campaign_system/
│   │   └── migration.sql
│   └── migration_lock.toml
└── schema.prisma
```

#### 迁移最佳实践
```sql
-- 添加新字段（向后兼容）
ALTER TABLE "users" ADD COLUMN "new_field" TEXT;

-- 创建新表
CREATE TABLE "new_table" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "new_table_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
```

### 7.4 部署注意事项

#### Vercel 部署配置
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "SMTP_HOST": "@smtp-host",
    "SMTP_USER": "@smtp-user",
    "SMTP_PASSWORD": "@smtp-password"
  }
}
```

#### 生产环境优化
```typescript
// next.config.ts
const nextConfig = {
  // 图片优化
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 性能优化
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // 安全配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
        ],
      },
    ];
  },
};
```

#### 数据库生产配置
```typescript
// 生产环境数据库连接池配置
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

#### 监控和日志
```typescript
// 错误监控
export async function POST(request: Request) {
  try {
    // API 逻辑
  } catch (error) {
    console.error('API Error:', error);
    
    // 发送到监控服务（如 Sentry）
    // Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 7.5 性能优化建议

#### 数据库查询优化
```typescript
// 使用 include 预加载关联数据
const bookings = await prisma.booking.findMany({
  include: {
    items: {
      include: {
        store: true,
        plan: true,
      }
    },
    user: true,
  },
});

// 使用 select 只选择需要的字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

#### 图片优化
```typescript
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src="/kimono-image.jpg"
  alt="和服图片"
  width={400}
  height={600}
  priority={false} // 非关键图片不预加载
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### 缓存策略
```typescript
// API 路由缓存
export async function GET() {
  const data = await fetchData();
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

// 静态页面生成
export async function generateStaticParams() {
  const kimonos = await prisma.kimono.findMany({
    select: { id: true },
  });
  
  return kimonos.map((kimono) => ({
    id: kimono.id,
  }));
}
```

---

## 总结

江戸和装工房雅和服租赁网站采用了现代化的全栈技术架构，具有以下特点：

### 技术优势
- **类型安全**: 全面的 TypeScript 支持
- **开发效率**: Next.js 14 + Prisma 提供优秀的开发体验
- **用户体验**: 响应式设计，支持多语言
- **可扩展性**: 模块化架构，易于扩展新功能
- **安全性**: 完善的认证系统和数据验证

### 业务特色
- **多店铺支持**: 灵活的多店铺管理
- **智能预约**: 支持跨店铺预约和套餐组合
- **优惠活动**: 完整的活动管理系统
- **游客友好**: 支持游客预约，降低使用门槛
- **邮件通知**: 完整的邮件通知系统

### 未来扩展方向
- 支付系统集成
- 实时库存管理
- 移动端 App
- 多语言国际化
- 数据分析面板
- 客服系统集成

这个架构为和服租赁业务提供了坚实的技术基础，支持业务的快速发展和功能扩展。
