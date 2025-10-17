const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 有效的和服相关 Unsplash 图片 URLs（已验证可用）
const validKimonoImages = [
  'https://images.unsplash.com/photo-1617854818583-09e7f077a156?w=800&q=80', // 女性和服
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', // 京都和服
  'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80', // 传统和服
  'https://images.unsplash.com/photo-1587814595434-6f544ea46146?w=800&q=80', // 和服背面
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80', // 和服细节
  'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80', // 日本传统
];

// 无效的图片URL
const invalidImageUrl = 'https://images.unsplash.com/photo-1583846788883-5e8c7c93d85e?w=800&q=80';

async function fixInvalidImages() {
  try {
    console.log('🔍 查找使用无效图片URL的套餐...\n');

    const plansWithInvalidImages = await prisma.rentalPlan.findMany({
      where: {
        imageUrl: invalidImageUrl
      },
      select: {
        id: true,
        name: true,
        imageUrl: true
      }
    });

    console.log(`找到 ${plansWithInvalidImages.length} 个需要更新的套餐\n`);

    if (plansWithInvalidImages.length === 0) {
      console.log('✅ 没有需要更新的套餐');
      return;
    }

    // 为每个套餐随机分配一个有效的图片
    let updated = 0;
    for (let i = 0; i < plansWithInvalidImages.length; i++) {
      const plan = plansWithInvalidImages[i];
      const newImageUrl = validKimonoImages[i % validKimonoImages.length];

      await prisma.rentalPlan.update({
        where: { id: plan.id },
        data: { imageUrl: newImageUrl }
      });

      const displayName = plan.name.length > 40 ? plan.name.substring(0, 40) + '...' : plan.name;
      console.log(`✅ [${i + 1}/${plansWithInvalidImages.length}] ${displayName}`);
      updated++;
    }

    console.log(`\n🎉 成功更新 ${updated} 个套餐的图片！`);

  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行更新
fixInvalidImages()
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
