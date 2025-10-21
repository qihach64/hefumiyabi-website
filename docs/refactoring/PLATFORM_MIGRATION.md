# 从和服网站到和服平台 - 架构迁移方案

> **核心转变**：从单一商家网站 → 连接客户和商户的平台（类似 Airbnb / Thumbtack）

---

## 🎯 架构转变对比

### 当前架构 (单一商家)
```
客户 → 网站 → 江戸和装工房雅（唯一商家）
```

### 目标架构 (平台模式)
```
客户 ←→ 平台 ←→ 多个和服商家
        ↓
    交易撮合
    支付分账
    评价系统
    数据分析
```

---

## 📊 核心差异

| 维度 | 当前（单一商家） | 目标（平台模式） |
|------|-----------------|----------------|
| **角色** | 只有客户 | 客户 + 商家 |
| **店铺** | 固定几个直营店 | 任意商家入驻 |
| **套餐** | 统一管理 | 商家各自管理 |
| **预约** | 直接预约 | 平台撮合 |
| **支付** | 直接收款 | 平台分账 |
| **库存** | 集中管理 | 商家各自管理 |
| **评价** | 对店铺/套餐 | 对商家/服务 |
| **盈利模式** | 直接销售 | 佣金/订阅费 |

---

## 🏗️ 架构演进路径

### Phase 0: 当前状态
```
┌─────────────┐
│   客户端    │
└──────┬──────┘
       │
┌──────┴──────┐
│  Web 应用   │
└──────┬──────┘
       │
┌──────┴──────┐
│  单一数据库  │
│  - plans    │
│  - stores   │
│  - bookings │
└─────────────┘
```

### Phase 1: 多租户基础 (Multi-tenancy)
```
┌─────────────┐       ┌─────────────┐
│   客户端    │       │  商家后台    │
└──────┬──────┘       └──────┬──────┘
       │                     │
       └──────────┬──────────┘
                  │
       ┌──────────┴──────────┐
       │   平台 API 层        │
       │  - 租户隔离          │
       │  - 权限控制          │
       └──────────┬──────────┘
                  │
       ┌──────────┴──────────┐
       │  数据库 (多租户)     │
       │  - merchants        │
       │  - stores (by merchant) │
       │  - listings         │
       │  - bookings         │
       └─────────────────────┘
```

### Phase 2: 完整平台生态
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   客户端    │   │  商家后台    │   │  管理后台    │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
            ┌────────────┴────────────┐
            │      平台核心             │
            │  - 用户系统               │
            │  - 商家系统               │
            │  - 交易系统               │
            │  - 支付分账               │
            │  - 评价系统               │
            │  - 搜索推荐               │
            └────────────┬────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───┴───┐      ┌─────┴─────┐    ┌───┴───┐
    │主数据库│      │Redis缓存   │    │搜索引擎│
    └───────┘      └───────────┘    └───────┘
```

---

## 🗄️ 数据模型迁移

### 核心实体变化

#### 1. 新增 Merchant (商家) 实体
```prisma
model Merchant {
  id          String   @id @default(cuid())

  // 商家信息
  businessName String        // 商家名称
  legalName    String        // 法人名称
  owner        User          // 店主账号
  ownerId      String

  // 认证状态
  status       MerchantStatus @default(PENDING)
  verified     Boolean       @default(false)
  verifiedAt   DateTime?

  // 商家资料
  description  String        @db.Text
  logo         String?
  banner       String?

  // 联系方式
  email        String
  phone        String
  website      String?

  // 地址
  address      String
  city         String
  region       String
  postalCode   String?

  // 营业执照
  businessLicense String?    // 营业执照号
  licenseImage    String?    // 执照照片

  // 银行信息（支付分账）
  bankAccount  BankAccount?

  // 平台费率
  commissionRate Float @default(0.15)  // 15% 佣金

  // 关联
  stores       Store[]
  listings     Listing[]      // 商家发布的套餐
  bookings     Booking[]
  reviews      MerchantReview[]

  // 统计
  totalBookings Int @default(0)
  totalRevenue  Int @default(0)
  rating        Float?
  reviewCount   Int @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([status])
  @@index([city])
  @@map("merchants")
}

enum MerchantStatus {
  PENDING     // 待审核
  APPROVED    // 已通过
  REJECTED    // 已拒绝
  SUSPENDED   // 已暂停
}
```

#### 2. Store 归属商家
```prisma
model Store {
  id          String   @id @default(cuid())

  // 归属商家 ⭐
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id])

  // 店铺信息
  name        String
  slug        String   @unique
  address     String
  city        String
  latitude    Float?
  longitude   Float?

  // 营业信息
  openingHours Json
  holidays     String[]

  // 设施
  facilities   String[]

  // 状态
  isActive     Boolean  @default(true)

  // 关联
  listings     Listing[]
  bookings     Booking[]

  @@index([merchantId])
  @@index([city])
  @@map("stores")
}
```

#### 3. RentalPlan → Listing (商家发布)
```prisma
model Listing {
  id          String   @id @default(cuid())

  // 归属商家 ⭐
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id])

  // 适用店铺
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id])

  // 套餐信息
  title       String
  description String   @db.Text
  images      String[]

  // 定价（商家自定价）⭐
  price       Int      // 分
  deposit     Int?

  // 套餐内容
  includes    String[]
  duration    String
  category    ListingCategory

  // 库存
  stock       Int?     // null = 无限
  isActive    Boolean  @default(true)

  // 审核状态 ⭐
  status      ListingStatus @default(PENDING)

  // 统计
  viewCount   Int      @default(0)
  bookingCount Int     @default(0)
  rating      Float?
  reviewCount Int      @default(0)

  // 关联
  bookings    Booking[]
  reviews     Review[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([merchantId])
  @@index([storeId])
  @@index([category])
  @@index([status])
  @@map("listings")
}

enum ListingStatus {
  PENDING     // 待审核
  APPROVED    // 已上架
  REJECTED    // 已拒绝
  SUSPENDED   // 已下架
}
```

#### 4. Booking 关联商家
```prisma
model Booking {
  id          String   @id @default(cuid())

  // 客户
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])

  // 商家 ⭐
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id])

  // 店铺
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id])

  // 套餐
  listingId   String
  listing     Listing  @relation(fields: [listingId], references: [id])

  // 预约信息
  visitDate   DateTime
  visitTime   String
  quantity    Int      @default(1)

  // 金额
  totalAmount   Int    // 总金额
  platformFee   Int    // 平台佣金 ⭐
  merchantAmount Int   // 商家收入 ⭐

  // 支付状态
  paymentStatus PaymentStatus @default(PENDING)
  status        BookingStatus @default(PENDING)

  // 分账信息 ⭐
  payout        Payout?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([merchantId])
  @@index([listingId])
  @@index([visitDate])
  @@map("bookings")
}
```

#### 5. 新增 Payout (分账) 实体
```prisma
model Payout {
  id          String   @id @default(cuid())

  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id])

  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])

  // 金额
  amount      Int      // 应付商家金额
  platformFee Int      // 平台佣金

  // 状态
  status      PayoutStatus @default(PENDING)

  // 支付信息
  paidAt      DateTime?
  method      String?  // "bank_transfer", "stripe"
  reference   String?  // 支付凭证号

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([merchantId])
  @@index([status])
  @@map("payouts")
}

enum PayoutStatus {
  PENDING     // 待支付
  PROCESSING  // 处理中
  PAID        // 已支付
  FAILED      // 支付失败
}
```

#### 6. Review 增加对商家的评价
```prisma
model Review {
  id          String   @id @default(cuid())

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])

  // 对套餐的评价
  listingId   String
  listing     Listing  @relation(fields: [listingId], references: [id])

  // 对商家的评价 ⭐
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id])

  // 评分
  rating      Int      // 总体评分
  serviceRating Int?   // 服务评分
  qualityRating Int?   // 质量评分

  content     String?  @db.Text
  images      String[]

  createdAt   DateTime @default(now())

  @@index([merchantId])
  @@index([listingId])
  @@map("reviews")
}
```

---

## 🔄 关键功能变化

### 1. 用户角色系统

```typescript
enum UserRole {
  CUSTOMER    // 客户
  MERCHANT    // 商家
  ADMIN       // 平台管理员
}

model User {
  id       String   @id
  role     UserRole @default(CUSTOMER)

  // 商家账号
  merchant Merchant?
}
```

### 2. 商家入驻流程

```
注册账号
  ↓
提交资料（营业执照、店铺信息）
  ↓
平台审核
  ↓
通过 → 开通后台 → 发布套餐
拒绝 → 修改后重新提交
```

### 3. 套餐发布流程

```
商家创建套餐
  ↓
填写信息（名称、价格、描述、图片）
  ↓
提交审核
  ↓
平台审核
  ↓
通过 → 上架展示
拒绝 → 修改后重新提交
```

### 4. 预约流程（平台模式）

```
客户浏览套餐
  ↓
选择商家和套餐
  ↓
提交预约
  ↓
支付（平台代收）
  ↓
通知商家
  ↓
商家确认
  ↓
到店体验
  ↓
平台分账给商家
```

### 5. 支付分账

```typescript
// 预约总额：¥1000
const booking = {
  totalAmount: 100000,  // ¥1000 (分)

  // 平台收取 15% 佣金
  platformFee: 15000,   // ¥150

  // 商家实收 85%
  merchantAmount: 85000, // ¥850
};

// 自动分账
await createPayout({
  merchantId: booking.merchantId,
  bookingId: booking.id,
  amount: booking.merchantAmount,
  platformFee: booking.platformFee,
});
```

---

## 🚀 实施路线图

### 阶段 1: 多租户基础 (4周)

**Week 1-2: 数据模型重构**
- [ ] 创建 Merchant 模型
- [ ] Store 关联到 Merchant
- [ ] RentalPlan → Listing
- [ ] Booking 关联 Merchant
- [ ] 数据迁移：将现有店铺迁移为首个商家

**Week 3-4: 基础功能**
- [ ] 商家注册和认证流程
- [ ] 商家后台基础页面
- [ ] 套餐发布和审核
- [ ] 角色和权限系统

### 阶段 2: 平台核心功能 (4周)

**Week 5-6: 交易系统**
- [ ] 支付分账逻辑
- [ ] Payout 模型和流程
- [ ] 订单状态管理
- [ ] 商家收入统计

**Week 7-8: 搜索和展示**
- [ ] 多商家套餐聚合
- [ ] 商家筛选器
- [ ] 智能排序（评分、价格、距离）
- [ ] 商家主页

### 阶段 3: 增强功能 (4周)

**Week 9-10: 评价系统**
- [ ] 对商家的评价
- [ ] 商家评分算法
- [ ] 评价展示和管理

**Week 11-12: 管理后台**
- [ ] 商家审核
- [ ] 套餐审核
- [ ] 交易监控
- [ ] 数据报表

---

## 💰 盈利模式

### 1. 佣金模式 (主要)
```
每笔交易收取 10-20% 佣金
初期：15%
VIP 商家：10%
新商家前3个月：5%（推广期）
```

### 2. 订阅模式 (可选)
```
基础版：免费（佣金 15%）
进阶版：¥299/月（佣金 10% + 额外功能）
专业版：¥699/月（佣金 5% + 全部功能）
```

### 3. 增值服务
```
- 首页推荐位：¥500/天
- 搜索置顶：¥200/天
- 专业摄影：¥1000/次
- 数据分析报告：¥500/月
```

---

## 🎯 关键差异总结

### 单一商家 vs 平台模式

| 功能 | 单一商家 | 平台模式 |
|------|---------|---------|
| 店铺管理 | 固定几家直营店 | ✅ 商家自主入驻和管理 |
| 套餐管理 | 平台统一管理 | ✅ 商家各自创建和定价 |
| 库存管理 | 集中管理 | ✅ 商家独立管理 |
| 支付收款 | 直接收款 | ✅ 平台代收 + 自动分账 |
| 商家审核 | 无 | ✅ 资质审核 + 套餐审核 |
| 评价系统 | 对套餐/店铺 | ✅ 对商家 + 套餐 |
| 商家后台 | 无 | ✅ 独立后台管理 |
| 盈利模式 | 直接销售利润 | ✅ 佣金 + 订阅 + 增值服务 |

---

## 📊 技术架构对比

### 当前架构
```
Next.js App
    ↓
单一数据库
    ↓
直接支付
```

### 平台架构
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  客户前端    │  │  商家后台    │  │  管理后台    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │     API Gateway            │
          │   - 路由                   │
          │   - 认证                   │
          │   - 限流                   │
          └─────────────┬─────────────┘
                        │
          ┌─────────────┴─────────────┐
          │   业务服务层                │
          │   - 用户服务                │
          │   - 商家服务                │
          │   - 交易服务                │
          │   - 支付服务                │
          │   - 搜索服务                │
          └─────────────┬─────────────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
   ┌───┴───┐      ┌─────┴─────┐    ┌───┴────┐
   │主数据库│      │Redis缓存   │    │Elasticsearch│
   └───────┘      └───────────┘    └────────┘
```

---

## ⚠️ 风险和挑战

### 技术风险
1. **数据迁移复杂度**: 现有数据需要转换为多租户模式
2. **性能问题**: 多商家数据量大，需要优化查询
3. **支付分账**: 需要集成支持分账的支付网关

### 业务风险
1. **商家获取**: 需要吸引足够多的优质商家入驻
2. **质量控制**: 需要审核机制保证服务质量
3. **信任建立**: 平台初期需要建立用户信任

### 解决方案
1. **灰度发布**: 先将现有店铺转为首个商家，逐步开放
2. **质量保证**: 严格的商家审核 + 保证金制度
3. **补贴策略**: 初期低佣金吸引商家，补贴用户吸引流量

---

## 🎯 成功指标

### 3个月目标
- 入驻商家：**10+**
- 上架套餐：**50+**
- 月交易额：**¥10万+**
- 平台佣金：**¥1.5万+**

### 6个月目标
- 入驻商家：**30+**
- 上架套餐：**200+**
- 月交易额：**¥50万+**
- 平台佣金：**¥7.5万+**

### 12个月目标
- 入驻商家：**100+**
- 上架套餐：**500+**
- 月交易额：**¥200万+**
- 平台佣金：**¥30万+**

---

## 📝 实施步骤

### 已完成 ✅

#### Phase 1.1: 数据模型迁移 (已完成)

**1. Prisma Schema 更新**
- ✅ 添加 `Merchant` 模型（商家实体）
- ✅ 添加 `Listing` 模型（商家发布的套餐）
- ✅ 添加 `Payout` 模型（支付分账）
- ✅ 添加 `MerchantReview` 模型（商家评价）
- ✅ 更新 `Store` 模型，添加 `merchantId` 字段
- ✅ 更新 `Booking` 模型，添加 `merchantId`、`platformFee`、`merchantAmount` 字段
- ✅ 添加 `Role.MERCHANT` 枚举值
- ✅ 添加 `MerchantStatus`、`ListingStatus`、`PayoutStatus` 枚举

**2. 数据库迁移**
```bash
# 已执行
npx prisma db push
```

**3. 数据迁移脚本**
```bash
# 已执行
npx tsx scripts/migrate-to-platform.ts
```

**迁移结果**:
- ✅ 创建默认商家账户：江戸和装工房雅
- ✅ 所有现有店铺（5个）已关联到默认商家
- ✅ 数据完整性验证通过

**Schema 文件**: `prisma/schema.prisma`
**迁移脚本**: `scripts/migrate-to-platform.ts`

---

### 下一步 📅

#### Phase 1.2: 商家后台基础 (Week 3-4)

**1. 认证和权限**
- [ ] 更新用户注册流程，支持商家角色
- [ ] 实现商家认证中间件
- [ ] 创建权限检查工具函数

**2. 商家后台页面**
```bash
/merchant
  /dashboard        # 商家仪表盘
  /profile          # 商家资料
  /stores           # 店铺管理
  /listings         # 套餐管理
    /new            # 创建套餐
    /[id]/edit      # 编辑套餐
  /bookings         # 预约管理
  /payouts          # 收益管理
```

**3. API 端点**
```typescript
// 商家管理
POST   /api/merchant/register        // 商家入驻申请
GET    /api/merchant/profile         // 获取商家信息
PUT    /api/merchant/profile         // 更新商家信息

// 套餐管理
GET    /api/merchant/listings        // 获取商家套餐列表
POST   /api/merchant/listings        // 创建套餐
PUT    /api/merchant/listings/[id]   // 更新套餐
DELETE /api/merchant/listings/[id]   // 删除套餐

// 预约管理
GET    /api/merchant/bookings        // 获取预约列表
PUT    /api/merchant/bookings/[id]   // 更新预约状态

// 收益管理
GET    /api/merchant/payouts         // 获取分账记录
GET    /api/merchant/analytics       // 数据统计
```

**4. 组件开发**
- [ ] `MerchantNav` - 商家后台导航
- [ ] `ListingForm` - 套餐创建/编辑表单
- [ ] `BookingList` - 商家预约列表
- [ ] `PayoutSummary` - 收益统计卡片
- [ ] `MerchantStats` - 商家数据仪表盘

#### Phase 2.1: 支付分账 (Week 5-6)

**1. 支付逻辑更新**
```typescript
// 创建预约时自动计算分账
const createBooking = async (data) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: data.merchantId }
  });

  const platformFee = Math.floor(data.totalAmount * merchant.commissionRate);
  const merchantAmount = data.totalAmount - platformFee;

  const booking = await prisma.booking.create({
    data: {
      ...data,
      platformFee,
      merchantAmount,
    }
  });

  // 创建分账记录
  await prisma.payout.create({
    data: {
      merchantId: data.merchantId,
      bookingId: booking.id,
      amount: merchantAmount,
      platformFee,
      status: 'PENDING',
    }
  });

  return booking;
};
```

**2. 分账定时任务**
- [ ] 每日自动生成待支付的分账记录
- [ ] 批量支付接口（对接银行API）
- [ ] 支付失败重试机制

**3. 商家收益页面**
- [ ] 收益概览（总收益、待结算、已结算）
- [ ] 分账明细列表
- [ ] 提现申请功能

#### Phase 2.2: 平台管理后台 (Week 7-8)

**1. 管理后台页面**
```bash
/admin
  /dashboard         # 平台数据总览
  /merchants         # 商家管理
    /pending         # 待审核商家
    /approved        # 已通过商家
  /listings          # 套餐审核
    /pending         # 待审核套餐
  /bookings          # 订单管理
  /payouts           # 分账管理
  /analytics         # 数据分析
```

**2. 审核流程**
```typescript
// 商家审核
PUT /api/admin/merchants/[id]/approve
PUT /api/admin/merchants/[id]/reject

// 套餐审核
PUT /api/admin/listings/[id]/approve
PUT /api/admin/listings/[id]/reject
```

---

### 使用方法

#### 开发环境启动

```bash
# 1. 安装依赖
pnpm install

# 2. 数据库已迁移，直接启动
pnpm dev

# 3. 查看数据库
npx prisma studio
```

#### 访问说明

- **客户端**: http://localhost:3000
- **商家后台**: http://localhost:3000/merchant（即将开发）
- **管理后台**: http://localhost:3000/admin（即将开发）
- **Prisma Studio**: http://localhost:5555

#### 测试账号

**默认商家**:
- 商家名称: 江戸和装工房雅
- 状态: APPROVED (已通过)
- 佣金率: 0% (默认商家免佣金)
- 关联店铺: 5个

**下一步操作**:
1. 在用户表中将某个用户角色改为 `MERCHANT`
2. 创建商家后台登录页面
3. 实现套餐发布功能

---

### 数据库变更记录

**新增表**:
- `merchants` - 商家信息
- `listings` - 商家发布的套餐
- `payouts` - 支付分账记录
- `merchant_reviews` - 商家评价

**修改表**:
- `stores` - 添加 `merchantId` 字段（可选，向后兼容）
- `bookings` - 添加 `merchantId`、`platformFee`、`merchantAmount` 字段
- `users` - Role 枚举新增 `MERCHANT`

**新增枚举**:
- `MerchantStatus`: PENDING, APPROVED, REJECTED, SUSPENDED
- `ListingStatus`: PENDING, APPROVED, REJECTED, SUSPENDED
- `PayoutStatus`: PENDING, SCHEDULED, PROCESSING, COMPLETED, FAILED, CANCELLED

---

### 回滚方案

如需回滚到单商家模式，执行以下步骤：

```bash
# 1. 备份数据
pg_dump $DATABASE_URL > backup.sql

# 2. 移除新表（谨慎操作）
# 手动在数据库中删除 merchants, listings, payouts, merchant_reviews 表

# 3. 还原 schema
git checkout HEAD~1 prisma/schema.prisma
npx prisma db push
```

⚠️ **警告**: 回滚会丢失所有平台模式相关的数据！

---

**最后更新**: 2025-10-21
**状态**: 🚀 Phase 1.1 已完成，Phase 1.2 进行中
**优先级**: 🔥 HIGH
