# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**江戸和装工房雅 (Edo Wasokobo Miyabi)** - A professional kimono rental e-commerce platform with marketplace capabilities, built with Next.js 15 App Router, TypeScript, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 15.5.5 with App Router, React 19.1.0, TypeScript 5 (strict mode)
- **Database**: PostgreSQL + Prisma 6.17.1 ORM (hosted on Supabase for production)
- **Authentication**: NextAuth.js 5.0 (beta) with email verification
- **State Management**: Zustand 5.0 (cart) + React Query 5.90 (server state)
- **Styling**: Tailwind CSS 4, Lucide React icons
- **Email**: Nodemailer with SMTP
- **AI Features**: Google Generative AI (chatbot), Replicate (virtual try-on)
- **Build Tool**: Turbopack for fast development

## Development Commands

```bash
# Development
pnpm dev                           # Start dev server with Turbopack
pnpm build                         # Build for production (includes prisma generate)
pnpm start                         # Start production server

# Database
pnpm prisma generate               # Generate Prisma client
pnpm prisma migrate dev            # Run migrations in development
pnpm prisma db push                # Push schema changes without migrations
pnpm prisma studio                 # Open Prisma Studio GUI
pnpm db:seed                       # Seed database with sample data
pnpm db:reset                      # Reset database and re-seed

# Data Import Scripts
pnpm tsx scripts/import-unified-plans.ts              # Import unified plans
pnpm tsx scripts/import-unified-plans.ts --clear      # Clear and re-import
pnpm tsx scripts/migrate-campaigns-to-plans.ts        # Migrate legacy campaigns
pnpm tsx scripts/test-db-simple.ts                    # Test database connection

# Testing
pnpm tsx [script-path]             # Run any TypeScript script
```

## Architecture

### Routing Structure

The app uses Next.js App Router with route groups:

- **`(main)/`** - Public site with shared header/footer layout
  - `/` - Homepage with featured plans and campaigns
  - `/plans` - Rental plans listing (filterable by store/category)
  - `/plans/[id]` - Plan details with add-to-cart and quick book
  - `/campaigns` - Promotional campaigns
  - `/cart` - Shopping cart page
  - `/booking` - Unified checkout (single-page, not multi-step wizard)
  - `/booking/success` - Booking confirmation
  - `/kimonos` - Kimono catalog
  - `/stores` - Store locations
  - `/profile` - User profile and booking history
  - `/merchant/*` - Merchant portal (dashboard, listings, bookings)
  - `/admin/*` - Admin dashboard
  - `/virtual-tryon` - AI virtual try-on feature

- **`(auth)/`** - Separate layout for authentication
  - `/login`, `/register`, `/verify-email`

- **`api/`** - API routes (see API section below)

### Database Schema Key Models

The Prisma schema has 24+ models. Critical relationships:

**Core Business**:
- `User` - Multi-method auth (email/phone), role-based (USER/ADMIN/STAFF/MERCHANT)
- `Store` - Multi-location support with geolocation
- `Kimono` - Catalog with images, categories, availability
- `RentalPlan` - **Unified plan system** (regular + campaign plans via `isCampaign` flag)
- `Campaign` - Promotional campaigns with date restrictions
- `CampaignPlan` - **Legacy model** (being migrated to RentalPlan)

**Shopping & Booking**:
- `Cart` / `CartItem` - Shopping cart with user/session support and expiration
- `Booking` / `BookingItem` - Bookings support guests and authenticated users
- `BookingKimono` - Specific kimono selections per booking item

**Marketplace**:
- `Merchant` - Merchant accounts with verification status
- `Listing` - Merchant-created rental listings (require approval)
- `Payout` - Merchant payment processing
- `MerchantReview` - Merchant ratings

**User Features**:
- `Favorite`, `Review`, `UserPreference`, `UserBehavior`, `VirtualTryOn`

### Important Architectural Decisions

1. **Unified Plan System**: Migration from separate `Campaign`/`CampaignPlan` to a single `RentalPlan` model with `isCampaign` flag. Both systems currently coexist during transition.

2. **Plan-Store Binding (1:N)**: One plan can be available at multiple stores
   - Uses junction table `PlanStore` for many-to-many relationship
   - Search by location filters plans → selected store carried through booking
   - No separate store selection step needed (implicit from search context)
   - Same plan can have different availability per store

3. **Flexible Pricing Units**: Plans support per-person OR per-group pricing
   - `pricingUnit`: "person" | "group"
   - `unitLabel`: Display text ("人" | "組" | "套")
   - `unitDescription`: Optional detail ("2人" | "2大人+1小孩")
   - Supports couple plans, family plans, group packages

4. **Shopping Cart Pattern**: E-commerce style cart using Zustand with localStorage persistence
   - Location: `src/store/cart.ts`
   - Each item saves independent date/time (not shared across items)
   - Auto-suggest date/time based on existing cart items
   - Store is determined by search context (e.g., `/plans?location=京都` → 京都店铺)
   - Quick booking ("立即预约") uses modal confirmation, not page redirect

5. **极简单页 Booking Flow**: Minimalist single-page checkout
   - All booking info collected in BookingCard on plan detail page
   - "立即预约": Modal confirmation → direct API submission
   - "加入购物车": Save to cart → /cart → /booking for multi-item checkout
   - Only 4 required fields: date, time, phone, name
   - Multi-store orders automatically split into separate Booking records

6. **Upgrade Services**: Add-on services priced per-group/booking
   - Photography, makeup, hairstyling, etc.
   - Price is flat (not multiplied by quantity)
   - Selected in BookingCard alongside main plan

7. **Marketplace Model**: Two operating modes
   - Platform: Admin-managed stores and plans
   - Merchant: Merchants create listings requiring approval
   - Commission-based revenue split (15% default)

## Product Design Philosophy

### Reducing Choice Paralysis Through Standardization

**Core Problem Statement:**

> "选择困难 <-- 设计标准化套餐
>
> 游客没有时间、精力和耐性去筛选和定制和服套餐。
>
> 商家没有时间、精力和方法来管理种类繁多的库存和预约。"

### Current Rental Plan Model

The platform adopts a **pre-packaged plan approach** rather than a build-your-own customization model:

**RentalPlan Structure:**
```typescript
model RentalPlan {
  // Core identification
  name         String    // Clear, descriptive plan name (e.g., "经典女士套餐")
  category     Category  // LADIES | MENS | COUPLE | FAMILY | GROUP | SPECIAL

  // Store binding (1:N relationship via junction table)
  planStores   PlanStore[]  // One plan available at multiple stores

  // Pricing with flexible units
  price         Int       // Single price point (in cents)
  originalPrice Int?      // Optional for discount display
  pricingUnit   String    // "person" | "group" (default: "person")
  unitLabel     String    // Display: "人" | "組" | "套" (default: "人")
  unitDescription String? // Detail: "2人" | "2大人+1小孩" | null
  minQuantity   Int       // Minimum purchasable (default: 1)
  maxQuantity   Int       // Maximum purchasable (default: 10)

  // Fixed duration
  duration     Int       // Hours included (e.g., 4, 6, 8 hours)

  // Pre-defined inclusions
  includes     String[]  // What's included (e.g., ["和服租赁", "专业着装", "发型设计"])

  // Curated presentation
  imageUrl     String?   // Professional photo
  description  String    // Clear explanation
  tags         Tag[]     // Filterable attributes

  // Operational
  isActive     Boolean   // On/off switch
  isCampaign   Boolean   // Campaign pricing
  isFeatured   Boolean   // Homepage prominence
}

// Junction table for Plan-Store relationship
model PlanStore {
  planId    String
  storeId   String
  plan      RentalPlan  @relation(...)
  store     Store       @relation(...)
  isActive  Boolean     @default(true)  // Can disable per-store

  @@id([planId, storeId])
}
```

**Pricing Unit Examples:**
| Plan Type | pricingUnit | unitLabel | unitDescription | Display |
|-----------|-------------|-----------|-----------------|---------|
| 女士套餐 | person | 人 | null | ¥8,800/人 |
| 情侣套餐 | group | 組 | 2人 | ¥15,000/組 (2人) |
| 家庭套餐 | group | 組 | 2大人+1小孩 | ¥25,000/組 |
| 团体套餐 | group | 組 | 5人起 | ¥50,000/組 |

### How This Reduces Decision Burden

**For Users (Guests/Tourists):**

1. **Quick Comparison**: All plans in same category show same info structure
   - Price, duration, and inclusions are immediately visible
   - No hidden costs or surprise add-ons
   - Filter by category (女士/男士/情侣) and region

2. **Transparent Expectations**: `includes[]` array clearly states what you get
   - No need to understand kimono types or accessories
   - No decision fatigue from 50+ individual options
   - "和服租赁 + 专业着装 + 发型设计" is self-explanatory

3. **Trust Through Standards**: Plans are merchant-curated, not user-assembled
   - Merchants pre-select coordinated kimonos and accessories
   - Professional styling advice is included by default
   - Reduces risk of "wrong choice" anxiety

4. **Fast Booking Flow**: Single-page checkout, minimal steps
   - Add to cart → Select date/time → Confirm
   - No multi-step wizard with 10 decision points
   - Guest checkout supported (no mandatory registration)

**For Merchants:**

1. **Simplified Inventory Management**:
   - Create 5-10 standard plans instead of managing 100+ individual items
   - Each plan represents a "package" they can reliably prepare
   - `includes[]` serves as operational checklist

2. **Standardized Pricing**:
   - Fixed price points eliminate negotiation
   - `originalPrice` supports controlled discounts
   - `isCampaign` flag for promotional periods

3. **Predictable Operations**:
   - `duration` field sets clear time expectations
   - `category` helps with resource allocation (women's vs men's dressing rooms)
   - `isActive` allows instant on/off without deletion

4. **Marketplace-Ready**:
   - Platform can enforce quality standards through approval
   - Commission calculation is straightforward (% of `price`)
   - Consistent presentation across all merchants

### Design Trade-offs & Discussion Points

**✅ Current Strengths:**

1. **Simplicity Over Flexibility**
   - Users make 2-3 decisions (category, date, store) vs 20+ item selections
   - 80% of users want "just give me a good kimono experience"
   - Mirrors successful models: Airbnb "Instant Book", Apple product tiers

2. **Operational Scalability**
   - Merchants can scale to 100+ bookings/day with standardized plans
   - Staff training is easier ("prepare Plan A" vs "check 15 customization options")
   - Reduced errors from miscommunication

3. **Price Transparency**
   - Single price point reduces checkout abandonment
   - No "bait and switch" from add-on costs
   - Competitive comparison is straightforward

**⚠️ Current Limitations & Open Questions:**

1. **Limited Personalization**
   - **Question**: Should we allow "plan customization" (e.g., add extra accessories for ¥500)?
   - **Trade-off**: Flexibility vs maintaining simplicity
   - **Current approach**: Use `tags` for personalization signals (e.g., "适合拍照", "传统风格")

2. **Kimono Selection Control**
   - **Question**: Do users want to pre-select specific kimono designs before arrival?
   - **Trade-off**: Choice control vs logistical complexity
   - **Current approach**: `imageUrl` shows representative kimono, actual selection happens in-store
   - **Future consideration**: Add `BookingKimono` selection during booking (already in schema)

3. **Add-ons vs All-Inclusive**
   - **Question**: Should high-margin items (professional photography, hair extensions) be separate add-ons?
   - **Trade-off**: Revenue optimization vs decision fatigue
   - **Current approach**: Core items in `includes[]`, premium services could be optional
   - **Schema support**: `addOns` field exists in cart system but underutilized

4. **Multi-Plan Bookings**
   - **Question**: If a couple books together, should they select 2 separate plans or 1 "couple plan"?
   - **Trade-off**: Flexibility (different preferences) vs simplicity (one checkout)
   - **Current approach**: Both supported via cart system, but couple plans encouraged

5. **Merchant Plan Proliferation**
   - **Question**: How many plans should one merchant be allowed to create?
   - **Risk**: Too many plans recreates choice paralysis
   - **Current approach**: No enforcement, but UI shows plans in compact grid
   - **Consideration**: Recommend 3-5 plans per category, use `isFeatured` to highlight best sellers

6. **Time-based Pricing**
   - **Question**: Should peak hours (weekends, holidays) have dynamic pricing?
   - **Trade-off**: Revenue optimization vs pricing transparency
   - **Current approach**: `isCampaign` for promotional periods, but no surge pricing
   - **Schema limitation**: Single `price` field, no date-based pricing rules

### Recommended Best Practices

**For Platform Operations:**
- Encourage merchants to create 3-8 total plans (not 30+)
- Each plan should be meaningfully different (price/duration/inclusions)
- Use `tags` for soft personalization (search/filter) rather than plan multiplication

**For Merchant Onboarding:**
- Template plans provided: "基础套餐", "豪华套餐", "全日体验"
- Guidance: "What would first-time kimono renters want?"
- Discourage: Individual kimono selection, à la carte pricing

**For User Experience:**
- Homepage shows 8-12 featured plans (horizontal scroll)
- Category pages show 12-20 plans in grid
- Filters are assistive, not required (region, price range, tags)
- Plan detail page emphasizes `includes[]` with visual checkmarks

### Future Considerations

1. **Guided Recommendations**: AI chatbot suggests plans based on:
   - Occasion (photoshoot, festival, casual)
   - Group composition (solo, couple, family)
   - Budget and time constraints

2. **Smart Bundling**: Auto-suggest complementary plans
   - "Your friend also selected a plan, save ¥500 as a couple"
   - Cart-level optimization vs individual plan selection

3. **Plan Templates**: Admin-curated "starter packs" for merchants
   - Reduces merchant decision fatigue too
   - Ensures platform quality consistency

4. **Performance Metrics**: Track which plans convert best
   - `currentBookings` field already exists
   - Use data to recommend merchants simplify underperforming plans

---

## Booking Flow Design

### Plan-Store Binding (1:N)

One RentalPlan can be available at multiple stores. Store selection is implicit through search context:

```typescript
model PlanStore {
  planId    String
  storeId   String
  plan      RentalPlan  @relation(...)
  store     Store       @relation(...)
  isActive  Boolean     @default(true)

  @@id([planId, storeId])
}
```

**How Store Is Determined:**

```
用户搜索 "京都"
    ↓
/plans?location=京都  (URL 携带 location 参数)
    ↓
套餐列表只显示在京都有售的套餐
    ↓
用户点击套餐进入详情页
    ↓
/plans/[id]?location=京都  (location 参数传递)
    ↓
BookingCard 显示: 📍 京都祇园本店 (从 location 匹配的店铺)
    ↓
用户预约时，storeId 自动填充 (无需手动选择)
```

**Benefits:**
- Same plan can be sold at Tokyo, Kyoto, Osaka stores
- User's search context determines which store
- No separate store selection step in booking flow
- Merchants manage one plan, enable/disable per store

**Edge Cases:**

1. **Direct link to plan (no location context)**:
   ```
   用户直接访问 /plans/[id] (无 location 参数)
       ↓
   套餐有多个可用店铺时:
       ↓
   显示店铺选择下拉框 (或默认选第一个)
   ```

2. **Plan only available at one store**:
   ```
   自动选择唯一店铺，无需用户操作
   ```

3. **User switches location after adding to cart**:
   ```
   购物车中已有京都店的套餐
       ↓
   用户切换到东京搜索
       ↓
   新添加的套餐使用东京店铺
       ↓
   结账时按店铺拆分为多个预约
   ```

### Pricing Unit Model

Plans can be priced per-person OR per-group:

```typescript
model RentalPlan {
  // Pricing unit configuration
  pricingUnit       String    @default("person")  // "person" | "group"
  unitLabel         String    @default("人")       // Display: "人" | "組" | "套"
  unitDescription   String?                        // "2人" | "2大人+1小孩" | null
  minQuantity       Int       @default(1)
  maxQuantity       Int       @default(10)
}
```

**Examples:**

| Plan Type | pricingUnit | unitLabel | unitDescription | Price Display |
|-----------|-------------|-----------|-----------------|---------------|
| 女士套餐 | person | 人 | null | ¥8,800/人 |
| 情侣套餐 | group | 組 | 2人 | ¥15,000/組 (2人) |
| 家庭套餐 | group | 組 | 2大人+1小孩 | ¥25,000/組 |
| 闺蜜套餐 | group | 組 | 2-3人 | ¥18,000/組 |

**Price Calculation:**
```typescript
// Simple: price × quantity (works for both person and group)
const itemTotal = plan.price * quantity;
```

### Upgrade Services Pricing

Upgrade services (专业摄影, 专业化妆, etc.) are priced **per group/booking**, NOT per person:

```typescript
// Example: User books 2 couples (2 × 情侣套餐)
// Adds professional photography upgrade
const basePrice = 15000 * 2;        // ¥30,000 (2 couple plans)
const upgradePrice = 30000 * 1;     // ¥30,000 (photography once, not × 2)
const total = basePrice + upgradePrice; // ¥60,000
```

### Complete Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: Discovery                                                          │
│                                                                              │
│  首页 / 搜索栏                                                                │
│  ├── 输入: 地点 (optional), 日期 (optional), 主题 (optional)                  │
│  └── 搜索 → /plans?location=京都&date=2025-01-15                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: Browse & Filter                                                    │
│                                                                              │
│  套餐列表 /plans                                                              │
│  ├── 显示: 套餐名, 价格, 店铺位置, 评分, 标签                                   │
│  ├── 筛选: 主题, 标签, 价格区间, 排序                                          │
│  └── 日期参数保留在 URL，传递到详情页                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: Plan Detail (极简单页模式)                                          │
│                                                                              │
│  套餐详情页 /plans/[id]                                                       │
│                                                                              │
│  ┌────────────────────────┐    ┌──────────────────────────────────────────┐ │
│  │  左侧内容区              │    │  BookingCard (扩展版)                     │ │
│  │  ├── VisualHub          │    │                                          │ │
│  │  ├── ServiceMap         │    │  ¥15,000 / 組 (2人)                      │ │
│  │  ├── UpgradeServices    │    │                                          │ │
│  │  ├── JourneyTimeline    │    │  📅 到店日期  [____] (auto-fill from URL) │ │
│  │  └── SocialProof        │    │  🕐 到店时间  [____]                      │ │
│  │                         │    │  📦 数量      [- 1 +] 組                  │ │
│  │                         │    │                                          │ │
│  │                         │    │  📍 店铺: 京都祇园本店 (从搜索上下文)       │ │
│  │                         │    │                                          │ │
│  │                         │    │  ─────── 已选增值服务 ───────             │ │
│  │                         │    │  📷 专业摄影  +¥30,000           [×]     │ │
│  │                         │    │                                          │ │
│  │                         │    │  ─────── 联系信息 [▼ 展开] ───────        │ │
│  │                         │    │    手机号* [____]                        │ │
│  │                         │    │    姓名*   [____]                        │ │
│  │                         │    │    邮箱    [____] (可选)                  │ │
│  │                         │    │                                          │ │
│  │                         │    │  [🛒 加入购物车]  [✨ 立即预约]           │ │
│  │                         │    │                                          │ │
│  │                         │    │  ✓ 免费取消 (提前24小时)                  │ │
│  │                         │    │  💬 30秒完成预约                          │ │
│  └────────────────────────┘    └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ↓                                           ↓
┌──────────────────────────────┐            ┌──────────────────────────────┐
│  PATH A: 加入购物车            │            │  PATH B: 立即预约              │
│  (多品结账)                    │            │  (单品快速结账)                │
│                              │            │                              │
│  保存到 Zustand:              │            │  弹出确认 Modal:              │
│  {                           │            │  ┌────────────────────────┐  │
│    planId,                   │            │  │  订单确认               │  │
│    date,    // 独立保存       │            │  │                        │  │
│    time,    // 独立保存       │            │  │  情侣套餐 × 1組         │  │
│    quantity,                 │            │  │  📍 京都祇园本店         │  │
│    upgrades,                 │            │  │  📅 2025-01-15 10:00   │  │
│    storeId, // 从搜索上下文    │            │  │  📷 专业摄影 +¥30,000   │  │
│  }                           │            │  │  ───────────────────── │  │
│                              │            │  │  💰 合计: ¥45,000      │  │
│  用户继续浏览...              │            │  │                        │  │
│              ↓               │            │  │  📞 联系信息            │  │
│  购物车 /cart                │            │  │    手机: [必填]         │  │
│  ├── 套餐列表 (按店铺分组)    │            │  │    姓名: [必填]         │  │
│  ├── 每项显示独立日期时间     │            │  │    邮箱: [可选]         │  │
│  ├── 可调整数量/删除          │            │  │                        │  │
│  └── [去预约]                │            │  │  [返回] [确认预约]      │  │
│              ↓               │            │  └────────────────────────┘  │
│  预约确认 /booking           │            │              │               │
│  ├── 订单摘要 (按店铺分组)    │            │              ↓               │
│  ├── 联系信息 (统一填写)      │            │  POST /api/bookings          │
│  └── [确认预约]              │            │              │               │
│              ↓               │            │              ↓               │
└──────────────────────────────┘            └──────────────────────────────┘
              │                                           │
              └─────────────────┬─────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: Booking Created                                                    │
│                                                                              │
│  多店铺预约自动拆分:                                                          │
│  ├── 购物车有来自 N 个不同店铺的套餐                                           │
│  └── 创建 N 个独立的 Booking 记录                                             │
│                                                                              │
│  成功页 /booking/success                                                     │
│  ├── 显示所有预约确认号                                                       │
│  ├── 发送确认邮件 (如填写了邮箱)                                               │
│  └── 引导: 添加到日历 / 查看详情                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cart Data Structure

```typescript
interface CartItem {
  id: string;              // 唯一ID (自生成)
  planId: string;          // 套餐ID
  name: string;            // 套餐名称

  // 价格相关
  price: number;           // 单价 (分)
  originalPrice?: number;  // 原价 (用于显示折扣)
  pricingUnit: "person" | "group";
  unitLabel: string;       // "人" | "組"
  unitDescription?: string; // "2人" | "2大人+1小孩"

  // 预约信息 (每项独立保存)
  quantity: number;        // 数量 (人数或組数)
  date: string;            // 到店日期 "2025-01-15"
  time: string;            // 到店时间 "10:00"

  // 店铺 (从搜索上下文获取，非用户手动选择)
  storeId: string;
  storeName: string;

  // 增值服务
  upgrades: SelectedUpgrade[];

  // 其他
  image?: string;
  isCampaign?: boolean;
}

interface SelectedUpgrade {
  id: string;
  name: string;
  price: number;  // 每組价格
  icon: string;
}
```

### Auto-Suggest Logic (日期时间)

当用户添加新套餐到购物车时，自动建议日期时间：

```typescript
const existingItems = cartStore.items;

// 1. 优先: 相同店铺的已有预约
const sameStoreItem = existingItems.find(item => item.storeId === currentPlan.storeId);
if (sameStoreItem) {
  suggestedDate = sameStoreItem.date;
  suggestedTime = sameStoreItem.time;
  // UI: "与「情侣套餐」安排同一时间？ [是] [否，选择其他时间]"
}

// 2. 备选: 最近添加的日期
else if (existingItems.length > 0) {
  const lastItem = existingItems[existingItems.length - 1];
  suggestedDate = lastItem.date;
  // UI: "您之前选择了 1月15日 [使用此日期]"
}

// 3. 默认: 从 URL 参数读取 (搜索页带过来的)
else if (searchParams.date) {
  suggestedDate = searchParams.date;
}
```

### Guest vs Registered User

| 字段 | 游客 | 注册用户 |
|------|------|----------|
| 姓名 | 手动填写 | 自动填充 (session.user.name) |
| 邮箱 | 手动填写 | 自动填充 (session.user.email) |
| 手机 | 手动填写 | 自动填充 (如 User.phone 存在) |
| 购物车 | localStorage 持久化 | 同上 (未来可同步到服务端) |
| 历史订单 | 无法查看 | /profile 页面查看 |
| 快速预约 | 每次填写联系信息 | 一键预约 (信息已保存) |

**建议**: 在 User 模型添加 `phone` 字段，让注册用户保存手机号后可自动填充。

### Booking API Changes

创建预约时，购物车按店铺拆分为多个 Booking：

```typescript
// POST /api/bookings
// Request body 包含多个 items，可能来自不同店铺

// 后端逻辑:
const itemsByStore = groupBy(items, 'storeId');

const bookings = await Promise.all(
  Object.entries(itemsByStore).map(([storeId, storeItems]) =>
    prisma.booking.create({
      data: {
        storeId,
        visitDate: storeItems[0].date,  // 同店铺使用第一个的日期
        visitTime: storeItems[0].time,
        guestName,
        guestEmail,
        guestPhone,
        items: {
          create: storeItems.map(item => ({
            planId: item.planId,
            quantity: item.quantity,
            unitPrice: item.price,
            // ...
          }))
        }
      }
    })
  )
);

// Response: 返回所有创建的 booking IDs
return { bookingIds: bookings.map(b => b.id) };
```

### Required Fields Summary

| 阶段 | 必填字段 | 可选字段 |
|------|----------|----------|
| 搜索 | (无) | 地点, 日期, 主题 |
| 套餐详情 | 日期, 时间, 数量 | 增值服务 |
| 立即预约 | 手机号, 姓名 | 邮箱, 特殊要求 |
| 购物车预约 | 手机号, 姓名 | 邮箱, 特殊要求 |

**最小路径**: 用户只需填写 **4 个字段** (日期 + 时间 + 手机 + 姓名) 即可完成预约。

---

### API Routes

All API routes follow RESTful patterns:

```
/api/auth/[...nextauth]          # NextAuth handlers
/api/auth/register               # User registration
/api/auth/verify-email           # Email verification
/api/auth/send-verification      # Resend verification email

/api/bookings                    # GET (list), POST (create)
/api/bookings/[id]               # GET, PUT, DELETE
/api/bookings/[id]/cancel        # POST - cancel booking

/api/plans/[id]                  # GET plan details
/api/campaign-plans/[id]         # GET campaign plan details (legacy)

/api/kimonos                     # GET all kimonos
/api/kimonos/[id]                # GET kimono details
/api/kimonos/featured            # GET featured kimonos

/api/stores                      # GET all stores
/api/stores/[id]                 # GET store details

/api/merchant/register           # POST - merchant registration
/api/merchant/plans              # CRUD merchant plans
/api/merchant/plans/[id]         # GET, PUT, DELETE

/api/admin/bookings              # GET all bookings (admin only)
/api/admin/inventory             # Inventory management
/api/admin/merchants/[id]/approve  # Approve merchant
/api/admin/merchants/[id]/reject   # Reject merchant

/api/chatbot                     # POST - AI chatbot interactions
/api/virtual-tryon               # POST - AI virtual try-on
```

### Authentication & Authorization

- **NextAuth.js** with Prisma adapter
- Session-based auth with email verification
- Role-based access: `USER`, `ADMIN`, `STAFF`, `MERCHANT`
- Use `auth()` helper in Server Components and API routes
- Guest checkout supported (no auth required for booking)

### State Management Patterns

1. **Cart State** (Zustand): `src/store/cart.ts`
   - Persisted to localStorage as `cart-storage`
   - Hydration handled client-side
   - Access via `useCartStore()` hook

2. **Server State** (React Query): For data fetching
   - Cache management for API responses
   - Optimistic updates where applicable

3. **Form State** (React Hook Form): Forms use react-hook-form + Zod validation

### Price Handling

**CRITICAL**: All prices stored in database as **cents (分)** for precision
- Display: Divide by 100 and format as ¥
- Calculate discounts: `((originalPrice - price) / originalPrice) * 100`
- Never use floating point for money calculations

### Booking Constraints

- All cart items must have `storeId` selected before checkout
- Booking requires: visit date + visit time (no rental/return dates)
- Guest bookings require: name, email, phone
- User bookings auto-fill from session
- Email confirmations sent asynchronously (non-blocking)

### AI Features Implementation

**Virtual Try-On** (`src/app/api/virtual-tryon/route.ts`):
- Uses Replicate API or Google Gemini
- Stores results in `VirtualTryOn` model with caching
- Tracks costs, performance metrics, and status (PROCESSING/COMPLETED/FAILED)

**AI Chatbot** (`src/app/api/chatbot/route.ts`):
- Google Generative AI integration
- Embedded component in main layout

## Environment Variables

Required in `.env.local`:

```bash
# Database (required)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
# Production: Add ?pgbouncer=true for connection pooling

# NextAuth (required)
NEXTAUTH_URL="http://localhost:3000"  # or production URL
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (required for verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="app-specific-password"
SMTP_FROM="江戸和装工房雅 <your-email@gmail.com>"

# AI Services (optional)
GOOGLE_AI_API_KEY="your-gemini-api-key"
REPLICATE_API_TOKEN="your-replicate-token"

# Redis Cache (optional)
UPSTASH_REDIS_URL="your-upstash-url"
UPSTASH_REDIS_TOKEN="your-upstash-token"
```

## Database Connection Notes

- **Development**: Direct PostgreSQL connection (port 5432)
- **Production (Vercel)**: Use Supabase with connection pooling
  - Connection pooler port: 6543
  - Add `?pgbouncer=true` parameter to DATABASE_URL
- **Build Time**: Prisma generate runs automatically via `postinstall` script
- **Migrations**: Use `prisma migrate dev` locally, `prisma db push` for quick iteration

## Code Conventions

1. **TypeScript**: Strict mode enabled, use proper types (avoid `any`)
2. **Path Aliases**: Use `@/` for `src/` directory
3. **Component Pattern**: Prefer Server Components by default, mark Client Components with `'use client'`
4. **API Responses**: Return JSON with proper HTTP status codes
5. **Error Handling**: Use try-catch in API routes, return descriptive error messages
6. **Prisma Queries**: Always use `include` to fetch relations instead of multiple queries
7. **Image Optimization**: Use Next.js `<Image>` component, configure domains in `next.config.ts`

## Common Patterns

### Adding to Cart (Client Component)

```tsx
'use client';
import { useCartStore } from '@/store/cart';

const addToCart = () => {
  useCartStore.getState().addItem({
    type: 'PLAN',
    planId: plan.id,
    name: plan.name,
    price: plan.price,
    originalPrice: plan.originalPrice,
    image: plan.images?.[0],
    addOns: [],
    isCampaign: plan.isCampaign,
  });
};
```

### Authenticated API Route

```tsx
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Query database
  const data = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { items: true, store: true },
  });

  return Response.json(data);
}
```

### Server Component Data Fetching

```tsx
import prisma from '@/lib/prisma';

export default async function PlansPage() {
  const plans = await prisma.rentalPlan.findMany({
    where: { isActive: true },
    include: { store: true },
    orderBy: { priority: 'desc' },
  });

  return <PlanGrid plans={plans} />;
}
```

## Important Files

- `prisma/schema.prisma` - Database schema (single source of truth)
- `src/store/cart.ts` - Shopping cart state management
- `src/lib/prisma.ts` - Prisma client singleton
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `next.config.ts` - Next.js configuration (image domains, build settings)
- `tailwind.config.ts` - Tailwind theme customization

## Deployment Notes

### Vercel Deployment

1. Database must be accessible from Vercel (use Supabase connection pooler)
2. Set all environment variables in Vercel dashboard
3. Build command: `pnpm build` (includes `prisma generate`)
4. Output directory: `.next`
5. Node version: 18.x or 20.x

### Build Optimization

- **Recent Change**: Removed database sync from build step to speed up deploys
- Prisma generate happens in `postinstall` and `build` script
- For production, ensure DATABASE_URL uses connection pooling

## Testing

- Manual testing via browser (no automated tests yet)
- Use Prisma Studio (`pnpm prisma studio`) to inspect database
- Test database connection: `pnpm tsx scripts/test-db-simple.ts`
- API testing: Use browser DevTools Network tab or tools like Postman

## Troubleshooting

**Email verification not sending**:
- Check SMTP credentials in `.env.local`
- For Gmail: use app-specific password, not regular password
- Check spam folder

**Database connection fails**:
- Verify PostgreSQL is running
- Check DATABASE_URL format
- For Supabase: use direct connection locally, pooled in production

**Cart not persisting**:
- Check browser localStorage (key: `cart-storage`)
- Verify client component has `'use client'` directive
- Check for hydration mismatches

**Build fails on Vercel**:
- Ensure DATABASE_URL is set in environment variables
- Check for TypeScript errors: `pnpm build` locally
- Verify Prisma schema is valid: `pnpm prisma validate`

## Recent Development Focus

Based on recent commits and file structure:

1. **Virtual Try-On Feature** - AI-powered kimono try-on (Gemini/Replicate)
2. **Schema Migration** - Moving from legacy Campaign/CampaignPlan to unified RentalPlan
3. **Build Optimization** - Removed database operations from build step for faster deploys
4. **Scene Mode Testing** - Evaluating different AI providers for virtual try-on

## Design System

- **Inspiration**: Airbnb-style UI with horizontal scrolling cards
- **Image Ratio**: 3:4 for product images (kimono display)
- **Font**: Noto Sans SC for Chinese/Japanese text
- **Color Theme**: Sakura (cherry blossom) inspired palette
- **Responsive**: Mobile-first approach, touch-friendly interactions
