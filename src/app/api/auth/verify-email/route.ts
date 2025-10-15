import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, deleteToken } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "缺少验证 token" }, { status: 400 });
    }

    // 验证 token
    const verification = await verifyToken(token);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      );
    }

    // 更新用户的邮箱验证状态
    await prisma.user.update({
      where: { email: verification.email },
      data: { emailVerified: new Date() },
    });

    // 删除已使用的 token
    await deleteToken(token);

    return NextResponse.json({
      message: "邮箱验证成功",
      email: verification.email,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
