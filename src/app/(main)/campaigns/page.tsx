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
      {/* Hero 区域 - 优雅的樱花主题 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 overflow-hidden">
        {/* 樱花图案背景 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* 优惠标签 */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-sm md:text-base mb-8 shadow-lg animate-pulse">
              <Sparkles className="w-5 h-5" />
              🎊 限时优惠活动进行中
            </div>

            {/* 标题 */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              雅10週年
              <br />
              特别企劃
            </h1>

            {/* 副标题 */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              衷心感谢10年来与我们同行的各位！
            </p>
            <p className="text-base md:text-lg text-muted-foreground/80 mb-8 leading-relaxed">
              在线预订享受最高50%折扣，精选套餐限时优惠
            </p>

            {/* CTA 按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#campaigns"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
              >
                查看优惠
              </a>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-primary/20 bg-background hover:bg-primary/5 h-11 px-8"
              >
                常规套餐
              </Link>
            </div>
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
          <section
            key={campaign.id}
            id="campaigns"
            className="py-16 md:py-24 bg-background"
          >
            <div className="container">
              {/* 活动头部 */}
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{campaign.title}</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  {campaign.description}
                </p>

                {/* 活动时间信息 */}
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(campaign.startDate), "M月d日", {
                        locale: zhCN,
                      })}{" "}
                      -{" "}
                      {format(new Date(campaign.endDate), "M月d日", {
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                  {campaign.usageEndDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        使用至{" "}
                        {format(
                          new Date(campaign.usageEndDate),
                          "yyyy年M月d日",
                          {
                            locale: zhCN,
                          }
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* 限制条件 */}
                {campaign.restrictions.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    {campaign.restrictions.join(" · ")}
                  </div>
                )}
              </div>

              {/* 活动套餐列表 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                      {/* 折扣标签 */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg">
                          {discountPercent}% OFF
                        </div>
                      </div>

                      {/* 图片区域 */}
                      {plan.images.length > 0 ? (
                        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                          <Image
                            src={plan.images[0]}
                            alt={plan.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="relative aspect-[3/4] overflow-hidden bg-secondary flex items-center justify-center">
                          <span className="text-6xl">👘</span>
                        </div>
                      )}

                      {/* 内容区域 */}
                      <div className="p-6">
                        {/* 标题 */}
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-1 line-clamp-2">
                            {plan.name}
                          </h3>
                        </div>

                        {/* 价格 */}
                        <div className="mb-4">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl font-bold text-primary">
                              ¥{(plan.campaignPrice / 100).toLocaleString()}
                            </span>
                            <span className="text-lg text-muted-foreground line-through">
                              ¥{(plan.originalPrice / 100).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-accent">
                            省 ¥
                            {(
                              (plan.originalPrice - plan.campaignPrice) /
                              100
                            ).toLocaleString()}
                          </div>
                        </div>

                        {/* 描述 */}
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                          {plan.description}
                        </p>

                        {/* 包含服务 */}
                        <div className="mb-6 space-y-2">
                          {plan.includes.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                          {plan.includes.length > 3 && (
                            <p className="text-sm text-muted-foreground ml-6">
                              +{plan.includes.length - 3} 更多服务
                            </p>
                          )}
                        </div>

                        {/* 适用店铺 */}
                        {plan.applicableStores.length > 0 && (
                          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {plan.applicableStores[0]}
                              {plan.applicableStores.length > 1 && ` +${plan.applicableStores.length - 1}`}
                            </span>
                          </div>
                        )}

                        {/* CTA 按钮 */}
                        <Link
                          href={`/booking?campaignPlanId=${plan.id}`}
                          className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                        >
                          立即预约
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 活动条款 */}
              {campaign.terms && (
                <div className="max-w-5xl mx-auto mt-12">
                  <div className="bg-card rounded-lg p-6 border">
                    <h3 className="font-semibold mb-2">活动条款</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
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
            准备好预约了吗？
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            在线预订享受优惠价格，提前规划您的和服体验
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-background text-foreground hover:bg-background/90 h-11 px-8"
            >
              立即预约
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 h-11 px-8"
            >
              浏览所有套餐
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
