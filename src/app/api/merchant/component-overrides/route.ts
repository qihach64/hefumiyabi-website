import { NextResponse } from 'next/server';
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

    // 获取商户的所有组件实例（包含模板信息）
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
          },
        },
      },
      orderBy: [
        { template: { type: 'asc' } },
        { template: { displayOrder: 'asc' } },
      ],
    });

    // 构建响应：组件实例 + 模板信息
    const components = merchantComponents.map(mc => ({
      id: mc.id,
      templateId: mc.templateId,
      // 模板信息（平台定义）
      code: mc.template.code,
      name: mc.template.name,
      nameJa: mc.template.nameJa,
      type: mc.template.type,
      icon: mc.template.icon,
      basePrice: mc.template.basePrice,
      description: mc.template.description,
      // 商户自定义内容
      images: mc.images.length > 0 ? mc.images : mc.template.defaultImages,
      highlights: mc.highlights.length > 0 ? mc.highlights : mc.template.defaultHighlights,
      // 商户配置
      price: mc.price,
      isEnabled: mc.isEnabled,
      // 有效价格 = 商户价格 ?? 平台建议价
      effectivePrice: mc.price ?? mc.template.basePrice,
    }));

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

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // 更新组件配置
    const updated = await prisma.merchantComponent.update({
      where: {
        id,
        merchantId: merchant.id, // 确保只能更新自己的组件
      },
      data: {
        ...(price !== undefined && { price }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(images !== undefined && { images }),
        ...(highlights !== undefined && { highlights }),
      },
    });

    return NextResponse.json({
      success: true,
      component: updated,
    });
  } catch (error) {
    console.error('Failed to update merchant component:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant component' },
      { status: 500 }
    );
  }
}
