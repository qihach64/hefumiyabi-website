#!/usr/bin/env tsx
/**
 * 验证导入后的数据完整性
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  console.log('✅ 开始验证数据...\n');

  let issues = 0;

  // 1. 检查活跃套餐数量
  console.log('📦 检查套餐数据...');
  const activePlans = await prisma.rentalPlan.findMany({
    where: { isActive: true },
    include: {
      planTags: {
        include: {
          tag: {
            include: {
              category: true,
            },
          },
        },
      },
      theme: true,
    },
  });

  console.log(`   活跃套餐: ${activePlans.length} 个`);

  if (activePlans.length === 0) {
    console.log('   ❌ 没有活跃套餐!');
    issues++;
  } else if (activePlans.length > 25) {
    console.log(`   ⚠️  活跃套餐过多 (${activePlans.length}),是否符合预期?`);
  } else {
    console.log('   ✓ 套餐数量正常');
  }

  // 2. 检查无标签的套餐
  console.log('\n🏷️  检查标签关联...');
  const noTagPlans = activePlans.filter(p => p.planTags.length === 0);

  if (noTagPlans.length > 0) {
    console.log(`   ❌ 发现 ${noTagPlans.length} 个无标签套餐:`);
    noTagPlans.forEach(p => {
      console.log(`      - ${p.name} (${p.id})`);
    });
    issues++;
  } else {
    console.log('   ✓ 所有套餐都有标签');
  }

  // 3. 检查标签数量分布
  const tagCounts = activePlans.map(p => p.planTags.length);
  const avgTags = tagCounts.reduce((a, b) => a + b, 0) / tagCounts.length;
  const minTags = Math.min(...tagCounts);
  const maxTags = Math.max(...tagCounts);

  console.log(`   每个套餐的标签数: 最少${minTags}, 最多${maxTags}, 平均${avgTags.toFixed(1)}`);

  if (minTags < 2) {
    console.log(`   ⚠️  部分套餐标签过少 (少于2个)`);
  }

  // 4. 检查无主题的套餐
  console.log('\n🎨 检查主题关联...');
  const noThemePlans = activePlans.filter(p => !p.themeId);

  if (noThemePlans.length > 0) {
    console.log(`   ❌ 发现 ${noThemePlans.length} 个无主题套餐:`);
    noThemePlans.forEach(p => {
      console.log(`      - ${p.name} (${p.id})`);
    });
    issues++;
  } else {
    console.log('   ✓ 所有套餐都关联主题');
  }

  // 5. 检查主题分布
  console.log('\n📊 主题分布:');
  const themes = await prisma.theme.findMany({
    include: {
      _count: {
        select: {
          plans: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  themes.forEach(theme => {
    const count = theme._count.plans;
    const status = count === 0 ? '⚠️ ' : '  ';
    console.log(`   ${status}${theme.name}: ${count} 个套餐`);
  });

  // 6. 检查标签使用情况
  console.log('\n🔖 标签使用统计:');
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { plans: true },
      },
      category: true,
    },
    orderBy: {
      category: { order: 'asc' },
    },
  });

  const unusedTags = tags.filter(t => t._count.plans === 0);
  const wellUsedTags = tags.filter(t => t._count.plans >= 3);

  console.log(`   总标签数: ${tags.length}`);
  console.log(`   未使用: ${unusedTags.length} 个`);
  console.log(`   使用≥3次: ${wellUsedTags.length} 个`);

  if (unusedTags.length > 20) {
    console.log(`   ⚠️  未使用标签过多 (${unusedTags.length}个),建议review`);
  }

  // 按分类统计
  const categoryUsage = new Map<string, { total: number; used: number }>();
  tags.forEach(tag => {
    const catName = tag.category.name;
    const current = categoryUsage.get(catName) || { total: 0, used: 0 };
    current.total++;
    if (tag._count.plans > 0) current.used++;
    categoryUsage.set(catName, current);
  });

  console.log('\n   按分类统计:');
  Array.from(categoryUsage.entries()).forEach(([cat, stats]) => {
    const usage = ((stats.used / stats.total) * 100).toFixed(0);
    console.log(`   ${cat}: ${stats.used}/${stats.total} 使用 (${usage}%)`);
  });

  // 7. 检查价格合理性
  console.log('\n💰 价格检查:');
  const prices = activePlans.map(p => p.price / 100);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  console.log(`   最低价: ¥${minPrice.toLocaleString()}`);
  console.log(`   最高价: ¥${maxPrice.toLocaleString()}`);
  console.log(`   平均价: ¥${avgPrice.toLocaleString()}`);

  if (minPrice < 1000) {
    console.log(`   ⚠️  存在价格过低的套餐 (¥${minPrice})`);
  }

  // 8. 检查必填字段
  console.log('\n📝 必填字段检查:');
  const missingFields = activePlans.filter(
    p =>
      !p.name ||
      !p.description ||
      !p.category ||
      p.price <= 0 ||
      p.includes.length === 0
  );

  if (missingFields.length > 0) {
    console.log(`   ❌ 发现 ${missingFields.length} 个套餐缺少必填字段:`);
    missingFields.forEach(p => {
      const missing = [];
      if (!p.name) missing.push('名称');
      if (!p.description) missing.push('描述');
      if (!p.category) missing.push('分类');
      if (p.price <= 0) missing.push('价格');
      if (p.includes.length === 0) missing.push('包含服务');
      console.log(`      - ${p.name || p.id}: 缺少 ${missing.join(', ')}`);
    });
    issues++;
  } else {
    console.log('   ✓ 所有套餐必填字段完整');
  }

  // 9. 检查slug唯一性
  console.log('\n🔗 Slug唯一性检查:');
  const slugs = activePlans.map(p => p.slug);
  const duplicateSlugs = slugs.filter(
    (slug, index) => slugs.indexOf(slug) !== index
  );

  if (duplicateSlugs.length > 0) {
    console.log(`   ❌ 发现重复slug: ${duplicateSlugs.join(', ')}`);
    issues++;
  } else {
    console.log('   ✓ 所有slug唯一');
  }

  // 总结
  console.log('\n' + '='.repeat(60));
  if (issues === 0) {
    console.log('✅ 数据验证通过! 未发现严重问题。');
  } else {
    console.log(`⚠️  发现 ${issues} 个需要修复的问题。`);
  }
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

verifyData().catch(error => {
  console.error('❌ 验证失败:', error);
  process.exit(1);
});
