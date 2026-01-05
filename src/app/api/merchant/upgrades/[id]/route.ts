import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateMerchantComponentSchema = z.object({
  // 商户自定义图片
  images: z.array(z.string().url()).optional(),
  // 商户自定义亮点/描述
  highlights: z.array(z.string().min(1).max(100)).optional(),
  // 商户自定义价格（分）
  price: z.number().int().min(0).nullable().optional(),
  // 启用状态
  isEnabled: z.boolean().optional(),
});

/**
 * PATCH /api/merchant/upgrades/[id]
 * 更新商户的升级服务组件（MerchantComponent）
 * 允许更新：images, highlights, price, isEnabled
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // 获取要更新的 MerchantComponent（支持平台模板和自定义服务）
    const merchantComponent = await prisma.merchantComponent.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        OR: [
          // 平台模板的 ADDON 类型
          { template: { type: "ADDON" } },
          // 自定义服务（无模板）
          { isCustom: true, templateId: null },
        ],
      },
      include: {
        template: true,
      },
    });

    if (!merchantComponent) {
      return NextResponse.json(
        { message: "未找到该升级服务" },
        { status: 404 }
      );
    }

    // 解析请求体
    const body = await request.json();
    console.log("[PATCH upgrades] 收到请求:", {
      id,
      body,
      imagesCount: body.images?.length,
      highlightsCount: body.highlights?.length,
    });

    const validationResult = updateMerchantComponentSchema.safeParse(body);

    if (!validationResult.success) {
      console.log("[PATCH upgrades] 验证失败:", validationResult.error.flatten());
      return NextResponse.json(
        {
          message: "请求参数错误",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    console.log("[PATCH upgrades] 验证通过的数据:", {
      images: data.images,
      highlights: data.highlights,
    });

    // 构建更新数据
    const updateData: {
      images?: string[];
      highlights?: string[];
      price?: number | null;
      isEnabled?: boolean;
    } = {};

    if (data.images !== undefined) {
      updateData.images = data.images;
    }

    if (data.highlights !== undefined) {
      updateData.highlights = data.highlights;
    }

    if (data.price !== undefined) {
      updateData.price = data.price;
    }

    if (data.isEnabled !== undefined) {
      updateData.isEnabled = data.isEnabled;
    }

    console.log("[PATCH upgrades] 更新数据:", updateData);

    // 更新 MerchantComponent
    const updated = await prisma.merchantComponent.update({
      where: { id },
      data: updateData,
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
          },
        },
      },
    });

    // 返回更新后的数据（格式与 GET 一致，支持自定义服务）
    const template = updated.template;
    const isCustom = updated.isCustom && !template;

    const response = {
      id: updated.id,
      merchantId: updated.merchantId,
      templateId: updated.templateId,
      isEnabled: updated.isEnabled,
      isCustom: updated.isCustom,
      price: updated.price ?? (isCustom ? updated.customBasePrice : template?.basePrice) ?? 0,
      images:
        updated.images.length > 0
          ? updated.images
          : (isCustom ? [] : template?.defaultImages ?? []),
      highlights:
        updated.highlights.length > 0
          ? updated.highlights
          : (isCustom ? [] : template?.defaultHighlights ?? []),
      // 自定义服务字段
      customName: updated.customName,
      customNameEn: updated.customNameEn,
      customDescription: updated.customDescription,
      customIcon: updated.customIcon,
      customBasePrice: updated.customBasePrice,
      // 平台模板（自定义服务时为 null）
      template: template ? {
        id: template.id,
        code: template.code,
        name: template.name,
        nameJa: template.nameJa,
        nameEn: template.nameEn,
        description: template.description,
        icon: template.icon,
        basePrice: template.basePrice,
      } : null,
    };

    return NextResponse.json({ upgrade: response });
  } catch (error) {
    console.error("更新升级服务失败:", error);
    return NextResponse.json(
      { message: "更新升级服务失败" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/merchant/upgrades/[id]
 * 获取单个升级服务详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // 获取 MerchantComponent（支持平台模板和自定义服务）
    const merchantComponent = await prisma.merchantComponent.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        OR: [
          // 平台模板的 ADDON 类型
          { template: { type: "ADDON" } },
          // 自定义服务（无模板）
          { isCustom: true, templateId: null },
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
          },
        },
      },
    });

    if (!merchantComponent) {
      return NextResponse.json(
        { message: "未找到该升级服务" },
        { status: 404 }
      );
    }

    // 返回数据（支持自定义服务）
    const template = merchantComponent.template;
    const isCustom = merchantComponent.isCustom && !template;

    const response = {
      id: merchantComponent.id,
      merchantId: merchantComponent.merchantId,
      templateId: merchantComponent.templateId,
      isEnabled: merchantComponent.isEnabled,
      isCustom: merchantComponent.isCustom,
      price: merchantComponent.price ?? (isCustom ? merchantComponent.customBasePrice : template?.basePrice) ?? 0,
      // 原始数据（用于编辑时判断是否自定义）
      rawImages: merchantComponent.images,
      rawHighlights: merchantComponent.highlights,
      rawPrice: merchantComponent.price,
      // 有效数据（合并默认值）
      images:
        merchantComponent.images.length > 0
          ? merchantComponent.images
          : (isCustom ? [] : template?.defaultImages ?? []),
      highlights:
        merchantComponent.highlights.length > 0
          ? merchantComponent.highlights
          : (isCustom ? [] : template?.defaultHighlights ?? []),
      // 自定义服务字段
      customName: merchantComponent.customName,
      customNameEn: merchantComponent.customNameEn,
      customDescription: merchantComponent.customDescription,
      customIcon: merchantComponent.customIcon,
      customBasePrice: merchantComponent.customBasePrice,
      // 平台模板（自定义服务时为 null）
      template: template ? {
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
      } : null,
    };

    return NextResponse.json({ upgrade: response });
  } catch (error) {
    console.error("获取升级服务失败:", error);
    return NextResponse.json(
      { message: "获取升级服务失败" },
      { status: 500 }
    );
  }
}
