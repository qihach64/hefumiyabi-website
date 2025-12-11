import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// PlanComponent 配置 schema
const planComponentSchema = z.object({
  componentId: z.string(),
  isIncluded: z.boolean().default(true),
  isHighlighted: z.boolean().default(false),
  tier: z.string().optional().nullable(),
  tierLabel: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  customNote: z.string().optional().nullable(),
  nameOverride: z.string().optional().nullable(),
  descriptionOverride: z.string().optional().nullable(),
});

// 组件配置 schema（简化版，包含升级选项和位置信息）
const componentConfigSchema = z.object({
  componentId: z.string(),
  isIncluded: z.boolean().default(true),
  enabledUpgrades: z.array(z.string()).default([]), // 启用的升级选项 ID
  hotmapX: z.number().min(0).max(1).optional().nullable(), // 热点图 X 坐标 (0-1)
  hotmapY: z.number().min(0).max(1).optional().nullable(), // 热点图 Y 坐标 (0-1)
  hotmapLabelPosition: z.enum(["left", "right"]).optional().default("right"), // 标签位置
});

// 验证 schema - 简化版
const updatePlanSchema = z.object({
  name: z.string().min(1, "套餐名称不能为空"),
  description: z.string().min(10, "描述至少需要10个字符"),
  highlights: z.string().optional().nullable(),
  price: z.number().int().positive("价格必须大于0"),
  originalPrice: z.number().int().positive().optional().nullable(),
  componentIds: z.array(z.string()).optional(), // 简化版：只传组件 ID 数组
  planComponents: z.array(planComponentSchema).optional(), // 完整版：传组件配置
  componentConfigs: z.array(componentConfigSchema).optional(), // 简化版：组件配置（含升级）
  imageUrl: z.union([z.string().url(), z.literal("")]).optional().nullable().transform(val => val || null),
  storeName: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  themeId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
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
        planComponents: {
          include: {
            component: {
              select: {
                id: true,
                code: true,
                name: true,
                nameJa: true,
                nameEn: true,
                description: true,
                type: true,
                icon: true,
                highlights: true,
              },
            },
          },
          orderBy: {
            component: {
              displayOrder: 'asc',
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

    // 使用事务更新套餐、标签和组件
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
          includes: [], // 已废弃，使用 PlanComponent
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

      // 处理 PlanComponent（服务组件）
      // 支持三种方式：
      // 1. componentConfigs - 简化版，包含升级选项
      // 2. planComponents - 完整版配置
      // 3. componentIds - 最简版，只有 ID
      const componentIds = validatedData.componentIds;
      const planComponents = validatedData.planComponents;
      const componentConfigs = validatedData.componentConfigs;

      if (componentIds !== undefined || planComponents !== undefined || componentConfigs !== undefined) {
        // 删除所有旧组件关联
        await tx.planComponent.deleteMany({
          where: { planId: id },
        });

        // 收集所有启用的升级选项
        const allEnabledUpgrades: string[] = [];

        // 创建新组件关联
        if (planComponents && planComponents.length > 0) {
          // 完整版：使用详细配置
          await tx.planComponent.createMany({
            data: planComponents.map((pc) => ({
              planId: id,
              componentId: pc.componentId,
              isIncluded: pc.isIncluded ?? true,
              isHighlighted: pc.isHighlighted ?? false,
              tier: pc.tier || null,
              tierLabel: pc.tierLabel || null,
              quantity: pc.quantity ?? 1,
              customNote: pc.customNote || null,
              nameOverride: pc.nameOverride || null,
              descriptionOverride: pc.descriptionOverride || null,
            })),
          });
        } else if (componentConfigs && componentConfigs.length > 0) {
          // 简化版：组件配置 + 升级选项 + 位置信息
          await tx.planComponent.createMany({
            data: componentConfigs.map((cc) => ({
              planId: id,
              componentId: cc.componentId,
              isIncluded: cc.isIncluded ?? true,
              isHighlighted: false,
              quantity: 1,
              hotmapX: cc.hotmapX ?? null,
              hotmapY: cc.hotmapY ?? null,
              hotmapLabelPosition: cc.hotmapLabelPosition ?? "right",
            })),
          });

          // 收集所有启用的升级选项
          componentConfigs.forEach((cc) => {
            allEnabledUpgrades.push(...cc.enabledUpgrades);
          });
        } else if (componentIds && componentIds.length > 0) {
          // 最简版：只有组件 ID，使用默认配置
          await tx.planComponent.createMany({
            data: componentIds.map((componentId) => ({
              planId: id,
              componentId,
              isIncluded: true,
              isHighlighted: false,
              quantity: 1,
            })),
          });
        }

        // 处理升级选项：将启用的升级保存到 PlanUpgradeBundle
        // 先删除旧的升级包
        await tx.planUpgradeBundle.deleteMany({
          where: { planId: id },
        });

        // 如果有启用的升级选项，创建一个「自定义升级」包
        if (allEnabledUpgrades.length > 0) {
          // 获取升级选项的详情
          const upgradeDetails = await tx.componentUpgrade.findMany({
            where: { id: { in: allEnabledUpgrades } },
            select: {
              id: true,
              fromComponentId: true,
              toComponentId: true,
              priceDiff: true,
              label: true,
            },
          });

          // 计算总价
          const totalOriginalPrice = upgradeDetails.reduce((sum, u) => sum + u.priceDiff, 0);

          // 创建升级包（单个升级不打折，只是记录启用状态）
          await tx.planUpgradeBundle.create({
            data: {
              planId: id,
              label: "可选升级",
              description: `${upgradeDetails.length} 个升级选项`,
              upgradeItems: upgradeDetails.map((u) => ({
                upgradeId: u.id,
                fromComponentId: u.fromComponentId,
                toComponentId: u.toComponentId,
                priceDiff: u.priceDiff,
              })),
              bundlePrice: totalOriginalPrice, // 不打折
              originalPrice: totalOriginalPrice,
              isRecommended: false,
              displayOrder: 0,
              isActive: true,
            },
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
