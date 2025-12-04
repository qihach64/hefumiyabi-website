import prisma from "@/lib/prisma";
import HomeClient from "./HomeClient";

// 禁用静态生成,在运行时动态渲染
export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 解析搜索参数（服务端预过滤）
  const params = await searchParams;
  const searchLocation = typeof params.location === 'string' ? params.location : '';

  // 获取所有活跃的 Theme（按 displayOrder 排序）
  const themes = await prisma.theme.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  // 构建 where 条件 - 只获取有 themeId 的套餐
  const whereConditions: {
    isActive: boolean;
    themeId: { not: null };
    region?: { contains: string };
  } = {
    isActive: true,
    themeId: { not: null },
  };

  // 如果有地点搜索，预过滤地区
  if (searchLocation) {
    whereConditions.region = {
      contains: searchLocation,
    };
  }

  // 获取有 Theme 的套餐
  const themedPlans = await prisma.rentalPlan.findMany({
    where: whereConditions,
    include: {
      theme: true,
      merchant: {
        select: {
          id: true,
          businessName: true,
        },
      },
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

  // 按 Theme 分组构建 sections
  const themeSections = themes.map((theme) => {
    const themePlans = themedPlans
      .filter((plan) => plan.themeId === theme.id)
      .slice(0, 8);

    return {
      id: theme.id,
      slug: theme.slug,
      icon: theme.icon || '',
      label: theme.name,
      description: theme.description || '',
      color: theme.color || '',
      plans: themePlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        nameEn: plan.nameEn,
        description: plan.description,
        price: plan.price,
        originalPrice: plan.originalPrice,
        imageUrl: plan.imageUrl,
        merchantName: plan.merchant?.businessName || plan.storeName || "",
        region: plan.region || "",
        category: plan.category,
        duration: plan.duration,
        isCampaign: !!plan.originalPrice && plan.originalPrice > plan.price,
        includes: plan.includes,
        planTags: plan.planTags,
      })),
    };
  }); // 保留所有 Theme（包括无套餐的，显示「即将上线」）

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
  const allPlansForClient = themedPlans.map((plan) => ({
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
    merchantName: plan.merchant?.businessName || plan.storeName || "",
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
    themeId: plan.themeId,
  }));

  return (
    <HomeClient
      themeSections={themeSections}
      allPlans={allPlansForClient}
      campaigns={activeCampaigns}
      stores={stores}
      tagCategories={tagCategories}
    />
  );
}
