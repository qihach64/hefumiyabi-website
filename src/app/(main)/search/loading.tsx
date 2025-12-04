// 搜索页面骨架屏 - 在数据加载时立即显示
export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 主题 Pills 骨架 - 固定在顶部 */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container py-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {/* 主题 Pill 骨架 */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 h-10 w-24 bg-gray-200 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 搜索结果内容 */}
      <div className="container py-8">
        {/* 搜索摘要骨架 */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-3" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* 移动端筛选按钮骨架 */}
          <div className="lg:hidden h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* 主内容区：侧边栏 + 套餐列表 */}
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
  );
}

// 套餐卡片骨架
function PlanCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* 图片骨架 - 3:4 比例 */}
      <div className="aspect-[3/4] bg-gray-200 animate-pulse" />

      {/* 内容骨架 */}
      <div className="p-4">
        {/* 标签 */}
        <div className="flex gap-2 mb-2">
          <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* 标题 */}
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />

        {/* 描述 */}
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1" />
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />

        {/* 价格 */}
        <div className="flex items-baseline gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
