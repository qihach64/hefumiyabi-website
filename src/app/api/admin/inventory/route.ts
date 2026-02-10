import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 获取所有店铺
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // 为每个店铺计算库存
    const inventory = await Promise.all(
      stores.map(async (store) => {
        // 统计该店铺的和服总数
        const kimonoStores = await prisma.kimonoStore.findMany({
          where: { storeId: store.id },
        });

        const totalKimonos = kimonoStores.reduce(
          (sum, ks) => sum + ks.quantity,
          0
        );

        // 统计今天及未来的有效预约中的和服数量
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeBookings = await prisma.booking.findMany({
          where: {
            items: {
              some: {
                storeId: store.id,
              },
            },
            visitDate: {
              gte: today,
            },
            status: {
              in: ["PENDING", "CONFIRMED", "IN_PROGRESS"],
            },
          },
          include: {
            items: {
              where: {
                storeId: store.id,
              },
            },
          },
        });

        // 计算已预订的和服数量（每个预约项的数量）
        const bookedKimonos = activeBookings.reduce((sum, booking) => {
          return sum + booking.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);

        const availableKimonos = Math.max(0, totalKimonos - bookedKimonos);
        const utilizationRate = totalKimonos > 0
          ? Math.round((bookedKimonos / totalKimonos) * 100)
          : 0;

        return {
          storeId: store.id,
          storeName: store.name,
          totalKimonos,
          availableKimonos,
          bookedKimonos,
          utilizationRate,
        };
      })
    );

    return NextResponse.json({ inventory });
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
