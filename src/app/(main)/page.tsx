import { Suspense } from "react";
import { planService } from "@/server/services/plan.service";
import HomeClient from "./HomeClient";

// 启用 ISR 缓存，60 秒重新验证
// 注意：不使用 searchParams 以保持页面可缓存
// 筛选逻辑完全在 HomeClient 客户端处理
export const revalidate = 60;

// 加载骨架屏组件
function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero 骨架 */}
      <div className="h-[400px] bg-gradient-to-b from-stone-50 to-white animate-pulse" />
      {/* 内容骨架 */}
      <div className="container py-8 space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-8 w-48 bg-stone-100 rounded animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="w-64 h-80 bg-stone-100 rounded-xl animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  // 使用 service 层统一获取首页数据
  // 获取所有数据，筛选在客户端进行
  const homepageData = await planService.getHomepagePlans({
    limitPerTheme: 8,
  });

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeClient
        themeSections={homepageData.themeSections}
        allPlans={homepageData.allPlans}
        campaigns={homepageData.campaigns}
        stores={homepageData.stores}
        tagCategories={homepageData.tagCategories}
      />
    </Suspense>
  );
}
