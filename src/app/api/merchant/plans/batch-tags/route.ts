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
    const { planIds, tagIds, mode } = body as {
      planIds: string[];
      tagIds: string[];
      mode: "add" | "remove" | "set";
    };

    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid planIds" },
        { status: 400 }
      );
    }

    if (!tagIds || !Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: "Invalid tagIds" },
        { status: 400 }
      );
    }

    if (!["add", "remove", "set"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode" },
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

    // 验证标签存在
    if (tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          isActive: true,
        },
        select: { id: true },
      });

      if (tags.length !== tagIds.length) {
        return NextResponse.json(
          { error: "Some tags are invalid" },
          { status: 400 }
        );
      }
    }

    // 执行批量操作
    let updated = 0;

    for (const planId of planIds) {
      if (mode === "set") {
        // 替换全部：先删除所有现有标签，再添加新标签
        await prisma.planTag.deleteMany({
          where: { planId },
        });

        if (tagIds.length > 0) {
          await prisma.planTag.createMany({
            data: tagIds.map((tagId) => ({
              planId,
              tagId,
            })),
            skipDuplicates: true,
          });
        }
      } else if (mode === "add") {
        // 添加标签（保留现有）
        if (tagIds.length > 0) {
          await prisma.planTag.createMany({
            data: tagIds.map((tagId) => ({
              planId,
              tagId,
            })),
            skipDuplicates: true,
          });
        }
      } else if (mode === "remove") {
        // 移除指定标签
        if (tagIds.length > 0) {
          await prisma.planTag.deleteMany({
            where: {
              planId,
              tagId: { in: tagIds },
            },
          });
        }
      }
      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
      mode,
      tagCount: tagIds.length,
    });
  } catch (error) {
    console.error("Batch tags update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
