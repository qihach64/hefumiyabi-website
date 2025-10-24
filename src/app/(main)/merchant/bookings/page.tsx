import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, DollarSign, User, Filter } from "lucide-react";
import { Badge } from "@/components/ui";

interface BookingsPageProps {
  searchParams: {
    page?: string;
    status?: string;
  };
}

const ITEMS_PER_PAGE = 20;

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const statusFilter = params.status;

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

  // 构建查询条件
  const where = {
    merchantId: merchant.id,
    ...(statusFilter && { status: statusFilter }),
  };

  // 获取订单总数
  const totalBookings = await prisma.booking.count({ where });

  // 获取分页订单
  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          plan: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  const totalPages = Math.ceil(totalBookings / ITEMS_PER_PAGE);

  // 状态统计
  const statusCounts = await prisma.booking.groupBy({
    by: ["status"],
    where: { merchantId: merchant.id },
    _count: true,
  });

  const statusStats = statusCounts.reduce(
    (acc, { status, _count }) => {
      acc[status] = _count;
      return acc;
    },
    {} as Record<string, number>
  );

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      PENDING: { variant: "warning", label: "待确认" },
      CONFIRMED: { variant: "info", label: "已确认" },
      COMPLETED: { variant: "success", label: "已完成" },
      CANCELLED: { variant: "secondary", label: "已取消" },
    };
    return statusMap[status] || { variant: "secondary", label: status };
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-7xl">
        {/* 返回按钮和标题 */}
        <div className="mb-8">
          <Link
            href="/merchant/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回仪表板
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">订单管理</h1>
              <p className="text-gray-600">
                共 {totalBookings} 个订单
              </p>
            </div>

            {/* 状态筛选 */}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/merchant/bookings"
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  !statusFilter
                    ? "bg-sakura-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                全部 ({totalBookings})
              </Link>
              <Link
                href="/merchant/bookings?status=PENDING"
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statusFilter === "PENDING"
                    ? "bg-amber-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                待确认 ({statusStats.PENDING || 0})
              </Link>
              <Link
                href="/merchant/bookings?status=CONFIRMED"
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statusFilter === "CONFIRMED"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                已确认 ({statusStats.CONFIRMED || 0})
              </Link>
              <Link
                href="/merchant/bookings?status=COMPLETED"
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statusFilter === "COMPLETED"
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                已完成 ({statusStats.COMPLETED || 0})
              </Link>
            </div>
          </div>
        </div>

        {/* 订单列表 */}
        {bookings.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {bookings.map((booking) => {
                const statusBadge = getStatusBadge(booking.status);
                const paymentBadge = getPaymentBadge(booking.paymentStatus);

                return (
                  <Link
                    key={booking.id}
                    href={`/merchant/bookings/${booking.id}`}
                    className="block bg-white rounded-2xl border border-gray-200 p-6 hover:border-sakura-300 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* 左侧：订单信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            订单 #{booking.id.slice(-8)}
                          </h3>
                          <Badge variant={statusBadge.variant} size="sm">
                            {statusBadge.label}
                          </Badge>
                          <Badge variant={paymentBadge.variant} size="sm">
                            {paymentBadge.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              {booking.guestName || booking.user?.name || "未知客户"}
                            </span>
                            {booking.guestEmail || booking.user?.email ? (
                              <span className="text-gray-400">
                                ({booking.guestEmail || booking.user?.email})
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              到店: {booking.visitDate ? new Date(booking.visitDate).toLocaleDateString("zh-CN") : "未设置"} {booking.visitTime || ""}
                            </span>
                          </div>
                        </div>

                        {/* 订单项 */}
                        {booking.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex flex-wrap gap-2">
                              {booking.items.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-sm"
                                >
                                  {item.plan?.name || "未知套餐"} ×{item.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 右侧：金额和时间 */}
                      <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2">
                        <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          ¥{(booking.totalAmount / 100).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.createdAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/merchant/bookings?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    上一页
                  </Link>
                )}

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }

                    return (
                      <Link
                        key={pageNum}
                        href={`/merchant/bookings?page=${pageNum}${statusFilter ? `&status=${statusFilter}` : ""}`}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                          page === pageNum
                            ? "bg-sakura-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>

                {page < totalPages && (
                  <Link
                    href={`/merchant/bookings?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    下一页
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {statusFilter ? "暂无符合条件的订单" : "暂无订单"}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter
                ? "尝试切换其他筛选条件查看订单"
                : "发布套餐后，客户预订就会显示在这里"}
            </p>
            {!statusFilter && (
              <Link href="/merchant/listings/new">
                <button className="px-6 py-3 bg-sakura-600 text-white rounded-xl hover:bg-sakura-700 transition-colors">
                  发布第一个套餐
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
