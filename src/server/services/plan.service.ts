import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type {
  HomepageData,
  HomepagePlanCard,
  ThemeSection,
  GetHomepagePlansOptions,
} from '@/types/homepage';
import type { MapData, HotspotData } from '@/components/plan/InteractiveKimonoMap/types';

// ============================================================
// mapData 构建相关类型和辅助函数
// ============================================================

type MapTemplateData = {
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
};

// planComponent 查询结果类型（用于 mapData 构建）
type PlanComponentForMapData = {
  id: string;
  hotmapX: number | null;
  hotmapY: number | null;
  hotmapOrder: number | null;
  hotmapLabelPosition: string | null;
  hotmapLabelOffsetX: number | null;
  hotmapLabelOffsetY: number | null;
  merchantComponent: {
    customName: string | null;
    highlights: string[];
    images: string[];
    template: {
      id: string;
      code: string;
      name: string;
      nameJa: string | null;
      nameEn: string | null;
      description: string | null;
      type: string;
      icon: string | null;
      outfitCategory: string | null;
      defaultHighlights: string[];
      defaultImages: string[];
    } | null;
  };
};

// 带有效热点的 planComponent（类型守卫后）
type PlanComponentWithValidHotspot = PlanComponentForMapData & {
  hotmapX: number;
  hotmapY: number;
  merchantComponent: PlanComponentForMapData['merchantComponent'] & {
    template: NonNullable<PlanComponentForMapData['merchantComponent']['template']>;
  };
};

// 类型守卫：检查是否有有效热点数据
function hasValidHotspot(pc: PlanComponentForMapData): pc is PlanComponentWithValidHotspot {
  return pc.hotmapX != null && pc.hotmapY != null && pc.merchantComponent.template != null;
}

// 构建单个 hotspot
function buildHotspot(pc: PlanComponentWithValidHotspot, index: number): HotspotData {
  const mc = pc.merchantComponent;
  const tpl = mc.template;
  return {
    id: pc.id,
    x: pc.hotmapX,
    y: pc.hotmapY,
    labelPosition: (pc.hotmapLabelPosition || 'right') as 'left' | 'right' | 'top' | 'bottom',
    labelOffsetX: pc.hotmapLabelOffsetX,
    labelOffsetY: pc.hotmapLabelOffsetY,
    displayOrder: pc.hotmapOrder ?? index,
    component: {
      id: tpl.id,
      code: tpl.code,
      name: tpl.name,
      nameJa: tpl.nameJa,
      nameEn: tpl.nameEn,
      description: tpl.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: tpl.type as any,
      icon: tpl.icon,
      highlights: mc.highlights.length > 0 ? mc.highlights : tpl.defaultHighlights,
      images: mc.images.length > 0 ? mc.images : tpl.defaultImages,
      isBaseComponent: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      outfitCategory: tpl.outfitCategory as any,
    },
    isIncluded: true,
  };
}

// 构建 mapData（纯数据转换）
function buildMapData(
  planComponents: PlanComponentForMapData[],
  mapTemplate: MapTemplateData | null
): MapData | null {
  if (!mapTemplate) return null;

  const hotspots = planComponents.filter(hasValidHotspot).map((pc, index) => buildHotspot(pc, index));

  return {
    imageUrl: mapTemplate.imageUrl,
    imageWidth: mapTemplate.imageWidth,
    imageHeight: mapTemplate.imageHeight,
    hotspots,
  };
}

// /plans 页面数据类型
export interface PlansPagePlanCard {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  merchantName?: string;
  region?: string;
  duration: number;
  isCampaign: boolean;
  includes: string[];
  planTags: { tag: { id: string; code: string; name: string; icon: string | null; color: string | null } }[];
  themeId?: string;
  themeName?: string;
  themeIcon?: string;
}

export interface PlansPageTheme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string;
  description: string | null;
}

export interface PlansPageTagCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  tags: { id: string; code: string; name: string; icon: string | null; color: string | null }[];
}

export interface PlansPageData {
  themes: PlansPageTheme[];
  plans: PlansPagePlanCard[];
  tagCategories: PlansPageTagCategory[];
  maxPrice: number;
}

// 日本传统色系映射 (低饱和度、高明度，与樱花粉协调)
const THEME_COLOR_MAP: Record<string, string> = {
  'trendy-photo': '#F28B82',    // 薄红 - 柔和的珊瑚红
  'formal-ceremony': '#FFCC80', // 杏色 - 温暖的淡橙色
  'together': '#80CBC4',        // 青磁 - 清新的薄荷青
  'seasonal': '#AED581',        // 萌黄 - 柔和自然
  'casual-stroll': '#90CAF9',   // 勿忘草 - 通透的天空蓝
  'specialty': '#B39DDB',       // 藤紫 - 优雅的浅紫色
};

export interface PlanListParams {
  theme?: string;
  storeId?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

// 详情页类型定义
export interface PlanDetailStoreData {
  id: string;
  name: string;
  city?: string;
  address?: string;
  addressEn?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours?: unknown;
}

export interface PlanDetailComponentData {
  name: string;
  icon?: string;
}

export interface PlanDetailUpgradeData {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  price: number;
  images: string[];
  highlights: string[];
  icon?: string;
}

export interface PlanDetailTagData {
  id: string;
  code: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface PlanDetailData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  images: string[];
  duration: number;
  region?: string;
  storeName?: string;
  highlights: string[];
  isFeatured: boolean;
  isActive: boolean;
  isCampaign: boolean;
  theme: { id: string; slug: string; name: string };
  campaign?: { id: string; slug: string; title: string; description: string | null };
  merchant: { businessName: string };
  defaultStore: PlanDetailStoreData | null;
  stores: PlanDetailStoreData[];
  components: PlanDetailComponentData[];
  upgrades: PlanDetailUpgradeData[];
  tags: PlanDetailTagData[];
  mapData: MapData | null; // 优化：合并 mapData 查询
}

export interface RelatedPlanData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  region?: string;
  merchantName?: string;
  isCampaign: boolean;
  includes: string[];
  tags: PlanDetailTagData[];
}

export const planService = {
  async getList(params: PlanListParams) {
    const { theme, storeId, location, limit = 20, offset = 0 } = params;

    const where: Prisma.RentalPlanWhereInput = {
      isActive: true,
    };

    if (theme) {
      where.theme = { slug: theme };
    }

    // Build planStores filter (combine storeId and location if both provided)
    if (storeId || location) {
      const storeFilter: Prisma.PlanStoreWhereInput = {};

      if (storeId) {
        storeFilter.storeId = storeId;
      }

      if (location) {
        storeFilter.store = {
          OR: [
            { city: { contains: location, mode: 'insensitive' } },
            { name: { contains: location, mode: 'insensitive' } },
          ],
        };
      }

      where.planStores = { some: storeFilter };
    }

    const [plans, total] = await Promise.all([
      prisma.rentalPlan.findMany({
        where,
        include: {
          theme: true,
          planStores: { include: { store: true } },
          planTags: { include: { tag: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'desc' }],
        take: limit,
        skip: offset,
      }),
      prisma.rentalPlan.count({ where }),
    ]);

    return { plans, total, limit, offset };
  },

  /**
   * 获取套餐详情 (优化版)
   * - 使用 select 精简字段
   * - 统一处理 Store fallback
   * - 返回格式化的 PlanDetailData
   */
  async getDetailById(id: string, storeId?: string): Promise<PlanDetailData | null> {
    const startTime = performance.now();
    const queryStart = performance.now();

    const plan = await prisma.rentalPlan.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        imageUrl: true,
        images: true,
        duration: true,
        region: true,
        storeName: true,
        highlights: true,
        isFeatured: true,
        isActive: true,
        isCampaign: true,
        theme: {
          select: {
            id: true,
            slug: true,
            name: true,
            // mapData 优化：获取 mapTemplate
            mapTemplate: {
              select: {
                imageUrl: true,
                imageWidth: true,
                imageHeight: true,
              },
            },
          },
        },
        campaign: {
          select: { id: true, slug: true, title: true, description: true },
        },
        merchant: {
          select: { businessName: true },
        },
        planStores: {
          where: { isActive: true },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                addressEn: true,
                latitude: true,
                longitude: true,
                phone: true,
                openingHours: true,
              },
            },
          },
        },
        planComponents: {
          select: {
            id: true,
            hotmapOrder: true,
            // mapData 优化：热点坐标字段
            hotmapX: true,
            hotmapY: true,
            hotmapLabelPosition: true,
            hotmapLabelOffsetX: true,
            hotmapLabelOffsetY: true,
            merchantComponent: {
              select: {
                customName: true,
                // mapData 优化：完整 template 数据
                highlights: true,
                images: true,
                template: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    nameJa: true,
                    nameEn: true,
                    description: true,
                    type: true,
                    icon: true,
                    outfitCategory: true,
                    defaultHighlights: true,
                    defaultImages: true,
                  },
                },
              },
            },
          },
          orderBy: { hotmapOrder: 'asc' },
        },
        planUpgrades: {
          select: {
            priceOverride: true,
            merchantComponent: {
              select: {
                id: true,
                price: true,
                images: true,
                highlights: true,
                customName: true,
                customNameEn: true,
                customDescription: true,
                customIcon: true,
                template: {
                  select: {
                    name: true,
                    nameEn: true,
                    description: true,
                    icon: true,
                  },
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        planTags: {
          include: {
            tag: {
              select: { id: true, code: true, name: true, icon: true, color: true },
            },
          },
        },
      },
    });

    const queryTime = performance.now() - queryStart;

    if (!plan || !plan.theme) return null;

    // Store fallback 统一处理
    const stores: PlanDetailStoreData[] = plan.planStores.map((ps) => ({
      id: ps.store.id,
      name: ps.store.name,
      city: ps.store.city || undefined,
      address: ps.store.address || undefined,
      addressEn: ps.store.addressEn || undefined,
      latitude: ps.store.latitude || undefined,
      longitude: ps.store.longitude || undefined,
      phone: ps.store.phone || undefined,
      openingHours: ps.store.openingHours || undefined,
    }));

    let defaultStore: PlanDetailStoreData | null = null;
    if (storeId) {
      // 优先使用 URL 传入的 storeId
      defaultStore = stores.find((s) => s.id === storeId) || stores[0] || null;
    } else {
      // 使用第一个关联店铺
      defaultStore = stores[0] || null;
    }

    const result: PlanDetailData = {
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      originalPrice: plan.originalPrice || undefined,
      imageUrl: plan.imageUrl || undefined,
      images: plan.images,
      duration: plan.duration,
      region: plan.region || undefined,
      storeName: plan.storeName || undefined,
      highlights: plan.highlights,
      isFeatured: plan.isFeatured,
      isActive: plan.isActive,
      isCampaign: plan.isCampaign || !!(plan.originalPrice && plan.originalPrice > plan.price),
      theme: plan.theme,
      campaign: plan.campaign || undefined,
      merchant: { businessName: plan.merchant?.businessName || '' },
      defaultStore,
      stores,
      components: plan.planComponents.map((pc) => ({
        name: pc.merchantComponent.customName || pc.merchantComponent.template?.name || '',
        icon: pc.merchantComponent.template?.icon || undefined,
      })),
      upgrades: plan.planUpgrades.map((pu) => ({
        id: pu.merchantComponent.id,
        name: pu.merchantComponent.customName || pu.merchantComponent.template?.name || '',
        nameEn: pu.merchantComponent.customNameEn || pu.merchantComponent.template?.nameEn || undefined,
        description: pu.merchantComponent.customDescription || pu.merchantComponent.template?.description || undefined,
        price: pu.priceOverride ?? pu.merchantComponent.price ?? 0,
        images: pu.merchantComponent.images,
        highlights: pu.merchantComponent.highlights,
        icon: pu.merchantComponent.customIcon || pu.merchantComponent.template?.icon || undefined,
      })),
      tags: plan.planTags.map((pt) => ({
        id: pt.tag.id,
        code: pt.tag.code,
        name: pt.tag.name,
        icon: pt.tag.icon || undefined,
        color: pt.tag.color || undefined,
      })),
      // mapData 优化：直接在 service 层构建
      mapData: await this.buildPlanMapData(plan.planComponents as PlanComponentForMapData[], plan.theme?.mapTemplate ?? null),
    };

    // 开发环境性能日志
    if (process.env.NODE_ENV === 'development') {
      const totalTime = performance.now() - startTime;
      const transformTime = totalTime - queryTime;
      console.log(`[planService.getDetailById] ⏱️ Total: ${totalTime.toFixed(1)}ms`);
      console.log(`  ├─ DB Query: ${queryTime.toFixed(1)}ms`);
      console.log(`  └─ Transform: ${transformTime.toFixed(1)}ms`);
    }

    return result;
  },

  /**
   * 构建套餐的 mapData（内部方法）
   * 优先使用 theme.mapTemplate，否则 fallback 到默认模板
   */
  async buildPlanMapData(
    planComponents: PlanComponentForMapData[],
    themeMapTemplate: MapTemplateData | null
  ): Promise<MapData | null> {
    let mapTemplate = themeMapTemplate;

    // Fallback: 如果主题没有 mapTemplate，使用全局默认模板
    if (!mapTemplate) {
      mapTemplate = await prisma.mapTemplate.findFirst({
        where: { isDefault: true, isActive: true },
        select: { imageUrl: true, imageWidth: true, imageHeight: true },
      });
    }

    return buildMapData(planComponents, mapTemplate);
  },

  // 保留原方法用于其他调用
  async getById(id: string) {
    return prisma.rentalPlan.findUnique({
      where: { id },
      include: {
        theme: true,
        planStores: { include: { store: true } },
        planTags: { include: { tag: true } },
        planComponents: {
          include: { merchantComponent: true },
          orderBy: { hotmapOrder: 'asc' },
        },
        planUpgrades: {
          include: { merchantComponent: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  },

  async getFeatured(limit = 8) {
    return prisma.rentalPlan.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        theme: true,
        planStores: { include: { store: true } },
      },
      orderBy: { displayOrder: 'desc' },
      take: limit,
    });
  },

  /**
   * 获取相关套餐（同主题）
   */
  async getRelatedPlans(
    themeId: string | null,
    excludeId: string,
    limit = 8
  ): Promise<RelatedPlanData[]> {
    if (!themeId) return [];

    const plans = await prisma.rentalPlan.findMany({
      where: {
        themeId,
        id: { not: excludeId },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        imageUrl: true,
        region: true,
        storeName: true,
        isCampaign: true,
        merchant: { select: { businessName: true } },
        planComponents: {
          select: {
            merchantComponent: {
              select: {
                customName: true,
                template: { select: { name: true } },
              },
            },
          },
          orderBy: { hotmapOrder: 'asc' },
        },
        planTags: {
          take: 3,
          include: {
            tag: { select: { id: true, code: true, name: true, icon: true, color: true } },
          },
        },
      },
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { currentBookings: 'desc' }],
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice || undefined,
      imageUrl: p.imageUrl || undefined,
      region: p.region || undefined,
      merchantName: p.merchant?.businessName || p.storeName || undefined,
      isCampaign: p.isCampaign || !!(p.originalPrice && p.originalPrice > p.price),
      includes: p.planComponents.map(
        (pc) => pc.merchantComponent.template?.name || pc.merchantComponent.customName || '服务'
      ),
      tags: p.planTags.map((pt) => ({
        id: pt.tag.id,
        code: pt.tag.code,
        name: pt.tag.name,
        icon: pt.tag.icon || undefined,
        color: pt.tag.color || undefined,
      })),
    }));
  },

  /**
   * 获取首页所需的所有数据
   * 使用 Promise.all 并行查询，精简字段减少数据传输
   */
  // 套餐卡片查询的 select 字段 (复用)
  _planCardSelect: {
    id: true,
    name: true,
    description: true,
    price: true,
    originalPrice: true,
    imageUrl: true,
    region: true,
    storeName: true,
    themeId: true,
    isFeatured: true,
    isCampaign: true,
    merchant: {
      select: { businessName: true },
    },
    planComponents: {
      select: {
        merchantComponent: {
          select: {
            customName: true,
            template: { select: { name: true } },
          },
        },
      },
      orderBy: { hotmapOrder: 'asc' as const },
    },
    planTags: {
      select: {
        tag: { select: { id: true, name: true, icon: true, color: true } },
      },
    },
  } satisfies Prisma.RentalPlanSelect,

  // 转换 DB 套餐为卡片格式
  _transformPlanCard(plan: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    originalPrice: number | null;
    imageUrl: string | null;
    region: string | null;
    storeName: string | null;
    themeId: string | null;
    merchant: { businessName: string } | null;
    planComponents: { merchantComponent: { customName: string | null; template: { name: string } | null } }[];
    planTags: { tag: { id: string; name: string; icon: string | null; color: string | null } }[];
  }): HomepagePlanCard {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      originalPrice: plan.originalPrice,
      imageUrl: plan.imageUrl,
      region: plan.region,
      merchantName: plan.merchant?.businessName || plan.storeName || '',
      isCampaign: !!(plan.originalPrice && plan.originalPrice > plan.price),
      includes: plan.planComponents.map(
        (pc) => pc.merchantComponent.template?.name || pc.merchantComponent.customName || '服务'
      ),
      planTags: plan.planTags,
      themeId: plan.themeId,
    };
  },

  async getHomepagePlans(options: GetHomepagePlansOptions = {}): Promise<HomepageData> {
    const { limitPerTheme = 8, searchLocation } = options;

    // 构建地点筛选条件
    const locationWhere: Prisma.RentalPlanWhereInput = searchLocation
      ? { region: { contains: searchLocation } }
      : {};

    // 第一步: 并行查询 themes + 辅助数据
    const [themes, campaigns, stores, tagCategories] = await Promise.all([
      prisma.theme.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, slug: true, name: true, icon: true, color: true, description: true },
      }),
      prisma.campaign.findMany({
        where: { isActive: true, endDate: { gte: new Date() } },
        orderBy: { priority: 'desc' },
        select: {
          id: true, slug: true, title: true, description: true,
          isActive: true, priority: true, startDate: true, endDate: true,
        },
      }),
      prisma.store.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      prisma.tagCategory.findMany({
        where: { isActive: true, showInFilter: true },
        select: {
          id: true, code: true, name: true, icon: true, color: true,
          tags: {
            where: { isActive: true },
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      }),
    ]);

    // 第二步: 按主题并行查询套餐 (每个主题 LIMIT limitPerTheme)
    const themePlansResults = await Promise.all(
      themes.map((theme) =>
        prisma.rentalPlan.findMany({
          where: { isActive: true, themeId: theme.id, ...locationWhere },
          take: limitPerTheme,
          orderBy: [{ isFeatured: 'desc' }, { isCampaign: 'desc' }, { price: 'asc' }],
          select: this._planCardSelect,
        })
      )
    );

    // 构建 themeSections
    const themeSections: ThemeSection[] = themes.map((theme, i) => ({
      id: theme.id,
      slug: theme.slug,
      icon: theme.icon || '',
      label: theme.name,
      description: theme.description || '',
      color: THEME_COLOR_MAP[theme.slug] || theme.color || '',
      plans: themePlansResults[i].map((p) => this._transformPlanCard(p)),
    }));

    return { themeSections, campaigns, stores, tagCategories };
  },

  /**
   * 获取搜索模式的所有套餐 (供 tRPC searchAll 使用)
   */
  async getSearchPlans(): Promise<HomepagePlanCard[]> {
    const plans = await prisma.rentalPlan.findMany({
      where: { isActive: true, themeId: { not: null } },
      select: this._planCardSelect,
      orderBy: [{ isFeatured: 'desc' }, { isCampaign: 'desc' }, { price: 'asc' }],
    });
    return plans.map((p) => this._transformPlanCard(p));
  },

  /**
   * 获取套餐列表页所需的所有数据
   * 用于 ISR 静态生成，不依赖 searchParams
   */
  async getPlansPageData(): Promise<PlansPageData> {
    // 并行执行 4 个查询
    const [themesRaw, plans, tagCategories, priceStats] = await Promise.all([
      // 1. 获取活跃主题
      prisma.theme.findMany({
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
      }),

      // 2. 获取所有活跃套餐 (精简字段)
      prisma.rentalPlan.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          originalPrice: true,
          imageUrl: true,
          region: true,
          storeName: true,
          duration: true,
          themeId: true,
          isFeatured: true,
          isCampaign: true,
          merchant: {
            select: {
              businessName: true,
            },
          },
          theme: {
            select: {
              name: true,
              icon: true,
            },
          },
          planComponents: {
            select: {
              merchantComponent: {
                select: {
                  customName: true,
                  template: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { hotmapOrder: 'asc' },
          },
          planTags: {
            select: {
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
        orderBy: [
          { isFeatured: 'desc' },
          { isCampaign: 'desc' },
          { price: 'asc' },
        ],
      }),

      // 3. 获取筛选用的标签分类
      prisma.tagCategory.findMany({
        where: {
          isActive: true,
          showInFilter: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          icon: true,
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
      }),

      // 4. 获取价格范围
      prisma.rentalPlan.aggregate({
        where: { isActive: true },
        _max: { price: true },
      }),
    ]);

    // 应用日本传统色系
    const themes: PlansPageTheme[] = themesRaw.map((theme) => ({
      id: theme.id,
      slug: theme.slug,
      name: theme.name,
      icon: theme.icon,
      color: THEME_COLOR_MAP[theme.slug] || theme.color || '',
      description: theme.description,
    }));

    // 转换套餐为客户端格式
    const plansForClient: PlansPagePlanCard[] = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || undefined,
      price: plan.price,
      originalPrice: plan.originalPrice || undefined,
      imageUrl: plan.imageUrl || undefined,
      merchantName: plan.merchant?.businessName || plan.storeName || undefined,
      region: plan.region || undefined,
      duration: plan.duration,
      isCampaign: !!plan.originalPrice && plan.originalPrice > plan.price,
      includes: plan.planComponents.map(
        (pc) => pc.merchantComponent.template?.name || pc.merchantComponent.customName || '服务'
      ),
      planTags: plan.planTags.map((pt) => ({ tag: pt.tag })),
      themeId: plan.themeId || undefined,
      themeName: plan.theme?.name || undefined,
      themeIcon: plan.theme?.icon || undefined,
    }));

    return {
      themes,
      plans: plansForClient,
      tagCategories,
      maxPrice: priceStats._max.price || 50000,
    };
  },
};
