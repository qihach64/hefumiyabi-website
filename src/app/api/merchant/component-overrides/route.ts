import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/merchant/component-overrides
// 获取商户的组件覆盖配置
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

    // 获取所有平台组件
    const allComponents = await prisma.serviceComponent.findMany({
      where: {
        isActive: true,
        isSystemComponent: true,
        status: 'APPROVED',
      },
      orderBy: [
        { type: 'asc' },
        { displayOrder: 'asc' },
      ],
      select: {
        id: true,
        code: true,
        name: true,
        nameJa: true,
        type: true,
        icon: true,
        basePrice: true,
        tier: true,
        tierLabel: true,
        description: true,
      },
    });

    // 获取商户的覆盖配置
    const overrides = await prisma.merchantComponentOverride.findMany({
      where: { merchantId: merchant.id },
    });

    // 构建响应：组件 + 覆盖配置
    const overrideMap = new Map(
      overrides.map(o => [o.componentId, o])
    );

    const components = allComponents.map(component => ({
      ...component,
      override: overrideMap.get(component.id) || null,
      // 有效价格 = 覆盖价格 ?? 平台建议价
      effectivePrice: overrideMap.get(component.id)?.price ?? component.basePrice,
      // 是否启用（默认启用）
      isEnabled: overrideMap.get(component.id)?.isEnabled ?? true,
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
    console.error('Failed to fetch component overrides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component overrides' },
      { status: 500 }
    );
  }
}

// PUT /api/merchant/component-overrides
// 批量更新商户的组件覆盖配置
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
    const { overrides } = body as {
      overrides: {
        componentId: string;
        price: number | null;
        isEnabled: boolean;
      }[];
    };

    if (!Array.isArray(overrides)) {
      return NextResponse.json(
        { error: 'Invalid request body: overrides must be an array' },
        { status: 400 }
      );
    }

    // 批量 upsert 覆盖配置
    const results = await Promise.all(
      overrides.map(override =>
        prisma.merchantComponentOverride.upsert({
          where: {
            merchantId_componentId: {
              merchantId: merchant.id,
              componentId: override.componentId,
            },
          },
          create: {
            merchantId: merchant.id,
            componentId: override.componentId,
            price: override.price,
            isEnabled: override.isEnabled,
          },
          update: {
            price: override.price,
            isEnabled: override.isEnabled,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: results.length,
    });
  } catch (error) {
    console.error('Failed to update component overrides:', error);
    return NextResponse.json(
      { error: 'Failed to update component overrides' },
      { status: 500 }
    );
  }
}

// PATCH /api/merchant/component-overrides
// 更新单个组件的覆盖配置
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
    const { componentId, price, isEnabled } = body as {
      componentId: string;
      price?: number | null;
      isEnabled?: boolean;
    };

    if (!componentId) {
      return NextResponse.json(
        { error: 'componentId is required' },
        { status: 400 }
      );
    }

    // 验证组件存在
    const component = await prisma.serviceComponent.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    // Upsert 覆盖配置
    const override = await prisma.merchantComponentOverride.upsert({
      where: {
        merchantId_componentId: {
          merchantId: merchant.id,
          componentId,
        },
      },
      create: {
        merchantId: merchant.id,
        componentId,
        price: price ?? null,
        isEnabled: isEnabled ?? true,
      },
      update: {
        ...(price !== undefined && { price }),
        ...(isEnabled !== undefined && { isEnabled }),
      },
    });

    return NextResponse.json({
      success: true,
      override,
    });
  } catch (error) {
    console.error('Failed to update component override:', error);
    return NextResponse.json(
      { error: 'Failed to update component override' },
      { status: 500 }
    );
  }
}
