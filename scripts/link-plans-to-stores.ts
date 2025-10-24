import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function linkPlansToStores() {
  console.log("🔗 开始关联套餐到店铺...\n");

  try {
    // 获取APPROVED状态的商家"江戸和装工房雅"
    const merchant = await prisma.merchant.findFirst({
      where: {
        businessName: "江戸和装工房雅",
        status: "APPROVED",
      },
      include: {
        stores: true,
      },
    });

    if (!merchant) {
      console.log("❌ 未找到商家");
      return;
    }

    console.log(`✅ 找到商家: ${merchant.businessName}`);
    console.log(`📍 店铺数量: ${merchant.stores.length}`);
    merchant.stores.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name} (${store.city})`);
    });
    console.log("");

    // 获取所有没有 storeName 的活跃套餐
    const plansWithoutStore = await prisma.rentalPlan.findMany({
      where: {
        OR: [
          { storeName: null },
          { storeName: "" },
        ],
        isActive: true,
      },
    });

    console.log(`📦 找到 ${plansWithoutStore.length} 个未关联店铺的套餐\n`);

    if (plansWithoutStore.length === 0) {
      console.log("✅ 所有套餐都已关联店铺");
      return;
    }

    // 将这些套餐关联到第一个店铺（浅草本店）
    const defaultStore = merchant.stores.find(s => s.name.includes("本店")) || merchant.stores[0];

    console.log(`🏪 将套餐关联到: ${defaultStore.name}\n`);

    let updated = 0;
    for (const plan of plansWithoutStore) {
      await prisma.rentalPlan.update({
        where: { id: plan.id },
        data: {
          storeName: defaultStore.name,
          region: defaultStore.city,
        },
      });
      updated++;

      if (updated % 10 === 0) {
        console.log(`   已更新 ${updated}/${plansWithoutStore.length} 个套餐...`);
      }
    }

    console.log(`\n✅ 成功关联 ${updated} 个套餐到 ${defaultStore.name}`);

    // 显示统计
    const storeStats = await Promise.all(
      merchant.stores.map(async (store) => {
        const count = await prisma.rentalPlan.count({
          where: {
            storeName: store.name,
            isActive: true,
          },
        });
        return { name: store.name, count };
      })
    );

    console.log("\n📊 各店铺套餐数量:");
    storeStats.forEach(({ name, count }) => {
      console.log(`   ${name}: ${count} 个套餐`);
    });

  } catch (error) {
    console.error("❌ 出错:", error);
  } finally {
    await prisma.$disconnect();
  }
}

linkPlansToStores();
