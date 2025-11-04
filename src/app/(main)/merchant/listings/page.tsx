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

  // 获取所有套餐（包括标签和包含内容）
  const allPlans = await prisma.rentalPlan.findMany({
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

  return <ListingsClient plans={allPlans} merchantId={merchant.id} />;
}
