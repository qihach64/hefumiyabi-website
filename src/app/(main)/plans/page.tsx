import Link from "next/link";
import prisma from "@/lib/prisma";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  // 获取所有租赁套餐，按价格排序
  const plans = await prisma.rentalPlan.findMany({
    orderBy: [
      {
        price: "asc",
      },
    ],
  });

  // 获取店铺列表
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // 获取活跃的优惠活动
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      endDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      priority: "desc",
    },
    take: 1,
  });

  // 特色套餐（使用真实图片，映射到数据库中的套餐）
  const featuredPlansData = [
    {
      planSlug: "women-daily-discount", // 女士日常优惠和服套餐
      name: "每日特惠和服套餐",
      nameEn: "Special Daily Discount Kimono Plan",
      originalPrice: 5000,
      image:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/cdff65bedb063563c91e3ff6fe56e2004faee1b0-1092x1472.png",
      description: "每日5000日元套餐，包含20套简约设计，特别适合中老年女性",
      features: [
        "在线预订专享优惠",
        "包含专业着装服务",
        "免费发型设计",
        "20套和服可选",
        "东京浅草各店铺可用",
      ],
      location: "东京浅草店",
      duration: "4-8小时",
      gender: "仅限女性",
    },
    {
      planSlug: "couple-discount", // 情侣优惠套餐
      name: "情侣优惠套餐",
      nameEn: "Couple Discount Plan",
      originalPrice: 11000,
      image:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/5dd1195b6e98cb17cfaf210b018dc5d9582b574f-1066x1314.png",
      description: "最受欢迎的情侣套餐，包含蕾丝和服",
      features: [
        "一男一女情侣套装",
        "包含蕾丝和服",
        "免费发型设计",
        "专业着装服务",
        "京都清水寺店可用",
      ],
      location: "京都清水寺店",
      duration: "全天",
      gender: "情侣专享",
    },
    {
      planSlug: "group-5-people", // 5人团体套餐（1人免费）
      name: "5人团体优惠套餐",
      nameEn: "Group Discount Plan",
      originalPrice: 27500,
      image:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/d053820a53f8883cdc0debb7307375b260d383ab-1718x1714.png",
      description: "5人团体套餐，清水寺附近，一人免费",
      features: [
        "5人团体优惠价",
        "一人免费",
        "免费发型设计",
        "专业着装服务",
        "清水寺附近便利位置",
      ],
      location: "京都清水寺店",
      duration: "全天",
      gender: "团体专享",
    },
    {
      planSlug: "furisode-photoshoot", // 10周年振袖和服套餐（含60分钟摄影）
      name: "10周年振袖套餐+60分钟摄影",
      nameEn: "Premier Furisode Kimono Plan with Photo",
      originalPrice: 58000,
      image:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/2c5c377c69c7d60f41b052db2fdcfc955ff32437-1260x1536.png",
      description: "可爱时尚的设计，最新款式助您找到完美和服",
      features: [
        "60分钟专业摄影",
        "最新款振袖和服",
        "专业化妆发型",
        "精美照片成品",
        "10周年特别优惠",
      ],
      location: "东京浅草店",
      duration: "全天",
      gender: "女性专享",
      isSpecial: true,
    },
  ];

  // 将特色套餐数据与数据库套餐合并
  const featuredPlans = featuredPlansData.map((featured) => {
    const dbPlan = plans.find((p) => p.slug === featured.planSlug);
    return {
      ...featured,
      id: dbPlan?.id || featured.planSlug,
      price: dbPlan?.price || 0,
      dbPlan,
    };
  });

  return (
    <div className="flex flex-col">
      {/* 活动横幅 */}
      {activeCampaigns.length > 0 && (
        <Link
          href="/campaigns"
          className="block bg-gradient-to-r from-rose-600 via-pink-600 to-orange-600 text-white hover:from-rose-700 hover:via-pink-700 hover:to-orange-700 transition-all"
        >
          <div className="container py-4 md:py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                    <span className="text-2xl md:text-3xl">🎊</span>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-xs md:text-sm font-semibold opacity-90 mb-1">
                    {activeCampaigns[0].subtitle}
                  </div>
                  <div className="text-lg md:text-2xl font-black">
                    {activeCampaigns[0].title}
                  </div>
                  <div className="text-sm md:text-base opacity-95 mt-1">
                    在线预订享受{" "}
                    <span className="text-yellow-300 font-bold text-lg">
                      最高50%
                    </span>{" "}
                    折扣
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full bg-white text-rose-600 font-bold text-sm md:text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <span>立即查看</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* PlansClient 客户端组件 */}
      <PlansClient featuredPlans={featuredPlans} stores={stores} />
    </div>
  );
}
