import prisma from "../src/lib/prisma";

async function checkMerchantData() {
  const user = await prisma.user.findUnique({
    where: { email: "stylekay1168@gmail.com" },
    include: {
      merchant: {
        include: {
          stores: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              isActive: true,
            },
          },
          bookings: {
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              totalAmount: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
        },
      },
    },
  });

  if (!user || !user.merchant) {
    console.log("❌ 未找到商家数据");
    await prisma.$disconnect();
    return;
  }

  const merchant = user.merchant;

  console.log("🏪 商家信息:");
  console.log(`   名称: ${merchant.businessName}`);
  console.log(`   状态: ${merchant.status}`);
  console.log(`   认证: ${merchant.verified ? "是" : "否"}`);
  console.log(`   总订单: ${merchant.totalBookings}`);
  console.log(`   总收入: ¥${(merchant.totalRevenue / 100).toLocaleString()}`);
  console.log(`   评分: ${merchant.rating || 0}`);
  console.log(`   评价数: ${merchant.reviewCount}`);
  console.log("");

  console.log(`📍 店铺 (${merchant.stores.length}个):`);
  merchant.stores.forEach((store, i) => {
    console.log(`   ${i + 1}. ${store.name}`);
    console.log(`      地址: ${store.address}`);
    console.log(`      城市: ${store.city}`);
    console.log(`      状态: ${store.isActive ? "营业中" : "已关闭"}`);
  });
  console.log("");

  console.log(`📅 最近订单 (${merchant.bookings.length}个):`);
  merchant.bookings.forEach((booking, i) => {
    console.log(`   ${i + 1}. 订单 #${booking.id.slice(-8)}`);
    console.log(`      状态: ${booking.status}`);
    console.log(`      支付: ${booking.paymentStatus}`);
    console.log(`      金额: ¥${(booking.totalAmount / 100).toLocaleString()}`);
    console.log(`      时间: ${booking.createdAt.toLocaleDateString("zh-CN")}`);
  });

  // 检查套餐数据
  const plans = await prisma.rentalPlan.count({
    where: { merchantId: merchant.id },
  });

  console.log("");
  console.log(`📦 套餐数量: ${plans}`);

  await prisma.$disconnect();
}

checkMerchantData();
