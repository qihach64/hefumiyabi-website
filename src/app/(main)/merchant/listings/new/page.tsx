import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PlanCreateForm from "@/components/merchant/PlanCreateForm";

export default async function NewListingPage() {
  // 验证登录
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 获取商家信息
  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!merchant || merchant.status !== "APPROVED") {
    redirect("/merchant/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-5xl">
        {/* 返回按钮 */}
        <Link
          href="/merchant/listings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回套餐列表
        </Link>

        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            发布新套餐
          </h1>
          <p className="text-gray-600">创建和服租赁体验套餐</p>
        </div>

        {/* 创建表单 */}
        <PlanCreateForm />
      </div>
    </div>
  );
}
