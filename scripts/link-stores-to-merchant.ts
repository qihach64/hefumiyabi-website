import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function linkStoresToMerchant() {
  console.log("🔗 开始关联店铺到商家...\n");

  try {
    // 获取商家"江戸和装工房雅"
    const merchant = await prisma.merchant.findFirst({
      where: {
        businessName: "江戸和装工房雅",
      },
    });

    if (!merchant) {
      console.log("❌ 未找到商家");
      return;
    }

    console.log(`✅ 找到商家: ${merchant.businessName}`);
    console.log(`   ID: ${merchant.id}\n`);

    // 获取所有没有关联商家的店铺
    const storesWithoutMerchant = await prisma.store.findMany({
      where: {
        merchantId: null,
      },
    });

    console.log(`📍 找到 ${storesWithoutMerchant.length} 个未关联商家的店铺:`);
    storesWithoutMerchant.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name} (${store.city})`);
    });
    console.log("");

    if (storesWithoutMerchant.length === 0) {
      console.log("✅ 所有店铺都已关联商家");
      return;
    }

    // 将所有店铺关联到这个商家
    const result = await prisma.store.updateMany({
      where: {
        merchantId: null,
      },
      data: {
        merchantId: merchant.id,
      },
    });

    console.log(`✅ 成功关联 ${result.count} 个店铺到商家 ${merchant.businessName}`);

    // 验证关联
    const linkedStores = await prisma.store.findMany({
      where: {
        merchantId: merchant.id,
      },
    });

    console.log(`\n📊 商家现有店铺数量: ${linkedStores.length}`);
    linkedStores.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name} (${store.city}) - ${store.isActive ? '营业中' : '已关闭'}`);
    });

  } catch (error) {
    console.error("❌ 出错:", error);
  } finally {
    await prisma.$disconnect();
  }
}

linkStoresToMerchant();
