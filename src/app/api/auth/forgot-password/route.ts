import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/server/services/auth.service";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "请提供邮箱地址" }, { status: 400 });
    }

    await authService.requestPasswordReset(
      prisma,
      email.trim().toLowerCase(),
      generatePasswordResetToken,
      sendPasswordResetEmail,
    );

    // 无论用户是否存在，始终返回相同响应（防枚举）
    return NextResponse.json({
      message: "如果该邮箱已注册，重置链接将在几分钟内发送",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 });
  }
}
