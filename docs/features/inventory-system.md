# 和服租赁库存管理与预约系统设计分析

## 📊 业务场景分析

### 现实业务模式

```
┌─────────────────────────────────────────────────────────┐
│  和服租赁的库存特点                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  普通和服（< ¥38,000）           高级和服（≥ ¥38,000）    │
│  ├─ 库存量大（每店50-200件）      ├─ 库存稀少（每店5-20件） │
│  ├─ 款式相似度高                 ├─ 每件独一无二          │
│  ├─ 客户对具体款式要求低          ├─ 客户指定特定款式      │
│  ├─ 到店现场挑选                 ├─ 需提前预留            │
│  └─ 同一天可服务多人              └─ 一天只能租一次        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 核心业务挑战

### 1. **非标准化库存问题**

**现实情况**：
- ❌ 不能把和服当作"库存件数"管理（每件都不同）
- ❌ 不能简单的 `stock - booked = available`（SKU库存管理）
- ✅ 需要区分"容量管理"和"款式管理"

**类比理解**：
```
酒店模式（容量管理）:
  - 标准间：10间（同类可替换）
  - 预订时只选"标准间"，入住时分配具体房号

Airbnb模式（款式管理）:
  - 每个房源独一无二
  - 预订时就选定具体房源

和服租赁 = 混合模式：
  - 普通和服 → 酒店模式（容量管理）
  - 高级和服 → Airbnb模式（款式管理）
```

---

### 2. **信息同步挑战**

**问题根源**：
```
线下操作                    线上系统
   ↓                           ↓
商家手动整理和服    ←→    数据库库存记录
   ↓                           ↓
标记损坏/清洗中      ←→    实时可用性状态
   ↓                           ↓
临时锁定给现场客户   ←→    在线预订锁定
```

**同步难点**：
1. **时间延迟**：商家可能几小时/几天才更新系统
2. **误操作**：忘记更新、重复预订
3. **状态复杂**：可用/已预订/清洗中/维修中/下架

---

### 3. **价格分层带来的系统复杂度**

| 维度 | 普通和服（< ¥38k） | 高级和服（≥ ¥38k） |
|------|-------------------|-------------------|
| **预订方式** | 套餐级（不指定款式） | 款式级（指定具体和服） |
| **库存管理** | 容量管理（每日人数限制） | 单件管理（每件独立日历） |
| **超售风险** | 低（有替代品） | 高（无法替代） |
| **取消成本** | 低 | 高 |
| **技术复杂度** | 简单 | 复杂 |

---

## 🏗️ 技术方案设计

### 方案A：双轨制库存管理（推荐）

#### **架构设计**

```
┌────────────────────────────────────────────────┐
│           RentalPlan（套餐）                    │
│  ├─ 普通套餐（容量管理）                         │
│  │   └─ dailyCapacity: 每日可服务人数           │
│  └─ 高级套餐（款式管理）                         │
│      └─ requiredKimonos: 需选择具体和服         │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│         预订流程分叉                            │
├────────────────────────────────────────────────┤
│                                                │
│  普通套餐预订流程              高级套餐预订流程  │
│  1. 选择套餐                   1. 选择套餐      │
│  2. 选择日期                   2. 选择日期      │
│  3. 选择店铺                   3. 浏览该日期可用和服 │
│  4. 确认预订                   4. 选择具体款式  │
│  5. 到店现场挑选和服           5. 锁定该和服    │
│                                6. 确认预订      │
└────────────────────────────────────────────────┘
```

---

#### **数据库Schema设计**

```prisma
// ============ 套餐表（现有） ============
model RentalPlan {
  id              String   @id @default(cuid())
  name            String
  price           Int
  category        Category

  // 新增：库存管理类型
  inventoryType   InventoryType  @default(CAPACITY)  // CAPACITY | ITEM_LEVEL

  // 容量管理字段（普通和服）
  dailyCapacity   Int?           // 每日最大服务人数（例如：10人/天）

  // 款式管理字段（高级和服）
  requireKimonoSelection Boolean @default(false)  // 是否需要选择具体和服

  // 关联
  bookingItems    BookingItem[]
  kimonos         Kimono[]       // 该套餐包含的和服（仅高级套餐）
}

enum InventoryType {
  CAPACITY      // 容量管理（普通和服）
  ITEM_LEVEL    // 款式级管理（高级和服）
}

// ============ 和服表（现有 + 增强） ============
model Kimono {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique      // 和服编号（例如：KM-2024-001）
  price       Int
  status      KimonoStatus @default(AVAILABLE)

  // 新增：日历管理
  blackoutDates DateTime[]        // 不可用日期（清洗/维修）

  // 关联
  planId      String?
  plan        RentalPlan? @relation(fields: [planId], references: [id])
  bookings    BookingKimono[]
  reservations KimonoReservation[]
}

enum KimonoStatus {
  AVAILABLE      // 可用
  RESERVED       // 已预留
  IN_USE         // 使用中
  CLEANING       // 清洗中
  MAINTENANCE    // 维修中
  RETIRED        // 下架
}

// ============ 新增：和服预留表 ============
model KimonoReservation {
  id          String   @id @default(cuid())
  kimonoId    String
  bookingId   String
  date        DateTime  // 预留日期
  status      ReservationStatus @default(PENDING)

  kimono      Kimono   @relation(fields: [kimonoId], references: [id])
  booking     Booking  @relation(fields: [bookingId], references: [id])

  createdAt   DateTime @default(now())
  expiresAt   DateTime // 预留过期时间（例如：30分钟后）

  @@unique([kimonoId, date]) // 一件和服同一天只能被预留一次
  @@index([date])
  @@index([expiresAt])
}

enum ReservationStatus {
  PENDING     // 待确认（购物车阶段）
  CONFIRMED   // 已确认（支付后）
  CANCELLED   // 已取消
  EXPIRED     // 已过期
}

// ============ 新增：每日容量表 ============
model DailyCapacity {
  id          String   @id @default(cuid())
  planId      String
  storeId     String
  date        DateTime

  capacity    Int      // 当日容量（默认从plan.dailyCapacity）
  booked      Int      @default(0)  // 已预订数量
  available   Int      // 可用数量（自动计算：capacity - booked）

  plan        RentalPlan @relation(fields: [planId], references: [id])
  store       Store      @relation(fields: [storeId], references: [id])

  @@unique([planId, storeId, date])
  @@index([date])
}
```

---

### **预订流程对比**

#### **流程1：普通和服（容量管理）**

```typescript
// 1. 用户选择套餐和日期
const plan = await prisma.rentalPlan.findUnique({
  where: { id: planId },
  include: { dailyCapacities: true }
});

// 2. 检查容量
const capacity = await prisma.dailyCapacity.findUnique({
  where: {
    planId_storeId_date: {
      planId,
      storeId,
      date: visitDate
    }
  }
});

if (capacity.available < quantity) {
  throw new Error('该日期名额已满');
}

// 3. 创建预订（不指定具体和服）
const booking = await prisma.booking.create({
  data: {
    visitDate,
    items: {
      create: {
        planId,
        storeId,
        quantity,
        // ❌ 不创建 kimonoId 关联
      }
    }
  }
});

// 4. 扣减容量
await prisma.dailyCapacity.update({
  where: { id: capacity.id },
  data: {
    booked: { increment: quantity },
    available: { decrement: quantity }
  }
});

// ✅ 用户到店后现场挑选和服
```

---

#### **流程2：高级和服（款式管理）**

```typescript
// 1. 用户选择套餐和日期
const plan = await prisma.rentalPlan.findUnique({
  where: { id: planId },
  include: { kimonos: true }
});

if (!plan.requireKimonoSelection) {
  throw new Error('该套餐不需要选择款式');
}

// 2. 查询该日期可用的和服
const availableKimonos = await prisma.kimono.findMany({
  where: {
    planId,
    status: 'AVAILABLE',
    NOT: {
      reservations: {
        some: {
          date: visitDate,
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      }
    },
    NOT: {
      blackoutDates: {
        has: visitDate
      }
    }
  }
});

// 3. 用户选择具体和服款式
const selectedKimonoId = userChoice;

// 4. 创建临时预留（购物车阶段）
const reservation = await prisma.kimonoReservation.create({
  data: {
    kimonoId: selectedKimonoId,
    bookingId: tempBookingId,
    date: visitDate,
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30分钟后过期
  }
});

// 5. 支付成功后确认预留
await prisma.kimonoReservation.update({
  where: { id: reservation.id },
  data: { status: 'CONFIRMED' }
});

// ✅ 该和服在指定日期被锁定
```

---

## 🔄 线上线下同步策略

### 问题：商家如何管理线下库存？

#### **策略1：商家后台实时更新**

**商家操作界面**：
```
┌────────────────────────────────────┐
│  和服库存管理                       │
├────────────────────────────────────┤
│                                    │
│  编号：KM-2024-001                 │
│  名称：樱花刺绣振袖                 │
│  状态：[可用 ▼]                    │
│        ├─ 可用                     │
│        ├─ 清洗中（预计2天）         │
│        ├─ 维修中                   │
│        └─ 下架                     │
│                                    │
│  不可用日期：                       │
│  [2025-01-15] [2025-01-16] [删除]  │
│  [+ 添加日期]                      │
│                                    │
│  [保存更新]                         │
└────────────────────────────────────┘
```

**后端实现**：
```typescript
// API: PUT /api/merchant/kimonos/[id]
export async function PUT(req: Request) {
  const { status, blackoutDates } = await req.json();

  await prisma.kimono.update({
    where: { id: kimonoId },
    data: {
      status,
      blackoutDates: {
        set: blackoutDates // 替换整个数组
      }
    }
  });

  // 自动取消冲突预订（可选）
  if (status !== 'AVAILABLE') {
    await cancelConflictingReservations(kimonoId);
  }
}
```

---

#### **策略2：自动状态流转**

```typescript
// 定时任务：每天凌晨运行
async function autoUpdateKimonoStatus() {
  const today = new Date();

  // 1. 预订结束后 → 自动标记为"清洗中"
  await prisma.kimono.updateMany({
    where: {
      reservations: {
        some: {
          date: { lt: today },
          status: 'CONFIRMED'
        }
      }
    },
    data: {
      status: 'CLEANING',
      blackoutDates: {
        push: [today, addDays(today, 1)] // 清洗需要2天
      }
    }
  });

  // 2. 清洗期满 → 自动恢复"可用"
  const kimonos = await prisma.kimono.findMany({
    where: {
      status: 'CLEANING',
      blackoutDates: {
        none: { gte: today } // 所有黑名单日期都过去了
      }
    }
  });

  for (const kimono of kimonos) {
    await prisma.kimono.update({
      where: { id: kimono.id },
      data: {
        status: 'AVAILABLE',
        blackoutDates: [] // 清空黑名单
      }
    });
  }
}
```

---

#### **策略3：预留过期自动释放**

```typescript
// 定时任务：每5分钟运行
async function cleanupExpiredReservations() {
  const now = new Date();

  // 查找过期的临时预留
  const expired = await prisma.kimonoReservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: now }
    }
  });

  // 批量标记为过期
  await prisma.kimonoReservation.updateMany({
    where: {
      id: { in: expired.map(r => r.id) }
    },
    data: {
      status: 'EXPIRED'
    }
  });

  console.log(`释放了 ${expired.length} 个过期预留`);
}
```

---

## ⚖️ 方案对比

### 方案A：双轨制（推荐）

**优点**：
- ✅ 符合真实业务逻辑
- ✅ 灵活性高（普通/高级分开管理）
- ✅ 避免过度设计（普通和服不需要复杂系统）
- ✅ 渐进式实施（先做容量管理，后加款式管理）

**缺点**：
- ⚠️ 系统复杂度中等
- ⚠️ 需要两套预订流程

---

### 方案B：纯容量管理（简化版）

**适用场景**：暂时不支持高级和服预留

```prisma
model RentalPlan {
  dailyCapacity Int  // 每日人数限制
}

model DailyCapacity {
  planId   String
  date     DateTime
  capacity Int
  booked   Int
}
```

**优点**：
- ✅ 极简实现
- ✅ 无需和服选择功能

**缺点**：
- ❌ 无法支持高级和服预留需求
- ❌ 未来扩展困难

---

### 方案C：纯款式管理（过度设计）

**描述**：所有和服都需要选择具体款式

**优点**：
- ✅ 系统统一

**缺点**：
- ❌ 普通和服不需要这么复杂
- ❌ 用户体验差（选择困难）
- ❌ 商家运营成本高

---

## 🎯 推荐实施路线

### Phase 1：容量管理（1周）

**目标**：支持普通和服的每日容量限制

**实现**：
1. 添加 `RentalPlan.dailyCapacity` 字段
2. 创建 `DailyCapacity` 表
3. 预订时检查容量
4. 套餐详情页显示"剩余X个名额"

**效果**：
- ✅ 防止超额预订
- ✅ 实时显示可用性
- ✅ 适用于80%的业务场景

---

### Phase 2：款式选择（2周）

**目标**：支持高级和服的款式级预订

**实现**：
1. 添加 `Kimono` 详细信息
2. 创建 `KimonoReservation` 预留表
3. 高级套餐预订流程增加"选择款式"步骤
4. 购物车临时锁定（30分钟）
5. 商家后台和服状态管理

**效果**：
- ✅ 支持高价和服预留
- ✅ 防止重复预订
- ✅ 线上线下库存同步

---

### Phase 3：自动化（按需）

**可选功能**：
- 自动状态流转（清洗 → 可用）
- 预留过期自动释放
- 冲突预订提醒
- 库存预警（和服数量不足时通知商家）

---

## 📊 关键指标监控

### 需要追踪的数据

```typescript
// 1. 容量利用率
const utilizationRate = (booked / capacity) * 100;

// 2. 超售风险
const overbookingRisk = reservations.filter(r =>
  r.status === 'PENDING' && r.expiresAt > now
).length;

// 3. 和服周转率
const turnoverRate = bookings.length / kimonos.length;

// 4. 取消率
const cancellationRate = (cancelled / total) * 100;
```

---

## 🤔 需要讨论的问题

### 1. **定价策略与预留服务的关系**

**当前逻辑**：
- < ¥38,000 → 不提供预留
- ≥ ¥38,000 → 提供预留

**问题**：
- 是否所有高价套餐都需要预留？
- 还是只有"指定款式"的套餐需要？

**建议**：
```
套餐属性：
  - 标准套餐（容量管理）：大部分
  - 指定款式套餐（款式管理）：少部分高价+稀缺

允许同一价位有两种类型：
  - ¥50,000 标准套餐（到店挑选）
  - ¥50,000 指定款式套餐（需预留樱花限定款）
```

---

### 2. **临时预留的时长**

**问题**：购物车中的和服应该锁定多久？

**选项**：
- A. 15分钟（Ticketmaster模式）
- B. 30分钟（推荐）
- C. 60分钟
- D. 不限时（直到支付或主动释放）

**建议**：30分钟 + 倒计时提醒

---

### 3. **超售处理策略**

**场景**：容量管理的套餐，预订数超过实际库存

**策略**：
- A. 严格拒绝（用户体验差）
- B. 允许10%超售（常见做法，赌有人会取消）
- C. 候补名单（Waitlist）

**建议**：策略B + 提前通知商家准备

---

### 4. **线下临时预订的处理**

**场景**：客户直接到店预订，未通过系统

**解决方案**：
- 商家手动在后台创建"线下预订"
- 自动占用容量/锁定和服
- 标记为"线下支付"

---

## 🚀 快速启动方案

如果你想立即改善，我推荐：

### 最小可行方案（MVP）

**只实现容量管理**：
1. 给每个套餐设置 `dailyCapacity`（例如：10人/天）
2. 预订时检查当日已预订数量
3. 显示"剩余X个名额"

**代码量**：约500行
**时间**：2-3天
**覆盖场景**：80%的业务需求

---

你觉得：
1. **双轨制方案**是否符合业务需求？
2. **¥38,000的分界线**是硬性规定还是可调整？
3. **临时预留时长**倾向于多久？
4. 是否需要立即实现，还是分阶段？

我可以根据你的反馈立即开始实现！🎯
