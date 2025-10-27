import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import UserMenu from "./UserMenu";
import HeaderActions from "./HeaderActions";
import NavLink from "./NavLink";
import MobileMenu from "./MobileMenu";

export default async function Header() {
  const session = await auth();

  // 检查用户是否有商家账户
  let merchant = null;
  if (session?.user?.id) {
    merchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        status: true,
        businessName: true,
      },
    });
  }

  // 导航链接配置（仅用于桌面端）
  const navLinks = [
    { href: "/plans", label: "租赁套餐" },
    {
      href: "/virtual-tryon",
      label: "AI 试穿",
      special: true
    },
    { href: "/stores", label: "店铺信息" },
    { href: "/faq", label: "常见问题" },
    { href: "/about", label: "关于我们" },
  ];

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="container">
        <div className="flex h-14 md:h-16 items-center justify-between gap-2 md:gap-4">
          {/* 左侧：移动端菜单 + Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 移动端汉堡菜单 */}
            <MobileMenu
              isLoggedIn={!!session?.user}
              userName={session?.user?.name}
              userEmail={session?.user?.email}
              merchant={merchant}
            />

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0 group">
              <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.svg"
                  alt="Kimono One"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-base md:text-lg font-bold text-sakura-600 transition-colors group-hover:text-sakura-700">
                Kimono One
              </span>
            </Link>
          </div>

          {/* 中间：桌面端导航 */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                special={link.special}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {/* 购物车和预约按钮 */}
            <HeaderActions
              isLoggedIn={!!session?.user}
              merchant={merchant}
            />

            {/* 用户菜单 / 登录按钮 - 桌面端显示 */}
            <div className="hidden md:flex">
              {session?.user ? (
                <UserMenu user={session.user} />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 h-10 px-4 py-2"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
