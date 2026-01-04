import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/merchant/upgrades
 * 获取商户可用的升级服务列表（包括平台模板和自定义服务）
 */
export async function GET() {
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

    // 获取所有 ADDON 类型的平台组件模板
    const addonTemplates = await prisma.serviceComponent.findMany({
      where: {
        type: "ADDON",
        isActive: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    // 获取商户已有的平台模板 MerchantComponents
    const existingMerchantComponents = await prisma.merchantComponent.findMany({
      where: {
        merchantId: merchant.id,
        NOT: { templateId: null },
        template: {
          type: "ADDON",
        },
      },
    });

    // 为商户创建缺失的 MerchantComponents
    const existingTemplateIds = new Set(
      existingMerchantComponents.map((mc) => mc.templateId)
    );
    const missingTemplates = addonTemplates.filter(
      (t) => !existingTemplateIds.has(t.id)
    );

    if (missingTemplates.length > 0) {
      await prisma.merchantComponent.createMany({
        data: missingTemplates.map((template) => ({
          merchantId: merchant.id,
          templateId: template.id,
          isEnabled: true,
          isCustom: false,
          approvalStatus: "APPROVED",
          images: [],
          highlights: [],
          price: null,
        })),
      });
    }

    // 获取所有升级服务（平台模板 + 自定义服务）
    const allMerchantUpgrades = await prisma.merchantComponent.findMany({
      where: {
        merchantId: merchant.id,
        OR: [
          // 平台模板（ADDON 类型）
          {
            NOT: { templateId: null },
            template: {
              type: "ADDON",
              isActive: true,
            },
          },
          // 自定义服务
          {
            isCustom: true,
          },
        ],
      },
      include: {
        template: {
          select: {
            id: true,
            code: true,
            name: true,
            nameJa: true,
            nameEn: true,
            description: true,
            icon: true,
            basePrice: true,
            defaultHighlights: true,
            defaultImages: true,
            displayOrder: true,
          },
        },
      },
      orderBy: [
        { isCustom: "asc" }, // 平台模板在前
        { createdAt: "asc" },
      ],
    });

    // 转换为前端友好格式
    const upgrades = allMerchantUpgrades.map((mc) => {
      const isCustom = mc.isCustom;
      const template = mc.template;

      return {
        id: mc.id,
        merchantId: mc.merchantId,
        templateId: mc.templateId,
        isEnabled: mc.isEnabled,

        // 自定义服务字段
        isCustom: mc.isCustom,
        approvalStatus: mc.approvalStatus,
        adminFeedback: mc.adminFeedback,
        customName: mc.customName,
        customNameEn: mc.customNameEn,
        customDescription: mc.customDescription,
        customIcon: mc.customIcon,
        customBasePrice: mc.customBasePrice,

        // 有效价格（优先级：mc.price > customBasePrice > template.basePrice）
        price: mc.price ?? (isCustom ? mc.customBasePrice : template?.basePrice) ?? 0,

        // 图片和亮点
        images: mc.images.length > 0 ? mc.images : (template?.defaultImages ?? []),
        highlights: mc.highlights.length > 0 ? mc.highlights : (template?.defaultHighlights ?? []),

        // 模板信息（自定义服务时为 null）
        template: template
          ? {
              id: template.id,
              code: template.code,
              name: template.name,
              nameJa: template.nameJa,
              nameEn: template.nameEn,
              description: template.description,
              icon: template.icon,
              basePrice: template.basePrice,
              defaultImages: template.defaultImages,
              defaultHighlights: template.defaultHighlights,
            }
          : null,
      };
    });

    return NextResponse.json({ upgrades });
  } catch (error) {
    console.error("获取升级服务失败:", error);
    return NextResponse.json(
      { message: "获取升级服务失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant/upgrades
 * 创建自定义升级服务
 */
const createCustomUpgradeSchema = z.object({
  customName: z.string().min(1, "服务名称不能为空").max(100),
  customNameEn: z.string().max(100).optional(),
  customDescription: z.string().max(500).optional(),
  customIcon: z.string().max(10).optional(),
  customBasePrice: z.number().int().min(0, "价格不能为负"),
  images: z.array(z.string().url()).max(10).optional(),
  highlights: z.array(z.string().max(100)).max(10).optional(),
});

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
    const validation = createCustomUpgradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "参数验证失败", errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 创建自定义升级服务
    const newUpgrade = await prisma.merchantComponent.create({
      data: {
        merchantId: merchant.id,
        templateId: null, // 自定义服务无模板
        isCustom: true,
        approvalStatus: "PENDING", // 需要审核
        customName: data.customName,
        customNameEn: data.customNameEn || null,
        customDescription: data.customDescription || null,
        customIcon: data.customIcon || "✨",
        customBasePrice: data.customBasePrice,
        images: data.images || [],
        highlights: data.highlights || [],
        isEnabled: true,
        price: null, // 使用 customBasePrice
      },
    });

    return NextResponse.json({
      message: "自定义服务创建成功，等待平台审核",
      upgrade: {
        id: newUpgrade.id,
        isCustom: true,
        approvalStatus: newUpgrade.approvalStatus,
        customName: newUpgrade.customName,
        customBasePrice: newUpgrade.customBasePrice,
      },
    });
  } catch (error) {
    console.error("创建自定义升级服务失败:", error);
    return NextResponse.json(
      { message: "创建自定义升级服务失败" },
      { status: 500 }
    );
  }
}
