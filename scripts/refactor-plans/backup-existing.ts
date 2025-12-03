#!/usr/bin/env tsx
/**
 * 备份现有套餐数据
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupExisting() {
  console.log('💾 开始备份现有数据...\n');

  const timestamp = new Date().toISOString().split('T')[0]; // 2025-12-03
  const backupDir = path.join(process.cwd(), 'backups');

  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. 备份套餐
  console.log('📦 备份套餐数据...');
  const plans = await prisma.rentalPlan.findMany({
    include: {
      planTags: {
        include: {
          tag: {
            include: {
              category: true,
            },
          },
        },
      },
      theme: true,
      merchant: true,
      campaign: true,
    },
  });

  const plansPath = path.join(backupDir, `plans-backup-${timestamp}.json`);
  fs.writeFileSync(plansPath, JSON.stringify(plans, null, 2));
  console.log(`✓ 备份了 ${plans.length} 个套餐 -> ${plansPath}`);

  // 2. 备份标签
  console.log('\n🏷️  备份标签数据...');
  const tags = await prisma.tag.findMany({
    include: {
      category: true,
      plans: {
        include: {
          plan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const tagsPath = path.join(backupDir, `tags-backup-${timestamp}.json`);
  fs.writeFileSync(tagsPath, JSON.stringify(tags, null, 2));
  console.log(`✓ 备份了 ${tags.length} 个标签 -> ${tagsPath}`);

  // 3. 备份标签分类
  console.log('\n📂 备份标签分类...');
  const categories = await prisma.tagCategory.findMany({
    include: {
      tags: true,
    },
  });

  const categoriesPath = path.join(backupDir, `tag-categories-backup-${timestamp}.json`);
  fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
  console.log(`✓ 备份了 ${categories.length} 个标签分类 -> ${categoriesPath}`);

  // 4. 备份主题
  console.log('\n🎨 备份主题数据...');
  const themes = await prisma.theme.findMany({
    include: {
      plans: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const themesPath = path.join(backupDir, `themes-backup-${timestamp}.json`);
  fs.writeFileSync(themesPath, JSON.stringify(themes, null, 2));
  console.log(`✓ 备份了 ${themes.length} 个主题 -> ${themesPath}`);

  // 5. 生成备份摘要
  console.log('\n📊 生成备份摘要...');
  const summary = {
    timestamp: new Date().toISOString(),
    plans: {
      total: plans.length,
      active: plans.filter(p => p.isActive).length,
      inactive: plans.filter(p => !p.isActive).length,
      campaign: plans.filter(p => p.isCampaign).length,
      featured: plans.filter(p => p.isFeatured).length,
    },
    tags: {
      total: tags.length,
      byCategory: categories.map(c => ({
        category: c.name,
        count: tags.filter(t => t.category.id === c.id).length,
      })),
    },
    themes: {
      total: themes.length,
      distribution: themes.map(t => ({
        theme: t.name,
        plans: t.plans.length,
      })),
    },
    files: {
      plans: plansPath,
      tags: tagsPath,
      categories: categoriesPath,
      themes: themesPath,
    },
  };

  const summaryPath = path.join(backupDir, `backup-summary-${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('\n✅ 备份完成!');
  console.log('\n📊 备份摘要:');
  console.log(`   套餐: ${summary.plans.total} 个 (活跃: ${summary.plans.active})`);
  console.log(`   标签: ${summary.tags.total} 个`);
  console.log(`   分类: ${categories.length} 个`);
  console.log(`   主题: ${summary.themes.total} 个`);
  console.log(`\n📁 备份文件保存在: ${backupDir}`);

  await prisma.$disconnect();
}

backupExisting().catch(error => {
  console.error('❌ 备份失败:', error);
  process.exit(1);
});
