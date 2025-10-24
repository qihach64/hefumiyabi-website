import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import UserMenu from "./UserMenu";
import HeaderActions from "./HeaderActions";
import NavLink from "./NavLink";

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

  // 导航链接配置
  const navLinks = [
    { href: "/plans", label: "租赁套餐", mobileLabel: "套餐" },
    {
      href: "/virtual-tryon",
      label: "AI 试穿",
      mobileLabel: "AI试穿",
      special: true
    },
    { href: "/stores", label: "店铺信息", mobileLabel: "店铺" },
    { href: "/faq", label: "常见问题", mobileHidden: true },
    { href: "/about", label: "关于我们", mobileHidden: true },
  ];

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo - 使用图片 */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0 group">
          <div className="relative w-9 h-9 md:w-10 md:h-10 transition-transform group-hover:scale-105">
            <Image
              src="/logo.svg"
              alt="和缘"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-base md:text-lg font-bold text-sakura-600 transition-colors group-hover:text-sakura-700">
            和缘
          </span>
        </Link>

        {/* 导航 - 桌面端 */}
        <nav className="hidden md:flex items-center space-x-1">
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

        {/* 导航 - 移动端 */}
        <nav className="flex md:hidden items-center space-x-1">
          {navLinks
            .filter((link) => !link.mobileHidden)
            .map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                special={link.special}
                mobile
              >
                {link.mobileLabel || link.label}
              </NavLink>
            ))}
        </nav>

        {/* 右侧按钮区域 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 购物车和预约按钮 */}
          <HeaderActions
            isLoggedIn={!!session?.user}
            merchant={merchant}
          />

          {/* 用户菜单 / 登录按钮 */}
          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 h-9 md:h-10 px-3 md:px-4 py-2"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
