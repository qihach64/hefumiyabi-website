/**
 * 修复套餐图片 URL
 * 将嵌套的 Next.js 图片优化 URL 转换为原始的 CDN URL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function extractOriginalUrl(imageUrl: string): string | null {
  // 检查是否是嵌套的 Next.js 图片优化 URL
  // 格式: https://hefumiyabi.com/_next/image?url=<encoded_url>&w=...&q=...

  if (!imageUrl) return null;

  // 如果已经是原始 Sanity CDN URL，直接返回
  if (imageUrl.startsWith('https://cdn.sanity.io/')) {
    return imageUrl;
  }

  // 如果是本地图片路径，直接返回
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // 尝试从嵌套的 Next.js URL 中提取原始 URL
  try {
    const url = new URL(imageUrl);
    const encodedUrl = url.searchParams.get('url');

    if (encodedUrl) {
      // URL 是编码的，需要解码
      const decodedUrl = decodeURIComponent(encodedUrl);

      // 递归处理（可能有多层嵌套）
      return extractOriginalUrl(decodedUrl);
    }
  } catch {
    // URL 解析失败，返回原值
  }

  return imageUrl;
}

async function main() {
  console.log('🔧 修复套餐图片 URL\n');

  // 获取所有有图片的套餐
  const plans = await prisma.rentalPlan.findMany({
    where: {
      imageUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  console.log(`📦 找到 ${plans.length} 个有图片的套餐\n`);

  let fixedCount = 0;
  let errorCount = 0;

  for (const plan of plans) {
    const originalUrl = extractOriginalUrl(plan.imageUrl!);

    if (originalUrl && originalUrl !== plan.imageUrl) {
      console.log(`✅ ${plan.name}`);
      console.log(`   旧: ${plan.imageUrl?.substring(0, 80)}...`);
      console.log(`   新: ${originalUrl.substring(0, 80)}...`);

      try {
        await prisma.rentalPlan.update({
          where: { id: plan.id },
          data: { imageUrl: originalUrl },
        });
        fixedCount++;
      } catch (error) {
        console.error(`   ❌ 更新失败:`, error);
        errorCount++;
      }
    } else if (!originalUrl) {
      console.log(`⚠️  ${plan.name}: 无法提取原始 URL`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 统计结果:');
  console.log(`   处理套餐: ${plans.length}个`);
  console.log(`   修复成功: ${fixedCount}个`);
  console.log(`   无需修复: ${plans.length - fixedCount - errorCount}个`);
  if (errorCount > 0) {
    console.log(`   修复失败: ${errorCount}个`);
  }

  console.log('\n✨ 图片 URL 修复完成!');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
