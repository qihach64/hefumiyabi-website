import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const data = await request.json();

    console.log("Booking request data:", JSON.stringify(data, null, 2));

    // 验证必填字段
    if (!data.visitDate || !data.visitTime) {
      console.log("Missing visitDate or visitTime");
      return NextResponse.json(
        { error: "Missing required fields: visitDate, visitTime" },
        { status: 400 }
      );
    }

    // 验证联系信息（已登录用户或游客）
    if (!session?.user?.id && (!data.guestName || !data.guestEmail || !data.guestPhone)) {
      console.log("Missing contact information. Session:", session, "Data:", {
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone
      });
      return NextResponse.json(
        { error: "Missing contact information" },
        { status: 400 }
      );
    }

    // 验证 items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.log("Invalid items:", data.items);
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // 计算总金额
    const totalAmount = data.totalAmount || data.items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);

    // 验证每个 item 都有 storeId
    const itemsWithoutStore = data.items.filter((item: any) => !item.storeId);
    if (itemsWithoutStore.length > 0) {
      return NextResponse.json(
        { error: "All items must have a storeId" },
        { status: 400 }
      );
    }

    // 创建预约
    const booking = await prisma.booking.create({
      data: {
        userId: session?.user?.id || null,
        guestName: data.guestName || session?.user?.name || null,
        guestEmail: data.guestEmail || session?.user?.email || null,
        guestPhone: data.guestPhone || null,
        visitDate: new Date(data.visitDate),
        visitTime: data.visitTime,
        specialRequests: data.specialRequests || null,
        totalAmount: totalAmount,
        depositAmount: 0, // MVP: 暂不计算定金
        paidAmount: 0,
        paymentStatus: "PENDING",
        status: "PENDING",
        items: {
          create: data.items.map((item: any) => ({
            storeId: item.storeId,
            type: item.type,
            planId: item.planId || null,
            campaignPlanId: item.campaignPlanId || null,
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
            plan: true,
            store: true,
          },
        },
        user: true,
      },
    });

    // 发送确认邮件（不阻断预约流程）
    const recipientEmail = booking.guestEmail || booking.user?.email;
    const recipientName = booking.guestName || booking.user?.name;

    if (recipientEmail && recipientName) {
      try {
        await sendBookingConfirmationEmail(
          recipientEmail,
          recipientName,
          booking
        );
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // 邮件发送失败不影响预约创建
      }
    }

    return NextResponse.json({
      id: booking.id,
      status: "success",
      booking: booking
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create booking" },
      { status: 500 }
    );
  }
}
