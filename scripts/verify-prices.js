/**
 * 验证数据库中的价格数据
 * 使用方法: node scripts/verify-prices.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyPrices() {
  console.log('🔍 验证数据库中的价格数据...\n');

  try {
    // 查询所有套餐
    const plans = await prisma.rentalPlan.findMany({
      select: {
        name: true,
        price: true,
        originalPrice: true,
      },
      orderBy: {
        price: 'asc'
      },
      take: 10
    });

    console.log('📊 前10个套餐的价格信息：\n');
    console.log('套餐名称 | 线上价(分) | 原价(分) | 优惠幅度');
    console.log(''.padEnd(80, '-'));

    plans.forEach(plan => {
      const price = (plan.price / 100).toFixed(2);
      const originalPrice = plan.originalPrice ? (plan.originalPrice / 100).toFixed(2) : 'N/A';
      const discount = plan.originalPrice 
        ? `${(((plan.originalPrice - plan.price) / plan.originalPrice) * 100).toFixed(0)}%` 
        : 'N/A';
      
      console.log(`${plan.name.substring(0, 30).padEnd(32)} | ¥${price.padStart(7)} | ¥${originalPrice.padStart(7)} | ${discount.padStart(6)}`);
    });

    // 统计数据
    const stats = await prisma.rentalPlan.aggregate({
      _count: {
        originalPrice: true
      },
      _avg: {
        price: true,
        originalPrice: true
      },
      _min: {
        price: true,
        originalPrice: true
      },
      _max: {
        price: true,
        originalPrice: true
      }
    });

    const total = await prisma.rentalPlan.count();

    console.log('\n📈 统计信息：');
    console.log(`   总套餐数: ${total}`);
    console.log(`   有原价的套餐: ${stats._count.originalPrice}`);
    console.log(`   平均线上价: ¥${(stats._avg.price / 100).toFixed(2)}`);
    console.log(`   平均原价: ¥${(stats._avg.originalPrice / 100).toFixed(2)}`);
    console.log(`   最低线上价: ¥${(stats._min.price / 100).toFixed(2)}`);
    console.log(`   最高线上价: ¥${(stats._max.price / 100).toFixed(2)}`);
    console.log(`   最低原价: ¥${(stats._min.originalPrice / 100).toFixed(2)}`);
    console.log(`   最高原价: ¥${(stats._max.originalPrice / 100).toFixed(2)}`);

    console.log('\n✅ 验证完成！');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPrices();

