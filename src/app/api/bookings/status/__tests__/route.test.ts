import { describe, it, expect, vi, beforeEach } from "vitest";

// mock prisma
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    booking: {
      findUnique: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

import prisma from "@/lib/prisma";
import { GET } from "../../status/route";

beforeEach(() => {
  vi.clearAllMocks();
});

// 构造 Request 对象
function makeRequest(token?: string) {
  const url = token
    ? `http://localhost:3000/api/bookings/status?token=${token}`
    : "http://localhost:3000/api/bookings/status";
  return new Request(url, { method: "GET" });
}

// 模拟 booking 数据
const mockBookingData = {
  id: "booking-abc",
  visitDate: new Date("2025-04-01"),
  visitTime: "10:00",
  totalAmount: 500000,
  status: "PENDING",
  guestName: "张三",
  guestEmail: "guest@test.com",
  guestPhone: "13800138000",
  specialRequests: null,
  userId: "user-123",
  viewToken: "secret-token",
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: "item-1",
      quantity: 1,
      unitPrice: 500000,
      totalPrice: 500000,
      addOns: [],
      store: {
        id: "store-1",
        name: "京都本店",
        city: "京都",
        address: "东山区xxx",
      },
      plan: {
        id: "plan-1",
        name: "经典和服套餐",
        description: "经典款",
        price: 500000,
        imageUrl: null,
      },
    },
  ],
};

describe("GET /api/bookings/status", () => {
  it("有效 token → 返回 booking 数据", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBookingData as any);

    const response = await GET(makeRequest("valid-token"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("booking-abc");
    expect(data.items).toHaveLength(1);
    expect(data.items[0].store.name).toBe("京都本店");
    expect(data.items[0].plan.name).toBe("经典和服套餐");
  });

  it("有效 token → 不返回敏感字段", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBookingData as any);

    const response = await GET(makeRequest("valid-token"));
    const data = await response.json();

    expect(data).not.toHaveProperty("userId");
    expect(data).not.toHaveProperty("viewToken");
  });

  it("无效 token → 404", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

    const response = await GET(makeRequest("invalid-token"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("预约未找到");
  });

  it("缺少 token 参数 → 400", async () => {
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("缺少查询凭证");
  });

  it("Prisma 异常 → 500", async () => {
    vi.mocked(prisma.booking.findUnique).mockRejectedValue(
      new Error("数据库连接失败")
    );

    const response = await GET(makeRequest("some-token"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("查询失败");
  });
});
