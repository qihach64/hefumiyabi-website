import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import PaymentClient from './PaymentClient';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function PaymentPage({ searchParams }: Props) {
  const { bookingId } = await searchParams;

  if (!bookingId) {
    redirect('/');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      items: {
        include: {
          plan: { select: { name: true, imageUrl: true } },
          store: { select: { name: true, city: true } },
        },
      },
    },
  });

  if (!booking) {
    redirect('/');
  }

  // 已支付则直接跳转成功页
  if (booking.paymentStatus === 'PAID') {
    redirect(`/booking/success?bookingId=${bookingId}`);
  }

  // 序列化给客户端
  const bookingData = {
    id: booking.id,
    totalAmount: booking.totalAmount,
    visitDate: booking.visitDate.toISOString(),
    visitTime: booking.visitTime,
    guestEmail: booking.guestEmail,
    items: booking.items.map((item) => ({
      id: item.id,
      planName: item.plan?.name || '和服租赁',
      planImage: item.plan?.imageUrl || null,
      storeName: item.store?.name || '未知店铺',
      storeCity: item.store?.city || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };

  return <PaymentClient booking={bookingData} />;
}
