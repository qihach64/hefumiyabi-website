import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { sendPaymentSuccessEmail } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const paymentService = {
  /**
   * 创建 Stripe Checkout Session
   * - 查询 Booking + BookingItems + Plan 名称
   * - 构建 line_items（价格单位：分）
   * - 返回 checkout session URL
   */
  async createCheckoutSession(
    prisma: PrismaClient,
    bookingId: string,
    customerEmail?: string,
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: {
          include: {
            plan: { select: { name: true, imageUrl: true } },
            store: { select: { name: true } },
          },
        },
        user: { select: { email: true } },
      },
    });

    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '预约不存在' });
    }

    if (booking.paymentStatus === 'PAID') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '该预约已支付' });
    }

    // 构建 line_items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = booking.items.map((item) => ({
      price_data: {
        currency: 'jpy',
        product_data: {
          name: item.plan?.name || '和服租赁',
          ...(item.plan?.imageUrl ? { images: [item.plan.imageUrl] } : {}),
          description: item.store?.name ? `店铺: ${item.store.name}` : undefined,
        },
        unit_amount: item.unitPrice, // 日元无小数，直接用分（=日元）
      },
      quantity: item.quantity,
    }));

    const email = customerEmail || booking.guestEmail || booking.user?.email || undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      ...(email ? { customer_email: email } : {}),
      success_url: `${APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/booking/pay?bookingId=${bookingId}`,
      metadata: { bookingId },
    });

    // 保存 stripeSessionId
    await prisma.booking.update({
      where: { id: bookingId },
      data: { stripeSessionId: session.id },
    });

    return { url: session.url };
  },

  /**
   * 处理 Stripe Webhook 事件
   */
  async handleWebhookEvent(prisma: PrismaClient, event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        const updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'PAID',
            paidAmount: session.amount_total || 0,
            paidAt: new Date(),
            paymentMethod: 'stripe',
          },
          select: {
            id: true,
            totalAmount: true,
            visitDate: true,
            visitTime: true,
            guestName: true,
            guestEmail: true,
            user: { select: { name: true, email: true } },
          },
        });

        // 发送支付成功邮件（非阻塞）
        const recipientEmail = updatedBooking.guestEmail || updatedBooking.user?.email;
        const recipientName = updatedBooking.guestName || updatedBooking.user?.name;
        if (recipientEmail && recipientName) {
          sendPaymentSuccessEmail(recipientEmail, recipientName, updatedBooking).catch((err) => {
            console.error('支付成功邮件发送失败:', err);
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;

        if (!paymentIntentId) break;

        // 通过 payment_intent 找到对应的 checkout session
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1,
        });
        const relatedSession = sessions.data[0];
        const bookingId = relatedSession?.metadata?.bookingId;
        if (!bookingId) break;

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'REFUNDED',
            refundedAt: new Date(),
            refundAmount: charge.amount_refunded,
          },
        });
        break;
      }
    }
  },

  /**
   * 创建退款
   */
  async createRefund(prisma: PrismaClient, bookingId: string, amount?: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { stripeSessionId: true, paymentStatus: true, paidAmount: true },
    });

    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '预约不存在' });
    }

    if (booking.paymentStatus !== 'PAID' || !booking.stripeSessionId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '该预约无法退款（未支付或非在线支付）' });
    }

    // 获取 payment_intent
    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    if (!paymentIntentId) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '无法获取支付信息' });
    }

    // 创建退款
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount } : {}), // 不传 amount = 全额退款
    });

    // 更新数据库
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: refund.amount,
      },
    });

    return { refundId: refund.id, amount: refund.amount };
  },

  /**
   * 查询支付状态（方案 A：直接查 Stripe API）
   * 用于成功页 Server Component
   */
  async getSessionStatus(prisma: PrismaClient, sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      return { status: 'unknown' as const };
    }

    // 如果 Stripe 已付款但 DB 还是 PENDING → 更新 DB（webhook 兜底）
    if (session.payment_status === 'paid') {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { paymentStatus: true },
      });

      if (booking && booking.paymentStatus === 'PENDING') {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'PAID',
            paidAmount: session.amount_total || 0,
            paidAt: new Date(),
            paymentMethod: 'stripe',
          },
        });
      }
    }

    return {
      status: session.payment_status as 'paid' | 'unpaid' | 'no_payment_required',
      bookingId,
    };
  },
};
