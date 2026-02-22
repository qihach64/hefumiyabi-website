import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 通过 viewToken 查询预约状态（无需登录）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "缺少查询凭证" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { viewToken: token },
      include: {
        items: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "预约未找到" },
        { status: 404 }
      );
    }

    // 不返回敏感字段（userId、viewToken 等）
    const { userId, viewToken, ...safeBooking } = booking;
    return NextResponse.json(safeBooking);
  } catch (error) {
    console.error("Error fetching booking by token:", error);
    return NextResponse.json(
      { error: "查询失败" },
      { status: 500 }
    );
  }
}
