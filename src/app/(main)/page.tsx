import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";

export default async function HomePage() {
  // 获取精选套餐图片用于展示
  const featuredPlans = await prisma.rentalPlan.findMany({
    take: 12,
    where: {
      isActive: true,
      imageUrl: {
        not: null,
      },
    },
    orderBy: [
      { isCampaign: 'desc' },
      { price: 'asc' },
    ],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      slug: true,
      price: true,
    },
  });

  return (
    <div className="min-h-screen">
      {/* Compact Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            江户和装工房雅
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-6">
            浅草、上野、京都的和服租赁店
          </p>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            体验传统日式和服之美，留下难忘的东京、京都记忆
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/plans"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-8 py-3 text-base font-semibold shadow-lg hover:bg-primary/90 transition-all"
            >
              浏览和服套餐
            </Link>
            <Link
              href="/booking"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border-2 border-primary text-primary px-8 py-3 text-base font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
            >
              立即预约
            </Link>
          </div>

          {/* Social Media Links */}
          <div className="flex gap-6 justify-center items-center pt-4">
            <a
              href="https://www.instagram.com/kimonomiyabi/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Instagram</span>
            </a>
            <a
              href="https://www.facebook.com/kimonomiyabi77/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Facebook</span>
            </a>
            <a
              href="https://www.weibo.com/mymiyabi"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.63 18.36c-2.77 0-5.02-1.78-5.02-3.97 0-2.19 2.25-3.97 5.02-3.97s5.02 1.78 5.02 3.97c0 2.19-2.25 3.97-5.02 3.97zm0-6.5c-1.94 0-3.52 1.12-3.52 2.5s1.58 2.5 3.52 2.5 3.52-1.12 3.52-2.5-1.58-2.5-3.52-2.5zm11.43-2.63c-.55-.28-1.02-.47-1.02-.8 0-.28.3-.49.7-.49.55 0 .96.28 1.02.7h1.05c-.08-.94-.88-1.58-2.07-1.58-1.11 0-2.03.64-2.03 1.58 0 .86.66 1.3 1.52 1.68.63.28 1.19.49 1.19.94 0 .36-.36.64-.86.64-.66 0-1.13-.36-1.19-.86h-1.08c.08 1.08.97 1.74 2.27 1.74 1.27 0 2.16-.72 2.16-1.74 0-.97-.75-1.47-1.66-1.81z"/>
              </svg>
              <span className="hidden sm:inline text-sm font-medium">微博</span>
            </a>
          </div>
        </div>
      </section>

      {/* Instagram-style Gallery Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              客户的真实体验
            </h2>
            <p className="text-muted-foreground">
              在 Instagram 上关注我们，查看更多精彩内容
            </p>
          </div>

          {/* Image Grid - Instagram style */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 max-w-6xl mx-auto">
            {featuredPlans.map((plan, index) => (
              <Link
                key={plan.id}
                href={`/plans/${plan.slug}`}
                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
              >
                {plan.imageUrl && (
                  <Image
                    src={plan.imageUrl}
                    alt={plan.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Instagram CTA */}
          <div className="text-center mt-8">
            <a
              href="https://www.instagram.com/kimonomiyabi/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              在 Instagram 上关注我们
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link
              href="/plans"
              className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">和服套餐</h3>
              <p className="text-muted-foreground mb-3">
                传统和服、振袖、浴衣等多种款式
              </p>
              <span className="text-primary font-medium group-hover:underline">
                查看详情 →
              </span>
            </Link>

            <Link
              href="/campaigns"
              className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">优惠活动</h3>
              <p className="text-muted-foreground mb-3">
                10周年优惠，多种套餐特惠
              </p>
              <span className="text-primary font-medium group-hover:underline">
                查看详情 →
              </span>
            </Link>

            <Link
              href="/stores"
              className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">店铺地址</h3>
              <p className="text-muted-foreground mb-3">
                浅草本店、浅草站前店、京都清水寺店
              </p>
              <span className="text-primary font-medium group-hover:underline">
                查看详情 →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
