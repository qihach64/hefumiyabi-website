import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Store,
  Package,
  DollarSign,
  Star,
  TrendingUp,
  Calendar,
  Users,
  Plus,
  ArrowRight,
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";

interface MerchantDashboardPageProps {
  searchParams: {
    page?: string;
    status?: string;
  };
}

const ITEMS_PER_PAGE = 10;

export default async function MerchantDashboardPage({ searchParams }: MerchantDashboardPageProps) {
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
    include: {
      stores: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          phone: true,
          isActive: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!merchant) {
    redirect("/merchant/register");
  }

  // 如果还在审核中，跳转到等待页面
  if (merchant.status === "PENDING" || merchant.status === "REJECTED") {
    redirect("/merchant/pending");
  }

  // 构建订单查询条件
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

  // 计算统计数据
  const totalRevenue = merchant.totalRevenue;
  const avgRating = merchant.rating || 0;
  const reviewCount = merchant.reviewCount;

  // 本月数据
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthBookings = await prisma.booking.count({
    where: {
      merchantId: merchant.id,
      createdAt: {
        gte: firstDayOfMonth,
      },
    },
  });

  const thisMonthRevenueData = await prisma.booking.aggregate({
    where: {
      merchantId: merchant.id,
      createdAt: {
        gte: firstDayOfMonth,
      },
      paymentStatus: "PAID",
    },
    _sum: {
      totalAmount: true,
    },
  });

  const thisMonthRevenue = thisMonthRevenueData._sum.totalAmount || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* 标题区域 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {merchant.businessName}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant={merchant.verified ? "success" : "warning"} size="md">
                  {merchant.verified ? "✓ 已认证" : "待认证"}
                </Badge>
                {merchant.status === "APPROVED" && (
                  <Badge variant="success" size="md">
                    审核通过
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/merchant/listings/new">
                <Button variant="primary" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  发布套餐
                </Button>
              </Link>
              <Link href={`/merchants/${merchant.id}`}>
                <Button variant="secondary" size="lg">
                  查看公开页面
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 总订单 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="info" size="sm">
                本月 {thisMonthBookings}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {totalBookings}
            </h3>
            <p className="text-sm text-gray-600">总订单数</p>
          </div>

          {/* 总收入 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="success" size="sm">
                本月 ¥{(thisMonthRevenue / 100).toLocaleString()}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              ¥{(totalRevenue / 100).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600">总收入</p>
          </div>

          {/* 评分 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <Badge variant="warning" size="sm">
                {reviewCount} 评价
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {avgRating.toFixed(1)}
            </h3>
            <p className="text-sm text-gray-600">平均评分</p>
          </div>

          {/* 店铺数 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-sakura-100 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-sakura-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {merchant.stores.length}
            </h3>
            <p className="text-sm text-gray-600">店铺数量</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：订单列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">订单管理</h2>
                <span className="text-sm text-gray-600">
                  共 {totalBookings} 个订单
                </span>
              </div>

              {/* 状态筛选 */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Link
                  href="/merchant/dashboard"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    !statusFilter
                      ? "bg-sakura-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  全部 ({merchant.totalBookings})
                </Link>
                <Link
                  href="/merchant/dashboard?status=PENDING"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    statusFilter === "PENDING"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  待确认 ({statusStats.PENDING || 0})
                </Link>
                <Link
                  href="/merchant/dashboard?status=CONFIRMED"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    statusFilter === "CONFIRMED"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  已确认 ({statusStats.CONFIRMED || 0})
                </Link>
                <Link
                  href="/merchant/dashboard?status=COMPLETED"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    statusFilter === "COMPLETED"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  已完成 ({statusStats.COMPLETED || 0})
                </Link>
              </div>

              {bookings.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6">
                    {bookings.map((booking) => {
                      const getStatusBadge = (status: string) => {
                        const map: Record<string, { variant: any; label: string }> = {
                          PENDING: { variant: "warning", label: "待确认" },
                          CONFIRMED: { variant: "info", label: "已确认" },
                          COMPLETED: { variant: "success", label: "已完成" },
                          CANCELLED: { variant: "secondary", label: "已取消" },
                        };
                        return map[status] || { variant: "secondary", label: status };
                      };

                      const getPaymentBadge = (status: string) => {
                        const map: Record<string, { variant: any; label: string }> = {
                          PENDING: { variant: "warning", label: "待支付" },
                          PAID: { variant: "success", label: "已支付" },
                          REFUNDED: { variant: "secondary", label: "已退款" },
                        };
                        return map[status] || { variant: "secondary", label: status };
                      };

                      const statusBadge = getStatusBadge(booking.status);
                      const paymentBadge = getPaymentBadge(booking.paymentStatus);

                      return (
                        <Link
                          key={booking.id}
                          href={`/merchant/bookings/${booking.id}`}
                          className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:border-sakura-300 border border-transparent transition-all"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-900">
                                  #{booking.id.slice(-8)}
                                </span>
                                <Badge variant={statusBadge.variant} size="sm">
                                  {statusBadge.label}
                                </Badge>
                                <Badge variant={paymentBadge.variant} size="sm">
                                  {paymentBadge.label}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  <span className="truncate">
                                    {booking.guestName || booking.user?.name || "未知"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>
                                    {booking.visitDate ? new Date(booking.visitDate).toLocaleDateString("zh-CN") : new Date(booking.createdAt).toLocaleDateString("zh-CN")}
                                  </span>
                                </div>
                              </div>

                              {booking.items.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {booking.items.slice(0, 2).map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-0.5 bg-white rounded text-xs text-gray-600"
                                    >
                                      {item.plan?.name} ×{item.quantity}
                                    </span>
                                  ))}
                                  {booking.items.length > 2 && (
                                    <span className="inline-block px-2 py-0.5 bg-white rounded text-xs text-gray-600">
                                      +{booking.items.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold text-gray-900">
                                ¥{(booking.totalAmount / 100).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <Link
                        href={`/merchant/dashboard?page=${Math.max(1, page - 1)}${statusFilter ? `&status=${statusFilter}` : ""}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                          page > 1
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        上一页
                      </Link>

                      <span className="text-sm text-gray-600">
                        第 {page} / {totalPages} 页
                      </span>

                      <Link
                        href={`/merchant/dashboard?page=${Math.min(totalPages, page + 1)}${statusFilter ? `&status=${statusFilter}` : ""}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                          page < totalPages
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        下一页
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    {statusFilter ? "暂无符合条件的订单" : "暂无订单"}
                  </p>
                  {!statusFilter && (
                    <Link href="/merchant/listings/new">
                      <Button variant="primary" size="md">
                        发布套餐开始接单
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：快捷操作 + 店铺列表 */}
          <div className="space-y-6">
            {/* 快捷操作 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">快捷操作</h2>
              <div className="space-y-3">
                <Link
                  href="/merchant/listings"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">套餐管理</p>
                    <p className="text-xs text-gray-600">查看和编辑所有套餐</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </Link>

                <Link
                  href="/merchant/listings/new"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-sakura-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-sakura-100 rounded-lg flex items-center justify-center group-hover:bg-sakura-200 transition-colors">
                    <Plus className="w-5 h-5 text-sakura-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">发布新套餐</p>
                    <p className="text-xs text-gray-600">添加和服体验套餐</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-sakura-600 transition-colors" />
                </Link>

                <Link
                  href="/merchant/stores"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">管理店铺</p>
                    <p className="text-xs text-gray-600">查看和编辑店铺信息</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>

                <Link
                  href="/merchant/components"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <Settings className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">组件配置</p>
                    <p className="text-xs text-gray-600">设置服务组件和价格</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </Link>

                <Link
                  href={`/merchants/${merchant.id}`}
                  target="_blank"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">查看公开页面</p>
                    <p className="text-xs text-gray-600">预览客户看到的页面</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                </Link>
              </div>
            </div>

            {/* 店铺列表 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">我的店铺</h2>
                <Link href="/merchant/stores">
                  <Button variant="secondary" size="sm">
                    管理店铺
                  </Button>
                </Link>
              </div>
              {merchant.stores.length > 0 ? (
                <div className="space-y-3">
                  {merchant.stores.map((store) => (
                    <div
                      key={store.id}
                      className="p-4 border border-gray-200 rounded-xl hover:border-sakura-300 hover:bg-sakura-50/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-sakura-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 text-sakura-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {store.name}
                            </h3>
                            <Badge
                              variant={store.isActive ? "success" : "secondary"}
                              size="sm"
                            >
                              {store.isActive ? "营业中" : "已关闭"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {store.address}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span>🏙️ {store.city}</span>
                            {store.phone && <span>📞 {store.phone}</span>}
                          </div>
                        </div>
                        <Link href={`/stores/${store.id}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">还没有添加店铺</p>
                  <Link href="/merchant/stores/new">
                    <Button variant="primary" size="md">
                      <Plus className="w-4 h-4 mr-2" />
                      添加店铺
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
