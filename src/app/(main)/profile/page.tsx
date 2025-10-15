import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { User, Calendar, Mail, Phone, MapPin } from "lucide-react";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";

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
          store: true,
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* 邮箱验证提示 */}
          {user.email && !user.emailVerified && (
            <EmailVerificationBanner email={user.email} />
          )}

          {/* 用户信息卡片 */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* 头像 */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>

              {/* 基本信息 */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {user.name || "用户"}
                </h1>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      加入于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 预约记录 */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-rose-500" />
              我的预约
            </h2>

            {user.bookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  您还没有任何预约记录
                </p>
                <a
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 h-10 px-6 py-2 shadow-sm"
                >
                  浏览套餐
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {user.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-rose-200 dark:hover:border-rose-800 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {booking.plan.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.store.name}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-medium ${
                            booking.status === "CONFIRMED"
                              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                              : booking.status === "PENDING"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                              : booking.status === "COMPLETED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                              : "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                          }`}
                        >
                          {booking.status === "CONFIRMED"
                            ? "已确认"
                            : booking.status === "PENDING"
                            ? "待确认"
                            : booking.status === "COMPLETED"
                            ? "已完成"
                            : booking.status === "CANCELLED"
                            ? "已取消"
                            : booking.status}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between sm:block">
                        <span className="text-gray-500 dark:text-gray-400">
                          租赁日期
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 sm:block sm:mt-1">
                          {new Date(booking.rentalDate).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="text-gray-500 dark:text-gray-400">
                          归还日期
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 sm:block sm:mt-1">
                          {new Date(booking.returnDate).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="text-gray-500 dark:text-gray-400">
                          总金额
                        </span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400 sm:block sm:mt-1">
                          ¥{(booking.totalAmount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="text-gray-500 dark:text-gray-400">
                          支付状态
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 sm:block sm:mt-1">
                          {booking.paymentStatus === "PAID"
                            ? "已支付"
                            : booking.paymentStatus === "PARTIAL"
                            ? "部分支付"
                            : booking.paymentStatus === "PENDING"
                            ? "待支付"
                            : "已退款"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
