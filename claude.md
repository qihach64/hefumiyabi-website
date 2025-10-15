# 购物车集成预约系统 - 设计方案

## 📋 当前问题分析

### 现有预约流程的问题
1. ❌ **冗余的时间字段**：需要填写租赁日期、归还日期、取衣时间、还衣时间（太复杂）
2. ❌ **无购物车功能**：用户无法一次预约多个套餐或和服
3. ❌ **缺少店铺筛选**：在套餐和活动页面无法按店铺过滤
4. ❌ **分步流程繁琐**：4个步骤的向导式流程对简单预约来说太重

### 用户需求
- ✅ 只需选择**到店日期和时间**
- ✅ 支持**购物车**功能，可以一次预约多个项目
- ✅ 在套餐/活动页面可以**按店铺筛选**
- ✅ 更简洁流畅的预约体验

---

## 🎯 新设计方案

### 方案 A：购物车 + 简化预约流程 (推荐)

#### 核心理念
将和服租赁体验设计得像**电商购物**一样简单直观：
- 浏览套餐 → 加入购物车 → 统一填写到店信息 → 确认预约

#### 数据模型设计

```typescript
// 购物车项（存储在浏览器 localStorage 或用户账户）
interface CartItem {
  id: string;                    // 唯一ID
  type: 'plan' | 'campaign';     // 套餐类型
  planId?: string;               // 常规套餐ID
  campaignPlanId?: string;       // 活动套餐ID
  name: string;                  // 套餐名称
  price: number;                 // 价格（分）
  originalPrice?: number;        // 原价（活动套餐）
  image?: string;                // 图片
  storeId?: string;              // 预选店铺
  storeName?: string;            // 店铺名称
  quantity: number;              // 数量（支持多人预约）
  addOns: string[];              // 附加服务
  notes?: string;                // 备注
}

// 简化的预约数据
interface BookingData {
  // 购物车项
  items: CartItem[];

  // 统一的到店信息
  visitDate: Date;               // 到店日期
  visitTime: string;             // 到店时间（如 "10:00"）
  storeId: string;               // 店铺ID

  // 联系信息
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;

  // 其他
  specialRequests?: string;      // 特殊要求
}
```

#### 用户流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 浏览页面（Plans / Campaigns）                              │
│    - 按店铺筛选                                               │
│    - 查看套餐详情                                             │
│    - 点击"加入购物车"                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 购物车页面 (/cart)                                          │
│    - 查看所有已选项目                                          │
│    - 调整数量 / 添加附加服务                                    │
│    - 移除项目                                                 │
│    - 查看总价                                                 │
│    - 点击"去预约"                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 预约页面 (/checkout)                                       │
│    【单页表单 - 不再是多步骤向导】                              │
│                                                               │
│    ┌─────────────────────────────────────────┐              │
│    │ 预约摘要                                  │              │
│    │ - 显示购物车所有项目                       │              │
│    │ - 总价                                    │              │
│    └─────────────────────────────────────────┘              │
│                                                               │
│    ┌─────────────────────────────────────────┐              │
│    │ 到店信息                                  │              │
│    │ ☐ 选择店铺                                │              │
│    │ ☐ 到店日期                                │              │
│    │ ☐ 到店时间                                │              │
│    └─────────────────────────────────────────┘              │
│                                                               │
│    ┌─────────────────────────────────────────┐              │
│    │ 联系方式                                  │              │
│    │ ☐ 姓名                                    │              │
│    │ ☐ 邮箱                                    │              │
│    │ ☐ 手机                                    │              │
│    └─────────────────────────────────────────┘              │
│                                                               │
│    [ 确认预约 ]                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 预约成功页面                                               │
│    - 预约确认信息                                             │
│    - 发送确认邮件                                             │
└─────────────────────────────────────────────────────────────┘
```

#### UI 组件设计

##### 1. 套餐/活动页面的改进

```tsx
// 店铺筛选器组件
<StoreFilter
  stores={stores}
  selectedStoreId={selectedStoreId}
  onStoreChange={(storeId) => setSelectedStoreId(storeId)}
/>

// 套餐卡片的"加入购物车"按钮
<ProductCard>
  <button onClick={addToCart}>
    🛒 加入购物车
  </button>
  <Link href={`/booking?planId=${plan.id}`}>
    立即预约
  </Link>
</ProductCard>
```

##### 2. 购物车组件

```tsx
// 购物车图标（显示在导航栏）
<CartIcon count={cartItems.length} />

// 购物车页面
<CartPage>
  <CartItems items={cartItems} />
  <CartSummary total={totalPrice} />
  <CheckoutButton>去预约</CheckoutButton>
</CartPage>
```

##### 3. 简化的预约页面

```tsx
<CheckoutPage>
  {/* 左侧：预约表单 */}
  <CheckoutForm>
    <StoreSelection />
    <DateTimePicker />
    <ContactInfo />
    <SpecialRequests />
  </CheckoutForm>

  {/* 右侧：订单摘要 */}
  <OrderSummary items={cartItems} />
</CheckoutPage>
```

---

### 方案 B：快速预约模式（保留原流程作为备选）

保留现有的4步向导流程，但同时提供"快速预约"入口：

```
套餐卡片上的两个按钮：
┌──────────────────────┐
│ [🛒 加入购物车]        │  ← 新增
│ [⚡ 立即预约]          │  ← 原有流程
└──────────────────────┘
```

---

## 🗄️ 数据库修改建议

### 1. 添加购物车表（可选 - 也可以只用 localStorage）

```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String?  // null 表示游客购物车
  sessionId String?  // 游客使用 sessionId

  items     CartItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  expiresAt DateTime // 购物车过期时间

  @@index([userId])
  @@index([sessionId])
  @@map("carts")
}

model CartItem {
  id              String  @id @default(cuid())
  cartId          String
  cart            Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)

  type            String  // 'plan' | 'campaign'
  planId          String?
  campaignPlanId  String?
  storeId         String?

  quantity        Int     @default(1)
  addOns          String[]
  notes           String?

  createdAt       DateTime @default(now())

  @@map("cart_items")
}
```

### 2. 修改 Booking 表

```prisma
model Booking {
  id String @id @default(cuid())

  // 用户信息
  userId     String?
  user       User?   @relation(fields: [userId], references: [id])
  guestName  String?
  guestEmail String?
  guestPhone String?

  // 简化的时间信息
  storeId    String
  store      Store   @relation(fields: [storeId], references: [id])
  visitDate  DateTime  // 到店日期
  visitTime  String    // 到店时间 "10:00"

  // 预约项（支持多个套餐）
  items      BookingItem[]

  // 支付和状态
  totalAmount   Int
  depositAmount Int
  paidAmount    Int @default(0)
  paymentStatus PaymentStatus @default(PENDING)
  status        BookingStatus @default(PENDING)

  // 备注
  specialRequests String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("bookings")
}

model BookingItem {
  id         String  @id @default(cuid())
  bookingId  String
  booking    Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  type            String  // 'plan' | 'campaign'
  planId          String?
  plan            RentalPlan? @relation(fields: [planId], references: [id])
  campaignPlanId  String?

  quantity        Int     @default(1)
  unitPrice       Int     // 单价（分）
  totalPrice      Int     // 总价（分）

  addOns          String[]
  notes           String?

  // 选择的和服（如果适用）
  kimonos         BookingKimono[]

  @@map("booking_items")
}
```

---

## 🎨 UI/UX 改进点

### 1. 导航栏添加购物车图标

```tsx
<Header>
  <Logo />
  <Nav>
    <Link href="/">首页</Link>
    <Link href="/plans">套餐</Link>
    <Link href="/campaigns">优惠活动</Link>
  </Nav>
  <Actions>
    <CartIcon count={3} />  {/* 显示购物车数量 */}
    <UserMenu />
  </Actions>
</Header>
```

### 2. 套餐页面添加店铺筛选

```tsx
<PlansPage>
  <Header>
    <h1>租赁套餐</h1>
    <StoreFilter>
      <option value="">所有店铺</option>
      <option value="store1">浅草本店</option>
      <option value="store2">浅草站前店</option>
      <option value="store3">京都清水寺店</option>
    </StoreFilter>
  </Header>

  <PlanGrid>
    {/* 套餐卡片 */}
  </PlanGrid>
</PlansPage>
```

### 3. 加入购物车动画效果

```tsx
// 点击"加入购物车"时的动画
<button onClick={handleAddToCart}>
  {isAdding ? (
    <span className="animate-bounce">✓ 已加入</span>
  ) : (
    <span>🛒 加入购物车</span>
  )}
</button>

// 商品飞入购物车的动画效果
<AnimatedCartIcon />
```

---

## 📱 响应式设计考虑

- 移动端：购物车以底部抽屉形式展示
- 桌面端：购物车可以是右侧滑出面板或独立页面
- 平板：类似桌面端但布局更紧凑

---

## 🔄 状态管理方案

### 选项 1：React Context + localStorage

```tsx
// contexts/CartContext.tsx
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    // 添加逻辑
  };

  const removeFromCart = (itemId: string) => {
    // 移除逻辑
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};
```

### 选项 2：Zustand (更简洁)

```tsx
// store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
    }),
    { name: 'cart-storage' }
  )
);
```

---

## ⚡ 实施优先级

### Phase 1：核心功能 (1-2 周)
1. ✅ 简化预约表单（移除归还日期/时间）
2. ✅ 创建购物车数据结构
3. ✅ 实现"加入购物车"功能
4. ✅ 创建购物车页面

### Phase 2：筛选和优化 (1 周)
1. ✅ 添加店铺筛选器
2. ✅ 优化预约流程 UI
3. ✅ 添加购物车动画

### Phase 3：高级功能 (可选)
1. 保存购物车到数据库（登录用户）
2. 购物车分享功能
3. 预约历史和重新预约

---

## 🤔 需要讨论的问题

### Q1: 购物车存储方式
- **选项 A**：只用 localStorage（简单，适合游客）
- **选项 B**：数据库 + localStorage（支持跨设备，需要登录）
- **推荐**：先用 localStorage，后期扩展到数据库

### Q2: 是否允许跨店铺预约
- **选项 A**：一次预约只能选一个店铺（简单）
- **选项 B**：可以跨店铺，分别生成预约（复杂）
- **推荐**：选项 A，购物车内所有项目共享同一个店铺和时间

### Q3: 购物车中的同一套餐是否合并
- **选项 A**：合并为一项，显示数量（节省空间）
- **选项 B**：分开显示，方便个性化备注
- **推荐**：选项 A，但支持为每个数量添加备注

### Q4: 现有预约流程如何处理
- **选项 A**：完全替换为新流程
- **选项 B**：保留两种入口（购物车 vs 立即预约）
- **推荐**：选项 B，给用户更多选择

---

## 🎯 最终推荐方案

**采用「方案 A：购物车 + 简化预约流程」+ 保留快速预约入口**

### 核心改进：
1. ✅ 只需填写到店日期和时间
2. ✅ 支持购物车功能
3. ✅ 套餐/活动页面支持店铺筛选
4. ✅ 简化为单页预约表单（不是4步向导）

### 技术栈：
- 状态管理：Zustand + localStorage
- 数据库：扩展现有 Booking 模型
- UI：Tailwind CSS + Framer Motion（动画）

---

## 📝 下一步行动

**请反馈以下问题，我将开始实施：**

1. ✅ 是否同意采用购物车方案？
2. ✅ 购物车存储用 localStorage 还是数据库？
3. ✅ 是否允许跨店铺预约？
4. ✅ 是否保留原有的"立即预约"流程？
5. ✅ 有其他特殊需求吗？

---

*Generated by Claude - 江戸和装工房雅 预约系统重构方案*
