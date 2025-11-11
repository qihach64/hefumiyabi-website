import prisma from "@/lib/prisma";
import PlanCard from "@/components/PlanCard";
import HeroSearchBar from "@/components/HeroSearchBar";
import ScrollableSection from "@/components/ScrollableSection";
import Link from "next/link";

// 禁用静态生成，在运行时动态渲染（主页需要实时套餐数据）
export const dynamic = 'force-dynamic';

// 分类配置
const categories = [
  { id: "LADIES", icon: "👩", label: "女士和服", description: "优雅传统的女士和服体验" },
  { id: "MENS", icon: "👨", label: "男士和服", description: "英俊潇洒的男士和服" },
  { id: "COUPLE", icon: "💑", label: "情侣套餐", description: "浪漫的双人和服体验" },
  { id: "FAMILY", icon: "👨‍👩‍👧‍👦", label: "亲子套餐", description: "全家共享和服之美" },
  { id: "GROUP", icon: "👥", label: "团体套餐", description: "朋友结伴和服体验" },
  { id: "SPECIAL", icon: "✨", label: "特别套餐", description: "独特主题和服体验" },
];

export default async function HomePage() {
  // 为每个分类查询精选套餐
  const categorySections = await Promise.all(
    categories.map(async (category) => {
      const plans = await prisma.rentalPlan.findMany({
        where: {
          isActive: true,
          category: category.id as any,
        },
        orderBy: [
          { isFeatured: "desc" },
          { price: "asc" },
        ],
        take: 8, // 每个分类显示8个套餐
        include: {
          planTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
        },
      });

      return {
        ...category,
        plans: plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          nameEn: plan.nameEn,
          description: plan.description,
          price: plan.price,
          originalPrice: plan.originalPrice,
          imageUrl: plan.imageUrl,
          storeName: plan.storeName || "未知店铺",
          region: plan.region || "",
          category: plan.category,
          duration: plan.duration,
          isCampaign: !!plan.originalPrice && plan.originalPrice > plan.price,
          includes: plan.includes,
          planTags: plan.planTags,
        })),
      };
    })
  );

  return (
    <div className="min-h-screen bg-white">
      {/* 搜索栏 - 简洁版 */}
      <section className="sticky top-14 md:top-16 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="container py-2 md:py-4">
          <HeroSearchBar />
        </div>
      </section>

      {/* 分类区域 - Airbnb 风格垂直堆叠 */}
      <div className="py-6 md:py-12">
        {categorySections.map((section, index) => {
          // 跳过没有套餐的分类
          if (section.plans.length === 0) return null;

          return (
            <section
              key={section.id}
              className={index < categorySections.length - 1 ? "mb-6 md:mb-12" : ""}
            >
              <div className="container">
                <ScrollableSection
                  title={section.label}
                  description={section.description}
                  icon={section.icon}
                  scrollerClassName="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-4 -mb-4 scrollbar-hide snap-x snap-mandatory px-4 md:px-0"
                >
                  {section.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="snap-start flex-shrink-0 w-[240px] sm:w-[260px] md:w-[240px] lg:w-[260px]"
                    >
                      <PlanCard plan={plan} showMerchant={true} />
                    </div>
                  ))}
                </ScrollableSection>
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA Section - 简洁版 */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-white to-sakura-50">
        <div className="container text-center px-4">
          <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-gray-900">
            发现更多和服体验
          </h2>
          <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
            探索我们的完整套餐系列，找到最适合您的和服体验
          </p>
          <Link
            href="/plans"
            className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-sakura-600 text-white rounded-xl hover:bg-sakura-700 active:scale-95 transition-all text-base md:text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            浏览全部套餐
          </Link>
        </div>
      </section>
    </div>
  );
}
