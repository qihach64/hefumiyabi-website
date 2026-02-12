import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ComponentsClient from "./ComponentsClient";

// 强制动态渲染，避免缓存问题
export const dynamic = "force-dynamic";

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

  // v10.1: 获取商户的组件实例（包含模板信息）
  const merchantComponents = await prisma.merchantComponent.findMany({
    where: { merchantId: merchant.id },
    include: {
      template: {
        select: {
          id: true,
          code: true,
          name: true,
          nameJa: true,
          type: true,
          icon: true,
          basePrice: true,
          description: true,
          defaultHighlights: true,
          defaultImages: true,
        },
      },
    },
    orderBy: [{ template: { type: "asc" } }, { template: { displayOrder: "asc" } }],
  });

  // 转换为客户端组件需要的格式（过滤掉没有模板的记录）
  const components = merchantComponents
    .filter((mc) => mc.template !== null)
    .map((mc) => {
      // 经过 filter 后 template 一定非 null
      const template = mc.template!;
      return {
        id: mc.id,
        templateId: mc.templateId!,
        // 模板信息
        code: template.code,
        name: template.name,
        nameJa: template.nameJa,
        type: template.type,
        icon: template.icon,
        basePrice: template.basePrice,
        description: template.description,
        // 商户自定义内容（如果有自定义则使用自定义，否则使用默认）
        images: mc.images.length > 0 ? mc.images : template.defaultImages,
        highlights: mc.highlights.length > 0 ? mc.highlights : template.defaultHighlights,
        // 标记是否有自定义内容
        hasCustomImages: mc.images.length > 0,
        hasCustomHighlights: mc.highlights.length > 0,
        // 保存默认值用于恢复
        defaultImages: template.defaultImages,
        defaultHighlights: template.defaultHighlights,
        // 商户配置
        price: mc.price,
        isEnabled: mc.isEnabled,
        // 有效价格 = 商户价格 ?? 平台建议价
        effectivePrice: mc.price ?? template.basePrice,
      };
    });

  return <ComponentsClient components={components} merchantId={merchant.id} />;
}
