import prisma from "@/lib/prisma";
import PlansClient from "./plans/PlansClient";

export default async function HomePage() {
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
    <PlansClient
      plans={allPlans}
      campaigns={activeCampaigns}
      stores={stores}
    />
  );
}
