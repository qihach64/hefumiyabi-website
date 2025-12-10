# 包含服务热图 - 数据库设计讨论

## 当前架构概览

### 已有的数据模型

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   MapTemplate   │       │   MapHotspot    │       │ServiceComponent │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │1     *│ id              │*     1│ id              │
│ themeId?        │───────│ templateId      │───────│ code (unique)   │
│ isDefault       │       │ componentId     │       │ name/nameJa/En  │
│ name            │       │ x, y (位置%)    │       │ description     │
│ imageUrl        │       │ labelPosition   │       │ type (KIMONO/   │
│ imageWidth/H    │       │ displayOrder    │       │   STYLING/etc)  │
└─────────────────┘       └─────────────────┘       │ icon            │
                                                     │ highlights[]    │
                                                     │ images[]        │
                                                     │ upgradeCost     │
                                                     │ upgradesTo[]    │
                                                     └─────────────────┘
                                                            │
                                                            │ 1
                                                            │
                                                            ▼ *
                                                     ┌─────────────────┐
┌─────────────────┐                                  │  PlanComponent  │
│   RentalPlan    │                                  ├─────────────────┤
├─────────────────┤ 1                              * │ id              │
│ id              │──────────────────────────────────│ planId          │
│ name            │                                  │ componentId     │
│ includes[]      │ ← 旧字段：简单字符串数组           │ isIncluded      │
│ themeId         │                                  │ isHighlighted   │
│ ...             │                                  │ tier/tierLabel  │
└─────────────────┘                                  │ customNote      │
                                                     │ nameOverride    │
                                                     │ descOverride    │
                                                     └─────────────────┘
```

### 数据流

1. **MapTemplate** - 定义一张"底图"（如和服全身图）
2. **MapHotspot** - 定义底图上每个热点的位置（x, y 百分比坐标）
3. **ServiceComponent** - 平台统一维护的服务/配件定义
4. **PlanComponent** - 套餐对 ServiceComponent 的引用和自定义配置

---

## 当前问题

### 1. `includes[]` 与 `PlanComponent` 数据不同步

- `RentalPlan.includes` 是简单的 `String[]`，如 `["和服租赁", "专业着装", "发型设计"]`
- `PlanComponent` 是结构化的关联表
- **两者独立存在，没有自动同步**

**选项 A：废弃 `includes[]`，完全使用 `PlanComponent`**

```
优点：单一数据源，不会不一致
缺点：需要迁移现有数据，商家管理界面改动大
```

**选项 B：保留两者，`includes[]` 作为显示用，`PlanComponent` 作为热图用**

```
优点：向后兼容，渐进迁移
缺点：两套数据需要分别维护
```

**选项 C：`includes[]` 自动从 `PlanComponent` 生成**

```
优点：单一数据源 + 保持 API 兼容
缺点：需要触发器或计算字段机制
```

### 2. 热图底图来源问题

当前设计：
- `MapTemplate` 关联到 `Theme`（如"潮流拍照"主题有专属底图）
- 如果主题没有专属模板，使用 `isDefault=true` 的默认模板

**问题**：套餐详情页的图片（Plan.imageUrl）是套餐自己的图片，不是热图底图

**选项 A：热图底图 = 套餐图片（Plan.imageUrl）**

```
- 每个套餐可以有自己的热图
- 需要商家为每个套餐配置热点位置（工作量大）
```

**选项 B：热图底图 = 主题模板图片（当前设计）**

```
- 每个主题一张标准图，热点位置复用
- 套餐只需要选择"包含哪些配件"，不需要配置位置
- 但图片和套餐实际和服不对应
```

**选项 C：混合模式 - 热图独立于套餐展示图**

```
- 套餐展示图 = Plan.imageUrl（真实和服照片）
- 热图底图 = 标准示意图（解释性插画）
- 两者在详情页并存
```

---

## 需要讨论的设计决策

### Q1: 数据源策略

您希望采用哪种方式？

- [ ] A：完全迁移到 `PlanComponent`，废弃 `includes[]`
- [ ] B：两者并存，分别维护
- [ ] C：`includes[]` 自动从 `PlanComponent` 派生

### Q2: 热图底图来源

- [ ] A：使用套餐自己的图片
- [ ] B：使用主题标准模板图片
- [ ] C：热图使用独立的示意图

### Q3: ServiceComponent 粒度

当前 `ServiceComponent` 设计支持：
- 4种类型：KIMONO / STYLING / ACCESSORY / EXPERIENCE
- 升级链：`upgradeFrom/To`（如"基础发型" → "编发造型" → "日式发髻"）

**问题**：需要预定义多少种 ServiceComponent？

示例清单（参考）：

| code | name | type | 说明 |
|------|------|------|------|
| kimono-basic | 基础和服 | KIMONO | 小纹等日常款 |
| kimono-furisode | 振袖和服 | KIMONO | 成人式用 |
| obi-standard | 标准腰带 | ACCESSORY | 半幅带/名古屋带 |
| obi-premium | 高级腰带 | ACCESSORY | 袋帯 |
| hair-basic | 基础发型 | STYLING | 简单盘发 |
| hair-elaborate | 精致发型 | STYLING | 编发+发饰 |
| makeup-included | 基础妆容 | STYLING | 淡妆 |
| photo-10 | 精修照片x10 | EXPERIENCE | 摄影服务 |
| ... | ... | ... | ... |

### Q4: 商家自定义 vs 平台标准化

- **平台标准化**：所有 ServiceComponent 由平台预定义，商家只能选择"包含/不包含"
- **商家自定义**：商家可以通过 `PlanComponent.nameOverride` 等字段自定义显示

**当前设计已支持自定义，是否足够？**

---

## 数据填充计划

一旦确定设计，需要：

1. **创建 ServiceComponent 种子数据**
   - 定义标准的和服配件清单
   - 每个配件的 icon、description、highlights

2. **创建 MapTemplate 和 MapHotspot**
   - 选择或创建热图底图
   - 为每个 ServiceComponent 配置热点位置

3. **关联现有套餐**
   - 为每个 RentalPlan 创建 PlanComponent 记录
   - 根据 `includes[]` 推断应该包含哪些配件

---

## 下一步

请告诉我您对以上问题的想法，我们可以：

1. 确定数据模型设计
2. 创建种子数据脚本
3. 实现数据迁移逻辑
4. 更新详情页组件使用真实数据
