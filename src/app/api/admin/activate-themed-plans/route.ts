import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // 1. Find inactive plans with themes
    const inactivePlansWithTheme = await prisma.rentalPlan.findMany({
      where: {
        themeId: { not: null },
        isActive: false,
      },
      include: {
        theme: true,
      },
    });

    console.log(`Found ${inactivePlansWithTheme.length} inactive plans with themes`);

    if (inactivePlansWithTheme.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All themed plans are already active',
        count: 0,
      });
    }

    // 2. Activate them
    const updateResult = await prisma.rentalPlan.updateMany({
      where: {
        themeId: { not: null },
        isActive: false,
      },
      data: {
        isActive: true,
      },
    });

    // 3. Get final statistics
    const totalActive = await prisma.rentalPlan.count({
      where: { isActive: true },
    });

    const activeWithTheme = await prisma.rentalPlan.count({
      where: {
        isActive: true,
        themeId: { not: null },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Activated ${updateResult.count} plans`,
      activatedPlans: inactivePlansWithTheme.map(p => ({
        id: p.id,
        name: p.name,
        theme: p.theme?.name,
      })),
      stats: {
        totalActive,
        activeWithTheme,
        justActivated: updateResult.count,
      },
    });
  } catch (error) {
    console.error('Failed to activate plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
