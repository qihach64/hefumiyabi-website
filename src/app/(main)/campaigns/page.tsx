import { redirect } from 'next/navigation';

/**
 * 活动页面已整合到套餐页面
 * 自动重定向到 /plans
 */
export default function CampaignsPage() {
  redirect('/plans');
}
