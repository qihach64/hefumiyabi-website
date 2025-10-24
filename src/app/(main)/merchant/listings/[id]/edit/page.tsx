import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PlanEditForm from "@/components/merchant/PlanEditForm";

interface EditListingPageProps {
  params: {
    id: string;
  };
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;

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

  // 获取套餐信息
  const plan = await prisma.rentalPlan.findUnique({
    where: { id },
  });

  if (!plan) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-5xl">
        {/* 返回按钮 */}
        <Link href="/merchant/listings" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回套餐列表
        </Link>

        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            编辑套餐
          </h1>
          <p className="text-gray-600">{plan.name}</p>
        </div>

        {/* 编辑表单 */}
        <PlanEditForm plan={plan} />
      </div>
    </div>
  );
}
