/**
 * 清空所有套餐数据
 * 使用方法: node scripts/clear-plans.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearPlans() {
  console.log('🗑️  开始清空套餐数据...\n');

  try {
    // 先统计数量
    const count = await prisma.rentalPlan.count();
    console.log(`📊 当前数据库中有 ${count} 个套餐\n`);

    if (count === 0) {
      console.log('✅ 数据库已经是空的，无需清空');
      return;
    }

    // 删除所有套餐
    const result = await prisma.rentalPlan.deleteMany({});

    console.log(`✅ 成功删除 ${result.count} 个套餐`);
    console.log('🎉 数据库已清空！\n');

  } catch (error) {
    console.error('❌ 清空失败:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await clearPlans();
  } catch (error) {
    console.error('\n❌ 操作失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { clearPlans };
