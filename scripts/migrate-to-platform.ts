/**
 * 数据迁移脚本：从单一商家模式迁移到平台模式
 *
 * 此脚本执行以下操作：
 * 1. 创建默认商家账户（江戸和装工房雅）
 * 2. 将所有现有店铺关联到默认商家
 * 3. 将现有套餐转换为Listing（可选）
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 开始平台迁移...\n');

  // 步骤 1: 创建或获取默认商家账户
  console.log('📝 步骤 1: 创建默认商家账户...');

  // 首先检查是否已存在admin用户
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.log('   创建默认admin用户...');
    adminUser = await prisma.user.create({
      data: {
        email: 'stylekay1168@gmail.com',
        name: '管理员',
        role: 'ADMIN',
        emailVerified: new Date(),
      }
    });
    console.log(`   ✅ 创建admin用户: ${adminUser.id}`);
  } else {
    console.log(`   ℹ️  使用现有admin用户: ${adminUser.id}`);
  }

  // 检查是否已存在默认商家
  let defaultMerchant = await prisma.merchant.findFirst({
    where: { businessName: '江戸和装工房雅' }
  });

  if (!defaultMerchant) {
    console.log('   创建默认商家账户...');
    defaultMerchant = await prisma.merchant.create({
      data: {
        ownerId: adminUser.id,
        businessName: '江戸和装工房雅',
        legalName: '江戸和装工房雅株式会社',
        description: '东京浅草的传统和服租赁店，提供优质的和服体验服务',
        status: 'APPROVED',
        verified: true,
        commissionRate: 0.0, // 默认商家免佣金
      }
    });
    console.log(`   ✅ 创建默认商家: ${defaultMerchant.id}`);
  } else {
    console.log(`   ℹ️  使用现有默认商家: ${defaultMerchant.id}`);
  }

  console.log('');

  // 步骤 2: 将所有未关联的店铺关联到默认商家
  console.log('📝 步骤 2: 关联现有店铺到默认商家...');

  const unlinkedStores = await prisma.store.findMany({
    where: { merchantId: null }
  });

  if (unlinkedStores.length > 0) {
    console.log(`   发现 ${unlinkedStores.length} 个未关联的店铺`);

    for (const store of unlinkedStores) {
      await prisma.store.update({
        where: { id: store.id },
        data: { merchantId: defaultMerchant.id }
      });
      console.log(`   ✅ 店铺 "${store.name}" 已关联到默认商家`);
    }
  } else {
    console.log('   ℹ️  没有需要关联的店铺');
  }

  console.log('');

  // 步骤 3: 统计当前数据
  console.log('📊 迁移统计:');

  const merchantCount = await prisma.merchant.count();
  const storeCount = await prisma.store.count();
  const linkedStoreCount = await prisma.store.count({
    where: { merchantId: { not: null } }
  });
  const listingCount = await prisma.listing.count();

  console.log(`   商家总数: ${merchantCount}`);
  console.log(`   店铺总数: ${storeCount}`);
  console.log(`   已关联店铺: ${linkedStoreCount}`);
  console.log(`   商家套餐(Listings): ${listingCount}`);
  console.log('');

  // 步骤 4: 验证数据完整性
  console.log('🔍 验证数据完整性...');

  const orphanedStores = await prisma.store.count({
    where: { merchantId: null }
  });

  if (orphanedStores > 0) {
    console.log(`   ⚠️  警告: 仍有 ${orphanedStores} 个店铺未关联到商家`);
  } else {
    console.log('   ✅ 所有店铺已正确关联');
  }

  console.log('');
  console.log('✨ 平台迁移完成！');
  console.log('');
  console.log('📝 下一步:');
  console.log('   1. 运行应用并验证功能正常');
  console.log('   2. 为现有套餐创建Listing（可选）');
  console.log('   3. 测试商家注册和套餐发布流程');
  console.log('   4. 配置支付分账系统');
}

main()
  .catch((e) => {
    console.error('❌ 迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
