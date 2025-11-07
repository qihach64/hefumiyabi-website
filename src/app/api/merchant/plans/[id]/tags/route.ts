import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/merchant/plans/[id]/tags - Get all available tags and current plan tags
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'MERCHANT' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: planId } = await params;

    // Verify plan exists and belongs to merchant (unless admin)
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: planId },
      include: {
        planTags: {
          include: {
            tag: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // For merchants, verify ownership
    if (session.user.role === 'MERCHANT') {
      // TODO: Add merchantId check when merchant relationship is added to RentalPlan
      // For now, allow all merchants to edit (will be restricted in production)
    }

    // Get all active categories with their active tags
    const categories = await prisma.tagCategory.findMany({
      where: { isActive: true },
      include: {
        tags: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Get current plan tag IDs
    const selectedTagIds = plan.planTags.map(pt => pt.tag.id);

    return NextResponse.json({
      categories,
      selectedTagIds,
      planTags: plan.planTags,
    });
  } catch (error) {
    console.error('Failed to fetch plan tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan tags' },
      { status: 500 }
    );
  }
}

// PUT /api/merchant/plans/[id]/tags - Update plan tags
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'MERCHANT' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: planId } = await params;
    const body = await request.json();
    const { tagIds } = body;

    if (!Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: 'tagIds must be an array' },
        { status: 400 }
      );
    }

    // Verify plan exists
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // For merchants, verify ownership
    if (session.user.role === 'MERCHANT') {
      // TODO: Add merchantId check when merchant relationship is added to RentalPlan
    }

    // Verify all tag IDs are valid and active
    if (tagIds.length > 0) {
      const validTags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          isActive: true,
        },
      });

      if (validTags.length !== tagIds.length) {
        return NextResponse.json(
          { error: 'Some tag IDs are invalid or inactive' },
          { status: 400 }
        );
      }
    }

    // Update plan tags using transaction
    await prisma.$transaction(async (tx) => {
      // Get current tags to calculate usage count changes
      const currentTags = await tx.planTag.findMany({
        where: { planId },
        select: { tagId: true },
      });
      const currentTagIds = currentTags.map(pt => pt.tagId);

      // Remove all existing plan tags
      await tx.planTag.deleteMany({
        where: { planId },
      });

      // Decrement usage count for removed tags
      const removedTagIds = currentTagIds.filter(id => !tagIds.includes(id));
      if (removedTagIds.length > 0) {
        await tx.tag.updateMany({
          where: { id: { in: removedTagIds } },
          data: {
            usageCount: {
              decrement: 1,
            },
          },
        });
      }

      // Create new plan tags
      if (tagIds.length > 0) {
        await tx.planTag.createMany({
          data: tagIds.map(tagId => ({
            planId,
            tagId,
            addedBy: session.user.id,
          })),
        });

        // Increment usage count for new tags
        const addedTagIds = tagIds.filter(id => !currentTagIds.includes(id));
        if (addedTagIds.length > 0) {
          await tx.tag.updateMany({
            where: { id: { in: addedTagIds } },
            data: {
              usageCount: {
                increment: 1,
              },
            },
          });
        }
      }
    });

    // Fetch updated plan with tags
    const updatedPlan = await prisma.rentalPlan.findUnique({
      where: { id: planId },
      include: {
        planTags: {
          include: {
            tag: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      planTags: updatedPlan?.planTags || [],
    });
  } catch (error) {
    console.error('Failed to update plan tags:', error);
    return NextResponse.json(
      { error: 'Failed to update plan tags' },
      { status: 500 }
    );
  }
}
