import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  MapPin,
  Phone,
  Mail,
  Navigation,
  ChevronRight,
} from "lucide-react";

interface StorePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  // 获取店铺信息
  const store = await prisma.store.findUnique({
    where: {
      slug,
    },
  });

  if (!store) {
    notFound();
  }

  // 营业时间示例数据（后续可以从 openingHours JSON 字段读取）
  const businessHours = [
    { day: "周一至周五", hours: "9:00 - 18:00" },
    { day: "周六、周日", hours: "9:00 - 19:00" },
    { day: "节假日", hours: "9:00 - 19:00" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-secondary via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-12 md:py-16">
          {/* 面包屑导航 */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link
              href="/"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              首页
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link
              href="/stores"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              店铺位置
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{store.name}</span>
          </nav>

          {/* 店铺标题 */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              {store.city}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {store.name}
            </h1>
            {store.nameEn && (
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                {store.nameEn}
              </p>
            )}
            <Link
              href={`/booking?store=${store.slug}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              预约此店铺
            </Link>
          </div>
        </div>
      </section>

      {/* 店铺详情 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* 左侧：详细信息 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 联系方式 */}
              <div>
                <h2 className="text-2xl font-bold mb-6">联系方式</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">地址</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {store.address}
                      </p>
                      {store.addressEn && (
                        <p className="text-xs text-muted-foreground">
                          {store.addressEn}
                        </p>
                      )}
                    </div>
                  </div>

                  {store.phone && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                      <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">电话</h3>
                        <p className="text-sm text-muted-foreground">
                          {store.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {store.email && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                      <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">邮箱</h3>
                        <p className="text-sm text-muted-foreground">
                          {store.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 营业时间 */}
              <div>
                <h2 className="text-2xl font-bold mb-6">营业时间</h2>
                <div className="p-6 rounded-lg bg-card border">
                  <div className="space-y-3">
                    {businessHours.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span className="text-sm font-medium">{item.day}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      * 最后入店时间为闭店前1小时
                    </p>
                    <p className="text-xs text-muted-foreground">
                      * 部分节假日营业时间可能调整，请提前确认
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* 右侧：地图和快捷操作 */}
            <div className="space-y-6">
              {/* 地图 */}
              {store.latitude && store.longitude && (
                <div className="sticky top-24">
                  <div className="rounded-lg overflow-hidden border bg-card">
                    <div className="aspect-square bg-secondary relative">
                      {/* Google Maps 静态地图 */}
                      <Image
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${store.latitude},${store.longitude}&zoom=15&size=600x600&markers=color:red%7C${store.latitude},${store.longitude}&key=YOUR_API_KEY`}
                        alt={`${store.name} 地图`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {/* 占位符 - 实际使用时需要替换为真实的 Google Maps API Key */}
                      <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            地图加载中...
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                      >
                        <Navigation className="w-4 h-4" />
                        在 Google 地图中打开
                      </a>
                      <Link
                        href={`/booking?store=${store.slug}`}
                        className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                      >
                        预约此店铺
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 店铺特色 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">店铺特色</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-lg bg-card border text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">👘</span>
              </div>
              <h3 className="font-semibold mb-2">和服丰富</h3>
              <p className="text-sm text-muted-foreground">
                上百套精美和服，款式风格应有尽有
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">💇</span>
              </div>
              <h3 className="font-semibold mb-2">专业服务</h3>
              <p className="text-sm text-muted-foreground">
                专业着装师和发型师全程服务
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🎒</span>
              </div>
              <h3 className="font-semibold mb-2">免费寄存</h3>
              <p className="text-sm text-muted-foreground">
                提供免费行李寄存服务
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="font-semibold mb-2">多语言</h3>
              <p className="text-sm text-muted-foreground">
                提供中文、英语、日语服务
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 其他店铺推荐 */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              其他{store.city}店铺
            </h2>
            <p className="text-muted-foreground">
              探索更多便利的店铺位置
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/stores"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
            >
              查看全部店铺
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
