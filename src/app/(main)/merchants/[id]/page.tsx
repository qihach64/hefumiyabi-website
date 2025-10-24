import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Store, Star, CheckCircle, Award } from "lucide-react";
import prisma from "@/lib/prisma";
import PlanCard from "@/components/PlanCard";
import { Badge } from "@/components/ui";

interface MerchantPageProps {
  params: {
    id: string;
  };
}

export default async function MerchantPage({ params }: MerchantPageProps) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: params.id },
    include: {
      stores: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          phone: true,
        },
      },
      listings: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          price: true,
          createdAt: true,
        },
      },
      reviews: {
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          userId: true,
        },
      },
    },
  });

  if (!merchant || merchant.status !== "APPROVED") {
    notFound();
  }

  // 获取商家的套餐（通过店铺关联）
  const plans = await prisma.rentalPlan.findMany({
    where: {
      storeName: {
        in: merchant.stores.map(s => s.name),
      },
      isActive: true,
    },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      { isCampaign: "desc" },
      { createdAt: "desc" },
    ],
    take: 12,
  });

  // 计算加入时长
  const joinedDate = new Date(merchant.createdAt);
  const now = new Date();
  const monthsJoined = Math.floor(
    (now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* 商家信息卡片 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-sakura-400 to-sakura-500 rounded-2xl flex items-center justify-center overflow-hidden">
                {merchant.logo ? (
                  <Image
                    src={merchant.logo}
                    alt={merchant.businessName}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-5xl text-white">
                    {merchant.businessName.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            {/* 信息 */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {merchant.businessName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    {merchant.verified && (
                      <Badge variant="success" size="md">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        官方认证
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                      <span className="font-semibold text-gray-900">
                        {merchant.rating?.toFixed(1) || "暂无"}
                      </span>
                      <span>({merchant.reviewCount} 条评价)</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      加入 {monthsJoined > 0 ? `${monthsJoined} 个月` : "本月"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 描述 */}
              {merchant.description && (
                <p className="text-gray-700 leading-relaxed mb-4">
                  {merchant.description}
                </p>
              )}

              {/* 统计数据 */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.length}
                  </p>
                  <p className="text-sm text-gray-600">套餐</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {merchant.stores.length}
                  </p>
                  <p className="text-sm text-gray-600">店铺</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {merchant.totalBookings}
                  </p>
                  <p className="text-sm text-gray-600">完成订单</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：套餐列表 */}
          <div className="lg:col-span-2">
            {/* 套餐 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                商家套餐
              </h2>

              {plans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      showMerchant={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">商家暂未发布套餐</p>
                </div>
              )}
            </div>

            {/* 评价 */}
            {merchant.reviews.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 fill-gray-900 text-gray-900" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {merchant.rating?.toFixed(1)} · {merchant.reviewCount} 条评价
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {merchant.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-2xl border border-gray-200 p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-sakura-400 to-sakura-500 rounded-full flex items-center justify-center text-white font-bold">
                          用
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            用户
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-gray-900 text-gray-900" />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {merchant.reviewCount > 6 && (
                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      显示 6 / {merchant.reviewCount} 条评价
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右侧：店铺信息 */}
          <div className="space-y-6">
            {/* 店铺列表 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-sakura-500" />
                店铺位置
              </h2>

              <div className="space-y-4">
                {merchant.stores.map((store) => (
                  <div
                    key={store.id}
                    className="pb-4 last:pb-0 last:border-0 border-b border-gray-200"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {store.name}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span>{store.address}</span>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📞</span>
                          <a
                            href={`tel:${store.phone}`}
                            className="text-sakura-500 hover:underline"
                          >
                            {store.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 认证信息 */}
            {merchant.verified && (
              <div className="bg-sakura-50 border border-sakura-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-sakura-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sakura-900 mb-2">
                      官方认证商家
                    </h3>
                    <p className="text-sm text-sakura-800 leading-relaxed">
                      此商家已通过平台审核验证，资质真实可靠，为您提供安全保障。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 服务承诺 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">服务承诺</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>专业和服着装指导</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>精选优质和服款式</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>7天无理由取消保障</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>售后服务保障</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
