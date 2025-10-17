import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedInventory() {
  console.log('🚀 开始生成库存数据...\n');

  try {
    // 获取所有店铺
    const stores = await prisma.store.findMany();
    console.log(`📍 找到 ${stores.length} 个店铺\n`);

    // 获取所有和服
    const kimonos = await prisma.kimono.findMany({
      take: 20, // 取前20个和服作为示例
    });
    console.log(`👘 找到 ${kimonos.length} 个和服\n`);

    if (stores.length === 0 || kimonos.length === 0) {
      console.log('❌ 需要先创建店铺和和服数据');
      return;
    }

    let created = 0;

    // 为每个店铺分配和服库存
    for (const store of stores) {
      console.log(`\n🏪 为 ${store.name} 分配库存...`);

      // 每个店铺随机分配 10-15 个和服，每种和服 2-5 件
      const numKimonos = Math.floor(Math.random() * 6) + 10; // 10-15
      const selectedKimonos = kimonos
        .sort(() => Math.random() - 0.5)
        .slice(0, numKimonos);

      for (const kimono of selectedKimonos) {
        const quantity = Math.floor(Math.random() * 4) + 2; // 2-5件

        // 检查是否已存在
        const existing = await prisma.kimonoStore.findUnique({
          where: {
            kimonoId_storeId: {
              kimonoId: kimono.id,
              storeId: store.id,
            },
          },
        });

        if (existing) {
          console.log(`   - 跳过已存在: ${kimono.name} (${quantity}件)`);
          continue;
        }

        await prisma.kimonoStore.create({
          data: {
            kimonoId: kimono.id,
            storeId: store.id,
            quantity,
          },
        });

        console.log(`   ✅ ${kimono.name}: ${quantity} 件`);
        created++;
      }
    }

    console.log(`\n✨ 成功创建 ${created} 条库存记录！\n`);

    // 显示各店铺库存统计
    console.log('📊 各店铺库存统计:');
    for (const store of stores) {
      const storeInventory = await prisma.kimonoStore.findMany({
        where: { storeId: store.id },
      });

      const totalKimonos = storeInventory.reduce((sum, item) => sum + item.quantity, 0);
      console.log(`   - ${store.name}: ${totalKimonos} 件和服`);
    }

  } catch (error) {
    console.error('❌ 生成失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
seedInventory()
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
