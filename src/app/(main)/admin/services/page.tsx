import prisma from "@/lib/prisma";
import ServiceReviewList from "./ServiceReviewList";

// 禁用静态生成，在运行时动态渲染
export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  // 获取所有自定义服务（需要审核的）
  const customServices = await prisma.merchantComponent.findMany({
    where: {
      isCustom: true,
    },
    include: {
      merchant: {
        select: {
          id: true,
          businessName: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { approvalStatus: "asc" }, // PENDING 排在前面
      { createdAt: "desc" },
    ],
  });

  // 统计数据
  const stats = {
    total: customServices.length,
    pending: customServices.filter((s) => s.approvalStatus === "PENDING").length,
    approved: customServices.filter((s) => s.approvalStatus === "APPROVED").length,
    rejected: customServices.filter((s) => s.approvalStatus === "REJECTED").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">服务组件审核</h1>
        <p className="text-gray-600 mt-2">审核商户提交的自定义服务</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">总服务数</p>
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

      {/* 服务列表 */}
      <ServiceReviewList services={customServices} />
    </div>
  );
}
