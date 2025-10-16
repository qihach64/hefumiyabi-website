/**
 * 导入真实爬取的套餐数据到数据库
 * 使用方法: node scripts/import-real-plans.js
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

// 从套餐名称推断分类
function inferCategory(name, description) {
  const text = `${name} ${description}`.toLowerCase();

  // 优先级顺序很重要
  if (text.includes('情侣') || text.includes('couple')) {
    return 'COUPLE';
  }
  if (text.includes('团体') || text.includes('团') || text.includes('group') || /\d+人/.test(text)) {
    return 'GROUP';
  }
  if (text.includes('亲子') || text.includes('家庭') || text.includes('family') || text.includes('儿童')) {
    return 'FAMILY';
  }
  if (text.includes('振袖') || text.includes('成人礼') || text.includes('豪华') || text.includes('摄影') || text.includes('premium')) {
    return 'SPECIAL';
  }
  if (text.includes('男士') || text.includes('武士') || text.includes('mens') || text.includes('袴')) {
    return 'MENS';
  }
  // 默认为女士
  return 'LADIES';
}

// 从描述中提取时长
function extractDuration(name, description) {
  const text = `${name} ${description}`;

  // 查找小时数
  const hourMatch = text.match(/(\d+)\s*小时|(\d+)\s*hour/i);
  if (hourMatch) {
    return parseInt(hourMatch[1] || hourMatch[2]);
  }

  // 查找"全天"
  if (text.includes('全天') || text.includes('all day')) {
    return 8;
  }

  // 默认8小时
  return 8;
}

// 提取包含的服务
function extractIncludes(name, description) {
  const includes = [];

  // 从描述中提取常见服务
  const services = [
    { keyword: ['和服', 'kimono'], service: '和服租赁' },
    { keyword: ['着装', '着付'], service: '专业着装服务' },
    { keyword: ['发型', 'ヘアセット'], service: '发型设计' },
    { keyword: ['摄影', 'photo', '撮影'], service: '专业摄影' },
    { keyword: ['配饰', '小物'], service: '全套配饰' },
    { keyword: ['蕾丝'], service: '蕾丝和服' },
    { keyword: ['振袖'], service: '振袖和服' },
    { keyword: ['访问着'], service: '访问着和服' },
  ];

  const text = `${name} ${description}`.toLowerCase();

  services.forEach(({ keyword, service }) => {
    if (keyword.some(k => text.includes(k))) {
      if (!includes.includes(service)) {
        includes.push(service);
      }
    }
  });

  // 如果没有提取到任何服务，添加默认服务
  if (includes.length === 0) {
    includes.push('和服租赁', '着装服务', '配饰');
  }

  return includes;
}

async function importPlans() {
  console.log('🚀 开始导入真实套餐数据到数据库...\n');

  // 读取爬取的数据
  const dataPath = path.join(__dirname, '../data/real-plans-data.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ 数据文件不存在:', dataPath);
    console.log('请确保 data/real-plans-data.json 文件存在');
    process.exit(1);
  }

  const scrapedPlans = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📊 找到 ${scrapedPlans.length} 个套餐\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const plan of scrapedPlans) {
    try {
      // 生成 slug
      const slug = generateSlug(plan.name);

      // 检查是否已存在
      const existing = await prisma.rentalPlan.findUnique({
        where: { slug }
      });

      if (existing) {
        console.log(`⚠️  跳过已存在: ${plan.name}`);
        skipped++;
        continue;
      }

      // 转换价格：日元 -> 人民币分
      // price 是线上预约价格（低价）
      const priceInCNY = Math.round(plan.price * JPY_TO_CNY * 100);
      // originalPrice 是线下原价（高价）
      const originalPriceInCNY = plan.originalPrice ? Math.round(plan.originalPrice * JPY_TO_CNY * 100) : null;
      const depositAmount = Math.round(priceInCNY * 0.3); // 30% 定金

      // 推断分类
      const category = inferCategory(plan.name, plan.description);

      // 提取时长
      const duration = extractDuration(plan.name, plan.description);

      // 提取包含的服务（移除"和服租赁"这个重复的tag）
      const includes = extractIncludes(plan.name, plan.description).filter(
        service => service !== '和服租赁'
      );
      
      // 提取店铺和地区信息
      const storeName = plan.store || null;
      const region = plan.region || null;
      
      // 提取标签（移除"和服租赁"）
      const tags = plan.tags ? plan.tags.filter(tag => tag !== '和服租赁') : [];

      // 生成英文名（使用拼音或保持原样）
      const nameEn = plan.name
        .replace(/和服/g, 'Kimono')
        .replace(/套餐/g, 'Plan')
        .replace(/优惠/g, 'Discount')
        .replace(/情侣/g, 'Couple');

      // 创建套餐
      await prisma.rentalPlan.create({
        data: {
          slug,
          name: plan.name,
          nameEn,
          description: plan.description || `${plan.name} - 优质和服租赁体验`,
          category,
          price: priceInCNY,
          originalPrice: originalPriceInCNY,
          depositAmount,
          duration,
          includes,
          imageUrl: plan.image || null,
          storeName,
          region,
          tags,
          isActive: true,
        }
      });

      console.log(`✅ 导入: ${plan.name}`);
      console.log(`   线上价: ¥${plan.price} (JPY) -> ¥${(priceInCNY / 100).toFixed(2)} (CNY)`);
      if (originalPriceInCNY) {
        console.log(`   原价: ¥${plan.originalPrice} (JPY) -> ¥${(originalPriceInCNY / 100).toFixed(2)} (CNY)`);
      }
      console.log(`   分类: ${category} | 时长: ${duration}h`);
      imported++;

    } catch (error) {
      console.error(`❌ 导入失败 "${plan.name}":`, error.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 导入统计:');
  console.log(`   - 成功导入: ${imported} 个`);
  console.log(`   - 跳过已存在: ${skipped} 个`);
  console.log(`   - 导入失败: ${errors} 个`);
  console.log(`   - 总计: ${scrapedPlans.length} 个`);
  console.log('='.repeat(60));

  // 显示分类统计
  const categoryCounts = await prisma.rentalPlan.groupBy({
    by: ['category'],
    _count: true
  });

  console.log('\n📋 分类统计:');
  categoryCounts.forEach(({ category, _count }) => {
    console.log(`   - ${category}: ${_count} 个`);
  });

  // 显示价格范围
  const priceStats = await prisma.rentalPlan.aggregate({
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true }
  });

  console.log('\n💰 价格统计（人民币）:');
  console.log(`   - 最低价: ¥${(priceStats._min.price / 100).toFixed(2)}`);
  console.log(`   - 最高价: ¥${(priceStats._max.price / 100).toFixed(2)}`);
  console.log(`   - 平均价: ¥${(priceStats._avg.price / 100).toFixed(2)}`);

  console.log('\n✅ 导入完成！');
}

async function main() {
  try {
    await importPlans();
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

module.exports = { importPlans };
