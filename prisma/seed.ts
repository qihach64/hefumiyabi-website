import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始填充数据库...\n");

  // 清空现有数据
  console.log("🗑️  清空现有数据...");
  await prisma.bookingKimono.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.userBehavior.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.kimonoStore.deleteMany();
  await prisma.kimonoImage.deleteMany();
  await prisma.kimono.deleteMany();
  await prisma.rentalPlan.deleteMany();
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

  // 2. 创建租赁套餐
  console.log("📋 创建租赁套餐...");
  const plans = await Promise.all([
    prisma.rentalPlan.create({
      data: {
        slug: "women-daily-discount",
        name: "女士日常优惠和服套餐",
        nameEn: "Women's Daily Discount Kimono Plan",
        description: "轻松空手来店，免费发型设计等丰富选项。适合中老年女性，体验传统和服之美。",
        category: "LADIES",
        price: 30000, // ¥3,000 online = ¥300 CNY = 30000分
        depositAmount: 0,
        duration: 8,
        includes: ["和服租赁", "着装服务", "免费发型设计", "配饰一套", "包袋"],
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "furisode-photoshoot",
        name: "10周年振袖和服套餐（含60分钟摄影）",
        nameEn: "10th Anniversary Furisode Kimono Plan with 60min Photoshoot",
        description: "可爱风格、华丽图案丰富。适合成人式等重要场合，含专业摄影服务。",
        category: "SPECIAL",
        price: 380000, // ¥38,000 online
        depositAmount: 50000,
        duration: 4,
        includes: [
          "振袖和服租赁",
          "专业着装",
          "发型设计",
          "60分钟专业摄影",
          "全套配饰",
          "修图服务",
        ],
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "couple-discount",
        name: "情侣优惠套餐",
        nameEn: "Couple Discount Plan",
        description: "男女各一名的情侣套餐，在京都清水寺附近享受和服体验。",
        category: "COUPLE",
        price: 89990, // ¥8,999 online
        depositAmount: 0,
        duration: 8,
        includes: ["男士和服", "女士和服", "着装服务", "发型设计（女士）", "配饰"],
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "group-5-people",
        name: "5人团体套餐（1人免费）",
        nameEn: "Group Plan (5 People, 1 Free)",
        description: "在京都清水寺附近享受5人团体和服体验，其中1名免费。",
        category: "GROUP",
        price: 200000, // ¥20,000 online
        depositAmount: 0,
        duration: 8,
        includes: [
          "5套和服租赁",
          "着装服务",
          "发型设计",
          "配饰",
          "团体摄影（赠送）",
        ],
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "mens-standard",
        name: "男士标准和服套餐",
        nameEn: "Men's Standard Kimono Plan",
        description: "适合男士的标准和服体验，简约大方。",
        category: "MENS",
        price: 35000, // ¥3,500 estimate
        depositAmount: 0,
        duration: 8,
        includes: ["男士和服", "着装服务", "腰带", "木屐", "配饰"],
        isActive: true,
      },
    }),
    prisma.rentalPlan.create({
      data: {
        slug: "family-plan",
        name: "家庭套餐",
        nameEn: "Family Plan",
        description: "适合全家一起体验和服文化，包含儿童和服。",
        category: "FAMILY",
        price: 150000, // ¥15,000 estimate
        depositAmount: 0,
        duration: 8,
        includes: [
          "成人和服（2套）",
          "儿童和服（2套）",
          "着装服务",
          "发型设计",
          "全套配饰",
          "家庭合影（赠送）",
        ],
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ 创建了 ${plans.length} 个租赁套餐\n`);

  // 3. 创建和服
  console.log("👘 创建和服...");
  const kimonos = [];

  // 女士和服
  const womenStyles = [
    { name: "樱花粉振袖", style: "振袖", color: ["粉色", "白色"], pattern: ["樱花", "花卉"] },
    { name: "红梅访问着", style: "访问着", color: ["红色", "金色"], pattern: ["梅花", "花卉"] },
    { name: "紫藤色留袖", style: "留袖", color: ["紫色", "白色"], pattern: ["藤花", "花卉"] },
    { name: "天蓝色小纹", style: "小纹", color: ["蓝色", "白色"], pattern: ["几何", "波浪"] },
    { name: "翠绿色付下", style: "付下", color: ["绿色", "金色"], pattern: ["竹叶", "植物"] },
  ];

  for (let i = 0; i < womenStyles.length; i++) {
    const style = womenStyles[i];
    const kimono = await prisma.kimono.create({
      data: {
        code: `WOMEN-${String(i + 1).padStart(3, "0")}`,
        name: style.name,
        nameEn: `Women's ${style.style}`,
        description: `精美的${style.style}，适合各种正式和休闲场合。`,
        category: "WOMEN",
        style: style.style,
        color: style.color,
        pattern: style.pattern,
        season: ["SPRING", "SUMMER", "AUTUMN", "WINTER"],
        size: "M",
        isAvailable: true,
        images: {
          create: [
            {
              url: `https://placehold.co/800x1200/FF69B4/FFF?text=${style.name}`,
              alt: style.name,
              order: 0,
            },
          ],
        },
        stores: {
          create: stores.slice(0, 3).map((store, idx) => ({
            storeId: store.id,
            quantity: idx === 0 ? 2 : 1,
          })),
        },
      },
    });
    kimonos.push(kimono);
  }

  // 男士和服
  const menStyles = [
    { name: "深蓝色羽织", style: "羽织", color: ["蓝色", "黑色"], pattern: ["条纹"] },
    { name: "黑色正装", style: "黒紋付", color: ["黑色"], pattern: ["家纹"] },
    { name: "灰色袴套装", style: "袴", color: ["灰色", "黑色"], pattern: ["素色"] },
  ];

  for (let i = 0; i < menStyles.length; i++) {
    const style = menStyles[i];
    const kimono = await prisma.kimono.create({
      data: {
        code: `MEN-${String(i + 1).padStart(3, "0")}`,
        name: style.name,
        nameEn: `Men's ${style.style}`,
        description: `经典男士${style.style}，展现成熟稳重的气质。`,
        category: "MEN",
        style: style.style,
        color: style.color,
        pattern: style.pattern,
        season: ["ALL_SEASON"],
        size: "L",
        isAvailable: true,
        images: {
          create: [
            {
              url: `https://placehold.co/800x1200/4169E1/FFF?text=${style.name}`,
              alt: style.name,
              order: 0,
            },
          ],
        },
        stores: {
          create: stores.slice(0, 3).map((store, idx) => ({
            storeId: store.id,
            quantity: idx === 0 ? 2 : 1,
          })),
        },
      },
    });
    kimonos.push(kimono);
  }

  // 儿童和服
  const childrenStyles = [
    { name: "粉色花朵儿童和服", style: "儿童着物", color: ["粉色", "白色"], pattern: ["花卉"] },
    { name: "蓝色武士儿童和服", style: "儿童着物", color: ["蓝色", "黑色"], pattern: ["武士"] },
  ];

  for (let i = 0; i < childrenStyles.length; i++) {
    const style = childrenStyles[i];
    const kimono = await prisma.kimono.create({
      data: {
        code: `CHILD-${String(i + 1).padStart(3, "0")}`,
        name: style.name,
        nameEn: `Children's Kimono`,
        description: `可爱的儿童和服，让小朋友也能体验传统文化。`,
        category: "CHILDREN",
        style: style.style,
        color: style.color,
        pattern: style.pattern,
        season: ["ALL_SEASON"],
        size: "S",
        isAvailable: true,
        images: {
          create: [
            {
              url: `https://placehold.co/800x1200/FFB6C1/FFF?text=${style.name}`,
              alt: style.name,
              order: 0,
            },
          ],
        },
        stores: {
          create: stores.slice(0, 3).map((store) => ({
            storeId: store.id,
            quantity: 1,
          })),
        },
      },
    });
    kimonos.push(kimono);
  }

  console.log(`✅ 创建了 ${kimonos.length} 套和服\n`);

  // 4. 创建测试用户
  console.log("👤 创建测试用户...");
  const testUser = await prisma.user.create({
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

  // 5. 创建优惠活动
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
      campaignPlans: {
        create: [
          {
            name: "东京成人式振袖和服套餐 + 60分钟摄影",
            nameEn: "Tokyo Coming of Age Furisode Kimono + 60min Photography",
            description:
              "想体验最正式的和服就是振袖和服了！包含专业摄影服务，留下珍贵回忆。",
            originalPrice: 5800000, // ¥58,000 = ¥5,800 CNY = 580000分
            campaignPrice: 3800000, // ¥38,000
            duration: 8,
            includes: [
              "振袖和服租赁",
              "专业着装服务",
              "发型设计",
              "60分钟专业摄影",
              "全套配饰",
              "修图服务",
            ],
            applicableStores: ["asakusa-main", "asakusa-station", "asakusa-premium"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/2c5c377c69c7d60f41b052db2fdcfc955ff32437-1260x1536.png",
            ],
            isFeatured: true,
          },
          {
            name: "东京成人式振袖和服套餐",
            nameEn: "Tokyo Coming of Age Furisode Kimono",
            description: "正式振袖和服体验，适合各种重要场合。",
            originalPrice: 3800000, // ¥38,000
            campaignPrice: 1900000, // ¥19,000
            duration: 8,
            includes: [
              "振袖和服租赁",
              "专业着装服务",
              "发型设计",
              "全套配饰",
            ],
            applicableStores: ["asakusa-main", "asakusa-station", "asakusa-premium"],
            images: [],
            isFeatured: true,
          },
          {
            name: "家庭三人套餐 + 60分钟摄影",
            nameEn: "Family 3-Person Package + 60min Photography",
            description:
              "全家一同游日本，当然要和小宝贝们一同体验和服！包含父母和儿童套装。",
            originalPrice: 2600000, // ¥26,000
            campaignPrice: 1500000, // ¥15,000
            duration: 8,
            includes: [
              "成人和服 x2",
              "儿童和服 x1",
              "专业着装服务",
              "发型设计",
              "60分钟摄影",
              "全套配饰",
            ],
            applicableStores: ["asakusa-station"],
            images: [],
            isFeatured: true,
          },
          {
            name: "蕾丝复古和服团体优惠",
            nameEn: "Lace and Antique Kimono Group Discount",
            description: "蕾丝和复古和服特别限定套餐，适合团体游客。",
            originalPrice: 1500000, // ¥15,000
            campaignPrice: 900000, // ¥9,000
            duration: 8,
            includes: [
              "蕾丝/复古和服租赁",
              "专业着装服务",
              "发型设计",
              "全套配饰",
            ],
            applicableStores: ["asakusa-station"],
            images: [],
            isFeatured: false,
          },
          {
            name: "蕾丝复古和服情侣优惠（浅草本店）",
            nameEn: "Lace and Antique Kimono Couple Discount",
            description: "优雅或甜美的蕾丝和服，专为情侣设计。",
            originalPrice: 1500000, // ¥15,000
            campaignPrice: 1100000, // ¥11,000
            duration: 8,
            includes: [
              "蕾丝和服 x2",
              "专业着装服务",
              "发型设计",
              "全套配饰",
            ],
            applicableStores: ["asakusa-main"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/5dd1195b6e98cb17cfaf210b018dc5d9582b574f-1066x1314.png",
            ],
            isFeatured: false,
          },
          {
            name: "振袖情侣和服套餐",
            nameEn: "Furisode Couple Kimono Package",
            description: "只要人对了，天天都是情人节！华丽振袖情侣套装。",
            originalPrice: 5800000, // ¥58,000
            campaignPrice: 3900000, // ¥39,000
            duration: 8,
            includes: [
              "振袖和服 x2",
              "专业着装服务",
              "发型设计",
              "全套配饰",
              "情侣摄影（赠送）",
            ],
            applicableStores: ["asakusa-premium"],
            images: [],
            isFeatured: true,
          },
        ],
      },
    },
  });
  console.log("✅ 创建了1个优惠活动，包含6个活动套餐\n");

  console.log("🎉 数据库填充完成！\n");
  console.log("📊 统计:");
  console.log(`   - 店铺: ${stores.length} 个`);
  console.log(`   - 租赁套餐: ${plans.length} 个`);
  console.log(`   - 和服: ${kimonos.length} 套`);
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
