import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ListingsClient from "./ListingsClient";

export default async function MerchantListingsPage() {
  // 验证登录
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 获取商家信息
  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!merchant) {
    redirect("/merchant/register");
  }

  if (merchant.status !== "APPROVED") {
    redirect("/merchant/pending");
  }

  // 获取该商家的所有套餐（包括标签和包含内容）
  const allPlans = await prisma.rentalPlan.findMany({
    where: {
      merchantId: merchant.id,
    },
    orderBy: [
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      isActive: true,
      isFeatured: true,
      isCampaign: true,
      currentBookings: true,
      createdAt: true,
      duration: true,
      includes: true,
      themeId: true,
      theme: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      planTags: {
        include: {
          tag: {
            select: {
              id: true,
              code: true,
              name: true,
              icon: true,
              color: true,
            },
          },
        },
      },
    },
  });

  // 获取所有可用的主题
  const themes = await prisma.theme.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
    },
  });

  // 获取所有可用的标签（按分类分组）
  const tagCategories = await prisma.tagCategory.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      tags: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
  });

  return (
    <ListingsClient
      plans={allPlans}
      merchantId={merchant.id}
      themes={themes}
      tagCategories={tagCategories}
    />
  );
}
