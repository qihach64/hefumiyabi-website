import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH - 快速更新套餐名称
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
    const { name } = body as { name: string };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required and cannot be empty" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // 验证套餐所有权
    const plan = await prisma.rentalPlan.findUnique({
      where: { id },
      select: { merchantId: true, name: true },
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

    // 更新套餐名称
    const updatedPlan = await prisma.rentalPlan.update({
      where: { id },
      data: { name: trimmedName },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Update plan name error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
