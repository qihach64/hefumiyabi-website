import { describe, it, expect } from "vitest";
import { merchantRegisterSchema } from "../merchant.schema";

const validMerchant = {
  businessName: "京都和服店",
  description: "专业和服租赁服务",
  taxId: "T1234567890",
  bankAccount: "1234-5678-9012",
};

describe("merchantRegisterSchema", () => {
  describe("合法输入", () => {
    it("最小合法输入通过", () => {
      const result = merchantRegisterSchema.safeParse(validMerchant);
      expect(result.success).toBe(true);
    });

    it("包含可选字段通过", () => {
      const result = merchantRegisterSchema.safeParse({
        ...validMerchant,
        legalName: "京都和服株式会社",
        logo: "https://example.com/logo.png",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("businessName 校验", () => {
    it("空字符串被拒绝", () => {
      const result = merchantRegisterSchema.safeParse({ ...validMerchant, businessName: "" });
      expect(result.success).toBe(false);
    });

    it("100 字符通过", () => {
      const result = merchantRegisterSchema.safeParse({
        ...validMerchant,
        businessName: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("101 字符被拒绝", () => {
      const result = merchantRegisterSchema.safeParse({
        ...validMerchant,
        businessName: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("description 校验", () => {
    it("空字符串被拒绝", () => {
      const result = merchantRegisterSchema.safeParse({ ...validMerchant, description: "" });
      expect(result.success).toBe(false);
    });

    it("1000 字符通过", () => {
      const result = merchantRegisterSchema.safeParse({
        ...validMerchant,
        description: "a".repeat(1000),
      });
      expect(result.success).toBe(true);
    });

    it("1001 字符被拒绝", () => {
      const result = merchantRegisterSchema.safeParse({
        ...validMerchant,
        description: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("必填字段校验", () => {
    it("缺少 taxId 被拒绝", () => {
      const { taxId, ...rest } = validMerchant;
      const result = merchantRegisterSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("taxId 为空被拒绝", () => {
      const result = merchantRegisterSchema.safeParse({ ...validMerchant, taxId: "" });
      expect(result.success).toBe(false);
    });

    it("缺少 bankAccount 被拒绝", () => {
      const { bankAccount, ...rest } = validMerchant;
      const result = merchantRegisterSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("bankAccount 为空被拒绝", () => {
      const result = merchantRegisterSchema.safeParse({ ...validMerchant, bankAccount: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("可选字段校验", () => {
    it("legalName 为 null 通过", () => {
      const result = merchantRegisterSchema.safeParse({ ...validMerchant, legalName: null });
      expect(result.success).toBe(true);
    });

    it("legalName 超过 100 字符被拒绝", () => {
      const result = merchantRegisterSchema.safeParse({
        ...validMerchant,
        legalName: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("logo 为无效 URL 被拒绝", () => {
      const result = merchantRegisterSchema.safeParse({ ...validMerchant, logo: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("logo 为 null 通过", () => {
      const result = merchantRegisterSchema.safeParse({ ...validMerchant, logo: null });
      expect(result.success).toBe(true);
    });
  });
});
