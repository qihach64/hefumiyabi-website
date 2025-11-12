import prisma from "@/lib/prisma";
import HomeClient from "./HomeClient";

// 禁用静态生成,在运行时动态渲染
export const dynamic = 'force-dynamic';

// 分类配置
export const categories = [
  { id: "LADIES", icon: "👩", label: "女士和服", description: "优雅传统的女士和服体验" },
  { id: "MENS", icon: "👨", label: "男士和服", description: "英俊潇洒的男士和服" },
  { id: "COUPLE", icon: "💑", label: "情侣套餐", description: "浪漫的双人和服体验" },
  { id: "FAMILY", icon: "👨‍👩‍👧‍👦", label: "亲子套餐", description: "全家共享和服之美" },
  { id: "GROUP", icon: "👥", label: "团体套餐", description: "朋友结伴和服体验" },
  { id: "SPECIAL", icon: "✨", label: "特别套餐", description: "独特主题和服体验" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 解析搜索参数（服务端预过滤）
  const params = await searchParams;
  const searchLocation = typeof params.location === 'string' ? params.location : '';

  // 构建 where 条件 - 根据搜索参数预过滤
  const whereConditions: any = {
    isActive: true,
  };

  // 如果有地点搜索，预过滤地区
  if (searchLocation) {
    whereConditions.region = {
      contains: searchLocation,
    };
  }

  // 获取租赁套餐(服务端预过滤 + 包括活动套餐、标签关联)
  const allPlans = await prisma.rentalPlan.findMany({
    where: whereConditions,
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
      { isFeatured: 'desc' },
      { isCampaign: 'desc' },
      { price: 'asc' },
    ],
  });

  // 为每个分类筛选前8个套餐(用于探索模式)
  const categorySections = categories.map((category) => {
    const categoryPlans = allPlans
      .filter((plan) => plan.category === category.id)
      .slice(0, 8);

    return {
      ...category,
      plans: categoryPlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        nameEn: plan.nameEn,
        description: plan.description,
        price: plan.price,
        originalPrice: plan.originalPrice,
        imageUrl: plan.imageUrl,
        storeName: plan.storeName || "未知店铺",
        region: plan.region || "",
        category: plan.category,
        duration: plan.duration,
        isCampaign: !!plan.originalPrice && plan.originalPrice > plan.price,
        includes: plan.includes,
        planTags: plan.planTags,
      })),
    };
  }).filter(section => section.plans.length > 0);

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

  // 转换所有套餐为客户端格式
  const allPlansForClient = allPlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    nameEn: plan.nameEn,
    description: plan.description,
    price: plan.price,
    originalPrice: plan.originalPrice,
    category: plan.category,
    duration: plan.duration,
    includes: plan.includes,
    imageUrl: plan.imageUrl,
    storeName: plan.storeName || "未知店铺",
    region: plan.region || "",
    tags: plan.tags,
    planTags: plan.planTags,
    isCampaign: plan.isCampaign,
    campaignId: plan.campaignId,
    campaign: plan.campaign,
    isLimited: plan.isLimited,
    maxBookings: plan.maxBookings,
    currentBookings: plan.currentBookings,
    availableFrom: plan.availableFrom?.toISOString(),
    availableUntil: plan.availableUntil?.toISOString(),
  }));

  return (
    <HomeClient
      categorySections={categorySections}
      allPlans={allPlansForClient}
      campaigns={activeCampaigns}
      stores={stores}
      tagCategories={tagCategories}
    />
  );
}
