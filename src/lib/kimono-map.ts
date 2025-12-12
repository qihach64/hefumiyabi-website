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
 * 获取套餐的地图数据（只显示商户明确设置过位置的热点）
 *
 * 重要：模板热点位置只是给商户编辑时的参考，
 * 用户端只显示商户明确保存过位置的热点（hotmapX/hotmapY 不为 null）
 */
export async function getPlanMapData(planId: string): Promise<MapData | null> {
  try {
    // 获取套餐及其组件（包含组件详情用于升级信息）
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: planId },
      include: {
        theme: {
          include: {
            mapTemplate: true, // 只需要模板图片，不需要热点
          },
        },
        planComponents: {
          include: {
            component: {
              include: {
                upgradesTo: true,
              },
            },
          },
        },
      },
    });

    if (!plan) return null;

    // 获取模板图片：优先使用主题关联的，否则使用默认模板
    let template = plan.theme?.mapTemplate;
    if (!template) {
      template = await prisma.mapTemplate.findFirst({
        where: { isDefault: true, isActive: true },
      });
    }

    if (!template) return null;

    // 只显示商户明确设置过位置的组件（hotmapX 和 hotmapY 都不为 null）
    const hotspots: HotspotData[] = plan.planComponents
      .filter((pc) => pc.hotmapX != null && pc.hotmapY != null)
      .map((pc, index) => ({
        id: pc.id,
        x: pc.hotmapX!,
        y: pc.hotmapY!,
        labelPosition: (pc.hotmapLabelPosition || "right") as "left" | "right" | "top" | "bottom",
        displayOrder: index,
        component: {
          id: pc.component.id,
          code: pc.component.code,
          name: pc.component.name,
          nameJa: pc.component.nameJa,
          nameEn: pc.component.nameEn,
          description: pc.component.description,
          type: pc.component.type,
          icon: pc.component.icon,
          highlights: pc.component.highlights,
          images: pc.component.images,
          isBaseComponent: pc.component.isBaseComponent,
          upgradeCost: pc.component.upgradeCost,
          upgradesTo: pc.component.upgradesTo.map((u) => ({
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
        // 套餐特定配置 (v9.1 simplified)
        isIncluded: pc.isIncluded,
        quantity: pc.quantity,
      }));

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
