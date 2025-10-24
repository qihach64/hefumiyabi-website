import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMerchantBookings() {
  console.log("📊 查看商家订单数据...\n");

  try {
    // 查找商家账户
    const merchant = await prisma.merchant.findFirst({
      where: {
        owner: {
          email: "kay1168@gmail.com",
        },
      },
      include: {
        stores: true,
        owner: true,
      },
    });

    if (!merchant) {
      console.log("❌ 未找到该商家账户");
      return;
    }

    console.log(`✅ 找到商家: ${merchant.businessName}`);
    console.log(`📧 邮箱: ${merchant.owner.email}`);
    console.log(`📍 店铺数量: ${merchant.stores.length}\n`);

    // 查找所有订单
    const allBookings = await prisma.booking.findMany({
      include: {
        user: true,
        store: true,
        items: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📦 数据库中总订单数: ${allBookings.length}\n`);

    if (allBookings.length === 0) {
      console.log("❌ 数据库中没有任何订单\n");
      console.log("建议：需要创建测试订单数据");
      return;
    }

    // 显示所有订单
    console.log("📋 所有订单列表:");
    console.log("=".repeat(80));

    allBookings.forEach((booking, index) => {
      console.log(`\n订单 ${index + 1}:`);
      console.log(`  ID: ${booking.id}`);
      console.log(`  客户: ${booking.guestName || booking.user?.name || "未知"}`);
      console.log(`  邮箱: ${booking.guestEmail || booking.user?.email || "未知"}`);
      console.log(`  店铺: ${booking.store?.name || "未知"}`);
      console.log(`  到店日期: ${booking.visitDate ? new Date(booking.visitDate).toLocaleDateString('zh-CN') : "未设置"}`);
      console.log(`  到店时间: ${booking.visitTime || "未设置"}`);
      console.log(`  状态: ${booking.status}`);
      console.log(`  支付状态: ${booking.paymentStatus}`);
      console.log(`  总金额: ¥${(booking.totalAmount / 100).toFixed(2)}`);
      console.log(`  创建时间: ${booking.createdAt.toLocaleString('zh-CN')}`);

      if (booking.items.length > 0) {
        console.log(`  订单项目:`);
        booking.items.forEach((item) => {
          console.log(`    - ${item.plan?.name || "未知套餐"} x${item.quantity} (¥${(item.totalPrice / 100).toFixed(2)})`);
        });
      }
    });

    console.log("\n" + "=".repeat(80));

    // 按店铺分组统计
    const bookingsByStore = allBookings.reduce((acc, booking) => {
      const storeName = booking.store?.name || "未知店铺";
      if (!acc[storeName]) {
        acc[storeName] = [];
      }
      acc[storeName].push(booking);
      return acc;
    }, {} as Record<string, typeof allBookings>);

    console.log("\n📊 按店铺统计:");
    Object.entries(bookingsByStore).forEach(([storeName, bookings]) => {
      console.log(`  ${storeName}: ${bookings.length} 个订单`);
    });

    // 按状态统计
    const bookingsByStatus = allBookings.reduce((acc, booking) => {
      if (!acc[booking.status]) {
        acc[booking.status] = 0;
      }
      acc[booking.status]++;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📊 按状态统计:");
    Object.entries(bookingsByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} 个订单`);
    });

  } catch (error) {
    console.error("❌ 查询出错:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMerchantBookings();
