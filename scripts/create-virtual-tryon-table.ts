import prisma from '../src/lib/prisma';

async function createVirtualTryOnTable() {
  console.log('🔧 开始创建 VirtualTryOn 表...\n');

  try {
    // 1. 创建 TryOnStatus 枚举类型
    console.log('1️⃣ 创建 TryOnStatus 枚举...');
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "TryOnStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE 'TryOnStatus enum already exists, skipping';
      END $$;
    `);
    console.log('   ✅ TryOnStatus 枚举已就绪\n');

    // 2. 创建 virtual_tryons 表
    console.log('2️⃣ 创建 virtual_tryons 表...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "virtual_tryons" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "sessionId" TEXT NOT NULL,
        "planId" TEXT,
        "kimonoId" TEXT,
        "personImageUrl" TEXT,
        "resultImageUrl" TEXT NOT NULL,
        "status" "TryOnStatus" NOT NULL DEFAULT 'PROCESSING',
        "duration" INTEGER,
        "cost" DOUBLE PRECISION,
        "fromCache" BOOLEAN NOT NULL DEFAULT false,
        "prompt" TEXT,
        "modelVersion" TEXT,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "virtual_tryons_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('   ✅ virtual_tryons 表已创建\n');

    // 3. 创建索引
    console.log('3️⃣ 创建索引...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "virtual_tryons_userId_idx" ON "virtual_tryons"("userId");',
      'CREATE INDEX IF NOT EXISTS "virtual_tryons_sessionId_idx" ON "virtual_tryons"("sessionId");',
      'CREATE INDEX IF NOT EXISTS "virtual_tryons_planId_idx" ON "virtual_tryons"("planId");',
      'CREATE INDEX IF NOT EXISTS "virtual_tryons_status_idx" ON "virtual_tryons"("status");',
      'CREATE INDEX IF NOT EXISTS "virtual_tryons_createdAt_idx" ON "virtual_tryons"("createdAt");',
    ];

    for (const index of indexes) {
      await prisma.$executeRawUnsafe(index);
    }
    console.log('   ✅ 所有索引已创建\n');

    // 4. 验证表是否创建成功
    console.log('4️⃣ 验证表结构...');
    const tableExists = await prisma.$queryRawUnsafe<any[]>(`
      SELECT tablename, schemaname
      FROM pg_tables
      WHERE tablename = 'virtual_tryons';
    `);

    if (tableExists.length > 0) {
      console.log('   ✅ 表验证成功:', tableExists[0]);
    } else {
      throw new Error('表创建失败！');
    }

    // 5. 验证索引
    const indexList = await prisma.$queryRawUnsafe<any[]>(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'virtual_tryons'
      ORDER BY indexname;
    `);

    console.log(`   ✅ 索引数量: ${indexList.length}`);
    indexList.forEach((idx: any) => {
      console.log(`      - ${idx.indexname}`);
    });

    console.log('\n🎉 VirtualTryOn 表创建成功！\n');

    // 6. 测试插入和查询
    console.log('5️⃣ 测试表操作...');
    const testRecord = await prisma.virtualTryOn.create({
      data: {
        sessionId: 'test-session-' + Date.now(),
        resultImageUrl: 'https://example.com/test.jpg',
        status: 'COMPLETED',
        modelVersion: 'test',
      },
    });
    console.log('   ✅ 插入测试记录:', testRecord.id);

    // 删除测试记录
    await prisma.virtualTryOn.delete({
      where: { id: testRecord.id },
    });
    console.log('   ✅ 删除测试记录\n');

    console.log('✨ 所有操作完成！可以开始使用试穿功能了。\n');

  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);

    if (error.message.includes('duplicate')) {
      console.log('\n💡 提示: 表可能已经存在，这不是问题。');
    } else if (error.message.includes('permission denied')) {
      console.log('\n💡 提示: 权限不足，请检查数据库连接配置。');
    } else {
      console.log('\n💡 可能的原因:');
      console.log('   1. 数据库连接失败（检查 .env.local 中的 DATABASE_URL）');
      console.log('   2. 网络问题（VPN/防火墙）');
      console.log('   3. Supabase 服务暂时不可用');
      console.log('\n   手动方案: 复制 scripts/create-virtual-tryon-table.sql 到 Supabase SQL Editor 执行');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createVirtualTryOnTable();
