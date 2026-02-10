import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">江戸和装工房雅</h3>
            <p className="text-sm text-muted-foreground">
              专业和服租赁服务
              <br />
              体验传统日本文化
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">快速链接</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/plans" className="text-muted-foreground hover:text-foreground">
                  和服套餐
                </Link>
              </li>
              <li>
                <Link href="/plans" className="text-muted-foreground hover:text-foreground">
                  租赁套餐
                </Link>
              </li>
              <li>
                <Link href="/stores" className="text-muted-foreground hover:text-foreground">
                  店铺信息
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">客户服务</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  联系我们
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  常见问题
                </Link>
              </li>
            </ul>

            <h4 className="font-semibold mb-4 mt-6">合作伙伴</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/merchant/register"
                  className="text-sakura-500 hover:text-sakura-600 font-medium flex items-center gap-1"
                >
                  🏪 成为商家
                </Link>
              </li>
              <li>
                <Link href="/about/merchants" className="text-muted-foreground hover:text-foreground">
                  商家帮助中心
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">联系方式</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>电话: +81-XX-XXXX-XXXX</li>
              <li>邮箱: info@hefumiyabi.com</li>
              <li>东京 · 浅草 · 上野 · 京都</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 江戸和装工房雅. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
