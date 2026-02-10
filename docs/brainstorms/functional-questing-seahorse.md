# 数据库迁移计划：Supabase → AWS RDS

## 背景

**问题诊断结果：**
- Supabase PgBouncer (6543)：630-960ms/查询
- 直连端口 (5432)：130ms/查询
- 差距：5 倍延迟，导致页面加载 4-6 秒

**决策：** 迁移到 AWS RDS，彻底解决延迟问题

---

## 迁移配置

| 配置项 | 值 |
|--------|-----|
| AWS 区域 | ap-northeast-1 (东京) |
| 实例类型 | db.t3.medium (2 vCPU, 4GB RAM) |
| 存储 | gp3, 20GB (可扩展) |
| PostgreSQL 版本 | 16.x |
| 预估月成本 | ~$60 |

---

## 实施步骤

### Phase 1: 创建 AWS RDS 实例

**1.1 通过 AWS CLI 创建 RDS**

```bash
# 创建 DB 子网组（如果没有）
aws rds create-db-subnet-group \
  --db-subnet-group-name kimono-one-db-subnet \
  --db-subnet-group-description "Kimono One DB Subnet" \
  --subnet-ids subnet-xxx subnet-yyy \
  --region ap-northeast-1

# 创建安全组（允许 PostgreSQL 端口）
aws ec2 create-security-group \
  --group-name kimono-one-db-sg \
  --description "Security group for Kimono One RDS" \
  --vpc-id vpc-xxx \
  --region ap-northeast-1

# 添加入站规则（允许所有 IP 访问 5432，生产环境应限制）
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region ap-northeast-1

# 创建 RDS 实例
aws rds create-db-instance \
  --db-instance-identifier kimono-one-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.4 \
  --master-username postgres \
  --master-user-password <生成安全密码> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name kimono-one-db-subnet \
  --publicly-accessible \
  --backup-retention-period 7 \
  --region ap-northeast-1
```

**1.2 或通过 AWS Console 创建（更简单）**

1. 打开 [RDS Console](https://ap-northeast-1.console.aws.amazon.com/rds/)
2. 点击 "Create database"
3. 选择 "Standard create" → PostgreSQL
4. 配置：
   - Templates: Free tier / Production
   - DB instance identifier: `kimono-one-db`
   - Master username: `postgres`
   - Master password: 生成强密码
   - Instance: db.t3.medium
   - Storage: gp3, 20GB
   - Public access: Yes（或配置 VPC）
5. 等待实例创建完成（约 5-10 分钟）

---

### Phase 2: 数据迁移

**2.1 从 Supabase 导出数据**

```bash
# 使用 pg_dump 导出（Supabase 直连端口）
pg_dump "postgresql://postgres.epxyusnhvqfhfbaqgsli:<password>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=supabase_backup.dump
```

**2.2 导入到 AWS RDS**

```bash
# 获取 RDS endpoint（创建完成后）
aws rds describe-db-instances \
  --db-instance-identifier kimono-one-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# 导入数据
pg_restore \
  --host=<rds-endpoint>.ap-northeast-1.rds.amazonaws.com \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --no-owner \
  --no-acl \
  supabase_backup.dump
```

**2.3 验证数据完整性**

```bash
# 连接 RDS 检查
psql "postgresql://postgres:<password>@<rds-endpoint>:5432/postgres" \
  -c "SELECT count(*) FROM rental_plans;"
```

---

### Phase 3: 应用配置更新

**3.1 更新环境变量**

**文件:** `.env.local`

```bash
# 旧配置（Supabase）
# DATABASE_URL="postgresql://postgres.xxx@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 新配置（AWS RDS）
DATABASE_URL="postgresql://postgres:<password>@<rds-endpoint>.ap-northeast-1.rds.amazonaws.com:5432/postgres?sslmode=require"
```

**3.2 更新 Prisma Schema（移除 directUrl）**

**文件:** `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // directUrl 不再需要，AWS RDS 直连即可
}
```

**3.3 重新生成 Prisma Client**

```bash
pnpm prisma generate
```

---

### Phase 4: 数据迁移验证

**4.1 迁移前：记录源数据库状态**

```bash
# 生成所有表的 count 基线
psql "postgresql://postgres.xxx@xxx.pooler.supabase.com:5432/postgres" -c "
SELECT
  table_name,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT
    table_name,
    query_to_xml(format('SELECT count(*) as cnt FROM %I', table_name), false, true, '') as xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) t
ORDER BY row_count DESC;
" > supabase_counts.txt
```

**4.2 迁移后：全表 count 对比**

```bash
# 在 AWS RDS 执行同样的查询
psql "postgresql://postgres:<password>@<rds-endpoint>:5432/postgres" -c "
SELECT
  table_name,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT
    table_name,
    query_to_xml(format('SELECT count(*) as cnt FROM %I', table_name), false, true, '') as xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) t
ORDER BY row_count DESC;
" > rds_counts.txt

# 对比两个文件
diff supabase_counts.txt rds_counts.txt
```

**4.3 外键完整性检查**

```sql
-- 检查孤儿记录（plan_stores 引用了不存在的 plan）
SELECT COUNT(*) as orphan_plan_stores FROM plan_stores ps
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = ps.plan_id);

-- 检查孤儿记录（plan_components）
SELECT COUNT(*) as orphan_plan_components FROM plan_components pc
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = pc.plan_id);

-- 检查孤儿记录（merchant_components）
SELECT COUNT(*) as orphan_merchant_components FROM merchant_components mc
WHERE NOT EXISTS (SELECT 1 FROM merchants m WHERE m.id = mc.merchant_id);

-- 检查孤儿记录（plan_tags）
SELECT COUNT(*) as orphan_plan_tags FROM plan_tags pt
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = pt.plan_id);
```

**预期结果：** 所有孤儿记录数应为 0

**4.4 核心业务数据抽样校验**

```sql
-- 套餐数据抽样（在新旧数据库执行，对比结果）
SELECT id, name, price, "themeId", "merchantId", status
FROM rental_plans
ORDER BY "createdAt" DESC
LIMIT 10;

-- 主题数据完整性
SELECT id, slug, name, "isActive"
FROM themes
ORDER BY "displayOrder";

-- 店铺数据完整性
SELECT id, slug, name, city, "isActive"
FROM stores
ORDER BY name;
```

**4.5 功能验证清单**

| 功能 | 测试方法 | 预期结果 |
|------|---------|---------|
| 首页加载 | 访问 `/` | 特色套餐正常显示 |
| 套餐详情 | 访问 `/plans/[id]` | 热点图正常渲染 |
| 主题筛选 | 选择一个主题 | 套餐列表正确过滤 |
| 地区筛选 | 选择一个地区 | 套餐列表正确过滤 |
| 购物车 | 添加套餐 | 数据正确存储 |
| 预约流程 | 完成预约 | 记录正确写入 |

---

### Phase 5: 性能验证

**5.1 测试数据库连接延迟**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  await prisma.\$queryRaw\`SELECT 1\`; // 预热

  for (let i = 1; i <= 5; i++) {
    const start = performance.now();
    await prisma.\$queryRaw\`SELECT 1\`;
    console.log(\`查询 #\${i}: \${(performance.now() - start).toFixed(1)}ms\`);
  }

  await prisma.\$disconnect();
}
test();
"
```

**预期结果：** 每次查询 < 50ms（相比 Supabase PgBouncer 的 630-960ms）

**5.2 测试页面加载性能**

```bash
pnpm dev
# 访问 /plans/[id] 页面
# 预期日志：
# [planService.getDetailById] ⏱️ Total: < 1000ms
# [PlanDetailPage] ⏱️ Total: < 1500ms
```

---

### Phase 6: 生产部署（可选）

如果使用 Vercel 部署：

1. 在 Vercel 项目设置中更新 `DATABASE_URL` 环境变量
2. 确保 RDS 安全组允许 Vercel IP 范围（或使用 VPC）
3. 重新部署

---

## 文件变更列表

| 文件 | 改动 |
|------|------|
| `.env.local` | 更新 DATABASE_URL 为 AWS RDS |
| `prisma/schema.prisma` | 移除 directUrl（可选） |

---

## 预期效果

| 指标 | Supabase (当前) | AWS RDS (预期) |
|------|-----------------|----------------|
| 单次查询延迟 | 630-960ms | < 50ms |
| getDetailById | 4-5秒 | < 500ms |
| 页面加载 | 6-8秒 | < 1.5秒 |

---

## 回滚方案

如果 AWS RDS 出现问题：
1. 将 `.env.local` 中的 `DATABASE_URL` 改回 Supabase
2. 运行 `pnpm prisma generate`
3. 重启开发服务器

---

## 成本估算

| 项目 | 月成本 |
|------|--------|
| RDS db.t3.medium | ~$50 |
| 存储 20GB gp3 | ~$3 |
| 数据传输 | ~$5 |
| **总计** | **~$58/月** |

（对比 Supabase Pro: $25/月，但 PgBouncer 延迟问题）

---

## 注意事项

### 安全相关
1. **密码安全**：使用强密码，不要提交到 Git
2. **安全组**：生产环境应限制 IP 范围，推荐使用 Vercel IP 白名单
3. **SSL**：确保使用 `sslmode=require`，考虑验证 AWS RDS CA 证书

### 运维相关
4. **备份**：RDS 自动备份已启用（7 天保留）
5. **监控**：启用 CloudWatch 监控数据库性能
6. **连接池**：db.t3.medium 默认 max_connections ≈ 85，Vercel serverless 可能耗尽连接，考虑 RDS Proxy

### 迁移验证相关
7. **全表校验**：迁移后对比所有表的 row count，确保数据完整
8. **外键完整性**：运行外键完整性检查 SQL，确保无孤儿记录
9. **功能回归**：完成功能验证清单中的所有测试
10. **保留旧数据库**：迁移后保留 Supabase 1-2 周作为回滚备份
