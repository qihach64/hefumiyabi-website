# 数据库迁移计划：v10.1 组件系统重构

> **版本**: v10.1
> **日期**: 2024-12
> **状态**: 待执行

---

## 概述

本次迁移将组件系统从"覆盖模式"重构为"实例模式"，主要变更：

1. **MerchantComponentOverride** → **MerchantComponent**（重命名 + 扩展字段）
2. **PlanComponent** 关联从 ServiceComponent 改为 MerchantComponent
3. **ServiceComponent** 清理冗余字段
4. **删除升级系统**（ComponentUpgrade, PlanUpgradeBundle）

---

## 当前表结构

### ServiceComponent（需清理）

```sql
-- 当前字段
id, code, name, name_ja, name_en, description, type, icon,
is_system_component,           -- 待删除
merchant_id,                   -- 待删除
promoted_from_merchant_id,     -- 待删除
promoted_at,                   -- 待删除
tier,                          -- 待删除
tier_label,                    -- 待删除
upgrade_from_id,               -- 待删除
upgrade_cost,                  -- 待删除
is_base_component,             -- 待删除
base_price,
highlights,                    -- 待改名 → default_highlights
images,                        -- 待改名 → default_images
status,                        -- 待删除
requested_by,                  -- 待删除
rejection_reason,              -- 待删除
display_order, is_active, created_at, updated_at
```

### MerchantComponentOverride（需重构）

```sql
-- 当前字段
id, merchant_id, component_id, price, is_enabled, created_at, updated_at

-- 需要添加
images,      -- 商户自定义图片
highlights   -- 商户自定义特色
```

### PlanComponent（需调整关联）

```sql
-- 当前字段
id, plan_id, component_id,    -- component_id 需改为 merchant_component_id
is_included,                  -- 待删除
quantity,                     -- 待删除
hotmap_x, hotmap_y, hotmap_label_position, hotmap_order,
created_at, updated_at
```

### 待删除的表

- `component_upgrades`
- `plan_upgrade_bundles`
- `UpgradeScope` enum

---

## 迁移步骤

### Phase 1: 准备工作（添加新字段，不影响现有功能）

#### Step 1.1: ServiceComponent 添加默认内容字段

```sql
-- 添加新字段（复制现有数据）
ALTER TABLE service_component
ADD COLUMN default_images TEXT[] DEFAULT '{}',
ADD COLUMN default_highlights TEXT[] DEFAULT '{}';

-- 复制现有数据到新字段
UPDATE service_component
SET default_images = images,
    default_highlights = highlights;
```

#### Step 1.2: MerchantComponentOverride 添加自定义内容字段

```sql
-- 添加商户自定义字段
ALTER TABLE merchant_component_overrides
ADD COLUMN images TEXT[] DEFAULT '{}',
ADD COLUMN highlights TEXT[] DEFAULT '{}';
```

#### Step 1.3: PlanComponent 添加新关联字段

```sql
-- 添加新的外键字段（暂时允许 NULL）
ALTER TABLE plan_components
ADD COLUMN merchant_component_id TEXT;

-- 添加索引
CREATE INDEX idx_plan_components_merchant_component_id
ON plan_components(merchant_component_id);
```

---

### Phase 2: 数据迁移

#### Step 2.1: 为所有商户创建 MerchantComponent 实例

```typescript
// scripts/migrate-merchant-components.ts
import prisma from '@/lib/prisma';

async function createMerchantComponentInstances() {
  // 获取所有已审核的商户
  const merchants = await prisma.merchant.findMany({
    where: { status: 'APPROVED' },
    select: { id: true }
  });

  // 获取所有活跃的平台组件
  const templates = await prisma.serviceComponent.findMany({
    where: {
      isActive: true,
      isSystemComponent: true
    },
    select: { id: true }
  });

  console.log(`Creating instances for ${merchants.length} merchants × ${templates.length} templates`);

  // 为每个商户创建组件实例
  for (const merchant of merchants) {
    const existingOverrides = await prisma.merchantComponentOverride.findMany({
      where: { merchantId: merchant.id },
      select: { componentId: true }
    });

    const existingComponentIds = new Set(existingOverrides.map(o => o.componentId));

    // 只创建不存在的实例
    const newInstances = templates
      .filter(t => !existingComponentIds.has(t.id))
      .map(t => ({
        merchantId: merchant.id,
        componentId: t.id,
        images: [],
        highlights: [],
        price: null,
        isEnabled: true,
      }));

    if (newInstances.length > 0) {
      await prisma.merchantComponentOverride.createMany({
        data: newInstances,
        skipDuplicates: true,
      });
      console.log(`Created ${newInstances.length} instances for merchant ${merchant.id}`);
    }
  }

  console.log('Done creating merchant component instances');
}

createMerchantComponentInstances();
```

#### Step 2.2: 迁移 PlanComponent 关联

```typescript
// scripts/migrate-plan-components.ts
import prisma from '@/lib/prisma';

async function migratePlanComponentRelations() {
  // 获取所有套餐及其组件
  const plans = await prisma.rentalPlan.findMany({
    include: {
      planComponents: true,
      merchant: { select: { id: true } }
    }
  });

  console.log(`Migrating ${plans.length} plans`);

  for (const plan of plans) {
    if (!plan.merchantId) {
      console.warn(`Plan ${plan.id} has no merchantId, skipping`);
      continue;
    }

    for (const pc of plan.planComponents) {
      // 查找对应的 MerchantComponent
      const merchantComponent = await prisma.merchantComponentOverride.findUnique({
        where: {
          merchantId_componentId: {
            merchantId: plan.merchantId,
            componentId: pc.componentId
          }
        }
      });

      if (merchantComponent) {
        // 更新 PlanComponent 的关联
        await prisma.$executeRaw`
          UPDATE plan_components
          SET merchant_component_id = ${merchantComponent.id}
          WHERE id = ${pc.id}
        `;
      } else {
        console.warn(`No MerchantComponent found for plan ${plan.id}, component ${pc.componentId}`);
      }
    }
  }

  console.log('Done migrating plan component relations');
}

migratePlanComponentRelations();
```

#### Step 2.3: 验证迁移数据

```typescript
// scripts/verify-migration.ts
import prisma from '@/lib/prisma';

async function verifyMigration() {
  // 检查所有 PlanComponent 是否都有 merchantComponentId
  const missingRelations = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM plan_components
    WHERE merchant_component_id IS NULL
  `;

  console.log('PlanComponents without merchantComponentId:', missingRelations);

  // 检查商户组件实例数量
  const instanceCount = await prisma.merchantComponentOverride.count();
  const merchantCount = await prisma.merchant.count({ where: { status: 'APPROVED' } });
  const templateCount = await prisma.serviceComponent.count({
    where: { isActive: true, isSystemComponent: true }
  });

  console.log(`Expected instances: ${merchantCount} × ${templateCount} = ${merchantCount * templateCount}`);
  console.log(`Actual instances: ${instanceCount}`);

  // 检查数据完整性
  const orphanedPlanComponents = await prisma.$queryRaw`
    SELECT pc.id, pc.plan_id, pc.component_id
    FROM plan_components pc
    LEFT JOIN merchant_component_overrides mco ON pc.merchant_component_id = mco.id
    WHERE pc.merchant_component_id IS NOT NULL AND mco.id IS NULL
  `;

  console.log('Orphaned PlanComponents:', orphanedPlanComponents);
}

verifyMigration();
```

---

### Phase 3: Schema 重构

#### Step 3.1: 重命名表 MerchantComponentOverride → MerchantComponent

```sql
-- 重命名表
ALTER TABLE merchant_component_overrides RENAME TO merchant_components;

-- 重命名字段 component_id → template_id
ALTER TABLE merchant_components RENAME COLUMN component_id TO template_id;

-- 更新唯一约束
ALTER TABLE merchant_components
DROP CONSTRAINT merchant_component_overrides_merchant_id_component_id_key;

ALTER TABLE merchant_components
ADD CONSTRAINT merchant_components_merchant_id_template_id_key
UNIQUE (merchant_id, template_id);

-- 更新索引
DROP INDEX idx_merchant_component_overrides_component_id;
CREATE INDEX idx_merchant_components_template_id ON merchant_components(template_id);
```

#### Step 3.2: 更新 PlanComponent 外键约束

```sql
-- 添加外键约束
ALTER TABLE plan_components
ADD CONSTRAINT fk_plan_components_merchant_component
FOREIGN KEY (merchant_component_id)
REFERENCES merchant_components(id)
ON DELETE CASCADE;

-- 设置 NOT NULL（确保所有数据都已迁移后）
ALTER TABLE plan_components
ALTER COLUMN merchant_component_id SET NOT NULL;

-- 更新唯一约束
ALTER TABLE plan_components
DROP CONSTRAINT plan_components_plan_id_component_id_key;

ALTER TABLE plan_components
ADD CONSTRAINT plan_components_plan_id_merchant_component_id_key
UNIQUE (plan_id, merchant_component_id);
```

---

### Phase 4: 清理冗余

#### Step 4.1: ServiceComponent 删除冗余字段

```sql
-- 删除旧的 images 和 highlights（已迁移到 default_*）
ALTER TABLE service_component DROP COLUMN images;
ALTER TABLE service_component DROP COLUMN highlights;

-- 删除商户组件相关字段
ALTER TABLE service_component DROP COLUMN is_system_component;
ALTER TABLE service_component DROP COLUMN merchant_id;
ALTER TABLE service_component DROP COLUMN promoted_from_merchant_id;
ALTER TABLE service_component DROP COLUMN promoted_at;

-- 删除升级系统相关字段
ALTER TABLE service_component DROP COLUMN tier;
ALTER TABLE service_component DROP COLUMN tier_label;
ALTER TABLE service_component DROP COLUMN upgrade_from_id;
ALTER TABLE service_component DROP COLUMN upgrade_cost;
ALTER TABLE service_component DROP COLUMN is_base_component;

-- 删除审核相关字段
ALTER TABLE service_component DROP COLUMN status;
ALTER TABLE service_component DROP COLUMN requested_by;
ALTER TABLE service_component DROP COLUMN rejection_reason;
```

#### Step 4.2: PlanComponent 删除冗余字段

```sql
-- 删除旧的关联字段
ALTER TABLE plan_components DROP COLUMN component_id;

-- 删除简化的字段
ALTER TABLE plan_components DROP COLUMN is_included;
ALTER TABLE plan_components DROP COLUMN quantity;
```

#### Step 4.3: 删除升级系统表

```sql
-- 删除升级包表
DROP TABLE IF EXISTS plan_upgrade_bundles;

-- 删除升级配置表
DROP TABLE IF EXISTS component_upgrades;

-- 删除枚举类型（如果没有其他表使用）
DROP TYPE IF EXISTS "UpgradeScope";
DROP TYPE IF EXISTS "ComponentStatus";
```

---

### Phase 5: 更新 Prisma Schema

#### Step 5.1: 更新 schema.prisma

```prisma
// ============================================
// 服务组件系统 (v10.1)
// ============================================

model ServiceComponent {
  id              String          @id @default(cuid())
  code            String          @unique

  // ========== 平台定义（商户不能修改）==========
  name            String
  nameJa          String?         @map("name_ja")
  nameEn          String?         @map("name_en")
  description     String?         @db.Text
  type            ComponentType
  icon            String?

  // ========== 默认内容（商户未自定义时使用）==========
  defaultImages     String[]      @default([]) @map("default_images")
  defaultHighlights String[]      @default([]) @map("default_highlights")

  // ========== 建议价（仅 ADDON 类型有意义）==========
  basePrice       Int             @default(0) @map("base_price")

  // ========== 元数据 ==========
  displayOrder    Int             @default(0) @map("display_order")
  isActive        Boolean         @default(true) @map("is_active")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // ========== 关联 ==========
  merchantComponents MerchantComponent[]

  @@map("service_component")
}

model MerchantComponent {
  id              String   @id @default(cuid())

  // ========== 关联 ==========
  merchantId      String   @map("merchant_id")
  merchant        Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  templateId      String   @map("template_id")
  template        ServiceComponent @relation(fields: [templateId], references: [id], onDelete: Cascade)

  // ========== 商户自定义区域 ==========
  images          String[]         @default([])
  highlights      String[]         @default([])

  // ========== 仅 ADDON 类型 ==========
  price           Int?

  // ========== 启用状态 ==========
  isEnabled       Boolean  @default(true) @map("is_enabled")

  // ========== 关联 ==========
  planComponents  PlanComponent[]

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([merchantId, templateId])
  @@index([merchantId])
  @@index([templateId])
  @@map("merchant_components")
}

model PlanComponent {
  id                    String            @id @default(cuid())
  planId                String            @map("plan_id")
  merchantComponentId   String            @map("merchant_component_id")

  plan                  RentalPlan        @relation(fields: [planId], references: [id], onDelete: Cascade)
  merchantComponent     MerchantComponent @relation(fields: [merchantComponentId], references: [id], onDelete: Cascade)

  // ========== 热点图配置（仅 OUTFIT 类型）==========
  hotmapX              Float?             @map("hotmap_x")
  hotmapY              Float?             @map("hotmap_y")
  hotmapLabelPosition  String             @default("right") @map("hotmap_label_position")
  hotmapOrder          Int                @default(0) @map("hotmap_order")

  createdAt            DateTime           @default(now()) @map("created_at")
  updatedAt            DateTime           @updatedAt @map("updated_at")

  @@unique([planId, merchantComponentId])
  @@index([planId])
  @@index([merchantComponentId])
  @@map("plan_components")
}

enum ComponentType {
  OUTFIT
  ADDON
}

// 删除以下内容：
// - ComponentUpgrade model
// - PlanUpgradeBundle model
// - UpgradeScope enum
// - ComponentStatus enum
```

---

## 代码更新清单

### 需要更新的文件

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `prisma/schema.prisma` | 重构 | 更新模型定义 |
| `src/app/api/service-components/route.ts` | 修改 | 移除升级路径返回 |
| `src/app/api/merchant/component-overrides/route.ts` | 重命名 | → `components/route.ts` |
| `src/app/(main)/merchant/components/page.tsx` | 修改 | 适配新模型 |
| `src/app/(main)/merchant/components/ComponentsClient.tsx` | 修改 | 添加图片/特色编辑 |
| `src/components/merchant/PlanComponentEditor.tsx` | 修改 | 移除升级系统，适配新模型 |
| `src/app/api/merchant/plans/[id]/route.ts` | 修改 | 使用 merchantComponentId |

### 需要删除的文件

| 文件 | 说明 |
|------|------|
| 升级系统相关组件 | 如果有单独的升级选择器 |
| 升级路径 API | 如果有单独的升级配置 API |

---

## 回滚计划

如果迁移失败，执行以下步骤回滚：

### Step 1: 恢复 PlanComponent 关联

```sql
-- 恢复旧的 component_id 字段
ALTER TABLE plan_components ADD COLUMN component_id TEXT;

-- 从 MerchantComponent 恢复关联
UPDATE plan_components pc
SET component_id = mc.template_id
FROM merchant_components mc
WHERE pc.merchant_component_id = mc.id;

-- 删除新字段
ALTER TABLE plan_components DROP COLUMN merchant_component_id;
```

### Step 2: 恢复表名

```sql
ALTER TABLE merchant_components RENAME TO merchant_component_overrides;
ALTER TABLE merchant_component_overrides RENAME COLUMN template_id TO component_id;
```

### Step 3: 恢复 ServiceComponent 字段

```sql
-- 从备份恢复删除的字段
-- 或从 default_* 字段恢复
ALTER TABLE service_component ADD COLUMN images TEXT[] DEFAULT '{}';
ALTER TABLE service_component ADD COLUMN highlights TEXT[] DEFAULT '{}';

UPDATE service_component
SET images = default_images,
    highlights = default_highlights;
```

---

## 执行顺序检查清单

- [ ] **备份数据库**
- [ ] Phase 1.1: ServiceComponent 添加 default_* 字段
- [ ] Phase 1.2: MerchantComponentOverride 添加 images/highlights
- [ ] Phase 1.3: PlanComponent 添加 merchant_component_id
- [ ] Phase 2.1: 创建商户组件实例
- [ ] Phase 2.2: 迁移 PlanComponent 关联
- [ ] Phase 2.3: 验证迁移数据
- [ ] **测试应用功能**
- [ ] Phase 3.1: 重命名表
- [ ] Phase 3.2: 更新外键约束
- [ ] **测试应用功能**
- [ ] Phase 4.1: ServiceComponent 删除冗余字段
- [ ] Phase 4.2: PlanComponent 删除冗余字段
- [ ] Phase 4.3: 删除升级系统表
- [ ] Phase 5: 更新 Prisma Schema
- [ ] **全面测试**
- [ ] 部署到生产环境

---

## 注意事项

1. **备份优先**：每个 Phase 之前都要备份数据库
2. **分步执行**：不要跳过验证步骤
3. **测试环境先行**：先在测试环境完成全部迁移
4. **监控错误**：迁移脚本要有详细的日志输出
5. **业务低峰期执行**：选择用户访问量低的时间段

---

## 预估影响

| 指标 | 预估值 |
|------|--------|
| 迁移时间 | 10-30 分钟（取决于数据量）|
| 停机时间 | 0（可在线迁移）|
| 数据变更量 | 中等（新建实例 + 关联更新）|
| 代码变更量 | 中等（10-15 个文件）|
