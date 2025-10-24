import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function linkBookingsToMerchant() {
  console.log("🔗 将订单关联到商家...\n");

  try {
    // 查找 APPROVED 状态的商家
    const merchant = await prisma.merchant.findFirst({
      where: {
        status: "APPROVED",
        owner: {
          email: "stylekay1168@gmail.com",
        },
      },
      include: {
        owner: true,
      },
    });

    if (!merchant) {
      console.log("❌ 未找到商家账户");
      return;
    }

    console.log(`✅ 找到商家: ${merchant.businessName}`);
    console.log(`📧 所有者: ${merchant.owner.email}\n`);

    // 查找所有没有 merchantId 的订单
    const bookingsWithoutMerchant = await prisma.booking.findMany({
      where: {
        merchantId: null,
      },
    });

    console.log(`📦 找到 ${bookingsWithoutMerchant.length} 个未关联商家的订单\n`);

    if (bookingsWithoutMerchant.length === 0) {
      console.log("✅ 所有订单都已关联商家");
      return;
    }

    // 将这些订单关联到商家
    const result = await prisma.booking.updateMany({
      where: {
        merchantId: null,
      },
      data: {
        merchantId: merchant.id,
      },
    });

    console.log(`✅ 成功关联 ${result.count} 个订单到商家 ${merchant.businessName}\n`);

    // 验证结果
    const totalBookings = await prisma.booking.count();
    const merchantBookings = await prisma.booking.count({
      where: {
        merchantId: merchant.id,
      },
    });

    console.log("📊 统计信息:");
    console.log(`   总订单数: ${totalBookings}`);
    console.log(`   商家订单数: ${merchantBookings}`);
    console.log(`   未关联订单数: ${totalBookings - merchantBookings}`);

    // 按状态统计
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        merchantId: merchant.id,
      },
      _count: true,
    });

    console.log("\n📊 按状态统计:");
    bookingsByStatus.forEach(({ status, _count }) => {
      console.log(`   ${status}: ${_count} 个订单`);
    });

  } catch (error) {
    console.error("❌ 出错:", error);
  } finally {
    await prisma.$disconnect();
  }
}

linkBookingsToMerchant();
