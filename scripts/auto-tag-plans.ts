/**
 * 智能自动打标签脚本
 * 根据套餐的名称、描述、分类、价格、includes等信息自动分配合适的标签
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 标签匹配规则定义
interface TagRule {
  tagCode: string;
  categoryCode: string;
  // 匹配条件
  conditions: {
    // 名称/描述中包含的关键词
    keywords?: string[];
    // includes 中包含的关键词
    includesKeywords?: string[];
    // 分类匹配
    categories?: string[];
    // 价格范围 (单位: 分)
    priceRange?: { min?: number; max?: number };
    // 主题slug匹配
    themeSlugs?: string[];
    // 自定义判断函数
    custom?: (plan: PlanData) => boolean;
  };
}

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  includes: string[];
  theme?: { slug: string; name: string } | null;
}

// 定义所有标签规则
const TAG_RULES: TagRule[] = [
  // ===== 人群标签 =====
  {
    tagCode: 'solo',
    categoryCode: 'audience',
    conditions: {
      keywords: ['单人', '一人'],
      categories: ['LADIES', 'MENS'],
      custom: (plan) => !plan.name.includes('情侣') && !plan.name.includes('闺蜜') &&
                        !plan.name.includes('团体') && !plan.name.includes('亲子') &&
                        !plan.name.includes('家庭') && plan.category !== 'COUPLE' &&
                        plan.category !== 'FAMILY' && plan.category !== 'GROUP',
    },
  },
  {
    tagCode: 'couple',
    categoryCode: 'audience',
    conditions: {
      keywords: ['情侣', '双人'],
      categories: ['COUPLE'],
    },
  },
  {
    tagCode: 'besties',
    categoryCode: 'audience',
    conditions: {
      keywords: ['闺蜜', '好友'],
    },
  },
  {
    tagCode: 'family',
    categoryCode: 'audience',
    conditions: {
      keywords: ['家庭', '全家'],
      categories: ['FAMILY'],
    },
  },
  {
    tagCode: 'parent-child',
    categoryCode: 'audience',
    conditions: {
      keywords: ['亲子', '儿童', '孩子'],
    },
  },
  {
    tagCode: 'group',
    categoryCode: 'audience',
    conditions: {
      keywords: ['团体', '团建', '人起'],
      categories: ['GROUP'],
    },
  },
  {
    tagCode: 'men-only',
    categoryCode: 'audience',
    conditions: {
      keywords: ['男士', '武士', '袴装'],
      categories: ['MENS'],
    },
  },
  {
    tagCode: 'student-only',
    categoryCode: 'audience',
    conditions: {
      keywords: ['学生'],
    },
  },
  {
    tagCode: 'children-only',
    categoryCode: 'audience',
    conditions: {
      keywords: ['儿童', '孩子', '童装'],
    },
  },

  // ===== 场景标签 =====
  {
    tagCode: 'casual_walk',
    categoryCode: 'scene',
    conditions: {
      keywords: ['散步', '漫步', '街拍', '体验'],
      themeSlugs: ['light-walk', 'trendy-snap'],
    },
  },
  {
    tagCode: 'temple_visit',
    categoryCode: 'scene',
    conditions: {
      keywords: ['寺庙', '神社', '参拜', '初诣'],
    },
  },
  {
    tagCode: 'date',
    categoryCode: 'scene',
    conditions: {
      keywords: ['约会', '浪漫', '情侣'],
      categories: ['COUPLE'],
    },
  },
  {
    tagCode: 'photoshoot',
    categoryCode: 'scene',
    conditions: {
      keywords: ['写真', '摄影', '跟拍', '出片'],
      includesKeywords: ['摄影', '写真', '跟拍'],
    },
  },
  {
    tagCode: 'formal-occasion',
    categoryCode: 'scene',
    conditions: {
      keywords: ['正式', '正装', '留袖', '访问着', '礼服'],
      themeSlugs: ['grand-ceremony'],
    },
  },
  {
    tagCode: 'graduation',
    categoryCode: 'scene',
    conditions: {
      keywords: ['毕业', '袴礼', '袴装'],
    },
  },
  {
    tagCode: 'coming-of-age',
    categoryCode: 'scene',
    conditions: {
      keywords: ['成人式', '二十岁', '振袖'],
    },
  },
  {
    tagCode: 'fireworks-festival',
    categoryCode: 'scene',
    conditions: {
      keywords: ['花火', '烟火', '祭典'],
    },
  },
  {
    tagCode: 'cherry-blossom',
    categoryCode: 'scene',
    conditions: {
      keywords: ['樱花', '赏樱'],
    },
  },
  {
    tagCode: 'autumn-leaves',
    categoryCode: 'scene',
    conditions: {
      keywords: ['红叶', '枫叶', '秋枫'],
    },
  },
  {
    tagCode: 'character-theme',
    categoryCode: 'scene',
    conditions: {
      keywords: ['角色', '应援', '动漫'],
    },
  },

  // ===== 风格标签 =====
  {
    tagCode: 'photo-ready',
    categoryCode: 'style',
    conditions: {
      keywords: ['出片', '上镜', '网红'],
      includesKeywords: ['网红', '出片'],
    },
  },
  {
    tagCode: 'trendy-modern',
    categoryCode: 'style',
    conditions: {
      keywords: ['时尚', '新潮', '蕾丝', '现代'],
      themeSlugs: ['trendy-snap'],
    },
  },
  {
    tagCode: 'vintage-classic',
    categoryCode: 'style',
    conditions: {
      keywords: ['复古', '经典', '传统', '古典'],
    },
  },
  {
    tagCode: 'luxurious-elegant',
    categoryCode: 'style',
    conditions: {
      keywords: ['华丽', '精致', '豪华', '高端', '尊享'],
      priceRange: { min: 25000 },
    },
  },
  {
    tagCode: 'simple-elegant',
    categoryCode: 'style',
    conditions: {
      keywords: ['简约', '素雅', '清新'],
    },
  },

  // ===== 服务标签 =====
  {
    tagCode: 'hair-styling',
    categoryCode: 'service',
    conditions: {
      keywords: ['发型'],
      includesKeywords: ['发型', '造型', '盘发'],
    },
  },
  {
    tagCode: 'makeup',
    categoryCode: 'service',
    conditions: {
      keywords: ['化妆', '妆造'],
      includesKeywords: ['化妆', '妆容'],
    },
  },
  {
    tagCode: 'photography',
    categoryCode: 'service',
    conditions: {
      keywords: ['摄影', '跟拍'],
      includesKeywords: ['摄影', '跟拍', '拍照'],
    },
  },
  {
    tagCode: 'accessory-package',
    categoryCode: 'service',
    conditions: {
      keywords: ['配件'],
      includesKeywords: ['配件', '饰品', '头饰', '腰带'],
    },
  },
  {
    tagCode: 'vlog-shooting',
    categoryCode: 'service',
    conditions: {
      keywords: ['vlog', 'Vlog', '视频'],
      includesKeywords: ['vlog', 'Vlog', '视频'],
    },
  },
  {
    tagCode: 'unlimited-selection',
    categoryCode: 'service',
    conditions: {
      keywords: ['任选', '全场'],
      includesKeywords: ['任选', '全场'],
    },
  },
  {
    tagCode: 'all-inclusive',
    categoryCode: 'service',
    conditions: {
      keywords: ['全包', '一价'],
    },
  },
  {
    tagCode: 'retouched-photos',
    categoryCode: 'service',
    conditions: {
      keywords: ['精修', '修图'],
      includesKeywords: ['精修'],
    },
  },
  {
    tagCode: 'overnight-rental',
    categoryCode: 'service',
    conditions: {
      keywords: ['过夜', '次日'],
    },
  },
  {
    tagCode: 'extended-return',
    categoryCode: 'service',
    conditions: {
      keywords: ['延时', '晚归'],
    },
  },

  // ===== 营销标签 =====
  {
    tagCode: 'value-entry',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['入门', '初体验', '基本', '基础'],
      priceRange: { max: 8000 },
    },
  },
  {
    tagCode: 'lowest-price',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['最低', '最便宜'],
      priceRange: { max: 5000 },
    },
  },
  {
    tagCode: 'special-offer',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['特惠', '优惠', '专属'],
    },
  },
  {
    tagCode: 'first-timer',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['首次', '新人', '入门', '初体验'],
    },
  },
  {
    tagCode: 'top-popular',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['人气', '热门', '畅销'],
    },
  },
  {
    tagCode: 'recommended',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['推荐', '首选'],
    },
  },
  {
    tagCode: 'flash-sale',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['限时', '抢购', '特价'],
    },
  },
  {
    tagCode: 'group-discount',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['团体优惠', '团购'],
      categories: ['GROUP'],
    },
  },
  {
    tagCode: 'duo-discount',
    categoryCode: 'marketing',
    conditions: {
      keywords: ['双人', '二人', '同行'],
      categories: ['COUPLE'],
    },
  },

  // ===== 季节标签 =====
  {
    tagCode: 'summer-limited',
    categoryCode: 'season',
    conditions: {
      keywords: ['夏', '浴衣', '祭典', '花火'],
    },
  },
  {
    tagCode: 'spring-limited',
    categoryCode: 'season',
    conditions: {
      keywords: ['春', '樱花', '赏樱'],
    },
  },
  {
    tagCode: 'autumn-limited',
    categoryCode: 'season',
    conditions: {
      keywords: ['秋', '红叶', '枫叶'],
    },
  },
  {
    tagCode: 'all-year',
    categoryCode: 'season',
    conditions: {
      themeSlugs: ['light-walk', 'trendy-snap'],
      custom: (plan) => !plan.name.includes('限定') && !plan.name.includes('季'),
    },
  },

  // ===== 便利标签 =====
  {
    tagCode: 'chinese-service',
    categoryCode: 'convenience',
    conditions: {
      keywords: ['中文'],
      includesKeywords: ['中文'],
    },
  },
  {
    tagCode: 'free-storage',
    categoryCode: 'convenience',
    conditions: {
      keywords: ['寄存'],
      includesKeywords: ['寄存', '存放'],
    },
  },
  {
    tagCode: 'flexible-hours',
    categoryCode: 'convenience',
    conditions: {
      keywords: ['灵活', '半日', '午后'],
    },
  },

  // ===== 认证标签 =====
  {
    tagCode: 'pure-silk',
    categoryCode: 'certification',
    conditions: {
      keywords: ['正绢', '真丝', '丝绸'],
    },
  },
  {
    tagCode: 'formal-wear',
    categoryCode: 'certification',
    conditions: {
      keywords: ['礼服', '正装', '留袖', '访问着'],
      themeSlugs: ['grand-ceremony'],
    },
  },
  {
    tagCode: 'premium-formal',
    categoryCode: 'certification',
    conditions: {
      keywords: ['高端', '顶级'],
      priceRange: { min: 35000 },
    },
  },
];

// 检查套餐是否匹配规则
function matchesRule(plan: PlanData, rule: TagRule): boolean {
  const { conditions } = rule;
  const searchText = `${plan.name} ${plan.description || ''}`.toLowerCase();
  const includesText = plan.includes.join(' ').toLowerCase();

  // 检查关键词
  if (conditions.keywords && conditions.keywords.length > 0) {
    const hasKeyword = conditions.keywords.some(kw =>
      searchText.includes(kw.toLowerCase())
    );
    if (hasKeyword) return true;
  }

  // 检查 includes 关键词
  if (conditions.includesKeywords && conditions.includesKeywords.length > 0) {
    const hasIncludesKeyword = conditions.includesKeywords.some(kw =>
      includesText.includes(kw.toLowerCase())
    );
    if (hasIncludesKeyword) return true;
  }

  // 检查分类
  if (conditions.categories && conditions.categories.length > 0) {
    if (conditions.categories.includes(plan.category)) {
      // 如果只有分类条件，需要配合其他条件
      if (!conditions.keywords && !conditions.includesKeywords && !conditions.priceRange && !conditions.themeSlugs && !conditions.custom) {
        return true;
      }
    }
  }

  // 检查价格范围
  if (conditions.priceRange) {
    const { min, max } = conditions.priceRange;
    if ((min === undefined || plan.price >= min) && (max === undefined || plan.price <= max)) {
      // 价格匹配，且有其他条件也要满足
      if (!conditions.keywords && !conditions.includesKeywords) {
        return true;
      }
    }
  }

  // 检查主题
  if (conditions.themeSlugs && conditions.themeSlugs.length > 0 && plan.theme) {
    if (conditions.themeSlugs.includes(plan.theme.slug)) {
      return true;
    }
  }

  // 检查自定义条件
  if (conditions.custom && conditions.custom(plan)) {
    return true;
  }

  return false;
}

async function main() {
  console.log('🏷️  智能自动打标签脚本\n');

  // 1. 获取所有标签
  const tags = await prisma.tag.findMany({
    include: {
      category: true,
    },
  });

  const tagMap = new Map(tags.map(t => [`${t.category.code}:${t.code}`, t]));
  console.log(`📋 已加载 ${tags.length} 个标签\n`);

  // 2. 获取所有上架且无标签或标签不完整的套餐
  const plans = await prisma.rentalPlan.findMany({
    where: { isActive: true },
    include: {
      planTags: {
        include: {
          tag: {
            include: { category: true },
          },
        },
      },
      theme: true,
    },
  });

  console.log(`📦 找到 ${plans.length} 个上架套餐\n`);

  let totalTagsAdded = 0;
  const tagUsageCount: Record<string, number> = {};

  for (const plan of plans) {
    const existingTagCodes = new Set(
      plan.planTags.map(pt => `${pt.tag.category.code}:${pt.tag.code}`)
    );

    const planData: PlanData = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      category: plan.category,
      price: plan.price,
      includes: plan.includes,
      theme: plan.theme,
    };

    const newTags: string[] = [];

    // 检查每个规则
    for (const rule of TAG_RULES) {
      const tagKey = `${rule.categoryCode}:${rule.tagCode}`;

      // 跳过已有的标签
      if (existingTagCodes.has(tagKey)) continue;

      // 检查是否匹配规则
      if (matchesRule(planData, rule)) {
        const tag = tagMap.get(tagKey);
        if (tag) {
          newTags.push(tagKey);

          // 创建关联
          await prisma.planTag.create({
            data: {
              planId: plan.id,
              tagId: tag.id,
            },
          });

          tagUsageCount[tagKey] = (tagUsageCount[tagKey] || 0) + 1;
        }
      }
    }

    if (newTags.length > 0) {
      console.log(`✅ ${plan.name}`);
      console.log(`   新增标签: ${newTags.map(t => t.split(':')[1]).join(', ')}`);
      totalTagsAdded += newTags.length;
    }
  }

  // 3. 更新标签使用次数
  console.log('\n📊 更新标签使用统计...');
  for (const [tagKey, count] of Object.entries(tagUsageCount)) {
    const tag = tagMap.get(tagKey);
    if (tag) {
      await prisma.tag.update({
        where: { id: tag.id },
        data: {
          usageCount: {
            increment: count,
          },
        },
      });
    }
  }

  // 4. 输出统计
  console.log('\n' + '='.repeat(50));
  console.log('📈 统计结果:');
  console.log(`   处理套餐: ${plans.length}个`);
  console.log(`   新增标签: ${totalTagsAdded}个`);

  if (Object.keys(tagUsageCount).length > 0) {
    console.log('\n   标签使用分布:');
    const sorted = Object.entries(tagUsageCount).sort((a, b) => b[1] - a[1]);
    for (const [tagKey, count] of sorted.slice(0, 10)) {
      const tagCode = tagKey.split(':')[1];
      console.log(`   - ${tagCode}: ${count}次`);
    }
  }

  console.log('\n✨ 自动打标签完成!');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
