import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取所有激活的服务组件模板（v10.1 简化版）
export async function GET() {
  try {
    // 获取所有活跃的平台组件模板
    const components = await prisma.serviceComponent.findMany({
      where: { isActive: true },
      orderBy: [
        { type: 'asc' },
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
        basePrice: true,
        defaultHighlights: true,
        defaultImages: true,
      },
    });

    // 按类型分组
    const groupedComponents = components.reduce((acc, component) => {
      const type = component.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(component);
      return acc;
    }, {} as Record<string, typeof components>);

    // 定义类型顺序和显示名称（v10.1 二分法：OUTFIT + ADDON）
    const typeOrder = [
      { type: 'OUTFIT', label: '着装项', icon: '👘' },
      { type: 'ADDON', label: '增值服务', icon: '✨' },
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
    });
  } catch (error) {
    console.error('Failed to fetch service components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service components' },
      { status: 500 }
    );
  }
}
