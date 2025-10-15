import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 更新优惠活动数据...\n");

  // 删除旧的活动数据
  console.log("🗑️  删除旧的活动数据...");
  await prisma.campaignPlan.deleteMany();
  await prisma.campaign.deleteMany();
  console.log("✅ 删除完成\n");

  // 创建新的10周年活动
  console.log("🎉 创建10周年活动...");
  const campaign = await prisma.campaign.create({
    data: {
      slug: "10th-anniversary",
      title: "雅10週年・特别企劃",
      titleEn: "10th Anniversary Special Campaign",
      subtitle: "衷心感谢10年来与我们同行的各位！",
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
      restrictions: [
        "无法用于成人式・毕业典礼",
        "由于是促销活动，不可退款",
        "可更改日期(仅限一次)",
      ],
      terms:
        "本活动仅限在线预订。活动期间预订的套餐可在一年内使用。如需改期或取消，请遵循正常的预约政策。",
      campaignPlans: {
        create: [
          // 1. 东京成人礼振袖+60min摄影
          {
            name: "东京成人礼振袖+60min摄影",
            nameEn: "Tokyo Coming of Age Furisode Kimono + 60min Photography",
            description:
              "想体验最正式的和服就是振袖和服了，作为未婚女性最高规格的服装，包含专业摄影服务，留下珍贵回忆。",
            originalPrice: 5800000, // ¥58,000 (以分为单位)
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
            applicableStores: ["浅草本店", "浅草站前店", "浅草雅旗舰店"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/5ef6c3a865bcd12cf265fd1c7ec4a615a9e83a47-1104x1648.png",
            ],
            isFeatured: true,
          },
          // 2. 东京成人礼振袖
          {
            name: "东京成人礼振袖",
            nameEn: "Tokyo Coming of Age Furisode Kimono",
            description:
              "正式振袖和服体验，适合各种重要场合。未婚女性最高规格的和服。",
            originalPrice: 3800000, // ¥38,000
            campaignPrice: 1900000, // ¥19,000
            duration: 8,
            includes: [
              "振袖和服租赁",
              "专业着装服务",
              "发型设计",
              "全套配饰",
            ],
            applicableStores: ["浅草本店", "浅草站前店", "浅草雅旗舰店"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/5ef6c3a865bcd12cf265fd1c7ec4a615a9e83a47-1104x1648.png",
            ],
            isFeatured: true,
          },
          // 3. 亲子3人套餐+60min摄影
          {
            name: "亲子3人套餐+60min摄影",
            nameEn: "Family 3-Person Package + 60min Photography",
            description:
              "全家一同游日本，当然要和小宝贝们一同体验和服！包含父母和儿童套装以及60分钟专业摄影。",
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
              "修图服务",
            ],
            applicableStores: ["浅草站前店"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/0d1fe0d95b500381ce674179f32e90ba7d78f337-1302x1660.png",
            ],
            isFeatured: true,
          },
          // 4. 和洋蕾丝和服双人套餐
          {
            name: "和洋蕾丝和服双人套餐",
            nameEn: "Lace and Antique Kimono Double Package",
            description:
              "体验过了传统的和服，想要有点不一样的变化吗？蕾丝复古和服特别限定套餐，适合双人游客。",
            originalPrice: 1500000, // ¥15,000
            campaignPrice: 900000, // ¥9,000
            duration: 8,
            includes: [
              "蕾丝/复古和服租赁 x2",
              "专业着装服务",
              "发型设计",
              "全套配饰",
            ],
            applicableStores: ["浅草站前店"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/392ef8ae7e6c97b6ce5c2efb25a059fd21d97a2c-1214x1634.png",
            ],
            isFeatured: false,
          },
          // 5. 和洋蕾丝和服情侣方案(浅草本店限定)
          {
            name: "和洋蕾丝和服情侣方案(浅草本店限定)",
            nameEn: "Lace and Antique Kimono Couple Plan (Asakusa Main Store)",
            description:
              "优雅或甜美的蕾丝和服，专为情侣设计。加点蕾丝、长裙，或是带顶现代的帽子，打造独特风格。",
            originalPrice: 1500000, // ¥15,000
            campaignPrice: 1100000, // ¥11,000
            duration: 8,
            includes: [
              "蕾丝和服 x2",
              "专业着装服务",
              "发型设计",
              "全套配饰",
              "现代配饰（帽子/长裙等）",
            ],
            applicableStores: ["浅草本店"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/76902bff15f5be0c2a31fc77bd08d3e51ee0fbcb-820x1292.png",
            ],
            isFeatured: false,
          },
          // 6. 和洋蕾丝和服情侣方案
          {
            name: "和洋蕾丝和服情侣方案",
            nameEn: "Lace and Antique Kimono Couple Plan",
            description:
              "情侣专属蕾丝和服套餐，浪漫甜美。加入现代元素，打造与众不同的和服体验。",
            originalPrice: 1300000, // ¥13,000
            campaignPrice: 600000, // ¥6,000
            duration: 8,
            includes: [
              "蕾丝和服 x2",
              "专业着装服务",
              "发型设计",
              "全套配饰",
              "现代配饰",
            ],
            applicableStores: ["浅草站前店"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/d23ed1e8913acfba76528621ed8f3fa0b7a0dc0f-1334x1628.png",
            ],
            isFeatured: true,
          },
          // 7. 和洋蕾丝和服(浅草本店限定)
          {
            name: "和洋蕾丝和服(浅草本店限定)",
            nameEn: "Lace and Antique Kimono (Asakusa Main Store Limited)",
            description:
              "体验过了传统的和服，想要有点不一样的变化吗？加点蕾丝、长裙，或是带顶现代的帽子，打造独特风格。",
            originalPrice: 1300000, // ¥13,000
            campaignPrice: 600000, // ¥6,000
            duration: 8,
            includes: [
              "蕾丝/复古和服租赁",
              "专业着装服务",
              "发型设计",
              "全套配饰",
              "现代配饰（帽子/长裙等）",
            ],
            applicableStores: ["浅草本店"],
            images: [
              "https://cdn.sanity.io/images/u9jvdp7a/staging/ae93ec3d5c6338e35e2a511165993cab7582afde-1340x1710.png",
            ],
            isFeatured: false,
          },
        ],
      },
    },
    include: {
      campaignPlans: true,
    },
  });

  console.log("✅ 创建完成！\n");
  console.log(`📊 统计:`);
  console.log(`   - 优惠活动: 1 个`);
  console.log(`   - 活动套餐: ${campaign.campaignPlans.length} 个`);
  console.log(`\n🎉 数据更新完成！`);
}

main()
  .catch((e) => {
    console.error("❌ 错误:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
