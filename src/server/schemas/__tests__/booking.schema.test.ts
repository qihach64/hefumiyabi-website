import { describe, it, expect } from "vitest";
import { createBookingSchema } from "../booking.schema";

// 合法的预约单项
const validItem = {
  storeId: "store-1",
  type: "rental",
  planId: "plan-1",
  quantity: 1,
  unitPrice: 5000,
  totalPrice: 5000,
  visitDate: "2025-03-15",
  visitTime: "10:00",
};

// 合法的预约输入
const validBooking = {
  guestName: "田中太郎",
  guestEmail: "tanaka@example.com",
  guestPhone: "090-1234-5678",
  items: [validItem],
};

describe("createBookingSchema", () => {
  describe("合法输入", () => {
    it("完整合法输入通过校验", () => {
      const result = createBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it("仅必填字段（items）通过校验", () => {
      const result = createBookingSchema.safeParse({
        items: [{ storeId: "store-1", type: "rental", unitPrice: 0, totalPrice: 0 }],
      });
      expect(result.success).toBe(true);
    });

    it("多个商品项通过校验", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [validItem, { ...validItem, storeId: "store-2", planId: "plan-2" }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("items 数组校验", () => {
    it("空数组被拒绝", () => {
      const result = createBookingSchema.safeParse({ ...validBooking, items: [] });
      expect(result.success).toBe(false);
    });

    it("超过 50 个商品被拒绝", () => {
      const items = Array.from({ length: 51 }, (_, i) => ({
        ...validItem,
        planId: `plan-${i}`,
      }));
      const result = createBookingSchema.safeParse({ ...validBooking, items });
      expect(result.success).toBe(false);
    });

    it("50 个商品刚好通过", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        ...validItem,
        planId: `plan-${i}`,
      }));
      const result = createBookingSchema.safeParse({ ...validBooking, items });
      expect(result.success).toBe(true);
    });
  });

  describe("visitDate 格式校验", () => {
    it.each([
      ["2025-03-15", true],
      ["2025-12-31", true],
      ["2025-01-01", true],
      ["2025-3-1", false], // 缺少前导零
      ["2025/03/15", false], // 错误分隔符
      ["not-a-date", false],
      ["", false],
      ["20250315", false], // 无分隔符
    ])('visitDate "%s" → %s', (date, valid) => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ ...validItem, visitDate: date }],
      });
      expect(result.success).toBe(valid);
    });
  });

  describe("visitTime 格式校验", () => {
    it.each([
      ["10:00", true],
      ["09:30", true],
      ["23:59", true],
      ["00:00", true],
      ["9:00", false], // 缺少前导零
      ["10:0", false], // 缺少前导零
      ["10:00:00", false], // 秒数
      ["ten:zero", false],
    ])('visitTime "%s" → %s', (time, valid) => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ ...validItem, visitTime: time }],
      });
      expect(result.success).toBe(valid);
    });
  });

  describe("联系信息校验", () => {
    it("guestName 超过 100 字符被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        guestName: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("guestName 100 字符通过", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        guestName: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("无效邮箱格式被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        guestEmail: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("guestPhone 超过 20 字符被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        guestPhone: "1".repeat(21),
      });
      expect(result.success).toBe(false);
    });

    it("specialRequests 超过 1000 字符被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        specialRequests: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("单项字段校验", () => {
    it("storeId 为空被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ ...validItem, storeId: "" }],
      });
      expect(result.success).toBe(false);
    });

    it("quantity 默认为 1", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ storeId: "store-1", type: "rental", unitPrice: 100, totalPrice: 100 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].quantity).toBe(1);
      }
    });

    it("负数 unitPrice 被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ ...validItem, unitPrice: -1 }],
      });
      expect(result.success).toBe(false);
    });

    it("负数 totalPrice 被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ ...validItem, totalPrice: -1 }],
      });
      expect(result.success).toBe(false);
    });

    it("notes 超过 500 字符被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ ...validItem, notes: "a".repeat(501) }],
      });
      expect(result.success).toBe(false);
    });

    it("notes 为 null 通过", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ ...validItem, notes: null }],
      });
      expect(result.success).toBe(true);
    });

    it("addOns 默认为空数组", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        items: [{ storeId: "store-1", type: "rental", unitPrice: 0, totalPrice: 0 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].addOns).toEqual([]);
      }
    });
  });

  describe("金额字段校验", () => {
    it("totalAmount 非负通过", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        totalAmount: 10000,
      });
      expect(result.success).toBe(true);
    });

    it("totalAmount 为 0 通过", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        totalAmount: 0,
      });
      expect(result.success).toBe(true);
    });

    it("负数 totalAmount 被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        totalAmount: -1,
      });
      expect(result.success).toBe(false);
    });

    it("depositAmount 非负通过", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        depositAmount: 5000,
      });
      expect(result.success).toBe(true);
    });

    it("负数 depositAmount 被拒绝", () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        depositAmount: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});
