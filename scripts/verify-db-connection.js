#!/usr/bin/env node

/**
 * 数据库连接验证脚本
 * 用于检查数据库是否可访问
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function verifyConnection() {
  console.log('🔍 开始验证数据库连接...\n');

  try {
    // 测试 1: 基本连接
    console.log('📡 测试 1: 基本数据库连接');
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');

    // 测试 2: 查询数据
    console.log('📊 测试 2: 查询租赁套餐数据');
    const planCount = await prisma.rentalPlan.count();
    console.log(`✅ 找到 ${planCount} 个租赁套餐\n`);

    // 测试 3: 查询用户数据
    console.log('👥 测试 3: 查询用户数据');
    const userCount = await prisma.user.count();
    console.log(`✅ 找到 ${userCount} 个用户\n`);

    // 测试 4: 查询预约数据
    console.log('📅 测试 4: 查询预约数据');
    const bookingCount = await prisma.booking.count();
    console.log(`✅ 找到 ${bookingCount} 个预约\n`);

    console.log('🎉 所有数据库测试通过！');
    console.log('\n数据库状态: ✅ 正常运行');

  } catch (error) {
    console.error('❌ 数据库连接失败:\n');

    if (error.code === 'P1001') {
      console.error('🔴 无法访问数据库服务器');
      console.error('\n可能的原因:');
      console.error('1. Supabase 数据库已暂停（免费版 7 天无活动会自动暂停）');
      console.error('2. 数据库 URL 配置错误');
      console.error('3. 网络连接问题');
      console.error('\n解决方案:');
      console.error('→ 访问 Supabase 控制台: https://supabase.com/dashboard');
      console.error('→ 检查项目是否处于暂停状态');
      console.error('→ 如果暂停，点击 "Resume" 按钮重新启动');
    } else {
      console.error('错误详情:', error.message);
    }

    console.error('\n数据库状态: ❌ 无法连接');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConnection();
