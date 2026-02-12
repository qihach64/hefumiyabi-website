import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createPlanSchema } from "@/server/schemas";

// POST - 创建新套餐
export async function POST(request: Request) {
  try {
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
    const validatedData = createPlanSchema.parse(body);

    // 生成 slug（使用名称的拼音或简化版本，这里用时间戳简化）
    const slug = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // 创建套餐（关联到当前商家）
    const newPlan = await prisma.rentalPlan.create({
      data: {
        slug,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        originalPrice: validatedData.originalPrice || null,
        depositAmount: validatedData.depositAmount,
        duration: validatedData.duration,
        imageUrl: validatedData.imageUrl || null,
        images: validatedData.images || [],
        storeName: validatedData.storeName || null,
        region: validatedData.region || null,
        isActive: validatedData.isActive,
        isFeatured: validatedData.isFeatured,
        availableFrom: validatedData.availableFrom
          ? new Date(validatedData.availableFrom)
          : null,
        availableUntil: validatedData.availableUntil
          ? new Date(validatedData.availableUntil)
          : null,
        // 关联商家所有权
        merchantId: merchant.id,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "套餐创建成功",
        plan: newPlan,
      },
      { status: 201 }
    );
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

    console.error("创建套餐失败:", error);
    return NextResponse.json({ message: "创建套餐失败" }, { status: 500 });
  }
}
