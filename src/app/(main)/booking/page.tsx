import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CreditCard,
  CheckCircle,
} from "lucide-react";

export default async function BookingPage() {
  // 获取所有店铺
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      city: "asc",
    },
  });

  // 获取所有套餐
  const plans = await prisma.rentalPlan.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      price: "asc",
    },
  });

  return (
    <div className="flex flex-col">
      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">在线预约</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              轻松三步完成预约，开启您的和服体验之旅
            </p>
          </div>
        </div>
      </section>

      {/* 预约流程 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">预约流程</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              简单快捷的预约流程，让您轻松预订和服体验
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">选择套餐和店铺</h3>
              <p className="text-sm text-muted-foreground">
                根据您的需求选择合适的套餐和便利的店铺位置
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">填写预约信息</h3>
              <p className="text-sm text-muted-foreground">
                填写您的联系方式和租赁日期等基本信息
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">确认预约</h3>
              <p className="text-sm text-muted-foreground">
                提交预约后我们会在24小时内与您确认
              </p>
            </div>
          </div>

          {/* 预约表单占位符 */}
          <div className="max-w-3xl mx-auto">
            <div className="rounded-lg border bg-card p-8 md:p-12">
              <h3 className="text-2xl font-bold mb-6">预约信息</h3>

              {/* 提示：实际的表单需要客户端组件 */}
              <div className="space-y-6">
                <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-4">
                    <Calendar className="w-6 h-6 text-primary mt-1 shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-2">选择日期和套餐</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        请先浏览我们的套餐和店铺，了解详细信息后再进行预约
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href="/plans"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
                        >
                          查看套餐
                        </Link>
                        <Link
                          href="/stores"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
                        >
                          查看店铺
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 可用店铺快速预览 */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    可用店铺
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {stores.map((store) => (
                      <Link
                        key={store.id}
                        href={`/stores/${store.slug}`}
                        className="p-4 rounded-lg border bg-background hover:bg-accent transition-colors"
                      >
                        <div className="font-medium mb-1">{store.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {store.city}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {store.address}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 热门套餐快速预览 */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    热门套餐
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {plans.slice(0, 4).map((plan) => (
                      <Link
                        key={plan.id}
                        href={`/plans`}
                        className="p-4 rounded-lg border bg-background hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm font-semibold text-primary">
                            ¥{(plan.price / 100).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {plan.category === "LADIES"
                            ? "女士套餐"
                            : plan.category === "MENS"
                            ? "男士套餐"
                            : plan.category === "COUPLE"
                            ? "情侣套餐"
                            : plan.category === "GROUP"
                            ? "团体套餐"
                            : plan.category === "FAMILY"
                            ? "家庭套餐"
                            : "特别套餐"}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {plan.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 预约须知 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">预约须知</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-lg bg-card border">
              <div className="flex items-start gap-4 mb-4">
                <Calendar className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">预约时间</h3>
                  <p className="text-sm text-muted-foreground">
                    建议至少提前2天预约，旺季（樱花季、红叶季）建议提前1-2周预约以确保有合适的和服可选。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card border">
              <div className="flex items-start gap-4 mb-4">
                <Clock className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">租赁时长</h3>
                  <p className="text-sm text-muted-foreground">
                    标准租赁时长为8小时，需在当日闭店前归还。如需延长，请提前告知工作人员并支付延长费用。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card border">
              <div className="flex items-start gap-4 mb-4">
                <CreditCard className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">支付方式</h3>
                  <p className="text-sm text-muted-foreground">
                    支持现金、信用卡、支付宝、微信支付。在线预约可享受优惠价格，部分套餐需支付定金。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card border">
              <div className="flex items-start gap-4 mb-4">
                <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">取消政策</h3>
                  <p className="text-sm text-muted-foreground">
                    预约日前3天取消可全额退款，3天内取消将扣除30%手续费，当天取消或未到店定金不予退还。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 常见问题 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              预约常见问题
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">需要带什么东西吗？</h3>
              <p className="text-sm text-muted-foreground">
                无需准备任何东西，我们提供和服、腰带、足袋、草履等全套配件。建议携带相机记录美好时刻。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">着装需要多长时间？</h3>
              <p className="text-sm text-muted-foreground">
                专业着装师会为您服务，女士着装约需30分钟，男士约需20分钟。发型设计约需20-30分钟。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">可以选择和服款式吗？</h3>
              <p className="text-sm text-muted-foreground">
                可以的。到店后工作人员会根据您的喜好、身材、肤色推荐合适的和服，您可以自由选择喜欢的款式。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">下雨天可以穿和服吗？</h3>
              <p className="text-sm text-muted-foreground">
                可以，我们提供雨伞和防水罩。但建议查看天气预报，暴雨天可能影响体验，可联系我们改期。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">可以在异地还和服吗？</h3>
              <p className="text-sm text-muted-foreground">
                部分店铺支持异地还和服服务，需提前预约并支付额外费用。详情请咨询客服。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">儿童可以租和服吗？</h3>
              <p className="text-sm text-muted-foreground">
                可以。我们提供儿童和服租赁服务，适合3-12岁儿童。家庭套餐包含儿童和服。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0tNCAyOGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="container text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            还有疑问？联系我们
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            我们的客服团队随时为您服务，帮助您完成预约
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-background text-foreground hover:bg-background/90 h-11 px-8"
            >
              联系我们
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
