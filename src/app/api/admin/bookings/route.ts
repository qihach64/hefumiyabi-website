import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
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
