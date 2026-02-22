import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { paymentService } from '@/server/services/payment.service';
import BookingSuccessClient from './BookingSuccessClient';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ session_id?: string; bookingId?: string; id?: string }>;
}

async function BookingSuccessContent({ searchParams }: Props) {
  const params = await searchParams;
  const { session_id, bookingId, id } = params;

  // 兼容旧参数名 id
  const resolvedBookingId = bookingId || id;

  let paymentMethod: 'online' | 'store' = 'store';
  let finalBookingId: string | null = resolvedBookingId || null;

  // 路径 1: 在线支付完成（有 session_id）
  if (session_id) {
    try {
      const result = await paymentService.getSessionStatus(prisma, session_id);
      if (result.bookingId) {
        finalBookingId = result.bookingId;
      }
      if (result.status === 'paid') {
        paymentMethod = 'online';
      }
    } catch {
      // Stripe 查询失败，继续用 bookingId
    }
  }

  if (!finalBookingId) {
    redirect('/');
  }

  // 查询预约详情
  const booking = await prisma.booking.findUnique({
    where: { id: finalBookingId },
    include: {
      items: {
        include: {
          plan: { select: { name: true, imageUrl: true } },
          store: { select: { name: true, city: true, address: true } },
        },
      },
      user: { select: { email: true } },
    },
  });

  if (!booking) {
    redirect('/');
  }

  // 序列化给客户端
  const bookingData = {
    id: booking.id,
    userId: booking.userId,
    totalAmount: booking.totalAmount,
    paidAmount: booking.paidAmount,
    paymentStatus: booking.paymentStatus,
    visitDate: booking.visitDate.toISOString(),
    visitTime: booking.visitTime,
    guestEmail: booking.guestEmail,
    userEmail: booking.user?.email || null,
    viewToken: booking.viewToken ?? null,
    items: booking.items.map((item) => ({
      id: item.id,
      planName: item.plan?.name || '和服租赁',
      planImage: item.plan?.imageUrl || null,
      storeName: item.store?.name || '未知店铺',
      storeCity: item.store?.city || '',
      storeAddress: item.store?.address || '',
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    })),
  };

  return <BookingSuccessClient booking={bookingData} paymentMethod={paymentMethod} />;
}

export default function BookingSuccessPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">加载中...</div>
        </div>
      }
    >
      <BookingSuccessContent {...props} />
    </Suspense>
  );
}
