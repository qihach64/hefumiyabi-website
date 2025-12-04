import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    // 验证登录
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取商家信息
    const merchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!merchant || merchant.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Merchant not found or not approved" },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { planIds, isActive } = body as {
      planIds: string[];
      isActive: boolean;
    };

    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid planIds" },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid isActive value" },
        { status: 400 }
      );
    }

    // 验证所有套餐都属于该商家
    const plans = await prisma.rentalPlan.findMany({
      where: {
        id: { in: planIds },
        merchantId: merchant.id,
      },
      select: { id: true },
    });

    if (plans.length !== planIds.length) {
      return NextResponse.json(
        { error: "Some plans do not belong to this merchant" },
        { status: 403 }
      );
    }

    // 批量更新套餐状态
    const result = await prisma.rentalPlan.updateMany({
      where: {
        id: { in: planIds },
        merchantId: merchant.id,
      },
      data: {
        isActive: isActive,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      isActive: isActive,
    });
  } catch (error) {
    console.error("Batch status update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
