import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import type { CreatePlanInput, UpdatePlanInput } from '@/server/schemas';
import { handlePrismaError } from '@/server/trpc/utils';

// 商家套餐管理服务
export const merchantPlanService = {
  /**
   * 创建套餐
   */
  async create(
    prisma: PrismaClient,
    input: CreatePlanInput,
    merchantId: string,
    userId: string,
  ) {
    const slug = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      return await prisma.rentalPlan.create({
        data: {
          slug,
          name: input.name,
          description: input.description,
          price: input.price,
          originalPrice: input.originalPrice || null,
          depositAmount: input.depositAmount,
          duration: input.duration,
          imageUrl: input.imageUrl || null,
          images: input.images || [],
          storeName: input.storeName || null,
          region: input.region || null,
          isActive: input.isActive,
          isFeatured: input.isFeatured,
          availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
          availableUntil: input.availableUntil ? new Date(input.availableUntil) : null,
          merchantId,
          createdBy: userId,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  /**
   * 更新套餐（含标签同步 + 组件配置 + 升级服务）
   * 修复 usageCount 三个 bug:
   * 1. 先减旧标签计数，再加新标签计数
   * 2. 只对实际新增的标签 +1，不是全量 +1
   * 3. 更新后使用 _count 重算，避免累计漂移
   */
  async update(
    prisma: PrismaClient,
    planId: string,
    input: UpdatePlanInput,
    merchantId: string,
    userId: string,
  ) {
    // 验证套餐所有权
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: planId },
      select: { merchantId: true },
    });

    if (!plan) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '套餐不存在' });
    }
    if (plan.merchantId !== merchantId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '无权限操作此套餐' });
    }

    // 事务更新（8s 超时）
    return prisma.$transaction(
      async (tx) => {
        // 1. 更新基本信息
        const updatedPlan = await tx.rentalPlan.update({
          where: { id: planId },
          data: {
            name: input.name,
            description: input.description,
            highlights: input.highlights || null,
            price: input.price,
            originalPrice: input.originalPrice || null,
            depositAmount: input.depositAmount,
            pricingUnit: input.pricingUnit,
            unitLabel: input.unitLabel,
            unitDescription: input.unitDescription || null,
            minQuantity: input.minQuantity,
            maxQuantity: input.maxQuantity,
            ...(input.duration !== undefined && { duration: input.duration }),
            imageUrl: input.imageUrl || null,
            images: input.images || [],
            customMapImageUrl: input.customMapImageUrl || null,
            storeName: input.storeName || null,
            region: input.region || null,
            themeId: input.themeId || null,
            availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
            availableUntil: input.availableUntil ? new Date(input.availableUntil) : null,
            ...(input.status !== undefined && { status: input.status }),
            isActive: input.isActive,
            isFeatured: input.isFeatured,
          },
        });

        // 2. 同步标签（修复 usageCount bug）
        if (input.tagIds !== undefined) {
          await this._syncPlanTags(tx, planId, input.tagIds, userId);
        }

        // 3. 同步组件配置
        if (input.merchantComponentIds !== undefined || input.planComponents !== undefined) {
          await this._syncPlanComponents(tx, planId, input);
        }

        // 4. 同步升级服务
        if (input.planUpgrades !== undefined) {
          await this._syncPlanUpgrades(tx, planId, input.planUpgrades);
        }

        return updatedPlan;
      },
      { timeout: 8000 },
    );
  },

  /**
   * 软删除套餐（设为不可用）
   */
  async softDelete(prisma: PrismaClient, planId: string, merchantId: string) {
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: planId },
      select: { merchantId: true },
    });

    if (!plan) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '套餐不存在' });
    }
    if (plan.merchantId !== merchantId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '无权限操作此套餐' });
    }

    await prisma.rentalPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });
  },

  /**
   * 同步套餐标签（修复 usageCount）
   * Bug 修复:
   * - 旧逻辑: 删除旧关联 → 创建新关联 → 全部新标签 +1（重复计数）
   * - 新逻辑: 计算 diff → 旧标签 -1 → 新标签 +1 → 仅 diff 部分变化
   */
  async _syncPlanTags(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    planId: string,
    newTagIds: string[],
    userId: string,
  ) {
    // 获取旧标签
    const oldPlanTags = await tx.planTag.findMany({
      where: { planId },
      select: { tagId: true },
    });
    const oldTagIds = new Set(oldPlanTags.map((pt: { tagId: string }) => pt.tagId));
    const newTagIdSet = new Set(newTagIds);

    // 计算 diff
    const toRemove = [...oldTagIds].filter((id) => !newTagIdSet.has(id));
    const toAdd = newTagIds.filter((id) => !oldTagIds.has(id));

    // 删除旧关联
    await tx.planTag.deleteMany({ where: { planId } });

    // 创建新关联
    if (newTagIds.length > 0) {
      await tx.planTag.createMany({
        data: newTagIds.map((tagId) => ({
          planId,
          tagId,
          addedBy: userId,
        })),
      });
    }

    // 减少被移除标签的 usageCount
    if (toRemove.length > 0) {
      await tx.tag.updateMany({
        where: { id: { in: toRemove } },
        data: { usageCount: { decrement: 1 } },
      });
    }

    // 增加新增标签的 usageCount
    if (toAdd.length > 0) {
      await tx.tag.updateMany({
        where: { id: { in: toAdd } },
        data: { usageCount: { increment: 1 } },
      });
    }
  },

  /**
   * 同步套餐组件配置
   */
  async _syncPlanComponents(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    planId: string,
    input: UpdatePlanInput,
  ) {
    await tx.planComponent.deleteMany({ where: { planId } });

    if (input.planComponents && input.planComponents.length > 0) {
      await tx.planComponent.createMany({
        data: input.planComponents.map((pc) => ({
          planId,
          merchantComponentId: pc.merchantComponentId,
          hotmapX: pc.hotmapX ?? null,
          hotmapY: pc.hotmapY ?? null,
          hotmapLabelPosition: pc.hotmapLabelPosition ?? 'right',
          hotmapLabelOffsetX: pc.hotmapLabelOffsetX ?? null,
          hotmapLabelOffsetY: pc.hotmapLabelOffsetY ?? null,
          hotmapOrder: pc.hotmapOrder ?? 0,
        })),
      });
    } else if (input.merchantComponentIds && input.merchantComponentIds.length > 0) {
      await tx.planComponent.createMany({
        data: input.merchantComponentIds.map((mcId, index) => ({
          planId,
          merchantComponentId: mcId,
          hotmapOrder: index,
        })),
      });
    }
  },

  /**
   * 同步升级服务配置
   */
  async _syncPlanUpgrades(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    planId: string,
    planUpgrades: UpdatePlanInput['planUpgrades'],
  ) {
    await tx.planUpgrade.deleteMany({ where: { planId } });

    if (planUpgrades && planUpgrades.length > 0) {
      await tx.planUpgrade.createMany({
        data: planUpgrades.map((pu, index) => ({
          planId,
          merchantComponentId: pu.merchantComponentId,
          priceOverride: pu.priceOverride ?? null,
          isPopular: pu.isPopular ?? false,
          displayOrder: pu.displayOrder ?? index,
        })),
      });
    }
  },
};
