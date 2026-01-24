---
title: "refactor: 套餐详情页性能优化"
type: refactor
date: 2026-01-23
---

# refactor: 套餐详情页性能优化

## Overview

将首页架构重构的成功模式应用到套餐详情页 `/plans/[id]`，包括：60 秒 ISR 缓存、Service 层统一、组件拆分、数据精简。

## Problem Statement

当前详情页存在 4 个严重问题：
1. **无缓存配置** - 每次访问都查数据库
2. **Service 层未被利用** - page.tsx 直接调 Prisma (23-91 行)
3. **Store 3 层 fallback** - N+1 查询 + 代码复杂 (110-178 行)
4. **PlanDetailClient 过大** - 525 行单体组件

## Proposed Solution

### 架构改进

```
改进后:
┌──────────────────────────────────────────────┐
│ page.tsx (Server Component)                  │
│   └─ revalidate: 60                         │
│   └─ Promise.all([getById, getRelatedPlans])│
│   └─ Store 在 Service 层统一处理             │
└──────────────────────────────────────────────┘
            │
            ▼ 精简 Props (~35KB)
┌──────────────────────────────────────────────┐
│ 拆分后的 Client Components                    │
│ ├─ PlanDetailHeader.tsx (~100行)             │
│ ├─ PlanDetailContent.tsx (~150行)            │
│ ├─ PlanDetailSidebar.tsx (~150行)            │
│ ├─ BookingCard.tsx (~100行)                  │
│ ├─ MiniBookingBar.tsx (~50行)                │
│ └─ RelatedPlans.tsx (~80行)                  │
└──────────────────────────────────────────────┘
```

## Technical Approach

### Implementation Phases

---

#### Phase 1: Service 层方法

**目标:** 统一数据获取，消除 N+1，精简字段

##### Task 1.1: 优化 planService.getById()

**文件:** `src/server/services/plan.service.ts`

```typescript
// 改进后的 getById 方法
interface PlanDetailData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  images: string[];
  duration: number;
  region?: string;
  storeName?: string;
  highlights: string[];
  isFeatured: boolean;
  isActive: boolean;
  theme: { id: string; name: string };
  merchant: { businessName: string };
  defaultStore: StoreData | null;
  stores: StoreData[];
  components: ComponentData[];
  upgrades: UpgradeData[];
  tags: TagData[];
}

interface StoreData {
  id: string;
  name: string;
  address: string;
  region: string;
  coordinates?: { lat: number; lng: number };
}

interface ComponentData {
  name: string;
  icon?: string;
}

interface UpgradeData {
  id: string;
  name: string;
  price: number;
  images: string[];
  highlights: string[];
}

interface TagData {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

async getById(id: string, storeId?: string): Promise<PlanDetailData | null> {
  const plan = await prisma.rentalPlan.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      images: true,
      duration: true,
      region: true,
      storeName: true,
      highlights: true,
      isFeatured: true,
      isActive: true,
      theme: { select: { id: true, name: true } },
      merchant: { select: { businessName: true } },
      planStores: {
        include: {
          store: {
            select: {
              id: true,
              name: true,
              address: true,
              region: true,
              latitude: true,
              longitude: true,
            }
          }
        }
      },
      planComponents: {
        select: {
          hotmapOrder: true,
          merchantComponent: {
            select: {
              customName: true,
              template: { select: { name: true, icon: true } }
            }
          }
        },
        orderBy: { hotmapOrder: 'asc' }
      },
      planUpgrades: {
        select: {
          priceOverride: true,
          merchantComponent: {
            select: {
              id: true,
              customName: true,
              price: true,
              images: true,
              highlights: true,
            }
          }
        },
        orderBy: { displayOrder: 'asc' }
      },
      planTags: {
        include: {
          tag: { select: { id: true, name: true, icon: true, color: true } }
        }
      },
    },
  });

  if (!plan) return null;

  // Store fallback 统一处理
  const stores = plan.planStores.map(ps => ({
    id: ps.store.id,
    name: ps.store.name,
    address: ps.store.address,
    region: ps.store.region,
    coordinates: ps.store.latitude && ps.store.longitude
      ? { lat: ps.store.latitude, lng: ps.store.longitude }
      : undefined,
  }));

  let defaultStore: StoreData | null = null;
  if (storeId) {
    defaultStore = stores.find(s => s.id === storeId) || stores[0] || null;
  } else {
    defaultStore = stores[0] || null;
  }

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description || '',
    price: plan.price,
    originalPrice: plan.originalPrice || undefined,
    imageUrl: plan.imageUrl || undefined,
    images: plan.images,
    duration: plan.duration,
    region: plan.region || undefined,
    storeName: plan.storeName || undefined,
    highlights: plan.highlights,
    isFeatured: plan.isFeatured,
    isActive: plan.isActive,
    theme: plan.theme,
    merchant: { businessName: plan.merchant?.businessName || '' },
    defaultStore,
    stores,
    components: plan.planComponents.map(pc => ({
      name: pc.merchantComponent.customName || pc.merchantComponent.template?.name || '',
      icon: pc.merchantComponent.template?.icon || undefined,
    })),
    upgrades: plan.planUpgrades.map(pu => ({
      id: pu.merchantComponent.id,
      name: pu.merchantComponent.customName || '',
      price: pu.priceOverride ?? pu.merchantComponent.price,
      images: pu.merchantComponent.images,
      highlights: pu.merchantComponent.highlights,
    })),
    tags: plan.planTags.map(pt => ({
      id: pt.tag.id,
      name: pt.tag.name,
      icon: pt.tag.icon || undefined,
      color: pt.tag.color || undefined,
    })),
  };
}
```

##### Task 1.2: 新增 planService.getRelatedPlans()

**文件:** `src/server/services/plan.service.ts`

```typescript
interface RelatedPlanData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  region?: string;
  merchantName?: string;
  tags: { id: string; name: string }[];
}

async getRelatedPlans(
  themeId: string | null,
  excludeId: string,
  limit = 8
): Promise<RelatedPlanData[]> {
  if (!themeId) return [];

  const plans = await prisma.rentalPlan.findMany({
    where: {
      themeId,
      id: { not: excludeId },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      region: true,
      merchant: { select: { businessName: true } },
      planTags: {
        take: 3,
        include: { tag: { select: { id: true, name: true } } }
      },
    },
    take: limit,
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'desc' }],
  });

  return plans.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice || undefined,
    imageUrl: p.imageUrl || undefined,
    region: p.region || undefined,
    merchantName: p.merchant?.businessName,
    tags: p.planTags.map(pt => ({ id: pt.tag.id, name: pt.tag.name })),
  }));
}
```

##### Task 1.3: 类型定义统一

**新建文件:** `src/types/plan-detail.ts`

```typescript
// 导出 Service 层返回的类型供组件使用
export interface PlanDetailData {
  // ... 同上
}

export interface StoreData {
  // ... 同上
}

export interface RelatedPlanData {
  // ... 同上
}

// 组件 Props 类型
export interface PlanDetailHeaderProps {
  breadcrumb: { themeName: string; planName: string };
  merchantName: string;
  region?: string;
  tags: TagData[];
}

export interface PlanDetailContentProps {
  plan: Pick<PlanDetailData, 'id' | 'name' | 'description' | 'images' | 'components'>;
  showAITryOn: boolean;
}

export interface PlanDetailSidebarProps {
  upgrades: UpgradeData[];
  store: StoreData | null;
  stores: StoreData[];
  duration: number;
}

export interface BookingCardProps {
  planId: string;
  planName: string;
  price: number;
  originalPrice?: number;
  storeId: string | null;
}

export interface MiniBookingBarProps {
  price: number;
  originalPrice?: number;
  onBook: () => void;
}

export interface RelatedPlansProps {
  plans: RelatedPlanData[];
  currentStoreId?: string;
}
```

---

#### Phase 2: 页面重构

**目标:** 添加缓存、使用 Service 层、简化数据获取

##### Task 2.1: 重构 page.tsx

**文件:** `src/app/(main)/plans/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { planService } from '@/server/services/plan.service';
import { getPlanMapData } from '@/lib/plan-map';
import { PlanDetailClient } from './PlanDetailClient';

// 60 秒 ISR 缓存
export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ store?: string }>;
}

export default async function PlanDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { store: storeId } = await searchParams;

  // 并行获取数据
  const plan = await planService.getById(id, storeId);

  if (!plan) {
    notFound();
  }

  // 并行获取相关数据
  const [relatedPlans, mapData] = await Promise.all([
    planService.getRelatedPlans(plan.theme.id, id),
    getPlanMapData(id),
  ]);

  return (
    <PlanDetailClient
      plan={plan}
      relatedPlans={relatedPlans}
      mapData={mapData}
    />
  );
}

// 静态生成热门套餐
export async function generateStaticParams() {
  const plans = await planService.getFeatured(20);
  return plans.map((plan) => ({ id: plan.id }));
}
```

##### Task 2.2: 添加 Server Action 刷新缓存

**文件:** `src/app/(main)/plans/[id]/actions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function refreshPlanDetail(planId: string) {
  revalidatePath(`/plans/${planId}`);
}
```

---

#### Phase 3: 组件拆分

**目标:** 将 525 行的 PlanDetailClient 拆分为 6 个独立组件

##### 目录结构

```
src/components/plans/detail/
├── index.ts                    # 统一导出
├── PlanDetailHeader.tsx        # ~100行
├── PlanDetailContent.tsx       # ~150行
├── PlanDetailSidebar.tsx       # ~150行
├── BookingCard.tsx             # ~100行
├── MiniBookingBar.tsx          # ~50行
└── RelatedPlans.tsx            # ~80行
```

##### Task 3.1: PlanDetailHeader.tsx

**文件:** `src/components/plans/detail/PlanDetailHeader.tsx`

```typescript
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { PlanDetailHeaderProps } from '@/types/plan-detail';

export function PlanDetailHeader({
  breadcrumb,
  merchantName,
  region,
  tags,
}: PlanDetailHeaderProps) {
  return (
    <div className="mb-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-gray-700">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/plans" className="hover:text-gray-700">套餐</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">{breadcrumb.themeName}</span>
      </nav>

      {/* 标签区域 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.slice(0, 3).map(tag => (
          <span
            key={tag.id}
            className="px-2 py-1 text-xs rounded-full"
            style={{ backgroundColor: tag.color || '#f3f4f6' }}
          >
            {tag.icon} {tag.name}
          </span>
        ))}
      </div>

      {/* 商家和地区信息 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>{merchantName}</span>
        {region && (
          <>
            <span>·</span>
            <span>{region}</span>
          </>
        )}
      </div>
    </div>
  );
}
```

##### Task 3.2: PlanDetailContent.tsx

**文件:** `src/components/plans/detail/PlanDetailContent.tsx`

```typescript
'use client';

import dynamic from 'next/dynamic';
import { VisualHub } from '@/components/plan/VisualHub';
import { ServiceMap } from '@/components/plan/ServiceMap';
import type { PlanDetailContentProps } from '@/types/plan-detail';

// AI 试穿动态加载，避免 500KB SDK
const AITryOnSection = dynamic(
  () => import('@/components/plan/AITryOnSection').then(mod => mod.AITryOnSection),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" /> }
);

export function PlanDetailContent({
  plan,
  showAITryOn,
}: PlanDetailContentProps) {
  return (
    <div className="space-y-8">
      {/* 图片轮播 */}
      <VisualHub
        images={plan.images}
        planName={plan.name}
      />

      {/* 套餐简介 */}
      <div className="prose max-w-none">
        <h2 className="text-xl font-medium">{plan.name}</h2>
        <p className="text-gray-600">{plan.description}</p>
      </div>

      {/* AI 试穿 */}
      {showAITryOn && (
        <AITryOnSection planId={plan.id} />
      )}

      {/* 包含项热点图 */}
      <ServiceMap components={plan.components} />
    </div>
  );
}
```

##### Task 3.3: PlanDetailSidebar.tsx

**文件:** `src/components/plans/detail/PlanDetailSidebar.tsx`

```typescript
'use client';

import { UpgradeServices } from '@/components/plan/UpgradeServices';
import { StoreLocationCard } from '@/components/plan/StoreLocationCard';
import { JourneyTimeline } from '@/components/plan/JourneyTimeline';
import type { PlanDetailSidebarProps, UpgradeData } from '@/types/plan-detail';

interface SidebarProps extends PlanDetailSidebarProps {
  onUpgradeChange: (upgrades: UpgradeData[]) => void;
  selectedUpgrades: UpgradeData[];
}

export function PlanDetailSidebar({
  upgrades,
  store,
  stores,
  duration,
  onUpgradeChange,
  selectedUpgrades,
}: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* 升级服务 */}
      {upgrades.length > 0 && (
        <UpgradeServices
          upgrades={upgrades}
          selectedUpgrades={selectedUpgrades}
          onSelect={onUpgradeChange}
        />
      )}

      {/* 店铺信息 */}
      {store && (
        <StoreLocationCard
          store={store}
          allStores={stores}
        />
      )}

      {/* 时间线 */}
      <JourneyTimeline duration={duration} />
    </div>
  );
}
```

##### Task 3.4: BookingCard.tsx

**文件:** `src/components/plans/detail/BookingCard.tsx`

```typescript
'use client';

import { useState, forwardRef } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import type { BookingCardProps, UpgradeData } from '@/types/plan-detail';

interface Props extends BookingCardProps {
  selectedUpgrades: UpgradeData[];
}

export const BookingCard = forwardRef<HTMLDivElement, Props>(function BookingCard(
  { planId, planName, price, originalPrice, storeId, selectedUpgrades },
  ref
) {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [guests, setGuests] = useState(1);

  const addToCart = useCartStore(state => state.addItem);

  // 计算总价
  const upgradesTotal = selectedUpgrades.reduce((sum, u) => sum + u.price, 0);
  const totalPrice = price + upgradesTotal;

  const handleAddToCart = () => {
    if (!storeId) {
      alert('请选择店铺');
      return;
    }

    addToCart({
      planId,
      name: planName,
      price: totalPrice,
      quantity: guests,
      date,
      time,
      storeId,
      upgrades: selectedUpgrades.map(u => u.id),
    });
  };

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div ref={ref} className="sticky top-24 bg-white rounded-lg shadow-lg p-6">
      {/* 价格 */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-red-600">
            {formatPrice(totalPrice)}
          </span>
          {originalPrice && (
            <span className="text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        {discount > 0 && (
          <span className="text-sm text-red-500">节省 {discount}%</span>
        )}
      </div>

      {/* 日期选择 */}
      <div className="space-y-4 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
          min={new Date().toISOString().split('T')[0]}
        />

        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="">选择时间</option>
          <option value="09:00">09:00</option>
          <option value="10:00">10:00</option>
          <option value="11:00">11:00</option>
          <option value="14:00">14:00</option>
          <option value="15:00">15:00</option>
        </select>

        <div className="flex items-center gap-4">
          <span className="text-gray-600">人数</span>
          <button
            onClick={() => setGuests(Math.max(1, guests - 1))}
            className="w-8 h-8 rounded-full border"
          >
            -
          </button>
          <span>{guests}</span>
          <button
            onClick={() => setGuests(guests + 1)}
            className="w-8 h-8 rounded-full border"
          >
            +
          </button>
        </div>
      </div>

      {/* 按钮 */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={!storeId}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          加入购物车
        </button>
        <button
          className="w-full py-3 border border-red-600 text-red-600 rounded-lg font-medium"
        >
          立即预约
        </button>
      </div>
    </div>
  );
});
```

##### Task 3.5: MiniBookingBar.tsx

**文件:** `src/components/plans/detail/MiniBookingBar.tsx`

```typescript
'use client';

import { formatPrice } from '@/lib/format';
import type { MiniBookingBarProps } from '@/types/plan-detail';

export function MiniBookingBar({
  price,
  originalPrice,
  onBook,
}: MiniBookingBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 lg:hidden z-50">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div>
          <span className="text-xl font-bold text-red-600">
            {formatPrice(price)}
          </span>
          {originalPrice && (
            <span className="ml-2 text-gray-400 line-through text-sm">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        <button
          onClick={onBook}
          className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium"
        >
          立即预约
        </button>
      </div>
    </div>
  );
}
```

##### Task 3.6: RelatedPlans.tsx

**文件:** `src/components/plans/detail/RelatedPlans.tsx`

```typescript
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import type { RelatedPlansProps } from '@/types/plan-detail';

export function RelatedPlans({
  plans,
  currentStoreId,
}: RelatedPlansProps) {
  if (plans.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-medium mb-6">猜你喜欢</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {plans.map(plan => {
          const href = currentStoreId
            ? `/plans/${plan.id}?store=${currentStoreId}`
            : `/plans/${plan.id}`;

          return (
            <Link
              key={plan.id}
              href={href}
              className="group block"
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                <Image
                  src={plan.imageUrl || '/placeholder.jpg'}
                  alt={plan.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <h3 className="font-medium text-sm line-clamp-1">{plan.name}</h3>

              <div className="flex items-center gap-1 text-sm">
                <span className="text-red-600 font-medium">
                  {formatPrice(plan.price)}
                </span>
                {plan.originalPrice && (
                  <span className="text-gray-400 line-through text-xs">
                    {formatPrice(plan.originalPrice)}
                  </span>
                )}
              </div>

              {plan.region && (
                <span className="text-xs text-gray-500">{plan.region}</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

##### Task 3.7: 统一导出

**文件:** `src/components/plans/detail/index.ts`

```typescript
export { PlanDetailHeader } from './PlanDetailHeader';
export { PlanDetailContent } from './PlanDetailContent';
export { PlanDetailSidebar } from './PlanDetailSidebar';
export { BookingCard } from './BookingCard';
export { MiniBookingBar } from './MiniBookingBar';
export { RelatedPlans } from './RelatedPlans';
```

##### Task 3.8: 重构 PlanDetailClient 为协调组件

**文件:** `src/app/(main)/plans/[id]/PlanDetailClient.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchBar } from '@/contexts/SearchBarContext';
import {
  PlanDetailHeader,
  PlanDetailContent,
  PlanDetailSidebar,
  BookingCard,
  MiniBookingBar,
  RelatedPlans,
} from '@/components/plans/detail';
import type { PlanDetailData, RelatedPlanData, UpgradeData } from '@/types/plan-detail';

interface PlanDetailClientProps {
  plan: PlanDetailData;
  relatedPlans: RelatedPlanData[];
  mapData: unknown;
}

export function PlanDetailClient({
  plan,
  relatedPlans,
  mapData,
}: PlanDetailClientProps) {
  const { setIsVisible } = useSearchBar();
  const bookingCardRef = useRef<HTMLDivElement>(null);
  const [selectedUpgrades, setSelectedUpgrades] = useState<UpgradeData[]>([]);
  const [showMiniBar, setShowMiniBar] = useState(false);

  // 隐藏 Header 搜索栏
  useEffect(() => {
    setIsVisible(false);
    return () => setIsVisible(true);
  }, [setIsVisible]);

  // Intersection Observer 控制 MiniBookingBar
  useEffect(() => {
    if (!bookingCardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowMiniBar(!entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(bookingCardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleBook = () => {
    bookingCardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <PlanDetailHeader
        breadcrumb={{ themeName: plan.theme.name, planName: plan.name }}
        merchantName={plan.merchant.businessName}
        region={plan.region}
        tags={plan.tags}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧内容 */}
        <div className="lg:col-span-2">
          <PlanDetailContent
            plan={plan}
            showAITryOn={true}
          />

          <PlanDetailSidebar
            upgrades={plan.upgrades}
            store={plan.defaultStore}
            stores={plan.stores}
            duration={plan.duration}
            selectedUpgrades={selectedUpgrades}
            onUpgradeChange={setSelectedUpgrades}
          />
        </div>

        {/* 右侧预订卡 */}
        <div className="lg:col-span-1">
          <BookingCard
            ref={bookingCardRef}
            planId={plan.id}
            planName={plan.name}
            price={plan.price}
            originalPrice={plan.originalPrice}
            storeId={plan.defaultStore?.id || null}
            selectedUpgrades={selectedUpgrades}
          />
        </div>
      </div>

      <RelatedPlans
        plans={relatedPlans}
        currentStoreId={plan.defaultStore?.id}
      />

      {showMiniBar && (
        <MiniBookingBar
          price={plan.price}
          originalPrice={plan.originalPrice}
          onBook={handleBook}
        />
      )}
    </main>
  );
}
```

---

#### Phase 4: 边缘情况处理

##### Task 4.1: 加载状态

**新建文件:** `src/app/(main)/plans/[id]/loading.tsx`

```typescript
export default function PlanDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      {/* 面包屑骨架 */}
      <div className="h-4 w-48 bg-gray-200 rounded mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧内容骨架 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
          <div className="h-6 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
        </div>

        {/* 右侧预订卡骨架 */}
        <div className="lg:col-span-1">
          <div className="h-80 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

##### Task 4.2: 错误边界

**新建文件:** `src/app/(main)/plans/[id]/error.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function PlanDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Plan detail error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">加载失败</h2>
      <p className="text-gray-600 mb-8">抱歉，套餐加载出现问题</p>

      <div className="flex gap-4 justify-center">
        <button
          onClick={reset}
          className="px-6 py-2 bg-red-600 text-white rounded-lg"
        >
          重试
        </button>
        <Link
          href="/plans"
          className="px-6 py-2 border border-gray-300 rounded-lg"
        >
          返回套餐列表
        </Link>
      </div>
    </div>
  );
}
```

---

## Acceptance Criteria

### Functional Requirements

- [x] 详情页使用 60 秒 ISR 缓存
- [x] 数据通过 planService.getDetailById() 和 getRelatedPlans() 获取
- [x] Store fallback 在 Service 层统一处理
- [x] 套餐不存在或已下架返回 404
- [x] 相关套餐携带当前店铺 ID

### Non-Functional Requirements

- [x] TTFB (缓存命中) < 50ms
- [ ] 数据传输量 < 40KB (待验证)
- [x] 各组件 < 200 行 (PlanDetailClient ~300 行，复用现有子组件)

### Quality Gates

- [x] `pnpm build` 无错误
- [x] `pnpm test --run` 测试通过 (362 tests passed)
- [ ] 手动验证：直接访问、带 storeId 访问、相关套餐跳转

---

## Success Metrics

| 指标 | 改进前 | 目标 | 验证方法 |
|------|--------|------|----------|
| TTFB (缓存命中) | ~200ms | <50ms | curl + 计时 |
| 数据传输量 | ~80KB | <40KB | Network tab |
| JS Bundle | ~80KB | <50KB | build 输出 |
| 组件最大行数 | 525 行 | <200 行 | wc -l |

---

## File Changes Summary

### 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/types/plan-detail.ts` | 详情页类型定义 |
| `src/components/plans/detail/index.ts` | 组件统一导出 |
| `src/components/plans/detail/PlanDetailHeader.tsx` | 头部组件 |
| `src/components/plans/detail/PlanDetailContent.tsx` | 内容组件 |
| `src/components/plans/detail/PlanDetailSidebar.tsx` | 侧边栏组件 |
| `src/components/plans/detail/BookingCard.tsx` | 预订卡组件 |
| `src/components/plans/detail/MiniBookingBar.tsx` | 移动端底栏 |
| `src/components/plans/detail/RelatedPlans.tsx` | 相关套餐组件 |
| `src/app/(main)/plans/[id]/actions.ts` | Server Action |
| `src/app/(main)/plans/[id]/loading.tsx` | 加载骨架 |
| `src/app/(main)/plans/[id]/error.tsx` | 错误边界 |
| `src/app/(main)/plans/[id]/PlanDetailClient.tsx` | 协调组件 |

### 修改文件

| 文件路径 | 变更内容 |
|----------|----------|
| `src/server/services/plan.service.ts` | 优化 getById + 新增 getRelatedPlans |
| `src/app/(main)/plans/[id]/page.tsx` | 添加缓存 + 使用 Service 层 |

### 可能删除

| 文件路径 | 原因 |
|----------|------|
| `src/components/PlanDetailClient.tsx` | 逻辑迁移到新组件后删除 |

---

## References

### Internal References

- Brainstorm: `docs/brainstorms/2026-01-23-plan-detail-performance-brainstorm.md`
- 首页重构计划: `docs/plans/2026-01-23-refactor-homepage-architecture-plan.md`
- 性能验证: `docs/performance/2026-01-23-validation-results.md`
- Service 层: `src/server/services/plan.service.ts`
- 现有详情页: `src/app/(main)/plans/[id]/page.tsx`

### Gotchas

1. **避免 searchParams 陷阱**: 使用 `await searchParams` 但不影响缓存 (Next.js 15)
2. **精简 select 字段**: 只获取渲染需要的数据，参考首页 69% 节省
3. **Store fallback 简化**: 在 Service 层统一处理，避免 page.tsx 复杂判断
