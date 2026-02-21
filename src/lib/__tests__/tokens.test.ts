import { describe, it, expect, vi, beforeEach } from "vitest";

// mock prisma
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    verificationToken: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      delete: vi.fn().mockResolvedValue({}),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

import { generateVerificationToken, verifyToken, deleteToken, generatePasswordResetToken, verifyPasswordResetToken } from "../tokens";
import prisma from "../prisma";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateVerificationToken", () => {
  it("生成 token 并保存到数据库", async () => {
    const email = "test@example.com";
    const token = await generateVerificationToken(email);

    // 返回值是非空字符串
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    // 先删除旧 token
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: email },
    });

    // 再创建新 token
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identifier: email,
        token: expect.any(String),
        expires: expect.any(Date),
      }),
    });
  });

  it("token 过期时间为 24 小时后", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    await generateVerificationToken("test@example.com");

    const createCall = vi.mocked(prisma.verificationToken.create).mock.calls[0][0];
    const expires = createCall.data.expires as Date;

    // 过期时间应为 24 小时后
    const expectedExpiry = now + 24 * 60 * 60 * 1000;
    expect(expires.getTime()).toBe(expectedExpiry);

    vi.spyOn(Date, "now").mockRestore();
  });

  it("每次调用生成不同的 token", async () => {
    const token1 = await generateVerificationToken("test@example.com");
    const token2 = await generateVerificationToken("test@example.com");
    expect(token1).not.toBe(token2);
  });
});

describe("verifyToken", () => {
  it("token 不存在时返回无效", async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null);

    const result = await verifyToken("invalid-token");

    expect(result).toEqual({ valid: false, error: "无效的验证链接" });
  });

  it("token 过期时返回无效并删除", async () => {
    const expiredToken = {
      token: "expired-token",
      identifier: "test@example.com",
      expires: new Date(Date.now() - 1000), // 1 秒前过期
    };
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(expiredToken as any);

    const result = await verifyToken("expired-token");

    expect(result).toEqual({ valid: false, error: "验证链接已过期" });
    // 过期 token 应被删除
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: "expired-token" },
    });
  });

  it("有效 token 返回 valid 和 email", async () => {
    const validToken = {
      token: "valid-token",
      identifier: "test@example.com",
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 小时后过期
    };
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(validToken as any);

    const result = await verifyToken("valid-token");

    expect(result).toEqual({ valid: true, email: "test@example.com" });
  });
});

describe("deleteToken", () => {
  it("删除指定 token", async () => {
    await deleteToken("some-token");

    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: "some-token" },
    });
  });
});

describe("generatePasswordResetToken", () => {
  it("生成 token 并保存到数据库，identifier 为 reset:email", async () => {
    const email = "test@example.com";
    const token = await generatePasswordResetToken(email);

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    // 先删除旧的重置 token
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: `reset:${email}` },
    });

    // 再创建新 token
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identifier: `reset:${email}`,
        token: expect.any(String),
        expires: expect.any(Date),
      }),
    });
  });

  it("过期时间为 1 小时后", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    await generatePasswordResetToken("test@example.com");

    const createCall = vi.mocked(prisma.verificationToken.create).mock.calls[0][0];
    const expires = createCall.data.expires as Date;

    const expectedExpiry = now + 60 * 60 * 1000;
    expect(expires.getTime()).toBe(expectedExpiry);

    vi.spyOn(Date, "now").mockRestore();
  });
});

describe("verifyPasswordResetToken", () => {
  it("token 不存在时返回无效", async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null);

    const result = await verifyPasswordResetToken("invalid-token");
    expect(result).toEqual({ valid: false, error: "无效的重置链接" });
  });

  it("identifier 不含 reset: 前缀时返回无效", async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
      token: "some-token",
      identifier: "test@example.com", // 无前缀
      expires: new Date(Date.now() + 60 * 60 * 1000),
    } as any);

    const result = await verifyPasswordResetToken("some-token");
    expect(result).toEqual({ valid: false, error: "无效的重置链接" });
  });

  it("token 过期时返回无效并删除", async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
      token: "expired-token",
      identifier: "reset:test@example.com",
      expires: new Date(Date.now() - 1000),
    } as any);

    const result = await verifyPasswordResetToken("expired-token");
    expect(result).toEqual({ valid: false, error: "重置链接已过期" });
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: "expired-token" },
    });
  });

  it("有效 token 返回 valid 和 email", async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
      token: "valid-token",
      identifier: "reset:test@example.com",
      expires: new Date(Date.now() + 60 * 60 * 1000),
    } as any);

    const result = await verifyPasswordResetToken("valid-token");
    expect(result).toEqual({ valid: true, email: "test@example.com" });
  });
});
