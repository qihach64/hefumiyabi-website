import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { planService } from '@/server/services/plan.service';
import { PlanDetailClient } from './PlanDetailClient';

// 60 秒 ISR 缓存
export const revalidate = 60;

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const pageStart = performance.now();

  const { id } = await params;

  // 使用 Service 层获取套餐详情
  const plan = await planService.getDetailById(id);

  if (!plan) {
    notFound();
  }

  // 开发环境性能日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PlanDetailPage] ⏱️ Total: ${(performance.now() - pageStart).toFixed(1)}ms`);
  }

  // relatedPlans 改为客户端懒加载，不阻塞首屏渲染
  return (
    <Suspense>
      <PlanDetailClient
        plan={plan}
        mapData={plan.mapData}
      />
    </Suspense>
  );
}

// 静态生成热门套餐页面
export async function generateStaticParams() {
  const plans = await planService.getFeatured(20);
  return plans.map((plan) => ({ id: plan.id }));
}
