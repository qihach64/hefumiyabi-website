# 核心功能设计

> **目标**：详细设计打造"和服界 Airbnb"的关键功能

---

## 🛒 购物车系统

### 功能概述
借鉴 Airbnb 的预订流程，但适配和服租赁场景，允许用户一次预订多个套餐或服务。

### 用户流程

```
浏览套餐
    ↓
[加入购物车] 或 [立即预约]
    ↓
购物车页面
    ↓
调整数量/附加服务
    ↓
结算页面
    ↓
支付完成
```

### 技术实现

#### 1. 状态管理 (Zustand)

```typescript
// stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  type: 'plan' | 'campaign';
  planId?: string;
  campaignPlanId?: string;
  name: string;
  price: number;
  image?: string;
  storeId?: string;
  quantity: number;
  addOns: string[];
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateAddOns: (id: string, addOns: string[]) => void;
  clear: () => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = `${item.type}-${item.planId || item.campaignPlanId}`;
        const existingItem = get().items.find(i => i.id === id);

        if (existingItem) {
          // 增加数量
          set({
            items: get().items.map(i =>
              i.id === id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          // 添加新项
          set({
            items: [...get().items, { ...item, id }],
          });
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter(i => i.id !== id),
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      updateAddOns: (id, addOns) => {
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, addOns } : i
          ),
        });
      },

      clear: () => set({ items: [] }),

      getTotalAmount: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce(
          (count, item) => count + item.quantity,
          0
        );
      },
    }),
    {
      name: 'kimono-cart-storage',
    }
  )
);
```

#### 2. 购物车图标组件

```typescript
// components/cart/CartIcon.tsx
'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import Link from 'next/link';

export default function CartIcon() {
  const itemCount = useCartStore(state => state.getItemCount());

  return (
    <Link
      href="/cart"
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <ShoppingCart className="w-6 h-6 text-gray-700" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-sakura-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  );
}
```

#### 3. 加入购物车动画

```typescript
// hooks/useAddToCartAnimation.ts
import { useState } from 'react';

export function useAddToCartAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return { isAnimating, animate };
}

// 使用
const { isAnimating, animate } = useAddToCartAnimation();

const handleAddToCart = () => {
  addItem({ /* ... */ });
  animate();
  toast.success('已加入购物车');
};
```

#### 4. 购物车页面

```typescript
// app/(main)/cart/page.tsx
'use client';

import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui';
import CartItemCard from '@/components/cart/CartItemCard';
import CartSummary from '@/components/cart/CartSummary';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { items, getTotalAmount } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold mb-2">购物车是空的</h2>
        <p className="text-gray-600 mb-6">快去选择心仪的和服套餐吧！</p>
        <Link href="/plans">
          <Button variant="primary">浏览套餐</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">购物车</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左侧：购物车项目 */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <CartItemCard key={item.id} item={item} />
          ))}
        </div>

        {/* 右侧：订单摘要 */}
        <div>
          <CartSummary />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="mt-4"
            onClick={() => router.push('/checkout')}
          >
            前往结算
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📅 简化预约流程

### 当前问题
- ❌ 4步流程过长
- ❌ 字段冗余（租赁日期、归还日期、取衣时间、还衣时间）
- ❌ 用户困惑：为什么要填这么多时间？

### 新设计

#### 核心理念
> **只需选择到店时间，其他由我们处理**

#### 简化后的字段
```typescript
interface BookingData {
  // 1. 到店信息
  storeId: string;        // 店铺
  visitDate: Date;        // 到店日期
  visitTime: string;      // 到店时间 "10:00"

  // 2. 联系方式
  guestName: string;      // 姓名
  guestEmail: string;     // 邮箱
  guestPhone: string;     // 电话

  // 3. 其他
  specialRequests?: string;  // 特殊要求
}
```

#### 页面布局

```tsx
// app/(main)/checkout/page.tsx
export default function CheckoutPage() {
  return (
    <div className="container py-12">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* 左侧：预约表单 (2/3 宽度) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 预约摘要 */}
          <Card>
            <CardHeader>
              <CardTitle>预约内容</CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.map(item => (
                <CheckoutItemRow key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>

          {/* 到店信息 */}
          <Card>
            <CardHeader>
              <CardTitle>到店信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StoreSelector />
              <DatePicker />
              <TimePicker />
            </CardContent>
          </Card>

          {/* 联系方式 */}
          <Card>
            <CardHeader>
              <CardTitle>联系方式</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="姓名" />
              <Input label="邮箱" type="email" />
              <Input label="手机" type="tel" />
            </CardContent>
          </Card>

          {/* 特殊要求 */}
          <Card>
            <CardHeader>
              <CardTitle>特殊要求（可选）</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="如有特殊需求，请在此说明" />
            </CardContent>
          </Card>
        </div>

        {/* 右侧：订单摘要 (1/3 宽度，粘性定位) */}
        <div>
          <div className="sticky top-24">
            <OrderSummary />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-4"
              onClick={handleSubmit}
            >
              确认预约
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔍 智能搜索和筛选

### 套餐筛选器

```typescript
// components/filters/PlanFilters.tsx
interface FilterState {
  store?: string;      // 店铺
  region?: string;     // 地区
  category?: string;   // 分类
  priceRange?: [number, number];  // 价格区间
  campaign?: string;   // 活动
}

export default function PlanFilters() {
  const [filters, setFilters] = useState<FilterState>({});

  return (
    <div className="space-y-4">
      {/* 店铺筛选 */}
      <Select
        label="选择店铺"
        options={stores}
        value={filters.store}
        onChange={(value) => setFilters(f => ({ ...f, store: value }))}
      />

      {/* 地区筛选 */}
      <Select
        label="地区"
        options={[
          { value: '东京', label: '东京' },
          { value: '京都', label: '京都' },
        ]}
        value={filters.region}
        onChange={(value) => setFilters(f => ({ ...f, region: value }))}
      />

      {/* 分类筛选 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">套餐类型</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Badge
              key={cat.value}
              variant={filters.category === cat.value ? 'sakura' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setFilters(f => ({
                ...f,
                category: f.category === cat.value ? undefined : cat.value
              }))}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 价格区间 */}
      <div>
        <label className="text-sm font-medium">价格区间</label>
        <Slider
          min={0}
          max={20000}
          step={1000}
          value={filters.priceRange || [0, 20000]}
          onChange={(value) => setFilters(f => ({ ...f, priceRange: value }))}
        />
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>¥{filters.priceRange?.[0] || 0}</span>
          <span>¥{filters.priceRange?.[1] || 20000}</span>
        </div>
      </div>

      {/* 清除按钮 */}
      <Button
        variant="outline"
        fullWidth
        onClick={() => setFilters({})}
      >
        清除筛选
      </Button>
    </div>
  );
}
```

---

## ⭐ 评价系统 (Phase 3)

### 功能设计

#### 1. 发布评价

```typescript
// components/review/ReviewForm.tsx
interface ReviewFormData {
  rating: number;           // 1-5 星
  serviceRating?: number;   // 服务评分
  kimonoRating?: number;    // 和服质量
  storeRating?: number;     // 店铺环境
  content: string;          // 评价内容
  images: File[];           // 照片（最多9张）
  tags: string[];           // 标签
}

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<File[]>([]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 总体评分 */}
      <div>
        <label className="text-lg font-semibold mb-2 block">
          总体评分
        </label>
        <StarRating
          value={rating}
          onChange={setRating}
          size="lg"
        />
      </div>

      {/* 详细评分 */}
      <div className="grid grid-cols-3 gap-4">
        <RatingItem
          label="服务态度"
          value={serviceRating}
          onChange={setServiceRating}
        />
        <RatingItem
          label="和服质量"
          value={kimonoRating}
          onChange={setKimonoRating}
        />
        <RatingItem
          label="店铺环境"
          value={storeRating}
          onChange={setStoreRating}
        />
      </div>

      {/* 评价内容 */}
      <Textarea
        label="分享您的体验"
        placeholder="告诉我们您的感受..."
        minLength={10}
        required
      />

      {/* 照片上传 */}
      <ImageUpload
        label="上传照片（最多9张）"
        maxFiles={9}
        value={images}
        onChange={setImages}
      />

      {/* 标签选择 */}
      <TagSelector
        label="选择标签"
        options={['服务好', '和服漂亮', '店铺干净', '拍照好看', '交通便利']}
        value={tags}
        onChange={setTags}
      />

      <Button type="submit" variant="primary" size="lg" fullWidth>
        发布评价
      </Button>
    </form>
  );
}
```

#### 2. 评价展示

```typescript
// components/review/ReviewCard.tsx
export default function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="p-6">
      {/* 头部：用户信息 */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar src={review.user.image} name={review.user.name} />
        <div>
          <p className="font-semibold">{review.user.name}</p>
          <p className="text-sm text-gray-600">
            {formatDate(review.createdAt)}
          </p>
        </div>
      </div>

      {/* 评分 */}
      <div className="flex items-center gap-2 mb-3">
        <StarRating value={review.rating} readonly size="sm" />
        <span className="text-sm text-gray-600">
          {review.rating}.0
        </span>
      </div>

      {/* 标签 */}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {review.tags.map(tag => (
            <Badge key={tag} variant="secondary" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 评价内容 */}
      <p className="text-gray-700 mb-4">{review.content}</p>

      {/* 照片展示 */}
      {review.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {review.images.map((img, idx) => (
            <Image
              key={idx}
              src={img}
              alt={`评价照片 ${idx + 1}`}
              width={200}
              height={200}
              className="rounded-lg object-cover aspect-square cursor-pointer hover:opacity-80 transition"
              onClick={() => openLightbox(idx)}
            />
          ))}
        </div>
      )}

      {/* 商家回复 */}
      {review.response && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold mb-1">商家回复：</p>
          <p className="text-sm text-gray-700">{review.response}</p>
        </div>
      )}

      {/* 有帮助按钮 */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t">
        <button
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-sakura-600 transition"
          onClick={handleHelpful}
        >
          <ThumbsUp className="w-4 h-4" />
          有帮助 ({review.helpful})
        </button>
      </div>
    </Card>
  );
}
```

---

## 📱 社交分享 (Phase 3)

### 照片墙功能

```typescript
// app/(main)/gallery/page.tsx
export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent' | 'popular'>('all');

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">和服照片墙</h1>

      {/* 筛选器 */}
      <div className="flex gap-2 mb-8">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
        >
          全部
        </Button>
        <Button
          variant={filter === 'recent' ? 'primary' : 'outline'}
          onClick={() => setFilter('recent')}
        >
          最新
        </Button>
        <Button
          variant={filter === 'popular' ? 'primary' : 'outline'}
          onClick={() => setFilter('popular')}
        >
          热门
        </Button>
      </div>

      {/* 瀑布流展示 */}
      <MasonryGrid>
        {photos.map(photo => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </MasonryGrid>
    </div>
  );
}
```

### 分享海报生成

```typescript
// utils/generateSharePoster.ts
export async function generateSharePoster(
  booking: Booking
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = 750;
  canvas.height = 1334;

  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#FFF5F7');
  gradient.addColorStop(1, '#FFE4E9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 添加和服照片
  // 添加店铺信息
  // 添加二维码

  return canvas.toDataURL('image/png');
}
```

---

## 🎁 会员系统 (Phase 3)

### 积分规则

```typescript
const POINTS_RULES = {
  // 预约获得积分
  BOOKING_BASE: 100,          // 基础积分
  BOOKING_MULTIPLIER: 0.01,   // 消费金额 * 0.01

  // 行为积分
  REVIEW: 50,                 // 发布评价
  PHOTO_UPLOAD: 20,           // 上传照片
  SHARE: 10,                  // 分享
  REFERRAL: 200,              // 推荐好友注册
  REFERRAL_BOOKING: 500,      // 好友首次预约

  // 会员等级阈值
  LEVELS: {
    REGULAR: 0,
    SILVER: 1000,
    GOLD: 3000,
    DIAMOND: 5000,
  },
};

// 计算预约积分
function calculateBookingPoints(amount: number): number {
  return POINTS_RULES.BOOKING_BASE +
         Math.floor(amount * POINTS_RULES.BOOKING_MULTIPLIER);
}
```

### 会员权益

```typescript
const MEMBER_BENEFITS = {
  REGULAR: {
    discount: 0,              // 无折扣
    priority: false,          // 无优先权
    birthdayGift: false,      // 无生日礼包
  },
  SILVER: {
    discount: 0.05,           // 95折
    priority: false,
    birthdayGift: true,       // 生日礼包
    freeUpgrade: 1,           // 1次免费升级
  },
  GOLD: {
    discount: 0.10,           // 9折
    priority: true,           // 优先预约
    birthdayGift: true,
    freeUpgrade: 2,           // 2次免费升级
  },
  DIAMOND: {
    discount: 0.15,           // 85折
    priority: true,
    birthdayGift: true,
    freeUpgrade: 'unlimited', // 无限免费升级
    exclusiveEvents: true,    // 专属活动
  },
};
```

---

**最后更新**: 2025-10-20
