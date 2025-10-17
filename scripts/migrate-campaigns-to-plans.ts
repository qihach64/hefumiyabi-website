/**
 * 数据迁移脚本：将 CampaignPlan 数据迁移到 RentalPlan
 * 
 * 迁移策略：
 * 1. 保留原有的 RentalPlan 数据
 * 2. 将 CampaignPlan 数据转换为 RentalPlan 并标记为 isCampaign=true
 * 3. 建立 Campaign 和 RentalPlan 的关联
 * 4. 保留 CampaignPlan 表以备回滚
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCampaignPlans() {
  console.log('🚀 开始迁移 CampaignPlan 到 RentalPlan...\n');

  try {
    // 1. 获取所有活动套餐
    const campaignPlans = await prisma.campaignPlan.findMany({
      include: {
        campaign: true,
      },
    });

    console.log(`📊 找到 ${campaignPlans.length} 个活动套餐需要迁移\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 2. 逐个迁移
    for (const cp of campaignPlans) {
      try {
        // 生成唯一的 slug
        const slug = `campaign-${cp.id}`;
        
        // 检查是否已经迁移过
        const existing = await prisma.rentalPlan.findUnique({
          where: { slug },
        });

        if (existing) {
          console.log(`⏭️  跳过已存在的套餐: ${cp.name}`);
          skipCount++;
          continue;
        }

        // 创建新的 RentalPlan
        const newPlan = await prisma.rentalPlan.create({
          data: {
            slug,
            name: cp.name,
            nameEn: cp.nameEn,
            description: cp.description,
            
            // 价格信息
            price: cp.campaignPrice,
            originalPrice: cp.originalPrice,
            depositAmount: 0,
            
            // 基本信息
            duration: cp.duration || 4, // 默认4小时
            includes: cp.includes,
            imageUrl: cp.images[0] || null,
            
            // 店铺和地区信息
            storeName: cp.storeName,
            region: cp.region,
            tags: cp.tags,
            
            // 活动相关字段
            campaignId: cp.campaignId,
            isCampaign: true,
            isLimited: cp.maxBookings !== null,
            maxBookings: cp.maxBookings,
            currentBookings: cp.currentBookings,
            
            // 时间限制（从 Campaign 获取）
            availableFrom: cp.campaign.startDate,
            availableUntil: cp.campaign.endDate,
            
            // 分类（根据标签推断）
            category: inferCategory(cp.tags, cp.name),
            
            // 推荐状态
            isFeatured: cp.isFeatured,
            isActive: cp.campaign.isActive,
          },
        });

        console.log(`✅ 成功迁移: ${cp.name} -> ${newPlan.id}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ 迁移失败: ${cp.name}`, error);
        errorCount++;
      }
    }

    // 3. 打印迁移总结
    console.log('\n' + '='.repeat(60));
    console.log('📈 迁移总结');
    console.log('='.repeat(60));
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`⏭️  跳过: ${skipCount} 个`);
    console.log(`❌ 失败: ${errorCount} 个`);
    console.log(`📊 总计: ${campaignPlans.length} 个`);
    console.log('='.repeat(60) + '\n');

    // 4. 验证迁移结果
    const totalRentalPlans = await prisma.rentalPlan.count();
    const campaignRentalPlans = await prisma.rentalPlan.count({
      where: { isCampaign: true },
    });
    
    console.log('📊 数据库统计:');
    console.log(`   - 总套餐数: ${totalRentalPlans}`);
    console.log(`   - 活动套餐: ${campaignRentalPlans}`);
    console.log(`   - 常规套餐: ${totalRentalPlans - campaignRentalPlans}\n`);

  } catch (error) {
    console.error('❌ 迁移过程出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 根据标签和名称推断套餐分类
 */
function inferCategory(tags: string[], name: string): string {
  const lowerName = name.toLowerCase();
  const allTags = tags.join(' ').toLowerCase();
  
  if (allTags.includes('情侣') || lowerName.includes('情侣') || lowerName.includes('couple')) {
    return 'COUPLE';
  }
  
  if (allTags.includes('亲子') || allTags.includes('家族') || lowerName.includes('亲子') || lowerName.includes('家族')) {
    return 'FAMILY';
  }
  
  if (allTags.includes('男') || lowerName.includes('男') || lowerName.includes('men')) {
    return 'MENS';
  }
  
  if (allTags.includes('团体') || lowerName.includes('团体') || lowerName.includes('group')) {
    return 'GROUP';
  }
  
  // 默认为女士套餐
  return 'LADIES';
}

// 执行迁移
migrateCampaignPlans()
  .then(() => {
    console.log('✨ 迁移完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 迁移失败:', error);
    process.exit(1);
  });

