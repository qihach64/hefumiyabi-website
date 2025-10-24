import Link from "next/link";
import { Clock, CheckCircle, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function MerchantPendingPage() {
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

  // 如果已通过审核，跳转到dashboard
  if (merchant.status === "APPROVED") {
    redirect("/merchant/dashboard");
  }

  // 如果被拒绝，显示拒绝页面
  if (merchant.status === "REJECTED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-red-200 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            申请未通过
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            很抱歉，您的商家申请未能通过审核。
            如有疑问，请联系客服了解详情。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant/register">
              <Button variant="primary" size="lg" fullWidth>
                重新申请
              </Button>
            </Link>
            <a href="mailto:merchant@hefumiyabi.com">
              <Button variant="secondary" size="lg" fullWidth>
                联系客服
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 审核中状态
  return (
    <div className="min-h-screen bg-gradient-to-br from-sakura-50 via-white to-sakura-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
        {/* 成功图标 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-sakura-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-sakura-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            申请已提交！
          </h1>

          <p className="text-lg text-gray-600">
            感谢您申请成为我们的商家合作伙伴
          </p>
        </div>

        {/* 商家信息卡片 */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">您的商户信息</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">商户名称：</span>
              <span className="text-gray-900 font-medium">{merchant.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">提交时间：</span>
              <span className="text-gray-900 font-medium">
                {new Date(merchant.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">审核状态：</span>
              <span className="inline-flex items-center gap-2 text-amber-600 font-medium">
                <Clock className="w-4 h-4" />
                审核中
              </span>
            </div>
          </div>
        </div>

        {/* 接下来的步骤 */}
        <div className="space-y-4 mb-8">
          <h2 className="font-semibold text-gray-900">接下来会发生什么？</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-sakura-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sakura-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">审核您的资料</h3>
                <p className="text-sm text-gray-600">
                  我们的团队将在2-3个工作日内审核您提交的商户信息和资质
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-sakura-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-sakura-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">接收审核结果</h3>
                <p className="text-sm text-gray-600">
                  审核完成后，我们会通过邮件通知您审核结果
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-sakura-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-sakura-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">开始经营</h3>
                <p className="text-sm text-gray-600">
                  审核通过后，您可以立即发布套餐，开始接收订单
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="bg-sakura-50 border border-sakura-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-sakura-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-sakura-800">
              <p className="font-semibold mb-1">请查收您的邮箱</p>
              <p className="leading-relaxed">
                我们已向 <span className="font-medium">{session.user.email}</span> 发送确认邮件。
                审核期间如需补充资料，我们会通过邮件与您联系。
              </p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/" className="flex-1">
            <Button variant="primary" size="lg" fullWidth>
              返回首页
            </Button>
          </Link>
          <Link href="/profile" className="flex-1">
            <Button variant="secondary" size="lg" fullWidth>
              查看个人中心
            </Button>
          </Link>
        </div>

        {/* 帮助链接 */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">
            有疑问？查看
            <Link href="/help/merchant" className="text-sakura-500 hover:underline mx-1">
              商家帮助中心
            </Link>
            或
            <a href="mailto:merchant@hefumiyabi.com" className="text-sakura-500 hover:underline ml-1">
              联系客服
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
