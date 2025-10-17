const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixRemainingUnsplashImages() {
  try {
    console.log('🚀 修复剩余的 Unsplash 图片...\n');

    // 读取真实图片数据
    const dataPath = path.join(__dirname, '../data/real-plans-data.json');
    const scrapedPlans = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // 提取所有有效的 hefumiyabi.com 图片
    const validImages = scrapedPlans
      .filter(p => p.image && p.image.includes('hefumiyabi.com'))
      .map(p => p.image);

    console.log(`📊 找到 ${validImages.length} 个有效的真实图片\n`);

    // 查找仍在使用 Unsplash 的套餐
    const plansWithUnsplash = await prisma.rentalPlan.findMany({
      where: {
        imageUrl: {
          contains: 'images.unsplash.com'
        }
      },
      select: {
        id: true,
        name: true,
        imageUrl: true
      }
    });

    console.log(`📊 找到 ${plansWithUnsplash.length} 个使用 Unsplash 图片的套餐\n`);

    if (plansWithUnsplash.length === 0) {
      console.log('✅ 没有需要更新的套餐！');
      return;
    }

    // 为每个套餐随机分配一个真实图片
    let updated = 0;
    for (let i = 0; i < plansWithUnsplash.length; i++) {
      const plan = plansWithUnsplash[i];
      const newImageUrl = validImages[i % validImages.length];

      await prisma.rentalPlan.update({
        where: { id: plan.id },
        data: { imageUrl: newImageUrl }
      });

      const displayName = plan.name.length > 50 ? plan.name.substring(0, 50) + '...' : plan.name;
      console.log(`✅ [${i + 1}/${plansWithUnsplash.length}] ${displayName}`);
      updated++;
    }

    console.log(`\n🎉 成功更新 ${updated} 个套餐的图片！`);

    // 验证
    const remaining = await prisma.rentalPlan.count({
      where: {
        imageUrl: {
          contains: 'images.unsplash.com'
        }
      }
    });

    console.log(`\n📊 验证: 剩余使用 Unsplash 的套餐数: ${remaining}`);

  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
fixRemainingUnsplashImages()
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
