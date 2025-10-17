import { redirect } from 'next/navigation';

/**
 * 租赁套餐页面已整合到首页
 * 自动重定向到首页
 */
export default function PlansPage() {
  redirect('/');
}
