import Link from "next/link";
import prisma from "@/lib/prisma";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import NavigationButton from "@/components/NavigationButton";

export default async function StoresPage() {
  // 获取所有店铺，按城市分组
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      {
        city: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  // 按城市分组
  const storesByCity = stores.reduce((acc, store) => {
    if (!acc[store.city]) {
      acc[store.city] = [];
    }
    acc[store.city].push(store);
    return acc;
  }, {} as Record<string, typeof stores>);

  return (
    <div className="flex flex-col">
      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">店铺位置</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              东京、京都多处便利位置，让您轻松开启和服体验之旅
            </p>
          </div>
        </div>
      </section>

      {/* 店铺列表 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          {Object.entries(storesByCity).map(([city, cityStores]) => (
            <div key={city} className="mb-16 last:mb-0">
              {/* 城市标题 */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">{city}</h2>
                  <p className="text-sm text-muted-foreground">
                    {cityStores.length} 家店铺
                  </p>
                </div>
              </div>

              {/* 店铺卡片 */}
              <div className="grid md:grid-cols-2 gap-6">
                {cityStores.map((store) => (
                  <Link
                    key={store.id}
                    href={`/stores/${store.slug}`}
                    className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-xl transition-all duration-300"
                  >
                    <div className="p-6">
                      {/* 店铺名称 */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                          {store.name}
                        </h3>
                        {store.nameEn && (
                          <p className="text-sm text-muted-foreground">
                            {store.nameEn}
                          </p>
                        )}
                      </div>

                      {/* 地址 */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium mb-1">
                              {store.address}
                            </p>
                            {store.addressEn && (
                              <p className="text-xs text-muted-foreground">
                                {store.addressEn}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 电话 */}
                        {store.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-sm">
                              {store.phone}
                            </span>
                          </div>
                        )}

                        {/* 邮箱 */}
                        {store.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-sm">
                              {store.email}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <div className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4">
                            查看详情
                          </div>
                        </div>
                        {store.latitude && store.longitude && (
                          <NavigationButton
                            latitude={store.latitude}
                            longitude={store.longitude}
                          />
                        )}
                      </div>
                    </div>

                    {/* 悬浮效果 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 特色服务 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">店铺特色</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              所有店铺均提供完善的服务设施
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">🚉</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">交通便利</h3>
              <p className="text-sm text-muted-foreground">
                所有店铺均位于地铁站附近，交通十分便利
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">👘</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">和服丰富</h3>
              <p className="text-sm text-muted-foreground">
                每家店铺都有上百套精美和服供您选择
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">💇</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">专业服务</h3>
              <p className="text-sm text-muted-foreground">
                专业着装师和发型师为您提供完整服务
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">🎒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">寄存服务</h3>
              <p className="text-sm text-muted-foreground">
                免费提供行李寄存，让您轻松游览
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 预约流程 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">预约流程</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              简单三步，轻松预约和服体验
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">选择店铺</h3>
              <p className="text-sm text-muted-foreground">
                根据您的行程选择最方便的店铺位置
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">在线预约</h3>
              <p className="text-sm text-muted-foreground">
                选择日期、套餐，填写基本信息完成预约
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">到店体验</h3>
              <p className="text-sm text-muted-foreground">
                按预约时间到店，开始您的和服之旅
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
            找到离您最近的店铺了吗？
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            立即预约，开启您的和服体验之旅
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
