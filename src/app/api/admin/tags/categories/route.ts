import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/tags/categories - List all tag categories (Admin only)
export async function GET() {
  try {
    const session = await auth();
    // Admin only access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.tagCategory.findMany({
      where: {
        isActive: true, // Only return active categories
      },
      include: {
        tags: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { tags: true },
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

// POST /api/admin/tags/categories - Create new tag category
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      nameEn,
      description,
      icon,
      color,
      order,
      showInFilter,
      filterOrder,
    } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existing = await prisma.tagCategory.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Category code already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.tagCategory.create({
      data: {
        code,
        name,
        nameEn,
        description,
        icon,
        color,
        order: order ?? 0,
        showInFilter: showInFilter ?? true,
        filterOrder: filterOrder ?? 0,
      },
      include: {
        tags: true,
        _count: {
          select: { tags: true },
        },
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Failed to create tag category:', error);
    return NextResponse.json(
      { error: 'Failed to create tag category' },
      { status: 500 }
    );
  }
}
