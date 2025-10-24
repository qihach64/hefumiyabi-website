const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const planCount = await prisma.rentalPlan.count();
    console.log('Total rental plans:', planCount);

    const activePlans = await prisma.rentalPlan.count({
      where: { isActive: true }
    });
    console.log('Active plans:', activePlans);

    // 显示前5个套餐
    const samplePlans = await prisma.rentalPlan.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        storeName: true,
        region: true,
        isActive: true,
        price: true,
        imageUrl: true
      }
    });
    console.log('\nSample plans:', JSON.stringify(samplePlans, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
