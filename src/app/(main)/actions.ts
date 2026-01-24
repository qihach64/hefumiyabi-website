'use server';

import { revalidatePath } from 'next/cache';

/**
 * 刷新首页缓存
 * 用于管理员手动刷新或数据变更后触发
 */
export async function refreshHomepage() {
  revalidatePath('/');
}
