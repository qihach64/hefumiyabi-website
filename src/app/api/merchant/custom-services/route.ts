import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/merchant/custom-services
 * 创建自定义服务（支持 BASE 包含服务 和 ADDON 升级服务）
 */
const createCustomServiceSchema = z.object({
  type: z.enum(["BASE", "ADDON"]),
  customName: z.string().min(1, "服务名称不能为空").max(100),
  customNameEn: z.string().max(100).optional().nullable(),
  customDescription: z.string().max(500).optional().nullable(),
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
    const validation = createCustomServiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "参数验证失败", errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 创建自定义服务
    const newService = await prisma.merchantComponent.create({
      data: {
        merchantId: merchant.id,
        templateId: null, // 自定义服务无模板
        isCustom: true,
        approvalStatus: "PENDING", // 需要审核
        customName: data.customName,
        customNameEn: data.customNameEn || null,
        customDescription: data.customDescription || null,
        customIcon: data.customIcon || (data.type === "ADDON" ? "✨" : "📦"),
        customBasePrice: data.customBasePrice,
        // 存储服务类型到一个特殊字段（通过 customDescription 前缀或单独字段）
        // 由于 MerchantComponent 没有 type 字段，我们用价格来区分：
        // - BASE 类型通常价格为 0（包含在套餐内）
        // - ADDON 类型有实际价格
        // 或者我们可以在 highlights 中加入类型标记
        images: data.images || [],
        highlights: data.highlights || [],
        isEnabled: true,
        price: data.type === "ADDON" ? data.customBasePrice : null,
      },
    });

    // 记录服务类型（可选：存储到数据库的 metadata 或其他地方）
    // 这里我们通过价格和 isCustom 来推断类型

    return NextResponse.json({
      message: "自定义服务创建成功，等待平台审核",
      service: {
        id: newService.id,
        type: data.type,
        isCustom: true,
        approvalStatus: newService.approvalStatus,
        customName: newService.customName,
        customBasePrice: newService.customBasePrice,
      },
    });
  } catch (error) {
    console.error("创建自定义服务失败:", error);
    return NextResponse.json(
      { message: "创建自定义服务失败" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/merchant/custom-services
 * 获取商户的自定义服务列表
 */
export async function GET(request: Request) {
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

    // 获取 URL 参数
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type"); // BASE | ADDON | null (all)

    // 获取所有自定义服务
    const customServices = await prisma.merchantComponent.findMany({
      where: {
        merchantId: merchant.id,
        isCustom: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 根据类型筛选（通过价格推断）
    let filtered = customServices;
    if (typeFilter === "ADDON") {
      // ADDON 类型有价格
      filtered = customServices.filter((s) => s.customBasePrice && s.customBasePrice > 0);
    } else if (typeFilter === "BASE") {
      // BASE 类型价格为 0 或 null
      filtered = customServices.filter((s) => !s.customBasePrice || s.customBasePrice === 0);
    }

    // 转换为前端友好格式
    const services = filtered.map((s) => ({
      id: s.id,
      isCustom: true,
      approvalStatus: s.approvalStatus,
      adminFeedback: s.adminFeedback,
      customName: s.customName,
      customNameEn: s.customNameEn,
      customDescription: s.customDescription,
      customIcon: s.customIcon,
      customBasePrice: s.customBasePrice,
      images: s.images,
      highlights: s.highlights,
      isEnabled: s.isEnabled,
      createdAt: s.createdAt,
      // 推断类型
      inferredType: s.customBasePrice && s.customBasePrice > 0 ? "ADDON" : "BASE",
    }));

    return NextResponse.json({ services });
  } catch (error) {
    console.error("获取自定义服务失败:", error);
    return NextResponse.json(
      { message: "获取自定义服务失败" },
      { status: 500 }
    );
  }
}
