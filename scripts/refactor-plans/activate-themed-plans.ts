#!/usr/bin/env tsx
/**
 * 激活所有有主题的套餐
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function activateThemedPlans() {
  console.log('🔄 开始激活有主题的套餐...\n');

  // 1. 查询当前状态
  const inactivePlansWithTheme = await prisma.rentalPlan.findMany({
    where: {
      themeId: { not: null },
      isActive: false,
    },
    include: {
      theme: true,
    },
  });

  console.log(`📊 找到 ${inactivePlansWithTheme.length} 个未激活但有主题的套餐\n`);

  if (inactivePlansWithTheme.length === 0) {
    console.log('✅ 所有有主题的套餐都已激活!');
    await prisma.$disconnect();
    return;
  }

  // 2. 激活这些套餐
  console.log('🚀 正在激活...');
  const updateResult = await prisma.rentalPlan.updateMany({
    where: {
      themeId: { not: null },
      isActive: false,
    },
    data: {
      isActive: true,
    },
  });

  console.log(`✓ 已激活 ${updateResult.count} 个套餐\n`);

  // 3. 显示激活的套餐列表
  console.log('📋 激活的套餐:');
  inactivePlansWithTheme.forEach(plan => {
    console.log(`  ✓ [${plan.theme?.name}] ${plan.name}`);
  });

  // 4. 统计最终状态
  console.log('\n📊 最终统计:');
  const totalActive = await prisma.rentalPlan.count({
    where: { isActive: true },
  });

  const activeWithTheme = await prisma.rentalPlan.count({
    where: {
      isActive: true,
      themeId: { not: null },
    },
  });

  const activeWithoutTheme = await prisma.rentalPlan.count({
    where: {
      isActive: true,
      themeId: null,
    },
  });

  console.log(`  总活跃套餐: ${totalActive} 个`);
  console.log(`  - 有主题: ${activeWithTheme} 个`);
  console.log(`  - 无主题: ${activeWithoutTheme} 个`);

  await prisma.$disconnect();
  console.log('\n✅ 激活完成!');
}

activateThemedPlans().catch(error => {
  console.error('❌ 激活失败:', error);
  process.exit(1);
});
