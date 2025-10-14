import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo - 移动端显示简称 */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <span className="text-lg md:text-xl font-bold">
            <span className="hidden sm:inline">江戸和装工房雅</span>
            <span className="sm:hidden">雅</span>
          </span>
        </Link>

        {/* 导航 - 移动端隐藏部分链接 */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/kimonos" className="transition-colors hover:text-foreground/80">
            和服图库
          </Link>
          <Link href="/plans" className="transition-colors hover:text-foreground/80">
            租赁套餐
          </Link>
          <Link href="/stores" className="transition-colors hover:text-foreground/80">
            店铺信息
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
          <Link href="/kimonos" className="transition-colors hover:text-foreground/80">
            图库
          </Link>
          <Link href="/plans" className="transition-colors hover:text-foreground/80">
            套餐
          </Link>
        </nav>

        {/* 预约按钮 */}
        <div className="flex items-center shrink-0">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 md:h-10 px-3 md:px-4 py-2"
          >
            <span className="hidden sm:inline">立即预约</span>
            <span className="sm:hidden">预约</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
