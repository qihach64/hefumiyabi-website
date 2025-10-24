import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

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
      <div className="container py-8">
        {/* 返回按钮 */}
        <Link href="/merchant/listings" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
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

        {/* 占位内容 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-sakura-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              套餐发布功能
            </h2>
            <p className="text-gray-600 mb-6">
              此功能正在开发中，敬请期待...
            </p>
            <Link href="/merchant/listings">
              <Button variant="primary" size="lg">
                返回套餐列表
              </Button>
            </Link>
          </div>

          {/* 功能预告 */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">即将推出的功能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sakura-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sakura-600">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">套餐基本信息</p>
                  <p className="text-sm text-gray-600">名称、描述、类别、价格</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sakura-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sakura-600">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">图片上传</p>
                  <p className="text-sm text-gray-600">上传套餐图片和和服照片</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sakura-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sakura-600">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">服务内容</p>
                  <p className="text-sm text-gray-600">包含的服务和附加项</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sakura-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sakura-600">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">可用时间设置</p>
                  <p className="text-sm text-gray-600">设置可预订的时间范围</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
