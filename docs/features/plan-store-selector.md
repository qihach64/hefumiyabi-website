# 商户端店铺选择器功能实施计划

## 概述

为商户端套餐编辑器添加独立的"销售店铺"Tab，允许商户选择套餐在哪些店铺销售，并支持快捷新建店铺。

## 需求确认

- [x] 店铺选择器放在独立 Tab（与"包含服务"、"升级服务"等平级）
- [x] 商户只能看到自己的店铺
- [x] 发布时店铺必选（至少选择一个）
- [x] 删除遗留 storeName/region 字段

---

## 现状分析

### 数据库层面 ✅
- `Store` 模型有 `merchantId` 字段 → 一个商户可拥有多个店铺
- `PlanStore` 关联表已存在 → 支持一个套餐关联多个店铺 (1:N)
- `RentalPlan.storeName` 是遗留字段（纯文本，71条记录有值）

### 商户端编辑器 ⚠️
- `PlanFormData` 定义了 `storeName` 和 `region` 字段
- **但这两个字段没有在任何 Tab 中显示编辑 UI**
- 目前这两个字段只是存在于数据结构中，用户无法编辑

### API 层面
- `/api/stores` 已存在（公开接口，返回所有活跃店铺）
- 缺少商户专属的店铺管理 API

---

## 实施步骤

### 第一步：数据库 Schema 修改

**文件**: `prisma/schema.prisma`

1. 从 `RentalPlan` 模型中删除：
   ```prisma
   storeName String?
   region    String?
   tags      String[]      @default([])
   ```

2. 确认 `PlanStore` 关联表结构已存在（无需修改）

3. 运行迁移：`pnpm prisma db push --accept-data-loss`

**注意**: 数据库中有 71 条记录包含 storeName/region 数据，执行时会丢失这些数据。

---

### 第二步：新建商户店铺 API

**新建文件**: `src/app/api/merchant/stores/route.ts`

```typescript
// GET /api/merchant/stores - 获取当前商户的店铺列表
// POST /api/merchant/stores - 创建新店铺

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!merchant || merchant.status !== "APPROVED") {
    return NextResponse.json({ message: "无权限执行此操作" }, { status: 403 });
  }

  const stores = await prisma.store.findMany({
    where: { merchantId: merchant.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      phone: true,
      email: true,
      isActive: true,
    },
  });

  return NextResponse.json({ stores });
}

const createStoreSchema = z.object({
  name: z.string().min(1, "店铺名称不能为空"),
  city: z.string().min(1, "城市不能为空"),
  address: z.string().min(1, "地址不能为空"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!merchant || merchant.status !== "APPROVED") {
    return NextResponse.json({ message: "无权限执行此操作" }, { status: 403 });
  }

  const body = await request.json();
  const validatedData = createStoreSchema.parse(body);

  const slug = `store-${merchant.id.slice(-6)}-${Date.now()}`;

  const store = await prisma.store.create({
    data: {
      slug,
      name: validatedData.name,
      city: validatedData.city,
      address: validatedData.address,
      phone: validatedData.phone || null,
      email: validatedData.email || null,
      merchantId: merchant.id,
      isActive: true,
    },
  });

  return NextResponse.json({ store }, { status: 201 });
}
```

---

### 第三步：修改套餐 API 支持 storeIds

#### 3.1 修改 `src/app/api/merchant/plans/route.ts`

**更新 createPlanSchema**:
```typescript
const createPlanSchema = z.object({
  // ... 现有字段 ...

  // 移除:
  // storeName: z.string().optional().nullable(),
  // region: z.string().optional().nullable(),

  // 添加:
  storeIds: z.array(z.string()).min(1, "请至少选择一个店铺"),
});
```

**POST 处理时添加 PlanStore 创建**:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const newPlan = await tx.rentalPlan.create({
    data: {
      // ... 现有字段（移除 storeName, region）
    },
  });

  // 验证店铺所有权并创建关联
  if (validatedData.storeIds.length > 0) {
    const validStores = await tx.store.findMany({
      where: { id: { in: validatedData.storeIds }, merchantId: merchant.id },
      select: { id: true },
    });

    if (validStores.length !== validatedData.storeIds.length) {
      throw new Error("部分店铺不存在或无权限操作");
    }

    await tx.planStore.createMany({
      data: validatedData.storeIds.map((storeId) => ({
        planId: newPlan.id,
        storeId,
        isActive: true,
      })),
    });
  }

  return newPlan;
});
```

#### 3.2 修改 `src/app/api/merchant/plans/[id]/route.ts`

**GET 时 include planStores**:
```typescript
const plan = await prisma.rentalPlan.findUnique({
  where: { id },
  include: {
    // ... 现有 includes ...
    planStores: {
      include: {
        store: {
          select: { id: true, name: true, city: true, address: true },
        },
      },
    },
  },
});
```

**更新 updatePlanSchema**:
```typescript
const updatePlanSchema = z.object({
  // ... 现有字段 ...
  storeIds: z.array(z.string()).optional(),
});
```

**PATCH 时处理 PlanStore 更新**:
```typescript
// 在事务内
if (validatedData.storeIds !== undefined) {
  // 验证店铺所有权
  if (validatedData.storeIds.length > 0) {
    const validStores = await tx.store.findMany({
      where: { id: { in: validatedData.storeIds }, merchantId: merchant.id },
      select: { id: true },
    });

    if (validStores.length !== validatedData.storeIds.length) {
      throw new Error("部分店铺不存在或无权限操作");
    }
  }

  // 删除旧关联
  await tx.planStore.deleteMany({ where: { planId: id } });

  // 创建新关联
  if (validatedData.storeIds.length > 0) {
    await tx.planStore.createMany({
      data: validatedData.storeIds.map((storeId) => ({
        planId: id,
        storeId,
        isActive: true,
      })),
    });
  }
}
```

---

### 第四步：更新表单数据结构

**修改文件**: `src/store/planDraft.ts`

```typescript
export interface PlanFormData {
  // ... 现有字段 ...

  // 移除:
  // storeName: string;
  // region: string;

  // 添加:
  selectedStoreIds: string[];
}

export const defaultFormData: PlanFormData = {
  // ... 现有字段 ...

  // 移除:
  // storeName: "",
  // region: "",

  // 添加:
  selectedStoreIds: [],
};
```

---

### 第五步：新建 Tab 组件

#### 5.1 新建 `src/components/merchant/PlanEditorTabs/StoresTab.tsx`

主要功能：
- 显示商户店铺列表（复选框选择）
- 搜索过滤
- 全选/清空
- 显示已选数量
- 未选择时显示警告
- "+ 添加新店铺" 按钮

```typescript
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Store, Check, Plus, MapPin, Phone, Mail, Search, AlertCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui";
import CreateStoreModal from "./CreateStoreModal";

interface StoreData {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  email?: string | null;
}

interface StoresTabProps {
  selectedStoreIds: string[];
  onStoreIdsChange: (ids: string[]) => void;
}

export default function StoresTab({ selectedStoreIds, onStoreIdsChange }: StoresTabProps) {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch merchant's stores
  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant/stores");
      if (!res.ok) throw new Error("加载店铺失败");
      const data = await res.json();
      setStores(data.stores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  // Toggle store selection
  const toggleStore = (storeId: string) => {
    if (selectedStoreIds.includes(storeId)) {
      onStoreIdsChange(selectedStoreIds.filter((id) => id !== storeId));
    } else {
      onStoreIdsChange([...selectedStoreIds, storeId]);
    }
  };

  // ... 完整实现见详细计划
}
```

#### 5.2 新建 `src/components/merchant/PlanEditorTabs/CreateStoreModal.tsx`

Modal 表单字段：
- 店铺名称（必填）
- 城市（必填）
- 详细地址（必填）
- 电话（可选）
- 邮箱（可选）

```typescript
"use client";

import { useState } from "react";
import { X, Building2, AlertCircle, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui";

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateStoreModal({ isOpen, onClose, onSuccess }: CreateStoreModalProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // 验证 + 提交
    const res = await fetch("/api/merchant/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, address, phone, email }),
    });
    // ... 处理响应
  };

  // ... 完整实现见详细计划
}
```

---

### 第六步：注册新 Tab

**修改文件**: `src/components/merchant/PlanEditorTabs/index.tsx`

```typescript
import { Store } from "lucide-react";

export type TabId = "basic" | "pricing" | "stores" | "components" | "upgrades" | "tags" | "advanced" | "preview";

export const TABS: TabItem[] = [
  { id: "basic", label: "基本信息", icon: <FileText className="w-4 h-4" /> },
  { id: "pricing", label: "价格设置", icon: <CircleDollarSign className="w-4 h-4" /> },
  { id: "stores", label: "销售店铺", icon: <Store className="w-4 h-4" /> },  // 新增
  { id: "components", label: "包含服务", icon: <Puzzle className="w-4 h-4" /> },
  { id: "upgrades", label: "升级服务", icon: <Sparkles className="w-4 h-4" /> },
  { id: "tags", label: "分类标签", icon: <Tags className="w-4 h-4" /> },
  { id: "advanced", label: "高级设置", icon: <Settings className="w-4 h-4" /> },
  { id: "preview", label: "预览", icon: <Eye className="w-4 h-4" /> },
];
```

---

### 第七步：集成到主编辑器

**修改文件**: `src/components/merchant/PlanEditForm.tsx`

1. **Import**:
   ```typescript
   import StoresTab from "./PlanEditorTabs/StoresTab";
   ```

2. **PlanData 接口**: 添加 `planStores` 字段，移除 storeName/region

3. **初始化 formData**: 从 `plan.planStores` 提取 `selectedStoreIds`
   ```typescript
   selectedStoreIds: plan.planStores?.map((ps) => ps.storeId) || [],
   ```

4. **Tab 渲染**:
   ```typescript
   {activeTab === "stores" && (
     <StoresTab
       selectedStoreIds={formData.selectedStoreIds}
       onStoreIdsChange={(ids) => handleFormChange("selectedStoreIds", ids)}
     />
   )}
   ```

5. **发布验证**: 检查 `selectedStoreIds.length === 0` 时阻止发布
   ```typescript
   if (formData.selectedStoreIds.length === 0) {
     setError("请至少选择一个销售店铺");
     setActiveTab("stores");
     return;
   }
   ```

6. **buildSubmitData**: 移除 storeName/region，添加 storeIds
   ```typescript
   storeIds: formData.selectedStoreIds,
   ```

---

## 文件清单

### 新建文件 (3)
| 文件路径 | 用途 |
|---------|------|
| `src/app/api/merchant/stores/route.ts` | 商户店铺 API |
| `src/components/merchant/PlanEditorTabs/StoresTab.tsx` | 店铺选择器组件 |
| `src/components/merchant/PlanEditorTabs/CreateStoreModal.tsx` | 新建店铺弹窗 |

### 修改文件 (6)
| 文件路径 | 修改内容 |
|---------|---------|
| `prisma/schema.prisma` | 删除 storeName/region/tags 字段 |
| `src/store/planDraft.ts` | 更新 PlanFormData |
| `src/components/merchant/PlanEditorTabs/index.tsx` | 添加 stores tab |
| `src/components/merchant/PlanEditForm.tsx` | 集成 StoresTab |
| `src/app/api/merchant/plans/route.ts` | POST 支持 storeIds |
| `src/app/api/merchant/plans/[id]/route.ts` | GET/PATCH 支持 storeIds |

---

## 验证流程

```
用户点击"发布套餐"
    ↓
检查 selectedStoreIds.length === 0?
    ├── 是 → 显示错误，跳转到 stores tab
    └── 否 → 继续
    ↓
API 验证 storeIds.min(1)
    ↓
API 验证店铺所有权 (merchantId 匹配)
    ↓
创建/更新 PlanStore 关联
    ↓
成功
```

---

## 执行顺序

1. Schema 修改 + db push
2. 新建 merchant stores API
3. 修改 plans API
4. 更新 planDraft store
5. 新建 StoresTab + CreateStoreModal
6. 更新 TabNavigation
7. 集成到 PlanEditForm
8. 测试完整流程

---

## UI 设计参考

### 店铺选择器 Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  销售店铺                                      [全选] | [清空]   │
├─────────────────────────────────────────────────────────────────┤
│  🔍 搜索店铺...                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ 请至少选择一个店铺才能发布套餐                               │
├─────────────────────────────────────────────────────────────────┤
│  ☑ 京都祇园本店                                      [已选]     │
│     📍 京都 - 京都府京都市东山区祇园町北侧 xxx-xx                │
│     📞 075-xxx-xxxx                                             │
├─────────────────────────────────────────────────────────────────┤
│  ☐ 东京浅草店                                                   │
│     📍 东京 - 台东区浅草1-2-3                                    │
├─────────────────────────────────────────────────────────────────┤
│  ☑ 大阪心斋桥店                                      [已选]     │
│     📍 大阪 - 中央区心斋桥筋2丁目                                │
│     📞 06-xxxx-xxxx                                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  + 添加新店铺                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 新建店铺 Modal

```
┌────────────────────────────────────────────────────────────────┐
│  🏢 创建新店铺                                             [×]  │
│      添加您的实体店铺信息                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  店铺名称 *                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 京都祇园本店                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  📍 城市 *                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 京都市                                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  详细地址 *                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 京都府京都市东山区祇园町北侧 xxx-xx                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  📞 电话 (可选)                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 075-xxx-xxxx                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  📧 邮箱 (可选)                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ store@example.com                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                      [取消]  [创建店铺]         │
└────────────────────────────────────────────────────────────────┘
```
