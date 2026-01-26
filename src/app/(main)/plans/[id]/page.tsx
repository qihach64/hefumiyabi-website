import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PlanDetailClient from "@/components/PlanDetailClient";
import {
  buildMapDataFromPlan,
  getDefaultMapTemplate,
  type PlanComponentForMap,
} from "@/lib/kimono-map";

interface PlanDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    store?: string; // Store ID from search context
  }>;
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: PlanDetailPageProps) {
  const { id } = await params;
  const { store: storeId } = await searchParams;

  // Fetch plan with related data and available stores
  const plan = await prisma.rentalPlan.findUnique({
    where: { id },
    include: {
      campaign: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
        },
      },
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
      // mapData 优化：获取 planComponents 的热点字段
      planComponents: {
        select: {
          id: true,
          hotmapOrder: true,
          hotmapX: true,
          hotmapY: true,
          hotmapLabelPosition: true,
          hotmapLabelOffsetX: true,
          hotmapLabelOffsetY: true,
          merchantComponent: {
            select: {
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
        orderBy: { hotmapOrder: "asc" },
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
      planUpgrades: {
        orderBy: { displayOrder: "asc" },
        include: {
          merchantComponent: {
            select: {
              id: true,
              price: true,
              images: true,
              highlights: true,
              // 自定义服务字段
              isCustom: true,
              customName: true,
              customNameEn: true,
              customDescription: true,
              customIcon: true,
              customBasePrice: true,
              // 平台模板（自定义服务时为 null）
              template: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  nameEn: true,
                  description: true,
                  icon: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  // Store type with location data
  type StoreWithLocation = {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
    addressEn?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string | null;
    openingHours?: unknown;
  };

  // Determine which store to use
  // Priority: 1. URL param (from search) -> 2. First available store -> 3. Default placeholder
  let store: StoreWithLocation;

  if (storeId) {
    // Try to find the store from planStores
    const matchedStore = plan.planStores.find((ps) => ps.store.id === storeId);
    if (matchedStore) {
      store = {
        id: matchedStore.store.id,
        name: matchedStore.store.name,
        city: matchedStore.store.city,
        address: matchedStore.store.address,
        addressEn: matchedStore.store.addressEn,
        latitude: matchedStore.store.latitude,
        longitude: matchedStore.store.longitude,
        phone: matchedStore.store.phone,
        openingHours: matchedStore.store.openingHours,
      };
    } else {
      // Fallback: fetch the store directly (might be valid store not in planStores)
      const storeData = await prisma.store.findUnique({
        where: { id: storeId },
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
      });
      store = storeData || { id: "default", name: "请选择店铺" };
    }
  } else if (plan.planStores.length > 0) {
    // Use first available store
    const firstStore = plan.planStores[0].store;
    store = {
      id: firstStore.id,
      name: firstStore.name,
      city: firstStore.city,
      address: firstStore.address,
      addressEn: firstStore.addressEn,
      latitude: firstStore.latitude,
      longitude: firstStore.longitude,
      phone: firstStore.phone,
      openingHours: firstStore.openingHours,
    };
  } else {
    // Fallback: use plan's storeName field or default
    const defaultStore = await prisma.store.findFirst({
      where: { isActive: true },
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
    });
    store = defaultStore || { id: "default", name: plan.storeName || "店铺" };
  }

  // 构建 mapData：优先使用 theme.mapTemplate，否则 fallback 到默认模板
  // 注：fallback 查询仅在 theme 无 mapTemplate 时触发（边缘情况）
  let mapTemplate = plan.theme?.mapTemplate ?? null;
  if (!mapTemplate) {
    mapTemplate = await getDefaultMapTemplate();
  }
  const mapData = buildMapDataFromPlan(
    plan.planComponents as PlanComponentForMap[],
    mapTemplate
  );

  // Fetch related plans from the same theme (excluding current plan)
  let relatedPlans: {
    id: string;
    name: string;
    price: number;
    originalPrice: number | null;
    imageUrl: string | null;
    isCampaign: boolean;
    includes: string[];
    merchantName: string;
    region: string;
    planTags: { tag: { id: string; code: string; name: string; icon: string | null; color: string | null } }[];
  }[] = [];

  if (plan.themeId) {
    const rawRelatedPlans = await prisma.rentalPlan.findMany({
      where: {
        themeId: plan.themeId,
        id: { not: plan.id },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        imageUrl: true,
        isCampaign: true,
        includes: true,
        region: true,
        storeName: true,
        merchant: {
          select: {
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
        planComponents: {
          include: {
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
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { currentBookings: "desc" },
      ],
      take: 8,
    });

    // Transform to match expected interface
    relatedPlans = rawRelatedPlans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      imageUrl: p.imageUrl,
      isCampaign: p.isCampaign,
      includes: p.planComponents.length > 0
        ? p.planComponents.map((pc) =>
            pc.merchantComponent.template?.name || pc.merchantComponent.customName || "服务"
          )
        : p.includes,
      merchantName: p.merchant?.businessName || p.storeName || "",
      region: p.region || "",
      planTags: p.planTags,
    }));
  }

  return (
    <PlanDetailClient
      plan={plan}
      store={store}
      mapData={mapData}
      relatedPlans={relatedPlans}
    />
  );
}
