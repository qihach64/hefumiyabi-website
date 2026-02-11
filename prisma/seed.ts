import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始填充数据库...\n");

  // 清空现有数据
  console.log("🗑️  清空现有数据...");
  await prisma.booking.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.planStore.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rentalPlan.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.store.deleteMany();
  console.log("✅ 清空完成\n");

  // 1. 创建店铺
  console.log("🏪 创建店铺...");
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        slug: "asakusa-main",
        name: "浅草本店",
        nameEn: "Asakusa Main Store",
        city: "东京",
        address: "〒111-0032 东京都台东区浅草3-30-2末崎ビル",
        addressEn: "3-30-2 Asakusa, Taito-ku, Tokyo 111-0032",
        phone: "03-6802-3566",
        email: "asakusa@hefumiyabi.com",
        latitude: 35.7148,
        longitude: 139.7967,
        isActive: true,
      },
    }),
    prisma.store.create({
      data: {
        slug: "asakusa-premium",
        name: "浅草雅 プレミアム",
        nameEn: "Asakusa Miyabi Premium",
        city: "东京",
        address: "〒111-0034 东京都台东区雷门2-17-2 8F",
        addressEn: "2-17-2 Kaminarimon, Taito-ku, Tokyo 111-0034",
        phone: "03-6284-7807",
        email: "premium@hefumiyabi.com",
        latitude: 35.7117,
        longitude: 139.7966,
        isActive: true,
      },
    }),
    prisma.store.create({
      data: {
        slug: "asakusa-station",
        name: "浅草駅前店",
        nameEn: "Asakusa Station Front Store",
        city: "东京",
        address: "〒111-0034 东京都台东区雷门2-20-8 プリマベーラ2F",
        addressEn: "2-20-8 Kaminarimon, Taito-ku, Tokyo 111-0034",
        phone: "03-5830-6278",
        email: "station@hefumiyabi.com",
        latitude: 35.7115,
        longitude: 139.7968,
        isActive: true,
      },
    }),
    prisma.store.create({
      data: {
        slug: "kiyomizu",
        name: "清水寺店",
        nameEn: "Kiyomizu Store",
        city: "京都",
        address: "〒605-0829 京都府京都市东山区月见町10-2 八坂ビル204",
        addressEn: "10-2 Tsukimichou, Higashiyama-ku, Kyoto 605-0829",
        phone: "075-708-6566",
        email: "kiyomizu@hefumiyabi.com",
        latitude: 34.9948,
        longitude: 135.7850,
        isActive: true,
      },
    }),
    prisma.store.create({
      data: {
        slug: "kyoto-fusengawa",
        name: "京都不染川着物",
        nameEn: "Kyoto Fusengawa Kimono",
        city: "京都",
        address: "京都府京都市东山区慈法院庵町580-8",
        addressEn: "580-8 Jihouinan-cho, Higashiyama-ku, Kyoto",
        phone: "075-275-7665",
        email: "fusengawa@hefumiyabi.com",
        latitude: 34.9980,
        longitude: 135.7790,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ 创建了 ${stores.length} 个店铺\n`);

  // 2. 创建优惠活动 (先创建，后面套餐可以关联)
  console.log("🎊 创建优惠活动...");
  const campaign = await prisma.campaign.create({
    data: {
      slug: "10th-anniversary",
      title: "10周年特别企划",
      titleEn: "10th Anniversary Special Campaign",
      subtitle: "感恩回馈·限时优惠",
      description:
        "为庆祝江戸和装工房雅成立10周年，我们特别推出多款超值优惠套餐。在线预订享受最高50%折扣！",
      type: "ANNIVERSARY",
      startDate: new Date("2025-10-10"),
      endDate: new Date("2025-10-17"),
      usageStartDate: new Date("2025-10-10"),
      usageEndDate: new Date("2026-10-10"),
      isActive: true,
      isPinned: true,
      priority: 100,
      bannerImage:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/138ce3673bca70c235c369eb233079d18c798ddc-8001x4501.jpg",
      coverImage:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/138ce3673bca70c235c369eb233079d18c798ddc-8001x4501.jpg",
      restrictions: ["不适用于成人式", "不适用于毕业典礼"],
      terms:
        "本活动仅限在线预订。活动期间预订的套餐可在一年内使用。如需改期或取消，请遵循正常的预约政策。",
    },
  });
  console.log("✅ 创建了1个优惠活动\n");

  // 3. 创建租赁套餐
  console.log("📋 创建租赁套餐...");
  const plans = await Promise.all([
    // 普通套餐
    prisma.rentalPlan.create({
      data: {
        slug: "women-daily-discount",
        name: "女士日常优惠和服套餐",
        description: "轻松空手来店，免费发型设计等丰富选项。适合中老年女性，体验传统和服之美。",
        price: 30000,
        depositAmount: 0,
        duration: 8,
        region: "东京",
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "couple-discount",
        name: "情侣优惠套餐",
        description: "男女各一名的情侣套餐，在京都清水寺附近享受和服体验。",
        price: 89990,
        depositAmount: 0,
        duration: 8,
        region: "京都",
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "group-5-people",
        name: "5人团体套餐（1人免费）",
        description: "在京都清水寺附近享受5人团体和服体验，其中1名免费。",
        price: 200000,
        depositAmount: 0,
        duration: 8,
        region: "京都",
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "mens-standard",
        name: "男士标准和服套餐",
        description: "适合男士的标准和服体验，简约大方。",
        price: 35000,
        depositAmount: 0,
        duration: 8,
        region: "东京",
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "family-plan",
        name: "家庭套餐",
        description: "适合全家一起体验和服文化，包含儿童和服。",
        price: 150000,
        depositAmount: 0,
        duration: 8,
        isActive: true,
      },
    }),
    // 活动套餐 (关联 campaign)
    prisma.rentalPlan.create({
      data: {
        slug: "furisode-photoshoot",
        name: "10周年振袖和服套餐（含60分钟摄影）",
        description: "可爱风格、华丽图案丰富。适合成人式等重要场合，含专业摄影服务。",
        price: 380000,
        originalPrice: 580000,
        depositAmount: 50000,
        duration: 4,
        region: "东京",
        isCampaign: true,
        isFeatured: true,
        campaignId: campaign.id,
        images: [
          "https://cdn.sanity.io/images/u9jvdp7a/staging/2c5c377c69c7d60f41b052db2fdcfc955ff32437-1260x1536.png",
        ],
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ 创建了 ${plans.length} 个租赁套餐\n`);

  // 4. 填充 plan_stores 关联 (每个套餐按 region 匹配店铺)
  console.log("🔗 填充 plan_stores 关联...");
  const REGION_CITY: Record<string, string[]> = { 京都: ["京都"], 东京: ["东京"] };
  const planStoreRecords = plans.flatMap((plan) => {
    // region 为 null 时关联所有店铺
    const regionVal = (plan as { region?: string | null }).region;
    const matchedStores = regionVal
      ? stores.filter((s) => {
          for (const [kw, cities] of Object.entries(REGION_CITY)) {
            if (regionVal.includes(kw) && s.city && cities.includes(s.city)) return true;
          }
          return false;
        })
      : stores;
    return matchedStores.map((store) => ({ planId: plan.id, storeId: store.id }));
  });
  await prisma.planStore.createMany({
    data: planStoreRecords,
    skipDuplicates: true,
  });
  console.log(`✅ 创建了 ${planStoreRecords.length} 条 plan_stores 关联\n`);

  // 5. 创建测试用户
  console.log("👤 创建测试用户...");
  await prisma.user.create({
    data: {
      email: "test@hefumiyabi.com",
      name: "测试用户",
      role: "USER",
      language: "ZH",
      preference: {
        create: {
          preferredStyles: ["振袖", "访问着"],
          preferredColors: ["粉色", "红色"],
          preferredPatterns: ["花卉"],
          height: 165,
          emailNotification: true,
        },
      },
    },
  });
  console.log("✅ 创建了测试用户\n");

  console.log("🎉 数据库填充完成！\n");
  console.log("📊 统计:");
  console.log(`   - 店铺: ${stores.length} 个`);
  console.log(`   - 租赁套餐: ${plans.length} 个`);
  console.log(`   - plan_stores: ${planStoreRecords.length} 条`);
  console.log(`   - 用户: 1 个`);
  console.log(`   - 优惠活动: 1 个`);
}

main()
  .catch((e) => {
    console.error("❌ 错误:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
