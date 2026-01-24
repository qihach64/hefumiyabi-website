'use server';

import { revalidatePath } from 'next/cache';

/**
 * 刷新套餐详情页缓存
 * 用于商家更新套餐信息后立即刷新页面
 */
export async function refreshPlanDetail(planId: string) {
  revalidatePath(`/plans/${planId}`);
}

/**
 * 刷新所有套餐页面缓存
 * 用于批量更新后刷新
 */
export async function refreshAllPlans() {
  revalidatePath('/plans', 'layout');
}
