import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 验证必填字段
    if (!data.storeId || !data.rentalDate || !data.returnDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 验证联系信息（已登录用户或游客）
    if (!data.userId && (!data.guestName || !data.guestEmail || !data.guestPhone)) {
      return NextResponse.json(
        { error: "Missing contact information" },
        { status: 400 }
      );
    }

    // 获取套餐信息以计算价格
    let totalAmount = 0;
    if (data.planId) {
      const plan = await prisma.rentalPlan.findUnique({
        where: { id: data.planId },
      });
      if (plan) {
        totalAmount = plan.price;
      }
    }

    // 创建预约
    const booking = await prisma.booking.create({
      data: {
        userId: data.userId || null,
        guestName: data.guestName || null,
        guestEmail: data.guestEmail || null,
        guestPhone: data.guestPhone || null,
        storeId: data.storeId,
        planId: data.planId || null,
        campaignPlanId: data.campaignPlanId || null,
        rentalDate: new Date(data.rentalDate),
        returnDate: new Date(data.returnDate),
        pickupTime: data.pickupTime || null,
        returnTime: data.returnTime || null,
        addOns: data.addOns || [],
        notes: data.notes || null,
        totalAmount: totalAmount,
        depositAmount: 0, // MVP: 暂不计算定金
        paidAmount: 0,
        paymentStatus: "PENDING",
        status: "PENDING",
      },
      include: {
        store: true,
        plan: true,
        user: true,
      },
    });

    // 发送确认邮件
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
        console.error("Error sending confirmation email:", emailError);
        // 不阻断预约流程，即使邮件发送失败
      }
    }

    return NextResponse.json({ id: booking.id, status: "success" });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
