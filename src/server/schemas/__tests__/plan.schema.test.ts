import { describe, it, expect } from "vitest";
import {
  createPlanSchema,
  updatePlanSchema,
  planComponentSchema,
  planUpgradeSchema,
} from "../plan.schema";

// 合法的创建套餐输入
const validCreate = {
  name: "经典和服体验",
  description: "包含和服、腰带、配件等完整套装的租赁体验",
  price: 8000,
  duration: 120,
};

// 合法的更新套餐输入
const validUpdate = {
  name: "经典和服体验",
  description: "包含和服、腰带、配件等完整套装的租赁体验",
  price: 8000,
  isActive: true,
};

describe("planComponentSchema", () => {
  it("合法输入通过", () => {
    const result = planComponentSchema.safeParse({
      merchantComponentId: "mc-1",
      hotmapX: 0.5,
      hotmapY: 0.3,
    });
    expect(result.success).toBe(true);
  });

  it("hotmapX 超过 1 被拒绝", () => {
    const result = planComponentSchema.safeParse({
      merchantComponentId: "mc-1",
      hotmapX: 1.1,
      hotmapY: 0.5,
    });
    expect(result.success).toBe(false);
  });

  it("hotmapY 小于 0 被拒绝", () => {
    const result = planComponentSchema.safeParse({
      merchantComponentId: "mc-1",
      hotmapX: 0.5,
      hotmapY: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it("hotmapX/Y 边界值 0 和 1 通过", () => {
    const result = planComponentSchema.safeParse({
      merchantComponentId: "mc-1",
      hotmapX: 0,
      hotmapY: 1,
    });
    expect(result.success).toBe(true);
  });

  it("hotmapLabelPosition 默认值为 right", () => {
    const result = planComponentSchema.safeParse({
      merchantComponentId: "mc-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hotmapLabelPosition).toBe("right");
    }
  });

  it("无效的 hotmapLabelPosition 被拒绝", () => {
    const result = planComponentSchema.safeParse({
      merchantComponentId: "mc-1",
      hotmapLabelPosition: "top",
    });
    expect(result.success).toBe(false);
  });

  it("hotmapX/Y 为 null 通过", () => {
    const result = planComponentSchema.safeParse({
      merchantComponentId: "mc-1",
      hotmapX: null,
      hotmapY: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("planUpgradeSchema", () => {
  it("合法输入通过", () => {
    const result = planUpgradeSchema.safeParse({
      merchantComponentId: "mc-1",
      priceOverride: 1000,
      isPopular: true,
      displayOrder: 1,
    });
    expect(result.success).toBe(true);
  });

  it("priceOverride 为 0 被拒绝 (需正数)", () => {
    const result = planUpgradeSchema.safeParse({
      merchantComponentId: "mc-1",
      priceOverride: 0,
    });
    expect(result.success).toBe(false);
  });

  it("priceOverride 为 null 通过", () => {
    const result = planUpgradeSchema.safeParse({
      merchantComponentId: "mc-1",
      priceOverride: null,
    });
    expect(result.success).toBe(true);
  });

  it("默认值：isPopular=false, displayOrder=0", () => {
    const result = planUpgradeSchema.safeParse({
      merchantComponentId: "mc-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPopular).toBe(false);
      expect(result.data.displayOrder).toBe(0);
    }
  });
});

describe("createPlanSchema", () => {
  describe("合法输入", () => {
    it("最小合法输入通过", () => {
      const result = createPlanSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("完整输入通过", () => {
      const result = createPlanSchema.safeParse({
        ...validCreate,
        originalPrice: 10000,
        depositAmount: 2000,
        imageUrl: "https://example.com/img.jpg",
        images: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
        storeName: "京都店",
        region: "京都",
        isActive: true,
        isFeatured: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("name 校验", () => {
    it("空名称被拒绝", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("description 校验", () => {
    it("少于 10 字符被拒绝", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, description: "太短了" });
      expect(result.success).toBe(false);
    });

    it("10 字符刚好通过", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, description: "1234567890" });
      expect(result.success).toBe(true);
    });
  });

  describe("价格校验", () => {
    it("价格为 0 被拒绝 (需正数)", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, price: 0 });
      expect(result.success).toBe(false);
    });

    it("负数价格被拒绝", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, price: -100 });
      expect(result.success).toBe(false);
    });

    it("小数价格被拒绝 (需整数)", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, price: 99.5 });
      expect(result.success).toBe(false);
    });

    it("depositAmount 默认为 0", () => {
      const result = createPlanSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.depositAmount).toBe(0);
      }
    });

    it("负数 depositAmount 被拒绝", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, depositAmount: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe("duration 校验", () => {
    it("duration 为 0 被拒绝", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, duration: 0 });
      expect(result.success).toBe(false);
    });

    it("负数 duration 被拒绝", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, duration: -60 });
      expect(result.success).toBe(false);
    });
  });

  describe("图片校验", () => {
    it("imageUrl 合法 URL 通过", () => {
      const result = createPlanSchema.safeParse({
        ...validCreate,
        imageUrl: "https://example.com/img.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("imageUrl 空字符串被转换为 null", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, imageUrl: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageUrl).toBeNull();
      }
    });

    it("imageUrl 无效 URL 被拒绝", () => {
      const result = createPlanSchema.safeParse({
        ...validCreate,
        imageUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("images 超过 20 张被拒绝", () => {
      const images = Array.from({ length: 21 }, (_, i) => `https://example.com/${i}.jpg`);
      const result = createPlanSchema.safeParse({ ...validCreate, images });
      expect(result.success).toBe(false);
    });

    it("images 中无效 URL 被拒绝", () => {
      const result = createPlanSchema.safeParse({
        ...validCreate,
        images: ["not-a-url"],
      });
      expect(result.success).toBe(false);
    });

    it("images 默认为空数组", () => {
      const result = createPlanSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.images).toEqual([]);
      }
    });
  });

  describe("transform 行为", () => {
    it("storeName 为 null 被转换为空字符串", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, storeName: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storeName).toBe("");
      }
    });

    it("region 为空字符串保持为空", () => {
      const result = createPlanSchema.safeParse({ ...validCreate, region: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.region).toBe("");
      }
    });
  });

  describe("默认值", () => {
    it("isActive 默认为 true", () => {
      const result = createPlanSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });

    it("isFeatured 默认为 false", () => {
      const result = createPlanSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isFeatured).toBe(false);
      }
    });
  });
});

describe("updatePlanSchema", () => {
  describe("合法输入", () => {
    it("最小合法输入通过", () => {
      const result = updatePlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("包含组件和升级的完整输入通过", () => {
      const result = updatePlanSchema.safeParse({
        ...validUpdate,
        planComponents: [{ merchantComponentId: "mc-1", hotmapX: 0.5, hotmapY: 0.3 }],
        planUpgrades: [{ merchantComponentId: "mc-2", priceOverride: 1000 }],
        tagIds: ["tag-1", "tag-2"],
        status: "PUBLISHED",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("pricingUnit 校验", () => {
    it("person 通过", () => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, pricingUnit: "person" });
      expect(result.success).toBe(true);
    });

    it("group 通过", () => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, pricingUnit: "group" });
      expect(result.success).toBe(true);
    });

    it("无效的 pricingUnit 被拒绝", () => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, pricingUnit: "family" });
      expect(result.success).toBe(false);
    });
  });

  describe("status 校验", () => {
    it.each(["DRAFT", "PUBLISHED", "ARCHIVED"] as const)('status "%s" 通过', (status) => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, status });
      expect(result.success).toBe(true);
    });

    it("无效 status 被拒绝", () => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, status: "DELETED" });
      expect(result.success).toBe(false);
    });
  });

  describe("数组长度限制", () => {
    it("planComponents 超过 50 被拒绝", () => {
      const planComponents = Array.from({ length: 51 }, (_, i) => ({
        merchantComponentId: `mc-${i}`,
      }));
      const result = updatePlanSchema.safeParse({ ...validUpdate, planComponents });
      expect(result.success).toBe(false);
    });

    it("planUpgrades 超过 20 被拒绝", () => {
      const planUpgrades = Array.from({ length: 21 }, (_, i) => ({
        merchantComponentId: `mc-${i}`,
      }));
      const result = updatePlanSchema.safeParse({ ...validUpdate, planUpgrades });
      expect(result.success).toBe(false);
    });

    it("tagIds 超过 30 被拒绝", () => {
      const tagIds = Array.from({ length: 31 }, (_, i) => `tag-${i}`);
      const result = updatePlanSchema.safeParse({ ...validUpdate, tagIds });
      expect(result.success).toBe(false);
    });
  });

  describe("数量范围校验", () => {
    it("minQuantity 为 0 被拒绝", () => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, minQuantity: 0 });
      expect(result.success).toBe(false);
    });

    it("minQuantity 为 1 通过", () => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, minQuantity: 1 });
      expect(result.success).toBe(true);
    });

    it("maxQuantity 为 0 被拒绝", () => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, maxQuantity: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("customMapImageUrl 转换", () => {
    it("空字符串被转换为 null", () => {
      const result = updatePlanSchema.safeParse({ ...validUpdate, customMapImageUrl: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customMapImageUrl).toBeNull();
      }
    });

    it("合法 URL 保留", () => {
      const url = "https://example.com/map.jpg";
      const result = updatePlanSchema.safeParse({ ...validUpdate, customMapImageUrl: url });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customMapImageUrl).toBe(url);
      }
    });
  });
});
