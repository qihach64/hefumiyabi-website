import prisma from "@/lib/prisma";
import { Store, Users, Calendar, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";

export default async function AdminDashboardPage() {
  // 获取统计数据
  const [
    totalUsers,
    totalMerchants,
    pendingMerchants,
    totalBookings,
    thisMonthBookings,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.merchant.count(),
    prisma.merchant.count({ where: { status: "PENDING" } }),
    prisma.booking.count(),
    prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        paymentStatus: "PAID",
      },
    }),
  ]);

  // 获取待审核商家列表
  const pendingMerchantsList = await prisma.merchant.findMany({
    where: { status: "PENDING" },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">管理仪表板</h1>
        <p className="text-gray-600 mt-2">平台运营数据总览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 总用户数 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {totalUsers.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">注册用户</p>
        </div>

        {/* 商家数量 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-sakura-100 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-sakura-600" />
            </div>
            {pendingMerchants > 0 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                {pendingMerchants} 待审核
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {totalMerchants.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">入驻商家</p>
        </div>

        {/* 订单数量 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              本月 {thisMonthBookings}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {totalBookings.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">总订单数</p>
        </div>

        {/* 总收入 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ¥{((totalRevenue._sum.totalAmount || 0) / 100).toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">平台总收入</p>
        </div>
      </div>

      {/* 待审核商家 */}
      {pendingMerchantsList.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">待审核商家</h2>
                <p className="text-sm text-gray-600">
                  {pendingMerchants} 个商家申请等待审核
                </p>
              </div>
            </div>
            <Link href="/admin/merchants">
              <Button variant="primary" size="md">
                查看全部
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {pendingMerchantsList.map((merchant) => (
              <Link
                key={merchant.id}
                href={`/admin/merchants`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {merchant.logo ? (
                      <img
                        src={merchant.logo}
                        alt={merchant.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {merchant.businessName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {merchant.owner.name || merchant.owner.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(merchant.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                  <span className="text-xs text-amber-600 font-medium">
                    待审核
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/merchants"
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="w-12 h-12 bg-sakura-100 rounded-xl flex items-center justify-center mb-4">
            <Store className="w-6 h-6 text-sakura-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">商家管理</h3>
          <p className="text-sm text-gray-600">
            审核商家申请，管理商家账号和权限
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">用户管理</h3>
          <p className="text-sm text-gray-600">查看和管理平台用户信息</p>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">系统设置</h3>
          <p className="text-sm text-gray-600">配置平台参数和功能选项</p>
        </Link>
      </div>
    </div>
  );
}
