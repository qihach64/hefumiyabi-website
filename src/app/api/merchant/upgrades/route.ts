import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/merchant/upgrades
 * 获取商户可用的升级服务列表（ADDON 类型的 MerchantComponents）
 * 如果商户还没有创建某个 ADDON 类型的 MerchantComponent，会自动创建
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

    // 获取商户已有的 ADDON 类型 MerchantComponents
    const existingMerchantComponents = await prisma.merchantComponent.findMany({
      where: {
        merchantId: merchant.id,
        template: {
          type: "ADDON",
        },
      },
      include: {
        template: true,
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
          // 使用模板默认值
          images: [],
          highlights: [],
          price: null, // null 表示使用模板的 basePrice
        })),
      });
    }

    // 重新获取完整列表
    const allMerchantUpgrades = await prisma.merchantComponent.findMany({
      where: {
        merchantId: merchant.id,
        template: {
          type: "ADDON",
          isActive: true,
        },
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
      orderBy: {
        template: {
          displayOrder: "asc",
        },
      },
    });

    // 转换为前端友好格式
    const upgrades = allMerchantUpgrades.map((mc) => ({
      id: mc.id,
      merchantId: mc.merchantId,
      templateId: mc.templateId,
      isEnabled: mc.isEnabled,
      // 使用商户自定义值，否则使用模板默认
      price: mc.price ?? mc.template.basePrice,
      images: mc.images.length > 0 ? mc.images : mc.template.defaultImages,
      highlights:
        mc.highlights.length > 0 ? mc.highlights : mc.template.defaultHighlights,
      // 模板信息
      template: {
        id: mc.template.id,
        code: mc.template.code,
        name: mc.template.name,
        nameJa: mc.template.nameJa,
        nameEn: mc.template.nameEn,
        description: mc.template.description,
        icon: mc.template.icon,
        basePrice: mc.template.basePrice,
      },
    }));

    return NextResponse.json({ upgrades });
  } catch (error) {
    console.error("获取升级服务失败:", error);
    return NextResponse.json(
      { message: "获取升级服务失败" },
      { status: 500 }
    );
  }
}
