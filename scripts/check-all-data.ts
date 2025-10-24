import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAllData() {
  console.log("📊 查看数据库中的所有数据...\n");

  try {
    // 查询所有用户
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`👥 用户总数: ${users.length}\n`);
    if (users.length > 0) {
      console.log("用户列表:");
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name || "未设置"} (${user.email})`);
        console.log(`     角色: ${user.role}`);
        console.log(`     创建时间: ${user.createdAt.toLocaleString('zh-CN')}\n`);
      });
    }

    // 查询所有商家
    const merchants = await prisma.merchant.findMany({
      include: {
        owner: true,
        stores: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`🏪 商家总数: ${merchants.length}\n`);
    if (merchants.length > 0) {
      console.log("商家列表:");
      merchants.forEach((merchant, index) => {
        console.log(`  ${index + 1}. ${merchant.businessName}`);
        console.log(`     所有者: ${merchant.owner.name} (${merchant.owner.email})`);
        console.log(`     状态: ${merchant.status}`);
        console.log(`     店铺数: ${merchant.stores.length}`);
        console.log(`     创建时间: ${merchant.createdAt.toLocaleString('zh-CN')}\n`);
      });
    }

    // 查询所有订单
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        merchant: true,
        items: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📦 订单总数: ${bookings.length}\n`);
    if (bookings.length > 0) {
      console.log("订单列表:");
      bookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. 订单 ID: ${booking.id}`);
        console.log(`     客户: ${booking.guestName || booking.user?.name || "未知"}`);
        console.log(`     邮箱: ${booking.guestEmail || booking.user?.email || "未知"}`);
        console.log(`     商家: ${booking.merchant?.businessName || "未知"}`);
        console.log(`     状态: ${booking.status} | 支付: ${booking.paymentStatus}`);
        console.log(`     金额: ¥${(booking.totalAmount / 100).toFixed(2)}`);
        console.log(`     到店日期: ${booking.visitDate ? new Date(booking.visitDate).toLocaleDateString('zh-CN') : "未设置"}`);
        console.log(`     到店时间: ${booking.visitTime || "未设置"}`);
        console.log(`     创建时间: ${booking.createdAt.toLocaleString('zh-CN')}`);
        if (booking.items.length > 0) {
          console.log(`     项目:`);
          booking.items.forEach((item) => {
            console.log(`       - ${item.plan?.name || "未知"} x${item.quantity}`);
          });
        }
        console.log("");
      });
    }

    // 查询套餐数量
    const plans = await prisma.rentalPlan.count();
    console.log(`📋 租赁套餐总数: ${plans}`);

    // 查询店铺数量
    const stores = await prisma.store.count();
    console.log(`🏬 店铺总数: ${stores}`);

  } catch (error) {
    console.error("❌ 查询出错:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();
