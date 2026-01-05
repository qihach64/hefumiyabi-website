import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import PlanForm from "@/components/merchant/PlanEditForm";

export default async function NewListingPage() {
  // 验证登录
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 获取商家信息
  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!merchant || merchant.status !== "APPROVED") {
    redirect("/merchant/dashboard");
  }

  // 获取默认地图模板（新建套餐时也可以使用热点图编辑）
  const mapTemplate = await prisma.mapTemplate.findFirst({
    where: { isDefault: true, isActive: true },
    include: {
      hotspots: {
        include: {
          component: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  const mapTemplateData = mapTemplate
    ? {
        id: mapTemplate.id,
        imageUrl: mapTemplate.imageUrl,
        hotspots: mapTemplate.hotspots.map((h) => ({
          componentId: h.componentId,
          x: h.x,
          y: h.y,
          labelPosition: h.labelPosition,
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 新建模式：不传 plan 参数 */}
      <PlanForm mapTemplate={mapTemplateData} />
    </div>
  );
}
