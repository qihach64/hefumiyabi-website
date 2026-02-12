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
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      isActive: true,
      isFeatured: true,
      isCampaign: true,
      createdAt: true,
      duration: true,
      themeId: true,
      planComponents: {
        select: {
          merchantComponent: {
            select: {
              customName: true,
              template: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { hotmapOrder: "asc" },
      },
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

  // 将 planComponents 转换为 includes（展示用字符串数组）
  const plansWithIncludes = allPlans.map((plan) => ({
    ...plan,
    includes: plan.planComponents.map(
      (pc) => pc.merchantComponent.template?.name || pc.merchantComponent.customName || "服务"
    ),
    planComponents: undefined,
  }));

  return (
    <ListingsClient
      plans={plansWithIncludes}
      merchantId={merchant.id}
      themes={themes}
      tagCategories={tagCategories}
    />
  );
}
