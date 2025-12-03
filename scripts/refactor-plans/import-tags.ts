#!/usr/bin/env tsx
/**
 * 导入标签体系
 * 基于 tag-definitions.ts 创建9个分类和57个标签
 */

import { PrismaClient } from '@prisma/client';
import { TAG_CATEGORIES, TAGS } from './tag-definitions.js';

const prisma = new PrismaClient();

async function importTags() {
  console.log('🏷️  开始导入标签体系...\n');

  // 1. 创建或更新标签分类
  console.log('📂 Step 1: 创建标签分类...');
  const categoryMap = new Map<string, string>(); // code -> id

  for (const catDef of TAG_CATEGORIES) {
    const category = await prisma.tagCategory.upsert({
      where: { code: catDef.code },
      create: {
        code: catDef.code,
        name: catDef.name,
        nameEn: catDef.nameEn,
        icon: catDef.icon,
        order: catDef.order,
        isActive: true,
        showInFilter: catDef.showInFilter,
        filterOrder: catDef.order,
      },
      update: {
        name: catDef.name,
        nameEn: catDef.nameEn,
        icon: catDef.icon,
        order: catDef.order,
        showInFilter: catDef.showInFilter,
        filterOrder: catDef.order,
      },
    });

    categoryMap.set(catDef.code, category.id);
    console.log(`  ✓ ${catDef.icon} ${catDef.name} (${catDef.code})`);
  }

  console.log(`\n✅ 创建了 ${TAG_CATEGORIES.length} 个标签分类\n`);

  // 2. 创建标签
  console.log('🔖 Step 2: 创建标签...');
  let createdCount = 0;
  let updatedCount = 0;

  for (const tagDef of TAGS) {
    const categoryId = categoryMap.get(tagDef.category);
    if (!categoryId) {
      console.log(`  ⚠️  跳过标签 ${tagDef.name}: 分类 ${tagDef.category} 不存在`);
      continue;
    }

    // 检查是否已存在
    const existing = await prisma.tag.findFirst({
      where: {
        categoryId,
        code: tagDef.code,
      },
    });

    if (existing) {
      // 更新
      await prisma.tag.update({
        where: { id: existing.id },
        data: {
          name: tagDef.name,
          nameEn: tagDef.nameEn,
          isActive: true,
        },
      });
      updatedCount++;
      console.log(`  ↻ ${tagDef.name} (${tagDef.code}) - 已更新`);
    } else {
      // 创建
      await prisma.tag.create({
        data: {
          categoryId,
          code: tagDef.code,
          name: tagDef.name,
          nameEn: tagDef.nameEn,
          isActive: true,
          order: TAGS.indexOf(tagDef),
          usageCount: 0,
        },
      });
      createdCount++;
      console.log(`  ✓ ${tagDef.name} (${tagDef.code}) - 已创建`);
    }
  }

  console.log(`\n✅ 标签导入完成:`);
  console.log(`   - 新创建: ${createdCount} 个`);
  console.log(`   - 已更新: ${updatedCount} 个`);
  console.log(`   - 总计: ${TAGS.length} 个标签\n`);

  // 3. 统计结果
  console.log('📊 导入后统计:\n');
  const categories = await prisma.tagCategory.findMany({
    include: {
      _count: {
        select: { tags: true },
      },
    },
    orderBy: { order: 'asc' },
  });

  categories.forEach(cat => {
    console.log(`  ${cat.icon} ${cat.name}: ${cat._count.tags} 个标签`);
  });

  await prisma.$disconnect();
  console.log('\n✅ 标签体系导入完成!');
}

importTags().catch(error => {
  console.error('❌ 导入失败:', error);
  process.exit(1);
});
