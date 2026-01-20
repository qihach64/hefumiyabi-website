# 和服租赁预约流程分析与优化方案

## 📊 现有流程分析

### 当前用户预约路径

```
1. 主页 (/)
   └─ HeroSearchBar（地点、日期、人数）
      └─ 跳转到 /plans?location=xxx&date=xxx&guests=xxx

2. 套餐列表 (/plans)
   ├─ 显示所有套餐（不考虑搜索参数）
   ├─ 手动筛选：店铺/地区/标签/活动
   └─ 点击"加入购物车"

3. 购物车 (/cart)
   ├─ 查看已选套餐
   ├─ 为每个套餐选择店铺
   └─ 点击"去结账"

4. 结账页面 (/booking)
   ├─ 填写访问日期 (visitDate)
   ├─ 填写访问时间 (visitTime)
   ├─ 填写个人信息（姓名/邮箱/电话）
   ├─ 特殊要求
   └─ 提交预订

5. 预订成功 (/booking/success)
```

---

## ⚠️ 现存问题

### 1. **搜索参数未被使用**
**问题**：HeroSearchBar收集了 `location`、`date`、`guests`，但plans页面完全忽略这些参数
- ❌ URL有参数：`/plans?location=东京&date=2025-01-20&guests=2`
- ❌ 但页面显示所有套餐，没有根据参数过滤

**影响**：用户在主页输入搜索条件后，期望看到符合条件的结果，但实际上还需要手动筛选

---

### 2. **日期选择时机错误**
**问题**：用户在checkout时才选择日期，而不是在搜索/浏览套餐时
- ❌ 用户可能选了套餐后，发现目标日期不可用
- ❌ 没有提前检查库存和可用性

**Airbnb做法**：日期是首要搜索条件，只展示可预订的房源

---

### 3. **人数与套餐分类不匹配**
**问题**：用户输入"2人"，但看到单人、情侣、家庭、团体所有套餐
- ❌ 没有智能推荐
- ❌ 2人应该优先推荐"情侣套餐"，但现在混在一起

**Airbnb做法**：根据人数自动推荐合适的房源类型

---

### 4. **地点筛选不直观**
**问题**：用户输入"东京"，但页面需要在侧边栏手动选择店铺
- ❌ 地点参数被忽略
- ❌ 需要手动找到东京的店铺

---

### 5. **缺少可用性检查**
**问题**：套餐显示时，没有显示是否可预订
- ❌ 用户可能选了已售罄的套餐
- ❌ 没有"剩余X个名额"的提示

**数据库支持**：
```prisma
model RentalPlan {
  maxBookings      Int?  // 最大预订数
  currentBookings  Int?  // 当前预订数
  availableFrom    DateTime?
  availableUntil   DateTime?
}
```

---

## 🎯 优化方案：Airbnb风格预订体验

### 方案A：渐进式优化（推荐）

#### **Phase 1: 搜索参数生效**

**修改points.tsx 的PlansClient**:
```tsx
// 1. 从URL读取搜索参数
const searchParams = useSearchParams();
const searchLocation = searchParams.get('location');
const searchDate = searchParams.get('date');
const searchGuests = searchParams.get('guests');

// 2. 过滤套餐
const filteredPlans = useMemo(() => {
  let result = allPlans;

  // 按地点过滤
  if (searchLocation) {
    result = result.filter(plan =>
      plan.region?.includes(searchLocation) ||
      plan.storeName?.includes(searchLocation)
    );
  }

  // 按日期过滤（检查可用性）
  if (searchDate) {
    const date = new Date(searchDate);
    result = result.filter(plan => {
      if (plan.availableFrom && new Date(plan.availableFrom) > date) return false;
      if (plan.availableUntil && new Date(plan.availableUntil) < date) return false;
      // TODO: 检查该日期的预订数量
      return true;
    });
  }

  // 按人数推荐分类
  if (searchGuests) {
    const guests = parseInt(searchGuests);
    const recommendedCategories = getCategoriesByGuests(guests);
    // 推荐分类的套餐排前面
    result = result.sort((a, b) => {
      const aScore = recommendedCategories.includes(a.category) ? 1 : 0;
      const bScore = recommendedCategories.includes(b.category) ? 1 : 0;
      return bScore - aScore;
    });
  }

  return result;
}, [allPlans, searchLocation, searchDate, searchGuests]);

// 人数 → 分类映射
function getCategoriesByGuests(guests: number): string[] {
  if (guests === 1) return ['LADIES', 'MENS'];
  if (guests === 2) return ['COUPLE', 'LADIES', 'MENS'];
  if (guests <= 4) return ['FAMILY', 'COUPLE'];
  return ['GROUP', 'FAMILY'];
}
```

**效果**：
- ✅ 搜索参数生效
- ✅ 根据地点、日期、人数过滤/排序套餐
- ✅ 无需修改数据库

---

#### **Phase 2: 日期可用性实时检查**

**新增API**: `/api/plans/availability`
```typescript
// GET /api/plans/availability?date=2025-01-20&planIds=xxx,yyy

export async function GET(req: Request) {
  const { date, planIds } = parseParams(req.url);

  // 查询该日期的预订情况
  const bookingsOnDate = await prisma.booking.findMany({
    where: {
      visitDate: new Date(date),
      status: { in: ['PENDING', 'CONFIRMED'] },
      items: {
        some: {
          planId: { in: planIds.split(',') }
        }
      }
    },
    include: {
      items: true
    }
  });

  // 统计每个套餐的预订数
  const availability = planIds.split(',').map(planId => {
    const plan = await prisma.rentalPlan.findUnique({ where: { id: planId } });
    const booked = bookingsOnDate.reduce((sum, booking) => {
      return sum + booking.items
        .filter(item => item.planId === planId)
        .reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    return {
      planId,
      maxBookings: plan.maxBookings || 999,
      currentBookings: booked,
      available: (plan.maxBookings || 999) - booked,
      isAvailable: booked < (plan.maxBookings || 999)
    };
  });

  return Response.json({ date, availability });
}
```

**套餐卡片显示**:
```tsx
// PlanCard.tsx
{availability && (
  <div className="mt-2">
    {availability.available > 0 ? (
      <Badge variant="success">
        ✅ 剩余 {availability.available} 个名额
      </Badge>
    ) : (
      <Badge variant="destructive">
        ❌ 该日期已售罄
      </Badge>
    )}
  </div>
)}
```

**效果**：
- ✅ 实时显示套餐可用性
- ✅ 防止用户选择已满的套餐
- ✅ 增加紧迫感

---

#### **Phase 3: 优化结账流程**

**简化逻辑**：
```tsx
// 如果从主页搜索进入，日期已经确定
const prefilledDate = searchParams.get('date');
const prefilledGuests = searchParams.get('guests');

// booking页面自动填充
<input
  type="date"
  value={visitDate || prefilledDate}
  disabled={!!prefilledDate} // 已选择日期则禁用
/>
```

**效果**：
- ✅ 用户在主页选择的日期，直接带到checkout
- ✅ 减少重复输入

---

### 方案B：完整改造（更接近Airbnb）

#### **新增字段：套餐容量管理**

**修改Prisma Schema**:
```prisma
model RentalPlan {
  // 现有字段...

  // 容量管理（新增）
  dailyCapacity    Int?      @default(10)  // 每日最大容量
  minGuests        Int?      @default(1)   // 最少人数
  maxGuests        Int?      @default(1)   // 最多人数

  // 黑名单日期（不可预订的日期）
  blackoutDates    DateTime[] @default([])
}

// 新增：每日库存表
model DailyInventory {
  id              String   @id @default(cuid())
  planId          String
  date            DateTime
  capacity        Int      // 当日容量
  booked          Int      @default(0)
  available       Int      // 可用数量

  plan            RentalPlan @relation(fields: [planId], references: [id])

  @@unique([planId, date])
  @@index([date])
  @@map("daily_inventories")
}
```

#### **主页搜索流程重构**

```
1. 用户输入：地点 + 日期 + 人数
   ↓
2. 后端查询：
   - 过滤地点匹配的套餐
   - 过滤日期可用的套餐（查DailyInventory）
   - 过滤人数匹配的套餐（minGuests <= guests <= maxGuests）
   ↓
3. 展示结果：
   - 只显示完全符合条件的套餐
   - 显示"该日期剩余X个名额"
   - 按推荐度排序
   ↓
4. 用户选择套餐 → 直接预订（跳过购物车）
```

#### **效果**：
- ✅ 完全的Airbnb体验
- ✅ 一站式预订
- ⚠️ 需要较大改动

---

## 🤔 对比与建议

| 功能 | 现有流程 | 方案A（渐进式） | 方案B（完整改造） |
|------|---------|----------------|------------------|
| 开发时间 | - | 2-3天 | 1-2周 |
| 数据库改动 | - | 无 | 需要迁移 |
| 搜索参数生效 | ❌ | ✅ | ✅ |
| 日期可用性检查 | ❌ | ✅ | ✅ |
| 人数智能推荐 | ❌ | ✅ | ✅ |
| 实时库存管理 | ❌ | 部分 | ✅ |
| 跳过购物车 | ❌ | ❌ | ✅ |

**我的建议**：
1. **短期（本周）**：实现方案A的Phase 1（搜索参数生效）
2. **中期（下周）**：实现Phase 2（可用性检查）
3. **长期（按需）**：评估是否需要方案B

---

## 📝 快速实现清单（方案A - Phase 1）

### ✅ 需要修改的文件

1. **`src/app/(main)/plans/PlansClient.tsx`**
   - 读取URL搜索参数
   - 根据参数过滤/排序套餐
   - 显示"根据您的搜索，我们推荐..."提示

2. **`src/components/HeroSearchBar.tsx`**
   - 已完成，无需修改

3. **测试流程**：
   - 主页输入"东京 + 2025-01-20 + 2人"
   - 跳转到plans页面
   - 验证：只显示东京地区、情侣/女士/男士套餐、可用日期套餐

---

你觉得哪个方案更适合？我可以立即开始实现方案A的Phase 1，大概30分钟就能完成基础功能。
