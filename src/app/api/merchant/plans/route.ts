import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// 验证 schema
const createPlanSchema = z.object({
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
  images: z.array(z.string().url()).optional().default([]), // 多图支持
  storeName: z.string().optional().nullable().transform(val => val || ""),
  region: z.string().optional().nullable().transform(val => val || ""),
  tags: z.array(z.string()),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isLimited: z.boolean().default(false),
  maxBookings: z.number().int().positive().optional().nullable(),
  availableFrom: z.union([z.string().datetime(), z.literal("")]).optional().nullable().transform(val => val || ""),
  availableUntil: z.union([z.string().datetime(), z.literal("")]).optional().nullable().transform(val => val || ""),
});

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
        nameEn: validatedData.nameEn || null,
        description: validatedData.description,
        category: validatedData.category,
        price: validatedData.price,
        originalPrice: validatedData.originalPrice || null,
        depositAmount: validatedData.depositAmount,
        duration: validatedData.duration,
        includes: validatedData.includes,
        imageUrl: validatedData.imageUrl || null,
        images: validatedData.images || [],
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
