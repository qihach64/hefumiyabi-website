import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tags/filter - Public endpoint for filter tags (no auth required)
export async function GET() {
  try {
    // Fetch only active categories that should show in filter
    const categories = await prisma.tagCategory.findMany({
      where: {
        isActive: true,
        showInFilter: true,
      },
      include: {
        tags: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { filterOrder: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Failed to fetch filter tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter tags' },
      { status: 500 }
    );
  }
}
