/**
 * 测试 kimono-map 热点数据一致性
 *
 * v10.1: PlanComponent -> MerchantComponent -> ServiceComponent
 * 确保用户端只显示商户明确设置过位置的热点
 *
 * 使用 mock 替代真实数据库调用，确保测试可在无 DATABASE_URL 环境中运行
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// mock prisma 模块
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    rentalPlan: { findUnique: vi.fn() },
    mapTemplate: { findFirst: vi.fn() },
    $disconnect: vi.fn(),
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

import prisma from "../prisma";
import { getPlanMapData, getDefaultMapData } from "../kimono-map";

// 测试用模板数据
const mockTemplate = {
  id: "template-1",
  imageUrl: "https://example.com/map.jpg",
  imageWidth: 800,
  imageHeight: 1200,
  isDefault: true,
  isActive: true,
};

// 构造 ServiceComponent 模板
const makeTemplate = (id: string, name: string) => ({
  id,
  code: `comp-${id}`,
  name,
  nameJa: name,
  nameEn: `${name}-en`,
  description: `${name} 描述`,
  type: "GARMENT",
  icon: "👘",
  defaultHighlights: ["亮点1"],
  defaultImages: ["https://example.com/default.jpg"],
  outfitCategory: "UPPER_BODY",
});

// 构造 MerchantComponent
const makeMerchantComponent = (
  templateId: string,
  templateName: string,
  customHighlights: string[] = []
) => ({
  id: `mc-${templateId}`,
  highlights: customHighlights,
  images: [],
  template: makeTemplate(templateId, templateName),
});

// 构造 PlanComponent (有位置)
const makePlanComponent = (
  id: string,
  templateId: string,
  templateName: string,
  x: number,
  y: number,
  options: {
    labelPosition?: string;
    labelOffsetX?: number | null;
    labelOffsetY?: number | null;
    hotmapOrder?: number;
    customHighlights?: string[];
  } = {}
) => ({
  id,
  hotmapX: x,
  hotmapY: y,
  hotmapLabelPosition: options.labelPosition || "right",
  hotmapLabelOffsetX: options.labelOffsetX ?? null,
  hotmapLabelOffsetY: options.labelOffsetY ?? null,
  hotmapOrder: options.hotmapOrder ?? 0,
  merchantComponent: makeMerchantComponent(templateId, templateName, options.customHighlights),
});

// 构造 PlanComponent (无位置)
const makePlanComponentNoPosition = (id: string, templateId: string, templateName: string) => ({
  id,
  hotmapX: null,
  hotmapY: null,
  hotmapLabelPosition: "right",
  hotmapLabelOffsetX: null,
  hotmapLabelOffsetY: null,
  hotmapOrder: 0,
  merchantComponent: makeMerchantComponent(templateId, templateName),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPlanMapData - 热点位置一致性", () => {
  it("只返回商户设置过位置的热点", async () => {
    const planComponents = [
      makePlanComponent("pc-1", "tpl-1", "和服", 0.3, 0.5),
      makePlanComponent("pc-2", "tpl-2", "腰带", 0.5, 0.7),
      makePlanComponentNoPosition("pc-3", "tpl-3", "发饰"), // 无位置
    ];

    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: { mapTemplate: mockTemplate },
      planComponents,
    } as any);

    const mapData = await getPlanMapData("plan-1");

    expect(mapData).not.toBeNull();
    // 只有 2 个有位置的热点被返回
    expect(mapData!.hotspots).toHaveLength(2);

    // 每个热点都有合法位置
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
  });

  it("不返回没有位置的组件", async () => {
    const planComponents = [
      makePlanComponent("pc-1", "tpl-1", "和服", 0.3, 0.5),
      makePlanComponentNoPosition("pc-2", "tpl-2", "腰带"),
      makePlanComponentNoPosition("pc-3", "tpl-3", "发饰"),
    ];

    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: { mapTemplate: mockTemplate },
      planComponents,
    } as any);

    const mapData = await getPlanMapData("plan-1");

    expect(mapData).not.toBeNull();
    const mapTemplateIds = new Set(mapData!.hotspots.map((h) => h.component.id));

    // 无位置的组件不在结果中
    expect(mapTemplateIds.has("tpl-2")).toBe(false);
    expect(mapTemplateIds.has("tpl-3")).toBe(false);
    // 有位置的在
    expect(mapTemplateIds.has("tpl-1")).toBe(true);
  });

  it("返回正确的模板图片 URL", async () => {
    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: { mapTemplate: mockTemplate },
      planComponents: [makePlanComponent("pc-1", "tpl-1", "和服", 0.5, 0.5)],
    } as any);

    const mapData = await getPlanMapData("plan-1");

    expect(mapData).not.toBeNull();
    expect(mapData!.imageUrl).toBe("https://example.com/map.jpg");
    expect(mapData!.imageWidth).toBe(800);
    expect(mapData!.imageHeight).toBe(1200);
  });

  it("热点位置与商户保存的位置一致", async () => {
    const planComponents = [
      makePlanComponent("pc-1", "tpl-1", "和服", 0.3, 0.5, { labelPosition: "left" }),
      makePlanComponent("pc-2", "tpl-2", "腰带", 0.7, 0.8, { labelPosition: "right" }),
    ];

    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: { mapTemplate: mockTemplate },
      planComponents,
    } as any);

    const mapData = await getPlanMapData("plan-1");

    expect(mapData).not.toBeNull();

    // 验证位置一致
    const hotspot1 = mapData!.hotspots.find((h) => h.component.id === "tpl-1");
    expect(hotspot1).toBeDefined();
    expect(hotspot1!.x).toBe(0.3);
    expect(hotspot1!.y).toBe(0.5);
    expect(hotspot1!.labelPosition).toBe("left");

    const hotspot2 = mapData!.hotspots.find((h) => h.component.id === "tpl-2");
    expect(hotspot2).toBeDefined();
    expect(hotspot2!.x).toBe(0.7);
    expect(hotspot2!.y).toBe(0.8);
    expect(hotspot2!.labelPosition).toBe("right");
  });

  it("套餐不存在时返回 null", async () => {
    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue(null);

    const mapData = await getPlanMapData("nonexistent-plan");
    expect(mapData).toBeNull();
  });

  it("无主题模板时回退到默认模板", async () => {
    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: null, // 无主题
      planComponents: [makePlanComponent("pc-1", "tpl-1", "和服", 0.5, 0.5)],
    } as any);

    vi.mocked(prisma.mapTemplate.findFirst).mockResolvedValue(mockTemplate as any);

    const mapData = await getPlanMapData("plan-1");

    expect(mapData).not.toBeNull();
    expect(mapData!.imageUrl).toBe("https://example.com/map.jpg");
    expect(prisma.mapTemplate.findFirst).toHaveBeenCalledWith({
      where: { isDefault: true, isActive: true },
    });
  });

  it("无主题且无默认模板时返回 null", async () => {
    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: null,
      planComponents: [],
    } as any);

    vi.mocked(prisma.mapTemplate.findFirst).mockResolvedValue(null);

    const mapData = await getPlanMapData("plan-1");
    expect(mapData).toBeNull();
  });

  it("商户自定义内容优先于平台默认", async () => {
    const customHighlights = ["定制亮点1", "定制亮点2"];
    const planComponents = [
      makePlanComponent("pc-1", "tpl-1", "和服", 0.5, 0.5, { customHighlights }),
    ];

    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: { mapTemplate: mockTemplate },
      planComponents,
    } as any);

    const mapData = await getPlanMapData("plan-1");

    expect(mapData).not.toBeNull();
    expect(mapData!.hotspots[0].component.highlights).toEqual(customHighlights);
  });

  it("商户无自定义内容时使用平台默认", async () => {
    const planComponents = [
      makePlanComponent("pc-1", "tpl-1", "和服", 0.5, 0.5, { customHighlights: [] }),
    ];

    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: { mapTemplate: mockTemplate },
      planComponents,
    } as any);

    const mapData = await getPlanMapData("plan-1");

    expect(mapData).not.toBeNull();
    // 空数组时回退到默认
    expect(mapData!.hotspots[0].component.highlights).toEqual(["亮点1"]);
  });

  it("所有返回的热点 isIncluded 为 true", async () => {
    const planComponents = [
      makePlanComponent("pc-1", "tpl-1", "和服", 0.3, 0.5),
      makePlanComponent("pc-2", "tpl-2", "腰带", 0.7, 0.8),
    ];

    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: { mapTemplate: mockTemplate },
      planComponents,
    } as any);

    const mapData = await getPlanMapData("plan-1");

    expect(mapData).not.toBeNull();
    mapData!.hotspots.forEach((hotspot) => {
      expect(hotspot.isIncluded).toBe(true);
    });
  });
});

describe("商户端与用户端一致性", () => {
  it("商户编辑器保存的位置 === 用户端显示的位置", async () => {
    const planComponents = [
      makePlanComponent("pc-1", "tpl-1", "和服", 0.3, 0.5, { labelPosition: "left" }),
      makePlanComponent("pc-2", "tpl-2", "腰带", 0.7, 0.8, { labelPosition: "right" }),
    ];

    vi.mocked(prisma.rentalPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      theme: { mapTemplate: mockTemplate },
      planComponents,
    } as any);

    const userView = await getPlanMapData("plan-1");

    expect(userView).not.toBeNull();
    expect(userView!.hotspots).toHaveLength(planComponents.length);

    // 验证每个热点的详细信息一致
    planComponents.forEach((pc) => {
      const tpl = pc.merchantComponent.template;
      const userHotspot = userView!.hotspots.find((h) => h.component.id === tpl.id);

      expect(userHotspot).toBeDefined();
      expect(userHotspot!.x).toBe(pc.hotmapX);
      expect(userHotspot!.y).toBe(pc.hotmapY);
      expect(userHotspot!.labelPosition).toBe(pc.hotmapLabelPosition);
      expect(userHotspot!.component.name).toBe(tpl.name);
      expect(userHotspot!.component.icon).toBe(tpl.icon);
      expect(userHotspot!.isIncluded).toBe(true);
    });
  });
});

describe("getDefaultMapData", () => {
  it("mapTemplate 不存在时返回 null", async () => {
    // 模拟 prisma.mapTemplate 不存在的情况
    const originalMapTemplate = prisma.mapTemplate;
    (prisma as any).mapTemplate = undefined;

    const mapData = await getDefaultMapData();
    expect(mapData).toBeNull();

    // 恢复
    (prisma as any).mapTemplate = originalMapTemplate;
  });

  it("无默认模板时返回 null", async () => {
    vi.mocked(prisma.mapTemplate.findFirst).mockResolvedValue(null);

    const mapData = await getDefaultMapData();
    expect(mapData).toBeNull();
  });

  it("返回默认模板数据", async () => {
    const mockDefaultTemplate = {
      ...mockTemplate,
      hotspots: [
        {
          id: "hs-1",
          x: 0.5,
          y: 0.3,
          labelPosition: "right",
          displayOrder: 0,
          component: {
            id: "sc-1",
            code: "kimono",
            name: "和服",
            nameJa: "着物",
            nameEn: "Kimono",
            description: "和服本体",
            type: "GARMENT",
            icon: "👘",
            defaultHighlights: ["丝绸材质"],
            defaultImages: ["https://example.com/kimono.jpg"],
            outfitCategory: "UPPER_BODY",
          },
        },
      ],
    };

    vi.mocked(prisma.mapTemplate.findFirst).mockResolvedValue(mockDefaultTemplate as any);

    const mapData = await getDefaultMapData();

    expect(mapData).not.toBeNull();
    expect(mapData!.imageUrl).toBe("https://example.com/map.jpg");
    expect(mapData!.hotspots).toHaveLength(1);
    expect(mapData!.hotspots[0].component.name).toBe("和服");
    expect(mapData!.hotspots[0].isIncluded).toBe(true);
  });
});
