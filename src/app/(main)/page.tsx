import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-6">江戸和装工房雅</h1>
          <p className="text-xl text-muted-foreground mb-8">
            体验传统日本文化，感受和服之美
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/kimonos"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              浏览和服
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
            >
              立即预约
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">为什么选择我们</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">👘</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">精选和服</h3>
              <p className="text-muted-foreground">
                上百款精美和服供您选择，从传统到现代风格应有尽有
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">💆</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">专业服务</h3>
              <p className="text-muted-foreground">
                专业和服着装师为您提供完整的着装和造型服务
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">便利位置</h3>
              <p className="text-muted-foreground">
                东京浅草、上野，京都等多处店铺，交通便利
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">准备开始您的和服体验之旅？</h2>
          <p className="text-lg mb-8 opacity-90">
            立即预约，让我们为您打造难忘的和服体验
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-background text-foreground hover:bg-background/90 h-11 px-8"
          >
            立即预约
          </Link>
        </div>
      </section>
    </div>
  );
}
