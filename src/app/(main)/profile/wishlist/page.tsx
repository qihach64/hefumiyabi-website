import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Heart, ArrowLeft, Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import WishlistClient from "./WishlistClient";

export const metadata = {
  title: "我的心愿单 | 江戸和装工房雅",
  description: "查看和管理您收藏的和服套餐",
};

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/profile/wishlist");
  }

  // 获取用户的套餐收藏
  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      planId: { not: null },
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          originalPrice: true,
          imageUrl: true,
          images: true,
          category: true,
          isActive: true,
          pricingUnit: true,
          unitLabel: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 按套餐分组收藏的图片
  type PlanType = NonNullable<typeof favorites[0]["plan"]>;
  const planFavorites = favorites.reduce((acc, fav) => {
    if (!fav.plan) return acc;

    const planId = fav.planId!;
    if (!acc[planId]) {
      acc[planId] = {
        plan: fav.plan,
        images: [],
        createdAt: fav.createdAt,
      };
    }
    if (fav.imageUrl) {
      acc[planId].images.push(fav.imageUrl);
    }
    return acc;
  }, {} as Record<string, { plan: PlanType; images: string[]; createdAt: Date }>);

  const groupedFavorites = Object.values(planFavorites);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* 返回个人中心 */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回个人中心</span>
          </Link>

          {/* 标题 */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-sakura-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-sakura-600 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                我的心愿单
              </h1>
              <p className="text-gray-600 text-sm">
                {groupedFavorites.length > 0
                  ? `已收藏 ${groupedFavorites.length} 个套餐`
                  : "还没有收藏任何套餐"}
              </p>
            </div>
          </div>

          {/* 收藏列表 */}
          {groupedFavorites.length > 0 ? (
            <WishlistClient initialFavorites={groupedFavorites} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
        <Heart className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        心愿单是空的
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        浏览套餐时点击 ❤️ 按钮，将喜欢的和服收藏到心愿单
      </p>
      <Link
        href="/plans"
        className="inline-flex items-center gap-2 px-6 py-3 bg-sakura-600 hover:bg-sakura-700 text-white rounded-lg font-medium transition-colors"
      >
        探索套餐
      </Link>
    </div>
  );
}
