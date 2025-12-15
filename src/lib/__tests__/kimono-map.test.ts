/**
 * 测试 kimono-map 热点数据一致性
 *
 * v10.1: PlanComponent -> MerchantComponent -> ServiceComponent
 * 确保用户端只显示商户明确设置过位置的热点
 */

import { describe, it, expect, afterAll } from "vitest";
import prisma from "../prisma";
import { getPlanMapData } from "../kimono-map";

describe("getPlanMapData - 热点位置一致性", () => {
  // 测试套餐 ID
  const TEST_PLAN_ID = "cmioftwvu0009yc2h40pakpy5";

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("只返回商户设置过位置的热点", async () => {
    // 1. 获取套餐的 planComponents 数据 (v10.1)
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: TEST_PLAN_ID },
      include: {
        planComponents: {
          include: {
            merchantComponent: {
              include: {
                template: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(plan).not.toBeNull();

    // 2. 计算有位置的组件数量
    const componentsWithPosition = plan!.planComponents.filter(
      (pc) => pc.hotmapX != null && pc.hotmapY != null
    );

    // 3. 调用 getPlanMapData
    const mapData = await getPlanMapData(TEST_PLAN_ID);

    expect(mapData).not.toBeNull();

    // 4. 验证热点数量与有位置的组件数量一致
    expect(mapData!.hotspots.length).toBe(componentsWithPosition.length);

    // 5. 验证每个热点都有位置
    mapData!.hotspots.forEach((hotspot) => {
      expect(hotspot.x).not.toBeNull();
      expect(hotspot.y).not.toBeNull();
      expect(typeof hotspot.x).toBe("number");
      expect(typeof hotspot.y).toBe("number");
      expect(hotspot.x).toBeGreaterThanOrEqual(0);
      expect(hotspot.x).toBeLessThanOrEqual(1);
      expect(hotspot.y).toBeGreaterThanOrEqual(0);
      expect(hotspot.y).toBeLessThanOrEqual(1);
    });

    // 6. 验证热点的模板 ID 与数据库中有位置的组件一致
    const dbTemplateIds = new Set(
      componentsWithPosition.map((pc) => pc.merchantComponent.template.id)
    );
    const mapTemplateIds = new Set(
      mapData!.hotspots.map((h) => h.component.id)
    );

    expect(mapTemplateIds.size).toBe(dbTemplateIds.size);
    mapTemplateIds.forEach((id) => {
      expect(dbTemplateIds.has(id)).toBe(true);
    });
  });

  it("不返回没有位置的组件", async () => {
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: TEST_PLAN_ID },
      include: {
        planComponents: {
          include: {
            merchantComponent: {
              include: {
                template: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 获取没有位置的组件
    const componentsWithoutPosition = plan!.planComponents.filter(
      (pc) => pc.hotmapX == null || pc.hotmapY == null
    );

    const mapData = await getPlanMapData(TEST_PLAN_ID);

    // 验证没有位置的组件不在返回结果中
    const mapTemplateIds = new Set(
      mapData!.hotspots.map((h) => h.component.id)
    );

    componentsWithoutPosition.forEach((pc) => {
      expect(mapTemplateIds.has(pc.merchantComponent.template.id)).toBe(false);
    });
  });

  it("返回正确的模板图片 URL", async () => {
    const mapData = await getPlanMapData(TEST_PLAN_ID);

    expect(mapData).not.toBeNull();
    expect(mapData!.imageUrl).toBeDefined();
    expect(typeof mapData!.imageUrl).toBe("string");
    expect(mapData!.imageUrl.length).toBeGreaterThan(0);
  });

  it("热点位置与商户保存的位置一致", async () => {
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: TEST_PLAN_ID },
      include: {
        planComponents: {
          where: {
            hotmapX: { not: null },
            hotmapY: { not: null },
          },
          include: {
            merchantComponent: {
              include: {
                template: true,
              },
            },
          },
        },
      },
    });

    const mapData = await getPlanMapData(TEST_PLAN_ID);

    // 创建 templateId -> planComponent 映射
    const planComponentMap = new Map(
      plan!.planComponents.map((pc) => [pc.merchantComponent.template.id, pc])
    );

    // 验证每个热点的位置与数据库一致
    mapData!.hotspots.forEach((hotspot) => {
      const pc = planComponentMap.get(hotspot.component.id);
      expect(pc).toBeDefined();
      expect(hotspot.x).toBe(pc!.hotmapX);
      expect(hotspot.y).toBe(pc!.hotmapY);
      expect(hotspot.labelPosition).toBe(pc!.hotmapLabelPosition || "right");
    });
  });
});

describe("商户端与用户端一致性", () => {
  const TEST_PLAN_ID = "cmioftwvu0009yc2h40pakpy5";

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("商户编辑器保存的位置 === 用户端显示的位置", async () => {
    // 模拟商户端：获取 planComponents 数据 (v10.1)
    const merchantView = await prisma.rentalPlan.findUnique({
      where: { id: TEST_PLAN_ID },
      include: {
        planComponents: {
          where: {
            hotmapX: { not: null },
            hotmapY: { not: null },
          },
          include: {
            merchantComponent: {
              include: {
                template: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 模拟用户端：调用 getPlanMapData
    const userView = await getPlanMapData(TEST_PLAN_ID);

    // 验证数量一致
    expect(userView!.hotspots.length).toBe(merchantView!.planComponents.length);

    // 验证每个热点的详细信息一致
    merchantView!.planComponents.forEach((pc) => {
      const tpl = pc.merchantComponent.template;
      const userHotspot = userView!.hotspots.find(
        (h) => h.component.id === tpl.id
      );

      expect(userHotspot).toBeDefined();
      expect(userHotspot!.x).toBe(pc.hotmapX);
      expect(userHotspot!.y).toBe(pc.hotmapY);
      expect(userHotspot!.labelPosition).toBe(pc.hotmapLabelPosition || "right");
      expect(userHotspot!.component.name).toBe(tpl.name);
      expect(userHotspot!.component.icon).toBe(tpl.icon);
      // v10.1: 在 planComponents 中的组件都是已包含的
      expect(userHotspot!.isIncluded).toBe(true);
    });
  });
});
