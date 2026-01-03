"use client";

import { PlanFormData } from "@/store/planDraft";
import { Clock, MapPin, Star, Flame } from "lucide-react";
import Image from "next/image";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface CardPreviewProps {
  formData: PlanFormData;
  selectedTags: Tag[];
  isCampaign?: boolean;
}

export default function CardPreview({
  formData,
  selectedTags,
  isCampaign = false,
}: CardPreviewProps) {
  // 计算折扣百分比
  const discountPercent =
    formData.originalPrice && Number(formData.originalPrice) > formData.price
      ? Math.round(
          ((Number(formData.originalPrice) - formData.price) /
            Number(formData.originalPrice)) *
            100
        )
      : null;

  // 价格显示
  const priceDisplay = formData.price > 0 ? `¥${formData.price.toLocaleString()}` : "¥0";
  const unitDisplay = formData.unitDescription
    ? `${formData.unitLabel}(${formData.unitDescription})`
    : formData.unitLabel;

  return (
    <div className="max-w-sm mx-auto">
      {/* 模拟卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 图片区域 */}
        <div className="relative aspect-[3/4] bg-gray-100">
          {formData.images.length > 0 || formData.imageUrl ? (
            <Image
              src={formData.images[0] || formData.imageUrl}
              alt={formData.name || "套餐图片"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
                <p className="text-sm">暂无图片</p>
              </div>
            </div>
          )}

          {/* 折扣标签 */}
          {discountPercent && discountPercent > 0 && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              -{discountPercent}%
            </div>
          )}

          {/* 限时优惠标签 */}
          {isCampaign && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
              <Flame className="w-3 h-3" />
              限时优惠
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-4">
          {/* 标题 */}
          <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
            {formData.name || "套餐名称"}
          </h3>

          {/* 核心卖点 */}
          {formData.highlights && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-1">
              {formData.highlights}
            </p>
          )}

          {/* 标签 */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedTags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}15` : "#f3f4f6",
                    color: tag.color || "#6b7280",
                  }}
                >
                  {tag.icon && <span>{tag.icon}</span>}
                  {tag.name}
                </span>
              ))}
              {selectedTags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{selectedTags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 信息行 */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            {formData.duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formData.duration}小时
              </span>
            )}
            {formData.region && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {formData.region}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              4.8
            </span>
          </div>

          {/* 价格 */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#8B4513]">{priceDisplay}</span>
            <span className="text-sm text-gray-500">/ {unitDisplay}</span>
            {formData.originalPrice && Number(formData.originalPrice) > formData.price && (
              <span className="text-sm text-gray-400 line-through">
                ¥{Number(formData.originalPrice).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 预览说明 */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        这是套餐在列表中的显示效果
      </p>
    </div>
  );
}
