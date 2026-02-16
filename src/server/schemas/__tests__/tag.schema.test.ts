import { describe, it, expect } from "vitest";
import { createTagSchema, createTagCategorySchema } from "../tag.schema";

const validTag = {
  categoryId: "cat-1",
  code: "formal",
  name: "正装",
};

const validCategory = {
  code: "style",
  name: "风格",
};

describe("createTagSchema", () => {
  describe("合法输入", () => {
    it("最小合法输入通过", () => {
      const result = createTagSchema.safeParse(validTag);
      expect(result.success).toBe(true);
    });

    it("包含可选字段通过", () => {
      const result = createTagSchema.safeParse({
        ...validTag,
        nameEn: "Formal",
        icon: "👘",
        color: "#ff5733",
        order: 5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("必填字段校验", () => {
    it("categoryId 为空被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, categoryId: "" });
      expect(result.success).toBe(false);
    });

    it("code 为空被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, code: "" });
      expect(result.success).toBe(false);
    });

    it("name 为空被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("长度限制", () => {
    it("code 超过 50 字符被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, code: "a".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("code 50 字符通过", () => {
      const result = createTagSchema.safeParse({ ...validTag, code: "a".repeat(50) });
      expect(result.success).toBe(true);
    });

    it("name 超过 50 字符被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, name: "a".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("nameEn 超过 50 字符被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, nameEn: "a".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("icon 超过 20 字符被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, icon: "a".repeat(21) });
      expect(result.success).toBe(false);
    });

    it("color 超过 20 字符被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, color: "a".repeat(21) });
      expect(result.success).toBe(false);
    });
  });

  describe("order 字段校验", () => {
    it("默认为 0", () => {
      const result = createTagSchema.safeParse(validTag);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe(0);
      }
    });

    it("负数被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, order: -1 });
      expect(result.success).toBe(false);
    });

    it("小数被拒绝", () => {
      const result = createTagSchema.safeParse({ ...validTag, order: 1.5 });
      expect(result.success).toBe(false);
    });

    it("正整数通过", () => {
      const result = createTagSchema.safeParse({ ...validTag, order: 10 });
      expect(result.success).toBe(true);
    });
  });
});

describe("createTagCategorySchema", () => {
  describe("合法输入", () => {
    it("最小合法输入通过", () => {
      const result = createTagCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it("包含所有字段通过", () => {
      const result = createTagCategorySchema.safeParse({
        ...validCategory,
        nameEn: "Style",
        description: "和服风格分类",
        icon: "🎨",
        color: "#333",
        order: 1,
        showInFilter: true,
        filterOrder: 2,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("必填字段校验", () => {
    it("code 为空被拒绝", () => {
      const result = createTagCategorySchema.safeParse({ ...validCategory, code: "" });
      expect(result.success).toBe(false);
    });

    it("name 为空被拒绝", () => {
      const result = createTagCategorySchema.safeParse({ ...validCategory, name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("长度限制", () => {
    it("description 超过 200 字符被拒绝", () => {
      const result = createTagCategorySchema.safeParse({
        ...validCategory,
        description: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("description 200 字符通过", () => {
      const result = createTagCategorySchema.safeParse({
        ...validCategory,
        description: "a".repeat(200),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("默认值", () => {
    it("showInFilter 默认为 true", () => {
      const result = createTagCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showInFilter).toBe(true);
      }
    });

    it("filterOrder 默认为 0", () => {
      const result = createTagCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filterOrder).toBe(0);
      }
    });

    it("order 默认为 0", () => {
      const result = createTagCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe(0);
      }
    });
  });
});
