"use client";

import { PlanFormData, ComponentConfig } from "@/store/planDraft";
import {
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Calendar,
  Minus,
  Plus,
  ShoppingCart,
  Sparkles,
  Camera,
  Palette,
  Scissors,
  Timer,
} from "lucide-react";
import Image from "next/image";

interface Tag {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Store {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
}

interface DetailPreviewProps {
  formData: PlanFormData;
  componentConfigs: ComponentConfig[];
  selectedTags: Tag[];
  theme: Theme | null;
  store: Store | null;
  isCampaign?: boolean;
}

// 模拟升级服务
const MOCK_UPGRADES = [
  { id: "photo", name: "专业摄影", price: 30000, icon: "📷" },
  { id: "makeup", name: "专业化妆", price: 25000, icon: "💄" },
  { id: "hairstyle", name: "高级发型", price: 20000, icon: "💇" },
];

// 模拟体验流程
const MOCK_JOURNEY = [
  { time: "09:00", title: "到店签到", icon: MapPin },
  { time: "09:15", title: "选衣换装", icon: Palette },
  { time: "10:00", title: "发型设计", icon: Scissors },
  { time: "10:30", title: "拍照体验", icon: Camera },
  { time: "10:45", title: "自由漫步", icon: Timer },
  { time: "12:45", title: "归还时间", icon: Clock },
];

export default function DetailPreview({
  formData,
  selectedTags,
  theme,
  store,
  isCampaign = false,
}: DetailPreviewProps) {
  // 价格计算
  const priceDisplay = formData.price > 0 ? `¥${formData.price.toLocaleString()}` : "¥0";
  const unitDisplay = formData.unitDescription
    ? `${formData.unitLabel}(${formData.unitDescription})`
    : formData.unitLabel;

  const discountPercent =
    formData.originalPrice && Number(formData.originalPrice) > formData.price
      ? Math.round(
          ((Number(formData.originalPrice) - formData.price) /
            Number(formData.originalPrice)) *
            100
        )
      : null;

  return (
    <div className="space-y-4 pb-8">
      {/* 面包屑 */}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span>首页</span>
        <ChevronRight className="w-3 h-3" />
        <span>全部套餐</span>
        {theme && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: theme.color || undefined }}>{theme.name}</span>
          </>
        )}
      </div>

      {/* 图片轮播区域 */}
      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
        {formData.images.length > 0 || formData.imageUrl ? (
          <>
            <Image
              src={formData.images[0] || formData.imageUrl}
              alt={formData.name || "套餐图片"}
              fill
              className="object-cover"
            />
            {formData.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {formData.images.slice(0, 5).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i === 0 ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <span className="text-4xl">📷</span>
              <p className="mt-2 text-sm">暂无图片</p>
            </div>
          </div>
        )}

        {/* 折扣标签 */}
        {discountPercent && discountPercent > 0 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
            限时 -{discountPercent}%
          </div>
        )}
      </div>

      {/* 标题和价格 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        {/* 分类标签 */}
        <div className="flex items-center gap-2 mb-2">
          {isCampaign && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded">
              限时优惠
            </span>
          )}
          {selectedTags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-0.5 text-xs rounded"
              style={{
                backgroundColor: tag.color ? `${tag.color}15` : "#f3f4f6",
                color: tag.color || "#6b7280",
              }}
            >
              {tag.icon} {tag.name}
            </span>
          ))}
        </div>

        {/* 标题 */}
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          {formData.name || "套餐名称"}
        </h1>

        {/* 评分和信息 */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            4.8 (128)
          </span>
          {formData.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formData.duration}小时
            </span>
          )}
          {formData.region && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {formData.region}
            </span>
          )}
        </div>

        {/* 价格 */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#8B4513]">{priceDisplay}</span>
          <span className="text-gray-500">/ {unitDisplay}</span>
          {formData.originalPrice && Number(formData.originalPrice) > formData.price && (
            <span className="text-gray-400 line-through">
              ¥{Number(formData.originalPrice).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* 套餐描述 */}
      {formData.description && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-2">套餐简介</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {formData.description}
          </p>
        </div>
      )}

      {/* 升级服务 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="font-medium text-gray-800 mb-3">升级服务</h3>
        <div className="space-y-2">
          {MOCK_UPGRADES.map((upgrade) => (
            <div
              key={upgrade.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{upgrade.icon}</span>
                <span className="text-sm text-gray-700">{upgrade.name}</span>
              </div>
              <span className="text-sm font-medium text-[#8B4513]">
                +¥{(upgrade.price / 100).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 店铺位置 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="font-medium text-gray-800 mb-3">店铺位置</h3>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4A5A5]/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#D4A5A5]" />
          </div>
          <div>
            <p className="font-medium text-gray-800">
              {store?.name || formData.storeName || "京都祇园本店"}
            </p>
            <p className="text-sm text-gray-500">
              {store?.address || "京都市東山区祇園町南側"}
            </p>
          </div>
        </div>
      </div>

      {/* 当日体验流程 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="font-medium text-gray-800 mb-3">当日体验流程</h3>
        <div className="relative pl-6">
          {/* 时间线 */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#D4A5A5] to-[#E8B4B8]" />

          <div className="space-y-4">
            {MOCK_JOURNEY.map((step, index) => (
              <div key={index} className="relative flex items-start gap-3">
                {/* 时间点 */}
                <div className="absolute -left-4 w-3 h-3 rounded-full bg-[#D4A5A5] border-2 border-white" />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#D4A5A5]">
                      {step.time}
                    </span>
                    <step.icon className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-700">{step.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 模拟 BookingCard */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 sticky bottom-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-[#8B4513]">{priceDisplay}</span>
            <span className="text-sm text-gray-500 ml-1">/ {unitDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
              <Minus className="w-4 h-4 text-gray-400" />
            </button>
            <span className="w-8 text-center font-medium">1</span>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#D4A5A5] text-[#8B4513] rounded-xl text-sm font-medium">
            <ShoppingCart className="w-4 h-4" />
            加入购物车
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D4A5A5] to-[#E8B4B8] text-white rounded-xl text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            立即预约
          </button>
        </div>
      </div>
    </div>
  );
}
