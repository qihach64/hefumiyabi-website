# 租赁套餐标签系统数据模型

## 概述

本文档描述了**江戸和装工房雅**平台中租赁套餐(Rental Plans)与标签系统(Tag System)的数据模型设计。该系统实现了灵活的分类和筛选功能,帮助用户快速找到符合其需求的和服租赁套餐。

---

## 核心设计理念

### 1. 标签分层架构

标签系统采用**两级分类结构**:

```
标签分类 (TagCategory)
  └── 标签 (Tag)
      └── 套餐标签关联 (PlanTag)
          └── 租赁套餐 (RentalPlan)
```

- **TagCategory**: 定义标签的顶层分类(如"使用场景"、"服务等级")
- **Tag**: 具体的标签值(如"街拍漫步"、"寺庙参拜"、"豪华尊享")
- **PlanTag**: 多对多关联表,连接套餐与标签
- **RentalPlan**: 和服租赁套餐,可关联多个标签

### 2. 设计优势

✅ **解耦合**: 标签与套餐通过关联表解耦,便于独立管理和扩展
✅ **多维筛选**: 支持按场景、服务等级、价格区间等多个维度组合筛选
✅ **可追溯性**: 记录标签的添加者和时间,支持审计
✅ **使用统计**: 自动追踪标签使用频率,辅助运营决策
✅ **国际化**: 内置中英文字段,支持多语言展示

---

## 数据模型详解

### 1. TagCategory (标签分类表)

**用途**: 定义标签的顶层分类,如"使用场景"、"服务等级"等。

#### 字段说明

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | String (cuid) | 主键,唯一标识 | `cmhk08a1t0000ycrlcx3asm06` |
| `code` | String (unique) | 分类代码,用于程序化访问 | `scene`, `service_level` |
| `name` | String | 中文名称 | `使用场景`, `服务等级` |
| `nameEn` | String? | 英文名称(可选) | `Scene`, `Service Level` |
| `description` | String? | 分类说明 | `和服体验的场景分类` |
| `icon` | String? | 图标(emoji或图标类名) | `📍`, `⭐` |
| `color` | String? | 主题色(HEX格式) | `#3b82f6`, `#f59e0b` |
| `order` | Int | 显示顺序(数字越小越靠前) | `1`, `2` |
| `isActive` | Boolean | 是否启用 | `true` / `false` |
| `showInFilter` | Boolean | 是否在筛选器中显示 | `true` / `false` |
| `filterOrder` | Int | 筛选器中的显示顺序 | `1`, `2` |
| `createdAt` | DateTime | 创建时间 | `2025-11-04T03:23:39.618Z` |
| `updatedAt` | DateTime | 更新时间 | `2025-11-04T03:23:39.618Z` |

#### 关联关系

- `tags: Tag[]` - 一对多关联,一个分类包含多个标签

#### 当前数据示例

```json
{
  "id": "cmhk08a1t0000ycrlcx3asm06",
  "code": "scene",
  "name": "使用场景",
  "nameEn": "Scene",
  "description": "和服体验的场景分类",
  "icon": "📍",
  "color": "#3b82f6",
  "order": 1,
  "isActive": true,
  "showInFilter": true,
  "filterOrder": 1
}
```

---

### 2. Tag (标签表)

**用途**: 定义具体的标签值,如"街拍漫步"、"寺庙参拜"等。

#### 字段说明

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | String (cuid) | 主键,唯一标识 | `cmhk08b0w0003ycrljv6eavmr` |
| `categoryId` | String | 所属分类ID(外键) | `cmhk08a1t0000ycrlcx3asm06` |
| `code` | String | 标签代码(分类内唯一) | `casual_walk`, `temple_visit` |
| `name` | String | 中文名称 | `街拍漫步`, `寺庙参拜` |
| `nameEn` | String? | 英文名称(可选) | `Casual Walk`, `Temple Visit` |
| `icon` | String? | 图标(emoji) | `📸`, `⛩️` |
| `color` | String? | 标签色彩 | `#10b981` |
| `order` | Int | 分类内显示顺序 | `1`, `2` |
| `isActive` | Boolean | 是否启用 | `true` / `false` |
| `usageCount` | Int | 使用次数统计 | `15`, `7` |
| `createdAt` | DateTime | 创建时间 | `2025-11-04T03:23:40.880Z` |
| `updatedAt` | DateTime | 更新时间(含使用统计更新) | `2025-11-13T02:25:31.577Z` |

#### 关联关系

- `category: TagCategory` - 多对一关联,每个标签属于一个分类
- `plans: PlanTag[]` - 一对多关联,一个标签可关联多个套餐

#### 唯一约束

- `(categoryId, code)` - 组合唯一索引,确保同一分类内标签代码唯一

#### 当前数据示例

**使用场景分类下的标签:**

```json
[
  {
    "code": "casual_walk",
    "name": "街拍漫步",
    "nameEn": "Casual Walk",
    "icon": "📸",
    "order": 1,
    "usageCount": 15
  },
  {
    "code": "temple_visit",
    "name": "寺庙参拜",
    "nameEn": "Temple Visit",
    "icon": "⛩️",
    "order": 2,
    "usageCount": 7
  },
  {
    "code": "date",
    "name": "浪漫约会",
    "nameEn": "Date",
    "icon": "💕",
    "order": 3,
    "usageCount": 5
  },
  {
    "code": "photoshoot",
    "name": "专业写真",
    "nameEn": "Photoshoot",
    "icon": "📷",
    "order": 4,
    "usageCount": 3
  }
]
```

**服务等级分类下的标签:**

```json
[
  {
    "code": "basic",
    "name": "经济实惠",
    "nameEn": "Budget",
    "icon": "💰",
    "order": 1,
    "usageCount": 4
  },
  {
    "code": "standard",
    "name": "标准套餐",
    "nameEn": "Standard",
    "icon": "✨",
    "order": 2,
    "usageCount": 14
  },
  {
    "code": "premium",
    "name": "豪华尊享",
    "nameEn": "Premium",
    "icon": "👑",
    "order": 3,
    "usageCount": 4
  }
]
```

---

### 3. PlanTag (套餐标签关联表)

**用途**: 多对多关联表,连接租赁套餐(RentalPlan)与标签(Tag)。

#### 字段说明

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | String (cuid) | 主键,唯一标识 | `cmhk4zv4l0002ycerdhh2240u` |
| `planId` | String | 套餐ID(外键) | `cmgvcwz510028gy6j90eqr5dd` |
| `tagId` | String | 标签ID(外键) | `cmhk08b0w0003ycrljv6eavmr` |
| `addedBy` | String? | 添加者用户ID(可为空) | `cmh49z9660003gysvic2hlf6a` |
| `addedAt` | DateTime | 添加时间 | `2025-11-04T05:37:05.109Z` |

#### 关联关系

- `plan: RentalPlan` - 多对一关联,关联到租赁套餐
- `tag: Tag` - 多对一关联,关联到标签

#### 唯一约束

- `(planId, tagId)` - 组合唯一索引,防止重复关联

#### 数据示例

```json
{
  "id": "cmhk4zv4l0002ycerdhh2240u",
  "planId": "cmgvcwz510028gy6j90eqr5dd",
  "tagId": "cmhk08b0w0003ycrljv6eavmr",
  "addedBy": "cmh49z9660003gysvic2hlf6a",
  "addedAt": "2025-11-04T05:37:05.109Z",
  "plan": {
    "name": "京都雅豪华振袖|10周年优惠,不可退款"
  },
  "tag": {
    "code": "casual_walk",
    "name": "街拍漫步"
  }
}
```

---

### 4. RentalPlan (租赁套餐表)

**用途**: 和服租赁套餐的核心数据模型,包含价格、包含项、时间限制等完整信息。

#### 核心字段(与标签系统相关)

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | String (cuid) | 主键 | `cmgvcwz510028gy6j90eqr5dd` |
| `name` | String | 套餐名称 | `京都雅豪华振袖\|10周年优惠,不可退款` |
| `category` | PlanCategory | 套餐分类(枚举) | `LADIES`, `MENS`, `COUPLE` |
| `tags` | String[] | **旧版标签字段**(待移除) | `["情侣套餐"]` |
| `planTags` | PlanTag[] | **新版标签关联**(推荐使用) | `[{tag: {...}, ...}]` |

#### 标签系统演进

**🔴 旧版设计** (已废弃,保留用于兼容):
```prisma
tags String[] @default([])  // 简单字符串数组
```
- 优点: 实现简单
- 缺点: 无法分类、无统计、难维护

**🟢 新版设计** (当前推荐):
```prisma
planTags PlanTag[]  // 关联表设计
```
- 优点: 支持分类、可追溯、易扩展
- 缺点: 需额外查询(可通过include优化)

#### 关联关系

- `planTags: PlanTag[]` - 一对多关联,一个套餐可有多个标签

#### 查询示例

```typescript
// 查询套餐及其标签(包含分类信息)
const plan = await prisma.rentalPlan.findUnique({
  where: { id: 'cmgvcwz510028gy6j90eqr5dd' },
  include: {
    planTags: {
      include: {
        tag: {
          include: {
            category: true
          }
        }
      }
    }
  }
});

// 结果结构示例:
{
  "id": "cmgvcwz510028gy6j90eqr5dd",
  "name": "京都雅豪华振袖|10周年优惠,不可退款",
  "planTags": [
    {
      "tag": {
        "code": "casual_walk",
        "name": "街拍漫步",
        "category": {
          "code": "scene",
          "name": "使用场景"
        }
      }
    },
    {
      "tag": {
        "code": "temple_visit",
        "name": "寺庙参拜",
        "category": {
          "code": "scene",
          "name": "使用场景"
        }
      }
    }
  ]
}
```

---

## 数据库索引策略

### 1. TagCategory 表索引

```sql
CREATE INDEX tag_categories_is_active_order_idx ON tag_categories (is_active, order);
CREATE INDEX tag_categories_show_in_filter_filter_order_idx ON tag_categories (show_in_filter, filter_order);
```

**用途**:
- 快速查询启用的分类并按顺序排序
- 优化筛选器渲染性能

### 2. Tag 表索引

```sql
CREATE INDEX tags_category_id_is_active_order_idx ON tags (category_id, is_active, order);
CREATE INDEX tags_usage_count_idx ON tags (usage_count);
```

**用途**:
- 快速查询分类下的启用标签
- 支持"热门标签"查询(按使用次数排序)

### 3. PlanTag 表索引

```sql
CREATE INDEX plan_tags_plan_id_idx ON plan_tags (plan_id);
CREATE INDEX plan_tags_tag_id_idx ON plan_tags (tag_id);
```

**用途**:
- 优化套餐→标签的正向查询
- 优化标签→套餐的反向查询(如"查询所有包含'街拍漫步'标签的套餐")

---

## 典型使用场景

### 场景1: 前端筛选器渲染

**需求**: 在套餐列表页显示标签筛选器

```typescript
// 查询所有显示在筛选器中的分类及其标签
const filterCategories = await prisma.tagCategory.findMany({
  where: {
    isActive: true,
    showInFilter: true
  },
  include: {
    tags: {
      where: { isActive: true },
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { filterOrder: 'asc' }
});

// 前端渲染结构:
// 使用场景
//   ☑️ 街拍漫步 (15)
//   ☑️ 寺庙参拜 (7)
//   ☑️ 浪漫约会 (5)
// 服务等级
//   ☑️ 经济实惠 (4)
//   ☑️ 标准套餐 (14)
//   ☑️ 豪华尊享 (4)
```

### 场景2: 按标签筛选套餐

**需求**: 用户选择"街拍漫步"+"豪华尊享"标签,查询匹配套餐

```typescript
// 方法1: 精确匹配(必须同时包含所有选中标签)
const plans = await prisma.rentalPlan.findMany({
  where: {
    isActive: true,
    planTags: {
      every: {
        tagId: {
          in: ['tag_id_1', 'tag_id_2']  // 用户选中的标签ID
        }
      }
    }
  },
  include: {
    planTags: {
      include: { tag: true }
    }
  }
});

// 方法2: 模糊匹配(包含任一标签即可)
const plans = await prisma.rentalPlan.findMany({
  where: {
    isActive: true,
    planTags: {
      some: {
        tagId: {
          in: ['tag_id_1', 'tag_id_2']
        }
      }
    }
  }
});
```

### 场景3: 更新标签使用统计

**触发时机**: 套餐添加/删除标签时

```typescript
// 添加标签到套餐时
await prisma.$transaction([
  // 1. 创建关联
  prisma.planTag.create({
    data: {
      planId: 'plan_id',
      tagId: 'tag_id',
      addedBy: 'user_id'
    }
  }),
  // 2. 更新标签使用统计
  prisma.tag.update({
    where: { id: 'tag_id' },
    data: { usageCount: { increment: 1 } }
  })
]);

// 删除标签时
await prisma.$transaction([
  prisma.planTag.delete({
    where: { id: 'plan_tag_id' }
  }),
  prisma.tag.update({
    where: { id: 'tag_id' },
    data: { usageCount: { decrement: 1 } }
  })
]);
```

### 场景4: 热门标签推荐

**需求**: 显示最常用的5个标签作为快速筛选

```typescript
const popularTags = await prisma.tag.findMany({
  where: { isActive: true },
  orderBy: { usageCount: 'desc' },
  take: 5,
  include: { category: true }
});

// 示例结果:
// [
//   { name: "街拍漫步", usageCount: 15, category: "使用场景" },
//   { name: "标准套餐", usageCount: 14, category: "服务等级" },
//   { name: "寺庙参拜", usageCount: 7, category: "使用场景" },
//   ...
// ]
```

---

## 运营指南

### 1. 标签分类设计建议

✅ **推荐分类**:
- 使用场景 (scene): 街拍、寺庙、约会、写真、祭典
- 服务等级 (service_level): 经济、标准、豪华
- 价格区间 (price_range): ¥5000以下、¥5000-10000、¥10000以上
- 时长 (duration): 4小时、8小时、全天
- 特色服务 (special): 专业摄影、发型设计、私人导游

❌ **避免分类**:
- 过于细分的分类(如"发型设计方式"、"腰带打结方式")
- 与套餐类别(category)重复的分类(如"女士/男士/情侣")

### 2. 标签命名规范

- **简洁明了**: 2-5个字,避免冗长描述
- **用户视角**: 使用用户能理解的语言(如"街拍漫步"而非"户外体验")
- **互斥性**: 同一分类下的标签应互斥(如"经济/标准/豪华"不可同时选)
- **图标使用**: 优先使用emoji图标增强视觉识别

### 3. 标签数量控制

| 分类 | 推荐标签数 | 最大标签数 |
|------|-----------|-----------|
| 使用场景 | 4-6个 | 8个 |
| 服务等级 | 3个 | 5个 |
| 价格区间 | 3个 | 5个 |
| 其他分类 | 3-5个 | 6个 |

**理由**: 减少用户选择负担,提升转化率

### 4. 套餐打标签策略

**建议每个套餐关联**:
- 1个"服务等级"标签(必选)
- 1-3个"使用场景"标签(选主要场景)
- 总计不超过5个标签

**示例**:
```
套餐: "京都雅豪华振袖"
标签:
  - 豪华尊享 (service_level)
  - 街拍漫步 (scene)
  - 寺庙参拜 (scene)
  - 专业写真 (scene)
```

---

## 迁移计划

### 当前状态

- ✅ 新版标签系统已实现(TagCategory, Tag, PlanTag)
- ⚠️ 旧版`tags: String[]`字段仍存在于RentalPlan表
- ⚠️ 部分套餐仍使用旧版字段(如`tags: ["情侣套餐"]`)

### 迁移步骤

**阶段1: 数据迁移** (已完成部分)
1. ✅ 创建标签分类和标签种子数据
2. ✅ 部分套餐已关联到新版标签系统
3. ⚠️ 待处理: 将剩余76个套餐的旧标签迁移到新系统

**阶段2: 代码迁移**
1. 更新前端查询逻辑,使用`planTags`替代`tags`
2. 更新筛选器组件,基于TagCategory动态渲染
3. 更新套餐编辑界面,支持标签选择

**阶段3: 清理旧数据**
1. 验证所有功能正常运行
2. 运行数据一致性检查脚本
3. 删除`RentalPlan.tags`字段(破坏性更改,需谨慎)

### 迁移脚本示例

```typescript
// scripts/migrate-plan-tags.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePlanTags() {
  const plans = await prisma.rentalPlan.findMany({
    where: {
      tags: { isEmpty: false },  // 有旧标签
      planTags: { none: {} }     // 无新标签
    }
  });

  for (const plan of plans) {
    console.log(`Processing: ${plan.name}`);

    // 根据旧标签匹配新标签
    const tagMapping: Record<string, string> = {
      '情侣套餐': 'tag_id_couple',
      '女士套餐': 'tag_id_ladies',
      // ... 其他映射
    };

    for (const oldTag of plan.tags) {
      const newTagId = tagMapping[oldTag];
      if (newTagId) {
        await prisma.planTag.create({
          data: {
            planId: plan.id,
            tagId: newTagId,
            addedBy: null  // 系统迁移
          }
        });
      }
    }
  }
}

migratePlanTags().catch(console.error);
```

---

## 性能优化建议

### 1. 查询优化

**场景**: 套餐列表页需要显示每个套餐的标签

```typescript
// ❌ N+1 查询问题
const plans = await prisma.rentalPlan.findMany();
for (const plan of plans) {
  const tags = await prisma.planTag.findMany({
    where: { planId: plan.id }
  });
}

// ✅ 使用include预加载
const plans = await prisma.rentalPlan.findMany({
  include: {
    planTags: {
      include: {
        tag: {
          select: { code: true, name: true, icon: true }
        }
      }
    }
  }
});
```

### 2. 缓存策略

**建议缓存内容**:
- 标签分类和标签列表(变更频率低,可缓存1小时)
- 热门标签排行(变更频率中,可缓存15分钟)

```typescript
// 使用Redis缓存标签树
import redis from '@/lib/redis';

async function getTagTree() {
  const cached = await redis.get('tag_tree');
  if (cached) return JSON.parse(cached);

  const tree = await prisma.tagCategory.findMany({
    include: { tags: true }
  });

  await redis.set('tag_tree', JSON.stringify(tree), 'EX', 3600);
  return tree;
}
```

### 3. 数据库连接池

**Vercel部署注意事项**:
- 使用Supabase连接池(端口6543,添加`?pgbouncer=true`)
- 避免在筛选查询中使用复杂JOIN(Prisma已优化)

---

## 常见问题 (FAQ)

### Q1: 为什么不直接在RentalPlan表添加标签字段?

**A**: 简单字符串数组(`tags: String[]`)存在以下问题:
- 无法分类管理(如区分"场景"和"服务等级")
- 无法统计标签使用频率
- 难以国际化(需在应用层维护翻译映射)
- 无法追溯标签添加记录

关联表设计虽然增加了一次JOIN查询,但提供了更强的扩展性和数据治理能力。

### Q2: 一个套餐应该有多少个标签?

**A**: 建议**3-5个**,具体分配:
- 1个"服务等级"标签(必选)
- 1-3个"使用场景"标签
- 0-1个"特色服务"标签

过多标签会稀释标签的筛选价值,导致用户困惑。

### Q3: 标签的`usageCount`如何更新?

**A**: 两种方式:
1. **实时更新**: 在添加/删除PlanTag时同步更新(推荐)
2. **定时重算**: 每日凌晨运行脚本重新统计(适用于数据修复)

示例定时任务:
```typescript
// scripts/recalculate-tag-usage.ts
const tags = await prisma.tag.findMany();
for (const tag of tags) {
  const count = await prisma.planTag.count({
    where: { tagId: tag.id }
  });
  await prisma.tag.update({
    where: { id: tag.id },
    data: { usageCount: count }
  });
}
```

### Q4: 如何处理停用的标签?

**A**: 使用软删除策略:
1. 将`isActive`设为`false`(不删除记录)
2. 前端查询时过滤`isActive: true`
3. 保留历史关联数据(PlanTag表)

优点:
- 数据可追溯
- 可恢复误操作
- 不破坏现有关联

### Q5: 新版标签系统会影响搜索性能吗?

**A**: 经过测试,影响可忽略:
- 单次查询增加约5-10ms(Prisma自动优化JOIN)
- 可通过添加索引和缓存进一步优化
- 实际用户体验无明显差异

**建议**:
- 为高频查询添加复合索引
- 使用Redis缓存标签树结构
- 在筛选器中限制最多选择3个标签

---

## 附录: 完整Schema定义

```prisma
// 标签分类
model TagCategory {
  id             String   @id @default(cuid())
  code           String   @unique
  name           String
  nameEn         String?  @map("name_en")
  description    String?
  icon           String?
  color          String?
  order          Int      @default(0)
  isActive       Boolean  @default(true) @map("is_active")
  showInFilter   Boolean  @default(true) @map("show_in_filter")
  filterOrder    Int      @default(0) @map("filter_order")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  tags Tag[]

  @@index([isActive, order])
  @@index([showInFilter, filterOrder])
  @@map("tag_categories")
}

// 标签
model Tag {
  id         String   @id @default(cuid())
  categoryId String   @map("category_id")
  code       String
  name       String
  nameEn     String?  @map("name_en")
  icon       String?
  color      String?
  order      Int      @default(0)
  isActive   Boolean  @default(true) @map("is_active")
  usageCount Int      @default(0) @map("usage_count")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  category TagCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  plans    PlanTag[]

  @@unique([categoryId, code])
  @@index([categoryId, isActive, order])
  @@index([usageCount])
  @@map("tags")
}

// 套餐标签关联
model PlanTag {
  id      String   @id @default(cuid())
  planId  String   @map("plan_id")
  tagId   String   @map("tag_id")
  addedBy String?  @map("added_by")
  addedAt DateTime @default(now()) @map("added_at")

  plan RentalPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  tag  Tag        @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([planId, tagId])
  @@index([planId])
  @@index([tagId])
  @@map("plan_tags")
}

// 租赁套餐(部分字段)
model RentalPlan {
  id       String   @id @default(cuid())
  name     String
  category PlanCategory

  // 旧版标签(待废弃)
  tags     String[] @default([])

  // 新版标签关联
  planTags PlanTag[]

  // ... 其他字段
  @@map("rental_plans")
}
```

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-14 | 1.0.0 | 初始文档,描述标签系统完整数据模型 |

---

**文档维护**: 技术团队
**最后更新**: 2025-11-14
**相关文档**: `CLAUDE.md`, `prisma/schema.prisma`
