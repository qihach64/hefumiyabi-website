/**
 * 分析当前标签和套餐数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 分析标签和套餐数据...\n');

  // 1. 查看标签分类
  console.log('=== 标签分类 ===');
  const categories = await prisma.tagCategory.findMany({
    include: {
      tags: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  for (const cat of categories) {
    console.log(`\n📁 ${cat.name} (${cat.code}):`);
    for (const tag of cat.tags) {
      console.log(`   ${tag.icon || '•'} ${tag.name} [${tag.code}] - 使用: ${tag.usageCount}次`);
    }
  }

  // 2. 查看上架套餐
  console.log('\n\n=== 上架套餐 ===');
  const activePlans = await prisma.rentalPlan.findMany({
    where: { isActive: true },
    include: {
      planTags: {
        include: {
          tag: true,
        },
      },
      theme: true,
    },
    orderBy: { price: 'asc' },
  });

  console.log(`\n找到 ${activePlans.length} 个上架套餐:\n`);

  for (const plan of activePlans) {
    const tags = plan.planTags.map(pt => pt.tag.name).join(', ') || '无标签';
    const theme = plan.theme?.name || '无主题';
    console.log(`${plan.name}`);
    console.log(`   价格: ¥${plan.price / 100} | 分类: ${plan.category} | 主题: ${theme}`);
    console.log(`   标签: ${tags}`);
    console.log(`   描述: ${plan.description?.slice(0, 50)}...`);
    console.log('');
  }

  // 3. 统计无标签套餐
  const plansWithoutTags = activePlans.filter(p => p.planTags.length === 0);
  console.log(`\n⚠️  无标签套餐: ${plansWithoutTags.length}/${activePlans.length}`);

  // 4. 分析套餐特征
  console.log('\n\n=== 套餐特征分析 ===');

  // 按价格分布
  const priceRanges = {
    economy: activePlans.filter(p => p.price / 100 < 200),
    standard: activePlans.filter(p => p.price / 100 >= 200 && p.price / 100 < 400),
    premium: activePlans.filter(p => p.price / 100 >= 400 && p.price / 100 < 600),
    luxury: activePlans.filter(p => p.price / 100 >= 600),
  };

  console.log('\n💰 价格分布:');
  console.log(`   经济型 (<¥200): ${priceRanges.economy.length}个`);
  console.log(`   标准型 (¥200-400): ${priceRanges.standard.length}个`);
  console.log(`   高级型 (¥400-600): ${priceRanges.premium.length}个`);
  console.log(`   奢华型 (≥¥600): ${priceRanges.luxury.length}个`);

  // 按分类分布
  const categoryCount: Record<string, number> = {};
  for (const plan of activePlans) {
    categoryCount[plan.category] = (categoryCount[plan.category] || 0) + 1;
  }

  console.log('\n👔 分类分布:');
  for (const [cat, count] of Object.entries(categoryCount)) {
    console.log(`   ${cat}: ${count}个`);
  }

  // 分析描述关键词
  console.log('\n🔍 描述关键词分析:');
  const keywords = {
    '情侣': activePlans.filter(p => p.description?.includes('情侣') || p.name.includes('情侣')),
    '写真': activePlans.filter(p => p.description?.includes('写真') || p.name.includes('写真')),
    '散步': activePlans.filter(p => p.description?.includes('散步') || p.name.includes('散步')),
    '拍照': activePlans.filter(p => p.description?.includes('拍照') || p.name.includes('拍照')),
    '化妆': activePlans.filter(p => p.description?.includes('化妆') || p.includes?.some(i => i.includes('化妆'))),
    '发型': activePlans.filter(p => p.description?.includes('发型') || p.includes?.some(i => i.includes('发型'))),
    '摄影': activePlans.filter(p => p.description?.includes('摄影') || p.includes?.some(i => i.includes('摄影'))),
  };

  for (const [keyword, plans] of Object.entries(keywords)) {
    if (plans.length > 0) {
      console.log(`   "${keyword}": ${plans.length}个套餐`);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
