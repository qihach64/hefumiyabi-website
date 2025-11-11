# 丝滑预订流程设计：搜索 → 浏览 → 预订

## 🎯 目标：打造 Airbnb 级别的用户体验

### 核心原则
```
一次输入，全程记忆
自动填充，减少摩擦
上下文延续，智能推荐
```

---

## 📊 现有流程问题诊断

### 当前用户路径

```
Step 1: 主页搜索
┌─────────────────────────────────┐
│ HeroSearchBar                   │
│ ├─ 地点：东京                   │
│ ├─ 日期：2025-01-20            │
│ └─ 人数：2                      │
└─────────────────────────────────┘
         ↓ 点击"搜索"
         ↓
Step 2: 套餐列表
┌─────────────────────────────────┐
│ URL: /plans?location=东京        │
│      &date=2025-01-20           │
│      &guests=2                  │
│                                 │
│ ❌ 显示所有套餐（参数被忽略）     │
│ ❌ 需要手动筛选地点               │
│ ❌ 看不到人数推荐                │
│ ❌ 不知道哪些可预订               │
└─────────────────────────────────┘
         ↓ 加入购物车
         ↓
Step 3: 购物车
┌─────────────────────────────────┐
│ ❌ 日期信息丢失                  │
│ ❌ 需要手动选择店铺               │
│ ❌ 人数信息丢失                  │
└─────────────────────────────────┘
         ↓ 去结账
         ↓
Step 4: 预订页面
┌─────────────────────────────────┐
│ ❌ 需要重新输入日期               │
│ ❌ 需要重新输入时间               │
│ ❌ 没有默认值                    │
└─────────────────────────────────┘
```

**问题汇总**：
1. ❌ **参数断层**：搜索框的输入在后续页面完全丢失
2. ❌ **重复输入**：日期、人数需要多次填写
3. ❌ **无智能推荐**：不根据人数推荐合适的套餐
4. ❌ **缺少预填充**：checkout时需要从零开始
5. ❌ **无上下文延续**：每个页面都像"第一次访问"

---

## ✨ 丝滑流程设计

### Airbnb 式体验路径

```
Step 1: 主页搜索（输入意图）
┌─────────────────────────────────┐
│ 🔍 搜索框                        │
│ ├─ 地点：东京                   │
│ ├─ 日期：2025-01-20            │
│ └─ 人数：2人                    │
│                                 │
│ [搜索] ← 点击                   │
└─────────────────────────────────┘
         ↓
         ↓ 💾 保存到 SearchContext
         ↓
Step 2: 智能推荐套餐
┌─────────────────────────────────┐
│ ✅ 根据您的搜索：2人 · 东京       │
│ ✅ 为您推荐情侣套餐               │
│                                 │
│ 🏆 情侣套餐（最适合2人）          │
│ 📍 东京浅草店                    │
│ ✅ 1月20日可预订                │
│ 💰 ¥8,000/对                    │
│                                 │
│ 👩 女士套餐                      │
│ 📍 东京银座店                    │
│ ✅ 1月20日可预订                │
│ 💰 ¥5,000/人 × 2 = ¥10,000     │
│                                 │
│ [快速预订] ← 一键直达checkout    │
└─────────────────────────────────┘
         ↓
         ↓ 保留 SearchContext
         ↓
Step 3: 快速预订（跳过购物车）
┌─────────────────────────────────┐
│ 📅 日期：2025-01-20 ✅ 已选择    │
│ 👥 人数：2人 ✅ 已选择           │
│ 📍 店铺：东京浅草店 ✅ 已匹配     │
│                                 │
│ ⏰ 到店时间：[10:00 ▼]          │
│ 📝 姓名：___                    │
│ 📧 邮箱：___                    │
│                                 │
│ [确认预订 ¥8,000]               │
└─────────────────────────────────┘
```

**关键改进**：
- ✅ **参数延续**：搜索条件贯穿全流程
- ✅ **智能过滤**：只显示符合条件的套餐
- ✅ **自动预填**：日期、人数、店铺自动填充
- ✅ **快速通道**："快速预订"跳过购物车
- ✅ **上下文可见**：顶部显示"根据您的搜索：2人 · 东京 · 1月20日"

---

## 🛠️ 技术实现方案

### 方案A：URL 参数传递（简单）

#### **优点**：
- ✅ 实现简单
- ✅ 可分享链接
- ✅ 支持浏览器前进/后退

#### **缺点**：
- ⚠️ URL会很长
- ⚠️ 刷新页面需要重新解析

#### **实现**：

**1. HeroSearchBar → Plans 页面**
```typescript
// src/components/HeroSearchBar.tsx
const handleSearch = () => {
  const params = new URLSearchParams();
  if (location) params.set('location', location);
  if (date) params.set('date', date);
  if (guests) params.set('guests', guests);

  router.push(`/plans?${params.toString()}`);
};

// URL: /plans?location=东京&date=2025-01-20&guests=2
```

**2. Plans 页面读取参数**
```typescript
// src/app/(main)/plans/PlansClient.tsx
'use client';

export default function PlansClient({ plans }) {
  const searchParams = useSearchParams();
  const location = searchParams.get('location');
  const date = searchParams.get('date');
  const guests = parseInt(searchParams.get('guests') || '1');

  // 过滤套餐
  const filteredPlans = useMemo(() => {
    let result = plans;

    // 按地点过滤
    if (location) {
      result = result.filter(plan =>
        plan.region?.includes(location) ||
        plan.storeName?.includes(location)
      );
    }

    // 按人数推荐分类
    if (guests) {
      const recommendedCategories = getRecommendedCategories(guests);
      result = result.sort((a, b) => {
        const aScore = recommendedCategories.includes(a.category) ? 1 : 0;
        const bScore = recommendedCategories.includes(b.category) ? 1 : 0;
        return bScore - aScore; // 推荐的排前面
      });
    }

    return result;
  }, [plans, location, guests]);

  return (
    <div>
      {/* 搜索上下文提示 */}
      {(location || date || guests) && (
        <div className="bg-sakura-50 border border-sakura-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            根据您的搜索：
            {guests && <span className="font-semibold">{guests}人</span>}
            {location && <span className="font-semibold"> · {location}</span>}
            {date && <span className="font-semibold"> · {formatDate(date)}</span>}
          </p>
        </div>
      )}

      {/* 套餐列表 */}
      <PlanGrid plans={filteredPlans} />
    </div>
  );
}

// 人数 → 推荐分类
function getRecommendedCategories(guests: number): string[] {
  if (guests === 1) return ['LADIES', 'MENS'];
  if (guests === 2) return ['COUPLE'];
  if (guests <= 4) return ['FAMILY'];
  return ['GROUP'];
}
```

**3. Plans → Cart → Booking 传递参数**
```typescript
// PlanCard 组件（加入购物车时）
const handleAddToCart = () => {
  const searchParams = new URLSearchParams(window.location.search);

  addItem({
    ...plan,
    // 附加搜索上下文
    searchContext: {
      visitDate: searchParams.get('date'),
      guests: searchParams.get('guests'),
      preferredLocation: searchParams.get('location'),
    }
  });
};

// Cart 组件（跳转到booking时）
const handleCheckout = () => {
  // 从购物车第一个项目提取搜索上下文
  const context = items[0]?.searchContext;
  const params = new URLSearchParams();
  if (context?.visitDate) params.set('date', context.visitDate);
  if (context?.guests) params.set('guests', context.guests);

  router.push(`/booking?${params.toString()}`);
};

// Booking 页面（自动填充）
const searchParams = useSearchParams();
const [visitDate, setVisitDate] = useState(
  searchParams.get('date') || ''
);
const [guestCount, setGuestCount] = useState(
  searchParams.get('guests') || ''
);
```

---

### 方案B：Context API（React 状态管理）

#### **优点**：
- ✅ 状态统一管理
- ✅ 跨页面共享
- ✅ 类型安全

#### **缺点**：
- ⚠️ 刷新页面丢失（需配合localStorage）
- ⚠️ 实现稍复杂

#### **实现**：

**1. 创建 SearchContext**
```typescript
// src/context/SearchContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  location: string;
  date: string;
  guests: number;
  setSearch: (data: Partial<SearchContextType>) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearchState] = useState({
    location: '',
    date: '',
    guests: 1,
  });

  const setSearch = (data: Partial<SearchContextType>) => {
    const newSearch = { ...search, ...data };
    setSearchState(newSearch);
    // 持久化到 localStorage
    localStorage.setItem('searchContext', JSON.stringify(newSearch));
  };

  const clearSearch = () => {
    setSearchState({ location: '', date: '', guests: 1 });
    localStorage.removeItem('searchContext');
  };

  return (
    <SearchContext.Provider value={{ ...search, setSearch, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within SearchProvider');
  return context;
}
```

**2. 在 layout 中包裹**
```typescript
// src/app/(main)/layout.tsx
import { SearchProvider } from '@/context/SearchContext';

export default function MainLayout({ children }) {
  return (
    <SearchProvider>
      {children}
    </SearchProvider>
  );
}
```

**3. 各页面使用**
```typescript
// HeroSearchBar
const { setSearch } = useSearch();
const handleSearch = () => {
  setSearch({ location, date, guests: parseInt(guests) });
  router.push('/plans');
};

// PlansClient
const { location, date, guests } = useSearch();
// 自动读取，无需URL参数

// BookingPage
const { date, guests } = useSearch();
const [visitDate, setVisitDate] = useState(date);
```

---

### 方案C：混合方案（推荐⭐）

**结合两者优势**：
- URL参数作为主要数据源（可分享）
- Context作为兜底（刷新时从URL恢复）

```typescript
// SearchContext 增强版
export function SearchProvider({ children }) {
  // 初始化时从 URL 或 localStorage 恢复
  const [search, setSearchState] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stored = localStorage.getItem('searchContext');

    return {
      location: urlParams.get('location') || JSON.parse(stored || '{}').location || '',
      date: urlParams.get('date') || JSON.parse(stored || '{}').date || '',
      guests: parseInt(urlParams.get('guests') || JSON.parse(stored || '{}').guests || '1'),
    };
  });

  // 设置时同时更新 URL
  const setSearch = (data: Partial<SearchContextType>) => {
    const newSearch = { ...search, ...data };
    setSearchState(newSearch);

    // 更新 URL
    const params = new URLSearchParams();
    if (newSearch.location) params.set('location', newSearch.location);
    if (newSearch.date) params.set('date', newSearch.date);
    if (newSearch.guests > 1) params.set('guests', newSearch.guests.toString());

    window.history.replaceState({}, '', `?${params.toString()}`);

    // 持久化
    localStorage.setItem('searchContext', JSON.stringify(newSearch));
  };

  return <SearchContext.Provider value={{ ...search, setSearch }}>...</SearchContext.Provider>;
}
```

---

## 🎨 UI/UX 优化细节

### 1. **搜索上下文可见性**

在每个页面顶部显示当前搜索条件：

```tsx
// SearchContextBanner.tsx
export function SearchContextBanner() {
  const { location, date, guests, clearSearch } = useSearch();

  if (!location && !date && !guests) return null;

  return (
    <div className="sticky top-16 z-20 bg-sakura-50 border-b border-sakura-200 py-3">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">您的搜索：</span>
          {guests > 1 && (
            <Badge variant="secondary">
              <Users className="w-3 h-3 mr-1" />
              {guests}人
            </Badge>
          )}
          {location && (
            <Badge variant="secondary">
              <MapPin className="w-3 h-3 mr-1" />
              {location}
            </Badge>
          )}
          {date && (
            <Badge variant="secondary">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(date)}
            </Badge>
          )}
        </div>
        <button
          onClick={clearSearch}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          清除搜索
        </button>
      </div>
    </div>
  );
}
```

---

### 2. **快速预订按钮**

在套餐卡片上增加"快速预订"按钮：

```tsx
// PlanCard.tsx
export function PlanCard({ plan }) {
  const { date, guests } = useSearch();
  const router = useRouter();

  const handleQuickBook = () => {
    // 跳过购物车，直接预订
    const params = new URLSearchParams();
    params.set('planId', plan.id);
    if (date) params.set('date', date);
    if (guests) params.set('guests', guests.toString());

    router.push(`/booking/quick?${params.toString()}`);
  };

  return (
    <div className="plan-card">
      {/* ...套餐信息 */}

      <div className="flex gap-2 mt-4">
        <button onClick={handleAddToCart} className="flex-1 btn-outline">
          加入购物车
        </button>
        {date && (
          <button onClick={handleQuickBook} className="flex-1 btn-primary">
            快速预订 →
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### 3. **智能推荐标签**

根据人数显示推荐标签：

```tsx
// PlansClient.tsx
const recommendedCategories = getRecommendedCategories(guests);

{filteredPlans.map(plan => (
  <div key={plan.id} className="relative">
    {recommendedCategories.includes(plan.category) && (
      <div className="absolute top-2 left-2 z-10">
        <Badge variant="success">
          ⭐ 推荐{guests}人
        </Badge>
      </div>
    )}
    <PlanCard plan={plan} />
  </div>
))}
```

---

### 4. **预填充表单**

Booking页面自动填充：

```tsx
// BookingPage.tsx
const { date, guests, location } = useSearch();

// 自动填充日期
const [visitDate, setVisitDate] = useState(date);

// 自动匹配店铺
const suggestedStores = stores.filter(store =>
  location && store.region?.includes(location)
);

// 自动填充人数（用于验证）
const expectedGuests = guests;

return (
  <form>
    <input
      type="date"
      value={visitDate}
      onChange={(e) => setVisitDate(e.target.value)}
      className={visitDate ? "border-green-500" : ""}
    />
    {visitDate && (
      <span className="text-xs text-green-600">✓ 已从搜索预填</span>
    )}

    {/* 推荐店铺 */}
    {suggestedStores.length > 0 && (
      <div className="mt-2">
        <p className="text-xs text-gray-500">根据您选择的地点，推荐：</p>
        {suggestedStores.map(store => (
          <button key={store.id} onClick={() => selectStore(store.id)}>
            {store.name} ⭐ 推荐
          </button>
        ))}
      </div>
    )}
  </form>
);
```

---

## 🚀 实施计划

### Phase 1：基础参数传递（2-3小时）

**文件修改**：
1. ✅ `HeroSearchBar.tsx` - 已完成，无需改动
2. 🔧 `PlansClient.tsx` - 读取URL参数，过滤套餐
3. 🔧 `PlanCard.tsx` - 附加searchContext到购物车
4. 🔧 `BookingPage.tsx` - 读取参数，自动填充

**效果**：
- 搜索参数生效
- 日期自动填充到booking页面

---

### Phase 2：智能推荐（1-2小时）

**文件修改**：
1. 🔧 `PlansClient.tsx` - 人数智能排序
2. ✨ 新增 `SearchContextBanner.tsx` - 顶部提示条
3. 🔧 `PlanCard.tsx` - 推荐标签

**效果**：
- 2人优先显示情侣套餐
- 显示"⭐ 推荐2人"标签

---

### Phase 3：快速预订（2-3小时）

**文件修改**：
1. 🔧 `PlanCard.tsx` - 快速预订按钮
2. ✨ 新增 `/booking/quick` 路由
3. 🔧 购物车逻辑 - 支持单品直达

**效果**：
- 点击"快速预订"跳过购物车
- 一站式结账体验

---

### Phase 4：Context持久化（按需）

**可选优化**：
- 实现 SearchContext
- localStorage备份
- 刷新页面不丢失

---

## 📊 对比总结

| 特性 | 现有流程 | 优化后 |
|------|---------|--------|
| 参数传递 | ❌ 丢失 | ✅ URL + Context |
| 重复输入 | ❌ 3次输入日期 | ✅ 输入1次 |
| 智能推荐 | ❌ 无 | ✅ 人数推荐 |
| 快速通道 | ❌ 必经购物车 | ✅ 一键预订 |
| 上下文可见 | ❌ 无提示 | ✅ 顶部banner |
| 实施时间 | - | 1天完成 |

---

## 🎯 立即开始？

**我的建议**：先实现 Phase 1 + Phase 2（共3-5小时）

**覆盖场景**：90%的用户体验提升

**需要你确认**：
1. 是否采用"混合方案"（URL + Context）？
2. 是否需要"快速预订"功能？
3. 是否需要我立即开始编码？

我可以现在开始实现，预计今天内完成！🚀
