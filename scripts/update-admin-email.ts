import prisma from "../src/lib/prisma";

async function updateAdminEmail() {
  try {
    console.log("🔄 更新管理员邮箱...\n");

    // 查找旧邮箱的用户
    const oldUser = await prisma.user.findUnique({
      where: { email: "admin@hefumiyabi.com" },
      include: {
        merchant: true,
      },
    });

    if (!oldUser) {
      console.log("❌ 未找到邮箱为 admin@hefumiyabi.com 的用户");
      console.log("可能邮箱已经被更新或不存在\n");

      // 检查新邮箱是否已存在
      const newUser = await prisma.user.findUnique({
        where: { email: "stylekay1168@gmail.com" },
      });

      if (newUser) {
        console.log("✅ 邮箱 stylekay1168@gmail.com 已存在");
        console.log(`   用户ID: ${newUser.id}`);
        console.log(`   角色: ${newUser.role}`);
        console.log(`   姓名: ${newUser.name}`);
      }

      return;
    }

    console.log("📧 找到用户:");
    console.log(`   ID: ${oldUser.id}`);
    console.log(`   旧邮箱: ${oldUser.email}`);
    console.log(`   姓名: ${oldUser.name}`);
    console.log(`   角色: ${oldUser.role}`);
    if (oldUser.merchant) {
      console.log(`   商家: ${oldUser.merchant.businessName}`);
    }
    console.log("");

    // 更新邮箱
    const updatedUser = await prisma.user.update({
      where: { email: "admin@hefumiyabi.com" },
      data: { email: "stylekay1168@gmail.com" },
    });

    console.log("✅ 邮箱更新成功！");
    console.log("========================");
    console.log(`📧 新邮箱: ${updatedUser.email}`);
    console.log(`👤 姓名: ${updatedUser.name}`);
    console.log(`🎭 角色: ${updatedUser.role}`);
    console.log("========================\n");
    console.log("您现在可以使用新邮箱登录了！");

  } catch (error: any) {
    if (error.code === "P2002") {
      console.error("❌ 邮箱 stylekay1168@gmail.com 已被其他用户使用");
      console.log("\n解决方案：");
      console.log("1. 检查是否有重复账号");
      console.log("2. 删除或更改重复账号的邮箱");
    } else {
      console.error("❌ 更新失败:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminEmail();
