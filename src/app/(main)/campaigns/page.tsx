import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { Calendar, Clock, MapPin, Check, Sparkles, Tag } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default async function CampaignsPage() {
  // 获取所有活跃的优惠活动
  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      endDate: {
        gte: new Date(),
      },
    },
    include: {
      campaignPlans: {
        orderBy: {
          isFeatured: "desc",
        },
      },
    },
    orderBy: [
      {
        isPinned: "desc",
      },
      {
        priority: "desc",
      },
      {
        startDate: "desc",
      },
    ],
  });

  return (
    <div className="flex flex-col">
      {/* Hero 区域 - 使用海报图片 */}
      <section className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:from-rose-950/20 dark:via-pink-950/20 dark:to-orange-950/20 overflow-hidden">
        {/* 海报背景图 */}
        {campaigns.length > 0 && campaigns[0].bannerImage && (
          <div className="absolute inset-0 opacity-20 dark:opacity-10">
            <Image
              src={campaigns[0].bannerImage}
              alt="Campaign Banner"
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>

        <div className="container relative py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* 动态标签 */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-sm md:text-base mb-8 shadow-lg animate-pulse">
              <Sparkles className="w-5 h-5" />
              🎊 限时优惠活动进行中
            </div>

            {/* 大标题 */}
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                感恩回馈
              </span>
              <br />
              <span className="text-foreground">超值优惠季</span>
            </h1>

            {/* 副标题 */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-medium">
              精选和服套餐 · 在线预订享受{" "}
              <span className="text-rose-600 dark:text-rose-400 font-bold text-3xl">
                最高50%
              </span>{" "}
              折扣
            </p>

            {/* CTA 按钮组 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="#campaigns"
                className="inline-flex items-center justify-center rounded-full text-base font-bold transition-all bg-gradient-to-r from-rose-600 to-orange-600 text-white hover:shadow-2xl hover:scale-105 h-14 px-10 shadow-lg"
              >
                立即抢购
                <span className="ml-2">→</span>
              </a>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-full text-base font-medium transition-colors border-2 border-rose-600/20 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-14 px-8"
              >
                查看常规套餐
              </Link>
            </div>

            {/* 优惠提示 */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-black/20 backdrop-blur-sm shadow-md">
                <span className="text-2xl">🔥</span>
                <span className="font-semibold">热门套餐限量供应</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-black/20 backdrop-blur-sm shadow-md">
                <span className="text-2xl">⚡</span>
                <span className="font-semibold">线上预订专享价</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-black/20 backdrop-blur-sm shadow-md">
                <span className="text-2xl">🎁</span>
                <span className="font-semibold">含专业造型服务</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部波浪装饰 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* 活动列表 */}
      {campaigns.length === 0 ? (
        <section className="py-24 bg-background">
          <div className="container text-center">
            <div className="text-6xl mb-4">🎊</div>
            <h2 className="text-2xl font-bold mb-2">暂无进行中的优惠活动</h2>
            <p className="text-muted-foreground mb-8">
              请关注我们的最新动态，精彩活动即将推出
            </p>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              查看常规套餐
            </Link>
          </div>
        </section>
      ) : (
        campaigns.map((campaign) => (
          <section
            key={campaign.id}
            id="campaigns"
            className="py-16 md:py-24 bg-background"
          >
            <div className="container">
              {/* 活动头部 */}
              <div className="max-w-4xl mx-auto mb-16">
                <div className="text-center">
                  {campaign.subtitle && (
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-rose-100 to-orange-100 dark:from-rose-950/30 dark:to-orange-950/30 text-rose-700 dark:text-rose-300 text-sm font-bold mb-6 border-2 border-rose-200 dark:border-rose-800">
                      <span className="text-lg">🎉</span>
                      {campaign.subtitle}
                    </div>
                  )}
                  <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                    {campaign.title}
                  </h2>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    {campaign.description}
                  </p>

                  {/* 活动时间信息 */}
                  <div className="flex flex-wrap justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">
                        活动期间：
                        <span className="text-foreground font-medium ml-1">
                          {format(new Date(campaign.startDate), "yyyy年M月d日", {
                            locale: zhCN,
                          })}{" "}
                          -{" "}
                          {format(new Date(campaign.endDate), "M月d日", {
                            locale: zhCN,
                          })}
                        </span>
                      </span>
                    </div>
                    {campaign.usageStartDate && campaign.usageEndDate && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          使用期限：
                          <span className="text-foreground font-medium ml-1">
                            至{" "}
                            {format(
                              new Date(campaign.usageEndDate),
                              "yyyy年M月d日",
                              {
                                locale: zhCN,
                              }
                            )}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 限制条件 */}
                  {campaign.restrictions.length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs">
                      <Tag className="w-3.5 h-3.5" />
                      {campaign.restrictions.join("、")}
                    </div>
                  )}
                </div>
              </div>

              {/* 活动套餐列表 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaign.campaignPlans.map((plan) => {
                  const discountPercent = Math.round(
                    ((plan.originalPrice - plan.campaignPrice) /
                      plan.originalPrice) *
                      100
                  );

                  return (
                    <div
                      key={plan.id}
                      className="group relative overflow-hidden rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 bg-card hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    >
                      {/* 推荐标签 - 角标样式 */}
                      {plan.isFeatured && (
                        <div className="absolute top-0 right-0 z-10">
                          <div className="relative">
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg transform rotate-12 animate-bounce">
                              🔥 热门
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 折扣标签 - 更大更醒目 */}
                      <div className="absolute top-4 left-4 z-10">
                        <div className="relative">
                          <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white px-4 py-3 rounded-xl shadow-2xl transform -rotate-3">
                            <div className="text-center">
                              <div className="text-2xl font-black leading-none">
                                {discountPercent}%
                              </div>
                              <div className="text-[10px] font-bold uppercase tracking-wider">
                                OFF
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 图片区域 */}
                      {plan.images.length > 0 ? (
                        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                          <Image
                            src={plan.images[0]}
                            alt={plan.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          {/* 图片渐变遮罩 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-950/30 dark:to-orange-950/30 flex items-center justify-center">
                          <span className="text-8xl">👘</span>
                        </div>
                      )}

                      {/* 内容区域 */}
                      <div className="p-6">
                        {/* 标题 */}
                        <div className="mb-4">
                          <h3 className="text-lg font-bold mb-1 line-clamp-2 min-h-[3.5rem]">
                            {plan.name}
                          </h3>
                          {plan.nameEn && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {plan.nameEn}
                            </p>
                          )}
                        </div>

                        {/* 价格 - 更突出 */}
                        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border border-rose-100 dark:border-rose-900/30">
                          <div className="flex items-baseline gap-3 mb-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm text-muted-foreground">
                                ¥
                              </span>
                              <span className="text-4xl font-black text-rose-600 dark:text-rose-400">
                                {(plan.campaignPrice / 100).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground line-through">
                                ¥{(plan.originalPrice / 100).toLocaleString()}
                              </span>
                              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                                省 ¥
                                {(
                                  (plan.originalPrice - plan.campaignPrice) /
                                  100
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {plan.duration && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>租赁时长 {plan.duration} 小时</span>
                            </div>
                          )}
                        </div>

                        {/* 描述 */}
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                          {plan.description}
                        </p>

                        {/* 包含服务 - 精简显示 */}
                        <div className="mb-4 space-y-1.5">
                          {plan.includes.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs"
                            >
                              <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">
                                {item}
                              </span>
                            </div>
                          ))}
                          {plan.includes.length > 3 && (
                            <p className="text-xs text-muted-foreground ml-5">
                              +{plan.includes.length - 3} 项服务
                            </p>
                          )}
                        </div>

                        {/* 适用店铺 */}
                        {plan.applicableStores.length > 0 && (
                          <div className="mb-4 pb-4 border-t pt-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>
                                {plan.applicableStores.length} 家店铺可用
                              </span>
                            </div>
                          </div>
                        )}

                        {/* CTA 按钮 */}
                        <Link
                          href={`/booking?campaignPlanId=${plan.id}`}
                          className="w-full inline-flex items-center justify-center rounded-xl text-base font-bold transition-all bg-gradient-to-r from-rose-600 to-orange-600 text-white hover:shadow-xl hover:scale-105 h-12 px-6"
                        >
                          立即抢购
                          <span className="ml-2">→</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 活动条款 */}
              {campaign.terms && (
                <div className="max-w-4xl mx-auto mt-12">
                  <div className="p-6 rounded-lg bg-muted/50 border">
                    <h3 className="font-semibold mb-2 text-sm">活动条款</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {campaign.terms}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        ))
      )}

      {/* CTA - 重新设计 */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-rose-600 via-pink-600 to-orange-600 text-white relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>

        {/* 波浪装饰 - 顶部 */}
        <div className="absolute top-0 left-0 right-0 transform rotate-180">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z"
              className="fill-background"
            />
          </svg>
        </div>

        <div className="container text-center relative">
          <div className="max-w-3xl mx-auto">
            {/* 标题 */}
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              🎊 不要错过这些
              <br />
              <span className="text-yellow-300">超值优惠</span>
            </h2>

            {/* 副标题 */}
            <p className="text-xl md:text-2xl mb-12 opacity-95 font-medium">
              限时特惠 · 数量有限 · 先到先得
            </p>

            {/* 倒计时提示 */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-lg mb-10 border-2 border-white/30">
              <Clock className="w-6 h-6 animate-pulse" />
              <span>活动即将结束，立即预订锁定优惠价格</span>
            </div>

            {/* CTA 按钮组 */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-full text-lg font-bold transition-all bg-white text-rose-600 hover:bg-yellow-300 hover:text-rose-700 hover:shadow-2xl hover:scale-110 h-16 px-12 shadow-xl"
              >
                <span className="mr-2">⚡</span>
                立即预约
                <span className="ml-2">→</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full text-lg font-bold transition-all border-3 border-white/40 hover:bg-white/10 backdrop-blur-sm h-16 px-10"
              >
                咨询客服
              </Link>
            </div>

            {/* 底部提示 */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>100% 真实客户评价</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>专业和服着装团队</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>灵活改期政策</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
