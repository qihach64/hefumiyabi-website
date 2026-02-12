import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证登录和管理员权限
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "请先登录" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      return NextResponse.json({ message: "无权限执行此操作" }, { status: 403 });
    }

    const { id: merchantId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ message: "请提供拒绝原因" }, { status: 400 });
    }

    // 检查商家是否存在
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ message: "商家不存在" }, { status: 404 });
    }

    // 更新商家状态为已拒绝
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        status: "REJECTED",
        verified: false,
        // 可以添加拒绝原因字段到数据库
        // rejectionReason: reason,
      },
    });

    // TODO: 发送拒绝邮件给商家
    // await sendEmail({
    //   to: merchant.owner.email,
    //   subject: "商家申请未通过",
    //   text: `很抱歉，您的商家申请未通过审核。原因：${reason}`,
    // });

    return NextResponse.json(
      {
        message: "商家申请已拒绝",
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
        },
        reason,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("拒绝商家失败:", error);
    return NextResponse.json({ message: "操作失败，请重试" }, { status: 500 });
  }
}
