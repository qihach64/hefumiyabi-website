/**
 * 数据迁移脚本：为现有 RentalPlan 添加商家所有权
 *
 * 目的：修复权限漏洞，确保每个套餐都关联到创建它的商家
 *
 * 使用方法：
 * 1. 确保已执行 `pnpm prisma db push` 将 schema 更新应用到数据库
 * 2. 运行: pnpm tsx scripts/migrate-rental-plans-add-merchant.ts
 */

import prisma from "@/lib/prisma";

const TARGET_MERCHANT_ID = "cmh158hpt0002gy0o56xmkpxo"; // 指定的商家 ID

async function main() {
  console.log("🚀 开始迁移 RentalPlan 数据...\n");

  // 1. 验证商家是否存在
  const merchant = await prisma.merchant.findUnique({
    where: { id: TARGET_MERCHANT_ID },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!merchant) {
    console.error(`❌ 商家 ID ${TARGET_MERCHANT_ID} 不存在！`);
    process.exit(1);
  }

  console.log(`✅ 找到商家: ${merchant.businessName}`);
  console.log(`   所有者: ${merchant.owner.name || merchant.owner.email}`);
  console.log(`   商家状态: ${merchant.status}\n`);

  // 2. 查询所有没有 merchantId 的套餐
  const plansWithoutMerchant = await prisma.rentalPlan.findMany({
    where: {
      merchantId: null,
    },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      createdAt: true,
    },
  });

  console.log(`📦 找到 ${plansWithoutMerchant.length} 个未关联商家的套餐\n`);

  if (plansWithoutMerchant.length === 0) {
    console.log("✅ 所有套餐都已关联商家，无需迁移");
    return;
  }

  // 3. 显示待迁移的套餐
  console.log("待迁移的套餐列表:");
  console.log("━".repeat(80));
  plansWithoutMerchant.forEach((plan, index) => {
    console.log(
      `${index + 1}. ${plan.name} (${plan.category}) - ¥${plan.price / 100} - ${plan.createdAt.toLocaleDateString()}`
    );
  });
  console.log("━".repeat(80));
  console.log();

  // 4. 执行迁移
  console.log(`🔧 正在将所有套餐关联到商家: ${merchant.businessName}...\n`);

  const updateResult = await prisma.rentalPlan.updateMany({
    where: {
      merchantId: null,
    },
    data: {
      merchantId: TARGET_MERCHANT_ID,
      createdBy: merchant.ownerId, // 设置为商家所有者的 User ID
    },
  });

  console.log(`✅ 成功更新 ${updateResult.count} 个套餐\n`);

  // 5. 验证迁移结果
  const verifyCount = await prisma.rentalPlan.count({
    where: {
      merchantId: null,
    },
  });

  if (verifyCount === 0) {
    console.log("✅ 迁移验证成功：所有套餐都已关联商家");
  } else {
    console.warn(`⚠️  仍有 ${verifyCount} 个套餐未关联商家`);
  }

  // 6. 显示最终统计
  const finalStats = await prisma.rentalPlan.groupBy({
    by: ["merchantId"],
    _count: {
      id: true,
    },
  });

  console.log("\n📊 最终套餐分布:");
  console.log("━".repeat(80));
  for (const stat of finalStats) {
    if (stat.merchantId) {
      const m = await prisma.merchant.findUnique({
        where: { id: stat.merchantId },
        select: { businessName: true },
      });
      console.log(`商家: ${m?.businessName || stat.merchantId} - ${stat._count.id} 个套餐`);
    } else {
      console.log(`未关联商家 - ${stat._count.id} 个套餐`);
    }
  }
  console.log("━".repeat(80));
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\n✅ 迁移完成");
  })
  .catch(async (e) => {
    console.error("\n❌ 迁移失败:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
