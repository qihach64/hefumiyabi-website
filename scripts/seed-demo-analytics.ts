import { PrismaClient, Language, BookingStatus, PaymentStatus, Gender } from '@prisma/client';

const prisma = new PrismaClient();

// 随机生成日期（最近3个月内）
function randomDate(daysAgo: number = 90) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

// 随机选择数组中的元素
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 生成随机手机号
function randomPhone() {
  const prefixes = ['080', '090', '070'];
  const prefix = randomChoice(prefixes);
  const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}-${number.slice(0, 4)}-${number.slice(4)}`;
}

// 示例用户数据
const demoUsers = [
  { name: '张三', email: 'zhang.san@example.com', language: Language.ZH, gender: Gender.MALE },
  { name: '李四', email: 'li.si@example.com', language: Language.ZH, gender: Gender.FEMALE },
  { name: '王五', email: 'wang.wu@example.com', language: Language.ZH, gender: Gender.MALE },
  { name: '田中太郎', email: 'tanaka@example.jp', language: Language.JA, gender: Gender.MALE },
  { name: '佐藤花子', email: 'sato@example.jp', language: Language.JA, gender: Gender.FEMALE },
  { name: '山田一郎', email: 'yamada@example.jp', language: Language.JA, gender: Gender.MALE },
  { name: 'John Smith', email: 'john@example.com', language: Language.EN, gender: Gender.MALE },
  { name: 'Emily Brown', email: 'emily@example.com', language: Language.EN, gender: Gender.FEMALE },
  { name: '赵六', email: 'zhao.liu@example.com', language: Language.ZH, gender: Gender.FEMALE },
  { name: '陈七', email: 'chen.qi@example.com', language: Language.ZH, gender: Gender.MALE },
  { name: '刘八', email: 'liu.ba@example.com', language: Language.ZH, gender: Gender.FEMALE },
  { name: '小林美咲', email: 'kobayashi@example.jp', language: Language.JA, gender: Gender.FEMALE },
  { name: 'Sarah Johnson', email: 'sarah@example.com', language: Language.EN, gender: Gender.FEMALE },
  { name: '吴九', email: 'wu.jiu@example.com', language: Language.ZH, gender: Gender.MALE },
  { name: '周十', email: 'zhou.shi@example.com', language: Language.ZH, gender: Gender.FEMALE },
];

async function seedDemoData() {
  console.log('🚀 开始生成演示数据...\n');

  try {
    // 1. 创建演示用户
    console.log('👤 创建演示用户...');
    const createdUsers = [];

    for (const userData of demoUsers) {
      // 检查用户是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`   - 跳过已存在用户: ${userData.name}`);
        createdUsers.push(existingUser);
        continue;
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          phone: randomPhone(),
          createdAt: randomDate(90), // 最近3个月内注册
        },
      });
      createdUsers.push(user);
      console.log(`   ✅ 创建用户: ${user.name} (${user.language})`);
    }

    // 2. 获取一些活跃的租赁套餐
    console.log('\n📦 获取活跃套餐...');
    const activePlans = await prisma.rentalPlan.findMany({
      where: { isActive: true },
      take: 10,
    });

    if (activePlans.length === 0) {
      console.log('❌ 没有找到活跃套餐，请先导入套餐数据');
      return;
    }
    console.log(`   找到 ${activePlans.length} 个活跃套餐`);

    // 3. 获取店铺
    console.log('\n🏪 获取店铺信息...');
    const stores = await prisma.store.findMany();
    if (stores.length === 0) {
      console.log('❌ 没有找到店铺，请先创建店铺数据');
      return;
    }
    console.log(`   找到 ${stores.length} 个店铺`);

    // 4. 创建演示预约
    console.log('\n📅 创建演示预约...');
    const bookingStatuses = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ];

    let bookingCount = 0;

    // 为每个用户创建1-3个预约
    for (const user of createdUsers) {
      const numBookings = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numBookings; i++) {
        const plan = randomChoice(activePlans);
        const store = randomChoice(stores);
        const status = randomChoice(bookingStatuses);
        const visitDate = randomDate(60); // 60天内

        const booking = await prisma.booking.create({
          data: {
            userId: user.id,
            guestName: user.name,
            guestEmail: user.email,
            guestPhone: user.phone,
            totalAmount: plan.price,
            depositAmount: Math.floor(plan.price * 0.3), // 30% 押金
            paidAmount: status === BookingStatus.COMPLETED ? plan.price : 0,
            paymentStatus: status === BookingStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.PENDING,
            status: status,
            visitDate: visitDate,
            visitTime: randomChoice(['09:00', '10:00', '11:00', '13:00', '14:00', '15:00']),
            createdAt: randomDate(90),
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

        bookingCount++;
      }
    }

    console.log(`   ✅ 创建了 ${bookingCount} 个预约`);

    // 5. 统计信息
    console.log('\n📊 数据统计:');
    const stats = await prisma.user.count();
    const bookings = await prisma.booking.count();
    const pending = await prisma.booking.count({ where: { status: BookingStatus.PENDING } });

    console.log(`   - 总用户数: ${stats}`);
    console.log(`   - 总预约数: ${bookings}`);
    console.log(`   - 待确认预约: ${pending}`);

    // 6. 语言分布
    const langDist = await prisma.user.groupBy({
      by: ['language'],
      _count: { language: true },
    });
    console.log('\n🌍 语言分布:');
    langDist.forEach(l => {
      const langNames: Record<string, string> = { ZH: '中文', JA: '日语', EN: '英语' };
      console.log(`   - ${langNames[l.language] || l.language}: ${l._count.language} 人`);
    });

    console.log('\n✨ 演示数据生成完成！');
    console.log('📝 访问 /admin/analytics 查看数据统计\n');

  } catch (error) {
    console.error('❌ 生成失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
seedDemoData()
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
