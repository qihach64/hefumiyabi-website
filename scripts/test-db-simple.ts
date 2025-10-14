import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 正在测试数据库连接...\n");

    // 测试连接
    await prisma.$connect();
    console.log("✅ 数据库连接成功！\n");

    // 检查表是否存在
    const models = [
      { name: "user", table: "users" },
      { name: "kimono", table: "kimonos" },
      { name: "store", table: "stores" },
      { name: "rentalPlan", table: "rental_plans" },
      { name: "booking", table: "bookings" },
    ];

    console.log("📋 验证数据库表:");
    for (const model of models) {
      try {
        const count = await (prisma as any)[model.name].count();
        console.log(`  ✓ ${model.table}: ${count} 条记录`);
      } catch (e) {
        console.log(`  ✗ ${model.table}: 无法访问 (${e.message})`);
      }
    }

    console.log("\n🎉 数据库配置完成！可以开始开发了。");
  } catch (error) {
    console.error("❌ 数据库连接失败:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
