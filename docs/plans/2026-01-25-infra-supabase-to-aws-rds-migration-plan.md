---
title: "Supabase → AWS RDS 数据库迁移"
type: infra
date: 2026-01-25
status: draft
priority: high
estimated_downtime: 15-30分钟
deepened_on: 2026-01-25
research_agents: security-sentinel, performance-oracle, data-migration-expert, deployment-verification, architecture-strategist, code-simplicity-reviewer, best-practices-researcher, framework-docs-researcher
---

# Supabase → AWS RDS 数据库迁移

## Enhancement Summary

**Deepened on:** 2026-01-25
**Research agents used:** 8 个专业审查和研究代理

### Key Improvements
1. **安全架构升级** - 添加 PgBouncer 中间层替代直接公网暴露
2. **连接池策略优化** - 基于 Prisma 官方文档的 Serverless 配置
3. **数据验证增强** - 扩展验证 SQL 覆盖索引、ENUM、JSON 字段

### Critical Findings
- ⚠️ **RDS Proxy 不适用于 Prisma** - 因 prepared statements 导致连接固定
- ⚠️ **0.0.0.0/0 安全组是严重风险** - 需要 PgBouncer 或 Vercel Static IPs
- ✅ **Graviton 实例 (db.t4g) 更具性价比** - 比 db.t3 便宜约 20%

---

## 概述

将 Kimono One 项目的数据库从 Supabase PostgreSQL 迁移到 AWS RDS PostgreSQL，解决 Supabase PgBouncer 导致的严重延迟问题（630-960ms/查询）。

**问题诊断结果：**
| 连接方式 | 延迟 | 说明 |
|---------|------|------|
| Supabase PgBouncer (6543) | 630-960ms | 当前生产环境 |
| Supabase 直连 (5432) | 130ms | 本地开发可用 |
| AWS RDS (预期) | <50ms | 目标 |

**影响：** 页面加载 6-8 秒，用户体验极差。

## 目标配置

| 配置项 | 值 |
|--------|-----|
| AWS 区域 | ap-northeast-1 (东京) |
| 实例类型 | **db.t4g.medium** (Graviton, 2 vCPU, 4GB RAM) |
| 存储 | gp3, 20GB (可扩展) |
| PostgreSQL 版本 | 16.x (最新 16.11) |
| 预估月成本 | ~$48 (比 t3 便宜 20%) |

### Research Insights: 实例选型

**Best Practices:**
- 优先选择 Graviton 实例 (db.t4g/db.m7g) - 性价比最高
- PostgreSQL 13.x 将于 2026.2.28 停止支持，使用 16.x

**Performance Considerations:**
- db.t4g.medium: ~$48/月 (比 db.t3.medium 便宜约 20%)
- gp3 存储默认 3000 IOPS，足够中小型应用

---

## 技术方案

### 连接池策略

**决策：** 使用 PgBouncer (自建) 作为连接池，不使用 RDS Proxy。

**理由：**
1. ⚠️ **RDS Proxy 与 Prisma 不兼容** - Prisma 使用 prepared statements，会导致 RDS Proxy "pin" 连接，失去连接池效果
2. PgBouncer transaction mode 完美支持 Prisma
3. db.t4g.medium 支持 ~85-150 连接

### Research Insights: 为什么不用 RDS Proxy

根据 [Prisma 官方文档](https://www.prisma.io/docs/orm/prisma-client/deployment/caveats-when-deploying-to-aws-platforms):

> Prisma ORM is compatible with AWS RDS Proxy. However, there is no benefit in using it for connection pooling with Prisma ORM due to the way RDS Proxy pins connections.

**替代方案对比：**

| 方案 | 与 Prisma 兼容 | 延迟 | 成本 |
|------|---------------|------|------|
| RDS Proxy | ❌ 差 (连接固定) | +1-5ms | ~$20-50/月 |
| **PgBouncer** | ✅ 优秀 | +0.5-2ms | EC2/ECS 成本 |
| Prisma Accelerate | ✅ 优秀 | +5-15ms | 按量付费 |

---

### 推荐架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Function   │  │  Function   │  │  Function   │         │
│  │  (conn=2)   │  │  (conn=2)   │  │  (conn=2)   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         └────────────────┼────────────────┘                 │
│                   Vercel Static IPs (Pro plan)              │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                         AWS VPC                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Public Subnet                          │ │
│  │  ┌───────────────────────────────────────────────────┐  │ │
│  │  │   PgBouncer (ECS Fargate / EC2)                   │  │ │
│  │  │   - pool_mode = transaction                        │  │ │
│  │  │   - max_client_conn = 1000                        │  │ │
│  │  │   - default_pool_size = 20                        │  │ │
│  │  └───────────────────────┬───────────────────────────┘  │ │
│  └──────────────────────────┼──────────────────────────────┘ │
│                             │                                 │
│  ┌──────────────────────────┼──────────────────────────────┐ │
│  │                   Private Subnet                         │ │
│  │  ┌───────────────────────▼───────────────────────────┐  │ │
│  │  │   RDS PostgreSQL 16                                │  │ │
│  │  │   - Instance: db.t4g.medium                       │  │ │
│  │  │   - Public access: NO                             │  │ │
│  │  └───────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 简化方案 (MVP)

如果不想自建 PgBouncer，可以使用简化方案：

```
Vercel Functions → AWS RDS (公网暴露 + 强密码 + SSL)
```

**风险：** 公网暴露 5432 端口，需要强密码和 SSL 缓解

---

### Prisma 配置

**文件:** `prisma/schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 用于 Prisma CLI (migrate/push)
}
```

**文件:** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });

// 开发环境缓存实例 (防止热重载创建多个连接)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 注意: Serverless 环境不要显式调用 $disconnect()
// 也不需要 $connect() 预热

export default prisma;
```

### Research Insights: Serverless 连接管理

**Best Practices (from Prisma docs):**
- 在 handler 外部实例化 PrismaClient - 利用 warm starts
- 不要显式调用 `$disconnect()` - 让平台管理连接
- 使用外部连接池时设置 `pgbouncer=true`
- Serverless 环境 `connection_limit=1-3`

**Edge Cases:**
- 冷启动可能同时启动数百实例，每个实例创建连接
- 没有外部连接池时，流量峰值可能耗尽数据库连接

---

### 安全组配置

**决策：** 使用 Vercel Static IPs (Pro plan) 或自建 PgBouncer

### Research Insights: 安全风险评估

⚠️ **严重警告：** 开放 0.0.0.0/0 到 5432 端口是严重安全风险

| 威胁 | 影响 | 可能性 |
|------|------|--------|
| 暴力破解攻击 | 数据库被入侵 | 高 |
| 凭证填充攻击 | 未授权访问 | 高 |
| 零日漏洞利用 | 完全控制 | 中 |

**推荐方案 (按优先级):**

1. **Vercel Pro + Static IPs** - 仅允许 Vercel 静态 IP 访问
2. **自建 PgBouncer** - RDS 在私有子网，PgBouncer 在公共子网
3. **QuotaGuard/Fixie** - 第三方静态 IP 代理服务 (~$20-50/月)

**如果必须公网暴露 (最后方案):**

```yaml
安全配置清单:
  - [ ] 使用 32+ 位随机密码
  - [ ] 强制 SSL (sslmode=require 或 verify-full)
  - [ ] 启用 RDS 增强监控
  - [ ] 配置 CloudWatch 异常登录告警
  - [ ] 启用 VPC Flow Logs
```

---

## 实施阶段

### Phase 1: 创建 AWS RDS 实例

**1.1 AWS Console 创建 RDS**

1. 打开 [RDS Console](https://ap-northeast-1.console.aws.amazon.com/rds/)
2. 点击 "Create database"
3. 配置：
   - Engine: PostgreSQL 16.x
   - Templates: Production (不用 Free tier)
   - DB instance identifier: `kimono-one-db`
   - Master username: `postgres`
   - Master password: 生成 32 位随机密码
   - Instance: **db.t4g.medium** (Graviton)
   - Storage: gp3, 20GB
   - Multi-AZ: **Yes** (生产环境建议)
   - Public access: **No** (如果使用 PgBouncer)
   - VPC security group: 创建新的
4. 等待实例创建完成（约 5-10 分钟）

**1.2 配置安全组**

```bash
# 获取安全组 ID
aws rds describe-db-instances \
  --db-instance-identifier kimono-one-db \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text

# 方案 A: Vercel Static IPs (从 Vercel 控制台获取实际 IP)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 5432 \
  --cidr 76.76.21.0/24 \
  --description "Vercel Static IP Range A"

# 方案 B: 如果必须全开放 (不推荐)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --description "Public access - TEMPORARY"
```

**验收标准：**
- [ ] RDS 实例状态为 "Available"
- [ ] 可从本地 `psql` 连接成功
- [ ] 安全组配置正确

---

### Phase 2: 数据迁移

**2.1 导出 Supabase 数据**

```bash
# 排除 Supabase 内部 schema
pg_dump "postgresql://postgres.xxx:<password>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" \
  --no-owner \
  --no-acl \
  --no-comments \
  --format=custom \
  --verbose \
  --exclude-schema='supabase_*' \
  --exclude-schema='auth' \
  --exclude-schema='storage' \
  --exclude-schema='realtime' \
  --exclude-schema='pgsodium*' \
  --exclude-schema='vault' \
  --file=supabase_backup_$(date +%Y%m%d_%H%M%S).dump
```

### Research Insights: pg_dump 参数

**推荐参数：**
| 参数 | 说明 |
|------|------|
| `--format=custom` | 支持并行恢复、压缩、选择性恢复 |
| `--no-owner` | 不导出所有者（RDS 用户可能不同） |
| `--no-acl` | 不导出权限（Supabase 权限模型不同） |
| `--exclude-schema` | 排除 Supabase 内部 schema |

**2.2 导入到 AWS RDS**

```bash
# 获取 RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier kimono-one-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# 并行导入 (利用多核)
pg_restore \
  --host=$RDS_ENDPOINT \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --no-owner \
  --no-acl \
  --jobs=4 \
  --verbose \
  supabase_backup_xxx.dump
```

**验收标准：**
- [ ] pg_restore 无错误完成
- [ ] 可连接 RDS 执行 `SELECT 1`

---

### Phase 3: 数据验证

**3.1 全表 Row Count 对比**

```sql
-- 在 Supabase 和 RDS 分别执行，对比结果
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
```

**3.2 外键完整性检查**

```sql
-- 检查孤儿记录
SELECT COUNT(*) as orphan_plan_stores FROM plan_stores ps
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = ps.plan_id);

SELECT COUNT(*) as orphan_plan_components FROM plan_components pc
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = pc.plan_id);

SELECT COUNT(*) as orphan_plan_tags FROM plan_tags pt
WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = pt.plan_id);

SELECT COUNT(*) as orphan_booking_items FROM booking_items bi
WHERE bi."planId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = bi."planId");
```

**预期结果：** 所有孤儿记录数应为 0

### Research Insights: 扩展数据验证

**Best Practices (from data-migration-expert):**

```sql
-- 3.3 索引验证
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';

-- 3.4 ENUM 值完整性
SELECT role, COUNT(*) FROM users GROUP BY role;
SELECT status, COUNT(*) FROM bookings GROUP BY status;
SELECT status, COUNT(*) FROM rental_plans GROUP BY status;

-- 3.5 金额字段校验 (关键业务数据)
SELECT
  COUNT(*) FILTER (WHERE price < 0) AS negative_price,
  COUNT(*) FILTER (WHERE price > 10000000) AS suspicious_high_price
FROM rental_plans;

-- 3.6 唯一约束验证
SELECT slug, COUNT(*) FROM rental_plans GROUP BY slug HAVING COUNT(*) > 1;
SELECT slug, COUNT(*) FROM stores GROUP BY slug HAVING COUNT(*) > 1;

-- 3.7 Prisma 迁移状态
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at;
```

**验收标准：**
- [ ] 所有表 row count 一致
- [ ] 无孤儿记录
- [ ] 索引完整
- [ ] ENUM 值分布正确
- [ ] 无异常金额数据

---

### Phase 4: 应用配置更新

**4.1 更新环境变量**

**文件:** `.env.local`

```bash
# 旧配置（注释掉）
# DATABASE_URL="postgresql://postgres.xxx@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 新配置 (直连 RDS)
DATABASE_URL="postgresql://postgres:<password>@<rds-endpoint>.ap-northeast-1.rds.amazonaws.com:5432/postgres?sslmode=require&connection_limit=3"

# 直连 URL (用于 Prisma CLI)
DIRECT_URL="postgresql://postgres:<password>@<rds-endpoint>.ap-northeast-1.rds.amazonaws.com:5432/postgres?sslmode=require"
```

**4.2 更新 Prisma Schema**

**文件:** `prisma/schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**4.3 重新生成 Prisma Client**

```bash
pnpm prisma generate
pnpm prisma migrate status  # 验证迁移状态
```

**验收标准：**
- [ ] `pnpm prisma generate` 成功
- [ ] `pnpm prisma migrate status` 显示 "up to date"
- [ ] `pnpm dev` 启动正常

---

### Phase 5: 性能验证

**5.1 连接延迟测试**

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

**预期：** 每次查询 < 50ms

**5.2 功能回归测试**

| 功能 | 测试方法 | 预期结果 |
|------|---------|---------|
| 首页加载 | 访问 `/` | 特色套餐正常显示 |
| 套餐详情 | 访问 `/plans/[id]` | 热点图正常渲染 |
| 主题筛选 | 选择一个主题 | 套餐列表正确过滤 |
| 地区筛选 | 选择一个地区 | 套餐列表正确过滤 |
| 购物车 | 添加套餐 | 数据正确存储 |

**验收标准：**
- [ ] 单次查询 < 50ms
- [ ] 页面加载 < 2s
- [ ] 所有功能测试通过

---

### Phase 6: 生产部署

**6.1 选择维护窗口**

- **时间：** 凌晨 2:00-4:00 (低流量时段)
- **提前通知：** 24 小时前在网站公告

**6.2 更新 Vercel 环境变量**

1. 打开 [Vercel Project Settings](https://vercel.com/dashboard)
2. 进入 Environment Variables
3. 更新 `DATABASE_URL` 为 AWS RDS 连接字符串
4. 添加 `DIRECT_URL` 用于 Prisma CLI
5. 触发重新部署

**6.3 验证生产环境**

```bash
# 检查 API 响应
curl -w "\nTime: %{time_total}s\n" https://kimono-one.vercel.app/api/health

# 检查页面加载
lighthouse https://kimono-one.vercel.app/plans --only-categories=performance
```

**验收标准：**
- [ ] 生产环境 API 响应正常
- [ ] Lighthouse Performance > 70

---

## 回滚方案

**触发条件：**
- 错误率 > 5% 持续 5 分钟
- P95 延迟 > 2s 持续 10 分钟
- 数据库连接错误连续 > 3 次

**回滚步骤：**

1. 在 Vercel 恢复旧的 `DATABASE_URL` (Supabase)
2. 触发重新部署
3. 验证服务恢复

**重要：** 保留 Supabase 数据库至少 7 天作为回滚备份。

### Research Insights: 回滚最佳实践

**Pre-deployment checklist:**
- [ ] 记录切换时间点
- [ ] 保存 Supabase 连接字符串
- [ ] 准备回滚脚本

**Post-migration data sync (如果需要):**
如果迁移后在 RDS 产生了新数据，回滚前需要考虑数据同步。

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 数据迁移不完整 | 低 | 高 | 扩展验证 SQL + 外键检查 |
| RDS 性能不达预期 | 低 | 高 | 回滚到 Supabase |
| Vercel 连接池耗尽 | **高** | 高 | 使用 PgBouncer 或 `connection_limit=3` |
| 安全组配置错误 | 低 | 高 | 本地测试后再部署 |
| 公网暴露被攻击 | 中 | 高 | PgBouncer + 私有子网 |

---

## 成本估算

| 项目 | 月成本 |
|------|--------|
| RDS db.t4g.medium | ~$40 |
| 存储 20GB gp3 | ~$3 |
| 数据传输 | ~$5 |
| PgBouncer (ECS Fargate) | ~$10 (可选) |
| **总计** | **~$48-58/月** |

对比 Supabase Pro: $25/月（但有 PgBouncer 延迟问题）

### Research Insights: 成本优化

**推荐策略:**
- 使用 Graviton 实例 (db.t4g) 比 Intel (db.t3) 便宜约 20%
- 非生产环境设置自动启停 (EventBridge 规则)
- 稳定后考虑预留实例 (最高 72% 折扣)

---

## 文件变更清单

| 文件 | 变更 |
|------|------|
| `.env.local` | 更新 DATABASE_URL, 添加 DIRECT_URL |
| `prisma/schema.prisma` | 添加 directUrl |

**注意:** `src/lib/prisma.ts` 当前配置已足够，无需修改。

---

## 验收标准汇总

### Phase 1: RDS 实例
- [ ] 实例状态 "Available"
- [ ] 本地可 psql 连接
- [ ] 安全组配置正确

### Phase 2: 数据迁移
- [ ] pg_restore 无错误

### Phase 3: 数据验证
- [ ] Row count 一致
- [ ] 无孤儿记录
- [ ] 索引完整
- [ ] Prisma 迁移状态正确

### Phase 4: 配置更新
- [ ] Prisma generate 成功
- [ ] 本地 dev 启动正常

### Phase 5: 性能验证
- [ ] 查询延迟 < 50ms
- [ ] 页面加载 < 2s
- [ ] 功能测试通过

### Phase 6: 生产部署
- [ ] Vercel 部署成功
- [ ] 生产环境正常

---

## 监控计划

### CloudWatch 关键指标

| 指标 | 告警阈值 | 说明 |
|------|---------|------|
| DatabaseConnections | > 80 | 接近 max_connections |
| CPUUtilization | > 80% | 需要升级实例 |
| ReadLatency | > 10ms | I/O 瓶颈 |
| WriteLatency | > 20ms | 写入压力 |
| FreeableMemory | < 500MB | 内存不足 |

### 应用层监控

```typescript
// 在 plan.service.ts 中已有的性能日志基础上
// 生产环境超过 200ms 的查询记录告警
if (process.env.NODE_ENV === 'production' && totalTime > 200) {
  console.warn(`[SLOW_QUERY] ${methodName}: ${totalTime.toFixed(1)}ms`);
}
```

---

## 参考资料

### 内部文档
- `docs/guides/database-connection.md` - 数据库连接配置
- `docs/guides/database-setup.md` - 数据库设置指南
- `docs/brainstorms/functional-questing-seahorse.md` - 原始 brainstorm
- `docs/solutions/performance-issues/nextjs-isr-architecture-refactor-20260123.md` - ISR 优化经验

### 外部资源
- [AWS RDS PostgreSQL 文档](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Prisma 连接池配置](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections)
- [Prisma AWS 部署注意事项](https://www.prisma.io/docs/orm/prisma-client/deployment/caveats-when-deploying-to-aws-platforms)
- [Prisma Serverless 部署](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)
- [Vercel Connection Pooling Guide](https://vercel.com/guides/connection-pooling-with-serverless-functions)
- [Vercel Static IPs](https://vercel.com/docs/connectivity/static-ips)
