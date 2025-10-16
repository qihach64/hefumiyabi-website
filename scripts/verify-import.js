const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 总数
  const total = await prisma.rentalPlan.count();
  console.log(`📊 数据库中共有 ${total} 个套餐\n`);

  // 按分类统计
  const byCategory = await prisma.rentalPlan.groupBy({
    by: ['category'],
    _count: {
      id: true
    }
  });

  console.log('📋 按分类统计:');
  byCategory.sort((a, b) => b._count.id - a._count.id).forEach(({ category, _count }) => {
    console.log(`   ${category.padEnd(10)} ${_count.id} 个`);
  });

  // 价格统计
  const priceStats = await prisma.rentalPlan.aggregate({
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true }
  });

  console.log('\n💰 价格统计（人民币）:');
  console.log(`   最低价: ¥${(priceStats._min.price / 100).toFixed(2)}`);
  console.log(`   最高价: ¥${(priceStats._max.price / 100).toFixed(2)}`);
  console.log(`   平均价: ¥${(priceStats._avg.price / 100).toFixed(2)}`);

  // 最便宜的5个
  console.log('\n💵 最便宜的5个套餐:');
  const cheapest = await prisma.rentalPlan.findMany({
    take: 5,
    orderBy: { price: 'asc' },
    select: { name: true, price: true, category: true }
  });

  cheapest.forEach((plan, i) => {
    console.log(`   ${i + 1}. ${plan.name.substring(0, 40)}`);
    console.log(`      ¥${(plan.price / 100).toFixed(2)} | ${plan.category}`);
  });

  // 最贵的5个
  console.log('\n💎 最贵的5个套餐:');
  const expensive = await prisma.rentalPlan.findMany({
    take: 5,
    orderBy: { price: 'desc' },
    select: { name: true, price: true, category: true }
  });

  expensive.forEach((plan, i) => {
    console.log(`   ${i + 1}. ${plan.name.substring(0, 40)}`);
    console.log(`      ¥${(plan.price / 100).toFixed(2)} | ${plan.category}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
