import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/server/services/auth.service";
import { verifyPasswordResetToken, deleteToken } from "@/lib/tokens";
import { TRPCError } from "@trpc/server";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6个字符" }, { status: 400 });
    }

    await authService.confirmPasswordReset(
      prisma,
      token,
      password,
      verifyPasswordResetToken,
      deleteToken,
    );

    return NextResponse.json({ message: "密码已重置，请使用新密码登录" });
  } catch (error) {
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "重置失败，请稍后重试" }, { status: 500 });
  }
}
