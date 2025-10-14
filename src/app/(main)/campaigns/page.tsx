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
      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-primary/20 via-background to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-6">
              <Sparkles className="w-5 h-5" />
              限时优惠活动
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              优惠活动
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              精选优惠套餐，在线预订享受超值折扣
            </p>
          </div>
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
          <section key={campaign.id} className="py-16 md:py-24 bg-background">
            <div className="container">
              {/* 活动头部 */}
              <div className="max-w-4xl mx-auto mb-12">
                <div className="text-center">
                  {campaign.subtitle && (
                    <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                      {campaign.subtitle}
                    </div>
                  )}
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {campaign.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
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
              <div className="grid md:grid-cols-2 gap-8">
                {campaign.campaignPlans.map((plan) => {
                  const discountPercent = Math.round(
                    ((plan.originalPrice - plan.campaignPrice) /
                      plan.originalPrice) *
                      100
                  );

                  return (
                    <div
                      key={plan.id}
                      className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-xl transition-all duration-300"
                    >
                      {/* 推荐标签 */}
                      {plan.isFeatured && (
                        <div className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg">
                          热门推荐
                        </div>
                      )}

                      {/* 折扣标签 */}
                      <div className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-md shadow-lg">
                        省 {discountPercent}%
                      </div>

                      <div className="grid md:grid-cols-5 gap-6">
                        {/* 图片区域 */}
                        {plan.images.length > 0 ? (
                          <div className="md:col-span-2 relative aspect-[3/4] md:aspect-auto overflow-hidden bg-secondary">
                            <Image
                              src={plan.images[0]}
                              alt={plan.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, 40vw"
                            />
                          </div>
                        ) : (
                          <div className="md:col-span-2 relative aspect-[3/4] md:aspect-auto overflow-hidden bg-gradient-to-br from-secondary to-primary/5 flex items-center justify-center">
                            <span className="text-6xl">👘</span>
                          </div>
                        )}

                        {/* 内容区域 */}
                        <div className="md:col-span-3 p-6">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold mb-1">
                              {plan.name}
                            </h3>
                            {plan.nameEn && (
                              <p className="text-xs text-muted-foreground">
                                {plan.nameEn}
                              </p>
                            )}
                          </div>

                          {/* 价格 */}
                          <div className="mb-4">
                            <div className="flex items-baseline gap-3 mb-1">
                              <span className="text-3xl font-bold text-primary">
                                ¥{(plan.campaignPrice / 100).toLocaleString()}
                              </span>
                              <span className="text-lg text-muted-foreground line-through">
                                ¥{(plan.originalPrice / 100).toLocaleString()}
                              </span>
                            </div>
                            {plan.duration && (
                              <p className="text-xs text-muted-foreground">
                                租赁时长：{plan.duration} 小时
                              </p>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                            {plan.description}
                          </p>

                          {/* 包含服务 */}
                          <div className="space-y-2 mb-6">
                            {plan.includes.slice(0, 4).map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-xs"
                              >
                                <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                            {plan.includes.length > 4 && (
                              <p className="text-xs text-muted-foreground ml-5">
                                还有 {plan.includes.length - 4} 项服务...
                              </p>
                            )}
                          </div>

                          {/* 适用店铺 */}
                          {plan.applicableStores.length > 0 && (
                            <div className="mb-4 pb-4 border-b">
                              <div className="flex items-start gap-2 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-muted-foreground">
                                    适用店铺：
                                  </span>
                                  <span className="text-foreground ml-1">
                                    {plan.applicableStores.length} 家店铺可用
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <Link
                            href={`/booking?campaign=${campaign.slug}&plan=${plan.id}`}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                          >
                            立即预订
                          </Link>
                        </div>
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

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0tNCAyOGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="container text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            不要错过这些超值优惠！
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            限时特惠，数量有限，立即预订锁定优惠价格
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-background text-foreground hover:bg-background/90 h-11 px-8"
            >
              立即预约
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 h-11 px-8"
            >
              咨询客服
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
