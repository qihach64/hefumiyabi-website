/**
 * 检查套餐数据中缺失的图片和价格
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMissingData() {
  console.log('🔍 检查套餐数据...\n');

  const allPlans = await prisma.rentalPlan.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      isCampaign: true,
    },
  });

  console.log(`📊 总套餐数: ${allPlans.length}\n`);

  // 检查价格缺失
  const missingPrice = allPlans.filter(p => !p.price || p.price === 0);
  console.log(`❌ 缺少价格的套餐: ${missingPrice.length}`);
  if (missingPrice.length > 0) {
    missingPrice.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name}: price=${p.price}`);
    });
    if (missingPrice.length > 5) {
      console.log(`   ... 还有 ${missingPrice.length - 5} 个\n`);
    }
  }

  // 检查图片缺失
  const missingImage = allPlans.filter(p => !p.imageUrl);
  console.log(`\n❌ 缺少图片的套餐: ${missingImage.length}`);
  if (missingImage.length > 0) {
    missingImage.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name}`);
    });
    if (missingImage.length > 5) {
      console.log(`   ... 还有 ${missingImage.length - 5} 个\n`);
    }
  }

  // 检查原价缺失
  const missingOriginalPrice = allPlans.filter(p => !p.originalPrice);
  console.log(`\n⚠️  缺少原价的套餐: ${missingOriginalPrice.length}`);
  if (missingOriginalPrice.length > 0) {
    missingOriginalPrice.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name}`);
    });
  }

  // 检查数据完整的套餐
  const complete = allPlans.filter(p => p.price && p.imageUrl && p.originalPrice);
  console.log(`\n✅ 数据完整的套餐: ${complete.length}`);

  // 按活动类型统计
  const campaignPlans = allPlans.filter(p => p.isCampaign);
  const regularPlans = allPlans.filter(p => !p.isCampaign);
  
  console.log(`\n📈 套餐统计:`);
  console.log(`   - 活动套餐: ${campaignPlans.length}`);
  console.log(`   - 常规套餐: ${regularPlans.length}`);

  await prisma.$disconnect();
}

checkMissingData()
  .catch(console.error);

