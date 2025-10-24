import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Users, Store, BarChart3, Settings } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 验证登录和权限
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  // 检查是否是管理员或员工
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    // 无权访问，重定向到首页
    redirect("/?error=unauthorized");
  }

  const navItems = [
    {
      href: "/admin",
      icon: BarChart3,
      label: "仪表板",
    },
    {
      href: "/admin/merchants",
      icon: Store,
      label: "商家审核",
    },
    {
      href: "/admin/users",
      icon: Users,
      label: "用户管理",
    },
    {
      href: "/admin/settings",
      icon: Settings,
      label: "系统设置",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 管理后台顶部栏 */}
      <div className="bg-gray-900 text-white">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-sakura-400" />
              <h1 className="text-xl font-bold">管理后台</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                {session.user.name || session.user.email}
              </span>
              <span className="px-3 py-1 bg-sakura-600 text-white text-xs font-semibold rounded-full">
                {session.user.role === "ADMIN" ? "管理员" : "员工"}
              </span>
              <Link
                href="/"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                返回前台
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 导航栏 */}
      <div className="bg-white border-b">
        <div className="container">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-sakura-600 hover:bg-sakura-50 border-b-2 border-transparent hover:border-sakura-600 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container py-8">{children}</div>
    </div>
  );
}
