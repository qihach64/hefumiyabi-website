import Link from "next/link";
import prisma from "@/lib/prisma";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";

export default async function ContactPage() {
  // 获取所有店铺联系方式
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      city: "asc",
    },
  });

  return (
    <div className="flex flex-col">
      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">联系我们</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              我们随时为您服务，期待为您提供最优质的和服体验
            </p>
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="p-6 rounded-lg border bg-card text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">电话咨询</h3>
              <p className="text-sm text-muted-foreground mb-3">
                工作时间：9:00 - 18:00
              </p>
              <p className="text-sm font-medium">请联系各店铺</p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">邮件咨询</h3>
              <p className="text-sm text-muted-foreground mb-3">
                24小时内回复
              </p>
              <p className="text-sm font-medium">info@hefumiyabi.com</p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">在线客服</h3>
              <p className="text-sm text-muted-foreground mb-3">
                即时回复
              </p>
              <p className="text-sm font-medium">微信/LINE</p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">到店咨询</h3>
              <p className="text-sm text-muted-foreground mb-3">
                欢迎直接到店
              </p>
              <Link
                href="/stores"
                className="text-sm font-medium text-primary hover:underline"
              >
                查看店铺
              </Link>
            </div>
          </div>

          {/* 店铺联系方式 */}
          <div>
            <h2 className="text-3xl font-bold text-center mb-12">
              各店铺联系方式
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1">{store.name}</h3>
                    {store.nameEn && (
                      <p className="text-sm text-muted-foreground">
                        {store.nameEn}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">{store.city}</p>
                        <p className="text-muted-foreground">
                          {store.address}
                        </p>
                      </div>
                    </div>

                    {store.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary shrink-0" />
                        <p className="text-sm">{store.phone}</p>
                      </div>
                    )}

                    {store.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary shrink-0" />
                        <p className="text-sm">{store.email}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <Link
                        href={`/stores/${store.slug}`}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        查看店铺详情 →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 营业时间 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">营业时间</h2>
              <p className="text-muted-foreground">
                所有店铺营业时间相同
              </p>
            </div>

            <div className="rounded-lg border bg-card p-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">标准营业时间</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="font-medium">周一至周五</span>
                  <span className="text-muted-foreground">9:00 - 18:00</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="font-medium">周六、周日</span>
                  <span className="text-muted-foreground">9:00 - 19:00</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="font-medium">节假日</span>
                  <span className="text-muted-foreground">9:00 - 19:00</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="font-medium">定休日</span>
                  <span className="text-muted-foreground">无</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>* 最后入店时间为闭店前1小时</p>
                  <p>* 部分节假日营业时间可能调整，请提前确认</p>
                  <p>* 如遇特殊情况临时休息，会在官网提前公告</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">常见问题</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              以下是一些客户常问的问题
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">如何预约？</h3>
              <p className="text-sm text-muted-foreground">
                您可以通过官网在线预约、电话预约或直接到店预约。建议提前2天以上预约以确保有合适的和服可选。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">可以取消或改期吗？</h3>
              <p className="text-sm text-muted-foreground">
                可以。预约日前3天取消可全额退款，3天内取消将扣除30%手续费。改期请提前联系我们。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">支持哪些支付方式？</h3>
              <p className="text-sm text-muted-foreground">
                支持现金、信用卡（Visa、MasterCard、JCB）、支付宝、微信支付等多种支付方式。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">提供外语服务吗？</h3>
              <p className="text-sm text-muted-foreground">
                是的，我们提供中文、英语、日语等多语言服务。工作人员会热情为您服务。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">可以延长租赁时间吗？</h3>
              <p className="text-sm text-muted-foreground">
                可以。如需延长租赁时间，请在还和服前告知工作人员。延长费用会根据套餐类型计算。
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">雨天可以租和服吗？</h3>
              <p className="text-sm text-muted-foreground">
                可以。我们提供雨伞和防水罩。但暴雨天可能影响体验，建议改期或联系我们咨询。
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              还有其他问题？欢迎随时联系我们
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              立即预约
            </Link>
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
            立即联系我们，开启您的和服体验之旅
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-background text-foreground hover:bg-background/90 h-11 px-8"
            >
              立即预约
            </Link>
            <Link
              href="/stores"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 h-11 px-8"
            >
              查看店铺
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
