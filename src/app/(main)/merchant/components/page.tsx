import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ComponentsClient from "./ComponentsClient";

export default async function MerchantComponentsPage() {
  // 验证登录
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 获取商家信息
  const merchant = await prisma.merchant.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!merchant) {
    redirect("/merchant/register");
  }

  if (merchant.status !== "APPROVED") {
    redirect("/merchant/pending");
  }

  // 获取所有平台组件
  const allComponents = await prisma.serviceComponent.findMany({
    where: {
      isActive: true,
      isSystemComponent: true,
      status: "APPROVED",
    },
    orderBy: [
      { type: "asc" },
      { displayOrder: "asc" },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      nameJa: true,
      type: true,
      icon: true,
      basePrice: true,
      tier: true,
      tierLabel: true,
      description: true,
    },
  });

  // 获取商户的覆盖配置
  const overrides = await prisma.merchantComponentOverride.findMany({
    where: { merchantId: merchant.id },
  });

  // 构建响应：组件 + 覆盖配置
  const overrideMap = new Map(
    overrides.map(o => [o.componentId, o])
  );

  const components = allComponents.map(component => ({
    ...component,
    override: overrideMap.get(component.id) || null,
    // 有效价格 = 覆盖价格 ?? 平台建议价
    effectivePrice: overrideMap.get(component.id)?.price ?? component.basePrice,
    // 是否启用（默认启用）
    isEnabled: overrideMap.get(component.id)?.isEnabled ?? true,
  }));

  return (
    <ComponentsClient
      components={components}
      merchantId={merchant.id}
    />
  );
}
