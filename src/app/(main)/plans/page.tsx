import Link from "next/link";
import prisma from "@/lib/prisma";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  // 获取所有租赁套餐（包括活动套餐）
  const allPlans = await prisma.rentalPlan.findMany({
    include: {
      campaign: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
        },
      },
    },
    orderBy: [
      { isCampaign: 'desc' }, // 活动套餐优先
      { price: 'asc' },
    ],
  });

  // 获取所有活跃的优惠活动
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      endDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      priority: 'desc',
    },
  });

  // 获取店铺列表
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: 'asc',
    },
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
      <PlansClient
        plans={allPlans}
        campaigns={activeCampaigns}
        stores={stores}
      />
    </div>
  );
}
