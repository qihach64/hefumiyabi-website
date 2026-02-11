import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  清空测试预约数据...");

  // 先删除预约项目
  const deletedItems = await prisma.bookingItem.deleteMany();
  console.log(`✅ 删除了 ${deletedItems.count} 条预约项目`);

  // 删除预约数据
  const deletedBookings = await prisma.booking.deleteMany();
  console.log(`✅ 删除了 ${deletedBookings.count} 条预约记录`);

  console.log("\n✨ 清空完成！现在可以运行数据库迁移了。");
}

main()
  .catch((e) => {
    console.error("❌ 错误:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
