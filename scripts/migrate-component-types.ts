/**
 * 迁移服务组件类型：四分法 → 二分法
 *
 * KIMONO    → OUTFIT
 * STYLING   → OUTFIT
 * ACCESSORY → OUTFIT
 * EXPERIENCE → ADDON
 *
 * 运行: DATABASE_URL="..." pnpm tsx scripts/migrate-component-types.ts
 * 回滚: DATABASE_URL="..." pnpm tsx scripts/migrate-component-types.ts --rollback
 */

import prisma from "../src/lib/prisma";

const MIGRATION_MAP = {
  // 旧类型 → 新类型
  KIMONO: "OUTFIT",
  STYLING: "OUTFIT",
  ACCESSORY: "OUTFIT",
  EXPERIENCE: "ADDON",
} as const;

const ROLLBACK_MAP = {
  // 需要记录原始类型才能回滚
  // 这里使用 description 字段临时存储原始类型（或单独的迁移记录表）
};

async function migrate() {
  console.log("🔄 开始迁移服务组件类型...\n");

  // 1. 查看当前状态
  const beforeStats = await prisma.serviceComponent.groupBy({
    by: ["type"],
    _count: true,
  });

  console.log("📊 迁移前统计:");
  beforeStats.forEach((stat) => {
    console.log(`   ${stat.type}: ${stat._count} 个组件`);
  });

  // 2. 执行迁移
  console.log("\n🔄 执行迁移...");

  for (const [oldType, newType] of Object.entries(MIGRATION_MAP)) {
    const result = await prisma.serviceComponent.updateMany({
      where: { type: oldType as any },
      data: { type: newType as any },
    });
    if (result.count > 0) {
      console.log(`   ${oldType} → ${newType}: ${result.count} 个组件`);
    }
  }

  // 3. 验证结果
  const afterStats = await prisma.serviceComponent.groupBy({
    by: ["type"],
    _count: true,
  });

  console.log("\n📊 迁移后统计:");
  afterStats.forEach((stat) => {
    console.log(`   ${stat.type}: ${stat._count} 个组件`);
  });

  // 4. 显示所有组件
  const allComponents = await prisma.serviceComponent.findMany({
    select: { name: true, type: true, icon: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  console.log("\n📋 所有组件:");
  allComponents.forEach((c) => {
    console.log(`   [${c.type}] ${c.icon || "📍"} ${c.name}`);
  });

  console.log("\n✅ 迁移完成！");
}

async function rollback() {
  console.log("⚠️ 回滚功能需要手动确认原始类型映射");
  console.log("请查看 docs/service-hotmap-design.md 中的历史记录");

  // 如果需要回滚，可以根据组件名称推断原始类型
  // 这里提供一个示例映射
  const ROLLBACK_RULES = [
    { namePattern: /和服|振袖|访问着|蕾丝/, originalType: "KIMONO" },
    { namePattern: /发型|化妆/, originalType: "STYLING" },
    { namePattern: /跟拍|归还/, originalType: "EXPERIENCE" },
    // 其他都是 ACCESSORY
  ];

  const components = await prisma.serviceComponent.findMany({
    where: {
      type: { in: ["OUTFIT", "ADDON"] },
    },
  });

  console.log(`\n找到 ${components.length} 个需要回滚的组件:`);

  for (const c of components) {
    let originalType = "ACCESSORY"; // 默认

    for (const rule of ROLLBACK_RULES) {
      if (rule.namePattern.test(c.name)) {
        originalType = rule.originalType;
        break;
      }
    }

    console.log(`   ${c.name}: ${c.type} → ${originalType}`);
  }

  console.log("\n⚠️ 以上是推断的回滚映射，请确认后手动执行");
}

async function main() {
  const isRollback = process.argv.includes("--rollback");

  try {
    if (isRollback) {
      await rollback();
    } else {
      await migrate();
    }
  } catch (error) {
    console.error("❌ 错误:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
