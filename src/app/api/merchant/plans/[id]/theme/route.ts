import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH - 更新单个套餐的主题
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const { themeId } = body as { themeId: string | null };

    // 验证套餐所有权
    const plan = await prisma.rentalPlan.findUnique({
      where: { id },
      select: { merchantId: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.merchantId !== merchant.id) {
      return NextResponse.json(
        { error: "You do not have permission to modify this plan" },
        { status: 403 }
      );
    }

    // 如果指定了主题ID，验证主题存在
    if (themeId) {
      const theme = await prisma.theme.findUnique({
        where: { id: themeId, isActive: true },
      });

      if (!theme) {
        return NextResponse.json({ error: "Theme not found" }, { status: 404 });
      }
    }

    // 更新套餐主题
    const updatedPlan = await prisma.rentalPlan.update({
      where: { id },
      data: { themeId },
      select: {
        id: true,
        themeId: true,
        theme: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Update plan theme error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
