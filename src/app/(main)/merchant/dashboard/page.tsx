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
} from "lucide-react";
import { Button, Badge } from "@/components/ui";

export default async function MerchantDashboardPage() {
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
      bookings: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
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

  // 计算统计数据
  const totalBookings = merchant.totalBookings;
  const totalRevenue = merchant.totalRevenue;
  const avgRating = merchant.rating || 0;
  const reviewCount = merchant.reviewCount;

  // 本月数据（模拟）
  const thisMonthBookings = merchant.bookings.filter((b) => {
    const bookingDate = new Date(b.createdAt);
    const now = new Date();
    return (
      bookingDate.getMonth() === now.getMonth() &&
      bookingDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const thisMonthRevenue = merchant.bookings
    .filter((b) => {
      const bookingDate = new Date(b.createdAt);
      const now = new Date();
      return (
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getFullYear() === now.getFullYear() &&
        b.paymentStatus === "PAID"
      );
    })
    .reduce((sum, b) => sum + b.totalAmount, 0);

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
          {/* 左侧：最近订单 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">最近订单</h2>
                <Link href="/merchant/bookings">
                  <Button variant="secondary" size="sm">
                    查看全部
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {merchant.bookings.length > 0 ? (
                <div className="space-y-4">
                  {merchant.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            订单 #{booking.id.slice(-8)}
                          </span>
                          <Badge
                            variant={
                              booking.paymentStatus === "PAID"
                                ? "success"
                                : "warning"
                            }
                            size="sm"
                          >
                            {booking.paymentStatus === "PAID" ? "已支付" : "待支付"}
                          </Badge>
                          <Badge
                            variant={
                              booking.status === "CONFIRMED"
                                ? "success"
                                : booking.status === "PENDING"
                                ? "warning"
                                : "secondary"
                            }
                            size="sm"
                          >
                            {booking.status === "CONFIRMED"
                              ? "已确认"
                              : booking.status === "PENDING"
                              ? "待确认"
                              : booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.createdAt).toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ¥{(booking.totalAmount / 100).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">暂无订单</p>
                  <Link href="/merchant/listings/new">
                    <Button variant="primary" size="md">
                      发布套餐开始接单
                    </Button>
                  </Link>
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
                  href="/merchant/listings/new"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-sakura-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-sakura-100 rounded-lg flex items-center justify-center group-hover:bg-sakura-200 transition-colors">
                    <Plus className="w-5 h-5 text-sakura-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">发布套餐</p>
                    <p className="text-xs text-gray-600">添加新的和服体验套餐</p>
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
                  href="/merchant/analytics"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">数据分析</p>
                    <p className="text-xs text-gray-600">查看详细运营数据</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
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
