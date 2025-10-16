/**
 * 更新套餐图片
 * 使用方法: node scripts/update-plan-images.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 生成 slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

async function updatePlanImages() {
  console.log('🚀 开始更新套餐图片...\n');

  // 读取爬取的数据
  const dataPath = path.join(__dirname, '../data/real-plans-data.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ 数据文件不存在:', dataPath);
    process.exit(1);
  }

  const scrapedPlans = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📊 找到 ${scrapedPlans.length} 个套餐数据\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const plan of scrapedPlans) {
    try {
      // 生成 slug
      const slug = generateSlug(plan.name);

      // 查找数据库中的套餐
      const existing = await prisma.rentalPlan.findUnique({
        where: { slug }
      });

      if (!existing) {
        console.log(`⚠️  未找到: ${plan.name}`);
        notFound++;
        continue;
      }

      // 更新图片
      if (plan.image) {
        await prisma.rentalPlan.update({
          where: { slug },
          data: {
            imageUrl: plan.image
          }
        });

        console.log(`✅ 更新图片: ${plan.name}`);
        updated++;
      } else {
        console.log(`⚠️  无图片: ${plan.name}`);
      }

    } catch (error) {
      console.error(`❌ 更新失败 "${plan.name}":`, error.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 更新统计:');
  console.log(`   - 成功更新: ${updated} 个`);
  console.log(`   - 未找到套餐: ${notFound} 个`);
  console.log(`   - 更新失败: ${errors} 个`);
  console.log(`   - 总计: ${scrapedPlans.length} 个`);
  console.log('='.repeat(60));

  // 检查数据库中有图片的套餐数量
  const totalWithImages = await prisma.rentalPlan.count({
    where: {
      imageUrl: {
        not: null
      }
    }
  });

  const totalPlans = await prisma.rentalPlan.count();

  console.log('\n📊 数据库统计:');
  console.log(`   - 总套餐数: ${totalPlans}`);
  console.log(`   - 有图片的套餐: ${totalWithImages}`);
  console.log(`   - 缺少图片的套餐: ${totalPlans - totalWithImages}`);

  console.log('\n✅ 更新完成！');
}

async function main() {
  try {
    await updatePlanImages();
  } catch (error) {
    console.error('\n❌ 更新过程出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { updatePlanImages };
