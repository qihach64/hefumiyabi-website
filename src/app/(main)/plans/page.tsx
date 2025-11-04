import prisma from "@/lib/prisma";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  // 获取所有租赁套餐（包括活动套餐、标签关联和包含内容）
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
      planTags: {
        include: {
          tag: {
            select: {
              id: true,
              code: true,
              name: true,
              icon: true,
              color: true,
              categoryId: true,
            },
          },
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

  // 获取用于筛选器的标签分类和标签
  const tagCategories = await prisma.tagCategory.findMany({
    where: {
      isActive: true,
      showInFilter: true,
    },
    include: {
      tags: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
  });

  return (
    <PlansClient
      plans={allPlans}
      campaigns={activeCampaigns}
      stores={stores}
      tagCategories={tagCategories}
    />
  );
}
