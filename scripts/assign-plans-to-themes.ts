import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 主题ID映射
const THEME_IDS = {
  trendyPhoto: "cmioftqib0000yc2hhb2joxda",     // 潮流出片
  formalCeremony: "cmioftr7k0001yc2h0jr28c8a", // 盛大礼遇
  together: "cmioftrws0002yc2hpcyvu8m8",        // 亲友同行
  seasonal: "cmioftslr0003yc2h1s0nxpgg",        // 季节限定
  casualStroll: "cmiofttat0004yc2h4jv7m8r3",   // 轻装漫步
  specialty: "cmioftu040005yc2hu2h4jjxz",       // 特色套餐
};

// 根据名称关键词判断适合的主题
function getThemeForPlan(name: string): string | null {
  const nameLower = name.toLowerCase();

  // 盛大礼遇: 振袖、成人式、访问着、正装、礼服
  if (/振袖|成人式|访问着|正装|礼服|houmongi|furisode/.test(nameLower)) {
    return THEME_IDS.formalCeremony;
  }

  // 亲友同行: 情侣、双人、couple、family、亲子
  if (/情侣|双人|couple|family|亲子|两人/.test(nameLower)) {
    return THEME_IDS.together;
  }

  // 潮流出片: 蕾丝、时尚、网红、ins风、潮流、lace
  if (/蕾丝|时尚|网红|ins|潮流|lace|レース|modern/.test(nameLower)) {
    return THEME_IDS.trendyPhoto;
  }

  // 季节限定: 夏、浴衣、yukata、春、秋、冬
  if (/夏|浴衣|yukata|春季|秋季|冬季|夏季/.test(nameLower)) {
    return THEME_IDS.seasonal;
  }

  // 特色套餐: 武士、男士、samurai、hakama、袴
  if (/武士|男士|samurai|hakama|袴|紋付|men/.test(nameLower)) {
    return THEME_IDS.specialty;
  }

  // 轻装漫步: 基础、标准、散步、体验、入门、basic
  if (/基础|标准|散步|体验|入门|basic|standard|简约|经济/.test(nameLower)) {
    return THEME_IDS.casualStroll;
  }

  return null;
}

// 清理套餐名称（移除促销信息）
function cleanPlanName(name: string): string {
  return name
    .replace(/10周年优惠[,，]?/g, "")
    .replace(/不可退款[,，]?/g, "")
    .replace(/限时优惠[,，]?/g, "")
    .replace(/特价[,，]?/g, "")
    .replace(/【.*?】/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/^[,，\s]+/, "")
    .replace(/[,，\s]+$/, "")
    .trim();
}

async function main() {
  console.log("=== 开始分配套餐到主题 ===\n");

  // 获取当前每个主题的活跃套餐数量
  const themes = await prisma.theme.findMany({
    where: { isActive: true },
    include: {
      plans: {
        where: { isActive: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  const themeNeeds: Record<string, number> = {};
  const TARGET_COUNT = 6;

  console.log("当前状态:");
  for (const theme of themes) {
    const need = Math.max(0, TARGET_COUNT - theme.plans.length);
    themeNeeds[theme.id] = need;
    console.log(
      `  ${theme.name}: ${theme.plans.length} 个 (还需 ${need} 个)`
    );
  }

  // 获取没有themeId但有图片的套餐
  const availablePlans = await prisma.rentalPlan.findMany({
    where: {
      themeId: null,
      imageUrl: { not: null },
    },
    orderBy: { price: "asc" },
  });

  console.log(`\n可用套餐: ${availablePlans.length} 个\n`);

  // 按主题分配套餐
  const assignments: { planId: string; themeId: string; oldName: string; newName: string }[] = [];
  const themeAssignedCount: Record<string, number> = {};

  // 初始化计数器
  for (const themeId of Object.values(THEME_IDS)) {
    themeAssignedCount[themeId] = 0;
  }

  for (const plan of availablePlans) {
    const suggestedTheme = getThemeForPlan(plan.name);

    if (suggestedTheme && themeNeeds[suggestedTheme] > 0) {
      const cleanedName = cleanPlanName(plan.name);
      assignments.push({
        planId: plan.id,
        themeId: suggestedTheme,
        oldName: plan.name,
        newName: cleanedName !== plan.name ? cleanedName : plan.name,
      });
      themeNeeds[suggestedTheme]--;
      themeAssignedCount[suggestedTheme]++;
    }
  }

  // 对于轻装漫步（casual-stroll），如果数量不够，从低价套餐中补充
  const casualStrollNeed = themeNeeds[THEME_IDS.casualStroll];
  if (casualStrollNeed > 0) {
    console.log(`轻装漫步需要额外补充 ${casualStrollNeed} 个套餐`);

    // 找低价、短时的套餐
    const lowPricePlans = availablePlans
      .filter(p => !assignments.find(a => a.planId === p.id))
      .filter(p => p.price <= 1500000) // 15000日元以下
      .filter(p => p.duration && p.duration <= 6) // 6小时以内
      .slice(0, casualStrollNeed);

    for (const plan of lowPricePlans) {
      const cleanedName = cleanPlanName(plan.name);
      assignments.push({
        planId: plan.id,
        themeId: THEME_IDS.casualStroll,
        oldName: plan.name,
        newName: cleanedName !== plan.name ? cleanedName : plan.name,
      });
      themeNeeds[THEME_IDS.casualStroll]--;
      themeAssignedCount[THEME_IDS.casualStroll]++;
    }
  }

  console.log("\n=== 分配计划 ===");
  const themeNames: Record<string, string> = {
    [THEME_IDS.trendyPhoto]: "潮流出片",
    [THEME_IDS.formalCeremony]: "盛大礼遇",
    [THEME_IDS.together]: "亲友同行",
    [THEME_IDS.seasonal]: "季节限定",
    [THEME_IDS.casualStroll]: "轻装漫步",
    [THEME_IDS.specialty]: "特色套餐",
  };

  for (const [themeId, count] of Object.entries(themeAssignedCount)) {
    if (count > 0) {
      console.log(`\n${themeNames[themeId]}: +${count} 个`);
      const themeAssignments = assignments.filter(a => a.themeId === themeId);
      for (const a of themeAssignments) {
        if (a.oldName !== a.newName) {
          console.log(`  - "${a.oldName}" → "${a.newName}"`);
        } else {
          console.log(`  - "${a.oldName}"`);
        }
      }
    }
  }

  // 执行更新
  console.log("\n=== 执行更新 ===");
  let updated = 0;

  for (const assignment of assignments) {
    await prisma.rentalPlan.update({
      where: { id: assignment.planId },
      data: {
        themeId: assignment.themeId,
        isActive: true,
        name: assignment.newName,
      },
    });
    updated++;
  }

  console.log(`成功更新 ${updated} 个套餐\n`);

  // 最终统计
  const finalThemes = await prisma.theme.findMany({
    where: { isActive: true },
    include: {
      plans: {
        where: { isActive: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  console.log("=== 最终状态 ===");
  for (const theme of finalThemes) {
    console.log(`  ${theme.name}: ${theme.plans.length} 个套餐`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
