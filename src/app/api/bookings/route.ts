import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";

interface BookingItem {
  storeId: string;
  type: string;
  planId?: string;
  campaignPlanId?: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  addOns?: string[];
  notes?: string;
  visitDate?: string; // Per-item visit date (YYYY-MM-DD)
  visitTime?: string; // Per-item visit time (HH:MM)
}

interface BookingRequest {
  // Guest contact info
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;

  // Booking details (for single-store bookings)
  visitDate?: string;
  visitTime?: string;

  // Items
  items: BookingItem[];

  // Pre-calculated totals (optional)
  totalAmount?: number;
  depositAmount?: number;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const data: BookingRequest = await request.json();

    console.log("Booking request data:", JSON.stringify(data, null, 2));

    // Validate items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.log("Invalid items:", data.items);
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Validate contact information (logged-in user OR guest with name AND (email OR phone))
    const hasGuestContact =
      data.guestName && (data.guestEmail || data.guestPhone);
    if (!session?.user?.id && !hasGuestContact) {
      console.log("Missing contact information.");
      return NextResponse.json(
        { error: "请提供姓名和联系方式（邮箱或电话）" },
        { status: 400 }
      );
    }

    // Validate all items have storeId
    const itemsWithoutStore = data.items.filter((item) => !item.storeId);
    if (itemsWithoutStore.length > 0) {
      return NextResponse.json(
        { error: "All items must have a storeId" },
        { status: 400 }
      );
    }

    // Validate all items have date/time (either per-item or from booking level)
    const itemsWithoutDateTime = data.items.filter((item) => {
      const itemDate = item.visitDate || data.visitDate;
      const itemTime = item.visitTime || data.visitTime;
      return !itemDate || !itemTime;
    });
    if (itemsWithoutDateTime.length > 0) {
      return NextResponse.json(
        { error: "所有套餐必须选择到店日期和时间" },
        { status: 400 }
      );
    }

    // Validate all planIds exist
    const planIds = data.items
      .filter((item) => item.planId)
      .map((item) => item.planId!);

    if (planIds.length > 0) {
      const existingPlans = await prisma.rentalPlan.findMany({
        where: { id: { in: planIds } },
        select: { id: true },
      });

      const existingPlanIds = existingPlans.map((p) => p.id);
      const invalidPlanIds = planIds.filter((id) => !existingPlanIds.includes(id));

      if (invalidPlanIds.length > 0) {
        console.log("Invalid plan IDs:", invalidPlanIds);
        return NextResponse.json(
          {
            error: "部分套餐已不存在，请刷新页面重新选择",
            invalidPlanIds,
          },
          { status: 400 }
        );
      }
    }

    // Group items by storeId
    const itemsByStore = new Map<string, BookingItem[]>();
    for (const item of data.items) {
      const existing = itemsByStore.get(item.storeId);
      if (existing) {
        existing.push(item);
      } else {
        itemsByStore.set(item.storeId, [item]);
      }
    }

    // Create bookings for each store
    const createdBookings: { id: string; storeId: string; storeName?: string }[] = [];

    for (const [storeId, storeItems] of itemsByStore) {
      // Calculate store booking totals
      const storeTotal = storeItems.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      );

      // Use the first item's date/time as the booking-level date/time
      // (items within same store typically have same date/time)
      const firstItem = storeItems[0];
      const bookingDate = firstItem.visitDate || data.visitDate!;
      const bookingTime = firstItem.visitTime || data.visitTime!;

      // Create booking for this store
      const booking = await prisma.booking.create({
        data: {
          userId: session?.user?.id || null,
          guestName: data.guestName || session?.user?.name || null,
          guestEmail: data.guestEmail || session?.user?.email || null,
          guestPhone: data.guestPhone || null,
          visitDate: new Date(bookingDate),
          visitTime: bookingTime,
          specialRequests: data.specialRequests || null,
          totalAmount: storeTotal,
          depositAmount: 0, // MVP: no deposit calculation yet
          paidAmount: 0,
          paymentStatus: "PENDING",
          status: "PENDING",
          items: {
            create: storeItems.map((item) => ({
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

      const storeName = booking.items[0]?.store?.name;
      createdBookings.push({
        id: booking.id,
        storeId,
        storeName,
      });

      // Send confirmation email for each booking (non-blocking)
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
          // Email failure doesn't affect booking creation
        }
      }
    }

    // Return response based on number of bookings created
    if (createdBookings.length === 1) {
      // Single store booking - return simple response
      return NextResponse.json({
        id: createdBookings[0].id,
        status: "success",
      });
    } else {
      // Multi-store booking - return all booking IDs
      return NextResponse.json({
        ids: createdBookings.map((b) => b.id),
        bookings: createdBookings,
        status: "success",
        message: `已成功创建 ${createdBookings.length} 个预约（按店铺拆分）`,
      });
    }
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create booking",
      },
      { status: 500 }
    );
  }
}
