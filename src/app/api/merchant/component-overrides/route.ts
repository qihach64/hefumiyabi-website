import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/merchant/component-overrides
// 获取商户的组件配置（v10.1 - 使用 MerchantComponent）
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取商户信息
    const merchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // 获取商户的所有组件实例（包含模板信息，支持自定义服务）
    const merchantComponents = await prisma.merchantComponent.findMany({
      where: { merchantId: merchant.id },
      include: {
        template: {
          select: {
            id: true,
            code: true,
            name: true,
            nameJa: true,
            type: true,
            icon: true,
            basePrice: true,
            description: true,
            defaultHighlights: true,
            defaultImages: true,
            outfitCategory: true, // v10.2: OUTFIT 分类
          },
        },
      },
      orderBy: [
        { isCustom: 'asc' }, // 平台服务排在前面
        { createdAt: 'asc' },
      ],
    });

    // 构建响应：组件实例 + 模板信息（支持自定义服务）
    const components = merchantComponents.map(mc => {
      const template = mc.template;
      const isCustom = mc.isCustom && !template;

      return {
        id: mc.id,
        templateId: mc.templateId,
        isCustom: mc.isCustom,
        // 模板信息（平台定义）或自定义服务字段
        code: template?.code || `custom-${mc.id}`,
        name: template?.name || mc.customName || "未命名服务",
        nameJa: template?.nameJa || mc.customNameEn || null,
        type: template?.type || (mc.customBasePrice && mc.customBasePrice > 0 ? "ADDON" : "BASE"),
        icon: template?.icon || mc.customIcon || "📦",
        basePrice: template?.basePrice || mc.customBasePrice || 0,
        description: template?.description || mc.customDescription || null,
        outfitCategory: template?.outfitCategory || null,
        // 商户自定义内容
        images: mc.images.length > 0 ? mc.images : (template?.defaultImages ?? []),
        highlights: mc.highlights.length > 0 ? mc.highlights : (template?.defaultHighlights ?? []),
        // 商户配置
        price: mc.price,
        isEnabled: mc.isEnabled,
        // 有效价格 = 商户价格 ?? 平台建议价 ?? 自定义价格
        effectivePrice: mc.price ?? template?.basePrice ?? mc.customBasePrice ?? 0,
        // 自定义服务额外字段
        customName: mc.customName,
        customDescription: mc.customDescription,
        customIcon: mc.customIcon,
        customBasePrice: mc.customBasePrice,
        approvalStatus: mc.approvalStatus,
      };
    });

    // 按类型分组
    const grouped = components.reduce((acc, component) => {
      const type = component.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(component);
      return acc;
    }, {} as Record<string, typeof components>);

    return NextResponse.json({
      components,
      grouped,
      merchantId: merchant.id,
    });
  } catch (error) {
    console.error('Failed to fetch merchant components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant components' },
      { status: 500 }
    );
  }
}

// PUT /api/merchant/component-overrides
// 批量更新商户的组件配置
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取商户信息
    const merchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { components } = body as {
      components: {
        id: string; // MerchantComponent ID
        price?: number | null;
        isEnabled?: boolean;
        images?: string[];
        highlights?: string[];
      }[];
    };

    if (!Array.isArray(components)) {
      return NextResponse.json(
        { error: 'Invalid request body: components must be an array' },
        { status: 400 }
      );
    }

    // 批量更新
    const results = await Promise.all(
      components.map(component =>
        prisma.merchantComponent.update({
          where: {
            id: component.id,
            merchantId: merchant.id, // 确保只能更新自己的组件
          },
          data: {
            ...(component.price !== undefined && { price: component.price }),
            ...(component.isEnabled !== undefined && { isEnabled: component.isEnabled }),
            ...(component.images !== undefined && { images: component.images }),
            ...(component.highlights !== undefined && { highlights: component.highlights }),
          },
        })
      )
    );

    // 清除页面缓存
    revalidatePath('/merchant/components');

    return NextResponse.json({
      success: true,
      updated: results.length,
    });
  } catch (error) {
    console.error('Failed to update merchant components:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant components' },
      { status: 500 }
    );
  }
}

// PATCH /api/merchant/component-overrides
// 更新单个组件的配置
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取商户信息
    const merchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, price, isEnabled, images, highlights } = body as {
      id: string; // MerchantComponent ID
      price?: number | null;
      isEnabled?: boolean;
      images?: string[];
      highlights?: string[];
    };

    console.log('[PATCH component-overrides] Request body:', { id, price, isEnabled, images, highlights });

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};
    if (price !== undefined) updateData.price = price;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (images !== undefined) updateData.images = images;
    if (highlights !== undefined) updateData.highlights = highlights;

    console.log('[PATCH component-overrides] Update data:', updateData);

    // 更新组件配置
    const updated = await prisma.merchantComponent.update({
      where: {
        id,
        merchantId: merchant.id, // 确保只能更新自己的组件
      },
      data: updateData,
    });

    console.log('[PATCH component-overrides] Updated component:', {
      id: updated.id,
      images: updated.images,
      highlights: updated.highlights,
    });

    // 清除页面缓存，确保刷新后显示最新数据
    revalidatePath('/merchant/components');

    return NextResponse.json({
      success: true,
      component: updated,
    });
  } catch (error) {
    console.error('[PATCH component-overrides] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant component' },
      { status: 500 }
    );
  }
}
