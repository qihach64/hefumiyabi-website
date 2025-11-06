import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/tags/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const category = await prisma.tagCategory.findUnique({
      where: { id },
      include: {
        tags: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { tags: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Failed to fetch tag category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag category' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tags/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      code,
      name,
      nameEn,
      description,
      icon,
      color,
      order,
      isActive,
      showInFilter,
      filterOrder,
    } = body;

    // Check if category exists
    const existing = await prisma.tagCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // If changing code, check for duplicates
    if (code && code !== existing.code) {
      const duplicate = await prisma.tagCategory.findUnique({
        where: { code },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Category code already exists' },
          { status: 409 }
        );
      }
    }

    const category = await prisma.tagCategory.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
        ...(showInFilter !== undefined && { showInFilter }),
        ...(filterOrder !== undefined && { filterOrder }),
      },
      include: {
        tags: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { tags: true },
        },
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Failed to update tag category:', error);
    return NextResponse.json(
      { error: 'Failed to update tag category' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tags/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if category has tags
    const category = await prisma.tagCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tags: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (category._count.tags > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${category._count.tags} tags. Delete tags first.` },
        { status: 400 }
      );
    }

    await prisma.tagCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tag category:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag category' },
      { status: 500 }
    );
  }
}
