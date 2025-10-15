import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "邮箱已经验证过了" },
        { status: 400 }
      );
    }

    // 生成验证 token
    const token = await generateVerificationToken(email);

    // 发送验证邮件
    const result = await sendVerificationEmail(email, token);

    if (!result.success) {
      return NextResponse.json(
        { error: "发送验证邮件失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "验证邮件已发送，请检查您的邮箱",
    });
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json(
      { error: "发送验证邮件失败" },
      { status: 500 }
    );
  }
}
