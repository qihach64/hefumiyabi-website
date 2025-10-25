import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 数据库连接测试 API
 * 访问 /api/test-db 来检查数据库连接状态
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';

  // 解析数据库 URL 信息（隐藏密码）
  const urlInfo = parseDbUrl(dbUrl);

  try {
    console.log('[DB Test] 开始测试数据库连接...');
    console.log('[DB Test] 数据库主机:', urlInfo.host);
    console.log('[DB Test] 数据库端口:', urlInfo.port);
    console.log('[DB Test] SSL 模式:', urlInfo.sslMode);

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
      message: '✅ 数据库连接正常',
      timestamp: new Date().toISOString(),
      data: {
        rentalPlans: planCount,
        users: userCount,
        bookings: bookingCount,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: 'vercel',
        region: process.env.VERCEL_REGION || 'unknown',
      },
      database: urlInfo,
    });

  } catch (error: any) {
    console.error('[DB Test] 数据库连接失败:', error);

    // 根据错误代码提供具体的解决方案
    const troubleshooting = getTroubleshooting(error.code, urlInfo);

    return NextResponse.json({
      success: false,
      message: '❌ 数据库连接失败',
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        name: error.name,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: 'vercel',
        region: process.env.VERCEL_REGION || 'unknown',
      },
      database: urlInfo,
      troubleshooting,
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}

// 解析数据库 URL 信息（隐藏密码）
function parseDbUrl(url: string) {
  if (!url) {
    return {
      configured: false,
      host: 'NOT_SET',
      port: 'NOT_SET',
      database: 'NOT_SET',
      sslMode: 'NOT_SET',
    };
  }

  try {
    const urlObj = new URL(url);
    const sslMode = urlObj.searchParams.get('sslmode') || 'none';

    return {
      configured: true,
      host: urlObj.hostname,
      port: urlObj.port || '5432',
      database: urlObj.pathname.replace('/', ''),
      user: urlObj.username,
      sslMode,
      isPooler: urlObj.port === '6543',
      recommendation: urlObj.port === '5432'
        ? '⚠️ 建议使用 Connection Pooler (端口 6543)'
        : '✅ 使用 Connection Pooler',
    };
  } catch {
    return {
      configured: true,
      host: 'PARSE_ERROR',
      port: 'PARSE_ERROR',
      database: 'PARSE_ERROR',
      sslMode: 'PARSE_ERROR',
      error: 'DATABASE_URL 格式错误',
    };
  }
}

// 根据错误代码提供故障排除建议
function getTroubleshooting(errorCode: string, urlInfo: any) {
  if (errorCode === 'P1001') {
    // 无法连接到数据库服务器
    return {
      problem: '无法访问数据库服务器',
      possibleCauses: [
        '🔴 Vercel 的 IP 被 Supabase 防火墙阻止',
        '🔴 使用了直接连接而不是 Connection Pooler',
        '🔴 Supabase 项目已暂停（免费版 7 天无活动会暂停）',
        '🔴 网络配置问题',
      ],
      solutions: [
        {
          title: '1. 切换到 Supabase Connection Pooler (强烈推荐)',
          steps: [
            '访问 Supabase 控制台: https://supabase.com/dashboard',
            '进入您的项目 -> Settings -> Database',
            '找到 "Connection Pooling" 部分',
            '复制 "Connection String" (端口应该是 6543)',
            '在 Vercel 环境变量中更新 DATABASE_URL',
            '重新部署 Vercel 项目',
          ],
          example: 'postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres',
        },
        {
          title: '2. 检查 Supabase 项目状态',
          steps: [
            '登录 Supabase: https://supabase.com/dashboard',
            '检查项目是否显示 "Paused"',
            '如果暂停，点击 "Resume" 按钮恢复',
          ],
        },
        {
          title: '3. 验证环境变量配置',
          steps: [
            '确保 DATABASE_URL 密码中的特殊字符已 URL 编码',
            '^ 应编码为 %5E',
            '$ 应编码为 %24',
            '@ 应编码为 %40',
            '确保包含 ?sslmode=require 或 ?sslmode=verify-full',
            '在 Vercel 控制台确认环境变量在 Production 环境生效',
          ],
        },
      ],
      currentConfig: urlInfo,
    };
  }

  return {
    problem: '未知错误',
    solutions: [
      '查看 Vercel Function Logs 获取更多详情',
      '访问 VERCEL-TROUBLESHOOTING.md 文件查看完整故障排除指南',
    ],
  };
}
