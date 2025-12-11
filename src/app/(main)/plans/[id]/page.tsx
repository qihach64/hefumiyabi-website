import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PlanDetailClient from "@/components/PlanDetailClient";
import { getPlanMapData } from "@/lib/kimono-map";

interface PlanDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;
  const plan = await prisma.rentalPlan.findUnique({
    where: { id },
    include: {
      campaign: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
        },
      },
      theme: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  // 获取套餐专属的热点地图数据（只显示商户设置过位置的组件）
  const mapData = await getPlanMapData(id);

  return <PlanDetailClient plan={plan} mapData={mapData} />;
}
