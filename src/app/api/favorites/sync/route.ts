import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

interface LocalFavorite {
  planId: string;
  planName: string;
  imageUrl: string;
  savedAt: string;
}

// POST /api/favorites/sync - 同步本地收藏到服务器
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { localFavorites } = body as { localFavorites: LocalFavorite[] };

    if (!Array.isArray(localFavorites)) {
      return NextResponse.json(
        { error: 'localFavorites must be an array' },
        { status: 400 }
      );
    }

    // 获取用户现有的收藏
    const existingFavorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
        planId: { not: null },
      },
      select: {
        planId: true,
        imageUrl: true,
      },
    });

    const existingSet = new Set(
      existingFavorites.map((f) => `${f.planId}:${f.imageUrl || ''}`)
    );

    // 过滤出需要新增的收藏
    const toAdd = localFavorites.filter(
      (f) => !existingSet.has(`${f.planId}:${f.imageUrl || ''}`)
    );

    // 批量创建新收藏
    if (toAdd.length > 0) {
      await prisma.favorite.createMany({
        data: toAdd.map((f) => ({
          userId: session.user.id,
          planId: f.planId,
          imageUrl: f.imageUrl,
        })),
        skipDuplicates: true,
      });
    }

    // 返回合并后的完整收藏列表
    const allFavorites = await prisma.favorite.findMany({
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
            category: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      synced: toAdd.length,
      favorites: allFavorites.map((f) => ({
        id: f.id,
        planId: f.planId,
        imageUrl: f.imageUrl,
        createdAt: f.createdAt,
        plan: f.plan,
      })),
    });
  } catch (error) {
    console.error('Error syncing favorites:', error);
    return NextResponse.json(
      { error: 'Failed to sync favorites' },
      { status: 500 }
    );
  }
}
