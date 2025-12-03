import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// 验证 schema
const updatePlanSchema = z.object({
  name: z.string().min(1, "套餐名称不能为空"),
  nameEn: z.string().optional().nullable().transform(val => val || ""),
  description: z.string().min(10, "描述至少需要10个字符"),
  category: z.enum(["LADIES", "MENS", "COUPLE", "FAMILY", "GROUP", "SPECIAL"]),
  price: z.number().int().positive("价格必须大于0"),
  originalPrice: z.number().int().positive().optional().nullable(),
  depositAmount: z.number().int().nonnegative("押金不能为负数"),
  duration: z.number().int().positive("时长必须大于0"),
  includes: z.array(z.string()),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional().nullable().transform(val => val || ""),
  storeName: z.string().optional().nullable().transform(val => val || ""),
  region: z.string().optional().nullable().transform(val => val || ""),
  tags: z.array(z.string()), // 保留旧数据兼容性
  tagIds: z.array(z.string()).optional(), // 新标签系统
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isLimited: z.boolean(),
  maxBookings: z.number().int().positive().optional().nullable(),
  availableFrom: z.union([z.string().datetime(), z.literal("")]).optional().nullable().transform(val => val || ""),
  availableUntil: z.union([z.string().datetime(), z.literal("")]).optional().nullable().transform(val => val || ""),
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
      // 更新套餐
      const updatedPlan = await tx.rentalPlan.update({
        where: { id },
        data: {
          name: validatedData.name,
          nameEn: validatedData.nameEn || null,
          description: validatedData.description,
          category: validatedData.category,
          price: validatedData.price,
          originalPrice: validatedData.originalPrice || null,
          depositAmount: validatedData.depositAmount,
          duration: validatedData.duration,
          includes: validatedData.includes,
          imageUrl: validatedData.imageUrl || null,
          storeName: validatedData.storeName || null,
          region: validatedData.region || null,
          tags: validatedData.tags,
          isActive: validatedData.isActive,
          isFeatured: validatedData.isFeatured,
          isLimited: validatedData.isLimited,
          maxBookings: validatedData.maxBookings || null,
          availableFrom: validatedData.availableFrom
            ? new Date(validatedData.availableFrom)
            : null,
          availableUntil: validatedData.availableUntil
            ? new Date(validatedData.availableUntil)
            : null,
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
      console.error("=== ZOD VALIDATION ERROR ===");
      console.error("Full error object:", error);
      console.error("Error.errors:", error.errors);
      console.error("JSON stringify:", JSON.stringify(error.errors, null, 2));

      // Build error messages with defensive checks
      let errorMessages = '验证失败';
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessages = error.errors
          .map(err => {
            const path = (err.path || []).join('.');
            const msg = err.message || '未知错误';
            return `${path}: ${msg}`;
          })
          .filter(msg => msg)
          .join('; ') || '验证失败';
      }

      console.error("Final error message:", errorMessages);

      return NextResponse.json(
        {
          message: `数据验证失败: ${errorMessages}`,
          errors: error.errors
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
