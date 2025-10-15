import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    // 验证用户是否登录
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 查找预约
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        userId: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // 验证是否是预约所有者
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 检查预约状态是否可以取消
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel completed booking" },
        { status: 400 }
      );
    }

    // 取消预约
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
