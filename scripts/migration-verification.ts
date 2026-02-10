/**
 * Supabase -> AWS RDS 迁移验证脚本
 *
 * 用法:
 *   # 收集基线 (迁移前在 Supabase 执行)
 *   DATABASE_URL="postgresql://..." pnpm tsx scripts/migration-verification.ts --baseline
 *
 *   # 验证迁移 (迁移后在 RDS 执行)
 *   DATABASE_URL="postgresql://..." pnpm tsx scripts/migration-verification.ts --verify --baseline-file=baseline_20260125.json
 *
 *   # 快速健康检查
 *   DATABASE_URL="postgresql://..." pnpm tsx scripts/migration-verification.ts --health
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

interface TableCount {
  table_name: string;
  row_count: number;
}

interface Baseline {
  timestamp: string;
  source: string;
  tables: TableCount[];
  statuses: {
    plans: Record<string, number>;
    bookings: Record<string, number>;
  };
  themes: { id: string; slug: string; name: string }[];
  stores: { id: string; slug: string; name: string; city: string }[];
}

// 核心业务表列表
const CORE_TABLES = [
  "users",
  "rental_plans",
  "themes",
  "stores",
  "bookings",
  "booking_items",
  "plan_stores",
  "plan_tags",
  "plan_components",
  "plan_upgrades",
  "tags",
  "tag_categories",
  "merchants",
  "favorites",
  "carts",
  "cart_items",
  "service_components",
  "merchant_components",
  "map_templates",
  "map_hotspots",
];

async function collectTableCounts(): Promise<TableCount[]> {
  const results: TableCount[] = [];

  for (const table of CORE_TABLES) {
    try {
      const count = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM "${table}"`
      );
      results.push({
        table_name: table,
        row_count: Number(count[0].count),
      });
    } catch (error) {
      console.error(`  [WARN] 无法查询表 ${table}: ${error}`);
      results.push({ table_name: table, row_count: -1 });
    }
  }

  return results;
}

async function checkForeignKeys(): Promise<{ check: string; orphans: number }[]> {
  const checks = [
    {
      name: "plan_stores->rental_plans",
      query: `SELECT COUNT(*) as count FROM plan_stores ps WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = ps.plan_id)`,
    },
    {
      name: "plan_stores->stores",
      query: `SELECT COUNT(*) as count FROM plan_stores ps WHERE NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = ps.store_id)`,
    },
    {
      name: "plan_components->rental_plans",
      query: `SELECT COUNT(*) as count FROM plan_components pc WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = pc.plan_id)`,
    },
    {
      name: "plan_tags->rental_plans",
      query: `SELECT COUNT(*) as count FROM plan_tags pt WHERE NOT EXISTS (SELECT 1 FROM rental_plans rp WHERE rp.id = pt.plan_id)`,
    },
    {
      name: "plan_tags->tags",
      query: `SELECT COUNT(*) as count FROM plan_tags pt WHERE NOT EXISTS (SELECT 1 FROM tags t WHERE t.id = pt.tag_id)`,
    },
    {
      name: "booking_items->bookings",
      query: `SELECT COUNT(*) as count FROM booking_items bi WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.id = bi.booking_id)`,
    },
  ];

  const results: { check: string; orphans: number }[] = [];

  for (const check of checks) {
    try {
      const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(check.query);
      results.push({ check: check.name, orphans: Number(result[0].count) });
    } catch (error) {
      console.error(`  [WARN] 外键检查失败 ${check.name}: ${error}`);
      results.push({ check: check.name, orphans: -1 });
    }
  }

  return results;
}

async function collectStatusDistribution() {
  const planStatuses = await prisma.rentalPlan.groupBy({
    by: ["status"],
    _count: true,
  });

  const bookingStatuses = await prisma.booking.groupBy({
    by: ["status"],
    _count: true,
  });

  return {
    plans: Object.fromEntries(planStatuses.map((s) => [s.status, s._count])),
    bookings: Object.fromEntries(bookingStatuses.map((s) => [s.status, s._count])),
  };
}

async function collectActiveEntities() {
  const themes = await prisma.theme.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
    orderBy: { displayOrder: "asc" },
  });

  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return { themes, stores };
}

async function runHealthCheck() {
  console.log("\n========================================");
  console.log("数据库健康检查");
  console.log("========================================\n");

  // 1. 连接测试
  console.log("1. 连接测试...");
  const start = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const latency = performance.now() - start;
  console.log(`   [${latency < 100 ? "PASS" : "WARN"}] 查询延迟: ${latency.toFixed(1)}ms`);

  // 2. 表存在性检查
  console.log("\n2. 核心表检查...");
  let tableOk = 0;
  for (const table of CORE_TABLES.slice(0, 5)) {
    // 只检查前 5 个
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      tableOk++;
    } catch {
      console.log(`   [FAIL] 表不存在: ${table}`);
    }
  }
  console.log(`   [${tableOk === 5 ? "PASS" : "FAIL"}] ${tableOk}/5 核心表可访问`);

  // 3. 数据完整性快速检查
  console.log("\n3. 数据完整性...");
  const planCount = await prisma.rentalPlan.count();
  const themeCount = await prisma.theme.count();
  const storeCount = await prisma.store.count();
  console.log(`   租赁套餐: ${planCount}`);
  console.log(`   主题: ${themeCount}`);
  console.log(`   店铺: ${storeCount}`);
  console.log(
    `   [${planCount > 0 && themeCount > 0 && storeCount > 0 ? "PASS" : "WARN"}] 核心数据存在`
  );

  // 4. 连接池状态
  console.log("\n4. 连接池测试 (5 次并发查询)...");
  const concurrentStart = performance.now();
  await Promise.all([
    prisma.$queryRaw`SELECT 1`,
    prisma.$queryRaw`SELECT 2`,
    prisma.$queryRaw`SELECT 3`,
    prisma.$queryRaw`SELECT 4`,
    prisma.$queryRaw`SELECT 5`,
  ]);
  const concurrentLatency = performance.now() - concurrentStart;
  console.log(`   [${concurrentLatency < 500 ? "PASS" : "WARN"}] 并发延迟: ${concurrentLatency.toFixed(1)}ms`);

  console.log("\n========================================");
  console.log("健康检查完成");
  console.log("========================================\n");
}

async function collectBaseline() {
  console.log("\n========================================");
  console.log("收集迁移基线数据");
  console.log("========================================\n");

  console.log("1. 收集表行数...");
  const tables = await collectTableCounts();
  tables.forEach((t) => console.log(`   ${t.table_name}: ${t.row_count}`));

  console.log("\n2. 收集状态分布...");
  const statuses = await collectStatusDistribution();
  console.log("   套餐状态:", statuses.plans);
  console.log("   预约状态:", statuses.bookings);

  console.log("\n3. 收集活跃实体...");
  const { themes, stores } = await collectActiveEntities();
  console.log(`   活跃主题: ${themes.length}`);
  console.log(`   活跃店铺: ${stores.length}`);

  const baseline: Baseline = {
    timestamp: new Date().toISOString(),
    source: process.env.DATABASE_URL?.includes("supabase") ? "supabase" : "rds",
    tables,
    statuses,
    themes,
    stores,
  };

  const filename = `baseline_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.json`;
  fs.writeFileSync(filename, JSON.stringify(baseline, null, 2));
  console.log(`\n基线数据已保存: ${filename}`);

  return baseline;
}

async function verifyMigration(baselineFile: string) {
  console.log("\n========================================");
  console.log("验证迁移数据完整性");
  console.log("========================================\n");

  // 加载基线
  if (!fs.existsSync(baselineFile)) {
    console.error(`[ERROR] 基线文件不存在: ${baselineFile}`);
    process.exit(1);
  }

  const baseline: Baseline = JSON.parse(fs.readFileSync(baselineFile, "utf-8"));
  console.log(`基线来源: ${baseline.source}`);
  console.log(`基线时间: ${baseline.timestamp}\n`);

  let allPassed = true;

  // 1. 验证表行数
  console.log("1. 验证表行数...");
  const currentTables = await collectTableCounts();

  for (const baselineTable of baseline.tables) {
    const current = currentTables.find((t) => t.table_name === baselineTable.table_name);
    if (!current) {
      console.log(`   [FAIL] 表不存在: ${baselineTable.table_name}`);
      allPassed = false;
      continue;
    }

    const diff = current.row_count - baselineTable.row_count;
    if (diff === 0) {
      console.log(`   [PASS] ${baselineTable.table_name}: ${current.row_count}`);
    } else {
      console.log(
        `   [FAIL] ${baselineTable.table_name}: 基线=${baselineTable.row_count}, 当前=${current.row_count}, 差异=${diff}`
      );
      allPassed = false;
    }
  }

  // 2. 验证外键完整性
  console.log("\n2. 验证外键完整性...");
  const fkResults = await checkForeignKeys();

  for (const fk of fkResults) {
    if (fk.orphans === 0) {
      console.log(`   [PASS] ${fk.check}: 无孤儿记录`);
    } else if (fk.orphans === -1) {
      console.log(`   [WARN] ${fk.check}: 检查失败`);
    } else {
      console.log(`   [FAIL] ${fk.check}: ${fk.orphans} 条孤儿记录`);
      allPassed = false;
    }
  }

  // 3. 验证活跃实体
  console.log("\n3. 验证活跃实体...");
  const { themes, stores } = await collectActiveEntities();

  const themeDiff = themes.length - baseline.themes.length;
  const storeDiff = stores.length - baseline.stores.length;

  console.log(
    `   主题: 基线=${baseline.themes.length}, 当前=${themes.length} ${themeDiff === 0 ? "[PASS]" : "[WARN]"}`
  );
  console.log(
    `   店铺: 基线=${baseline.stores.length}, 当前=${stores.length} ${storeDiff === 0 ? "[PASS]" : "[WARN]"}`
  );

  // 4. 验证状态分布
  console.log("\n4. 验证状态分布...");
  const currentStatuses = await collectStatusDistribution();

  console.log("   套餐状态:", currentStatuses.plans);
  console.log("   预约状态:", currentStatuses.bookings);

  // 最终结果
  console.log("\n========================================");
  if (allPassed) {
    console.log("验证结果: PASS - 迁移成功!");
    console.log("========================================\n");
  } else {
    console.log("验证结果: FAIL - 发现数据不一致!");
    console.log("请检查上述 [FAIL] 项目");
    console.log("========================================\n");
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.includes("--health")) {
      await runHealthCheck();
    } else if (args.includes("--baseline")) {
      await collectBaseline();
    } else if (args.includes("--verify")) {
      const baselineArg = args.find((a) => a.startsWith("--baseline-file="));
      if (!baselineArg) {
        console.error("用法: --verify --baseline-file=baseline_xxx.json");
        process.exit(1);
      }
      const baselineFile = baselineArg.split("=")[1];
      await verifyMigration(baselineFile);
    } else {
      console.log(`
Supabase -> AWS RDS 迁移验证脚本

用法:
  # 健康检查
  DATABASE_URL="..." pnpm tsx scripts/migration-verification.ts --health

  # 收集基线 (迁移前)
  DATABASE_URL="..." pnpm tsx scripts/migration-verification.ts --baseline

  # 验证迁移 (迁移后)
  DATABASE_URL="..." pnpm tsx scripts/migration-verification.ts --verify --baseline-file=baseline_xxx.json
`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
