# 套餐组件系统设计文档

> **版本**: v10.1 (2024-12)
> **状态**: 设计规划

---

## 概述

套餐组件系统是和服租赁平台的核心功能，用于：

1. **商户端**：创建和编辑套餐内容，配置服务组件和热点图
2. **用户端**：展示套餐包含的服务，支持交互式和服热点图
3. **平台端**：定义服务组件的种类（模板）

### 设计原则

| 原则 | 说明 |
|------|------|
| **平台定义种类** | 组件种类由平台定义（名称、描述），保证一致性和可比性 |
| **商户自定义特色** | 商户可自定义组件的图片、特色亮点、价格（仅ADDON）|
| **实例化模型** | 商户注册时复制平台模板为商户实例，查询效率高 |
| **市场质量控制** | 商户内容质量靠市场自然筛选，平台不审核 |
| **简化定价** | OUTFIT不定价（含在套餐内），ADDON商户定价 |

---

## 组件类型

### OUTFIT vs ADDON

```
┌─────────────────────────────────────────────────────────────────┐
│  OUTFIT (套餐包含服务)              ADDON (增值服务)              │
├─────────────────────────────────────────────────────────────────┤
│  👘 和服、配饰、造型等               📷 跟拍、寄存、接送等         │
│  ✅ 需要热点图定位                   ❌ 不需要热点图定位           │
│  ✅ 显示在和服图上                   ✅ 在服务列表中展示           │
│  ❌ 不单独定价（含在套餐内）          ✅ 商户自定义价格（加购）      │
│  ✅ 商户可自定义图片/特色            ✅ 商户可自定义图片/特色/价格  │
└─────────────────────────────────────────────────────────────────┘
```

### 核心区别

| 维度 | OUTFIT | ADDON |
|------|--------|-------|
| 定价 | 不定价，价格含在套餐内 | 商户自定义价格，在套餐基础上加购 |
| 热点图 | 可放置在热点图上 | 不放置在热点图上 |
| 用户选择 | 套餐自带，用户不需要选择 | 用户可选加购 |
| 示例 | 振袖、帯、草履、发型 | 摄影跟拍、行李寄存、接送服务 |

---

## 数据模型

### 核心模型关系

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              平台层                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ServiceComponent (平台组件模板)                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🔒 平台定义（商户不能修改）                                      │   │
│  │  · id, code (唯一编码)                                           │   │
│  │  · name: "振袖和服"                                              │   │
│  │  · description: "华丽的正装振袖..."                               │   │
│  │  · type: OUTFIT | ADDON                                          │   │
│  │  · icon: "👘"                                                    │   │
│  │  · basePrice: 建议价（仅 ADDON）                                 │   │
│  │                                                                  │   │
│  │  📋 默认内容（商户未自定义时使用）                                 │   │
│  │  · defaultImages: [...]                                          │   │
│  │  · defaultHighlights: [...]                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  💡 平台创建新模板时，自动为所有商户创建实例                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                     商户注册时 / 平台新增模板时
                     自动创建商户组件实例
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              商户层                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MerchantComponent (商户组件实例)                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  templateId → ServiceComponent                                   │   │
│  │  merchantId → Merchant                                           │   │
│  │                                                                  │   │
│  │  ✏️ 商户自定义区域                                               │   │
│  │  · images: 商户图片（空 = 使用模板默认）                          │   │
│  │  · highlights: 商户特色（空 = 使用模板默认）                       │   │
│  │  · price: 商户定价（仅 ADDON，null = 使用建议价）                  │   │
│  │  · isEnabled: 是否启用                                           │   │
│  │                                                                  │   │
│  │  💡 查询时 JOIN template 获取 name/description（平台定义）         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  RentalPlan (套餐)                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  id, name, price, merchantId, hotmapImageUrl                     │   │
│  │                                                                  │   │
│  │  PlanComponent[] (套餐-组件关联)                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │  merchantComponentId → MerchantComponent                    │ │   │
│  │  │  hotmapX, hotmapY, hotmapLabelPosition (仅 OUTFIT)         │ │   │
│  │  │                                                              │ │   │
│  │  │  💡 直接关联商户组件实例，单次 JOIN 获取完整数据               │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 字段控制

| 字段 | 来源 | 商户可修改 |
|------|------|-----------|
| name | 平台模板 | ❌ |
| description | 平台模板 | ❌ |
| type | 平台模板 | ❌ |
| icon | 平台模板 | ❌ |
| images | 商户实例 | ✅ |
| highlights | 商户实例 | ✅ |
| price (ADDON) | 商户实例 | ✅ |
| isEnabled | 商户实例 | ✅ |

### ServiceComponent（平台组件模板）

```prisma
model ServiceComponent {
  id              String          @id @default(cuid())
  code            String          @unique  // 全局唯一编码

  // ========== 平台定义（商户不能修改）==========
  name            String           // "振袖和服"、"摄影跟拍"
  nameJa          String?
  nameEn          String?
  description     String?          // 平台定义的描述
  type            ComponentType    // OUTFIT | ADDON
  icon            String?          // Emoji 图标

  // ========== 默认内容（商户未自定义时使用）==========
  defaultImages     String[]       // 默认图片
  defaultHighlights String[]       // 默认亮点

  // ========== 建议价（仅 ADDON 类型有意义）==========
  basePrice       Int             @default(0)

  // ========== 元数据 ==========
  displayOrder    Int             @default(0)
  isActive        Boolean         @default(true)

  // ========== 关联 ==========
  merchantComponents MerchantComponent[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum ComponentType {
  OUTFIT    // 套餐包含服务（不定价，热图可显示）
  ADDON     // 增值服务（商户定价，加购）
}
```

### MerchantComponent（商户组件实例）

```prisma
model MerchantComponent {
  id              String   @id @default(cuid())

  // ========== 关联 ==========
  merchantId      String
  merchant        Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  templateId      String
  template        ServiceComponent @relation(fields: [templateId], references: [id], onDelete: Cascade)

  // ========== 商户自定义区域 ==========
  // 空数组/null = 使用模板默认内容
  images          String[]         // 商户图片
  highlights      String[]         // 商户特色亮点

  // ========== 仅 ADDON 类型 ==========
  price           Int?             // 商户定价（null = 使用模板建议价）

  // ========== 启用状态 ==========
  isEnabled       Boolean  @default(true)

  // ========== 关联 ==========
  planComponents  PlanComponent[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([merchantId, templateId])  // 每个商户每个模板只有一个实例
  @@index([merchantId])
  @@index([templateId])
}
```

**设计说明**：
- 商户注册时，自动为每个平台模板创建一个实例
- 平台新增模板时，自动为所有商户创建实例
- 商户只能修改 images、highlights、price（ADDON）、isEnabled
- name、description 始终从 template 获取

### PlanComponent（套餐-组件关联）

```prisma
model PlanComponent {
  id                    String            @id @default(cuid())
  planId                String
  merchantComponentId   String            // 改为关联商户组件实例

  plan                  RentalPlan        @relation(fields: [planId], references: [id], onDelete: Cascade)
  merchantComponent     MerchantComponent @relation(fields: [merchantComponentId], references: [id], onDelete: Cascade)

  // ========== 热点图配置（仅 OUTFIT 类型）==========
  hotmapX              Float?             // 百分比坐标 0-1
  hotmapY              Float?
  hotmapLabelPosition  String             @default("right")
  hotmapOrder          Int                @default(0)

  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  @@unique([planId, merchantComponentId])
  @@index([planId])
  @@index([merchantComponentId])
}
```

**设计说明**：
- 关联 MerchantComponent 而不是 ServiceComponent
- 查询时只需要一次 JOIN 即可获取完整数据
- 热点位置存储在 PlanComponent（每个套餐可以不同）

---

## 生命周期管理

### 商户注册时

```typescript
async function initializeMerchantComponents(merchantId: string) {
  const templates = await prisma.serviceComponent.findMany({
    where: { isActive: true }
  });

  await prisma.merchantComponent.createMany({
    data: templates.map(t => ({
      merchantId,
      templateId: t.id,
      images: [],        // 初始为空，使用模板默认
      highlights: [],    // 初始为空，使用模板默认
      price: null,       // 初始为空，使用模板建议价
      isEnabled: true,
    })),
    skipDuplicates: true,
  });
}
```

### 平台新增组件模板时

```typescript
async function onServiceComponentCreated(templateId: string) {
  // 为所有商户创建实例
  const merchants = await prisma.merchant.findMany({
    where: { status: 'APPROVED' },
    select: { id: true }
  });

  await prisma.merchantComponent.createMany({
    data: merchants.map(m => ({
      merchantId: m.id,
      templateId,
      images: [],
      highlights: [],
      price: null,
      isEnabled: true,
    })),
    skipDuplicates: true,
  });
}
```

### 平台停用组件模板时

```typescript
async function onServiceComponentDeactivated(templateId: string) {
  // 商户实例保持不变，不级联停用
  // 只是新套餐不能再选择这个组件
  await prisma.serviceComponent.update({
    where: { id: templateId },
    data: { isActive: false }
  });

  // 可选：记录日志或通知相关商户
}
```

---

## 查询效率

### 获取套餐详情（单次 JOIN）

```typescript
const plan = await prisma.rentalPlan.findUnique({
  where: { id: planId },
  include: {
    planComponents: {
      include: {
        merchantComponent: {
          include: {
            template: true  // ServiceComponent
          }
        }
      },
      orderBy: { hotmapOrder: 'asc' }
    }
  }
});

// 直接使用，无需额外查询
const components = plan.planComponents.map(pc => ({
  id: pc.merchantComponent.id,
  // 平台定义（不可修改）
  name: pc.merchantComponent.template.name,
  description: pc.merchantComponent.template.description,
  type: pc.merchantComponent.template.type,
  icon: pc.merchantComponent.template.icon,
  // 商户自定义（优先使用，否则用默认）
  images: pc.merchantComponent.images.length
    ? pc.merchantComponent.images
    : pc.merchantComponent.template.defaultImages,
  highlights: pc.merchantComponent.highlights.length
    ? pc.merchantComponent.highlights
    : pc.merchantComponent.template.defaultHighlights,
  // 价格（仅 ADDON）
  price: pc.merchantComponent.template.type === 'ADDON'
    ? (pc.merchantComponent.price ?? pc.merchantComponent.template.basePrice)
    : null,
  // 热点位置
  hotmapX: pc.hotmapX,
  hotmapY: pc.hotmapY,
  hotmapLabelPosition: pc.hotmapLabelPosition,
}));
```

### 获取商户的组件列表

```typescript
const merchantComponents = await prisma.merchantComponent.findMany({
  where: { merchantId, isEnabled: true },
  include: { template: true },
  orderBy: { template: { displayOrder: 'asc' } }
});
```

### 性能对比

| 操作 | 旧方案（覆盖模式）| 新方案（实例模式）|
|------|-----------------|-----------------|
| 套餐详情查询 | 2次查询 + 应用层合并 | 1次查询（JOIN）|
| 商户组件列表 | 2次查询 + 应用层合并 | 1次查询（JOIN）|
| 按组件属性筛选 | 困难 | 可直接 WHERE |

---

## 内容展示逻辑

### 两层信息模式

```
┌─────────────────────────────────────────────────────────────────────────┐
│  组件展示                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [振袖和服]  ← 组件名称（平台定义，所有商户统一）                          │
│  华丽的正装振袖... ← 组件描述（平台定义，所有商户统一）                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [商户上传的振袖图片]  ← 商户自定义图片                           │   │
│  │                                                                  │   │
│  │  ✨ 我们的特色：                                                  │   │
│  │  · 多款传统古典风格正绢振袖                                       │   │
│  │  · 鹤、樱花、牡丹等吉祥图案                                       │   │
│  │  · 日本进口，每日限量 3 套                                        │   │
│  │  ← 商户自定义特色亮点                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 内容获取优先级

```typescript
function getComponentDisplay(mc: MerchantComponentWithTemplate) {
  return {
    // 平台定义（商户不能修改）
    name: mc.template.name,
    description: mc.template.description,
    type: mc.template.type,
    icon: mc.template.icon,

    // 商户自定义（空则使用默认）
    images: mc.images.length ? mc.images : mc.template.defaultImages,
    highlights: mc.highlights.length ? mc.highlights : mc.template.defaultHighlights,

    // 价格（仅 ADDON）
    price: mc.template.type === 'ADDON'
      ? (mc.price ?? mc.template.basePrice)
      : null,
  };
}
```

---

## 价格体系

### 简化设计

```
┌─────────────────────────────────────────────────────────────────────────┐
│  价格模型                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  OUTFIT (套餐包含服务)                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ❌ 不单独定价                                                   │   │
│  │  价格已包含在套餐价格内                                           │   │
│  │  用户只需要知道"套餐包含什么"，不需要知道每项值多少                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ADDON (增值服务)                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ✅ 商户自定义价格                                               │   │
│  │  平台提供建议价 (ServiceComponent.basePrice)                     │   │
│  │  商户可覆盖 (MerchantComponent.price)                            │   │
│  │  用户可选加购，在套餐基础上增加订单金额                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 套餐价格计算

```typescript
// 订单总价 = 套餐价 + Σ(用户选中的 ADDON 价格)
function calculateOrderTotal(
  plan: RentalPlan,
  selectedAddonIds: string[]  // MerchantComponent IDs
): number {
  let total = plan.price;  // 套餐基础价（已包含所有 OUTFIT）

  // 加上用户选中的增值服务
  for (const mc of plan.planComponents) {
    if (
      mc.merchantComponent.template.type === 'ADDON' &&
      selectedAddonIds.includes(mc.merchantComponentId)
    ) {
      const price = mc.merchantComponent.price ?? mc.merchantComponent.template.basePrice;
      total += price;
    }
  }

  return total;
}
```

---

## 热点图系统

### 仅 OUTFIT 显示在热点图

```
┌─────────────────────────────────────────────────────────────────────────┐
│  热点图展示                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────┐                                   │
│  │                                 │                                   │
│  │      ●─── 振袖和服              │  ← OUTFIT：显示在热点图上          │
│  │                                 │                                   │
│  │           ●─── 帯・帯締め       │  ← OUTFIT：显示在热点图上          │
│  │                                 │                                   │
│  │                 ●─── 草履       │  ← OUTFIT：显示在热点图上          │
│  │                                 │                                   │
│  └─────────────────────────────────┘                                   │
│                                                                         │
│  增值服务（可选加购）                                                     │
│  ┌─────────────────────────────────┐                                   │
│  │ 📷 摄影跟拍    +¥3,000  [添加]  │  ← ADDON：列表展示，用户可选      │
│  │ 🧳 行李寄存    +¥500    [添加]  │                                   │
│  │ 🚗 接送服务    +¥1,500  [添加]  │                                   │
│  └─────────────────────────────────┘                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 前端组件

### 组件架构

```
src/
├── app/(main)/merchant/
│   ├── components/
│   │   ├── page.tsx                # 商户组件配置页面（服务端）
│   │   └── ComponentsClient.tsx    # 商户组件配置（客户端交互）
│   └── dashboard/
│       └── page.tsx                # 商户控制台
├── components/
│   ├── merchant/
│   │   ├── PlanComponentEditor.tsx     # 主编辑器（三栏式工作台）
│   │   └── ServiceComponentSelector.tsx # 简化选择器
│   ├── plan/
│   │   └── InteractiveKimonoMap/
│   │       ├── index.tsx               # 用户端交互地图
│   │       ├── Hotspot.tsx             # 热点展示
│   │       └── ComponentDetailPanel.tsx # 组件详情面板
│   └── shared/
│       └── EditorHotspot.tsx           # 统一热点组件
└── app/api/merchant/
    ├── components/
    │   └── route.ts                    # 商户组件配置 API
    └── plans/
        └── [id]/route.ts               # 套餐更新 API
```

### 商户组件配置页面

```
┌─────────────────────────────────────────────────────────────────────────┐
│  我的服务组件配置                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  💡 在此配置您提供的服务内容，适用于所有套餐                               │
│  💡 组件名称和描述由平台定义，您可以自定义图片和特色                        │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  👘 套餐包含服务 (OUTFIT)                                                │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 振袖和服                                              [启用 ✓]  │   │
│  │ 华丽的正装振袖，适合成人式、婚礼等正式场合  ← 平台定义，不可修改    │   │
│  │                                                                  │   │
│  │ 我的图片：[上传图片] [图1] [图2] [图3]                           │   │
│  │                                                                  │   │
│  │ 我的特色：                                                       │   │
│  │ [+ 添加特色] 传统古典风格 | 日本进口面料 | 每日限量3套            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  ✨ 增值服务 (ADDON)                                                     │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 摄影跟拍                                              [启用 ✓]  │   │
│  │ 专业摄影师全程跟拍服务  ← 平台定义，不可修改                       │   │
│  │                                                                  │   │
│  │ 我的定价：[¥3,000    ] (平台建议价：¥2,500)                      │   │
│  │                                                                  │   │
│  │ 我的图片：[上传图片] [作品1] [作品2]                             │   │
│  │                                                                  │   │
│  │ 我的特色：                                                       │   │
│  │ [+ 添加特色] 50张精修照片 | 当日交付 | 可选外景                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API 接口

### GET /api/merchant/components

获取商户的组件列表

**响应**：

```json
{
  "components": [
    {
      "id": "mc-1",
      "templateId": "sc-1",
      "isEnabled": true,
      "images": ["my-furisode-1.jpg"],
      "highlights": ["传统古典风格", "日本进口"],
      "price": null,
      "template": {
        "id": "sc-1",
        "code": "KIMONO_FURISODE",
        "name": "振袖和服",
        "description": "华丽的正装振袖...",
        "type": "OUTFIT",
        "icon": "👘",
        "defaultImages": ["default-furisode.jpg"],
        "defaultHighlights": ["正式场合首选"],
        "basePrice": 0
      }
    }
  ]
}
```

### PATCH /api/merchant/components/[id]

更新商户组件配置

**请求体**：

```json
{
  "images": ["my-photo-1.jpg", "my-photo-2.jpg"],
  "highlights": ["50张精修照片", "当日交付"],
  "price": 300000,
  "isEnabled": true
}
```

### PATCH /api/merchant/plans/[id]

更新套餐组件配置

**请求体**：

```json
{
  "name": "豪华振袖体验",
  "price": 1980000,
  "componentConfigs": [
    {
      "merchantComponentId": "mc-1",
      "hotmapX": 0.3,
      "hotmapY": 0.4,
      "hotmapLabelPosition": "right"
    },
    {
      "merchantComponentId": "mc-2",
      "hotmapX": 0.5,
      "hotmapY": 0.6,
      "hotmapLabelPosition": "left"
    }
  ]
}
```

---

## 实现状态

### v9.1 已完成

| 功能 | 状态 | 说明 |
|------|------|------|
| ServiceComponent 模型 | ✅ | 平台组件模板（需调整字段）|
| PlanComponent 模型 | ✅ | 套餐-组件关联（需改关联）|
| MerchantComponentOverride 模型 | ✅ | 需重命名为 MerchantComponent |
| PlanComponentEditor（三栏式）| ✅ | 套餐编辑器 UI |
| /merchant/components 页面 | ✅ | 商户组件配置（需更新）|

### v10.1 待实现

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 重命名 MerchantComponentOverride → MerchantComponent | P1 | 模型重构 |
| ServiceComponent 添加 defaultImages/defaultHighlights | P1 | 默认内容字段 |
| PlanComponent 改为关联 MerchantComponent | P1 | 关联调整 |
| 商户注册时自动创建组件实例 | P1 | 初始化逻辑 |
| 平台新增模板时自动创建实例 | P1 | 同步逻辑 |
| 商户组件配置页面更新 | P1 | 支持编辑图片和特色 |
| PlanComponentEditor 适配新模型 | P1 | 组件选择器更新 |
| 移除 ComponentUpgrade 模型 | P1 | 删除升级系统 |
| 移除 PlanUpgradeBundle 模型 | P1 | 删除升级包系统 |

---

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| v10.1 | 2024-12 | 采用实例模式：MerchantComponent 作为独立实体；PlanComponent 关联商户组件；查询效率优化（单次 JOIN）|
| v10 | 2024-12 | 简化组件类型：OUTFIT（不定价）vs ADDON（商户定价）；移除升级系统 |
| v9.1 | 2024-12 | MerchantComponentOverride 模型；PlanComponentEditor 三栏式布局 |
| v9 | 2024-12 | 平台统一管理组件，商户定价规划 |

---

## 设计决策记录

### 为什么采用实例模式？

**问题**：覆盖模式（MerchantComponentOverride）需要多次查询和应用层合并
- 获取套餐详情需要 2 次查询
- 应用层需要遍历合并数据
- 无法利用数据库索引过滤/排序合并后的字段

**解决方案**：商户组件作为独立实例（MerchantComponent）
- 商户注册时复制所有平台模板为实例
- PlanComponent 直接关联 MerchantComponent
- 查询时单次 JOIN 获取完整数据

**好处**：
- 查询效率高（单次 JOIN）
- 数据模型清晰
- 可以直接对商户字段进行 WHERE/ORDER BY

### 为什么平台定义名称和描述不可修改？

**问题**：如果商户可以修改名称，会导致：
- 用户比较不同商户时困惑（"振袖套餐" vs "华丽和服"）
- 失去平台级别的一致性
- SEO 和搜索困难

**解决方案**：
- 名称和描述由平台定义，商户不能修改
- 商户通过图片和特色亮点展示差异化
- 保证用户在比较时看到统一的组件类型名称

### 为什么平台新增模板时自动创建实例？

**问题**：如果不自动创建，商户需要手动"激活"新组件

**解决方案**：
- 平台创建新模板时，自动为所有商户创建实例
- 默认 isEnabled = true，商户可以选择禁用
- 商户无需额外操作即可使用新组件

### 平台停用模板时为什么不级联禁用？

**问题**：如果级联禁用，已使用该组件的套餐会受影响

**解决方案**：
- 平台停用模板（isActive = false）
- 商户实例保持不变
- 已有套餐继续正常显示
- 新套餐不能再选择该组件（组件选择器过滤 isActive）
