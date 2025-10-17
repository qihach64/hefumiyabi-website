/**
 * 清空所有预约数据
 * 使用方法: node scripts/clear-bookings.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearBookings() {
  console.log('🗑️  开始清空预约数据...\n');

  try {
    // 先统计数量
    const bookingCount = await prisma.booking.count();
    const itemCount = await prisma.bookingItem.count();

    console.log(`📊 当前数据库统计:`);
    console.log(`   - 预约记录: ${bookingCount} 条`);
    console.log(`   - 预约项目: ${itemCount} 条\n`);

    if (bookingCount === 0) {
      console.log('✅ 数据库已经是空的，无需清空');
      return;
    }

    // 删除所有预约（会级联删除关联的 BookingItem）
    const result = await prisma.booking.deleteMany({});

    console.log(`✅ 成功删除 ${result.count} 条预约记录`);
    console.log('🎉 预约数据库已清空！\n');

  } catch (error) {
    console.error('❌ 清空失败:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await clearBookings();
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

module.exports = { clearBookings };
