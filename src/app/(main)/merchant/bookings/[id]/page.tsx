import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Package,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui";

interface BookingDetailPageProps {
  params: {
    id: string;
  };
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;

  // 验证登录
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 获取商家信息
  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!merchant || merchant.status !== "APPROVED") {
    redirect("/merchant/dashboard");
  }

  // 获取订单详情
  const booking = await prisma.booking.findUnique({
    where: {
      id,
      merchantId: merchant.id, // 确保只能查看自己的订单
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      items: {
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string; bgColor: string }> = {
      PENDING: { variant: "warning", label: "待确认", bgColor: "bg-amber-50" },
      CONFIRMED: { variant: "info", label: "已确认", bgColor: "bg-blue-50" },
      COMPLETED: { variant: "success", label: "已完成", bgColor: "bg-green-50" },
      CANCELLED: { variant: "secondary", label: "已取消", bgColor: "bg-gray-50" },
    };
    return statusMap[status] || { variant: "secondary", label: status, bgColor: "bg-gray-50" };
  };

  const getPaymentBadge = (status: string) => {
    const paymentMap: Record<string, { variant: any; label: string }> = {
      PENDING: { variant: "warning", label: "待支付" },
      PAID: { variant: "success", label: "已支付" },
      REFUNDED: { variant: "secondary", label: "已退款" },
      FAILED: { variant: "error", label: "支付失败" },
    };
    return paymentMap[status] || { variant: "secondary", label: status };
  };

  const statusBadge = getStatusBadge(booking.status);
  const paymentBadge = getPaymentBadge(booking.paymentStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-5xl">
        {/* 返回按钮 */}
        <Link
          href="/merchant/bookings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回订单列表
        </Link>

        {/* 订单标题和状态 */}
        <div className={`${statusBadge.bgColor} rounded-2xl border border-gray-200 p-6 mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                订单 #{booking.id.slice(-8)}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadge.variant} size="md">
                  {statusBadge.label}
                </Badge>
                <Badge variant={paymentBadge.variant} size="md">
                  {paymentBadge.label}
                </Badge>
                <span className="text-sm text-gray-600">
                  创建于 {new Date(booking.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">订单总额</p>
              <p className="text-3xl font-bold text-gray-900">
                ¥{(booking.totalAmount / 100).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：订单详情 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 客户信息 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                客户信息
              </h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sakura-100 rounded-full flex items-center justify-center overflow-hidden">
                    {booking.user?.avatar ? (
                      <img
                        src={booking.user.avatar}
                        alt={booking.user.name || ""}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-sakura-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {booking.guestName || booking.user?.name || "未知客户"}
                    </p>
                    {booking.user && (
                      <p className="text-sm text-gray-600">注册用户</p>
                    )}
                  </div>
                </div>

                {(booking.guestEmail || booking.user?.email) && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{booking.guestEmail || booking.user?.email}</span>
                  </div>
                )}

                {booking.guestPhone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{booking.guestPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 到店信息 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                到店信息
              </h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">到店日期</p>
                    <p className="font-semibold text-gray-900">
                      {booking.visitDate
                        ? new Date(booking.visitDate).toLocaleDateString("zh-CN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "未设置"}
                    </p>
                  </div>
                </div>

                {booking.visitTime && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                    <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">到店时间</p>
                      <p className="font-semibold text-gray-900">{booking.visitTime}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 订单项 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                订单项目
              </h2>

              <div className="space-y-4">
                {booking.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    {item.plan?.imageUrl && (
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={item.plan.imageUrl}
                          alt={item.plan.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.plan?.name || "未知套餐"}
                      </h3>
                      {item.plan?.nameEn && (
                        <p className="text-sm text-gray-600 mb-2">
                          {item.plan.nameEn}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>数量: {item.quantity}</span>
                        <span>单价: ¥{(item.unitPrice / 100).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ¥{(item.totalPrice / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 特殊要求 */}
            {booking.specialRequests && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  特殊要求
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {booking.specialRequests}
                </p>
              </div>
            )}
          </div>

          {/* 右侧：金额明细和操作 */}
          <div className="space-y-6">
            {/* 金额明细 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">金额明细</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>订单总额</span>
                  <span className="font-semibold">
                    ¥{(booking.totalAmount / 100).toLocaleString()}
                  </span>
                </div>

                {booking.depositAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>押金</span>
                    <span className="font-semibold">
                      ¥{(booking.depositAmount / 100).toLocaleString()}
                    </span>
                  </div>
                )}

                {booking.paidAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>已支付</span>
                    <span className="font-semibold text-green-600">
                      ¥{(booking.paidAmount / 100).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">应付金额</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ¥{((booking.totalAmount - booking.paidAmount) / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 订单操作 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">订单操作</h2>

              <div className="space-y-3">
                {booking.status === "PENDING" && (
                  <>
                    <button className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium">
                      确认订单
                    </button>
                    <button className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium">
                      取消订单
                    </button>
                  </>
                )}

                {booking.status === "CONFIRMED" && (
                  <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                    标记为已完成
                  </button>
                )}

                <Link
                  href={`/merchant/bookings/${booking.id}/edit`}
                  className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-center"
                >
                  编辑订单
                </Link>

                <button className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  打印订单
                </button>
              </div>
            </div>

            {/* 订单时间线 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">订单历史</h2>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">订单创建</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>

                {booking.updatedAt.getTime() !== booking.createdAt.getTime() && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">最近更新</p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.updatedAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
