import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/tags - List all tags (with optional category filter)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');

    const tags = await prisma.tag.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        _count: {
          select: { plans: true },
        },
      },
      orderBy: [
        { categoryId: 'asc' },
        { order: 'asc' },
      ],
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tags - Create new tag
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      categoryId,
      code,
      name,
      nameEn,
      icon,
      color,
      order,
    } = body;

    // Validate required fields
    if (!categoryId || !code || !name) {
      return NextResponse.json(
        { error: 'Category ID, code, and name are required' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.tagCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check for duplicate code within category
    const existing = await prisma.tag.findUnique({
      where: {
        categoryId_code: {
          categoryId,
          code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tag code already exists in this category' },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        categoryId,
        code,
        name,
        nameEn,
        icon,
        color,
        order: order ?? 0,
      },
      include: {
        _count: {
          select: { plans: true },
        },
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Failed to create tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
