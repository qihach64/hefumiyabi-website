/**
 * 导入爬取的套餐数据到数据库
 * 使用方法: node scripts/import-scraped-plans.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('📦 开始导入爬取的套餐数据...\n');

  // 读取爬取的数据
  const dataPath = path.join(__dirname, '../data/plans-data.json');
  const plansData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`📊 找到 ${plansData.length} 个套餐\n`);

  // 导入每个套餐
  for (const plan of plansData) {
    try {
      // 检查套餐是否已存在
      const existing = await prisma.rentalPlan.findUnique({
        where: { slug: plan.slug }
      });

      if (existing) {
        console.log(`⚠️  套餐 "${plan.name}" 已存在，跳过`);
        continue;
      }

      // 创建新套餐
      await prisma.rentalPlan.create({
        data: {
          slug: plan.slug,
          name: plan.name,
          nameEn: plan.nameEn,
          description: plan.description,
          category: plan.category,
          price: plan.price,
          depositAmount: 0, // 默认值
          duration: parseInt(plan.duration) || 8, // 从字符串提取小时数
          includes: plan.features,
          isActive: plan.isActive,
        }
      });

      console.log(`✅ 导入套餐: ${plan.name}`);
    } catch (error) {
      console.error(`❌ 导入套餐 "${plan.name}" 失败:`, error.message);
    }
  }

  console.log('\n✅ 导入完成！');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
