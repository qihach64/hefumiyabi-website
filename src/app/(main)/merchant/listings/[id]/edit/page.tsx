import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PlanEditForm from "@/components/merchant/PlanEditForm";
import HotspotEditor from "@/components/merchant/HotspotEditor";

interface EditListingPageProps {
  params: {
    id: string;
  };
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;

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

  // 获取套餐信息（包含标签关联、主题和服务组件）
  const plan = await prisma.rentalPlan.findUnique({
    where: { id },
    include: {
      theme: {
        select: {
          id: true,
          slug: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      planTags: {
        include: {
          tag: {
            select: {
              id: true,
              code: true,
              name: true,
              icon: true,
              color: true,
              categoryId: true,
            },
          },
        },
      },
      planComponents: {
        include: {
          component: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              icon: true,
            },
          },
        },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  // 验证套餐所有权
  if (plan.merchantId !== merchant.id) {
    redirect("/merchant/listings");
  }

  // 获取地图模板数据（用于热点编辑）
  // 优先使用主题关联的模板，否则使用默认模板
  let mapTemplate = null;
  if (plan.theme?.id) {
    mapTemplate = await prisma.mapTemplate.findFirst({
      where: { themeId: plan.theme.id, isActive: true },
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
  }

  // 如果没有主题关联的模板，使用默认模板
  if (!mapTemplate) {
    mapTemplate = await prisma.mapTemplate.findFirst({
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
  }

  // 转换热点数据格式
  const hotspotData = mapTemplate?.hotspots.map((h) => ({
    id: h.id,
    x: h.x,
    y: h.y,
    labelPosition: h.labelPosition as "left" | "right" | "top" | "bottom",
    displayOrder: h.displayOrder,
    componentName: h.component.name,
    componentIcon: h.component.icon,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-7xl">
        {/* 返回按钮 */}
        <Link href="/merchant/listings" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回套餐列表
        </Link>

        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            编辑套餐
          </h1>
          <p className="text-gray-600">{plan.name}</p>
        </div>

        {/* 编辑表单 - 传递plan数据用于预览 */}
        <PlanEditForm plan={plan} />

        {/* 热点编辑器 */}
        {mapTemplate && hotspotData.length > 0 && (
          <div className="mt-8">
            <HotspotEditor
              templateId={mapTemplate.id}
              imageUrl={mapTemplate.imageUrl}
              hotspots={hotspotData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
