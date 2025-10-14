import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 正在测试数据库连接...");

    // 测试连接
    await prisma.$connect();
    console.log("✅ 数据库连接成功！");

    // 执行简单查询
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log("\n📊 数据库信息:");
    console.log(result);

    // 检查现有表
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log("\n📋 现有表:");
    console.log(tables);
  } catch (error) {
    console.error("❌ 数据库连接失败:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
