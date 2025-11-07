/**
 * Demo标签系统种子数据
 * 用于快速演示标签管理功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子标签数据...\n');

  // 清理现有数据（demo环境）
  console.log('清理现有标签数据...');
  await prisma.planTag.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.tagCategory.deleteMany({});

  // 1. 创建标签分类
  console.log('\n📁 创建标签分类...');

  const sceneCategory = await prisma.tagCategory.create({
    data: {
      code: 'scene',
      name: '使用场景',
      nameEn: 'Scene',
      description: '和服体验的场景分类',
      icon: '📍',
      color: '#3b82f6',
      order: 1,
      showInFilter: true,
      filterOrder: 1,
    },
  });
  console.log(`✅ 创建分类: ${sceneCategory.name}`);

  const serviceCategory = await prisma.tagCategory.create({
    data: {
      code: 'service_level',
      name: '服务等级',
      nameEn: 'Service Level',
      description: '包含的服务项目等级',
      icon: '⭐',
      color: '#f59e0b',
      order: 2,
      showInFilter: true,
      filterOrder: 2,
    },
  });
  console.log(`✅ 创建分类: ${serviceCategory.name}`);

  // 2. 创建标签
  console.log('\n🏷️  创建标签...');

  // 场景标签
  const sceneTags = await Promise.all([
    prisma.tag.create({
      data: {
        categoryId: sceneCategory.id,
        code: 'casual_walk',
        name: '街拍漫步',
        nameEn: 'Casual Walk',
        icon: '📸',
        order: 1,
      },
    }),
    prisma.tag.create({
      data: {
        categoryId: sceneCategory.id,
        code: 'temple_visit',
        name: '寺庙参拜',
        nameEn: 'Temple Visit',
        icon: '⛩️',
        order: 2,
      },
    }),
    prisma.tag.create({
      data: {
        categoryId: sceneCategory.id,
        code: 'date',
        name: '浪漫约会',
        nameEn: 'Date',
        icon: '💕',
        order: 3,
      },
    }),
    prisma.tag.create({
      data: {
        categoryId: sceneCategory.id,
        code: 'photoshoot',
        name: '专业写真',
        nameEn: 'Photoshoot',
        icon: '📷',
        order: 4,
      },
    }),
  ]);
  console.log(`✅ 创建 ${sceneTags.length} 个场景标签`);

  // 服务标签
  const serviceTags = await Promise.all([
    prisma.tag.create({
      data: {
        categoryId: serviceCategory.id,
        code: 'basic',
        name: '经济实惠',
        nameEn: 'Budget',
        icon: '💰',
        order: 1,
      },
    }),
    prisma.tag.create({
      data: {
        categoryId: serviceCategory.id,
        code: 'standard',
        name: '标准套餐',
        nameEn: 'Standard',
        icon: '✨',
        order: 2,
      },
    }),
    prisma.tag.create({
      data: {
        categoryId: serviceCategory.id,
        code: 'premium',
        name: '豪华尊享',
        nameEn: 'Premium',
        icon: '👑',
        order: 3,
      },
    }),
  ]);
  console.log(`✅ 创建 ${serviceTags.length} 个服务标签`);

  // 3. 为部分套餐添加标签（demo数据）
  console.log('\n🔗 为套餐添加标签...');

  // 获取前10个套餐
  const plans = await prisma.rentalPlan.findMany({
    take: 10,
    orderBy: { createdAt: 'asc' },
  });

  if (plans.length > 0) {
    let taggedCount = 0;

    for (const plan of plans) {
      // 根据价格自动分配服务等级标签
      const priceInYuan = plan.price / 100;
      let serviceTag;
      if (priceInYuan < 300) {
        serviceTag = serviceTags.find(t => t.code === 'basic');
      } else if (priceInYuan < 500) {
        serviceTag = serviceTags.find(t => t.code === 'standard');
      } else {
        serviceTag = serviceTags.find(t => t.code === 'premium');
      }

      // 随机分配场景标签
      const sceneTag = sceneTags[Math.floor(Math.random() * sceneTags.length)];

      // 创建关联
      if (serviceTag) {
        await prisma.planTag.create({
          data: {
            planId: plan.id,
            tagId: serviceTag.id,
          },
        });
      }

      await prisma.planTag.create({
        data: {
          planId: plan.id,
          tagId: sceneTag.id,
        },
      });

      taggedCount++;
    }

    console.log(`✅ 为 ${taggedCount} 个套餐添加了标签`);

    // 更新标签使用统计
    await Promise.all([
      ...sceneTags.map(tag =>
        prisma.tag.update({
          where: { id: tag.id },
          data: {
            usageCount: {
              increment: Math.floor(taggedCount / sceneTags.length),
            },
          },
        })
      ),
      ...serviceTags.map(tag =>
        prisma.tag.update({
          where: { id: tag.id },
          data: {
            usageCount: {
              increment: Math.floor(taggedCount / serviceTags.length),
            },
          },
        })
      ),
    ]);
  } else {
    console.log('⚠️  没有找到套餐数据，跳过标签关联');
  }

  // 4. 输出统计
  console.log('\n📊 标签系统统计:');
  const categoryCount = await prisma.tagCategory.count();
  const tagCount = await prisma.tag.count();
  const planTagCount = await prisma.planTag.count();

  console.log(`   分类数量: ${categoryCount}`);
  console.log(`   标签数量: ${tagCount}`);
  console.log(`   标签关联: ${planTagCount}`);

  console.log('\n✨ 标签系统种子数据创建完成!');
  console.log('\n📖 下一步:');
  console.log('   1. 运行 pnpm dev 启动开发服务器');
  console.log('   2. 访问 /admin/tags 查看标签管理界面');
  console.log('   3. 访问 /plans 查看带标签的套餐列表');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
