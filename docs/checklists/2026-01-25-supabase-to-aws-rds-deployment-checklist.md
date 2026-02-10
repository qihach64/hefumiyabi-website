# 部署验证清单: Supabase -> AWS RDS 数据库迁移

> 生成时间: 2026-01-25
> 预计停机: 15-30 分钟
> 风险等级: 高 (生产数据库迁移)

---

## 数据不变量 (Data Invariants)

迁移前后必须保持一致的关键数据:

| 不变量 | 验证方法 | 容差 |
|--------|---------|------|
| 所有表行数完全一致 | Row count 对比 | 0 差异 |
| 外键关系完整 | 孤儿记录检查 | 0 孤儿 |
| 套餐价格数据正确 | 价格字段非负数 | 0 异常 |
| 用户认证数据完整 | users + sessions 对比 | 0 差异 |
| 预约数据完整 | bookings 状态分布 | 一致 |
| 主题配置正确 | themes 活跃数量 | 一致 |

---

## Pre-Deploy: 基线数据收集 (必须保存)

### 1.1 全表行数基线

在 **Supabase** 执行，保存输出:

```sql
-- === 核心业务表行数 ===
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'rental_plans', COUNT(*) FROM rental_plans
UNION ALL SELECT 'themes', COUNT(*) FROM themes
UNION ALL SELECT 'stores', COUNT(*) FROM stores
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'booking_items', COUNT(*) FROM booking_items
UNION ALL SELECT 'plan_stores', COUNT(*) FROM plan_stores
UNION ALL SELECT 'plan_tags', COUNT(*) FROM plan_tags
UNION ALL SELECT 'plan_components', COUNT(*) FROM plan_components
UNION ALL SELECT 'plan_upgrades', COUNT(*) FROM plan_upgrades
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'tag_categories', COUNT(*) FROM tag_categories
UNION ALL SELECT 'merchants', COUNT(*) FROM merchants
UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL SELECT 'carts', COUNT(*) FROM carts
UNION ALL SELECT 'cart_items', COUNT(*) FROM cart_items
UNION ALL SELECT 'service_components', COUNT(*) FROM service_components
UNION ALL SELECT 'merchant_components', COUNT(*) FROM merchant_components
UNION ALL SELECT 'map_templates', COUNT(*) FROM map_templates
UNION ALL SELECT 'map_hotspots', COUNT(*) FROM map_hotspots
ORDER BY table_name;
```

**保存位置:** `./migration_baseline_$(date +%Y%m%d_%H%M%S).txt`

### 1.2 外键完整性基线

```sql
-- === 孤儿记录检查 (预期全部为 0) ===

-- plan_stores -> rental_plans
SELECT 'plan_stores->rental_plans' as fk_check,
       COUNT(*) as orphan_count
FROM plan_stores ps
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = ps.plan_id);

-- plan_stores -> stores
SELECT 'plan_stores->stores' as fk_check,
       COUNT(*) as orphan_count
FROM plan_stores ps
WHERE NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = ps.store_id);

-- plan_components -> rental_plans
SELECT 'plan_components->rental_plans' as fk_check,
       COUNT(*) as orphan_count
FROM plan_components pc
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = pc.plan_id);

-- plan_components -> merchant_components
SELECT 'plan_components->merchant_components' as fk_check,
       COUNT(*) as orphan_count
FROM plan_components pc
WHERE NOT EXISTS (SELECT 1 FROM merchant_components mc WHERE mc.id = pc.merchant_component_id);

-- plan_tags -> rental_plans
SELECT 'plan_tags->rental_plans' as fk_check,
       COUNT(*) as orphan_count
FROM plan_tags pt
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = pt.plan_id);

-- plan_tags -> tags
SELECT 'plan_tags->tags' as fk_check,
       COUNT(*) as orphan_count
FROM plan_tags pt
WHERE NOT EXISTS (SELECT 1 FROM tags t WHERE t.id = pt.tag_id);

-- booking_items -> bookings
SELECT 'booking_items->bookings' as fk_check,
       COUNT(*) as orphan_count
FROM booking_items bi
WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.id = bi.booking_id);

-- cart_items -> carts
SELECT 'cart_items->carts' as fk_check,
       COUNT(*) as orphan_count
FROM cart_items ci
WHERE NOT EXISTS (SELECT 1 FROM carts c WHERE c.id = ci.cart_id);

-- rental_plans -> themes
SELECT 'rental_plans->themes' as fk_check,
       COUNT(*) as orphan_count
FROM rental_plans rp
WHERE rp.theme_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM themes t WHERE t.id = rp.theme_id);
```

**预期结果:** 所有 orphan_count = 0

### 1.3 业务状态基线

```sql
-- === 套餐状态分布 ===
SELECT status, COUNT(*) as count
FROM rental_plans
GROUP BY status
ORDER BY status;

-- === 预约状态分布 ===
SELECT status, COUNT(*) as count
FROM bookings
GROUP BY status
ORDER BY status;

-- === 活跃主题列表 ===
SELECT id, slug, name, "displayOrder"
FROM themes
WHERE "isActive" = true
ORDER BY "displayOrder";

-- === 活跃店铺列表 ===
SELECT id, slug, name, city
FROM stores
WHERE "isActive" = true
ORDER BY name;

-- === 价格数据完整性 ===
SELECT
  COUNT(*) as total_plans,
  COUNT(*) FILTER (WHERE price < 0) as negative_price,
  COUNT(*) FILTER (WHERE price IS NULL) as null_price,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price)::int as avg_price
FROM rental_plans;
```

### 1.4 特色套餐快照 (用于功能验证)

```sql
-- 保存前 5 个特色套餐的详细信息
SELECT
  rp.id,
  rp.slug,
  rp.name,
  rp.price,
  t.name as theme_name,
  (SELECT COUNT(*) FROM plan_components pc WHERE pc.plan_id = rp.id) as component_count,
  (SELECT COUNT(*) FROM plan_stores ps WHERE ps.plan_id = rp.id) as store_count
FROM rental_plans rp
LEFT JOIN themes t ON t.id = rp.theme_id
WHERE rp."isFeatured" = true AND rp."isActive" = true
ORDER BY rp."displayOrder"
LIMIT 5;
```

---

## Pre-Deploy 检查清单

### 必须完成:

- [ ] **1.1** 执行并保存全表行数基线
- [ ] **1.2** 执行外键完整性检查，确认全部为 0
- [ ] **1.3** 执行并保存业务状态基线
- [ ] **1.4** 保存特色套餐快照
- [ ] **1.5** RDS 实例状态为 "Available"
- [ ] **1.6** 本地已测试 RDS 连接 (`psql` 可连接)
- [ ] **1.7** 安全组已配置 (0.0.0.0/0 或 Vercel IP 段)
- [ ] **1.8** SSL 连接已启用 (`sslmode=require`)
- [ ] **1.9** Supabase 数据库备份已创建
- [ ] **1.10** 回滚方案已确认 (Supabase 保留至少 7 天)
- [ ] **1.11** 维护公告已发布 (提前 24 小时)

### 可选但推荐:

- [ ] 本地环境已切换到 RDS 并验证功能正常
- [ ] 性能基线测试完成 (查询延迟 < 50ms)
- [ ] 团队成员已通知

---

## Deploy 步骤

### Phase 1: 数据导出 (Supabase)

```bash
# 步骤 1.1: 导出数据
SUPABASE_URL="postgresql://postgres.epxyusnhvqfhfbaqgsli:<password>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

pg_dump "$SUPABASE_URL" \
  --no-owner \
  --no-acl \
  --format=custom \
  --verbose \
  --file=supabase_backup_$(date +%Y%m%d_%H%M%S).dump

# 验证导出文件
ls -la supabase_backup_*.dump
```

**停顿点:** 确认导出文件大小合理 (> 0 bytes)

- [ ] 导出文件已创建
- [ ] 文件大小: _______ MB

### Phase 2: 数据导入 (AWS RDS)

```bash
# 步骤 2.1: 获取 RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier kimono-one-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"

# 步骤 2.2: 导入数据
pg_restore \
  --host=$RDS_ENDPOINT \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --no-owner \
  --no-acl \
  --verbose \
  supabase_backup_*.dump

# 记录结束时间
echo "导入完成时间: $(date)"
```

**停顿点:** 检查 pg_restore 输出

- [ ] pg_restore 无严重错误 (warnings 可接受)
- [ ] 导入耗时: _______ 分钟

### Phase 3: 数据验证 (关键!)

在 **AWS RDS** 执行:

```sql
-- === 3.1 全表行数验证 ===
-- 与 Pre-Deploy 1.1 的基线对比

SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'rental_plans', COUNT(*) FROM rental_plans
UNION ALL SELECT 'themes', COUNT(*) FROM themes
UNION ALL SELECT 'stores', COUNT(*) FROM stores
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'booking_items', COUNT(*) FROM booking_items
UNION ALL SELECT 'plan_stores', COUNT(*) FROM plan_stores
UNION ALL SELECT 'plan_tags', COUNT(*) FROM plan_tags
UNION ALL SELECT 'plan_components', COUNT(*) FROM plan_components
UNION ALL SELECT 'plan_upgrades', COUNT(*) FROM plan_upgrades
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'tag_categories', COUNT(*) FROM tag_categories
UNION ALL SELECT 'merchants', COUNT(*) FROM merchants
ORDER BY table_name;
```

**比对检查:**

| 表名 | Supabase 基线 | RDS 导入后 | 差异 |
|------|--------------|-----------|------|
| users | | | |
| rental_plans | | | |
| themes | | | |
| stores | | | |
| bookings | | | |
| booking_items | | | |
| plan_stores | | | |
| plan_tags | | | |
| plan_components | | | |
| ... | | | |

**Go/No-Go 判定:**
- [ ] 所有表行数差异 = 0 --> **GO**
- [ ] 任何表行数差异 != 0 --> **NO-GO, 触发回滚**

### Phase 4: 外键验证

```sql
-- 与 Pre-Deploy 1.2 相同的查询
-- 预期: 所有 orphan_count = 0

SELECT 'plan_stores->rental_plans' as fk_check,
       COUNT(*) as orphan_count
FROM plan_stores ps
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = ps.plan_id);

-- ... (其他外键检查同上)
```

**Go/No-Go 判定:**
- [ ] 所有孤儿记录 = 0 --> **GO**
- [ ] 任何孤儿记录 != 0 --> **NO-GO, 调查原因**

### Phase 5: 更新 Vercel 环境变量

```bash
# 步骤 5.1: 更新 DATABASE_URL
# 在 Vercel Dashboard -> Project -> Settings -> Environment Variables

# 新值:
DATABASE_URL="postgresql://postgres:<password>@<rds-endpoint>.ap-northeast-1.rds.amazonaws.com:5432/postgres?sslmode=require&connection_limit=10"

# 步骤 5.2: 触发重新部署
# Vercel Dashboard -> Deployments -> Redeploy
```

- [ ] DATABASE_URL 已更新
- [ ] 重新部署已触发
- [ ] 部署状态: Building / Ready / Error

### Phase 6: 生产验证

部署完成后 **立即** 执行:

```bash
# 6.1 健康检查
curl -s https://kimono-one.vercel.app/api/health | jq .

# 预期:
# {
#   "status": "ok",
#   "database": "connected",
#   "timestamp": "..."
# }

# 6.2 首页加载测试
curl -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" \
  -o /dev/null -s https://kimono-one.vercel.app/

# 预期: Total < 3s

# 6.3 API 响应测试
curl -s "https://kimono-one.vercel.app/api/trpc/plan.featured" | jq '.result.data | length'

# 预期: 返回特色套餐数量
```

**浏览器验证 (5 分钟内):**

| 页面 | URL | 验证内容 | 状态 |
|------|-----|---------|------|
| 首页 | `/` | 特色套餐显示 | [ ] |
| 套餐列表 | `/plans` | 列表加载正常 | [ ] |
| 套餐详情 | `/plans/[第一个特色套餐slug]` | 热点图显示 | [ ] |
| 主题筛选 | `/plans?theme=trendy-photo` | 筛选生效 | [ ] |
| 地区筛选 | `/plans?location=京都` | 筛选生效 | [ ] |

---

## Post-Deploy 监控 (部署后 24 小时)

### 立即 (0-5 分钟)

- [ ] 健康检查 API 返回 200
- [ ] 首页加载 < 3s
- [ ] 无 500 错误
- [ ] Console 无数据库连接错误

### 短期 (1 小时)

```bash
# 检查 Vercel 日志
vercel logs --since 1h | grep -i "error\|timeout\|connection"

# 应无以下关键词:
# - "Connection refused"
# - "Connection timed out"
# - "Too many connections"
# - "FATAL"
```

- [ ] Vercel 日志无数据库错误
- [ ] 用户反馈通道已监控 (如有)

### 中期 (4 小时)

```sql
-- 在 RDS 检查连接数
SELECT
  state,
  COUNT(*) as count,
  MAX(query_start) as latest_query
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state;

-- 预期: active 连接 < 50, idle 连接 < 30
```

- [ ] 连接池使用正常 (无耗尽迹象)
- [ ] 查询性能稳定

### 长期 (24 小时)

- [ ] 无用户报告异常
- [ ] 错误率 < 1%
- [ ] P95 延迟 < 500ms
- [ ] CloudWatch 告警无触发 (如已配置)

---

## 回滚方案

### 触发条件 (任一满足即回滚)

| 条件 | 阈值 | 监控方式 |
|------|------|---------|
| 错误率 | > 5% 持续 5 分钟 | Vercel Analytics |
| API 响应时间 | P95 > 2s 持续 10 分钟 | 手动测试 |
| 数据库连接 | 连续失败 > 3 次 | 健康检查 |
| 数据不一致 | 任何发现 | 验证查询 |

### 回滚步骤

```bash
# 步骤 R1: 恢复 Vercel 环境变量
# Vercel Dashboard -> Project -> Settings -> Environment Variables
# 将 DATABASE_URL 改回 Supabase:

DATABASE_URL="postgresql://postgres.epxyusnhvqfhfbaqgsli:<password>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# 步骤 R2: 触发重新部署
# Vercel Dashboard -> Deployments -> Redeploy

# 步骤 R3: 验证回滚成功
curl -s https://kimono-one.vercel.app/api/health | jq .
```

### 回滚后验证

- [ ] 健康检查返回 200
- [ ] 首页加载正常
- [ ] 数据显示正确

### 回滚后分析

- [ ] 记录失败原因
- [ ] 保存相关日志
- [ ] 创建事后分析文档

---

## 紧急联系

| 角色 | 联系方式 | 职责 |
|------|---------|------|
| 技术负责人 | (填写) | 最终决策 |
| DBA | (填写) | 数据库问题 |
| 运维 | (填写) | 部署问题 |

---

## 附录: 有用的命令

### 连接测试

```bash
# 测试 RDS 连接延迟
psql "postgresql://postgres:<password>@<endpoint>:5432/postgres?sslmode=require" \
  -c "SELECT 1" \
  -c "\timing"

# Prisma 连接测试
npx prisma db execute --stdin <<< "SELECT 1"
```

### 日志查看

```bash
# Vercel 实时日志
vercel logs -f

# AWS RDS 日志 (需要 CloudWatch)
aws logs tail /aws/rds/instance/kimono-one-db/postgresql --follow
```

### 性能测试

```bash
# 简单负载测试
for i in {1..10}; do
  curl -s -o /dev/null -w "%{time_total}\n" https://kimono-one.vercel.app/api/trpc/plan.featured
done
```

---

## 签字确认

| 阶段 | 执行人 | 时间 | 签字 |
|------|-------|------|------|
| Pre-Deploy 检查完成 | | | |
| 数据迁移完成 | | | |
| 数据验证通过 | | | |
| 生产部署完成 | | | |
| Post-Deploy 验证 | | | |
| 24 小时监控结束 | | | |

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-01-25 | 1.0 | 初始版本 | Claude |
