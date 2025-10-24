const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const listingCount = await prisma.listing.count();
    console.log('Total listings:', listingCount);

    const activeListings = await prisma.listing.count({
      where: { isActive: true }
    });
    console.log('Active listings:', activeListings);

    const approvedListings = await prisma.listing.count({
      where: { status: 'APPROVED' }
    });
    console.log('Approved listings:', approvedListings);

    const activeAndApproved = await prisma.listing.count({
      where: {
        isActive: true,
        status: 'APPROVED'
      }
    });
    console.log('Active AND Approved listings:', activeAndApproved);

    // 显示前5个套餐
    const sampleListings = await prisma.listing.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        isActive: true
      }
    });
    console.log('\nSample listings:', JSON.stringify(sampleListings, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
