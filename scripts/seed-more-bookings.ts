import { PrismaClient, BookingStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// 生成未来30天的随机日期
function randomFutureDate(daysAhead: number = 30) {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * daysAhead);
  const date = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);
  return date;
}

// 随机选择
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 时间段
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

// 示例客户名
const customerNames = [
  '张伟', '王芳', '李娜', '刘强', '陈静',
  '杨洋', '赵敏', '孙婷', '周杰', '吴磊',
  '田中花子', '佐藤真理', '山田太郎', '小林美咲', '高橋智子',
  'Sarah Lee', 'Mike Chen', 'Emma Wang', 'David Liu', 'Sophie Zhang',
];

async function seedMoreBookings() {
  console.log('🚀 开始生成更多预约数据...\n');

  try {
    // 获取用户
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('❌ 没有找到用户');
      return;
    }

    // 获取套餐
    const plans = await prisma.rentalPlan.findMany({
      where: { isActive: true },
      take: 15,
    });
    if (plans.length === 0) {
      console.log('❌ 没有找到套餐');
      return;
    }

    // 获取店铺
    const stores = await prisma.store.findMany();
    if (stores.length === 0) {
      console.log('❌ 没有找到店铺');
      return;
    }

    console.log(`👤 找到 ${users.length} 个用户`);
    console.log(`📦 找到 ${plans.length} 个套餐`);
    console.log(`🏪 找到 ${stores.length} 个店铺\n`);

    let created = 0;

    // 生成50个新预约
    for (let i = 0; i < 50; i++) {
      const user = randomChoice(users);
      const plan = randomChoice(plans);
      const store = randomChoice(stores);
      const visitDate = randomFutureDate(30);
      const visitTime = randomChoice(timeSlots);
      const customerName = randomChoice(customerNames);

      // 随机状态（更多确认状态）
      const statusPool = [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.CONFIRMED,
        BookingStatus.CONFIRMED,
        BookingStatus.CONFIRMED,
      ];
      const status = randomChoice(statusPool);

      try {
        await prisma.booking.create({
          data: {
            userId: user.id,
            guestName: customerName,
            guestEmail: user.email,
            guestPhone: user.phone,
            totalAmount: plan.price,
            depositAmount: Math.floor(plan.price * 0.3),
            paidAmount: 0,
            paymentStatus: PaymentStatus.PENDING,
            status: status,
            visitDate: visitDate,
            visitTime: visitTime,
            items: {
              create: {
                storeId: store.id,
                type: 'plan',
                planId: plan.id,
                quantity: 1,
                unitPrice: plan.price,
                totalPrice: plan.price,
                addOns: [],
              },
            },
          },
        });

        created++;

        if (created % 10 === 0) {
          console.log(`✅ 已创建 ${created} 个预约...`);
        }
      } catch (error) {
        console.error(`❌ 创建预约失败:`, error);
      }
    }

    console.log(`\n✨ 成功创建 ${created} 个预约！\n`);

    // 统计
    const totalBookings = await prisma.booking.count();
    const futureBookings = await prisma.booking.count({
      where: {
        visitDate: {
          gte: new Date(),
        },
      },
    });

    console.log('📊 预约统计:');
    console.log(`   - 总预约数: ${totalBookings}`);
    console.log(`   - 未来预约: ${futureBookings}`);

    // 按日期分组统计
    const bookingsByDate = await prisma.booking.groupBy({
      by: ['visitDate'],
      _count: {
        id: true,
      },
      where: {
        visitDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        visitDate: 'asc',
      },
      take: 10,
    });

    console.log('\n📅 最近10天的预约分布:');
    bookingsByDate.forEach((item) => {
      const date = new Date(item.visitDate);
      console.log(`   - ${date.getMonth() + 1}/${date.getDate()}: ${item._count.id} 个预约`);
    });

  } catch (error) {
    console.error('❌ 生成失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
seedMoreBookings()
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
