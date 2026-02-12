import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import type { CreateBookingInput } from '@/server/schemas';

// 预约服务
export const bookingService = {
  /**
   * 创建预约（按店铺拆分，事务保护）
   * - 验证联系信息（登录用户 OR 游客需提供 name + email/phone）
   * - 验证 planId 存在性 + 服务端价格校验
   * - 按 storeId 分组，每组创建一个 Booking
   * - 8s 事务超时
   */
  async create(
    prisma: PrismaClient,
    input: CreateBookingInput,
    userId: string | null,
    userName: string | null,
    userEmail: string | null,
  ) {
    // 验证联系信息
    const hasGuestContact = input.guestName && (input.guestEmail || input.guestPhone);
    if (!userId && !hasGuestContact) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '请提供姓名和联系方式（邮箱或电话）' });
    }

    // 验证所有 item 都有日期时间
    const itemsMissingDateTime = input.items.filter((item) => {
      const date = item.visitDate || input.visitDate;
      const time = item.visitTime || input.visitTime;
      return !date || !time;
    });
    if (itemsMissingDateTime.length > 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '所有套餐必须选择到店日期和时间' });
    }

    // 服务端价格校验：验证 planId 存在性 + 价格一致性
    const planIds = input.items.filter((i) => i.planId).map((i) => i.planId!);
    if (planIds.length > 0) {
      const plans = await prisma.rentalPlan.findMany({
        where: { id: { in: planIds } },
        select: { id: true, price: true, isActive: true },
      });

      const planMap = new Map(plans.map((p) => [p.id, p]));

      for (const item of input.items) {
        if (!item.planId) continue;
        const plan = planMap.get(item.planId);
        if (!plan) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '部分套餐已不存在，请刷新页面重新选择' });
        }
        if (!plan.isActive) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '部分套餐已下架，请刷新页面重新选择' });
        }
        // 服务端价格校验（防止客户端篡改）
        if (item.unitPrice !== plan.price) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '套餐价格已变更，请刷新页面重新选择' });
        }
      }
    }

    // 按 storeId 分组
    const itemsByStore = new Map<string, CreateBookingInput['items']>();
    for (const item of input.items) {
      const existing = itemsByStore.get(item.storeId);
      if (existing) {
        existing.push(item);
      } else {
        itemsByStore.set(item.storeId, [item]);
      }
    }

    // 事务：8s 超时
    const createdBookings = await prisma.$transaction(
      async (tx) => {
        const results: { id: string; storeId: string; storeName?: string }[] = [];

        for (const [storeId, storeItems] of itemsByStore) {
          const storeTotal = storeItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
          const firstItem = storeItems[0];
          const bookingDate = firstItem.visitDate || input.visitDate!;
          const bookingTime = firstItem.visitTime || input.visitTime!;

          const booking = await tx.booking.create({
            data: {
              userId: userId || null,
              guestName: input.guestName || userName || null,
              guestEmail: input.guestEmail || userEmail || null,
              guestPhone: input.guestPhone || null,
              visitDate: new Date(bookingDate),
              visitTime: bookingTime,
              specialRequests: input.specialRequests || null,
              totalAmount: storeTotal,
              depositAmount: 0,
              paidAmount: 0,
              paymentStatus: 'PENDING',
              status: 'PENDING',
              items: {
                create: storeItems.map((item) => ({
                  storeId: item.storeId,
                  type: item.type,
                  planId: item.planId || null,
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                  addOns: item.addOns || [],
                  notes: item.notes || null,
                })),
              },
            },
            include: {
              items: {
                include: {
                  store: { select: { name: true } },
                },
              },
            },
          });

          results.push({
            id: booking.id,
            storeId,
            storeName: booking.items[0]?.store?.name,
          });
        }

        return results;
      },
      { timeout: 8000 },
    );

    return createdBookings;
  },

  /**
   * 管理后台：按日期范围查询预约
   */
  async listByDateRange(prisma: PrismaClient, start: string, end: string) {
    return prisma.booking.findMany({
      where: {
        visitDate: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      include: {
        items: {
          include: {
            store: { select: { name: true } },
            plan: { select: { name: true } },
          },
        },
      },
      orderBy: { visitDate: 'asc' },
    });
  },
};
