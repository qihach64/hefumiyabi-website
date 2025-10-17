import Link from "next/link";
import prisma from "@/lib/prisma";
import { Clock, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import CampaignsClient from "./CampaignsClient";

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
        select: {
          id: true,
          name: true,
          description: true,
          originalPrice: true,
          campaignPrice: true,
          images: true,
          includes: true,
          applicableStores: true,
          isFeatured: true,
        },
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

  // 获取店铺列表
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex flex-col">
      {/* 精简的 Hero 区域 - 樱花淡雅风格 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 border-b">
        <div className="container py-8 md:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* 左侧：标题和优惠信息 */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-sm mb-4 shadow-md">
                  <Sparkles className="w-4 h-4" />
                  限时优惠
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  10周年特惠
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground">
                  在线预订享受<span className="text-primary font-bold text-2xl mx-1">最高50%</span>折扣
                </p>
              </div>

              {/* 右侧：关键信息卡片 */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-card rounded-lg p-4 text-center border-2 border-primary/20 shadow-sm">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{campaigns.reduce((sum, c) => sum + c.campaignPlans.length, 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">优惠套餐</div>
                </div>
                <div className="bg-card rounded-lg p-4 text-center border-2 border-accent/20 shadow-sm">
                  <div className="text-2xl md:text-3xl font-bold text-accent">50%</div>
                  <div className="text-xs text-muted-foreground mt-1">最高折扣</div>
                </div>
              </div>
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
            className="py-8 md:py-12 bg-background"
          >
            <div className="container">
              {/* 精简的活动头部 */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{campaign.title}</h2>
                    <p className="text-muted-foreground text-sm md:text-base">
                      {campaign.description}
                    </p>
                  </div>

                  {/* 活动时间 - 紧凑显示 */}
                  <div className="flex items-center gap-3 text-sm bg-secondary px-4 py-2 rounded-full shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      至 {format(new Date(campaign.endDate), "M月d日", { locale: zhCN })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 活动套餐列表 */}
              <CampaignsClient campaignPlans={campaign.campaignPlans} stores={stores} />

              {/* 活动条款 - 简化显示 */}
              {campaign.terms && (
                <div className="max-w-5xl mx-auto mt-8">
                  <details className="bg-secondary/50 rounded-lg p-4 border">
                    <summary className="font-medium cursor-pointer text-sm">活动条款及说明</summary>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-3 pl-4">
                      {campaign.terms}
                    </p>
                  </details>
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
