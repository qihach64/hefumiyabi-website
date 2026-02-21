import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "../auth.schema";

describe("registerSchema", () => {
  const validRegister = {
    email: "user@example.com",
    password: "12345678",
  };

  describe("合法输入", () => {
    it("完整合法输入通过", () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: "田中太郎",
      });
      expect(result.success).toBe(true);
    });

    it("不带 name 通过 (可选)", () => {
      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });
  });

  describe("email 校验", () => {
    it.each([
      ["user@example.com", true],
      ["user@sub.example.com", true],
      ["user+tag@example.com", true],
      ["not-an-email", false],
      ["@example.com", false],
      ["user@", false],
      ["", false],
    ])('email "%s" → %s', (email, valid) => {
      const result = registerSchema.safeParse({ ...validRegister, email });
      expect(result.success).toBe(valid);
    });

    it("缺少 email 被拒绝", () => {
      const result = registerSchema.safeParse({ password: "12345678" });
      expect(result.success).toBe(false);
    });
  });

  describe("password 校验", () => {
    it("7 字符被拒绝", () => {
      const result = registerSchema.safeParse({ ...validRegister, password: "1234567" });
      expect(result.success).toBe(false);
    });

    it("8 字符通过", () => {
      const result = registerSchema.safeParse({ ...validRegister, password: "12345678" });
      expect(result.success).toBe(true);
    });

    it("空密码被拒绝", () => {
      const result = registerSchema.safeParse({ ...validRegister, password: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("name 校验", () => {
    it("50 字符通过", () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: "a".repeat(50),
      });
      expect(result.success).toBe(true);
    });

    it("51 字符被拒绝", () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("loginSchema", () => {
  const validLogin = {
    email: "user@example.com",
    password: "a",
  };

  it("合法输入通过", () => {
    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it("无效邮箱被拒绝", () => {
    const result = loginSchema.safeParse({ ...validLogin, email: "bad" });
    expect(result.success).toBe(false);
  });

  it("空密码被拒绝", () => {
    const result = loginSchema.safeParse({ ...validLogin, password: "" });
    expect(result.success).toBe(false);
  });

  it("短密码通过 (登录仅要求非空)", () => {
    const result = loginSchema.safeParse({ ...validLogin, password: "x" });
    expect(result.success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("合法邮箱通过", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("无效邮箱被拒绝", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("空邮箱被拒绝", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("合法输入通过", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc123", password: "123456" }).success).toBe(true);
  });

  it("token 为空被拒绝", () => {
    expect(resetPasswordSchema.safeParse({ token: "", password: "123456" }).success).toBe(false);
  });

  it("密码少于6位被拒绝", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "12345" }).success).toBe(false);
  });

  it("密码恰好6位通过", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "123456" }).success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  const valid = { currentPassword: "old-pass", newPassword: "new-pass1" };

  it("合法输入通过", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("currentPassword 为空被拒绝", () => {
    expect(changePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });

  it("newPassword 少于6位被拒绝", () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: "12345" }).success).toBe(false);
  });

  it("newPassword 恰好6位通过", () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: "123456" }).success).toBe(true);
  });
});
