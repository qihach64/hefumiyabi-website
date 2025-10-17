const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importRealPlanImages() {
  try {
    console.log('🚀 开始导入真实套餐图片...\n');

    // 读取 JSON 数据
    const dataPath = path.join(__dirname, '../data/real-plans-data.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ 数据文件不存在:', dataPath);
      process.exit(1);
    }

    const scrapedPlans = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📊 找到 ${scrapedPlans.length} 个套餐数据\n`);

    // 获取所有数据库中的套餐
    const dbPlans = await prisma.rentalPlan.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true
      }
    });

    console.log(`📊 数据库中有 ${dbPlans.length} 个套餐\n`);

    let updated = 0;
    let notFound = 0;
    let skipped = 0;

    // 只处理使用 Unsplash 图片的套餐
    const plansToUpdate = dbPlans.filter(p =>
      p.imageUrl && p.imageUrl.includes('images.unsplash.com')
    );

    console.log(`📊 需要更新 ${plansToUpdate.length} 个使用 Unsplash 图片的套餐\n`);

    // 为每个需要更新的套餐查找匹配的 JSON 数据
    for (const dbPlan of plansToUpdate) {
      // 找到所有同名的 JSON 套餐
      const matchingJsonPlans = scrapedPlans.filter(jp =>
        jp.name === dbPlan.name && jp.image && jp.image.includes('hefumiyabi.com')
      );

      if (matchingJsonPlans.length === 0) {
        console.log(`❌ 未找到匹配: ${dbPlan.name}`);
        notFound++;
        continue;
      }

      // 使用第一个未被使用的图片
      const jsonPlan = matchingJsonPlans.find(jp => {
        // 检查这个图片是否已被其他套餐使用
        return !dbPlans.some(dp => dp.id !== dbPlan.id && dp.imageUrl === jp.image);
      }) || matchingJsonPlans[0]; // 如果都被使用了，就用第一个

      // 更新图片
      await prisma.rentalPlan.update({
        where: { id: dbPlan.id },
        data: { imageUrl: jsonPlan.image }
      });

      const displayName = dbPlan.name.length > 50 ? dbPlan.name.substring(0, 50) + '...' : dbPlan.name;
      console.log(`✅ 已更新: ${displayName}`);
      updated++;

      // 更新内存中的数据
      dbPlan.imageUrl = jsonPlan.image;
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 更新统计:');
    console.log(`   - 成功更新: ${updated} 个`);
    console.log(`   - 未找到匹配: ${notFound} 个`);
    console.log(`   - 跳过(无图片): ${skipped} 个`);
    console.log(`   - 总计: ${scrapedPlans.length} 个`);
    console.log('='.repeat(70));

    // 检查还有多少套餐使用无效图片
    const invalidImageUrl = 'https://images.unsplash.com/photo-1617854818583-09e7f077a156?w=800&q=80';
    const plansWithInvalidImages = await prisma.rentalPlan.count({
      where: {
        imageUrl: {
          contains: 'images.unsplash.com/photo-'
        }
      }
    });

    console.log('\n📊 数据库统计:');
    console.log(`   - 仍使用 Unsplash 图片的套餐: ${plansWithInvalidImages}`);

    console.log('\n✅ 导入完成！');

  } catch (error) {
    console.error('❌ 导入失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行导入
importRealPlanImages()
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
