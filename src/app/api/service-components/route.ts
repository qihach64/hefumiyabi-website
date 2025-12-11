import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// 获取所有激活的服务组件（按类型分组）+ 升级路径
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');
    const merchantId = searchParams.get('merchantId');

    // 获取当前用户的商户 ID（如果已登录）
    const session = await auth();
    let currentMerchantId: string | null = null;
    if (session?.user?.id) {
      const merchant = await prisma.merchant.findUnique({
        where: { ownerId: session.user.id },
        select: { id: true },
      });
      currentMerchantId = merchant?.id || null;
    }

    // 使用请求参数或当前登录用户的商户 ID
    const effectiveMerchantId = merchantId || currentMerchantId;

    // 获取平台组件（所有商户可见）
    const platformComponents = await prisma.serviceComponent.findMany({
      where: {
        isActive: true,
        status: 'APPROVED',
        isSystemComponent: true,
      },
      orderBy: [
        { type: 'asc' },
        { tier: 'asc' },
        { displayOrder: 'asc' },
      ],
      select: {
        id: true,
        code: true,
        name: true,
        nameJa: true,
        nameEn: true,
        description: true,
        type: true,
        icon: true,
        tier: true,
        tierLabel: true,
        isBaseComponent: true,
        basePrice: true,
        highlights: true,
        isSystemComponent: true,
      },
    });

    // 获取商户自定义组件（仅当前商户可见）
    let merchantComponents: typeof platformComponents = [];
    if (effectiveMerchantId) {
      merchantComponents = await prisma.serviceComponent.findMany({
        where: {
          isActive: true,
          isSystemComponent: false,
          merchantId: effectiveMerchantId,
        },
        orderBy: [
          { type: 'asc' },
          { tier: 'asc' },
          { displayOrder: 'asc' },
        ],
        select: {
          id: true,
          code: true,
          name: true,
          nameJa: true,
          nameEn: true,
          description: true,
          type: true,
          icon: true,
          tier: true,
          tierLabel: true,
          isBaseComponent: true,
          basePrice: true,
          highlights: true,
          isSystemComponent: true,
        },
      });
    }

    const components = [...platformComponents, ...merchantComponents];

    // 获取升级路径（按优先级：MERCHANT > PLATFORM(themeId) > PLATFORM(null)）
    const upgradePaths = await getUpgradePaths(effectiveMerchantId, themeId);

    // 按类型分组
    const groupedComponents = components.reduce((acc, component) => {
      const type = component.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(component);
      return acc;
    }, {} as Record<string, typeof components>);

    // 定义类型顺序和显示名称
    const typeOrder = [
      { type: 'KIMONO', label: '和服类型', icon: '👘' },
      { type: 'STYLING', label: '造型服务', icon: '💇' },
      { type: 'ACCESSORY', label: '配饰', icon: '🎀' },
      { type: 'EXPERIENCE', label: '增值体验', icon: '📸' },
    ];

    const categories = typeOrder
      .filter(t => groupedComponents[t.type]?.length > 0)
      .map(t => ({
        type: t.type,
        label: t.label,
        icon: t.icon,
        components: groupedComponents[t.type] || [],
      }));

    return NextResponse.json({
      components,
      categories,
      upgradePaths,
    });
  } catch (error) {
    console.error('Failed to fetch service components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service components' },
      { status: 500 }
    );
  }
}

// 获取组件升级路径
// 优先级：MERCHANT > PLATFORM(themeId) > PLATFORM(null)
async function getUpgradePaths(merchantId: string | null, themeId: string | null) {
  // 构建查询条件，按优先级获取所有可能的升级配置
  const whereConditions = [];

  // 1. 商户自定义（最高优先级）
  if (merchantId) {
    whereConditions.push({
      scope: 'MERCHANT' as const,
      scopeId: merchantId,
      isActive: true,
    });
  }

  // 2. 平台预设（按主题）
  if (themeId) {
    whereConditions.push({
      scope: 'PLATFORM' as const,
      scopeId: themeId,
      isActive: true,
    });
  }

  // 3. 平台预设（全局）
  whereConditions.push({
    scope: 'PLATFORM' as const,
    scopeId: null,
    isActive: true,
  });

  const allUpgrades = await prisma.componentUpgrade.findMany({
    where: {
      OR: whereConditions,
    },
    orderBy: [
      { displayOrder: 'asc' },
    ],
    select: {
      id: true,
      fromComponentId: true,
      toComponentId: true,
      priceDiff: true,
      scope: true,
      scopeId: true,
      label: true,
      description: true,
      isRecommended: true,
      displayOrder: true,
      toComponent: {
        select: {
          id: true,
          name: true,
          icon: true,
          tier: true,
          tierLabel: true,
        },
      },
    },
  });

  // 按 fromComponentId 分组，并按优先级去重
  const upgradeMap: Record<string, typeof allUpgrades> = {};

  for (const upgrade of allUpgrades) {
    const key = upgrade.fromComponentId;
    if (!upgradeMap[key]) {
      upgradeMap[key] = [];
    }

    // 检查是否已有相同的 toComponentId（需要按优先级去重）
    const existingIndex = upgradeMap[key].findIndex(
      u => u.toComponentId === upgrade.toComponentId
    );

    if (existingIndex === -1) {
      // 没有相同目标的升级，直接添加
      upgradeMap[key].push(upgrade);
    } else {
      // 已有相同目标，按优先级决定是否替换
      const existing = upgradeMap[key][existingIndex];
      const currentPriority = getUpgradePriority(upgrade.scope, upgrade.scopeId, merchantId, themeId);
      const existingPriority = getUpgradePriority(existing.scope, existing.scopeId, merchantId, themeId);

      if (currentPriority > existingPriority) {
        upgradeMap[key][existingIndex] = upgrade;
      }
    }
  }

  return upgradeMap;
}

// 计算升级配置的优先级
function getUpgradePriority(
  scope: string,
  scopeId: string | null,
  merchantId: string | null,
  themeId: string | null
): number {
  if (scope === 'MERCHANT' && scopeId === merchantId) {
    return 3; // 商户自定义，最高优先级
  }
  if (scope === 'PLATFORM' && scopeId === themeId && themeId !== null) {
    return 2; // 平台按主题预设
  }
  if (scope === 'PLATFORM' && scopeId === null) {
    return 1; // 平台全局预设
  }
  return 0;
}
