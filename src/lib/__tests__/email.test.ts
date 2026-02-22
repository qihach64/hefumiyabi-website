import { describe, it, expect, vi, beforeEach } from "vitest";

// mock nodemailer — vi.hoisted 确保在 vi.mock 提升后仍可访问
const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({ sendMail: mockSendMail }),
  },
}));

// 设置环境变量
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.SMTP_FROM = "test@example.com";

import { sendBookingConfirmationEmail } from "../email";

// 预约数据工厂
interface BookingForEmail {
  id: string;
  visitDate: Date;
  visitTime: string;
  totalAmount: number;
  userId?: string | null;
  viewToken?: string | null;
  specialRequests?: string | null;
  items: Array<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    addOns: string[];
    plan?: { name: string } | null;
    store: { name: string; city: string; address: string };
  }>;
}

function makeBooking(overrides: Partial<BookingForEmail> = {}): BookingForEmail {
  return {
    id: "booking-123",
    visitDate: new Date("2025-04-01"),
    visitTime: "10:00",
    totalAmount: 500000,
    userId: null,
    viewToken: "test-token-uuid",
    specialRequests: null,
    items: [
      {
        quantity: 1,
        unitPrice: 500000,
        totalPrice: 500000,
        addOns: [],
        plan: { name: "经典和服套餐" },
        store: { name: "京都本店", city: "京都", address: "东山区xxx" },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSendMail.mockResolvedValue({ messageId: "test-id" });
});

describe("sendBookingConfirmationEmail", () => {
  it("游客预约 + viewToken → 邮件包含查询链接", async () => {
    const booking = makeBooking();
    await sendBookingConfirmationEmail("guest@test.com", "张三", booking);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("/booking/status?token=test-token-uuid");
  });

  it("登录用户预约 → 不包含查询链接", async () => {
    const booking = makeBooking({ userId: "user-123" });
    await sendBookingConfirmationEmail("user@test.com", "李四", booking);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).not.toContain("/booking/status?token=");
  });

  it("无 viewToken 游客 → 不包含查询链接", async () => {
    const booking = makeBooking({ viewToken: null });
    await sendBookingConfirmationEmail("guest@test.com", "王五", booking);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).not.toContain("/booking/status?token=");
  });

  it("价格格式化正确（分 → 元）", async () => {
    const booking = makeBooking({
      totalAmount: 5000,
      items: [
        {
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000,
          addOns: [],
          plan: { name: "基础套餐" },
          store: { name: "京都本店", city: "京都", address: "东山区xxx" },
        },
      ],
    });
    await sendBookingConfirmationEmail("guest@test.com", "赵六", booking);

    const call = mockSendMail.mock.calls[0][0];
    // 5000 分 = ¥50
    expect(call.html).toContain("¥50");
  });

  it("多店铺去重", async () => {
    const booking = makeBooking({
      items: [
        {
          quantity: 1,
          unitPrice: 300000,
          totalPrice: 300000,
          addOns: [],
          plan: { name: "套餐A" },
          store: { name: "京都本店", city: "京都", address: "东山区xxx" },
        },
        {
          quantity: 1,
          unitPrice: 200000,
          totalPrice: 200000,
          addOns: [],
          plan: { name: "套餐B" },
          store: { name: "京都本店", city: "京都", address: "东山区xxx" },
        },
      ],
    });
    await sendBookingConfirmationEmail("guest@test.com", "钱七", booking);

    const call = mockSendMail.mock.calls[0][0];
    // 店铺名在「店铺」区域只出现一次（去重后）
    const storeSection = call.html.match(/<div class="info-label">店铺<\/div>\s*<div class="info-value">(.*?)<\/div>/s);
    expect(storeSection).toBeTruthy();
    // 去重后只有一个店铺名
    const storeValue = storeSection![1];
    expect(storeValue).toBe("京都本店");
  });

  it("附加服务渲染", async () => {
    const booking = makeBooking({
      items: [
        {
          quantity: 1,
          unitPrice: 500000,
          totalPrice: 500000,
          addOns: ["发型设计", "化妆"],
          plan: { name: "豪华套餐" },
          store: { name: "京都本店", city: "京都", address: "东山区xxx" },
        },
      ],
    });
    await sendBookingConfirmationEmail("guest@test.com", "孙八", booking);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("附加服务");
    expect(call.html).toContain("发型设计");
    expect(call.html).toContain("化妆");
  });

  it("备注渲染", async () => {
    const booking = makeBooking({ specialRequests: "希望选择红色系和服" });
    await sendBookingConfirmationEmail("guest@test.com", "周九", booking);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("备注");
    expect(call.html).toContain("希望选择红色系和服");
  });

  it("无备注时不渲染备注区", async () => {
    const booking = makeBooking({ specialRequests: null });
    await sendBookingConfirmationEmail("guest@test.com", "吴十", booking);

    const call = mockSendMail.mock.calls[0][0];
    // 邮件中不应出现备注标题（作为 h3 的内容）
    expect(call.html).not.toContain('>备注</h3>');
  });

  it("纯文本版本包含正确信息", async () => {
    const booking = makeBooking();
    await sendBookingConfirmationEmail("guest@test.com", "测试", booking);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.text).toContain("经典和服套餐");
    expect(call.text).toContain("¥5,000");
    expect(call.text).toContain("2025");
  });

  it("sendMail 失败 → 返回 { success: false }", async () => {
    mockSendMail.mockRejectedValue(new Error("SMTP 连接失败"));

    const booking = makeBooking();
    const result = await sendBookingConfirmationEmail(
      "guest@test.com",
      "测试",
      booking
    );

    expect(result).toEqual({ success: false, error: expect.any(Error) });
  });
});
