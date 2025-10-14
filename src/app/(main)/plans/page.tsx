import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { Check, Clock, MapPin, Users } from "lucide-react";

export default async function PlansPage() {
  // 获取所有租赁套餐，按价格排序
  const plans = await prisma.rentalPlan.findMany({
    orderBy: [
      {
        price: "asc",
      },
    ],
  });

  // 获取活跃的优惠活动
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      endDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      priority: "desc",
    },
    take: 1,
  });

  // 特色套餐（使用真实图片）
  const featuredPlans = [
    {
      id: "daily-special",
      name: "每日特惠和服套餐",
      nameEn: "Special Daily Discount Kimono Plan",
      price: 3000,
      originalPrice: 5000,
      image:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/cdff65bedb063563c91e3ff6fe56e2004faee1b0-1092x1472.png",
      description: "每日5000日元套餐，包含20套简约设计，特别适合中老年女性",
      features: [
        "在线预订专享优惠",
        "包含专业着装服务",
        "免费发型设计",
        "20套和服可选",
        "东京浅草各店铺可用",
      ],
      location: "东京浅草店",
      duration: "4-8小时",
      gender: "仅限女性",
    },
    {
      id: "couple-plan",
      name: "情侣优惠套餐",
      nameEn: "Couple Discount Plan",
      price: 8999,
      originalPrice: 11000,
      image:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/5dd1195b6e98cb17cfaf210b018dc5d9582b574f-1066x1314.png",
      description: "最受欢迎的情侣套餐，包含蕾丝和服",
      features: [
        "一男一女情侣套装",
        "包含蕾丝和服",
        "免费发型设计",
        "专业着装服务",
        "京都清水寺店可用",
      ],
      location: "京都清水寺店",
      duration: "全天",
      gender: "情侣专享",
    },
    {
      id: "group-plan",
      name: "5人团体优惠套餐",
      nameEn: "Group Discount Plan",
      price: 20000,
      originalPrice: 27500,
      image:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/d053820a53f8883cdc0debb7307375b260d383ab-1718x1714.png",
      description: "5人团体套餐，清水寺附近，一人免费",
      features: [
        "5人团体优惠价",
        "一人免费",
        "免费发型设计",
        "专业着装服务",
        "清水寺附近便利位置",
      ],
      location: "京都清水寺店",
      duration: "全天",
      gender: "团体专享",
    },
    {
      id: "furisode-photo",
      name: "10周年振袖套餐+60分钟摄影",
      nameEn: "Premier Furisode Kimono Plan with Photo",
      price: 38000,
      originalPrice: 58000,
      image:
        "https://cdn.sanity.io/images/u9jvdp7a/staging/2c5c377c69c7d60f41b052db2fdcfc955ff32437-1260x1536.png",
      description: "可爱时尚的设计，最新款式助您找到完美和服",
      features: [
        "60分钟专业摄影",
        "最新款振袖和服",
        "专业化妆发型",
        "精美照片成品",
        "10周年特别优惠",
      ],
      location: "东京浅草店",
      duration: "全天",
      gender: "女性专享",
      isSpecial: true,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* 活动横幅 */}
      {activeCampaigns.length > 0 && (
        <Link
          href="/campaigns"
          className="block bg-gradient-to-r from-rose-600 via-pink-600 to-orange-600 text-white hover:from-rose-700 hover:via-pink-700 hover:to-orange-700 transition-all"
        >
          <div className="container py-4 md:py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                    <span className="text-2xl md:text-3xl">🎊</span>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-xs md:text-sm font-semibold opacity-90 mb-1">
                    {activeCampaigns[0].subtitle}
                  </div>
                  <div className="text-lg md:text-2xl font-black">
                    {activeCampaigns[0].title}
                  </div>
                  <div className="text-sm md:text-base opacity-95 mt-1">
                    在线预订享受{" "}
                    <span className="text-yellow-300 font-bold text-lg">
                      最高50%
                    </span>{" "}
                    折扣
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full bg-white text-rose-600 font-bold text-sm md:text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <span>立即查看</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">租赁套餐</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              精心设计的套餐方案，满足您不同场景的需求。从经济实惠到豪华体验，总有一款适合您。
            </p>
          </div>
        </div>
      </section>

      {/* 特色套餐展示 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">热门套餐</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              在线预订专享优惠，提前预约锁定心仪套餐
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {featuredPlans.map((plan) => (
              <div
                key={plan.id}
                className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-xl transition-all duration-300"
              >
                {/* 特别标签 */}
                {plan.isSpecial && (
                  <div className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg">
                    10周年特惠
                  </div>
                )}

                <div className="grid md:grid-cols-5 gap-6">
                  {/* 图片区域 */}
                  <div className="md:col-span-2 relative aspect-[3/4] md:aspect-auto overflow-hidden bg-secondary">
                    <Image
                      src={plan.image}
                      alt={plan.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  </div>

                  {/* 内容区域 */}
                  <div className="md:col-span-3 p-6">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.nameEn}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-primary">
                          ¥{plan.price.toLocaleString()}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-lg text-muted-foreground line-through">
                            ¥{plan.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {plan.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {plan.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {plan.gender}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/booking?plan=${plan.id}`}
                      className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                    >
                      选择此套餐
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 数据库中的套餐（如果有） */}
      {plans.length > 0 && (
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                更多套餐选择
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                灵活的套餐组合，满足您的个性化需求
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {plan.category === "BASIC"
                        ? "基础套餐"
                        : plan.category === "STANDARD"
                        ? "标准套餐"
                        : plan.category === "PREMIUM"
                        ? "高级套餐"
                        : "豪华套餐"}
                    </span>
                    <h3 className="text-xl font-bold mt-2 mb-1">{plan.name}</h3>
                    {plan.nameEn && (
                      <p className="text-sm text-muted-foreground">
                        {plan.nameEn}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">
                        ¥{plan.price.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/人</span>
                    </div>
                    {plan.duration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.duration}
                      </p>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/booking?plan=${plan.id}`}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                  >
                    选择此套餐
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 套餐特色 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">套餐特色</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              所有套餐均包含以下基础服务
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">👘</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">专业着装</h3>
              <p className="text-sm text-muted-foreground">
                专业着装师为您提供完整的和服着装服务
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">💇</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">免费发型</h3>
              <p className="text-sm text-muted-foreground">
                所有套餐均包含免费的发型设计服务
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">配件齐全</h3>
              <p className="text-sm text-muted-foreground">
                包含腰带、足袋、草履等全套配件
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">在线优惠</h3>
              <p className="text-sm text-muted-foreground">
                在线预订享受专属优惠价格
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 常见问题 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">常见问题</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-2">如何选择合适的套餐？</h3>
              <p className="text-sm text-muted-foreground">
                根据您的预算、使用时长和对服务的需求来选择。情侣推荐情侣套餐，团体推荐团体套餐。如需帮助，可联系我们的客服。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-2">在线预订有什么优惠？</h3>
              <p className="text-sm text-muted-foreground">
                在线预订可享受最高40%的优惠折扣，需提前支付定金。建议提前预订以获得更好的价格。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-2">套餐包含哪些服务？</h3>
              <p className="text-sm text-muted-foreground">
                所有套餐都包含和服租赁、专业着装、免费发型设计和全套配件。部分高级套餐还包含摄影服务。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-2">可以延长租赁时间吗？</h3>
              <p className="text-sm text-muted-foreground">
                可以。如需延长租赁时间，请提前告知店员。延长费用会根据套餐类型和延长时长计算。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0tNCAyOGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="container text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备好体验和服之美了吗？
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            选择适合您的套餐，立即预约，开启难忘的和服体验之旅
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-background text-foreground hover:bg-background/90 h-11 px-8"
            >
              立即预约
            </Link>
            <Link
              href="/kimonos"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 h-11 px-8"
            >
              浏览和服
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
