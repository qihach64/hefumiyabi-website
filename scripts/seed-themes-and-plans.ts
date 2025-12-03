/**
 * 主题和新套餐种子数据脚本
 *
 * 创建 6 个主题 + 21 个新套餐
 * 运行: pnpm tsx scripts/seed-themes-and-plans.ts
 * 清空重建: pnpm tsx scripts/seed-themes-and-plans.ts --clear
 */

import { PrismaClient, PlanCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// 6 个主题数据
// ============================================

const themesData = [
  {
    slug: 'trendy-photo',
    name: '潮流出片',
    description: '追求时尚与个性的你，这里有最适合拍照打卡的和服套餐。专业造型搭配，让你成为朋友圈最靓的仔！',
    translations: {
      en: { name: 'Trendy Photo', description: 'Perfect for fashion-forward travelers seeking Instagram-worthy kimono experiences.' },
      ja: { name: 'トレンドフォト', description: 'SNS映え間違いなし！トレンド感のある着物体験。' }
    },
    icon: 'Camera',
    color: '#FF6B6B',
    displayOrder: 1,
  },
  {
    slug: 'formal-ceremony',
    name: '盛大礼遇',
    description: '人生重要时刻，值得最隆重的仪式感。成人式、毕业典礼、婚礼...我们为您的特别日子提供顶级和服体验。',
    translations: {
      en: { name: 'Formal Ceremony', description: 'Premium kimono experiences for life\'s most important moments.' },
      ja: { name: '盛大なおもてなし', description: '人生の特別な日にふさわしい、最高級の着物体験。' }
    },
    icon: 'Crown',
    color: '#9B59B6',
    displayOrder: 2,
  },
  {
    slug: 'together',
    name: '亲友同行',
    description: '和家人、闺蜜、情侣一起创造美好回忆。我们有专为多人设计的超值套餐，人越多越划算！',
    translations: {
      en: { name: 'Together', description: 'Special packages designed for couples, families, and friends.' },
      ja: { name: '一緒に', description: 'カップル、家族、友人向けの特別プラン。' }
    },
    icon: 'Users',
    color: '#E91E63',
    displayOrder: 3,
  },
  {
    slug: 'seasonal',
    name: '季节限定',
    description: '春樱、夏祭、秋枫、冬雪...每个季节都有专属的限定套餐，错过等一年！',
    translations: {
      en: { name: 'Seasonal', description: 'Limited-time packages celebrating Japan\'s beautiful seasons.' },
      ja: { name: '季節限定', description: '四季折々の限定プラン。' }
    },
    icon: 'Leaf',
    color: '#4CAF50',
    displayOrder: 4,
    // 可以设置季节限制，这里暂时不设
  },
  {
    slug: 'casual-stroll',
    name: '轻装漫步',
    description: '不想太正式？轻便浴衣让你舒适自在地逛街、吃小吃、拍照留念。性价比超高的入门之选！',
    translations: {
      en: { name: 'Casual Stroll', description: 'Comfortable and affordable yukata options for a relaxed experience.' },
      ja: { name: '気軽なお散歩', description: '気軽に楽しめる浴衣プラン。' }
    },
    icon: 'Footprints',
    color: '#00BCD4',
    displayOrder: 5,
  },
  {
    slug: 'specialty',
    name: '特色套餐',
    description: '男士和服、儿童和服、特殊尺寸...我们照顾到每一位客人的特别需求。',
    translations: {
      en: { name: 'Specialty', description: 'Unique packages for men, children, and special requirements.' },
      ja: { name: '特別プラン', description: '男性、お子様、特別なご要望にお応えします。' }
    },
    icon: 'Sparkles',
    color: '#FF9800',
    displayOrder: 6,
  },
];

// ============================================
// 21 个新套餐数据 (基于用户提供的表格)
// ============================================

const plansData = [
  // SOL-01 潮流出片 (4个)
  {
    themeSlug: 'trendy-photo',
    slug: 'standard-ladies-kimono',
    name: '女士标准和服套餐',
    description: '经典和服体验，包含专业着装服务',
    highlights: '人气首选 | 4小时畅玩',
    category: 'LADIES' as PlanCategory,
    price: 598000, // 5980 元 = 598000 分
    originalPrice: 698000,
    duration: 4,
    includes: ['和服租赁', '腰带', '配饰', '专业着装', '发型设计'],
    displayOrder: 1,
  },
  {
    themeSlug: 'trendy-photo',
    slug: 'premium-ladies-kimono',
    name: '女士高级和服套餐',
    description: '精选高级面料，更多款式选择',
    highlights: '面料升级 | 款式更多',
    category: 'LADIES' as PlanCategory,
    price: 898000,
    originalPrice: 1080000,
    duration: 6,
    includes: ['高级和服租赁', '高级腰带', '精美配饰', '专业着装', '发型设计', '化妆'],
    displayOrder: 2,
  },
  {
    themeSlug: 'trendy-photo',
    slug: 'luxury-ladies-kimono',
    name: '女士豪华和服套餐',
    description: '顶级丝绸和服，VIP专属服务',
    highlights: '顶级丝绸 | VIP服务',
    category: 'LADIES' as PlanCategory,
    price: 1580000,
    originalPrice: 1980000,
    duration: 8,
    includes: ['顶级丝绸和服', '手工腰带', '珠宝配饰', '专业着装', '发型设计', '专业化妆', '专业摄影'],
    displayOrder: 3,
  },
  {
    themeSlug: 'trendy-photo',
    slug: 'photo-package',
    name: '出片神器套餐',
    description: '专为拍照设计，含专业摄影服务',
    highlights: '含专业摄影 | 精修照片',
    category: 'LADIES' as PlanCategory,
    price: 1280000,
    originalPrice: 1580000,
    duration: 4,
    includes: ['和服租赁', '配饰', '专业着装', '发型设计', '化妆', '专业摄影1小时', '10张精修'],
    displayOrder: 4,
  },

  // SOL-02 盛大礼遇 (3个)
  {
    themeSlug: 'formal-ceremony',
    slug: 'furisode-coming-of-age',
    name: '振袖成人式套餐',
    description: '成人式专用振袖，人生重要时刻的最佳选择',
    highlights: '成人式专用 | 隆重典雅',
    category: 'SPECIAL' as PlanCategory,
    price: 2980000,
    originalPrice: 3580000,
    duration: 8,
    includes: ['振袖租赁', '袋带', '全套配饰', '专业着装', '专业发型', '专业化妆'],
    displayOrder: 1,
  },
  {
    themeSlug: 'formal-ceremony',
    slug: 'hakama-graduation',
    name: '袴装毕业典礼套餐',
    description: '毕业典礼必备袴装，留下青春纪念',
    highlights: '毕业典礼 | 青春纪念',
    category: 'SPECIAL' as PlanCategory,
    price: 1980000,
    originalPrice: 2380000,
    duration: 6,
    includes: ['袴套装租赁', '配饰', '专业着装', '发型设计'],
    displayOrder: 2,
  },
  {
    themeSlug: 'formal-ceremony',
    slug: 'formal-tomesode',
    name: '留袖正装套餐',
    description: '正式场合专用留袖，优雅大气',
    highlights: '正式场合 | 优雅大气',
    category: 'SPECIAL' as PlanCategory,
    price: 2580000,
    originalPrice: 3180000,
    duration: 8,
    includes: ['黑留袖/色留袖', '袋带', '全套配饰', '专业着装', '发型设计'],
    displayOrder: 3,
  },

  // SOL-03 亲友同行 (4个)
  {
    themeSlug: 'together',
    slug: 'couple-romantic',
    name: '情侣浪漫套餐',
    description: '双人和服体验，创造甜蜜回忆',
    highlights: '情侣专享 | 双人优惠',
    category: 'COUPLE' as PlanCategory,
    price: 1080000,
    originalPrice: 1280000,
    duration: 4,
    includes: ['女士和服', '男士和服', '双人配饰', '双人专业着装', '女士发型设计'],
    displayOrder: 1,
  },
  {
    themeSlug: 'together',
    slug: 'besties-group',
    name: '闺蜜同行套餐',
    description: '3人起订，闺蜜一起更开心',
    highlights: '3人成团 | 超值优惠',
    category: 'GROUP' as PlanCategory,
    price: 498000, // 每人价格
    originalPrice: 598000,
    duration: 4,
    includes: ['和服租赁', '配饰', '专业着装', '发型设计'],
    displayOrder: 2,
  },
  {
    themeSlug: 'together',
    slug: 'family-happiness',
    name: '亲子欢乐套餐',
    description: '全家和服体验，温馨家庭时光',
    highlights: '全家福 | 儿童友好',
    category: 'FAMILY' as PlanCategory,
    price: 1680000,
    originalPrice: 1980000,
    duration: 4,
    includes: ['成人和服2套', '儿童和服1套', '全家配饰', '专业着装'],
    displayOrder: 3,
  },
  {
    themeSlug: 'together',
    slug: 'group-party',
    name: '团体派对套餐',
    description: '5人以上团体优惠，公司团建首选',
    highlights: '团建首选 | 批量优惠',
    category: 'GROUP' as PlanCategory,
    price: 398000, // 每人价格
    originalPrice: 498000,
    duration: 4,
    includes: ['和服租赁', '基础配饰', '专业着装'],
    displayOrder: 4,
  },

  // SOL-04 季节限定 (4个)
  {
    themeSlug: 'seasonal',
    slug: 'spring-sakura',
    name: '春日樱花限定',
    description: '樱花季专属和服，粉嫩春意',
    highlights: '樱花季限定 | 粉色系',
    category: 'LADIES' as PlanCategory,
    price: 798000,
    originalPrice: 998000,
    duration: 4,
    includes: ['樱花主题和服', '配饰', '专业着装', '发型设计'],
    displayOrder: 1,
    seasonStart: new Date('2025-03-15'),
    seasonEnd: new Date('2025-04-30'),
  },
  {
    themeSlug: 'seasonal',
    slug: 'summer-festival',
    name: '夏日祭典限定',
    description: '祭典专属浴衣，感受日本夏日风情',
    highlights: '夏祭限定 | 清爽浴衣',
    category: 'LADIES' as PlanCategory,
    price: 498000,
    originalPrice: 598000,
    duration: 4,
    includes: ['夏日浴衣', '配饰', '专业着装', '简易发型'],
    displayOrder: 2,
    seasonStart: new Date('2025-07-01'),
    seasonEnd: new Date('2025-08-31'),
  },
  {
    themeSlug: 'seasonal',
    slug: 'autumn-maple',
    name: '秋枫红叶限定',
    description: '红叶季专属配色，秋日温暖色调',
    highlights: '红叶季限定 | 秋日配色',
    category: 'LADIES' as PlanCategory,
    price: 798000,
    originalPrice: 998000,
    duration: 4,
    includes: ['秋季主题和服', '配饰', '专业着装', '发型设计'],
    displayOrder: 3,
    seasonStart: new Date('2025-10-01'),
    seasonEnd: new Date('2025-11-30'),
  },
  {
    themeSlug: 'seasonal',
    slug: 'winter-new-year',
    name: '新年初诣限定',
    description: '新年参拜专属和服，迎接崭新一年',
    highlights: '新年限定 | 初诣专属',
    category: 'LADIES' as PlanCategory,
    price: 898000,
    originalPrice: 1080000,
    duration: 6,
    includes: ['新年主题和服', '暖和配饰', '专业着装', '发型设计'],
    displayOrder: 4,
    seasonStart: new Date('2024-12-20'),
    seasonEnd: new Date('2025-01-15'),
  },

  // SOL-05 轻装漫步 (3个)
  {
    themeSlug: 'casual-stroll',
    slug: 'basic-yukata',
    name: '基础浴衣体验',
    description: '轻便浴衣，适合街头漫步',
    highlights: '入门首选 | 轻便舒适',
    category: 'LADIES' as PlanCategory,
    price: 298000,
    originalPrice: 398000,
    duration: 4,
    includes: ['浴衣租赁', '腰带', '木屐', '简易着装'],
    displayOrder: 1,
  },
  {
    themeSlug: 'casual-stroll',
    slug: 'premium-yukata',
    name: '高级浴衣套餐',
    description: '精选面料浴衣，更多花色选择',
    highlights: '面料升级 | 花色丰富',
    category: 'LADIES' as PlanCategory,
    price: 498000,
    originalPrice: 598000,
    duration: 4,
    includes: ['高级浴衣', '配饰', '专业着装', '简易发型'],
    displayOrder: 2,
  },
  {
    themeSlug: 'casual-stroll',
    slug: 'street-snap',
    name: '街拍浴衣套餐',
    description: '时尚浴衣配色，街拍神器',
    highlights: '街拍必备 | 时尚配色',
    category: 'LADIES' as PlanCategory,
    price: 598000,
    originalPrice: 698000,
    duration: 4,
    includes: ['时尚浴衣', '潮流配饰', '专业着装', '发型设计'],
    displayOrder: 3,
  },

  // SOL-06 特色套餐 (3个)
  {
    themeSlug: 'specialty',
    slug: 'mens-hakama',
    name: '男士袴装套餐',
    description: '帅气男士和服，展现武士风范',
    highlights: '男士专属 | 武士风范',
    category: 'MENS' as PlanCategory,
    price: 698000,
    originalPrice: 798000,
    duration: 4,
    includes: ['男士和服', '袴', '配饰', '专业着装'],
    displayOrder: 1,
  },
  {
    themeSlug: 'specialty',
    slug: 'kids-kimono',
    name: '儿童和服套餐',
    description: '可爱儿童和服，记录成长瞬间',
    highlights: '儿童专属 | 可爱满分',
    category: 'FAMILY' as PlanCategory,
    price: 398000,
    originalPrice: 498000,
    duration: 4,
    includes: ['儿童和服', '配饰', '专业着装'],
    displayOrder: 2,
  },
  {
    themeSlug: 'specialty',
    slug: 'plus-size-kimono',
    name: '大码和服套餐',
    description: '特殊尺码和服，每个人都值得美丽',
    highlights: '特殊尺码 | 舒适版型',
    category: 'LADIES' as PlanCategory,
    price: 698000,
    originalPrice: 798000,
    duration: 4,
    includes: ['大码和服', '配饰', '专业着装', '发型设计'],
    displayOrder: 3,
  },
];

// ============================================
// 主函数
// ============================================

async function main() {
  console.log('🚀 开始导入主题和新套餐数据...\n');
  console.log('='.repeat(60) + '\n');

  const clearAll = process.argv.includes('--clear');

  try {
    // 1. 创建主题
    console.log('📦 创建主题...\n');

    if (clearAll) {
      // 先删除套餐的 themeId 关联，再删除主题
      await prisma.rentalPlan.updateMany({
        where: { themeId: { not: null } },
        data: { themeId: null },
      });
      await prisma.theme.deleteMany({});
      console.log('🗑️  已清空现有主题\n');
    }

    const themeMap = new Map<string, string>(); // slug -> id

    for (const themeData of themesData) {
      const theme = await prisma.theme.upsert({
        where: { slug: themeData.slug },
        update: {
          name: themeData.name,
          description: themeData.description,
          translations: themeData.translations,
          icon: themeData.icon,
          color: themeData.color,
          displayOrder: themeData.displayOrder,
          isActive: true,
        },
        create: {
          slug: themeData.slug,
          name: themeData.name,
          description: themeData.description,
          translations: themeData.translations,
          icon: themeData.icon,
          color: themeData.color,
          displayOrder: themeData.displayOrder,
          isActive: true,
        },
      });

      themeMap.set(themeData.slug, theme.id);
      console.log(`   ✅ ${theme.name} (${theme.slug})`);
    }

    console.log(`\n✅ 主题创建完成: ${themesData.length} 个\n`);

    // 2. 创建套餐
    console.log('📦 创建新套餐...\n');

    if (clearAll) {
      // 删除新导入的套餐（根据 slug 前缀判断）
      const newSlugs = plansData.map(p => p.slug);
      await prisma.rentalPlan.deleteMany({
        where: { slug: { in: newSlugs } },
      });
      console.log('🗑️  已清空新套餐\n');
    }

    let successCount = 0;
    let skipCount = 0;

    for (const planData of plansData) {
      const themeId = themeMap.get(planData.themeSlug);

      if (!themeId) {
        console.log(`   ⚠️ 跳过: ${planData.name} (主题不存在: ${planData.themeSlug})`);
        skipCount++;
        continue;
      }

      // 检查是否已存在
      const existing = await prisma.rentalPlan.findUnique({
        where: { slug: planData.slug },
      });

      if (existing && !clearAll) {
        // 更新现有套餐
        await prisma.rentalPlan.update({
          where: { slug: planData.slug },
          data: {
            themeId,
            name: planData.name,
            description: planData.description,
            highlights: planData.highlights,
            category: planData.category,
            price: planData.price,
            originalPrice: planData.originalPrice,
            duration: planData.duration,
            includes: planData.includes,
            displayOrder: planData.displayOrder,
            availableFrom: planData.seasonStart,
            availableUntil: planData.seasonEnd,
            isActive: true,
            isFeatured: false,
          },
        });
        console.log(`   🔄 更新: ${planData.name}`);
        successCount++;
      } else {
        // 创建新套餐
        await prisma.rentalPlan.create({
          data: {
            slug: planData.slug,
            themeId,
            name: planData.name,
            description: planData.description,
            highlights: planData.highlights,
            category: planData.category,
            price: planData.price,
            originalPrice: planData.originalPrice,
            depositAmount: 0,
            duration: planData.duration,
            includes: planData.includes,
            displayOrder: planData.displayOrder,
            availableFrom: planData.seasonStart,
            availableUntil: planData.seasonEnd,
            isActive: true,
            isFeatured: false,
            isCampaign: false,
          },
        });
        console.log(`   ✅ 创建: ${planData.name}`);
        successCount++;
      }
    }

    console.log(`\n✅ 套餐导入完成: 成功 ${successCount}, 跳过 ${skipCount}\n`);

    // 3. 统计结果
    const themeCount = await prisma.theme.count();
    const planCount = await prisma.rentalPlan.count();
    const plansWithTheme = await prisma.rentalPlan.count({
      where: { themeId: { not: null } },
    });

    console.log('='.repeat(60));
    console.log('📊 导入完成统计');
    console.log('='.repeat(60));
    console.log(`✅ 主题总数: ${themeCount}`);
    console.log(`✅ 套餐总数: ${planCount}`);
    console.log(`   - 有主题关联: ${plansWithTheme}`);
    console.log(`   - 无主题关联: ${planCount - plansWithTheme}`);
    console.log('='.repeat(60) + '\n');

    console.log('✨ 所有数据导入完成！');

  } catch (error) {
    console.error('❌ 导入过程出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
