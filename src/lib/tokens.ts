import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// 生成验证 token
export async function generateVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 小时后过期

  // 删除该邮箱的旧 token
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // 创建新 token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

// 验证 token
export async function verifyToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { valid: false, error: "无效的验证链接" };
  }

  if (verificationToken.expires < new Date()) {
    // 删除过期的 token
    await prisma.verificationToken.delete({
      where: { token },
    });
    return { valid: false, error: "验证链接已过期" };
  }

  return { valid: true, email: verificationToken.identifier };
}

// 删除已使用的 token
export async function deleteToken(token: string) {
  await prisma.verificationToken.delete({
    where: { token },
  });
}
