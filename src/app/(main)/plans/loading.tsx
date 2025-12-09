// 搜索页面骨架屏 - 在数据加载时立即显示
export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部区域骨架 */}
      <div className="bg-gradient-to-b from-gray-50 to-transparent">
        <div className="container">
          {/* 1. 主题选择器骨架 */}
          <div className="pt-6 md:pt-8 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {/* 主题图片骨架 */}
            <div className="flex gap-4 md:gap-6 overflow-hidden">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2.5">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gray-200 animate-pulse" />
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* 2. 主题介绍骨架 - 与首页一致 */}
          <div className="pb-6 md:pb-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-4 md:gap-5 flex-1 min-w-0">
                {/* 图标骨架 */}
                <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-gray-200 rounded-2xl animate-pulse" />
                {/* 标题和描述骨架 */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="h-9 w-48 bg-gray-200 rounded-lg animate-pulse mb-2.5" />
                  <div className="h-5 w-full max-w-md bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              {/* 移动端筛选按钮骨架 */}
              <div className="lg:hidden flex-shrink-0 h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            </div>
            {/* 分割线骨架 */}
            <div className="h-[1px] bg-gray-200" />
          </div>
        </div>
      </div>

      {/* 主内容区骨架 */}
      <div className="bg-white">
        <div className="container py-6">
          <div className="flex gap-8">
            {/* 桌面端侧边栏骨架 */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* 标题栏 */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                </div>

                <div className="divide-y divide-gray-100">
                  {/* 排序选项骨架 */}
                  <div className="px-5 py-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
                    <div className="flex flex-wrap gap-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"
                        />
                      ))}
                    </div>
                  </div>

                  {/* 价格区间骨架 */}
                  <div className="px-5 py-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
                    <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse mb-4" />
                    <div className="flex gap-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-7 w-16 bg-gray-200 rounded-full animate-pulse"
                        />
                      ))}
                    </div>
                  </div>

                  {/* 标签分类骨架 */}
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[...Array(4)].map((_, j) => (
                          <div
                            key={j}
                            className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 套餐列表骨架 */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <PlanCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 套餐卡片骨架 - 匹配搜索页 PlanCard 样式
function PlanCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] p-3">
      {/* 图片骨架 - 3:4 比例，圆角 */}
      <div className="aspect-[3/4] bg-gray-100 animate-pulse rounded-xl" />

      {/* 内容骨架 */}
      <div className="mt-3 space-y-2">
        {/* 商家 + 地区 */}
        <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />

        {/* 标题 */}
        <div className="h-5 w-4/5 bg-gray-100 rounded animate-pulse" />

        {/* 分隔线 */}
        <div className="h-px w-6 bg-gray-100 animate-pulse" />

        {/* 价格 */}
        <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />

        {/* 包含物 */}
        <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />

        {/* 标签 */}
        <div className="flex gap-1.5 pt-0.5">
          <div className="h-5 w-14 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
