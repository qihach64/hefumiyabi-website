import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Calendar, Mail, Phone } from "lucide-react";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import BookingsList from "@/components/BookingsList";
import { Badge } from "@/components/ui";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      bookings: {
        include: {
          items: {
            include: {
              store: true,
              plan: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  // 获取每个 booking item 的 campaignPlan 信息（如果有）
  if (user) {
    for (const booking of user.bookings) {
      for (const item of booking.items) {
        if (item.campaignPlanId) {
          const campaignPlan = await prisma.campaignPlan.findUnique({
            where: { id: item.campaignPlanId },
            select: {
              name: true,
              images: true,
            },
          });
          (item as any).campaignPlan = campaignPlan;
        }
      }
    }
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* 邮箱验证提示 */}
          {user.email && !user.emailVerified && (
            <EmailVerificationBanner email={user.email} />
          )}

          {/* 用户信息卡片 - Airbnb 风格 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* 头像 - 樱花渐变 */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sakura-400 to-sakura-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>

              {/* 基本信息 */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  {user.name || "用户"}
                </h1>
                <div className="space-y-2 text-sm text-gray-600">
                  {user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-sakura-500" />
                      <span>{user.email}</span>
                      {user.emailVerified && (
                        <Badge variant="success" size="sm">已验证</Badge>
                      )}
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-sakura-500" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sakura-500" />
                    <span>
                      加入于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 预约记录 - Airbnb 风格 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-sakura-600" />
              我的预约
            </h2>

            <BookingsList bookings={user.bookings} />
          </div>
        </div>
      </div>
    </div>
  );
}
