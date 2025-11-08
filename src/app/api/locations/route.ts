import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 获取所有激活的套餐的地区信息
    const plans = await prisma.rentalPlan.findMany({
      where: {
        isActive: true,
      },
      select: {
        region: true,
      },
    });

    // 获取所有店铺的地区信息
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
      },
      select: {
        name: true,
        city: true,
      },
    });

    // 收集所有唯一的地区（只要地区，不要店铺名称）
    const locationsSet = new Set<string>();

    // 从套餐中提取地区
    plans.forEach((plan) => {
      if (plan.region) {
        locationsSet.add(plan.region);
      }
    });

    // 从店铺中提取城市
    stores.forEach((store) => {
      if (store.city) {
        locationsSet.add(store.city);
      }
    });

    // 转换为数组并排序
    const locations = Array.from(locationsSet)
      .filter((loc) => loc.trim() !== '') // 过滤空字符串
      .sort((a, b) => a.localeCompare(b, 'zh-CN')); // 按中文排序

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
