import prisma from "@/lib/prisma";
import type { MapData, HotspotData } from "@/components/plan/InteractiveKimonoMap/types";

/**
 * 获取默认地图模板数据
 * 用于展示标准和服配件图
 */
export async function getDefaultMapData(): Promise<MapData | null> {
  try {
    // 检查 mapTemplate 模型是否存在（处理 Prisma 客户端未更新的情况）
    if (!prisma.mapTemplate) {
      console.warn("MapTemplate model not found in Prisma client");
      return null;
    }

    const template = await prisma.mapTemplate.findFirst({
      where: { isDefault: true, isActive: true },
      include: {
        hotspots: {
          include: {
            component: {
              include: {
                upgradesTo: true,
              },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!template) return null;

  const hotspots: HotspotData[] = template.hotspots.map((hotspot) => ({
    id: hotspot.id,
    x: hotspot.x,
    y: hotspot.y,
    labelPosition: hotspot.labelPosition as "left" | "right" | "top" | "bottom",
    displayOrder: hotspot.displayOrder,
    component: {
      id: hotspot.component.id,
      code: hotspot.component.code,
      name: hotspot.component.name,
      nameJa: hotspot.component.nameJa,
      nameEn: hotspot.component.nameEn,
      description: hotspot.component.description,
      type: hotspot.component.type,
      icon: hotspot.component.icon,
      highlights: hotspot.component.highlights,
      images: hotspot.component.images,
      isBaseComponent: hotspot.component.isBaseComponent,
      upgradeCost: hotspot.component.upgradeCost,
      upgradesTo: hotspot.component.upgradesTo.map((u) => ({
        id: u.id,
        code: u.code,
        name: u.name,
        nameJa: u.nameJa,
        nameEn: u.nameEn,
        description: u.description,
        type: u.type,
        icon: u.icon,
        highlights: u.highlights,
        images: u.images,
        isBaseComponent: u.isBaseComponent,
        upgradeCost: u.upgradeCost,
      })),
    },
    // 默认所有组件都已包含
    isIncluded: true,
  }));

  return {
    imageUrl: template.imageUrl,
    imageWidth: template.imageWidth,
    imageHeight: template.imageHeight,
    hotspots,
  };
  } catch (error) {
    console.error("Error fetching default map data:", error);
    return null;
  }
}

/**
 * 获取套餐的地图数据（包含套餐特定的覆盖配置）
 */
export async function getPlanMapData(planId: string): Promise<MapData | null> {
  try {
    // 获取套餐及其主题关联的地图模板
    const plan = await prisma.rentalPlan.findUnique({
    where: { id: planId },
    include: {
      theme: {
        include: {
          mapTemplate: {
            include: {
              hotspots: {
                include: {
                  component: {
                    include: {
                      upgradesTo: true,
                    },
                  },
                },
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
      },
      planComponents: {
        include: {
          component: true,
        },
      },
    },
  });

  if (!plan) return null;

  // 获取模板：优先使用主题关联的，否则使用默认模板
  let template = plan.theme?.mapTemplate;
  if (!template) {
    template = await prisma.mapTemplate.findFirst({
      where: { isDefault: true, isActive: true },
      include: {
        hotspots: {
          include: {
            component: {
              include: {
                upgradesTo: true,
              },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  }

  if (!template) return null;

  // 构建 planComponent 映射（componentId -> planComponent）
  const planComponentMap = new Map(
    plan.planComponents.map((pc) => [pc.componentId, pc])
  );

  const hotspots: HotspotData[] = template.hotspots.map((hotspot) => {
    const planComponent = planComponentMap.get(hotspot.componentId);

    return {
      id: hotspot.id,
      x: hotspot.x,
      y: hotspot.y,
      labelPosition: hotspot.labelPosition as "left" | "right" | "top" | "bottom",
      displayOrder: hotspot.displayOrder,
      component: {
        id: hotspot.component.id,
        code: hotspot.component.code,
        name: hotspot.component.name,
        nameJa: hotspot.component.nameJa,
        nameEn: hotspot.component.nameEn,
        description: hotspot.component.description,
        type: hotspot.component.type,
        icon: hotspot.component.icon,
        highlights: hotspot.component.highlights,
        images: hotspot.component.images,
        isBaseComponent: hotspot.component.isBaseComponent,
        upgradeCost: hotspot.component.upgradeCost,
        upgradesTo: hotspot.component.upgradesTo.map((u) => ({
          id: u.id,
          code: u.code,
          name: u.name,
          nameJa: u.nameJa,
          nameEn: u.nameEn,
          description: u.description,
          type: u.type,
          icon: u.icon,
          highlights: u.highlights,
          images: u.images,
          isBaseComponent: u.isBaseComponent,
          upgradeCost: u.upgradeCost,
        })),
      },
      // 套餐特定配置
      isIncluded: planComponent?.isIncluded ?? false,
      isHighlighted: planComponent?.isHighlighted ?? false,
      tier: planComponent?.tier,
      tierLabel: planComponent?.tierLabel,
      customNote: planComponent?.customNote,
      nameOverride: planComponent?.nameOverride,
      descriptionOverride: planComponent?.descriptionOverride,
      highlightsOverride: planComponent?.highlightsOverride ?? [],
    };
  });

  return {
    imageUrl: template.imageUrl,
    imageWidth: template.imageWidth,
    imageHeight: template.imageHeight,
    hotspots,
  };
  } catch (error) {
    console.error("Error fetching plan map data:", error);
    return null;
  }
}
