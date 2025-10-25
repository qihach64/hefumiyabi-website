import prisma from "@/lib/prisma";
import MerchantReviewList from "./MerchantReviewList";

// 禁用静态生成，在运行时动态渲染（避免构建时连接数据库）
export const dynamic = 'force-dynamic';

export default async function AdminMerchantsPage() {
  // 获取所有商家
  const merchants = await prisma.merchant.findMany({
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },
      stores: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 统计数据
  const stats = {
    total: merchants.length,
    pending: merchants.filter((m) => m.status === "PENDING").length,
    approved: merchants.filter((m) => m.status === "APPROVED").length,
    rejected: merchants.filter((m) => m.status === "REJECTED").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">商家审核</h1>
        <p className="text-gray-600 mt-2">审核和管理平台商家</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">总商家数</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-sm text-amber-700 mb-1">待审核</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-700 mb-1">已批准</p>
          <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-sm text-red-700 mb-1">已拒绝</p>
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
        </div>
      </div>

      {/* 商家列表 */}
      <MerchantReviewList merchants={merchants} />
    </div>
  );
}
