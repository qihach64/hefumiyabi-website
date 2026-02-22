import { describe, it, expect, vi, beforeEach } from "vitest";

// mock crypto
vi.mock("crypto", () => ({
  randomUUID: () => "mock-uuid-token",
}));

// mock prisma
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    rentalPlan: { findMany: vi.fn().mockResolvedValue([]) },
    booking: { create: vi.fn() },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

// mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue(null), // 默认游客
}));

// mock email
const mockSendEmail = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/lib/email", () => ({
  sendBookingConfirmationEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import prisma from "@/lib/prisma";
import { POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  mockSendEmail.mockResolvedValue({ success: true });
});

// 构造有效的预约请求
function makeBookingRequest(overrides = {}) {
  return new Request("http://localhost:3000/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guestName: "张三",
      guestEmail: "guest@test.com",
      visitDate: "2025-04-01",
      visitTime: "10:00",
      items: [
        {
          storeId: "store-1",
          type: "RENTAL",
          planId: "plan-1",
          quantity: 1,
          unitPrice: 500000,
          totalPrice: 500000,
        },
      ],
      ...overrides,
    }),
  });
}

// 模拟 prisma.booking.create 返回
function mockBookingCreate() {
  const createdBooking = {
    id: "booking-new",
    viewToken: "mock-uuid-token",
    guestName: "张三",
    guestEmail: "guest@test.com",
    guestPhone: null,
    visitDate: new Date("2025-04-01"),
    visitTime: "10:00",
    totalAmount: 500000,
    status: "PENDING",
    userId: null,
    user: null,
    items: [
      {
        id: "item-1",
        storeId: "store-1",
        type: "RENTAL",
        planId: "plan-1",
        quantity: 1,
        unitPrice: 500000,
        totalPrice: 500000,
        addOns: [],
        plan: { name: "经典和服套餐" },
        store: { name: "京都本店", city: "京都", address: "东山区xxx" },
      },
    ],
  };
  vi.mocked(prisma.booking.create).mockResolvedValue(createdBooking as any);
  vi.mocked(prisma.rentalPlan.findMany).mockResolvedValue([
    { id: "plan-1" } as any,
  ]);
  return createdBooking;
}

describe("POST /api/bookings — viewToken 相关", () => {
  it("创建预约 → 响应包含 viewToken", async () => {
    mockBookingCreate();

    const response = await POST(makeBookingRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.viewToken).toBe("mock-uuid-token");
  });

  it("创建预约 → booking.create 调用含 viewToken", async () => {
    mockBookingCreate();

    await POST(makeBookingRequest());

    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          viewToken: "mock-uuid-token",
        }),
      })
    );
  });

  it("创建预约 → 邮件函数收到含 viewToken 的 booking", async () => {
    mockBookingCreate();

    await POST(makeBookingRequest());

    expect(mockSendEmail).toHaveBeenCalledWith(
      "guest@test.com",
      "张三",
      expect.objectContaining({
        viewToken: "mock-uuid-token",
      })
    );
  });

  it("邮件发送失败 → 预约仍然成功", async () => {
    mockBookingCreate();
    mockSendEmail.mockRejectedValue(new Error("SMTP 失败"));

    const response = await POST(makeBookingRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("success");
  });
});
