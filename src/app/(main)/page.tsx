import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import SocialPostCard from "@/components/SocialPostCard";
import HeroSearchBar from "@/components/HeroSearchBar";
import { Button } from "@/components/ui";
import { SocialPlatform } from "@prisma/client";
import { Sparkles, MapPin, Tag } from "lucide-react";

export default async function HomePage() {
  // 获取精选的社交媒体帖子
  let socialPosts = await prisma.socialPost
    .findMany({
      where: {
        isFeatured: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
      take: 6,
    })
    .catch(() => []); // 如果数据库出错，返回空数组

  // 如果没有帖子，使用模拟数据作为示例
  if (socialPosts.length === 0) {
    socialPosts = [
      {
        id: "demo_1",
        platform: SocialPlatform.INSTAGRAM,
        postId: "demo_ig_1",
        postUrl: "https://www.instagram.com/kimonomiyabi/",
        content: "今天的和服体验太棒了！浅草的秋天真美 🍂 感谢江户和装工房雅的专业服务，让我们度过了难忘的一天。",
        images: ["https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2Fae93ec3d5c6338e35e2a511165993cab7582afde-1340x1710.png%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100"],
        authorName: "小美的东京之旅",
        authorAvatar: null,
        likes: 324,
        comments: 28,
        shares: 12,
        postedAt: new Date("2024-11-15T10:30:00Z"),
        scrapedAt: new Date(),
        isFeatured: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo_2",
        platform: SocialPlatform.INSTAGRAM,
        postId: "demo_ig_2",
        postUrl: "https://www.instagram.com/kimonomiyabi/",
        content: "振袖真的太美了！第一次穿这么正式的和服，感觉自己像公主一样 👘✨",
        images: ["https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2F76902bff15f5be0c2a31fc77bd08d3e51ee0fbcb-820x1292.png%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100"],
        authorName: "Yuki_Tokyo",
        authorAvatar: null,
        likes: 567,
        comments: 45,
        shares: 23,
        postedAt: new Date("2024-11-14T14:20:00Z"),
        scrapedAt: new Date(),
        isFeatured: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo_3",
        platform: SocialPlatform.FACEBOOK,
        postId: "demo_fb_1",
        postUrl: "https://www.facebook.com/kimonomiyabi77/",
        content: "和朋友一起来京都清水寺穿和服，工作人员很专业，帮我们选了最适合的款式。拍照效果超棒！",
        images: ["https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2Fd23ed1e8913acfba76528621ed8f3fa0b7a0dc0f-1334x1628.png%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100"],
        authorName: "京都旅游攻略",
        authorAvatar: null,
        likes: 892,
        comments: 67,
        shares: 45,
        postedAt: new Date("2024-11-13T16:45:00Z"),
        scrapedAt: new Date(),
        isFeatured: true,
        displayOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo_4",
        platform: SocialPlatform.WEIBO,
        postId: "demo_wb_1",
        postUrl: "https://www.weibo.com/mymiyabi",
        content: "姐妹们！强烈推荐这家和服店！价格实惠，款式多，服务好。我们选的情侣套餐，拍了好多美照 📸",
        images: ["https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2F392ef8ae7e6c97b6ce5c2efb25a059fd21d97a2c-1214x1634.png%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100"],
        authorName: "日本旅行小助手",
        authorAvatar: null,
        likes: 1234,
        comments: 98,
        shares: 67,
        postedAt: new Date("2024-11-12T09:15:00Z"),
        scrapedAt: new Date(),
        isFeatured: true,
        displayOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo_5",
        platform: SocialPlatform.INSTAGRAM,
        postId: "demo_ig_3",
        postUrl: "https://www.instagram.com/kimonomiyabi/",
        content: "蕾丝和服真的太独特了！和传统和服不一样的感觉，拍照超美 💕",
        images: ["https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2F42916d1b177ca5754edc6ed2ed24d748b3e7f04f-600x400.jpg%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100"],
        authorName: "travel_with_momo",
        authorAvatar: null,
        likes: 445,
        comments: 32,
        shares: 18,
        postedAt: new Date("2024-11-11T11:30:00Z"),
        scrapedAt: new Date(),
        isFeatured: true,
        displayOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "demo_6",
        platform: SocialPlatform.FACEBOOK,
        postId: "demo_fb_2",
        postUrl: "https://www.facebook.com/kimonomiyabi77/",
        content: "带妈妈一起穿和服，她说这是最难忘的生日礼物 ❤️ 工房雅的服务真的很贴心！",
        images: ["https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2Fa0c450b07e897b55982345da50b36c28af0f6f0e-600x400.jpg%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100"],
        authorName: "Sarah Chen",
        authorAvatar: null,
        likes: 678,
        comments: 54,
        shares: 29,
        postedAt: new Date("2024-11-10T15:00:00Z"),
        scrapedAt: new Date(),
        isFeatured: true,
        displayOrder: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - 平台风格 + 大搜索框 */}
      <section className="relative bg-gradient-to-br from-sakura-50 via-white to-sakura-50 overflow-hidden">
        {/* 樱花装饰图案 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-16 md:py-24 lg:py-32">
          <div className="text-center max-w-5xl mx-auto">
            {/* 平台标题 - Airbnb风格 */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight text-gray-900">
              发现日本传统和服之美
            </h1>

            {/* 副标题 - 强调平台角色 */}
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              连接优质和服商家，开启您的和服体验之旅
            </p>

            {/* 大搜索框 - Airbnb风格 */}
            <div className="mb-16">
              <HeroSearchBar />
            </div>

            {/* 辅助信息 */}
            <p className="text-sm text-gray-500">
              东京浅草 · 京都清水寺 · 专业商家 · 安全预订
            </p>
          </div>
        </div>
      </section>

      {/* Social Media Posts Section - Airbnb 风格网格 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          {/* 标题区域 */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              客户的真实体验
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              来自 Instagram、Facebook 和微博的真实分享
            </p>
          </div>

          {/* Social Posts Grid - Airbnb 风格间距 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {socialPosts.map((post) => (
              <SocialPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links Section - Airbnb 风格卡片 */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 和服套餐卡片 */}
            <Link
              href="/plans"
              className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
            >
              <div className="p-8">
                <div className="w-14 h-14 mb-6 rounded-xl bg-sakura-100 flex items-center justify-center group-hover:bg-sakura-200 transition-colors">
                  <Sparkles className="w-7 h-7 text-sakura-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">和服套餐</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  传统和服、振袖、浴衣等多种款式，专业着装师为您服务
                </p>
                <span className="inline-flex items-center gap-2 text-sakura-600 font-semibold group-hover:gap-3 transition-all">
                  查看详情
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
              {/* 悬浮装饰 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-sakura-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            </Link>

            {/* 优惠活动卡片 */}
            <Link
              href="/campaigns"
              className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
            >
              <div className="p-8">
                <div className="w-14 h-14 mb-6 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Tag className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">优惠活动</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  10周年特惠，多种套餐限时优惠，最高享50%折扣
                </p>
                <span className="inline-flex items-center gap-2 text-sakura-600 font-semibold group-hover:gap-3 transition-all">
                  查看详情
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
              {/* 悬浮装饰 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            </Link>

            {/* 店铺地址卡片 */}
            <Link
              href="/stores"
              className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
            >
              <div className="p-8">
                <div className="w-14 h-14 mb-6 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <MapPin className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">店铺地址</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  浅草本店、浅草站前店、京都清水寺店，交通便利
                </p>
                <span className="inline-flex items-center gap-2 text-sakura-600 font-semibold group-hover:gap-3 transition-all">
                  查看详情
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
              {/* 悬浮装饰 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
