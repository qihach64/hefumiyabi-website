/**
 * 统一导入脚本：将常规套餐和活动套餐统一导入到 RentalPlan
 * 
 * 数据来源：
 * 1. data/real-plans-data.json - 常规套餐
 * 2. data/real-campaigns-data.json - 活动套餐
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// 日元到人民币汇率
const JPY_TO_CNY = 0.05;

interface PlanData {
  name: string;
  description: string;
  originalPrice: number; // 日元
  price?: number; // 日元（常规套餐）
  campaignPrice?: number; // 日元（活动套餐）
  duration?: number;
  includes: string[];
  images?: string[];
  applicableStores?: string[];
  tags?: string[];
  storeName?: string | null;
  region?: string | null;
}

interface CampaignData {
  name: string;
  description: string;
  originalPrice: number;
  campaignPrice: number;
  images: string[];
  includes: string[];
  applicableStores: string[];
  tags: string[];
  storeName: string | null;
  region: string | null;
}

/**
 * 清空现有数据（可选）
 */
async function clearExistingData(clearAll: boolean = false) {
  if (clearAll) {
    console.log('🗑️  清空现有数据...');
    await prisma.rentalPlan.deleteMany({});
    console.log('✅ 数据已清空\n');
  } else {
    console.log('ℹ️  保留现有数据，只添加新套餐\n');
  }
}

/**
 * 推断套餐分类
 */
function inferCategory(tags: string[], name: string, includes: string[]): string {
  const allText = `${name} ${tags.join(' ')} ${includes.join(' ')}`.toLowerCase();
  
  if (allText.includes('情侣') || allText.includes('couple')) {
    return 'COUPLE';
  }
  
  if (allText.includes('亲子') || allText.includes('家族') || allText.includes('family')) {
    return 'FAMILY';
  }
  
  if (allText.includes('男士') || allText.includes('男') || allText.includes('mens')) {
    return 'MENS';
  }
  
  if (allText.includes('团体') || allText.includes('group')) {
    return 'GROUP';
  }
  
  if (allText.includes('特别') || allText.includes('振袖') || allText.includes('袴')) {
    return 'SPECIAL';
  }
  
  // 默认为女士套餐
  return 'LADIES';
}

/**
 * 生成唯一的 slug
 */
function generateSlug(name: string, index: number, isCampaign: boolean): string {
  const prefix = isCampaign ? 'campaign' : 'plan';
  const sanitized = name
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .substring(0, 50);
  return `${prefix}-${sanitized}-${index}`;
}

/**
 * 导入常规套餐
 */
async function importRegularPlans() {
  console.log('📦 导入常规套餐...\n');
  
  const dataPath = path.join(__dirname, '../data/real-plans-data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.log('⚠️  未找到常规套餐数据文件，跳过');
    return 0;
  }
  
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const plansData: PlanData[] = JSON.parse(rawData);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < plansData.length; i++) {
    const plan = plansData[i];
    
    try {
      const slug = generateSlug(plan.name, i, false);
      
      // 检查是否已存在
      const existing = await prisma.rentalPlan.findUnique({ where: { slug } });
      if (existing) {
        skipCount++;
        continue;
      }
      
      // 价格转换（日元 -> 人民币分）
      const onlinePrice = plan.price || plan.originalPrice;
      const onlinePriceInCNY = Math.round(onlinePrice * JPY_TO_CNY * 100);
      const originalPriceInCNY = Math.round(plan.originalPrice * JPY_TO_CNY * 100);
      
      // 过滤掉 "和服租赁" 标签
      const filteredIncludes = plan.includes.filter(item => item !== '和服租赁');
      const filteredTags = (plan.tags || []).filter(tag => tag !== '和服租赁');
      
      await prisma.rentalPlan.create({
        data: {
          slug,
          name: plan.name,
          description: plan.description,
          
          price: onlinePriceInCNY,
          originalPrice: originalPriceInCNY,
          depositAmount: 0,
          
          duration: plan.duration || 4,
          includes: filteredIncludes,
          imageUrl: plan.images?.[0] || null,
          
          storeName: plan.storeName || null,
          region: plan.region || null,
          tags: filteredTags,
          
          category: inferCategory(filteredTags, plan.name, filteredIncludes),
          
          // 常规套餐标记
          isCampaign: false,
          isActive: true,
          isFeatured: false,
        },
      });
      
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`   已导入 ${successCount} 个常规套餐...`);
      }
      
    } catch (error) {
      console.error(`❌ 导入失败: ${plan.name}`, error);
      errorCount++;
    }
  }
  
  console.log(`\n✅ 常规套餐导入完成: 成功 ${successCount}, 跳过 ${skipCount}, 失败 ${errorCount}\n`);
  return successCount;
}

/**
 * 导入活动套餐
 */
async function importCampaignPlans() {
  console.log('🎊 导入活动套餐...\n');
  
  const dataPath = path.join(__dirname, '../data/real-campaigns-data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.log('⚠️  未找到活动套餐数据文件，跳过');
    return 0;
  }
  
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const campaignsData: CampaignData[] = JSON.parse(rawData);
  
  // 首先创建或获取默认活动
  const defaultCampaign = await prisma.campaign.upsert({
    where: { slug: '10th-anniversary' },
    update: {},
    create: {
      slug: '10th-anniversary',
      title: '10周年特惠活动',
      titleEn: '10th Anniversary Sale',
      description: '庆祝和服美雅10周年，精选套餐限时优惠！',
      subtitle: '限时优惠，数量有限',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      isPinned: true,
      priority: 100,
      type: 'ANNIVERSARY',
      restrictions: [],
    },
  });
  
  console.log(`✅ 创建活动: ${defaultCampaign.title}\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < campaignsData.length; i++) {
    const campaign = campaignsData[i];
    
    try {
      const slug = generateSlug(campaign.name, i, true);
      
      // 检查是否已存在
      const existing = await prisma.rentalPlan.findUnique({ where: { slug } });
      if (existing) {
        skipCount++;
        continue;
      }
      
      // 价格转换（日元 -> 人民币分）
      const campaignPriceInCNY = Math.round(campaign.campaignPrice * JPY_TO_CNY * 100);
      const originalPriceInCNY = Math.round(campaign.originalPrice * JPY_TO_CNY * 100);
      
      // 过滤标签
      const filteredIncludes = campaign.includes.filter(item => item !== '和服租赁');
      const filteredTags = campaign.tags.filter(tag => tag !== '和服租赁');
      
      await prisma.rentalPlan.create({
        data: {
          slug,
          name: campaign.name,
          description: campaign.description,
          
          price: campaignPriceInCNY,
          originalPrice: originalPriceInCNY,
          depositAmount: 0,
          
          duration: 4, // 默认4小时
          includes: filteredIncludes,
          imageUrl: campaign.images[0] || null,
          
          storeName: campaign.storeName || null,
          region: campaign.region || null,
          tags: filteredTags,
          
          category: inferCategory(filteredTags, campaign.name, filteredIncludes),
          
          // 活动套餐标记
          campaignId: defaultCampaign.id,
          isCampaign: true,
          isLimited: true,
          maxBookings: 100, // 默认限量100份
          currentBookings: 0,
          
          availableFrom: defaultCampaign.startDate,
          availableUntil: defaultCampaign.endDate,
          
          isActive: true,
          isFeatured: true, // 活动套餐默认推荐
        },
      });
      
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`   已导入 ${successCount} 个活动套餐...`);
      }
      
    } catch (error) {
      console.error(`❌ 导入失败: ${campaign.name}`, error);
      errorCount++;
    }
  }
  
  console.log(`\n✅ 活动套餐导入完成: 成功 ${successCount}, 跳过 ${skipCount}, 失败 ${errorCount}\n`);
  return successCount;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始统一导入套餐数据...\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // 询问是否清空现有数据
    const clearAll = process.argv.includes('--clear');
    await clearExistingData(clearAll);
    
    // 导入常规套餐
    const regularCount = await importRegularPlans();
    
    // 导入活动套餐
    const campaignCount = await importCampaignPlans();
    
    // 统计结果
    const totalCount = await prisma.rentalPlan.count();
    const campaignPlansCount = await prisma.rentalPlan.count({ where: { isCampaign: true } });
    const regularPlansCount = totalCount - campaignPlansCount;
    
    console.log('='.repeat(60));
    console.log('📊 导入完成统计');
    console.log('='.repeat(60));
    console.log(`✅ 本次导入: 常规 ${regularCount} + 活动 ${campaignCount} = ${regularCount + campaignCount}`);
    console.log(`📦 数据库总计: ${totalCount} 个套餐`);
    console.log(`   - 常规套餐: ${regularPlansCount}`);
    console.log(`   - 活动套餐: ${campaignPlansCount}`);
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

