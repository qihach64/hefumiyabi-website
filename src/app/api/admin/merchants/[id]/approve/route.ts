import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证登录和管理员权限
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "请先登录" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      return NextResponse.json(
        { message: "无权限执行此操作" },
        { status: 403 }
      );
    }

    const merchantId = params.id;

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
      return NextResponse.json(
        { message: "商家不存在" },
        { status: 404 }
      );
    }

    // 检查是否已经批准
    if (merchant.status === "APPROVED") {
      return NextResponse.json(
        { message: "该商家已经通过审核" },
        { status: 400 }
      );
    }

    // 更新商家状态为已批准
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        status: "APPROVED",
        verified: true,
      },
    });

    // TODO: 发送审核通过邮件给商家
    // await sendEmail({
    //   to: merchant.owner.email,
    //   subject: "商家申请已通过",
    //   text: `恭喜！您的商家申请已通过审核...`,
    // });

    return NextResponse.json(
      {
        message: "商家审核已批准",
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("批准商家失败:", error);
    return NextResponse.json(
      { message: "操作失败，请重试" },
      { status: 500 }
    );
  }
}
