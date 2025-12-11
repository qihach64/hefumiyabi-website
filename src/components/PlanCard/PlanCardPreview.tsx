"use client";

import PlanCard from "./index";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface PlanCardPreviewProps {
  formData: {
    name: string;
    description: string;
    highlights: string;
    price: number; // 表单中是元
    originalPrice: number | string;
    includes?: string[];  // 可选，已废弃，使用 components
    imageUrl: string;
    storeName: string;
    region: string;
    isActive: boolean;
  };
  selectedTags: Tag[];
  isActive: boolean;
  isCampaign?: boolean;
}

export default function PlanCardPreview({
  formData,
  selectedTags,
  isActive,
  isCampaign = false,
}: PlanCardPreviewProps) {
  // 将表单数据转换为 PlanCard 需要的格式
  const previewPlan = {
    id: 'preview',
    name: formData.name || '套餐名称',
    price: Math.round(Number(formData.price) * 100), // 转换为分
    originalPrice: formData.originalPrice
      ? Math.round(Number(formData.originalPrice) * 100)
      : undefined,
    imageUrl: formData.imageUrl || undefined,
    includes: formData.includes || [],
    planTags: selectedTags.map(tag => ({ tag })),
    isCampaign,
    storeName: formData.storeName || undefined,
    region: formData.region || undefined,
  };

  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-0.5">用户预览</h3>
        <p className="text-xs text-gray-600">用户看到的效果</p>
      </div>

      {/* 缩小版的预览卡片 */}
      <div className="scale-90 origin-top">
        <PlanCard plan={previewPlan} showMerchant={false} />
      </div>

      {/* 状态提示（商家才看得到） */}
      {!isActive && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ 套餐已下架，用户无法看到
          </p>
        </div>
      )}
    </div>
  );
}
