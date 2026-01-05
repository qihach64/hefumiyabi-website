import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/tags/[id] - Get single tag
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

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { plans: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Failed to fetch tag:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tags/[id] - Update tag
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
      icon,
      color,
      order,
      isActive,
    } = body;

    // Check if tag exists
    const existing = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // If changing code, check for duplicates within same category
    if (code && code !== existing.code) {
      const duplicate = await prisma.tag.findUnique({
        where: {
          categoryId_code: {
            categoryId: existing.categoryId,
            code,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Tag code already exists in this category' },
          { status: 409 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { plans: true },
        },
      },
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Failed to update tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tags/[id] - Delete tag
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

    // Check if tag is in use
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { plans: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    if (tag._count.plans > 0) {
      return NextResponse.json(
        { error: `Cannot delete tag used by ${tag._count.plans} plans. Remove from plans first or deactivate the tag.` },
        { status: 400 }
      );
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
