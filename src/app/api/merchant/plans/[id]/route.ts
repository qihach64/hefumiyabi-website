import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// 验证 schema - 简化版
const updatePlanSchema = z.object({
  name: z.string().min(1, "套餐名称不能为空"),
  description: z.string().min(10, "描述至少需要10个字符"),
  highlights: z.string().optional().nullable(),
  price: z.number().int().positive("价格必须大于0"),
  originalPrice: z.number().int().positive().optional().nullable(),
  includes: z.array(z.string()),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional().nullable().transform(val => val || null),
  storeName: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  themeId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(), // 新标签系统
  isActive: z.boolean(),
});

// GET - 获取单个套餐详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "请先登录" }, { status: 401 });
    }

    const plan = await prisma.rentalPlan.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
          },
        },
        planTags: {
          include: {
            tag: {
              select: {
                id: true,
                code: true,
                name: true,
                icon: true,
                color: true,
                categoryId: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ message: "套餐不存在" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("获取套餐失败:", error);
    return NextResponse.json({ message: "获取套餐失败" }, { status: 500 });
  }
}

// PATCH - 更新套餐
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "请先登录" }, { status: 401 });
    }

    // 验证商家权限
    const merchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!merchant || merchant.status !== "APPROVED") {
      return NextResponse.json(
        { message: "无权限执行此操作" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updatePlanSchema.parse(body);

    // 验证套餐所有权
    const plan = await prisma.rentalPlan.findUnique({
      where: { id },
      select: { merchantId: true },
    });

    if (!plan) {
      return NextResponse.json({ message: "套餐不存在" }, { status: 404 });
    }

    if (plan.merchantId !== merchant.id) {
      return NextResponse.json(
        { message: "无权限操作此套餐" },
        { status: 403 }
      );
    }

    // 使用事务更新套餐和标签
    const result = await prisma.$transaction(async (tx) => {
      // 更新套餐 - 简化字段
      const updatedPlan = await tx.rentalPlan.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          highlights: validatedData.highlights || null,
          price: validatedData.price,
          originalPrice: validatedData.originalPrice || null,
          includes: validatedData.includes,
          imageUrl: validatedData.imageUrl || null,
          storeName: validatedData.storeName || null,
          region: validatedData.region || null,
          themeId: validatedData.themeId || null,
          isActive: validatedData.isActive,
        },
      });

      // 如果提供了新标签系统的 tagIds，同步 PlanTag 记录
      if (validatedData.tagIds !== undefined) {
        // 删除所有旧标签关联
        await tx.planTag.deleteMany({
          where: { planId: id },
        });

        // 创建新标签关联
        if (validatedData.tagIds.length > 0) {
          await tx.planTag.createMany({
            data: validatedData.tagIds.map((tagId) => ({
              planId: id,
              tagId: tagId,
              addedBy: session.user.id,
            })),
          });

          // 更新标签使用次数
          await tx.tag.updateMany({
            where: { id: { in: validatedData.tagIds } },
            data: { usageCount: { increment: 1 } },
          });
        }
      }

      return updatedPlan;
    });

    return NextResponse.json({
      message: "更新成功",
      plan: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      return NextResponse.json(
        {
          message: `数据验证失败: ${errorMessages}`,
          errors: error.issues
        },
        { status: 400 }
      );
    }

    console.error("更新套餐失败:", error);
    return NextResponse.json({ message: "更新套餐失败" }, { status: 500 });
  }
}

// DELETE - 删除套餐（软删除 - 设为不可用）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "请先登录" }, { status: 401 });
    }

    // 验证商家权限
    const merchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!merchant || merchant.status !== "APPROVED") {
      return NextResponse.json(
        { message: "无权限执行此操作" },
        { status: 403 }
      );
    }

    // 验证套餐所有权
    const plan = await prisma.rentalPlan.findUnique({
      where: { id },
      select: { merchantId: true },
    });

    if (!plan) {
      return NextResponse.json({ message: "套餐不存在" }, { status: 404 });
    }

    if (plan.merchantId !== merchant.id) {
      return NextResponse.json(
        { message: "无权限操作此套餐" },
        { status: 403 }
      );
    }

    // 软删除 - 设为不可用
    await prisma.rentalPlan.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "套餐已下架" });
  } catch (error) {
    console.error("删除套餐失败:", error);
    return NextResponse.json({ message: "删除套餐失败" }, { status: 500 });
  }
}
