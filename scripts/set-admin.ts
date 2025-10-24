import prisma from "../src/lib/prisma";

async function setAdmin() {
  // 从命令行参数获取邮箱，或使用默认邮箱
  const email = process.argv[2];

  if (!email) {
    console.error("❌ 请提供用户邮箱");
    console.log("\n使用方法:");
    console.log("  npx tsx scripts/set-admin.ts your-email@example.com");
    process.exit(1);
  }

  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ 找不到邮箱为 ${email} 的用户`);
      console.log("\n请确保：");
      console.log("1. 邮箱地址正确");
      console.log("2. 该用户已经注册");
      process.exit(1);
    }

    // 如果已经是管理员
    if (user.role === "ADMIN") {
      console.log(`✅ 用户 ${user.email} 已经是管理员了`);
      console.log(`   姓名: ${user.name || "未设置"}`);
      process.exit(0);
    }

    // 更新用户角色为管理员
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    console.log("\n✅ 管理员设置成功！");
    console.log("========================");
    console.log(`📧 邮箱: ${updatedUser.email}`);
    console.log(`👤 姓名: ${updatedUser.name || "未设置"}`);
    console.log(`🎭 原角色: ${user.role}`);
    console.log(`🎭 新角色: ${updatedUser.role}`);
    console.log("========================\n");
    console.log("您现在可以访问管理后台了！");

  } catch (error) {
    console.error("❌ 设置管理员时出错:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();
