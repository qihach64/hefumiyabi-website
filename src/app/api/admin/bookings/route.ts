import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 权限检查: 仅 ADMIN 或 STAFF 可查看预约列表
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end dates are required" },
        { status: 400 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        visitDate: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      include: {
        items: {
          include: {
            store: {
              select: {
                name: true,
              },
            },
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        visitDate: "asc",
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
