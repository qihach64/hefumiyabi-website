import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取所有激活的服务组件（按类型分组）
export async function GET() {
  try {
    const components = await prisma.serviceComponent.findMany({
      where: {
        isActive: true,
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
        nameEn: true,
        description: true,
        type: true,
        icon: true,
        isBaseComponent: true,
        basePrice: true,
        highlights: true,
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
    });
  } catch (error) {
    console.error('Failed to fetch service components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service components' },
      { status: 500 }
    );
  }
}
