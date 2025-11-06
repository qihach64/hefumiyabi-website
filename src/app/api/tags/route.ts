import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tags - Get all active tags for frontend filters (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showInFilterOnly = searchParams.get('showInFilter') === 'true';

    // Get categories with their tags
    const categories = await prisma.tagCategory.findMany({
      where: {
        isActive: true,
        ...(showInFilterOnly && { showInFilter: true }),
      },
      include: {
        tags: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            nameEn: true,
            icon: true,
            color: true,
            order: true,
            usageCount: true,
          },
        },
      },
      orderBy: showInFilterOnly
        ? { filterOrder: 'asc' }
        : { order: 'asc' },
    });

    // Filter out categories with no tags
    const categoriesWithTags = categories.filter(cat => cat.tags.length > 0);

    return NextResponse.json({ categories: categoriesWithTags });
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
