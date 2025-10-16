/**
 * 清空数据库中的所有套餐数据
 * 使用方法: node scripts/clear-plans.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearPlans() {
  console.log('🗑️  开始清空套餐数据...\n');

  try {
    // 删除所有租赁套餐
    const result = await prisma.rentalPlan.deleteMany({});
    
    console.log(`✅ 已删除 ${result.count} 个套餐\n`);
    console.log('✨ 数据库已清空，可以重新导入数据');
    
  } catch (error) {
    console.error('❌ 清空失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearPlans();

