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
            component: true, // ServiceComponent
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!template) return null;

  // v10.2: 添加 outfitCategory 支持
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
      highlights: hotspot.component.defaultHighlights,
      images: hotspot.component.defaultImages,
      isBaseComponent: true,
      outfitCategory: hotspot.component.outfitCategory, // v10.2
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
 * v10.1: PlanComponent -> MerchantComponent -> ServiceComponent (template)
 * 重要：只显示商户明确保存过位置的热点（hotmapX/hotmapY 不为 null）
 */
export async function getPlanMapData(planId: string): Promise<MapData | null> {
  try {
    // v10.1: 获取套餐及其组件
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
            merchantComponent: {
              include: {
                template: true, // ServiceComponent
              },
            },
          },
          orderBy: { hotmapOrder: "asc" },
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
      .map((pc, index) => {
        const mc = pc.merchantComponent;
        const tpl = mc.template;

        return {
          id: pc.id,
          x: pc.hotmapX!,
          y: pc.hotmapY!,
          labelPosition: (pc.hotmapLabelPosition || "right") as "left" | "right" | "top" | "bottom",
          displayOrder: pc.hotmapOrder ?? index,
          component: {
            id: tpl.id,
            code: tpl.code,
            name: tpl.name,
            nameJa: tpl.nameJa,
            nameEn: tpl.nameEn,
            description: tpl.description,
            type: tpl.type,
            icon: tpl.icon,
            // v10.1: 商户自定义内容优先，否则使用平台默认
            highlights: mc.highlights.length > 0 ? mc.highlights : tpl.defaultHighlights,
            images: mc.images.length > 0 ? mc.images : tpl.defaultImages,
            isBaseComponent: true,
            outfitCategory: tpl.outfitCategory, // v10.2
          },
          // v10.1: 在 planComponents 中的组件都是已包含的
          isIncluded: true,
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
