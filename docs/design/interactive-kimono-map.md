# 交互式和服配件映射图 - 设计文档

## 1. 概述

### 1.1 目标
在套餐详情页创建一个交互式的和服配件标注图，让用户可以直观地了解套餐包含哪些配件/服务，点击配件可展开查看详情。

### 1.2 参考设计
- 参考图片: `https://ewha-yifu.com/zh-tw/wp-content/themes/rikawafuku_Chinese_3.0/img/front/service_detail.webp`
- 静态标注图展示了和服套装的各个配件位置和说明

### 1.3 核心理念
基于"积木模型"设计理念（见 refactor-strategy.md）：
- **主菜 (Main Kimono)**: 和服本体（基础/蕾丝/访问着/振袖）
- **配菜 (Styling)**: 造型服务（发型/化妆/配件升级）
- **饮料 (Experience)**: 增值体验（摄影/隔日归还/太鼓结）

---

## 2. 数据模型设计

### 2.1 核心设计决策：主题-模板-组件三层架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Theme (主题)                           │
│                   潮流出片 / 传统古典 / ...                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ 1:1
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   MapTemplate (地图模板)                     │
│              每个主题一个标准底图 + 热点位置                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ 1:N
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  MapHotspot (热点定义)                       │
│           关联 ServiceComponent，定义该模板上的位置           │
└─────────────────────┬───────────────────────────────────────┘
                      │ N:1
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               ServiceComponent (服务组件)                    │
│            平台统一维护的配件/服务定义（无坐标）              │
└─────────────────────────────────────────────────────────────┘
```

**关键点**：
- 坐标存在 `MapHotspot`，不存在 `ServiceComponent`
- 同一个组件（如"腰带"）可以出现在多个模板上，位置不同
- 每个主题有一个标准模板，套餐通过主题自动获得对应模板

### 2.2 新增枚举类型

```prisma
// 服务组件类型 - 对应积木模型的三层
enum ComponentType {
  KIMONO       // 主菜：和服本体
  STYLING      // 配菜：造型服务
  ACCESSORY    // 配件：物理配件
  EXPERIENCE   // 饮料：增值体验
}

// 组件审核状态（商家申请新配件时使用）
enum ComponentStatus {
  APPROVED     // 已审核，可正常使用
  PENDING      // 待审核
  REJECTED     // 已拒绝
}
```

### 2.3 MapTemplate 模型（地图模板）

```prisma
model MapTemplate {
  id          String       @id @default(cuid())

  // 关联主题（1:1，每个主题一个模板）
  themeId     String       @unique
  theme       Theme        @relation(fields: [themeId], references: [id], onDelete: Cascade)

  // 模板信息
  name        String                // "潮流出片标准模板"
  imageUrl    String                // 底图 URL
  imageWidth  Int?                  // 底图原始宽度（用于响应式计算）
  imageHeight Int?                  // 底图原始高度

  // 元数据
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // 关联
  hotspots    MapHotspot[]

  @@map("map_templates")
}
```

### 2.4 MapHotspot 模型（热点定义）

```prisma
model MapHotspot {
  id            String           @id @default(cuid())
  templateId    String
  componentId   String           // 基础组件（升级链的起点）

  template      MapTemplate      @relation(fields: [templateId], references: [id], onDelete: Cascade)
  component     ServiceComponent @relation(fields: [componentId], references: [id], onDelete: Cascade)

  // 热点位置（百分比坐标）
  // x: 0=最左, 1=最右; y: 0=最上, 1=最下
  x             Float
  y             Float

  // 标签显示位置
  labelPosition String           @default("right")  // "left" | "right" | "top" | "bottom"

  // 连接线配置（可选）
  lineStyle     String?          // "straight" | "elbow"

  // 排序（决定热点动画顺序）
  displayOrder  Int              @default(0)

  createdAt     DateTime         @default(now())

  @@unique([templateId, componentId])  // 每个模板上每个组件只能有一个热点
  @@index([templateId])
  @@map("map_hotspots")
}
```

**升级设计说明**：

热点的 `componentId` 指向升级链的**基础组件**（如 `KIMONO`）。通过 `ServiceComponent.upgradesTo` 关联可以找到所有升级选项：

```
热点位置 (x: 0.72, y: 0.52)
    │
    └── componentId: KIMONO (基础和服)
            │
            ├── upgradesTo: KIMONO_LACE (蕾丝和服) +¥2000
            │       │
            │       └── upgradesTo: KIMONO_HOUMON (访问着) +¥5000
            │               │
            │               └── upgradesTo: KIMONO_FURISODE (振袖) +¥15000
            │
            └── (同一个热点位置，显示不同等级的组件)
```

**PlanComponent 记录套餐实际使用的组件等级**：
- 基础套餐：`componentId = KIMONO`
- 豪华套餐：`componentId = KIMONO_LACE`
- 尊享套餐：`componentId = KIMONO_HOUMON`

前端渲染时：
1. 从 `MapHotspot` 获取热点位置
2. 从 `PlanComponent` 获取该套餐实际使用的组件
3. 如果 `PlanComponent.componentId` 是 `MapHotspot.componentId` 的升级版，仍使用同一热点位置

### 2.5 ServiceComponent 模型（服务组件 - 无坐标）

```prisma
model ServiceComponent {
  id            String          @id @default(cuid())
  code          String          @unique    // 唯一标识，如 "KIMONO", "OBI_TAIKO"

  // 基本信息
  name          String                     // 显示名称，如 "基础和服"
  nameJa        String?                    // 日文名称
  nameEn        String?                    // 英文名称
  description   String?                    // 详细描述
  type          ComponentType              // 组件类型
  icon          String?                    // emoji 或图标名称

  // ============ 升级链设计（关键！）============
  // 升级路径（自关联）- 形成升级链
  upgradeFromId   String?
  upgradeFrom     ServiceComponent?  @relation("UpgradePath", fields: [upgradeFromId], references: [id])
  upgradesTo      ServiceComponent[] @relation("UpgradePath")

  // 升级成本（相对于 upgradeFrom 的差价）
  upgradeCost     Int?               // 升级差价（日元），如 KIMONO_LACE 相对于 KIMONO 的差价

  // 是否为基础组件（升级链的起点）
  // 热点只绑定基础组件，升级版通过 upgradeFrom 链查找
  isBaseComponent Boolean       @default(true)
  // ============================================

  // 定价信息
  basePrice       Int           @default(0)  // 单独购买价格（非升级场景）

  // 详情展示内容
  highlights      String[]      @default([]) // 亮点列表
  images          String[]      @default([]) // 配件图片

  // 审核状态
  status          ComponentStatus @default(APPROVED)
  requestedBy     String?          // 申请商家 ID
  rejectionReason String?

  // 元数据
  displayOrder    Int           @default(0)
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // 关联
  planComponents  PlanComponent[]
  mapHotspots     MapHotspot[]     // 只有 isBaseComponent=true 的组件才会有热点

  @@index([type, isActive, displayOrder])
  @@index([status])
  @@index([isBaseComponent])
  @@index([upgradeFromId])
  @@map("service_components")
}
```

**升级链示例**：

```
基础组件 (isBaseComponent: true)     升级组件 (isBaseComponent: false)
┌─────────────────┐                 ┌─────────────────┐
│ KIMONO          │ ◄───────────────│ KIMONO_LACE     │
│ 基础和服         │  upgradeFromId  │ 蕾丝和服         │
│ basePrice: 0    │                 │ upgradeCost: 2000│
│ 有热点位置 ✓     │                 │ 无热点位置 ✗     │
└─────────────────┘                 └────────┬────────┘
                                             │ upgradeFromId
                                    ┌────────▼────────┐
                                    │ KIMONO_HOUMON   │
                                    │ 访问着          │
                                    │ upgradeCost: 5000│
                                    └────────┬────────┘
                                             │ upgradeFromId
                                    ┌────────▼────────┐
                                    │ KIMONO_FURISODE │
                                    │ 振袖            │
                                    │ upgradeCost:15000│
                                    └─────────────────┘
```

**查找组件的基础组件（用于定位热点）**：

```typescript
// 递归查找升级链的起点
async function findBaseComponent(componentId: string): Promise<string> {
  const component = await prisma.serviceComponent.findUnique({
    where: { id: componentId },
    select: { id: true, upgradeFromId: true, isBaseComponent: true }
  });

  if (!component) throw new Error('Component not found');
  if (component.isBaseComponent || !component.upgradeFromId) {
    return component.id;
  }

  return findBaseComponent(component.upgradeFromId);
}

// 获取组件的所有升级选项
async function getUpgradeOptions(baseComponentId: string) {
  return prisma.serviceComponent.findMany({
    where: {
      OR: [
        { id: baseComponentId },
        { upgradeFromId: baseComponentId },
        // 需要递归查询，或使用 CTE
      ]
    },
    orderBy: { upgradeCost: 'asc' }
  });
}
```

### 2.6 PlanComponent 模型（套餐-配件关联）

```prisma
model PlanComponent {
  id            String           @id @default(cuid())
  planId        String
  componentId   String

  plan          RentalPlan       @relation(fields: [planId], references: [id], onDelete: Cascade)
  component     ServiceComponent @relation(fields: [componentId], references: [id], onDelete: Cascade)

  // 该套餐中此配件的具体配置
  tier          String?          // 等级: "basic" | "premium" | "luxury"
  tierLabel     String?          // 等级显示名称
  isIncluded    Boolean          @default(true)   // 是否包含在套餐价格中
  isHighlighted Boolean          @default(false)  // 是否作为卖点突出显示
  quantity      Int              @default(1)
  customNote    String?          // 自定义说明

  // === 商家可覆盖的字段（简化版） ===
  nameOverride         String?      // 覆盖组件名称
  descriptionOverride  String?      // 覆盖描述
  highlightsOverride   String[]     @default([])  // 覆盖亮点
  upgradePriceOverride Int?         // 覆盖升级价格

  createdAt     DateTime         @default(now())

  @@unique([planId, componentId])
  @@index([planId])
  @@map("plan_components")
}
```

### 2.7 更新 Theme 模型

```prisma
model Theme {
  // ... 现有字段 ...

  // 新增：地图模板（1:1）
  mapTemplate  MapTemplate?
}
```

### 2.8 更新 RentalPlan 模型

```prisma
model RentalPlan {
  // ... 现有字段 ...

  // 新增关联
  planComponents PlanComponent[]

  // 注意：套餐通过 theme.mapTemplate 获取地图模板
  // 不需要直接关联 mapTemplateId
}
```

### 2.9 数据获取示例

```typescript
// 获取套餐的交互地图数据
async function getPlanMapData(planId: string) {
  const plan = await prisma.rentalPlan.findUnique({
    where: { id: planId },
    include: {
      theme: {
        include: {
          mapTemplate: {
            include: {
              hotspots: {
                include: { component: true },
                orderBy: { displayOrder: 'asc' }
              }
            }
          }
        }
      },
      planComponents: {
        include: { component: true }
      }
    }
  });

  if (!plan?.theme?.mapTemplate) return null;

  const { mapTemplate } = plan.theme;
  const planComponentMap = new Map(
    plan.planComponents.map(pc => [pc.componentId, pc])
  );

  // 合并模板热点和套餐配置
  const hotspots = mapTemplate.hotspots.map(hotspot => {
    const planComponent = planComponentMap.get(hotspot.componentId);
    return {
      ...hotspot,
      component: {
        ...hotspot.component,
        // 应用商家覆盖
        name: planComponent?.nameOverride || hotspot.component.name,
        description: planComponent?.descriptionOverride || hotspot.component.description,
        highlights: planComponent?.highlightsOverride?.length
          ? planComponent.highlightsOverride
          : hotspot.component.highlights,
      },
      // 套餐配置
      isIncluded: planComponent?.isIncluded ?? false,
      isHighlighted: planComponent?.isHighlighted ?? false,
      tier: planComponent?.tier,
      tierLabel: planComponent?.tierLabel,
      customNote: planComponent?.customNote,
    };
  });

  return {
    imageUrl: mapTemplate.imageUrl,
    hotspots,
  };
}
```

---

## 3. 标准配件库（种子数据）

### 3.1 ServiceComponent（服务组件 - 无坐标）

基础配件：

| code | name | nameJa | type | icon | highlights |
|------|------|--------|------|------|------------|
| `HAIR_ACCESSORY` | 女性髮飾 | 髪飾り | ACCESSORY | 💮 | ["超过100种可供选择", "专业搭配建议"] |
| `JUBAN` | 襦袢 | 襦袢 | ACCESSORY | 👘 | ["素色到花样款式齐全", "舒适内衬"] |
| `HADAGI` | 内衣 | 肌着 | ACCESSORY | 👕 | ["柔软舒适材质", "卫生独立包装"] |
| `OBI` | 腰带 | 帯 | ACCESSORY | 🎀 | ["工作人员专业搭配", "多种系法可选"] |
| `KIMONO` | 和服 | 着物 | KIMONO | 👘 | ["专业人员搭配建议", "多种花色可选"] |
| `BAG` | 包包 | バッグ | ACCESSORY | 👜 | ["束口袋/藤编包/珍珠包等", "免费提供"] |
| `TABI` | 足袋 | 足袋 | ACCESSORY | 🧦 | ["分趾袜", "方案包含提供"] |
| `ZORI` | 草履 | 草履 | ACCESSORY | 👡 | ["种类众多", "舒适好走"] |

造型服务：

| code | name | type | icon | highlights |
|------|------|------|------|------------|
| `HAIR_STYLING` | 专业发型 | STYLING | 💇 | ["专业造型师", "多种风格可选"] |
| `MAKEUP` | 专业化妆 | STYLING | 💄 | ["专业彩妆", "持久不脱妆"] |

升级配件：

| code | name | type | upgradeFrom | upgradeCost | highlights |
|------|------|------|-------------|-------------|------------|
| `OBI_TAIKO` | 太鼓结腰带 | ACCESSORY | OBI | 800 | ["华丽太鼓结", "专业手工系结"] |
| `KIMONO_LACE` | 蕾丝和服 | KIMONO | KIMONO | 2000 | ["精美蕾丝装饰", "网红拍照首选"] |
| `KIMONO_HOUMON` | 访问着 | KIMONO | KIMONO_LACE | 5000 | ["正式场合适用", "高级面料"] |
| `KIMONO_FURISODE` | 振袖 | KIMONO | KIMONO_HOUMON | 15000 | ["成人式/毕业典礼", "最高级别和服"] |

增值体验：

| code | name | type | basePrice | highlights |
|------|------|------|-----------|------------|
| `PHOTO_BASIC` | 基础跟拍 | EXPERIENCE | 8000 | ["30分钟跟拍", "精修5张"] |
| `PHOTO_PREMIUM` | 豪华跟拍 | EXPERIENCE | 18000 | ["60分钟跟拍", "精修15张", "含Vlog"] |
| `NEXT_DAY_RETURN` | 隔日归还 | EXPERIENCE | 1000 | ["次日12点前归还", "尽情享受"] |

### 3.2 MapTemplate + MapHotspot（地图模板 + 热点位置）

#### 快速迭代策略

**Phase 1（当前）**：所有主题共用一套模板
- 底图：`https://ewha-yifu.com/zh-tw/wp-content/themes/rikawafuku_Chinese_3.0/img/front/service_detail.webp`
- 所有主题的 MapTemplate 指向同一张图和同一套热点坐标
- 优点：只需维护 1 套数据，快速上线

**Phase 2（未来）**：按主题定制模板
- 不同主题使用不同底图和坐标
- 商家可申请自定义模板

#### 标准热点坐标（基于参考图）

| componentCode | x | y | labelPosition | displayOrder |
|--------------|---|---|---------------|--------------|
| HAIR_ACCESSORY | 0.72 | 0.08 | right | 1 |
| JUBAN | 0.28 | 0.18 | left | 2 |
| HADAGI | 0.72 | 0.25 | right | 3 |
| OBI | 0.25 | 0.38 | left | 4 |
| KIMONO | 0.72 | 0.52 | right | 5 |
| BAG | 0.22 | 0.62 | left | 6 |
| TABI | 0.68 | 0.85 | right | 7 |
| ZORI | 0.32 | 0.92 | left | 8 |
| HAIR_STYLING | 0.72 | 0.05 | right | 9 |

#### 种子数据策略

```typescript
// 1. 创建一个"默认模板"
const defaultTemplate = await prisma.mapTemplate.create({
  data: {
    themeId: null,  // 特殊：不关联特定主题，作为默认模板
    name: "女性和服标准模板",
    imageUrl: "https://ewha-yifu.com/zh-tw/wp-content/themes/rikawafuku_Chinese_3.0/img/front/service_detail.webp",
    isDefault: true,  // 新增字段：标记为默认模板
  }
});

// 2. 所有主题关联到默认模板（或直接用 fallback 逻辑）
// 前端获取模板时：theme.mapTemplate ?? defaultTemplate
```

#### 模型调整：支持默认模板

```prisma
model MapTemplate {
  id          String       @id @default(cuid())

  // 关联主题（可选，null 表示默认模板）
  themeId     String?      @unique
  theme       Theme?       @relation(fields: [themeId], references: [id], onDelete: Cascade)

  // 是否为默认模板（当主题没有专属模板时使用）
  isDefault   Boolean      @default(false)

  // ... 其他字段不变
}
```

---

## 4. 前端组件设计

### 4.1 组件结构

```
src/components/plan/
├── InteractiveKimonoMap/
│   ├── index.tsx                 # 主组件
│   ├── Hotspot.tsx               # 热点标记组件
│   ├── HotspotLabel.tsx          # 热点标签组件
│   ├── ComponentDetailPanel.tsx  # 配件详情侧边面板
│   └── types.ts                  # 类型定义
```

### 4.2 InteractiveKimonoMap 主组件

```tsx
interface InteractiveKimonoMapProps {
  // 底图
  baseImage: string;

  // 套餐包含的配件（已关联 ServiceComponent 详情）
  planComponents: Array<{
    component: ServiceComponent;
    tier?: string;
    tierLabel?: string;
    isIncluded: boolean;
    isHighlighted: boolean;
    customNote?: string;
    hotspotOverride?: { x: number; y: number };
  }>;

  // 回调
  onComponentSelect?: (component: ServiceComponent) => void;
}
```

### 4.3 交互行为

```
用户流程：
1. 页面加载 → 显示底图 + 所有热点（脉冲动画）
2. Hover 热点 → 显示 tooltip（配件名称）
3. Click 热点 → 右侧滑出详情面板
4. 详情面板显示：
   - 配件名称 + 图标
   - 是否包含标记（✅ 已包含 / ➕ 可加购）
   - 等级标签（如有）
   - 亮点列表
   - 升级选项（如有）
   - 配件图片轮播（如有）
```

### 4.4 视觉设计

```
热点样式：
- 默认：白色圆点 + 脉冲动画（吸引注意）
- Hover：放大 + 高亮
- 已包含：绿色边框
- 可升级：蓝色闪烁
- 可加购：灰色虚线

连接线样式：
- 从热点延伸到标签
- 浅灰色细线
- 转角处有小圆点

标签样式：
- 白色背景 + 圆角
- 配件名称（粗体）
- 简短说明（浅灰色）
- 左侧/右侧交替排列
```

### 4.5 响应式策略

```
桌面端 (≥1024px)：
- 图片左侧，详情面板右侧滑出
- 热点 + 标签完整显示

平板端 (768px - 1023px)：
- 图片居中，详情面板底部滑出
- 热点完整显示，标签简化

移动端 (<768px) - 后续优化：
- 考虑改为垂直列表视图
- 或使用可缩放的图片查看器
```

---

## 5. API 设计

### 5.1 获取套餐配件列表

```
GET /api/plans/[id]/components

Response:
{
  "planId": "xxx",
  "baseImage": "https://...",
  "components": [
    {
      "id": "pc_xxx",
      "component": {
        "id": "xxx",
        "code": "KIMONO",
        "name": "和服",
        "type": "KIMONO",
        "icon": "👘",
        "hotspotPosition": { "x": 0.72, "y": 0.52 },
        "labelPosition": "right",
        "highlights": ["专业人员搭配建议", "多种花色可选"],
        "images": ["https://..."],
        "upgradeCost": null,
        "upgradesTo": [
          { "code": "KIMONO_LACE", "name": "蕾丝和服", "upgradeCost": 2000 }
        ]
      },
      "tier": "basic",
      "tierLabel": "基础版",
      "isIncluded": true,
      "isHighlighted": true,
      "customNote": null
    },
    // ...
  ]
}
```

### 5.2 商家申请新配件

```
POST /api/merchant/components/request

Body:
{
  "name": "自定义配件名称",
  "type": "ACCESSORY",
  "description": "配件描述",
  "hotspotPosition": { "x": 0.5, "y": 0.5 }
}

Response:
{
  "id": "xxx",
  "code": "CUSTOM_xxx",  // 自动生成临时 code
  "status": "PENDING",
  "message": "申请已提交，审核通过前您可以临时使用此配件"
}
```

---

## 6. 商家工具（后续迭代）

### 6.1 热点编辑器

允许商家上传自己的模特图并定义热点位置：

1. 上传图片
2. 点击图片添加热点
3. 选择关联的配件
4. 微调位置
5. 预览效果
6. 保存配置

### 6.2 配件选择器

在创建/编辑套餐时，选择包含哪些配件：

1. 显示所有可用配件（平台 + 商家待审核）
2. 勾选包含的配件
3. 设置等级/自定义说明
4. 标记亮点配件

---

## 7. 实施阶段

### Phase 1: 基础实现
- [ ] 添加数据模型（Prisma schema）
- [ ] 创建种子数据脚本
- [ ] 实现 InteractiveKimonoMap 组件
- [ ] 集成到套餐详情页

### Phase 2: 商家功能
- [ ] 商家配件申请 API
- [ ] 管理员审核界面
- [ ] 商家套餐配件配置界面

### Phase 3: 高级功能
- [ ] 热点编辑器（商家自定义地图）
- [ ] 移动端优化
- [ ] 多语言支持

---

## 8. 技术细节

### 8.1 热点坐标系统

使用相对坐标（0-1），便于响应式适配：

```typescript
interface HotspotPosition {
  x: number;  // 0 = 最左, 1 = 最右
  y: number;  // 0 = 最上, 1 = 最下
}

// 转换为 CSS
const style = {
  left: `${position.x * 100}%`,
  top: `${position.y * 100}%`,
};
```

### 8.2 脉冲动画

```css
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 107, 129, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(255, 107, 129, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 107, 129, 0);
  }
}

.hotspot {
  animation: pulse 2s infinite;
}
```

### 8.3 连接线实现

使用 SVG 或 CSS 伪元素：

```tsx
// SVG 方式（更灵活）
<svg className="absolute inset-0 pointer-events-none">
  <line
    x1={`${hotspot.x * 100}%`}
    y1={`${hotspot.y * 100}%`}
    x2={labelPosition.x}
    y2={labelPosition.y}
    stroke="#ccc"
    strokeWidth="1"
  />
</svg>
```

---

## 9. 示例效果

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│     ┌─────────────┐                                            │
│     │ 女性髮飾 👘 │◄──────────●                               │
│     │ 超过100种   │           │                               │
│     └─────────────┘           │   ┌──────────────────────────┐│
│                               │   │                          ││
│                    ┌──────────┘   │  ✅ 女性髮飾             ││
│    ●───────────────┤              │                          ││
│    │               │              │  超过100种可供选择        ││
│  ┌─┴───────┐       │              │  专业搭配建议            ││
│  │ 襦袢    │       │              │                          ││
│  │ 内衬    │       │              │  ┌────────────────────┐  ││
│  └─────────┘       👘             │  │  [升级选项]        │  ││
│                  (模特)           │  │  蕾丝和服 +¥2,000  │  ││
│    ●────────────┐                 │  └────────────────────┘  ││
│    │            │                 │                          ││
│  ┌─┴───────┐    │                 │  ┌────┐ ┌────┐ ┌────┐   ││
│  │ 腰带    │    │                 │  │ 📷 │ │ 📷 │ │ 📷 │   ││
│  │ 专业搭配│    │                 │  └────┘ └────┘ └────┘   ││
│  └─────────┘    │                 │                          ││
│                 │                 └──────────────────────────┘│
│                 │                                              │
│    ●────────────┤                                              │
│  ┌─┴───────┐    │                                              │
│  │ 草履    │    │                                              │
│  │ 种类众多│    │                                              │
│  └─────────┘    │                                              │
│                 ●──────────────┐                               │
│                                │                               │
│                          ┌─────┴───────┐                       │
│                          │ 足袋        │                       │
│                          │ 方案包含    │                       │
│                          └─────────────┘                       │
└────────────────────────────────────────────────────────────────┘
```

---

## 10. 商家自定义方案（简化版）

### 10.1 设计原则

**核心理念**：平台提供"积木块"，商家只需"选用"和"贴标签"

```
商家入驻流程：
1. 选择平台标准组件 ✅ (勾选即可)
2. 覆盖描述文案     ✍️ (可选，不填用默认)
3. 设置升级价格     💰 (可选，不填用默认)
4. 完成！          🎉
```

**不需要**：
- ❌ 创建新组件
- ❌ 定义热点坐标
- ❌ 上传配件图片
- ❌ 复杂的配置流程

### 10.2 简化数据模型

保持 `ServiceComponent` 为平台统一管理，`PlanComponent` 增加商家覆盖字段：

```prisma
model PlanComponent {
  id            String           @id @default(cuid())
  planId        String
  componentId   String

  plan          RentalPlan       @relation(fields: [planId], references: [id], onDelete: Cascade)
  component     ServiceComponent @relation(fields: [componentId], references: [id], onDelete: Cascade)

  // === 商家可覆盖的字段 ===

  // 1. 显示名称覆盖（如：平台叫"腰带"，商家想叫"高级织锦腰带"）
  nameOverride      String?

  // 2. 描述覆盖（商家自定义卖点）
  descriptionOverride String?

  // 3. 亮点覆盖（替换默认的 highlights）
  highlightsOverride  String[]    @default([])

  // 4. 价格覆盖（该商家的升级价格，如平台默认太鼓结 +800，商家可改为 +500）
  upgradePriceOverride Int?

  // === 原有字段 ===
  tier          String?          // 等级: "basic" | "premium" | "luxury"
  tierLabel     String?          // 等级显示名称
  isIncluded    Boolean          @default(true)
  isHighlighted Boolean          @default(false)
  quantity      Int              @default(1)
  customNote    String?          // 补充说明

  createdAt     DateTime         @default(now())

  @@unique([planId, componentId])
  @@index([planId])
  @@map("plan_components")
}
```

### 10.3 商家配置界面（极简版）

```
┌─────────────────────────────────────────────────────────────┐
│  创建套餐 - 第3步：选择包含项目                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👘 主体配件                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ 和服        基础版 ▼   [ 编辑描述 ]               │   │
│  │ ☑ 襦袢        ─────      [ 使用默认 ]               │   │
│  │ ☑ 腰带        基础版 ▼   [ 编辑描述 ]               │   │
│  │ ☐ 太鼓结腰带  升级项     价格: ¥[  800  ]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💄 造型服务                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ 专业发型    ─────      [ 使用默认 ]               │   │
│  │ ☐ 专业化妆    升级项     价格: ¥[ 3000 ]           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  👜 配件                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ 女性髮飾    ─────      [ 使用默认 ]               │   │
│  │ ☑ 包包        免费束口袋  [ 编辑描述 ]               │   │
│  │ ☑ 足袋        ─────      [ 使用默认 ]               │   │
│  │ ☑ 草履        ─────      [ 使用默认 ]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [ 上一步 ]  [ 保存并继续 ]     │
└─────────────────────────────────────────────────────────────┘
```

**交互说明**：
1. 默认全选基础配件
2. 点击"编辑描述"展开覆盖字段
3. 升级项默认不勾选，勾选后显示价格输入
4. 不填写的字段自动使用平台默认值

### 10.4 数据展示逻辑（前端）

```typescript
// 获取显示数据时，优先使用商家覆盖值
function getDisplayData(planComponent: PlanComponent) {
  const { component } = planComponent;

  return {
    name: planComponent.nameOverride || component.name,
    description: planComponent.descriptionOverride || component.description,
    highlights: planComponent.highlightsOverride.length > 0
      ? planComponent.highlightsOverride
      : component.highlights,
    upgradePrice: planComponent.upgradePriceOverride ?? component.upgradeCost,
    // 不可覆盖的字段（保持平台一致性）
    icon: component.icon,
    type: component.type,
    hotspotPosition: component.hotspotPosition,
    images: component.images,
  };
}
```

### 10.5 商家自定义配件申请流程

当商家需要平台没有的配件时：

```
商家后台 → "申请新配件"
├── 填写配件名称（必填）
├── 填写配件描述（必填）
├── 选择配件类型（下拉选择）
└── 提交申请

平台管理员 → 审核
├── 通过 → 添加到标准库，所有商家可用
├── 拒绝 → 反馈原因
└── 建议 → 推荐使用现有相似配件
```

**关键点**：商家不能自行创建配件到自己的套餐，必须通过平台审核后成为标准配件。这保证了：
- 平台配件库的质量
- 所有用户看到的配件信息一致
- 热点坐标由平台统一维护

### 10.6 与原方案对比

| 方面 | 原混合方案 | 简化方案 |
|------|------------|----------|
| 商家创建组件 | 可以（需审核） | 不可以（申请添加到平台） |
| 商家定义热点 | 可以 | 不可以（用平台默认） |
| 商家上传图片 | 可以 | 不可以（用平台默认） |
| 自定义描述 | 有 | 有（覆盖字段） |
| 自定义价格 | 有 | 有（覆盖字段） |
| 入驻复杂度 | 中等 | **极低** |
| 平台一致性 | 中等 | **高** |
| 数据模型复杂度 | 高（2个新表） | **低（1个表+覆盖字段）** |

### 10.7 后续扩展路径

如果未来需要更多灵活性，可以渐进式增加：

1. **Phase 1（当前）**：商家选用 + 覆盖描述
2. **Phase 2**：商家可上传套餐专属底图
3. **Phase 3**：商家可微调热点位置（在平台坐标基础上偏移）
4. **Phase 4**：高级商家可申请完全自定义配件

---

## 11. 问题与决策记录

| 日期 | 问题 | 决策 |
|------|------|------|
| 2024-12-04 | 图片资源来源 | 先用示例图，后续支持商家上传自定义图 |
| 2024-12-04 | 热点定位方式 | 使用百分比坐标，响应式友好 |
| 2024-12-04 | 移动端适配 | 后续迭代优化，可能改为列表视图 |
| 2024-12-04 | 配件管理权限 | 平台统一维护，商家可申请新配件 |
| 2024-12-04 | 商家自定义方案 | 采用简化版：商家只能选用平台组件+覆盖描述，不能创建新组件 |
| 2024-12-04 | 热点坐标存储位置 | **重要决策**：坐标不存在 ServiceComponent，而是存在 MapHotspot。因为同一组件可出现在不同模板上，位置不同 |
| 2024-12-04 | 模板与主题关系 | 每个主题对应一个地图模板（1:1），套餐通过所属主题自动获得对应模板。后续可支持商家自定义模板 |
| 2024-12-04 | 组件升级支持 | **预留扩展**：热点绑定基础组件（isBaseComponent=true），升级组件通过 upgradeFromId 链关联。套餐的 PlanComponent 记录实际使用的组件等级。暂不实现升级功能，但数据结构支持 |
| 2024-12-05 | 快速迭代策略 | **Phase 1**：所有主题共用一套默认模板（同一张底图 + 同一套热点坐标）。数据库结构完整（4表），但初期只维护 1 套数据。未来按需为不同主题创建专属模板 |
