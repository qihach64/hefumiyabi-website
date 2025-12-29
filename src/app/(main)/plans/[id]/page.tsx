import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PlanDetailClient from "@/components/PlanDetailClient";
import { getPlanMapData } from "@/lib/kimono-map";

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
        },
      },
      planStores: {
        where: { isActive: true },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  // Determine which store to use
  // Priority: 1. URL param (from search) -> 2. First available store -> 3. Default placeholder
  let store: { id: string; name: string };

  if (storeId) {
    // Try to find the store from planStores
    const matchedStore = plan.planStores.find((ps) => ps.store.id === storeId);
    if (matchedStore) {
      store = {
        id: matchedStore.store.id,
        name: matchedStore.store.name,
      };
    } else {
      // Fallback: fetch the store directly (might be valid store not in planStores)
      const storeData = await prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, name: true },
      });
      store = storeData || { id: "default", name: "请选择店铺" };
    }
  } else if (plan.planStores.length > 0) {
    // Use first available store
    store = {
      id: plan.planStores[0].store.id,
      name: plan.planStores[0].store.name,
    };
  } else {
    // Fallback: use plan's storeName field or default
    const defaultStore = await prisma.store.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    store = defaultStore || { id: "default", name: plan.storeName || "店铺" };
  }

  // Get plan-specific hotspot map data
  const mapData = await getPlanMapData(id);

  return <PlanDetailClient plan={plan} store={store} mapData={mapData} />;
}
