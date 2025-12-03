# 套餐重构脚本

基于CSV文件的套餐和标签体系重构工具。

## 📁 文件说明

- `theme-mapping.ts` - CSV主题与现有Theme的映射配置
- `tag-definitions.ts` - 完整的标签体系定义(9分类57标签)
- `backup-existing.ts` - 备份现有数据
- `import-tags.ts` - 导入新标签体系
- `import-plans.ts` - 导入新套餐数据
- `verify-data.ts` - 验证数据完整性

## 🚀 执行步骤

### 1. 备份现有数据 (必须!)

```bash
pnpm tsx scripts/refactor-plans/backup-existing.ts
```

这会在 `backups/` 目录下创建:
- `plans-backup-2025-12-03.json`
- `tags-backup-2025-12-03.json`
- `tag-categories-backup-2025-12-03.json`
- `themes-backup-2025-12-03.json`
- `backup-summary-2025-12-03.json`

### 2. 导入标签体系

```bash
pnpm tsx scripts/refactor-plans/import-tags.ts
```

这会:
- 创建9个标签分类(人群、场景、风格等)
- 创建57个标签
- 保留现有标签(使用upsert)

### 3. 导入新套餐

```bash
pnpm tsx scripts/refactor-plans/import-plans.ts
```

这会:
- 禁用现有93个套餐(isActive=false,保留数据)
- 导入21个新套餐
- 自动关联标签
- 关联到现有Theme

### 4. 验证数据

```bash
pnpm tsx scripts/refactor-plans/verify-data.ts
```

检查:
- 所有套餐都有标签
- 所有套餐都关联主题
- 标签使用统计
- 数据完整性

## 📊 CSV文件位置

脚本期望CSV文件在:
```
~/Downloads/Miyabi套餐方案_重构版.xlsx - 标签体系.csv
~/Downloads/Miyabi套餐方案_重构版.xlsx - 套餐实例清单.csv
```

## 🔄 回滚方案

如果需要回滚:

1. 恢复套餐活跃状态:
```sql
UPDATE rental_plans SET "isActive" = true WHERE "isActive" = false;
```

2. 删除新导入的套餐:
```sql
DELETE FROM rental_plans WHERE "createdAt" > '2025-12-03 00:00:00';
```

3. 或使用备份文件手动恢复

## ⚠️ 注意事项

1. **执行前必须备份** - 第一步永远是运行 `backup-existing.ts`
2. **保留历史数据** - 旧套餐只是标记为 `isActive=false`,不会删除
3. **Booking关联** - 现有预订的关联完全保留,不受影响
4. **Theme复用** - 使用现有的6个主题,不创建新主题
5. **标签自动化** - 部分标签支持自动打标(如"含发型"根据includes判断)

## 🎯 映射关系

### 主题映射
| CSV主题 | 现有Theme | Theme ID |
|---------|----------|----------|
| SOL-01 出片神器 | 潮流出片 | cmioftqib0000yc2hhb2joxda |
| SOL-02 正式礼遇 | 盛大礼遇 | cmioftr7k0001yc2h0jr28c8a |
| SOL-03 双人优享 | 亲友同行 | cmioftrws0002yc2hpcyvu8m8 |
| SOL-04 季节限定 | 季节限定 | cmioftslr0003yc2h1s0nxpgg |
| SOL-05 超值入门 | 轻装漫步 | cmiofttat0004yc2h4jv7m8r3 |
| 特殊套餐 | 特色套餐 | cmioftu040005yc2hu2h4jjxz |

### 标签示例

**人群标签** (自动):
- `#单人` → `solo`
- `#情侣` → `couple`
- `#家庭` → `family`

**服务标签** (自动):
- `#含发型` → `hair-styling`
- `#含化妆` → `makeup`
- `#全场任选` → `unlimited-selection`

**风格标签** (手动):
- `#出片神器` → `photo-ready`
- `#时尚新潮` → `trendy-modern`

## 📈 预期结果

**导入前**:
- 93个套餐(多数冗余/重复)
- 7个标签(严重不足)
- 83%套餐无标签

**导入后**:
- 21个活跃套餐(精选核心方案)
- 57个标签(覆盖9个维度)
- 100%套餐有标签
- 93个历史套餐(保留但禁用)
