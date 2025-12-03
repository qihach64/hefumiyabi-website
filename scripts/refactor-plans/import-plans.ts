#!/usr/bin/env tsx
/**
 * 导入新套餐体系
 * 基于 CSV: Miyabi套餐方案_重构版.xlsx - 套餐实例清单.csv
 */

import { PrismaClient, PlanCategory } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { getThemeIdByCSVTheme } from './theme-mapping.js';
import { parseCSVTags } from './tag-definitions.js';

const prisma = new PrismaClient();

// 图片匹配缓存
let existingPlanImages: Array<{
  name: string;
  category: string;
  imageUrl: string | null;
  images: string[];
}> = [];

interface PlanCSVRow {
  '套餐编号': string;
  '所属主题': string;
  '套餐层级': string;
  '套餐名称(平台展示)': string;
  '适用人群': string;
  '包含服务': string;
  '建议售价(円)': string;
  '平台标签(自动)': string;
  '可选标签(商家选)': string;
  '核心卖点(商家填)': string;
  '原PKG映射': string;
  '备注': string;
}

// 人群到Category的映射
const AUDIENCE_CATEGORY_MAP: Record<string, PlanCategory> = {
  '女性单人': 'LADIES',
  '女性(成人式)': 'LADIES',
  '女性(毕业)': 'LADIES',
  '女性(正式场合)': 'LADIES',
  '女性学生': 'LADIES',
  '男士': 'MENS',
  '男士(女性也可)': 'MENS',
  '情侣(1男1女)': 'COUPLE',
  '闺蜜(2女)': 'COUPLE',
  '家庭(2大1小)': 'FAMILY',
  '儿童(3-12岁)': 'SPECIAL',
  '团体(10人以上)': 'GROUP',
  '单人': 'LADIES',
};

// 解析价格(去除逗号和円符号)
function parsePrice(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[,円¥]/g, '').trim();

  // 如果是"按人数报价"或其他非数字,返回null,使用默认价格
  if (!cleaned || isNaN(parseInt(cleaned))) {
    return null;
  }

  const price = parseInt(cleaned);
  return price * 100; // 转换为分
}

// 解析包含服务为数组
function parseIncludes(includesStr: string): string[] {
  return includesStr
    .split('+')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// 生成slug - 使用拼音或英文关键词
function generateSlug(name: string, code: string, category: PlanCategory): string {
  // 提取套餐名称的关键词
  const keywordMap: Record<string, string> = {
    // SOL-01 出片神器
    '经典和风': 'classic-kimono',
    '妆造全包': 'full-styling',
    '专属跟拍': 'exclusive-photoshoot',

    // SOL-02 正式礼遇
    '振袖华礼': 'furisode-ceremony',
    '袴礼': 'hakama-ceremony',
    '访问着': 'homongi-formal',
    '纹付袴': 'montsuki-hakama',

    // SOL-03 双人优享
    '情侣同框': 'couple-photo',
    '闺蜜双人': 'besties-duo',
    '亲子同游': 'family-fun',

    // SOL-04 季节限定
    '花火夜浴衣': 'hanabi-yukata',
    '午后浴衣': 'afternoon-yukata',
    '樱花季限定': 'sakura-limited',
    '红叶季限定': 'momiji-limited',

    // SOL-05 超值入门
    '学生专享': 'student-special',
    '和服初体验': 'kimono-starter',
    '男士和服': 'mens-kimono',
    '童趣和服': 'kids-kimono',

    // 特殊
    '团体定制': 'group-custom',
    '角色还原': 'character-cosplay',
  };

  // 查找匹配的关键词
  for (const [keyword, slug] of Object.entries(keywordMap)) {
    if (name.includes(keyword)) {
      return slug;
    }
  }

  // 如果没有匹配,使用套餐编号作为后备
  const base = code.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return base;
}

// 智能匹配图片URL
function findBestImageMatch(planName: string, category: PlanCategory): string | null {
  // 关键词匹配权重表
  const keywords = {
    // 服装类型
    '振袖': ['振袖', '成人式', '成人礼'],
    '访问着': ['访问着', '访问服'],
    '袴': ['袴', '毕业', '大正'],
    '浴衣': ['浴衣'],
    '蕾丝': ['蕾丝', '和洋'],
    '武士': ['武士', '男士袴'],

    // 场景
    '情侣': ['情侣', '双人'],
    '亲子': ['亲子', '家庭', '儿童'],
    '儿童': ['儿童', '童'],

    // 风格
    '华丽': ['华丽', '豪华', '高级'],
    '基础': ['基础', '经济', '入门'],
  };

  let bestMatch: { plan: typeof existingPlanImages[0]; score: number } | null = null;

  for (const existingPlan of existingPlanImages) {
    // 必须同分类或兼容分类
    const categoryMatch =
      existingPlan.category === category ||
      (category === 'COUPLE' && existingPlan.category === 'LADIES') ||
      (category === 'FAMILY' && existingPlan.category === 'LADIES') ||
      (category === 'SPECIAL' && ['LADIES', 'MENS'].includes(existingPlan.category));

    if (!categoryMatch) continue;

    let score = 0;

    // 关键词匹配
    for (const [keyword, variants] of Object.entries(keywords)) {
      if (planName.includes(keyword)) {
        for (const variant of variants) {
          if (existingPlan.name.includes(variant)) {
            score += 10;
          }
        }
      }
    }

    // 直接名称相似度(简单版本)
    const planWords = planName.split(/[・·\s]+/);
    const existingWords = existingPlan.name.split(/[・·\s|]+/);

    for (const word of planWords) {
      if (word.length >= 2 && existingWords.some(w => w.includes(word) || word.includes(w))) {
        score += 3;
      }
    }

    // 分类完全匹配加分
    if (existingPlan.category === category) {
      score += 5;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { plan: existingPlan, score };
    }
  }

  if (bestMatch && bestMatch.score >= 5) {
    console.log(`      图片匹配: ${bestMatch.plan.name} (相似度: ${bestMatch.score})`);
    return bestMatch.plan.imageUrl || bestMatch.plan.images[0] || null;
  }

  // 如果没有好的匹配,使用同分类的默认图片
  const categoryDefault = existingPlanImages.find(p => p.category === category);
  if (categoryDefault?.imageUrl) {
    console.log(`      使用分类默认图片 (${category})`);
    return categoryDefault.imageUrl;
  }

  return null;
}

async function importPlans() {
  console.log('📦 开始导入套餐体系...\n');

  // 0. 加载现有套餐的图片
  console.log('📸 加载现有套餐图片...');
  existingPlanImages = await prisma.rentalPlan.findMany({
    where: {
      OR: [
        { imageUrl: { not: null } },
        { images: { isEmpty: false } }
      ]
    },
    select: {
      name: true,
      category: true,
      imageUrl: true,
      images: true,
    },
  });
  console.log(`✓ 加载了 ${existingPlanImages.length} 个有图片的套餐\n`);

  // 1. 读取CSV文件
  const csvPath = '/Users/jinchenyu/Downloads/Miyabi套餐方案_重构版.xlsx - 套餐实例清单.csv';
  console.log(`📄 读取CSV文件: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV文件不存在: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: PlanCSVRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  console.log(`✓ 读取到 ${records.length} 个套餐\n`);

  // 2. 获取所有标签的映射 (code -> id)
  console.log('🔖 加载标签映射...');
  const tags = await prisma.tag.findMany({
    select: { id: true, code: true, name: true },
  });
  const tagMap = new Map(tags.map(t => [t.code, t.id]));
  console.log(`✓ 加载了 ${tags.length} 个标签\n`);

  // 3. 删除之前测试导入的套餐(slug以pkg-开头的)
  console.log('🗑️  删除测试套餐...');
  const deleteResult = await prisma.rentalPlan.deleteMany({
    where: {
      slug: {
        startsWith: 'pkg-'
      }
    }
  });
  console.log(`✓ 删除了 ${deleteResult.count} 个测试套餐\n`);

  // 4. 禁用现有套餐(保留数据,仅标记为不活跃)
  console.log('🔄 禁用现有套餐...');
  const disableResult = await prisma.rentalPlan.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });
  console.log(`✓ 已禁用 ${disableResult.count} 个现有套餐\n`);

  // 4. 导入新套餐
  console.log('📥 开始导入新套餐...\n');
  let successCount = 0;
  let errorCount = 0;

  for (const row of records) {
    try {
      // 解析数据
      const code = row['套餐编号'];
      const themeName = row['所属主题'];
      const tier = row['套餐层级'];
      const name = row['套餐名称(平台展示)'];
      const audience = row['适用人群'];
      const includes = parseIncludes(row['包含服务']);
      const rawPrice = parsePrice(row['建议售价(円)']);
      const price = rawPrice || 100000; // 如果价格无效,使用默认¥1000
      const platformTags = parseCSVTags(row['平台标签(自动)']);
      const optionalTags = parseCSVTags(row['可选标签(商家选)']);
      const highlights = row['核心卖点(商家填)'];
      const notes = row['备注'];

      // 获取主题ID
      const themeId = getThemeIdByCSVTheme(themeName);
      if (!themeId) {
        console.log(`  ⚠️  跳过 ${code}: 找不到主题 "${themeName}"`);
        errorCount++;
        continue;
      }

      // 确定分类
      const category = AUDIENCE_CATEGORY_MAP[audience];
      if (!category) {
        console.log(`  ⚠️  跳过 ${code}: 未知人群 "${audience}"`);
        errorCount++;
        continue;
      }

      // 合并标签并获取ID
      const allTagCodes = [...platformTags, ...optionalTags];
      const tagIds = allTagCodes
        .map(code => tagMap.get(code))
        .filter((id): id is string => id !== undefined);

      // 生成描述(层级 + 卖点)
      let description = tier;
      if (highlights) {
        description += `: ${highlights}`;
      }

      // 智能匹配图片
      const imageUrl = findBestImageMatch(name, category);

      // 创建套餐
      const plan = await prisma.rentalPlan.create({
        data: {
          slug: generateSlug(name, code, category),
          name,
          description,
          highlights,
          category,
          price,
          originalPrice: null, // CSV中未提供,如需折扣可后续设置
          depositAmount: 0,
          duration: 480, // 默认8小时,可根据需要调整
          includes,
          imageUrl, // 智能匹配的图片URL
          images: imageUrl ? [imageUrl] : [],
          theme: {
            connect: { id: themeId }
          },
          // merchantId: null, // 通过关系设置,不直接设置ID
          createdBy: null,
          storeName: null,
          region: null,
          tags: [], // 旧字段,保持空
          // campaignId: null, // 通过关系设置
          isCampaign: false,
          isLimited: false,
          maxBookings: null,
          currentBookings: 0,
          availableFrom: null,
          availableUntil: null,
          isActive: true,
          isFeatured: code.includes('S01-B') || code.includes('S02-A'), // 示例:主推套餐
          displayOrder: records.indexOf(row),
        },
      });

      // 关联标签
      if (tagIds.length > 0) {
        await prisma.planTag.createMany({
          data: tagIds.map(tagId => ({
            planId: plan.id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }

      successCount++;
      const imageStatus = imageUrl ? '📸' : '⚠️ 无图';
      console.log(`  ✓ [${code}] ${name} (${category}) - ${tagIds.length}个标签 ${imageStatus}`);
    } catch (error) {
      errorCount++;
      console.error(`  ❌ [${row['套餐编号']}] 导入失败:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n✅ 套餐导入完成:`);
  console.log(`   - 成功: ${successCount} 个`);
  console.log(`   - 失败: ${errorCount} 个`);
  console.log(`   - 总计: ${records.length} 个\n`);

  // 5. 统计结果
  console.log('📊 导入后统计:\n');

  const plansByTheme = await prisma.theme.findMany({
    include: {
      _count: {
        select: { plans: true },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  console.log('主题分布:');
  plansByTheme.forEach(theme => {
    const activeCount = theme._count.plans;
    console.log(`  ${theme.name}: ${activeCount} 个套餐`);
  });

  const totalActive = await prisma.rentalPlan.count({
    where: { isActive: true },
  });

  const totalInactive = await prisma.rentalPlan.count({
    where: { isActive: false },
  });

  console.log(`\n总计:`);
  console.log(`  - 活跃套餐: ${totalActive}`);
  console.log(`  - 已禁用(历史): ${totalInactive}`);

  await prisma.$disconnect();
  console.log('\n✅ 套餐体系导入完成!');
}

importPlans().catch(error => {
  console.error('❌ 导入失败:', error);
  process.exit(1);
});
