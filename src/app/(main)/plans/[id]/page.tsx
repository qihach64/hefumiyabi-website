import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Clock, Users, Star, Shield, Check } from "lucide-react";
import prisma from "@/lib/prisma";
import BookingCard from "@/components/BookingCard";
import { Badge } from "@/components/ui";

interface PlanDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const plan = await prisma.rentalPlan.findUnique({
    where: { id: params.id },
    include: {
      campaign: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
        },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  // 分类标签
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      LADIES: "女士",
      MENS: "男士",
      COUPLE: "情侣",
      FAMILY: "亲子",
      GROUP: "团体",
      SPECIAL: "特别",
    };
    return labels[category] || "套餐";
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-8 pb-32 lg:pb-8">
        {/* 标题区域 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
            {plan.isCampaign && (
              <Badge variant="warning" size="lg">
                限时优惠
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            {/* 评分 - 模拟数据 */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
              <span className="font-semibold text-gray-900">4.8</span>
              <span>(128条评价)</span>
            </div>

            {/* 地区 */}
            {plan.region && (
              <>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{plan.region}</span>
                </div>
              </>
            )}

            {/* 店铺 */}
            {plan.storeName && (
              <>
                <span>·</span>
                <span className="font-semibold">{plan.storeName}</span>
              </>
            )}
          </div>
        </div>

        {/* 主图区域 - Airbnb 风格大图 */}
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-gray-100 mb-12">
          {plan.imageUrl ? (
            <Image
              src={plan.imageUrl}
              alt={plan.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-sakura-50">
              <span className="text-9xl opacity-20">👘</span>
            </div>
          )}
        </div>

        {/* 两栏布局：左侧内容 + 右侧预订卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 左侧内容区域 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 套餐信息卡片 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">
                {getCategoryLabel(plan.category)}套餐 · {plan.duration}小时体验
              </h2>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sakura-500" />
                  <span>{plan.duration} 小时</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-sakura-500" />
                  <span>最多10人</span>
                </div>
              </div>
            </div>

            {/* 套餐描述 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">套餐介绍</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {plan.description}
              </p>
            </div>

            {/* 套餐包含项目 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">套餐包含</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.includes.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-sakura-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-sakura-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 标签 */}
            {plan.tags.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">特色标签</h2>
                <div className="flex flex-wrap gap-2">
                  {plan.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" size="md">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 活动信息 */}
            {plan.campaign && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🎊</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      {plan.campaign.title}
                    </h3>
                    <p className="text-amber-800 leading-relaxed">
                      {plan.campaign.description}
                    </p>
                    {plan.availableUntil && (
                      <p className="text-sm text-amber-700 mt-3">
                        活动截止日期：{new Date(plan.availableUntil).toLocaleDateString('zh-CN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 预订须知 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">预订须知</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-sakura-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">取消政策</h3>
                    <p className="text-sm text-gray-600">
                      到店日期前7天可免费取消，7天内取消将扣除定金
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-sakura-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">营业时间</h3>
                    <p className="text-sm text-gray-600">
                      每天 09:00 - 18:00（最晚入店时间16:00）
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-sakura-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">人数限制</h3>
                    <p className="text-sm text-gray-600">
                      单次预订最多10人，团体预订请提前联系客服
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 评价区域 - 模拟数据 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 fill-gray-900 text-gray-900" />
                <h2 className="text-xl font-bold">4.8 · 128条评价</h2>
              </div>

              <div className="space-y-6">
                {/* 评价项 - 模拟 */}
                {[
                  {
                    name: "小红",
                    date: "2024年10月",
                    rating: 5,
                    comment: "非常棒的体验！和服很精美，工作人员很专业，拍照效果超好！强烈推荐！"
                  },
                  {
                    name: "张女士",
                    date: "2024年10月",
                    rating: 5,
                    comment: "服务一流，和服款式多样，帮忙化妆和盘发的小姐姐手艺很好，整体体验超出预期！"
                  },
                  {
                    name: "李先生",
                    date: "2024年9月",
                    rating: 4,
                    comment: "不错的体验，和服质量很好，价格也合理。就是周末人有点多，需要等待。"
                  }
                ].map((review, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sakura-400 to-sakura-500 flex items-center justify-center text-white font-bold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.name}</p>
                        <p className="text-sm text-gray-600">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-gray-900 text-gray-900" />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧预订卡片 - Sticky */}
          <div className="lg:col-span-1">
            <BookingCard plan={plan} />
          </div>
        </div>
      </div>
    </div>
  );
}
