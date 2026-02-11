import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/favorites - 获取用户收藏列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
        planId: { not: null },
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            imageUrl: true,
            images: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        id: f.id,
        planId: f.planId,
        imageUrl: f.imageUrl,
        createdAt: f.createdAt,
        plan: f.plan,
      })),
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - 添加收藏 (upsert: 1 次查询搞定)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, imageUrl } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    // upsert: 已存在则返回，不存在则创建 (利用 @@unique([userId, planId, imageUrl]))
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_planId_imageUrl: {
          userId: session.user.id,
          planId,
          imageUrl: imageUrl || null,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        planId,
        imageUrl,
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - 删除收藏 (deleteMany: 1 次查询搞定)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get('planId');
    const imageUrl = searchParams.get('imageUrl');

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    const { count } = await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        planId,
        imageUrl: imageUrl || undefined,
      },
    });

    if (count === 0) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
