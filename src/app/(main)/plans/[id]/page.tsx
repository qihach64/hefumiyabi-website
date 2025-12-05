import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PlanDetailClient from "@/components/PlanDetailClient";
import { getDefaultMapData } from "@/lib/kimono-map";

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
    },
  });

  if (!plan) {
    notFound();
  }

  // 获取和服配件地图数据
  const mapData = await getDefaultMapData();

  return <PlanDetailClient plan={plan} mapData={mapData} />;
}
