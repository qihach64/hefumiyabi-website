import { notFound } from 'next/navigation';
import { planService } from '@/server/services/plan.service';
import { PlanDetailClient } from './PlanDetailClient';

// 60 秒 ISR 缓存
export const revalidate = 60;

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ store?: string }>;
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: PlanDetailPageProps) {
  const pageStart = performance.now();

  const { id } = await params;
  const { store: storeId } = await searchParams;

  // 使用 Service 层获取套餐详情
  const plan = await planService.getDetailById(id, storeId);

  if (!plan) {
    notFound();
  }

  // 开发环境性能日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PlanDetailPage] ⏱️ Total: ${(performance.now() - pageStart).toFixed(1)}ms`);
  }

  // relatedPlans 改为客户端懒加载，不阻塞首屏渲染
  return (
    <PlanDetailClient
      plan={plan}
      mapData={plan.mapData}
    />
  );
}

// 静态生成热门套餐页面
export async function generateStaticParams() {
  const plans = await planService.getFeatured(20);
  return plans.map((plan) => ({ id: plan.id }));
}
