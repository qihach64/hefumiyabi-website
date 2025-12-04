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
    const { planIds, themeId } = body as {
      planIds: string[];
      themeId: string | null;
    };

    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid planIds" },
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

    // 如果指定了主题ID，验证主题存在
    if (themeId) {
      const theme = await prisma.theme.findUnique({
        where: { id: themeId, isActive: true },
      });

      if (!theme) {
        return NextResponse.json(
          { error: "Theme not found" },
          { status: 404 }
        );
      }
    }

    // 批量更新套餐主题
    const result = await prisma.rentalPlan.updateMany({
      where: {
        id: { in: planIds },
        merchantId: merchant.id,
      },
      data: {
        themeId: themeId,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error("Batch theme update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
