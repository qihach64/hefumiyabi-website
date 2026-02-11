/**
 * 填充 plan_stores 关联表
 *
 * 根据 rental_plans.region 和 stores.city 匹配:
 * - region 包含 "京都" → 关联 city="京都" 的店铺
 * - region 包含 "东京"/"浅草" → 关联 city="东京" 的店铺
 * - region 为 null → 关联所有店铺
 *
 * 用法: npx tsx scripts/populate-plan-stores.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// region 关键词 → 店铺 city 映射
const REGION_CITY_MAP: Record<string, string[]> = {
  京都: ["京都"],
  东京: ["东京"],
  浅草: ["东京"],
};

function matchCities(region: string | null): string[] | null {
  if (!region) return null; // null = 匹配所有店铺
  for (const [keyword, cities] of Object.entries(REGION_CITY_MAP)) {
    if (region.includes(keyword)) return cities;
  }
  return null; // 无匹配 = 关联所有店铺
}

async function main() {
  console.log("🔗 开始填充 plan_stores 关联表...\n");

  const [plans, stores] = await Promise.all([
    prisma.rentalPlan.findMany({
      where: { isActive: true },
      select: { id: true, name: true, region: true },
    }),
    prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true },
    }),
  ]);

  console.log(`📋 活跃套餐: ${plans.length} 个`);
  console.log(`🏪 活跃店铺: ${stores.length} 个\n`);

  const records: { planId: string; storeId: string }[] = [];

  for (const plan of plans) {
    const cities = matchCities(plan.region);
    const matchedStores = cities
      ? stores.filter((s) => s.city && cities.includes(s.city))
      : stores; // null = 所有店铺

    for (const store of matchedStores) {
      records.push({ planId: plan.id, storeId: store.id });
    }

    console.log(
      `  ${plan.name} (region=${plan.region || "null"}) → ${matchedStores.length} 个店铺`
    );
  }

  console.log(`\n📊 总计 ${records.length} 条关联记录`);

  // 批量写入，跳过已存在的
  const result = await prisma.planStore.createMany({
    data: records,
    skipDuplicates: true,
  });

  console.log(`✅ 新增 ${result.count} 条 plan_stores 记录`);

  // 验证
  const total = await prisma.planStore.count();
  const orphans = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM rental_plans rp
    WHERE rp."isActive" = true
    AND NOT EXISTS (SELECT 1 FROM plan_stores ps WHERE ps.plan_id = rp.id)
  `;

  console.log(`\n🔍 验证:`);
  console.log(`   plan_stores 总行数: ${total}`);
  console.log(`   无店铺关联的活跃套餐: ${orphans[0]?.count || 0}`);
}

main()
  .catch((e) => {
    console.error("❌ 错误:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
