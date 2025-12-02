# 数据库清理 TODO

> 此文档记录需要日后清理的数据库冗余和过期数据

---

## 1. 标签系统重构

**问题描述**：当前存在三套标签机制，数据冗余且不一致

| 机制 | 位置 | 状态 |
|------|------|------|
| TagCategory + Tag + PlanTag | 独立表 | 新系统，保留 |
| RentalPlan.tags[] | String[] 字段 | 旧字段，待删除 |
| CampaignPlan.tags[] | String[] 字段 | Legacy，待删除 |

**清理步骤**：

### 1.1 重新设计 TagCategory

当前分类：
- `scene` 使用场景
- `service_level` 服务等级

建议新分类（按重构文档）：
```
service_included (包含服务) - 平台自动标签
  - hairstyle: 含发型
  - makeup: 含化妆
  - accessories: 含配件套装
  - photography: 含摄影
  - all_inclusive: 一价全包

target_audience (适用人群) - 平台自动标签
  - couple: 情侣
  - family: 家庭
  - friends: 闺蜜
  - student: 学生专享
  - group: 团体
  - men: 男士专享
  - children: 儿童专属

season (季节限定) - 平台自动标签
  - summer: 夏季限定
  - spring: 春季限定
  - autumn: 秋季限定
  - winter: 冬季限定

occasion (场合) - 平台自动标签
  - formal: 正式场合
  - graduation: 毕业季
  - coming_of_age: 成人式

style (风格) - 商家可选标签
  - trendy: 出片神器
  - elegant: 华丽精致
  - retro: 复古经典
  - modern: 时尚新潮
```

### 1.2 迁移 RentalPlan.tags[] 数据

```sql
-- 查看当前 RentalPlan.tags[] 使用的标签值
SELECT DISTINCT unnest(tags) as tag_value, COUNT(*)
FROM rental_plans
WHERE tags != '{}'
GROUP BY tag_value;
```

需要将这些字符串标签映射到新的 Tag 表，创建 PlanTag 关联。

### 1.3 删除旧字段

Schema 变更：
```prisma
model RentalPlan {
  // 删除此行
  // tags String[] @default([])
}

model CampaignPlan {
  // 删除此行
  // tags String[] @default([])
}
```

### 1.4 修复 usageCount 不准确

当前问题：Tag.usageCount 与实际 PlanTag 关联数不匹配

```sql
-- 修复 usageCount
UPDATE tags SET usage_count = (
  SELECT COUNT(*) FROM plan_tags WHERE plan_tags.tag_id = tags.id
);
```

---

## 2. Legacy CampaignPlan 清理

**问题描述**：CampaignPlan 模型已被 RentalPlan (isCampaign=true) 替代，但仍有 8 条历史数据

**当前数据**：
- 8 个 CampaignPlan 记录
- 都属于 "10周年优惠活动"

**清理步骤**：

### 2.1 确认数据已迁移

检查这 8 个 CampaignPlan 是否都有对应的 RentalPlan：
```sql
SELECT cp.name, rp.name
FROM campaign_plans cp
LEFT JOIN rental_plans rp ON rp.slug LIKE 'campaign-%'
  AND rp.name = cp.name;
```

### 2.2 检查 BookingItem/CartItem 引用

```sql
-- 检查是否有订单引用 campaignPlanId
SELECT COUNT(*) FROM booking_items WHERE campaign_plan_id IS NOT NULL;
SELECT COUNT(*) FROM cart_items WHERE campaign_plan_id IS NOT NULL;
```

### 2.3 删除 CampaignPlan 表（如果安全）

如果没有订单引用，可以：
1. 删除 CampaignPlan 数据
2. 从 schema 中移除 CampaignPlan 模型
3. 移除 BookingItem.campaignPlanId 和 CartItem.campaignPlanId 字段

---

## 3. 旧套餐处理

**问题描述**：新套餐导入后，76 个旧套餐需要处理

**处理策略**：

### 3.1 有订单关联的套餐（约 20 个）

```sql
-- 查看有订单的套餐
SELECT rp.slug, rp.name, COUNT(bi.id) as booking_count
FROM rental_plans rp
LEFT JOIN booking_items bi ON bi.plan_id = rp.id
GROUP BY rp.id
HAVING COUNT(bi.id) > 0;
```

这些套餐：
- 保留 `isActive = false`（不再销售）
- 保留数据完整性（历史订单可查看）

### 3.2 无订单关联的套餐

可以选择：
- 软删除：`isActive = false`
- 硬删除：直接删除记录

### 3.3 重复/冗余套餐

当前存在多个重复命名的套餐（如 "男士和服" 出现 4 次），需要合并或清理。

---

## 执行记录

| 日期 | 操作 | 执行人 |
|------|------|--------|
| - | - | - |

