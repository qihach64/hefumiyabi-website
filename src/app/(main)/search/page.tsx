import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import SearchClient from "./SearchClient";

// 禁用静态生成,在运行时动态渲染
export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const themeSlug = typeof params.theme === 'string' ? params.theme : '';
  const searchLocation = typeof params.location === 'string' ? params.location : '';
  const searchDate = typeof params.date === 'string' ? params.date : '';

  // 筛选参数（用于前端初始化状态，不用于后端过滤）
  const tagsParam = typeof params.tags === 'string' ? params.tags : '';
  const selectedTags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
  const minPriceParam = typeof params.minPrice === 'string' ? parseInt(params.minPrice, 10) : 0;
  const maxPriceParam = typeof params.maxPrice === 'string' ? parseInt(params.maxPrice, 10) : 0;
  const sortBy = typeof params.sort === 'string' ? params.sort : 'recommended';

  // 日本传统色系映射 (Override Database Colors)
  const themeColorMap: Record<string, string> = {
    'trendy-photo': '#F28B82',    // 薄红
    'formal-ceremony': '#FFCC80', // 杏色
    'together': '#80CBC4',        // 青磁
    'seasonal': '#AED581',        // 萌黄
    'casual-stroll': '#90CAF9',   // 勿忘草
    'specialty': '#B39DDB',       // 藤紫
  };

  // 获取所有活跃的 Theme
  const themesRaw = await prisma.theme.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      color: true,
      description: true,
    },
  });

  // 应用日本传统色系
  const themes = themesRaw.map(theme => ({
    ...theme,
    color: themeColorMap[theme.slug] || theme.color,
  }));

  // 获取筛选用的标签分类
  const tagCategories = await prisma.tagCategory.findMany({
    where: {
      isActive: true,
      showInFilter: true,
    },
    include: {
      tags: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { filterOrder: 'asc' },
  });

  // 构建套餐查询条件
  const whereConditions: Prisma.RentalPlanWhereInput = {
    isActive: true,
  };

  // 如果选择了主题，按主题筛选
  if (themeSlug) {
    const selectedTheme = themes.find(t => t.slug === themeSlug);
    if (selectedTheme) {
      whereConditions.themeId = selectedTheme.id;
    }
  }

  // 如果有地点搜索，预过滤地区
  if (searchLocation) {
    whereConditions.region = {
      contains: searchLocation,
      mode: 'insensitive',
    };
  }

  // 注意：标签、价格、排序筛选在前端进行，服务端只做主题和地点过滤
  // 这样可以实现即时过滤，不需要每次都请求后端

  // 默认排序（服务端）
  const orderBy: Prisma.RentalPlanOrderByWithRelationInput[] = [
    { isFeatured: 'desc' },
    { isCampaign: 'desc' },
    { price: 'asc' },
  ];

  // 获取套餐
  const plans = await prisma.rentalPlan.findMany({
    where: whereConditions,
    include: {
      theme: true,
      merchant: {
        select: {
          id: true,
          businessName: true,
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
            },
          },
        },
      },
    },
    orderBy,
  });

  // 获取价格范围（用于滑块）
  const priceStats = await prisma.rentalPlan.aggregate({
    where: { isActive: true },
    _max: { price: true },
  });
  const globalMaxPrice = priceStats._max.price || 50000;

  // 转换为客户端格式
  const plansForClient = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description || undefined,
    price: plan.price,
    originalPrice: plan.originalPrice || undefined,
    imageUrl: plan.imageUrl || undefined,
    merchantName: plan.merchant?.businessName || plan.storeName || undefined,
    region: plan.region || undefined,
    category: plan.category,
    duration: plan.duration,
    isCampaign: !!plan.originalPrice && plan.originalPrice > plan.price,
    includes: plan.includes,
    planTags: plan.planTags.map(pt => ({ tag: pt.tag })),
    themeId: plan.themeId || undefined,
    themeName: plan.theme?.name || undefined,
    themeIcon: plan.theme?.icon || undefined,
  }));

  // 当前选中的主题
  const currentTheme = themeSlug ? themes.find(t => t.slug === themeSlug) : null;

  return (
    <SearchClient
      themes={themes}
      plans={plansForClient}
      currentTheme={currentTheme}
      searchLocation={searchLocation}
      searchDate={searchDate}
      tagCategories={tagCategories}
      selectedTags={selectedTags}
      priceRange={[minPriceParam || 0, maxPriceParam || globalMaxPrice]}
      maxPrice={globalMaxPrice}
      sortBy={sortBy}
    />
  );
}
