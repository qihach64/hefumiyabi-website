import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { MapPin, Clock, Users, Star } from "lucide-react";

export default async function HomePage() {
  // 获取特色和服（最新的 6 套）
  const featuredKimonos = await prisma.kimono.findMany({
    include: {
      images: {
        orderBy: {
          order: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  // 获取热门套餐（前 3 个）
  const popularPlans = await prisma.rentalPlan.findMany({
    orderBy: {
      createdAt: "asc",
    },
    take: 3,
  });

  // 获取店铺信息
  const stores = await prisma.store.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex flex-col">
      {/* Hero Section - 优雅的横幅 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              江戸和装工房雅
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              体验传统日本文化，感受和服之美
            </p>
            <p className="text-base md:text-lg text-muted-foreground/80 mb-8 leading-relaxed">
              东京、京都专业和服租赁服务，为您打造难忘的日本文化体验之旅
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/kimonos"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
              >
                浏览和服图库
              </Link>
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-primary/20 bg-background hover:bg-primary/5 h-11 px-8"
              >
                立即预约
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100+</div>
              <div className="text-sm text-muted-foreground">精选和服</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">5</div>
              <div className="text-sm text-muted-foreground">便利店铺</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">服务客户</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">4.9</div>
              <div className="text-sm text-muted-foreground">用户评分</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Kimonos Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">精选和服</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              从传统到现代，我们精心挑选每一套和服，让您在特殊时刻绽放光彩
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredKimonos.map((kimono) => {
              const mainImage = kimono.images[0];
              return (
                <Link
                  key={kimono.id}
                  href={`/kimonos/${kimono.id}`}
                  className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                    {mainImage ? (
                      <Image
                        src={mainImage.url}
                        alt={mainImage.alt || kimono.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        暂无图片
                      </div>
                    )}
                    {!kimono.isAvailable && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-semibold">
                        已租出
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {kimono.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{kimono.style}</p>
                    <div className="flex flex-wrap gap-1">
                      {kimono.color.slice(0, 3).map((color) => (
                        <span
                          key={color}
                          className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/kimonos"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
            >
              查看全部和服
            </Link>
          </div>
        </div>
      </section>

      {/* Rental Plans Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">热门租赁套餐</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              灵活的套餐选择，满足您的不同需求和预算
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {popularPlans.map((plan) => (
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
                  <h3 className="text-2xl font-bold mt-2 mb-1">{plan.name}</h3>
                  {plan.nameEn && (
                    <p className="text-sm text-muted-foreground">{plan.nameEn}</p>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">¥{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground">/人</span>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {plan.description}
                  </p>
                )}

                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href="/booking"
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                >
                  选择此套餐
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
            >
              查看全部套餐
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">为什么选择我们</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              专业的服务团队，优质的和服选择，让您的体验更加完美
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">👘</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">精选和服</h3>
              <p className="text-muted-foreground text-sm">
                百余款精美和服，从传统到现代风格应有尽有
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">专业服务</h3>
              <p className="text-muted-foreground text-sm">
                专业和服着装师提供完整的着装和造型服务
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">便利位置</h3>
              <p className="text-muted-foreground text-sm">
                东京、京都等多处店铺，交通便利易达
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">灵活租期</h3>
              <p className="text-muted-foreground text-sm">
                多种租赁时长可选，满足不同场景需求
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stores Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">我们的店铺</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              东京、京都多处便利位置，让您轻松开启和服体验之旅
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.slug}`}
                className="group rounded-lg border bg-card p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mb-1">
                      {store.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{store.city}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {store.address}
                </p>

                {store.businessHours && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{store.businessHours}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/stores"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
            >
              查看全部店铺
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0tNCAyOGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="container text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备开始您的和服体验之旅？
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            立即预约，让我们为您打造难忘的日本文化体验
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
