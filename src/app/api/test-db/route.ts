import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 数据库连接测试 API
 * 访问 /api/test-db 来检查数据库连接状态
 */
export async function GET() {
  try {
    console.log('[DB Test] 开始测试数据库连接...');

    // 测试基本连接
    await prisma.$connect();
    console.log('[DB Test] 数据库连接成功');

    // 查询一些基础数据
    const [planCount, userCount, bookingCount] = await Promise.all([
      prisma.rentalPlan.count(),
      prisma.user.count(),
      prisma.booking.count(),
    ]);

    console.log('[DB Test] 数据查询成功:', { planCount, userCount, bookingCount });

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '数据库连接正常',
      timestamp: new Date().toISOString(),
      data: {
        rentalPlans: planCount,
        users: userCount,
        bookings: bookingCount,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      },
    });

  } catch (error: any) {
    console.error('[DB Test] 数据库连接失败:', error);

    return NextResponse.json({
      success: false,
      message: '数据库连接失败',
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        name: error.name,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      },
      troubleshooting: [
        '1. 检查 Vercel 环境变量中的 DATABASE_URL 是否正确',
        '2. 确保密码中的特殊字符已正确 URL 编码',
        '3. 确保包含 ?sslmode=require 参数',
        '4. 检查 Supabase 数据库是否处于活跃状态',
        '5. 在 Vercel 修改环境变量后需要重新部署',
      ],
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}
