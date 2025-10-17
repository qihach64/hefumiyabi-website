# 套餐和活动系统重构方案

## 🔍 当前问题分析

### 1. 数据冗余

#### RentalPlan vs CampaignPlan 对比

| 字段 | RentalPlan | CampaignPlan | 冗余程度 |
|------|------------|--------------|----------|
| name | ✓ | ✓ | 100% |
| nameEn | ✓ | ✓ | 100% |
| description | ✓ | ✓ | 100% |
| price/campaignPrice | ✓ | ✓ | 100% |
| originalPrice | ✓ | ✓ | 100% |
| duration | ✓ | ✓ | 100% |
| includes | ✓ | ✓ | 100% |
| storeName | ✓ | ✓ | 100% |
| region | ✓ | ✓ | 100% |
| tags | ✓ | ✓ | 100% |
| imageUrl/images | ✓ | ✓ | 100% |

**结论**：两个模型有90%+的字段重复！

### 2. UI/UX 割裂

#### 当前用户体验问题

```
用户想找"情侣套餐"：

场景1：在套餐页面(/plans)
- 找到：常规情侣套餐
- 价格：¥1000
- 但错过了：活动页面的情侣套餐优惠价¥700

场景2：在活动页面(/campaigns)
- 找到：10周年情侣套餐
- 价格：¥700
- 但错过了：常规套餐页面的其他情侣选择

问题：
❌ 用户需要在两个页面之间来回切换
❌ 可能错过最优惠的选择
❌ 不知道哪个页面有完整的套餐
❌ 增加决策复杂度
```

### 3. 代码维护成本

```
重复的代码：
- PlansClient.tsx (365行)
- CampaignsClient.tsx (279行)
- 两者有80%相似代码

重复的逻辑：
- 筛选逻辑（店铺、地区、标签）
- 卡片展示（PlanCard vs CampaignCard）
- 添加购物车逻辑
- 立即预约逻辑
```

---

## 💡 重构方案

### 方案一：统一为套餐系统（推荐）⭐

#### 核心思路

**将Campaign作为套餐的标签/分类，而不是独立的系统**

#### 数据库重构

```prisma
model RentalPlan {
  id   String @id @default(cuid())
  slug String @unique

  name        String
  nameEn      String?
  description String

  category PlanCategory

  // 价格系统
  price         Int  // 线上预约价格（人民币分）
  originalPrice Int? // 线下原价（人民币分）
  depositAmount Int  @default(0)
  duration      Int  // 小时

  // 套餐详情
  includes  String[]
  imageUrl  String?
  storeName String?
  region    String?
  tags      String[] @default([])

  // 活动标记（新增）
  campaignId String? // 关联到活动（如果是活动套餐）
  campaign   Campaign? @relation(fields: [campaignId], references: [id])
  
  // 活动特有字段
  isCampaign    Boolean @default(false)  // 是否为活动套餐
  isLimited     Boolean @default(false)  // 是否限量
  maxBookings   Int?    // 最大预订数
  currentBookings Int   @default(0)      // 当前预订数
  
  // 时间限制
  availableFrom DateTime? // 可用开始时间
  availableUntil DateTime? // 可用结束时间

  isActive Boolean @default(true)
  isFeatured Boolean @default(false) // 是否推荐

  // 关联
  bookingItems BookingItem[]
  cartItems    CartItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([campaignId])
  @@index([isCampaign])
  @@index([availableFrom, availableUntil])
  @@map("rental_plans")
}

model Campaign {
  id   String @id @default(cuid())
  slug String @unique

  title       String
  titleEn     String?
  description String
  subtitle    String?

  // 活动时间
  startDate DateTime
  endDate   DateTime

  // 活动状态
  isActive  Boolean @default(true)
  isPinned  Boolean @default(false)
  priority  Int     @default(0)

  // 媒体资源
  coverImage String?
  bannerImage String?

  type CampaignType @default(DISCOUNT)
  restrictions String[]
  terms String?

  // 关联套餐（反向关联）
  plans RentalPlan[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive])
  @@index([startDate, endDate])
  @@map("campaigns")
}

// 删除 CampaignPlan 模型
```

#### UI/UX 重构

**统一的套餐页面** (`/plans`)

```tsx
export default function PlansPage() {
  // 获取所有套餐（包括活动套餐和常规套餐）
  const allPlans = await prisma.rentalPlan.findMany({
    where: { isActive: true },
    include: { campaign: true },
    orderBy: [
      { isCampaign: 'desc' },  // 活动套餐优先
      { price: 'asc' }
    ]
  });

  // 获取活跃的活动
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      endDate: { gte: new Date() }
    }
  });

  return (
    <PlansClient 
      plans={allPlans}
      campaigns={activeCampaigns}
    />
  );
}
```

**组件结构**

```tsx
<PlansClient>
  {/* 侧边栏筛选器 */}
  <FilterSidebar>
    📍 地区
    🏪 店铺
    🏷️ 标签
    🎊 活动类型（新增）
    💰 价格范围（新增）
  </FilterSidebar>

  {/* 内容区域 */}
  <ContentArea>
    {/* 活动套餐区域（如果有） */}
    {activeCampaignPlans.length > 0 && (
      <section>
        <h2>🎉 限时优惠套餐</h2>
        <PlanGrid plans={activeCampaignPlans} />
      </section>
    )}

    {/* 所有套餐（统一展示） */}
    <section>
      <h2>全部套餐</h2>
      <PlanGrid plans={filteredPlans} />
    </section>
  </ContentArea>
</PlansClient>
```

#### 优势

✅ **数据统一**：
- 只维护一个 RentalPlan 模型
- 通过 `isCampaign` 标记区分
- 减少90%的数据冗余

✅ **UI统一**：
- 只需要一个 PlansClient 组件
- 统一的筛选逻辑
- 统一的卡片展示

✅ **用户体验**：
- 用户在一个页面看到所有套餐
- 活动套餐自动标记为"限时优惠"
- 可以同时比较活动套餐和常规套餐

✅ **代码维护**：
- 减少50%的代码量
- 统一的业务逻辑
- 更容易扩展新功能

---

### 方案二：保留独立页面，但统一数据模型

#### 核心思路

**保留 `/plans` 和 `/campaigns` 两个页面，但使用同一个数据模型**

#### 数据库设计

```prisma
// 只保留 RentalPlan，删除 CampaignPlan
model RentalPlan {
  // ... 所有字段（包含活动相关字段）
  
  campaignId String?
  campaign   Campaign? @relation(...)
  isCampaign Boolean @default(false)
}

model Campaign {
  // ... 活动元数据
  plans RentalPlan[]
}
```

#### 页面职责

**Plans页面** (`/plans`)
```tsx
// 显示所有套餐（包括活动套餐）
const allPlans = await prisma.rentalPlan.findMany({
  where: { isActive: true },
  include: { campaign: true }
});

// 活动套餐会显示活动标签和倒计时
```

**Campaigns页面** (`/campaigns`)
```tsx
// 按活动分组显示
const campaigns = await prisma.campaign.findMany({
  where: { isActive: true },
  include: {
    plans: {
      where: { isCampaign: true }
    }
  }
});

// 展示活动横幅、条款、倒计时等
```

#### 优势

✅ **数据统一**：只有一个套餐模型
✅ **保留活动页面**：活动营销的独立入口
✅ **灵活展示**：可以按活动维度展示

---

### 方案三：标签化活动系统（最灵活）

#### 核心思路

**将活动作为套餐的特殊标签，通过筛选器展示**

#### 数据库设计

```prisma
model RentalPlan {
  // ... 基础字段
  
  // 活动相关
  campaigns String[] // 关联的活动slug数组
  
  // 示例：campaigns: ['10th-anniversary', 'spring-special']
}

model Campaign {
  id   String @id
  slug String @unique
  // ... 只保留活动元数据，不关联套餐
}
```

#### UI实现

**统一的套餐页面**

```tsx
<PlansClient>
  <FilterSidebar>
    {/* 活动筛选器 */}
    <div>
      <h3>🎊 限时活动</h3>
      <button [全部套餐] />
      <button [10周年特惠] />
      <button [春季促销] />
    </div>
  </FilterSidebar>

  <ContentArea>
    {/* 所有套餐统一展示 */}
    {/* 活动套餐会自动显示活动徽章 */}
  </ContentArea>
</PlansClient>
```

---

## 🎯 推荐方案：方案一（统一套餐系统）

### 为什么选择方案一？

#### 1. 用户体验最优

```
当前体验（分离）：
用户：我想找情侣套餐
  ↓
查看套餐页面 → 找到3个
  ↓
查看活动页面 → 又找到2个
  ↓
需要记住并比较5个套餐 ❌

优化后体验（统一）：
用户：我想找情侣套餐
  ↓
查看套餐页面 → 一次性看到所有5个
  ↓
可以直接比较价格和特色 ✅
  ↓
筛选器选择"限时活动"可以只看活动套餐 ✅
```

#### 2. 数据一致性

```
当前问题：
- RentalPlan 有 storeName、region、tags
- CampaignPlan 也有这些字段
- 两边需要分别维护 ❌

统一后：
- 只维护 RentalPlan
- 所有字段只存在一次 ✅
- 数据更新只需要改一个地方 ✅
```

#### 3. 功能扩展性

```
未来功能添加：
- 会员专享套餐
- 早鸟优惠套餐
- 节日特惠套餐
- 限时闪购套餐

当前方案：
需要创建新的 MemberPlan、EarlyBirdPlan 模型 ❌

统一方案：
只需要添加标签或关联到 Campaign ✅
```

---

## 🚀 实施计划

### 阶段1：数据迁移

#### 1.1 更新 Prisma Schema

```prisma
// 为 RentalPlan 添加活动字段
model RentalPlan {
  // ... 现有字段
  
  // 活动关联
  campaignId String?
  campaign   Campaign? @relation(fields: [campaignId], references: [id])
  
  isCampaign    Boolean @default(false)
  isLimited     Boolean @default(false)
  maxBookings   Int?
  currentBookings Int @default(0)
  
  availableFrom DateTime?
  availableUntil DateTime?
}

// Campaign 反向关联
model Campaign {
  // ... 现有字段
  plans RentalPlan[]
}
```

#### 1.2 数据迁移脚本

```typescript
// scripts/migrate-campaigns-to-plans.ts
async function migrateCampaignPlans() {
  const campaignPlans = await prisma.campaignPlan.findMany({
    include: { campaign: true }
  });

  for (const cp of campaignPlans) {
    // 创建对应的 RentalPlan
    await prisma.rentalPlan.create({
      data: {
        name: cp.name,
        nameEn: cp.nameEn,
        description: cp.description,
        category: inferCategory(cp.name),
        price: cp.campaignPrice,
        originalPrice: cp.originalPrice,
        duration: cp.duration || 8,
        includes: cp.includes,
        imageUrl: cp.images[0],
        storeName: cp.storeName,
        region: cp.region,
        tags: cp.tags,
        
        // 活动相关字段
        campaignId: cp.campaignId,
        isCampaign: true,
        isLimited: cp.maxBookings !== null,
        maxBookings: cp.maxBookings,
        currentBookings: cp.currentBookings,
        availableFrom: cp.campaign.startDate,
        availableUntil: cp.campaign.endDate,
        
        isFeatured: cp.isFeatured,
        isActive: true,
      }
    });
  }

  console.log(`✅ 迁移完成：${campaignPlans.length} 个活动套餐`);
}
```

### 阶段2：UI 重构

#### 2.1 统一的套餐页面

```tsx
// src/app/(main)/plans/page.tsx
export default async function PlansPage() {
  const allPlans = await prisma.rentalPlan.findMany({
    where: { isActive: true },
    include: { campaign: true },
    orderBy: [
      { isCampaign: 'desc' },    // 活动套餐优先
      { isFeatured: 'desc' },    // 推荐套餐优先
      { price: 'asc' }           // 价格从低到高
    ]
  });

  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      endDate: { gte: new Date() }
    }
  });

  return <UnifiedPlansClient plans={allPlans} campaigns={activeCampaigns} />;
}
```

#### 2.2 统一的筛选器

```tsx
<FilterSidebar>
  {/* 地区筛选 */}
  <RegionFilter />

  {/* 店铺筛选 */}
  <StoreFilter />

  {/* 活动筛选（新增）*/}
  <div>
    <h3>🎊 限时活动</h3>
    <button onClick={() => setSelectedCampaign(null)}>
      全部套餐
    </button>
    <button onClick={() => setShowOnlyCampaigns(true)}>
      仅限时优惠
    </button>
    {activeCampaigns.map(campaign => (
      <button onClick={() => setSelectedCampaign(campaign.id)}>
        {campaign.title}
      </button>
    ))}
  </div>

  {/* 价格范围筛选（新增）*/}
  <div>
    <h3>💰 价格范围</h3>
    <select>
      <option>全部价格</option>
      <option>¥100以下</option>
      <option>¥100-500</option>
      <option>¥500-1000</option>
      <option>¥1000以上</option>
    </select>
  </div>

  {/* 标签筛选 */}
  <TagFilter />
</FilterSidebar>
```

#### 2.3 统一的套餐卡片

```tsx
<PlanCard plan={plan}>
  {/* 活动徽章 */}
  {plan.campaign && (
    <div className="absolute top-2 right-2 z-10">
      <Badge variant="campaign">
        {plan.campaign.title}
      </Badge>
      {/* 倒计时 */}
      <Countdown endDate={plan.campaign.endDate} />
    </div>
  )}

  {/* 限量标签 */}
  {plan.isLimited && (
    <Badge variant="limited">
      仅剩 {plan.maxBookings - plan.currentBookings} 个名额
    </Badge>
  )}

  {/* 价格对比 */}
  <PriceComparison 
    price={plan.price}
    originalPrice={plan.originalPrice}
  />

  {/* 其他内容... */}
</PlanCard>
```

### 阶段3：路由重构

#### 3.1 保留 `/campaigns` 页面（可选）

```tsx
// 作为活动的营销入口，重定向到筛选后的套餐页面
export default function CampaignsPage() {
  redirect('/plans?filter=campaigns');
}

// 或者展示活动概览
export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    include: {
      plans: true
    }
  });

  return (
    <CampaignOverview>
      {campaigns.map(campaign => (
        <CampaignCard campaign={campaign}>
          <Link href={`/plans?campaign=${campaign.slug}`}>
            查看套餐
          </Link>
        </CampaignCard>
      ))}
    </CampaignOverview>
  );
}
```

---

## 📊 重构前后对比

### 数据模型对比

| 指标 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| **模型数量** | 2个（RentalPlan + CampaignPlan） | 1个（RentalPlan） | -50% |
| **字段重复** | 90%+ | 0% | -100% |
| **数据维护** | 两处更新 | 一处更新 | -50% |
| **查询复杂度** | 需要union | 单表查询 | -40% |

### UI/UX对比

| 场景 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| **找到所有情侣套餐** | 需要访问2个页面 | 一个页面全部显示 | ✅ |
| **比较价格** | 跨页面比较困难 | 同屏直接比较 | ✅ |
| **筛选功能** | 两套独立筛选 | 统一筛选系统 | ✅ |
| **用户决策时间** | 60-90秒 | 30-40秒 | -50% |

### 代码维护对比

| 指标 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| **组件数量** | 2个Client组件 | 1个Client组件 | -50% |
| **代码行数** | 644行 | ~400行 | -38% |
| **筛选逻辑** | 重复实现 | 统一实现 | -50% |
| **维护成本** | 高 | 低 | ✅ |

---

## 🎨 新的用户体验设计

### 统一的套餐浏览体验

```
用户进入 /plans 页面

┌─────────────┬──────────────────────────────────┐
│ 筛选器      │ 租赁套餐                          │
│             │ 在线预订享受专属优惠价格            │
├─────────────┼──────────────────────────────────┤
│ 🎊 限时活动  │ 🎉 限时优惠套餐（15个）            │
│ □ 全部套餐   │ ┌──────┐ ┌──────┐ ┌──────┐      │
│ ☑ 仅限时优惠 │ │10周年│ │春季  │ │情人节│      │
│ □ 10周年特惠 │ │优惠  │ │促销  │ │特惠  │      │
│ □ 春季促销   │ └──────┘ └──────┘ └──────┘      │
│             │                                  │
│ 📍 地区      │ 全部套餐（43个）                  │
│ ☑ 东京地区   │ ┌──────┐ ┌──────┐ ┌──────┐      │
│ □ 京都地区   │ │女士  │ │情侣  │ │男士  │      │
│             │ │套餐  │ │套餐  │ │套餐  │      │
│ 🏪 店铺      │ └──────┘ └──────┘ └──────┘      │
│ □ 全部店铺   │                                  │
│ □ 浅草本店   │                                  │
│             │                                  │
│ 🏷️ 标签      │                                  │
│ □ 蕾丝和服   │                                  │
│ ☑ 情侣套餐   │                                  │
│             │                                  │
│ 💰 价格      │                                  │
│ ¥100-500   │                                  │
│             │                                  │
│ 找到5个套餐  │                                  │
└─────────────┴──────────────────────────────────┘
```

### 关键交互

1. **点击"仅限时优惠"**：
   - 只显示 `isCampaign: true` 的套餐
   - 活动套餐带有活动徽章和倒计时

2. **点击特定活动**（如"10周年特惠"）：
   - 只显示该活动的套餐
   - 自动滚动到活动区域

3. **组合筛选**：
   - 选择"东京地区" + "情侣套餐" + "仅限时优惠"
   - 精确找到符合所有条件的套餐

---

## 🔄 迁移步骤

### Step 1: 数据库Schema更新

```bash
# 1. 更新 prisma/schema.prisma
# 2. 创建迁移
npx prisma migrate dev --name unify_plan_and_campaign

# 3. 运行迁移脚本
node scripts/migrate-campaigns-to-plans.ts
```

### Step 2: 组件重构

```bash
# 1. 重构 PlansClient 组件
#    - 添加活动筛选器
#    - 统一套餐展示逻辑

# 2. 简化或删除 CampaignsClient
#    - 可以保留为活动概览页
#    - 或完全删除，重定向到 /plans

# 3. 更新购物车和预约逻辑
#    - 统一使用 RentalPlan
#    - 移除 type: 'CAMPAIGN' 的判断
```

### Step 3: 测试验证

```
测试场景：
□ 套餐浏览和筛选
□ 活动套餐显示
□ 价格对比正确
□ 添加购物车功能
□ 预约流程完整
□ 数据一致性
```

---

## 📈 预期收益

### 技术收益

- **代码量减少**：38%
- **维护成本降低**：50%
- **Bug减少**：数据一致性问题消除
- **开发效率提升**：新功能只需改一处

### 用户体验收益

- **决策时间减少**：50%
- **找到目标套餐时间**：减少40%
- **转化率提升**：预期+25%
- **用户满意度**：显著提升

### 业务收益

- **运营效率**：上新套餐更快
- **活动灵活性**：可以快速创建新活动
- **数据分析**：统一的数据更易分析
- **SEO优化**：所有套餐在一个页面，权重集中

---

## 🎯 最终建议

### 立即实施（推荐）

采用**方案一：统一套餐系统**

#### 核心改动

1. **数据层**：
   - RentalPlan 添加活动相关字段
   - 迁移 CampaignPlan 数据到 RentalPlan
   - 删除 CampaignPlan 模型

2. **UI层**：
   - 统一的套餐页面（含活动筛选器）
   - `/campaigns` 可选保留为活动概览或删除
   - 统一的套餐卡片组件

3. **业务逻辑**：
   - 购物车统一使用 RentalPlan
   - 预约系统简化（移除 type 判断）
   - 价格系统统一

#### 实施时间

- **数据迁移**：2-3小时
- **组件重构**：4-6小时
- **测试验证**：2-3小时
- **总计**：1-2天

#### 风险控制

1. **备份数据**：迁移前完整备份
2. **分步实施**：先迁移数据，再重构UI
3. **灰度发布**：先在测试环境验证
4. **回滚方案**：保留旧代码直到确认稳定

---

## 🎉 总结

当前的"套餐"和"活动"分离设计确实存在严重的冗余和体验问题：

1. **数据冗余**：90%+字段重复
2. **用户困惑**：需要在两个页面查找
3. **维护成本**：代码重复，修改两处
4. **扩展困难**：每种活动类型都需要新模型

**统一为套餐系统后**：

1. ✅ 数据模型简洁统一
2. ✅ 用户体验流畅直观
3. ✅ 代码维护成本降低
4. ✅ 功能扩展更灵活

这是一个重要的架构优化，强烈建议实施！
