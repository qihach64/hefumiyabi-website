import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkStores() {
  console.log("🔍 检查店铺和商家关联...\n");

  try {
    // 查找所有商家
    const merchants = await prisma.merchant.findMany({
      include: {
        stores: true,
      },
    });

    console.log(`📊 总商家数: ${merchants.length}\n`);

    for (const merchant of merchants) {
      console.log(`商家: ${merchant.businessName}`);
      console.log(`  ID: ${merchant.id}`);
      console.log(`  Owner: ${merchant.ownerId}`);
      console.log(`  Status: ${merchant.status}`);
      console.log(`  店铺数: ${merchant.stores.length}`);
      if (merchant.stores.length > 0) {
        merchant.stores.forEach((store, i) => {
          console.log(`    ${i + 1}. ${store.name} (${store.city})`);
        });
      }
      console.log("");
    }

    // 查找所有店铺
    const allStores = await prisma.store.findMany();
    console.log(`📍 总店铺数: ${allStores.length}\n`);

    for (const store of allStores) {
      console.log(`店铺: ${store.name}`);
      console.log(`  ID: ${store.id}`);
      console.log(`  City: ${store.city}`);
      console.log(`  MerchantId: ${store.merchantId || "(无)"}`);
      console.log(`  Active: ${store.isActive}`);
      console.log("");
    }

  } catch (error) {
    console.error("❌ 出错:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStores();
