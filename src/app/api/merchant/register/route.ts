import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "请先登录" },
        { status: 401 }
      );
    }

    // 检查用户是否已经是商家
    const existingMerchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
    });

    if (existingMerchant) {
      return NextResponse.json(
        { message: "您已经注册为商家" },
        { status: 400 }
      );
    }

    // 解析请求body
    const body = await request.json();
    const { businessName, legalName, description, logo, bankAccount, taxId } = body;

    // 验证必填字段
    if (!businessName || !description || !taxId || !bankAccount) {
      return NextResponse.json(
        { message: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    // 创建商家记录
    const merchant = await prisma.merchant.create({
      data: {
        ownerId: session.user.id,
        businessName,
        legalName: legalName || null,
        description,
        logo: logo || null,
        bankAccount,
        taxId,
        status: "PENDING", // 默认待审核状态
        verified: false,
        commissionRate: 0.15, // 默认15%佣金
      },
    });

    // TODO: 发送审核通知邮件给管理员

    return NextResponse.json(
      {
        message: "申请提交成功，我们将在2-3个工作日内审核",
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          status: merchant.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("商家注册错误:", error);
    return NextResponse.json(
      { message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
