/**
 * v10.1 组件系统迁移脚本
 *
 * 执行步骤：
 * 1. 复制 ServiceComponent 的 images/highlights 到 default_* 字段
 * 2. 为所有商户创建 MerchantComponentOverride 实例
 * 3. 迁移 PlanComponent 关联到 MerchantComponentOverride
 *
 * 运行方式：
 * DATABASE_URL="..." pnpm tsx scripts/migrate-v10.1-components.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== v10.1 组件系统迁移开始 ===\n");

  // Step 1: 复制 ServiceComponent 的 images/highlights 到 default_* 字段
  console.log("Step 1: 复制 ServiceComponent 默认内容字段...");
  const components = await prisma.serviceComponent.findMany();
  let updatedCount = 0;

  for (const comp of components) {
    await prisma.serviceComponent.update({
      where: { id: comp.id },
      data: {
        defaultImages: comp.images,
        defaultHighlights: comp.highlights,
      },
    });
    updatedCount++;
  }
  console.log(`  ✓ 更新了 ${updatedCount} 个 ServiceComponent\n`);

  // Step 2: 为所有商户创建 MerchantComponentOverride 实例
  console.log("Step 2: 创建商户组件实例...");
  const merchants = await prisma.merchant.findMany({
    where: { status: "APPROVED" },
    select: { id: true },
  });

  const templates = await prisma.serviceComponent.findMany({
    where: {
      isActive: true,
      isSystemComponent: true,
    },
    select: { id: true },
  });

  console.log(
    `  发现 ${merchants.length} 个商户，${templates.length} 个平台组件`
  );

  let createdCount = 0;
  let skippedCount = 0;

  for (const merchant of merchants) {
    const existingOverrides =
      await prisma.merchantComponentOverride.findMany({
        where: { merchantId: merchant.id },
        select: { componentId: true },
      });

    const existingComponentIds = new Set(
      existingOverrides.map((o) => o.componentId)
    );

    const newInstances = templates
      .filter((t) => !existingComponentIds.has(t.id))
      .map((t) => ({
        merchantId: merchant.id,
        componentId: t.id,
        images: [] as string[],
        highlights: [] as string[],
        price: null,
        isEnabled: true,
      }));

    if (newInstances.length > 0) {
      await prisma.merchantComponentOverride.createMany({
        data: newInstances,
        skipDuplicates: true,
      });
      createdCount += newInstances.length;
      console.log(
        `  ✓ 商户 ${merchant.id}: 创建 ${newInstances.length} 个实例`
      );
    } else {
      skippedCount++;
    }
  }
  console.log(
    `  ✓ 创建了 ${createdCount} 个实例，跳过 ${skippedCount} 个已存在的商户\n`
  );

  // Step 3: 迁移 PlanComponent 关联
  console.log("Step 3: 迁移 PlanComponent 关联...");
  const plans = await prisma.rentalPlan.findMany({
    include: {
      planComponents: true,
    },
  });

  let migratedCount = 0;
  let errorCount = 0;

  for (const plan of plans) {
    if (!plan.merchantId) {
      console.log(`  ⚠ 套餐 ${plan.id} 没有 merchantId，跳过`);
      continue;
    }

    for (const pc of plan.planComponents) {
      if (pc.merchantComponentId) {
        // 已迁移
        continue;
      }

      if (!pc.componentId) {
        console.log(`  ⚠ PlanComponent ${pc.id} 没有 componentId，跳过`);
        continue;
      }

      // 查找对应的 MerchantComponentOverride
      const merchantComponent =
        await prisma.merchantComponentOverride.findUnique({
          where: {
            merchantId_componentId: {
              merchantId: plan.merchantId,
              componentId: pc.componentId,
            },
          },
        });

      if (merchantComponent) {
        await prisma.planComponent.update({
          where: { id: pc.id },
          data: { merchantComponentId: merchantComponent.id },
        });
        migratedCount++;
      } else {
        console.log(
          `  ⚠ 找不到商户组件: plan=${plan.id}, component=${pc.componentId}`
        );
        errorCount++;
      }
    }
  }
  console.log(
    `  ✓ 迁移了 ${migratedCount} 个 PlanComponent，${errorCount} 个错误\n`
  );

  // 验证
  console.log("=== 验证迁移结果 ===\n");

  const totalPlanComponents = await prisma.planComponent.count();
  const migratedPlanComponents = await prisma.planComponent.count({
    where: { merchantComponentId: { not: null } },
  });
  const notMigratedPlanComponents = await prisma.planComponent.count({
    where: { merchantComponentId: null },
  });

  console.log(`PlanComponent 总数: ${totalPlanComponents}`);
  console.log(`已迁移: ${migratedPlanComponents}`);
  console.log(`未迁移: ${notMigratedPlanComponents}`);

  const totalMerchantComponents =
    await prisma.merchantComponentOverride.count();
  console.log(`\nMerchantComponentOverride 总数: ${totalMerchantComponents}`);
  console.log(
    `预期数量: ${merchants.length} 商户 × ${templates.length} 模板 = ${merchants.length * templates.length}`
  );

  console.log("\n=== 迁移完成 ===");

  if (notMigratedPlanComponents > 0) {
    console.log(
      "\n⚠ 警告: 有未迁移的 PlanComponent，请检查后手动处理"
    );
  }
}

main()
  .catch((e) => {
    console.error("迁移失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
