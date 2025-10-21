# 数据模型重构方案

> **目标**：设计一个灵活、可扩展的数据库结构

---

## 📊 核心实体关系图 (ERD)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    User     │1     *│   Booking    │*     1│    Store    │
│             ├───────│              ├───────│             │
│ - id        │       │ - id         │       │ - id        │
│ - email     │       │ - userId     │       │ - name      │
│ - name      │       │ - storeId    │       │ - address   │
│ - phone     │       │ - visitDate  │       │ - lat/lng   │
└──────┬──────┘       │ - visitTime  │       └─────────────┘
       │              │ - totalAmt   │
       │              └──────┬───────┘
       │                     │
       │1                   *│
       │              ┌──────┴───────┐
       │              │ BookingItem  │
       │              │              │
       │              │ - id         │
       │              │ - bookingId  │
       │              │ - planId     │
       │              │ - quantity   │
       │              └──────┬───────┘
       │                     │
       │                    *│1
       │              ┌──────┴───────┐
       │              │  RentalPlan  │
       │              │              │
       │              │ - id         │
       │              │ - name       │
       │              │ - price      │
       │              │ - imageUrl   │
       │              └──────────────┘
       │
       │1            *
┌──────┴──────┐
│   Review    │
│             │
│ - id        │
│ - userId    │
│ - bookingId │
│ - rating    │
│ - content   │
└─────────────┘
```

---

## 🗂️ 详细数据模型

### 1. User (用户)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  emailVerified DateTime?
  name          String?
  phone         String?
  image         String?

  // 认证
  password      String?
  accounts      Account[]
  sessions      Session[]

  // 业务关系
  bookings      Booking[]
  reviews       Review[]
  wishlist      Wishlist[]

  // 会员系统 (Phase 3)
  memberLevel   MemberLevel @default(REGULAR)
  points        Int         @default(0)

  // 时间戳
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@map("users")
}

enum MemberLevel {
  REGULAR  // 普通会员
  SILVER   // 银卡会员
  GOLD     // 金卡会员
  DIAMOND  // 钻石会员
}
```

### 2. Booking (预约) - 重构版

```prisma
model Booking {
  id        String   @id @default(cuid())

  // 用户信息 (支持游客预约)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  guestName  String?
  guestEmail String?
  guestPhone String?

  // 简化的到店信息 ✨
  storeId    String
  store      Store    @relation(fields: [storeId], references: [id])
  visitDate  DateTime  // 到店日期
  visitTime  String    // 到店时间 "10:00"

  // 预约项目
  items      BookingItem[]

  // 金额信息
  totalAmount   Int  // 总金额（分）
  depositAmount Int  // 定金（分）
  paidAmount    Int  @default(0)  // 已支付（分）

  // 状态
  paymentStatus PaymentStatus @default(PENDING)
  status        BookingStatus @default(PENDING)

  // 备注
  specialRequests String?  // 特殊要求

  // 时间戳
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // 关联
  review     Review?

  @@index([userId])
  @@index([storeId])
  @@index([visitDate])
  @@map("bookings")
}

enum BookingStatus {
  PENDING    // 待确认
  CONFIRMED  // 已确认
  COMPLETED  // 已完成
  CANCELLED  // 已取消
}

enum PaymentStatus {
  PENDING   // 待支付
  PARTIAL   // 部分支付（定金）
  PAID      // 全额支付
  REFUNDED  // 已退款
}
```

### 3. BookingItem (预约项) - 新增

```prisma
model BookingItem {
  id         String  @id @default(cuid())
  bookingId  String
  booking    Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  // 套餐类型
  type            String  // 'plan' | 'campaign'
  planId          String?
  plan            RentalPlan?     @relation(fields: [planId], references: [id])
  campaignPlanId  String?
  campaignPlan    CampaignPlan?   @relation(fields: [campaignPlanId], references: [id])

  // 店铺
  storeId    String
  store      Store  @relation(fields: [storeId], references: [id])

  // 数量和价格
  quantity   Int     @default(1)
  unitPrice  Int     // 单价（分）
  totalPrice Int     // 总价（分）

  // 附加服务
  addOns     String[]  // ["发型设计", "摄影服务"]
  notes      String?   // 备注

  // 选择的和服 (可选)
  kimonos    BookingKimono[]

  @@index([bookingId])
  @@map("booking_items")
}
```

### 4. Store (店铺)

```prisma
model Store {
  id          String   @id @default(cuid())

  // 基本信息
  name        String
  nameEn      String?
  slug        String   @unique

  // 地址
  city        String
  address     String
  addressEn   String?
  latitude    Float?
  longitude   Float?

  // 联系方式
  phone       String?
  email       String?

  // 营业信息
  openingHours Json?   // 营业时间
  holidays     String[] // 休息日

  // 设施和服务
  facilities   String[] // ["行李寄存", "化妆间", "拍照区"]
  features     String[] // 店铺特色

  // 图片
  images       String[]

  // 状态
  isActive     Boolean  @default(true)

  // 关联
  bookings     Booking[]
  bookingItems BookingItem[]
  plans        RentalPlan[]

  // 时间戳
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([city])
  @@index([slug])
  @@map("stores")
}
```

### 5. RentalPlan (租赁套餐)

```prisma
model RentalPlan {
  id          String   @id @default(cuid())

  // 基本信息
  name        String
  nameEn      String?
  description String   @db.Text
  imageUrl    String?
  images      String[]

  // 价格 (统一为分)
  price       Int      // 原价（分）
  deposit     Int?     // 定金（分）

  // 套餐内容
  includes    String[] // 包含项目
  duration    String   // "8小时"
  category    PlanCategory

  // 适用范围
  region      String?  // "东京", "京都"
  storeIds    String[] // 适用店铺ID列表

  // 库存和状态
  stock       Int?     // null = 无限库存
  isActive    Boolean  @default(true)
  featured    Boolean  @default(false)  // 是否推荐

  // SEO
  metaTitle       String?
  metaDescription String?
  tags            String[]

  // 关联
  bookingItems    BookingItem[]
  campaignPlans   CampaignPlan[]

  // 时间戳
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([region])
  @@map("rental_plans")
}

enum PlanCategory {
  STANDARD    // 标准套餐
  COUPLE      // 情侣套餐
  GROUP       // 团体套餐
  PREMIUM     // 高级套餐
  GRADUATION  // 毕业袴
  CEREMONY    // 成人式
}
```

### 6. Campaign (活动) - 增强版

```prisma
model Campaign {
  id          String   @id @default(cuid())

  // 基本信息
  name        String
  nameEn      String?
  description String   @db.Text
  imageUrl    String?
  images      String[]

  // 活动时间
  startDate   DateTime
  endDate     DateTime

  // 活动类型
  type        CampaignType
  discountType DiscountType?  // 折扣类型
  discountValue Int?          // 折扣值

  // 适用范围
  region      String?
  storeIds    String[]

  // 状态
  isActive    Boolean  @default(true)
  featured    Boolean  @default(false)

  // 关联
  plans       CampaignPlan[]

  // 时间戳
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([startDate, endDate])
  @@map("campaigns")
}

enum CampaignType {
  SEASONAL    // 季节活动（樱花季、红叶季）
  HOLIDAY     // 节日活动
  FLASH_SALE  // 限时优惠
  NEW_STORE   // 新店开业
}

enum DiscountType {
  PERCENTAGE  // 百分比折扣
  FIXED       // 固定金额
  SPECIAL     // 特价
}
```

### 7. Review (评价) - Phase 3

```prisma
model Review {
  id          String   @id @default(cuid())

  // 关联
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])

  // 评分
  rating      Int      // 1-5 星
  serviceRating Int?   // 服务评分
  kimonoRating  Int?   // 和服质量评分
  storeRating   Int?   // 店铺环境评分

  // 内容
  content     String?  @db.Text
  images      String[] // 用户上传的照片
  tags        String[] // ["服务好", "和服漂亮", "店铺干净"]

  // 互动
  helpful     Int      @default(0)  // 有帮助投票数
  response    String?  @db.Text     // 商家回复

  // 状态
  isVerified  Boolean  @default(false)  // 是否验证为真实预约
  isPublished Boolean  @default(true)

  // 时间戳
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([rating])
  @@map("reviews")
}
```

### 8. Wishlist (心愿单) - Phase 3

```prisma
model Wishlist {
  id        String   @id @default(cuid())

  userId    String
  user      User     @relation(fields: [userId], references: [id])

  planId    String
  plan      RentalPlan @relation(fields: [planId], references: [id])

  createdAt DateTime @default(now())

  @@unique([userId, planId])
  @@map("wishlists")
}
```

---

## 🔄 购物车数据结构 (前端)

**存储方式**: Zustand + LocalStorage

```typescript
interface CartItem {
  id: string;                 // 唯一ID
  type: 'plan' | 'campaign';  // 套餐类型
  planId?: string;
  campaignPlanId?: string;
  name: string;
  price: number;              // 价格（分）
  originalPrice?: number;     // 原价（分）
  image?: string;
  storeId?: string;           // 预选店铺
  storeName?: string;
  quantity: number;           // 数量
  addOns: string[];           // 附加服务
  notes?: string;             // 备注
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  totalAmount: () => number;
  itemCount: () => number;
}
```

---

## 📊 数据迁移策略

### Phase 1: 向后兼容 (当前)
- 保留旧字段 (rentalDate, returnDate)
- 添加新字段 (visitDate, visitTime)
- 双写：同时更新新旧字段

### Phase 2: 数据迁移
```sql
-- 迁移现有数据
UPDATE bookings
SET visitDate = rentalDate,
    visitTime = SUBSTRING(pickupTime, 1, 5);

-- 验证数据
SELECT COUNT(*) FROM bookings WHERE visitDate IS NULL;
```

### Phase 3: 清理
```prisma
// 删除旧字段
model Booking {
  // 移除：rentalDate, returnDate, pickupTime, returnTime
  ❌ rentalDate    DateTime
  ❌ returnDate    DateTime
  ❌ pickupTime    String
  ❌ returnTime    String
}
```

---

## 🔍 索引优化

### 性能关键索引

```prisma
// Booking 表
@@index([userId])           // 用户查询预约
@@index([storeId])          // 店铺查询预约
@@index([visitDate])        // 日历视图
@@index([status])           // 状态筛选
@@index([paymentStatus])    // 支付筛选

// RentalPlan 表
@@index([category])         // 分类筛选
@@index([region])           // 地区筛选
@@index([isActive])         // 激活状态

// Review 表
@@index([rating])           // 评分排序
@@index([createdAt])        // 时间排序

// Store 表
@@index([city])             // 城市筛选
@@index([isActive])         // 激活状态
```

---

## 🔐 数据安全

### 敏感字段加密

```typescript
// 手机号加密
const encryptedPhone = encrypt(phone, SECRET_KEY);

// 邮箱脱敏显示
const maskedEmail = email.replace(
  /(.{2}).*(@.*)/,
  '$1***$2'
);  // "us***@example.com"
```

### GDPR 合规

```prisma
model User {
  // 添加数据删除标记
  deletedAt  DateTime?

  // 数据导出支持
  dataExport Json?
}
```

---

## 📈 查询优化示例

### 1. 获取用户预约（带分页）

```typescript
const bookings = await prisma.booking.findMany({
  where: {
    userId: user.id,
    status: { not: 'CANCELLED' },
  },
  include: {
    items: {
      include: {
        plan: true,
        store: true,
      },
    },
  },
  orderBy: {
    visitDate: 'desc',
  },
  take: 10,
  skip: (page - 1) * 10,
});
```

### 2. 获取套餐（带筛选和缓存）

```typescript
const plans = await redis.remember(
  `plans:${region}:${category}`,
  3600,  // 1小时缓存
  async () => {
    return await prisma.rentalPlan.findMany({
      where: {
        region,
        category,
        isActive: true,
      },
      orderBy: {
        featured: 'desc',
        createdAt: 'desc',
      },
    });
  }
);
```

---

## 🔮 未来扩展

### 多语言支持

```prisma
model RentalPlanTranslation {
  id          String @id @default(cuid())
  planId      String
  plan        RentalPlan @relation(...)

  locale      String  // "zh", "en", "ja"
  name        String
  description String

  @@unique([planId, locale])
}
```

### 库存管理

```prisma
model Inventory {
  id        String @id @default(cuid())
  planId    String
  storeId   String
  date      DateTime
  available Int
  reserved  Int

  @@unique([planId, storeId, date])
}
```

---

**最后更新**: 2025-10-20
