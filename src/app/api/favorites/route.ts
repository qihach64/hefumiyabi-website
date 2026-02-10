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

// POST /api/favorites - 添加收藏
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

    // 检查是否已存在
    const existing = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        planId,
        imageUrl,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already favorited', favorite: existing },
        { status: 409 }
      );
    }

    // 创建收藏
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        planId,
        imageUrl,
      },
    });

    // 获取套餐信息
    const favoriteWithPlan = await prisma.favorite.findUnique({
      where: { id: favorite.id },
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
    return NextResponse.json({ favorite: favoriteWithPlan }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - 删除收藏
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

    // 查找收藏
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        planId,
        imageUrl,
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    // 删除收藏
    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
