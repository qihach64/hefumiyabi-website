// 套餐详情页骨架屏 - 匹配 PlanDetailClient 实际布局
export default function PlanDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* 主容器 */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 pt-8 md:pt-12 pb-16">

        {/* 面包屑导航骨架 */}
        <nav className="mb-8 md:mb-10">
          <div className="flex items-center gap-2">
            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
            <span className="text-gray-300">/</span>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <span className="text-gray-300">/</span>
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            <span className="text-gray-300">/</span>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </nav>

        {/* 标题区域骨架 */}
        <header className="mb-10 md:mb-12">
          {/* 装饰线 + 分类标签 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-px bg-sakura-200" />
            <div className="h-3 w-20 bg-sakura-100 rounded animate-pulse" />
          </div>

          {/* 主标题骨架 */}
          <div className="h-10 md:h-12 lg:h-14 w-3/4 bg-gray-200 rounded-lg animate-pulse mb-6" />

          {/* 元信息行骨架 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {/* 评分 */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-sakura-100 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            {/* 时长 */}
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            {/* 地区 */}
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* 渐变分割线 */}
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </header>

        {/* 全宽区域骨架 */}
        <div className="space-y-12 mb-12">
          {/* VisualHub 骨架 - 图片画廊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 主图 */}
            <div className="aspect-[4/3] bg-gray-200 rounded-xl animate-pulse" />
            {/* 缩略图网格 */}
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>

          {/* 套餐简介骨架 */}
          <section className="py-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-sakura-200" />
              <div className="h-3 w-24 bg-sakura-100 rounded animate-pulse" />
            </div>
            <div className="space-y-3 max-w-3xl">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
            </div>
          </section>

          {/* ServiceMap 骨架 - 包含项网格 */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-sakura-200" />
              <div className="h-3 w-28 bg-sakura-100 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-sakura-100 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI 虚拟试穿骨架 - 雅致风格 */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-px bg-stone-200" />
              <div className="h-3 w-24 bg-stone-100 rounded animate-pulse" />
            </div>
            <div className="rounded-2xl overflow-hidden border border-stone-200/60 bg-[#FDFBF7]">
              <div className="grid grid-cols-1 lg:grid-cols-5">
                {/* 左侧视觉区域 (3/5) */}
                <div className="lg:col-span-3 relative aspect-[4/3] lg:aspect-auto lg:min-h-[360px] bg-stone-100 animate-pulse">
                  {/* 拍立得骨架 */}
                  <div className="absolute bottom-6 right-6 lg:bottom-auto lg:top-1/2 lg:right-8 lg:-translate-y-1/2">
                    <div className="w-20 h-24 lg:w-28 lg:h-36 bg-white rounded shadow-lg rotate-6" />
                  </div>
                </div>
                {/* 右侧文案区域 (2/5) */}
                <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center">
                  <div className="h-2 w-20 bg-sakura-100 rounded animate-pulse mb-4" />
                  <div className="h-8 w-32 bg-stone-200 rounded animate-pulse mb-2" />
                  <div className="h-8 w-24 bg-stone-200 rounded animate-pulse mb-4" />
                  <div className="space-y-2 mb-8">
                    <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
                    <div className="h-4 w-4/5 bg-stone-100 rounded animate-pulse" />
                    <div className="h-4 w-3/5 bg-stone-100 rounded animate-pulse" />
                  </div>
                  <div className="h-12 w-32 bg-sakura-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 两栏区域骨架 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* 左侧主内容区 */}
          <div className="lg:col-span-2 space-y-12">
            {/* UpgradeServices 骨架 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-px bg-sakura-200" />
                <div className="h-3 w-20 bg-sakura-100 rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                    <div className="w-12 h-12 bg-sakura-100 rounded-lg animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-16 bg-sakura-100 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            </section>

            {/* JourneyTimeline 骨架 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-px bg-sakura-200" />
                <div className="h-3 w-24 bg-sakura-100 rounded animate-pulse" />
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 bg-sakura-100 rounded-full animate-pulse flex-shrink-0" />
                    <div className="flex-1 pb-4 border-b border-gray-100">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SocialProof 骨架 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-px bg-sakura-200" />
                <div className="h-3 w-16 bg-sakura-100 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-4/5 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 右侧预订卡片骨架 - Airbnb 悬浮风格 */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
                {/* 价格骨架 */}
                <div className="mb-6">
                  <div className="h-8 w-32 bg-stone-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-20 bg-stone-100 rounded animate-pulse" />
                </div>

                {/* 店铺信息 */}
                <div className="mb-5 px-4 py-3 bg-stone-50/80 rounded-xl">
                  <div className="h-4 w-28 bg-stone-200 rounded animate-pulse" />
                </div>

                {/* Airbnb 风格表单组 */}
                <div className="mb-5 rounded-xl border border-stone-200 overflow-hidden">
                  {/* 日期 + 时间行 */}
                  <div className="grid grid-cols-2 divide-x divide-stone-200">
                    <div className="p-3">
                      <div className="h-2.5 w-12 bg-stone-200 rounded animate-pulse mb-2" />
                      <div className="h-5 w-full bg-stone-100 rounded animate-pulse" />
                    </div>
                    <div className="p-3">
                      <div className="h-2.5 w-12 bg-stone-200 rounded animate-pulse mb-2" />
                      <div className="h-5 w-full bg-stone-100 rounded animate-pulse" />
                    </div>
                  </div>
                  {/* 人数行 */}
                  <div className="p-3 border-t border-stone-200">
                    <div className="h-2.5 w-10 bg-stone-200 rounded animate-pulse mb-2" />
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-16 bg-stone-100 rounded animate-pulse" />
                      <div className="flex gap-1">
                        <div className="w-8 h-8 rounded-full bg-stone-100 animate-pulse" />
                        <div className="w-8 h-8 rounded-full bg-stone-100 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 电话输入 */}
                <div className="mb-6 p-3 rounded-xl border border-stone-200">
                  <div className="h-2.5 w-16 bg-stone-200 rounded animate-pulse mb-2" />
                  <div className="h-5 w-full bg-stone-100 rounded animate-pulse" />
                </div>

                {/* 按钮骨架 */}
                <div className="space-y-3 mb-4">
                  {/* 主按钮 - 渐变 */}
                  <div className="h-12 w-full bg-gradient-to-r from-sakura-200 to-sakura-300 rounded-xl animate-pulse" />
                  {/* 次按钮 - 边框 */}
                  <div className="h-12 w-full border border-stone-200 rounded-xl animate-pulse" />
                </div>

                {/* 提示文字 */}
                <div className="h-3 w-20 bg-stone-100 rounded animate-pulse mx-auto" />

                {/* 安全保障 */}
                <div className="mt-6 pt-5 border-t border-stone-100">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-sakura-100 rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-stone-200 rounded animate-pulse mb-1" />
                      <div className="h-2.5 w-32 bg-stone-100 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MiniBookingBar 骨架 (移动端) - 毛玻璃效果 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="h-6 w-24 bg-stone-200 rounded animate-pulse mb-1" />
            <div className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
          </div>
          <div className="h-12 w-24 bg-gradient-to-r from-sakura-200 to-sakura-300 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
