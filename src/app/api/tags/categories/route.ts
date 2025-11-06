import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/tags/categories - Public endpoint for active tag categories
// This endpoint is accessible by any authenticated user (including merchants)
export async function GET() {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch only active categories and tags
    const categories = await prisma.tagCategory.findMany({
      where: {
        isActive: true,
      },
      include: {
        tags: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Failed to fetch tag categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag categories' },
      { status: 500 }
    );
  }
}
