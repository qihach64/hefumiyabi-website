import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import UserMenu from "./UserMenu";

export default async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo - 使用图片 */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="relative w-10 h-10 md:w-12 md:h-12 bg-white rounded-full p-1">
            <Image
              src="/logo.png"
              alt="江戸和装工房雅"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg md:text-xl font-bold">
            <span className="hidden sm:inline">江戸和装工房雅</span>
            <span className="sm:hidden">雅</span>
          </span>
        </Link>

        {/* 导航 - 移动端隐藏部分链接 */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/plans" className="transition-colors hover:text-foreground/80">
            租赁套餐
          </Link>
          <Link href="/campaigns" className="transition-colors hover:text-foreground/80">
            优惠活动
          </Link>
          <Link href="/stores" className="transition-colors hover:text-foreground/80">
            店铺信息
          </Link>
          <Link href="/kimonos" className="transition-colors hover:text-foreground/80">
            和服图库
          </Link>
          <Link href="/faq" className="transition-colors hover:text-foreground/80">
            常见问题
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground/80">
            关于我们
          </Link>
        </nav>

        {/* 移动端简化导航 */}
        <nav className="flex md:hidden items-center space-x-3 text-sm font-medium">
          <Link href="/plans" className="transition-colors hover:text-foreground/80">
            套餐
          </Link>
          <Link href="/campaigns" className="transition-colors hover:text-foreground/80">
            优惠
          </Link>
          <Link href="/stores" className="transition-colors hover:text-foreground/80">
            店铺
          </Link>
        </nav>

        {/* 右侧按钮区域 */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 预约按钮 */}
          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 md:h-10 px-3 md:px-4 py-2"
          >
            <span className="hidden sm:inline">立即预约</span>
            <span className="sm:hidden">预约</span>
          </Link>

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
