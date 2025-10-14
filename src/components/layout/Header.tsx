import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">江戸和装工房雅</span>
        </Link>

        <nav className="mx-6 flex items-center space-x-6 text-sm font-medium flex-1">
          <Link href="/kimonos" className="transition-colors hover:text-foreground/80">
            和服图库
          </Link>
          <Link href="/plans" className="transition-colors hover:text-foreground/80">
            租赁套餐
          </Link>
          <Link href="/stores" className="transition-colors hover:text-foreground/80">
            店铺信息
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground/80">
            关于我们
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            立即预约
          </Link>
        </div>
      </div>
    </header>
  );
}
