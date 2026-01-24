import { Suspense } from "react";
import { planService } from "@/server/services/plan.service";
import PlansClient from "./PlansClient";

// ISR: 60 秒重新验证
export const revalidate = 60;

// 套餐页骨架屏
function PlansPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部区域骨架 */}
      <div className="bg-gradient-to-b from-pink-50/30 to-transparent">
        <div className="container">
          {/* 主题选择器骨架 */}
          <div className="pt-6 md:pt-8 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-24 h-32 bg-gray-200 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* 标题区骨架 */}
          <div className="pb-6 md:pb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-px bg-gray-200" />
          </div>
        </div>
      </div>

      {/* 内容区骨架 */}
      <div className="bg-white">
        <div className="container py-6">
          <div className="flex gap-8">
            {/* 侧边栏骨架 */}
            <div className="hidden lg:block w-72 flex-shrink-0 space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-2">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-8 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 套餐网格骨架 */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-3">
                    <div className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
                    <div className="mt-3 space-y-2">
                      <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                      <div className="h-5 w-4/5 bg-gray-100 rounded animate-pulse" />
                      <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function PlansPage() {
  const data = await planService.getPlansPageData();

  return (
    <Suspense fallback={<PlansPageSkeleton />}>
      <PlansClient
        themes={data.themes}
        plans={data.plans}
        tagCategories={data.tagCategories}
        maxPrice={data.maxPrice}
      />
    </Suspense>
  );
}
