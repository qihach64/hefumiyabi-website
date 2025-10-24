import prisma from "../src/lib/prisma";

async function transferMerchant() {
  try {
    console.log("🔄 将商家转移到真实账户...\n");

    // 1. 获取两个账户
    const [oldAdmin, realUser] = await Promise.all([
      prisma.user.findUnique({
        where: { email: "admin@hefumiyabi.com" },
        include: { merchant: true },
      }),
      prisma.user.findUnique({
        where: { email: "stylekay1168@gmail.com" },
        include: { merchant: true },
      }),
    ]);

    if (!oldAdmin) {
      console.log("❌ 未找到 admin@hefumiyabi.com 账户");
      return;
    }

    if (!realUser) {
      console.log("❌ 未找到 stylekay1168@gmail.com 账户");
      return;
    }

    console.log("📧 找到账户:");
    console.log(`   旧管理员: ${oldAdmin.email} (ID: ${oldAdmin.id})`);
    console.log(`   真实账户: ${realUser.email} (ID: ${realUser.id})`);
    console.log("");

    // 2. 检查真实账户是否已有商家
    if (realUser.merchant) {
      console.log("⚠️  真实账户已经拥有商家:");
      console.log(`   商家名称: ${realUser.merchant.businessName}`);
      console.log(`   商家状态: ${realUser.merchant.status}`);
      console.log("");
      console.log("如需继续，请先手动处理现有商家");
      return;
    }

    // 3. 转移商家
    if (oldAdmin.merchant) {
      console.log("🔄 转移商家...");
      console.log(`   商家: ${oldAdmin.merchant.businessName}`);
      console.log(`   状态: ${oldAdmin.merchant.status}`);
      console.log("");

      await prisma.merchant.update({
        where: { id: oldAdmin.merchant.id },
        data: { ownerId: realUser.id },
      });

      console.log("✅ 商家已转移到真实账户");
    } else {
      console.log("ℹ️  旧管理员账户没有商家");
    }

    // 4. 将真实账户升级为管理员
    console.log("\n🔄 升级账户角色...");
    await prisma.user.update({
      where: { id: realUser.id },
      data: { role: "ADMIN" },
    });
    console.log("✅ 账户已升级为 ADMIN");

    // 5. 删除旧管理员账户
    console.log("\n🗑️  删除旧管理员账户...");
    await prisma.user.delete({
      where: { id: oldAdmin.id },
    });
    console.log("✅ 旧账户已删除");

    console.log("\n========================");
    console.log("✨ 转移完成！");
    console.log("========================");
    console.log(`📧 新管理员邮箱: ${realUser.email}`);
    console.log(`🎭 角色: ADMIN`);
    if (oldAdmin.merchant) {
      console.log(`🏪 商家: ${oldAdmin.merchant.businessName}`);
    }
    console.log("========================\n");
    console.log("您现在可以使用 stylekay1168@gmail.com 登录管理后台了！");

  } catch (error: any) {
    console.error("❌ 操作失败:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

transferMerchant();
