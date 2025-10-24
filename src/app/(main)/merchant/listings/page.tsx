import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Eye, Edit, Power, TrendingUp, Package } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import Image from "next/image";

export default async function MerchantListingsPage() {
  // 验证登录
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 获取商家信息
  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!merchant) {
    redirect("/merchant/register");
  }

  if (merchant.status !== "APPROVED") {
    redirect("/merchant/pending");
  }

  // 获取所有套餐（暂时显示全部，后续添加 merchantId 字段后筛选）
  const allPlans = await prisma.rentalPlan.findMany({
    orderBy: [
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      isActive: true,
      isFeatured: true,
      isCampaign: true,
      currentBookings: true,
      createdAt: true,
    },
  });

  // 统计数据
  const stats = {
    total: allPlans.length,
    active: allPlans.filter((p) => p.isActive).length,
    inactive: allPlans.filter((p) => !p.isActive).length,
    featured: allPlans.filter((p) => p.isFeatured).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* 标题区域 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">套餐管理</h1>
              <p className="text-gray-600">管理您的和服租赁套餐</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/merchants/${merchant.id}`} target="_blank">
                <Button variant="secondary" size="lg">
                  <Eye className="w-5 h-5 mr-2" />
                  预览公开页面
                </Button>
              </Link>
              <Link href="/merchant/listings/new">
                <Button variant="primary" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  发布新套餐
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">全部套餐</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <p className="text-sm text-green-700 mb-1">已上架</p>
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">已下架</p>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <p className="text-sm text-amber-700 mb-1">精选套餐</p>
            <p className="text-2xl font-bold text-amber-700">{stats.featured}</p>
          </div>
        </div>

        {/* 套餐列表 */}
        {allPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* 套餐图片 */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {plan.imageUrl ? (
                    <Image
                      src={plan.imageUrl}
                      alt={plan.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  {/* 状态标签 */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge
                      variant={plan.isActive ? "success" : "secondary"}
                      size="sm"
                    >
                      {plan.isActive ? "已上架" : "已下架"}
                    </Badge>
                    {plan.isFeatured && (
                      <Badge variant="warning" size="sm">
                        精选
                      </Badge>
                    )}
                    {plan.isCampaign && (
                      <Badge variant="danger" size="sm">
                        活动
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 套餐信息 */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      ¥{(plan.price / 100).toLocaleString()}
                    </span>
                    {plan.originalPrice && plan.originalPrice > plan.price && (
                      <span className="text-sm text-gray-500 line-through">
                        ¥{(plan.originalPrice / 100).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {plan.currentBookings} 次预订
                    </span>
                    <Badge variant="info" size="sm">
                      {plan.category}
                    </Badge>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Link href={`/plans/${plan.slug}`} target="_blank" className="flex-1">
                      <Button variant="secondary" size="sm" fullWidth>
                        <Eye className="w-4 h-4 mr-2" />
                        预览
                      </Button>
                    </Link>
                    <Link href={`/merchant/listings/${plan.id}/edit`} className="flex-1">
                      <Button variant="primary" size="sm" fullWidth>
                        <Edit className="w-4 h-4 mr-2" />
                        编辑
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              还没有套餐
            </h2>
            <p className="text-gray-600 mb-6">
              发布您的第一个和服租赁套餐，开始接待客户
            </p>
            <Link href="/merchant/listings/new">
              <Button variant="primary" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                发布新套餐
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
