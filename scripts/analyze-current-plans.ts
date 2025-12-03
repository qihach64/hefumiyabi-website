import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeCurrentData() {
  console.log('📊 分析现有套餐数据...\n');

  // 1. 套餐总览
  const plans = await prisma.rentalPlan.findMany({
    include: {
      planTags: {
        include: {
          tag: true,
        },
      },
      theme: true,
      merchant: true,
    },
    orderBy: { category: 'asc' },
  });

  console.log(`📦 总套餐数: ${plans.length}`);
  console.log(`   - 活跃套餐: ${plans.filter(p => p.isActive).length}`);
  console.log(`   - 活动套餐: ${plans.filter(p => p.isCampaign).length}`);
  console.log(`   - 精选套餐: ${plans.filter(p => p.isFeatured).length}\n`);

  // 2. 按类别统计
  const byCategory = plans.reduce((acc, plan) => {
    acc[plan.category] = (acc[plan.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📂 按类别统计:');
  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}`);
  });
  console.log();

  // 3. 价格分布
  const prices = plans.map(p => p.price / 100);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  console.log('💰 价格分布:');
  console.log(`   最低: ¥${minPrice.toLocaleString()}`);
  console.log(`   最高: ¥${maxPrice.toLocaleString()}`);
  console.log(`   平均: ¥${avgPrice.toLocaleString()}\n`);

  // 4. 标签使用情况
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { plans: true },
      },
      category: true,
    },
    orderBy: { order: 'asc' },
  });

  console.log(`🏷️  总标签数: ${tags.length}`);

  const tagsByCategory = tags.reduce((acc, tag) => {
    const categoryName = tag.category?.name || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push({ name: tag.name, count: tag._count.plans });
    return acc;
  }, {} as Record<string, Array<{ name: string; count: number }>>);

  console.log('\n标签分类统计:');
  Object.entries(tagsByCategory).forEach(([category, tagList]) => {
    console.log(`\n${category} (${tagList.length}个标签):`);
    tagList.forEach(tag => {
      console.log(`   ${tag.name}: ${tag.count}个套餐`);
    });
  });

  // 5. 主题使用情况
  const themes = await prisma.theme.findMany({
    include: {
      _count: {
        select: { plans: true },
      },
    },
  });

  console.log(`\n🎨 主题系统:`);
  console.log(`   总主题数: ${themes.length}`);
  themes.forEach(theme => {
    console.log(`   - ${theme.name} (${theme.code}): ${theme._count.plans}个套餐`);
  });

  // 6. 套餐详细列表（前20个）
  console.log('\n\n📋 套餐详细列表 (前20个):');
  console.log('─'.repeat(120));
  console.log('ID'.padEnd(8) + 'Name'.padEnd(35) + 'Category'.padEnd(10) + 'Price'.padEnd(12) + 'Tags'.padEnd(30) + 'Theme');
  console.log('─'.repeat(120));

  plans.slice(0, 20).forEach(plan => {
    const id = plan.id.slice(0, 7);
    const name = plan.name.slice(0, 33);
    const category = plan.category;
    const price = `¥${(plan.price / 100).toLocaleString()}`;
    const tagNames = plan.planTags.map(pt => pt.tag.name).slice(0, 2).join(', ');
    const theme = plan.theme?.name || '-';

    console.log(
      id.padEnd(8) +
      name.padEnd(35) +
      category.padEnd(10) +
      price.padEnd(12) +
      tagNames.padEnd(30) +
      theme
    );
  });

  // 7. 冗余分析
  console.log('\n\n⚠️  潜在问题分析:');

  // 检查重复名称
  const nameCount = plans.reduce((acc, plan) => {
    acc[plan.name] = (acc[plan.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const duplicateNames = Object.entries(nameCount).filter(([_, count]) => count > 1);
  if (duplicateNames.length > 0) {
    console.log(`\n   ❌ 重复名称 (${duplicateNames.length}个):`);
    duplicateNames.forEach(([name, count]) => {
      console.log(`      "${name}" x${count}`);
    });
  }

  // 检查未使用的标签
  const unusedTags = tags.filter(t => t._count.plans === 0);
  if (unusedTags.length > 0) {
    console.log(`\n   ⚠️  未使用的标签 (${unusedTags.length}个):`);
    unusedTags.slice(0, 10).forEach(tag => {
      console.log(`      ${tag.name} (${tag.category?.name || 'N/A'})`);
    });
  }

  // 检查无标签的套餐
  const noTagPlans = plans.filter(p => p.planTags.length === 0);
  if (noTagPlans.length > 0) {
    console.log(`\n   ⚠️  无标签的套餐 (${noTagPlans.length}个):`);
    noTagPlans.slice(0, 10).forEach(plan => {
      console.log(`      ${plan.name} (${plan.category})`);
    });
  }

  await prisma.$disconnect();
}

analyzeCurrentData().catch(console.error);
