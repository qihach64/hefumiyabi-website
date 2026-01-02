import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// PlanComponent 配置 schema（v10.1 - 使用 merchantComponentId）
const planComponentSchema = z.object({
  merchantComponentId: z.string(),
  hotmapX: z.number().min(0).max(1).optional().nullable(),
  hotmapY: z.number().min(0).max(1).optional().nullable(),
  hotmapLabelPosition: z.enum(["left", "right"]).optional().default("right"),
  hotmapOrder: z.number().int().optional().default(0),
});

// 验证 schema - v10.1 简化版
const updatePlanSchema = z.object({
  name: z.string().min(1, "套餐名称不能为空"),
  description: z.string().min(10, "描述至少需要10个字符"),
  highlights: z.string().optional().nullable(),
  price: z.number().int().positive("价格必须大于0"),
  originalPrice: z.number().int().positive().optional().nullable(),
  merchantComponentIds: z.array(z.string()).optional(), // 简化版：只传商户组件 ID 数组
  planComponents: z.array(planComponentSchema).optional(), // 完整版：传组件配置
  imageUrl: z.union([z.string().url(), z.literal("")]).optional().nullable().transform(val => val || null),
  images: z.array(z.string().url()).optional().default([]), // 多图支持
  storeName: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  themeId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

// GET - 获取单个套餐详情（v10.1）
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
        planComponents: {
          include: {
            merchantComponent: {
              include: {
                template: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    nameJa: true,
                    nameEn: true,
                    description: true,
                    type: true,
                    icon: true,
                    defaultHighlights: true,
                    defaultImages: true,
                    basePrice: true,
                  },
                },
              },
            },
          },
          orderBy: { hotmapOrder: 'asc' },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ message: "套餐不存在" }, { status: 404 });
    }

    // 转换 planComponents 数据格式以便前端使用
    const enhancedPlanComponents = plan.planComponents.map(pc => {
      const mc = pc.merchantComponent;
      const template = mc.template;
      return {
        id: pc.id,
        planId: pc.planId,
        merchantComponentId: pc.merchantComponentId,
        hotmapX: pc.hotmapX,
        hotmapY: pc.hotmapY,
        hotmapLabelPosition: pc.hotmapLabelPosition,
        hotmapOrder: pc.hotmapOrder,
        // 商户组件信息
        merchantComponent: {
          id: mc.id,
          isEnabled: mc.isEnabled,
          price: mc.price,
          // 使用商户自定义内容，如果为空则使用模板默认
          images: mc.images.length > 0 ? mc.images : template.defaultImages,
          highlights: mc.highlights.length > 0 ? mc.highlights : template.defaultHighlights,
        },
        // 模板信息（平台定义）
        template: {
          id: template.id,
          code: template.code,
          name: template.name,
          nameJa: template.nameJa,
          nameEn: template.nameEn,
          description: template.description,
          type: template.type,
          icon: template.icon,
          basePrice: template.basePrice,
        },
        // 有效价格 = 商户价格 ?? 平台建议价
        effectivePrice: mc.price ?? template.basePrice,
      };
    });

    return NextResponse.json({
      ...plan,
      planComponents: enhancedPlanComponents,
    });
  } catch (error) {
    console.error("获取套餐失败:", error);
    return NextResponse.json({ message: "获取套餐失败" }, { status: 500 });
  }
}

// PATCH - 更新套餐（v10.1）
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

    // 使用事务更新套餐、标签和组件
    const result = await prisma.$transaction(async (tx) => {
      // 更新套餐基本信息
      const updatedPlan = await tx.rentalPlan.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          highlights: validatedData.highlights || null,
          price: validatedData.price,
          originalPrice: validatedData.originalPrice || null,
          includes: [], // 已废弃，使用 PlanComponent
          imageUrl: validatedData.imageUrl || null,
          images: validatedData.images || [],
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

      // 处理 PlanComponent（v10.1 - 使用 merchantComponentId）
      const merchantComponentIds = validatedData.merchantComponentIds;
      const planComponents = validatedData.planComponents;

      if (merchantComponentIds !== undefined || planComponents !== undefined) {
        // 删除所有旧组件关联
        await tx.planComponent.deleteMany({
          where: { planId: id },
        });

        // 创建新组件关联
        if (planComponents && planComponents.length > 0) {
          // 完整版：使用详细配置
          await tx.planComponent.createMany({
            data: planComponents.map((pc) => ({
              planId: id,
              merchantComponentId: pc.merchantComponentId,
              hotmapX: pc.hotmapX ?? null,
              hotmapY: pc.hotmapY ?? null,
              hotmapLabelPosition: pc.hotmapLabelPosition ?? "right",
              hotmapOrder: pc.hotmapOrder ?? 0,
            })),
          });
        } else if (merchantComponentIds && merchantComponentIds.length > 0) {
          // 简化版：只有商户组件 ID，使用默认配置
          await tx.planComponent.createMany({
            data: merchantComponentIds.map((mcId, index) => ({
              planId: id,
              merchantComponentId: mcId,
              hotmapOrder: index,
            })),
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
