/**
 * 导入真实爬取的活动套餐数据到数据库
 * 使用方法: node scripts/import-real-campaigns.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 汇率：1 日元 ≈ 0.05 人民币
const JPY_TO_CNY = 0.05;

// 生成 slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

async function importCampaigns() {
  console.log('🚀 开始导入真实活动套餐数据到数据库...\n');

  // 读取爬取的数据
  const dataPath = path.join(__dirname, '../data/real-campaigns-data.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ 数据文件不存在:', dataPath);
    console.log('请先运行: node scripts/scrape-campaigns.js');
    process.exit(1);
  }

  const scrapedCampaigns = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📊 找到 ${scrapedCampaigns.length} 个活动套餐\n`);

  // 1. 创建或查找父级 Campaign（活动）
  console.log('🔍 检查父级活动...\n');
  const campaignSlug = '10th-anniversary-campaign';
  let parentCampaign = await prisma.campaign.findUnique({
    where: { slug: campaignSlug }
  });

  if (!parentCampaign) {
    console.log('📝 创建父级活动: 10周年优惠活动\n');
    parentCampaign = await prisma.campaign.create({
      data: {
        slug: campaignSlug,
        title: '10周年优惠活动',
        titleEn: '10th Anniversary Campaign',
        description: '江戸和装工房雅10周年特别优惠活动，多款套餐限时优惠！',
        subtitle: '10周年特别企划',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
        isPinned: true,
        priority: 100,
        type: 'ANNIVERSARY',
        restrictions: [],
      }
    });
    console.log(`✅ 父级活动已创建: ${parentCampaign.title}\n`);
  } else {
    console.log(`✅ 找到已存在的父级活动: ${parentCampaign.title}\n`);
  }

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // 2. 导入活动套餐
  for (const campaign of scrapedCampaigns) {
    try {
      // 检查是否已存在（通过名称）
      const existing = await prisma.campaignPlan.findFirst({
        where: {
          campaignId: parentCampaign.id,
          name: campaign.name
        }
      });

      if (existing) {
        console.log(`⚠️  跳过已存在: ${campaign.name}`);
        skipped++;
        continue;
      }

      // 转换价格：日元 -> 人民币分
      const campaignPriceInCNY = campaign.campaignPrice
        ? Math.round(campaign.campaignPrice * JPY_TO_CNY * 100)
        : null;

      const originalPriceInCNY = campaign.originalPrice
        ? Math.round(campaign.originalPrice * JPY_TO_CNY * 100)
        : null;

      // 创建活动套餐
      await prisma.campaignPlan.create({
        data: {
          campaignId: parentCampaign.id,
          name: campaign.name,
          description: campaign.description || `${campaign.name} - 限时优惠活动`,
          originalPrice: originalPriceInCNY,
          campaignPrice: campaignPriceInCNY,
          images: campaign.images || [],
          includes: campaign.includes || [],
          applicableStores: campaign.applicableStores || [],
          storeName: campaign.storeName || null,
          region: campaign.region || null,
          tags: campaign.tags || [],
        }
      });

      console.log(`✅ 导入: ${campaign.name}`);
      if (campaignPriceInCNY) {
        console.log(`   活动价: ¥${campaign.campaignPrice} (JPY) -> ¥${(campaignPriceInCNY / 100).toFixed(2)} (CNY)`);
      }
      if (originalPriceInCNY) {
        console.log(`   原价: ¥${campaign.originalPrice} (JPY) -> ¥${(originalPriceInCNY / 100).toFixed(2)} (CNY)`);
      }
      console.log(`   图片: ${campaign.images.length} 张`);
      console.log(`   适用店铺: ${campaign.applicableStores.length > 0 ? campaign.applicableStores.join(', ') : '未指定'}`);
      imported++;

    } catch (error) {
      console.error(`❌ 导入失败 "${campaign.name}":`, error.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 导入统计:');
  console.log(`   - 成功导入: ${imported} 个`);
  console.log(`   - 跳过已存在: ${skipped} 个`);
  console.log(`   - 导入失败: ${errors} 个`);
  console.log(`   - 总计: ${scrapedCampaigns.length} 个`);
  console.log('='.repeat(60));

  // 显示价格范围
  const priceStats = await prisma.campaignPlan.aggregate({
    _min: { campaignPrice: true },
    _max: { campaignPrice: true },
    _avg: { campaignPrice: true }
  });

  console.log('\n💰 价格统计（人民币）:');
  if (priceStats._min.campaignPrice) {
    console.log(`   - 最低活动价: ¥${(priceStats._min.campaignPrice / 100).toFixed(2)}`);
    console.log(`   - 最高活动价: ¥${(priceStats._max.campaignPrice / 100).toFixed(2)}`);
    console.log(`   - 平均活动价: ¥${(priceStats._avg.campaignPrice / 100).toFixed(2)}`);
  }

  // 统计适用店铺
  const allCampaigns = await prisma.campaignPlan.findMany({
    select: {
      applicableStores: true
    }
  });

  const allStores = [...new Set(allCampaigns.flatMap(c => c.applicableStores))];
  const withStores = allCampaigns.filter(c => c.applicableStores.length > 0).length;

  console.log('\n🏪 店铺统计:');
  console.log(`   - 指定店铺的活动: ${withStores} 个`);
  console.log(`   - 涉及店铺数: ${allStores.length} 个`);
  if (allStores.length > 0) {
    console.log(`   - 店铺列表: ${allStores.join(', ')}`);
  }

  console.log('\n✅ 导入完成！');
}

async function main() {
  try {
    await importCampaigns();
  } catch (error) {
    console.error('\n❌ 导入过程出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { importCampaigns };
