"use client";

import { PlanFormData } from "@/store/planDraft";

interface PricingTabProps {
  formData: PlanFormData;
  onFormChange: <K extends keyof PlanFormData>(field: K, value: PlanFormData[K]) => void;
}

export default function PricingTab({ formData, onFormChange }: PricingTabProps) {
  // 计算显示的价格预览
  const priceDisplay = formData.price > 0 ? `¥${formData.price.toLocaleString()}` : "¥0";
  const unitDisplay = formData.unitDescription
    ? `${formData.unitLabel} (${formData.unitDescription})`
    : formData.unitLabel;

  return (
    <div className="space-y-8">
      {/* 价格预览卡片 */}
      <div className="bg-gradient-to-r from-[#FDFBF7] to-[#FFF5F5] rounded-2xl p-6 border border-[#D4A5A5]/20">
        <p className="text-sm text-gray-500 mb-2">价格预览</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#8B4513]">{priceDisplay}</span>
          <span className="text-lg text-gray-600">/ {unitDisplay}</span>
        </div>
        {formData.originalPrice && Number(formData.originalPrice) > formData.price && (
          <p className="mt-1 text-sm text-gray-400 line-through">
            原价 ¥{Number(formData.originalPrice).toLocaleString()}
          </p>
        )}
      </div>

      {/* 价格输入 */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            现价 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
            <input
              type="number"
              value={formData.price || ""}
              onChange={(e) => onFormChange("price", Number(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                         transition-all bg-white"
              placeholder="8800"
              min="0"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">以元为单位</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            原价
            <span className="text-gray-400 text-xs ml-2">用于显示折扣</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
            <input
              type="number"
              value={formData.originalPrice || ""}
              onChange={(e) => onFormChange("originalPrice", e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                         transition-all bg-white"
              placeholder="11000"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* 计价单位 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">计价方式</label>
        <div className="flex gap-4">
          <label
            className={`
              flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${
                formData.pricingUnit === "person"
                  ? "border-[#D4A5A5] bg-[#FDFBF7]"
                  : "border-gray-200 hover:border-gray-300"
              }
            `}
          >
            <input
              type="radio"
              name="pricingUnit"
              value="person"
              checked={formData.pricingUnit === "person"}
              onChange={() => {
                onFormChange("pricingUnit", "person");
                onFormChange("unitLabel", "人");
              }}
              className="sr-only"
            />
            <div
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${formData.pricingUnit === "person" ? "border-[#D4A5A5]" : "border-gray-300"}
              `}
            >
              {formData.pricingUnit === "person" && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4A5A5]" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">按人收费</p>
              <p className="text-xs text-gray-500">适合单人套餐</p>
            </div>
          </label>

          <label
            className={`
              flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${
                formData.pricingUnit === "group"
                  ? "border-[#D4A5A5] bg-[#FDFBF7]"
                  : "border-gray-200 hover:border-gray-300"
              }
            `}
          >
            <input
              type="radio"
              name="pricingUnit"
              value="group"
              checked={formData.pricingUnit === "group"}
              onChange={() => {
                onFormChange("pricingUnit", "group");
                onFormChange("unitLabel", "組");
              }}
              className="sr-only"
            />
            <div
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${formData.pricingUnit === "group" ? "border-[#D4A5A5]" : "border-gray-300"}
              `}
            >
              {formData.pricingUnit === "group" && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4A5A5]" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">按组收费</p>
              <p className="text-xs text-gray-500">适合情侣、家庭套餐</p>
            </div>
          </label>
        </div>
      </div>

      {/* 单位标签和说明 */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">显示标签</label>
          <select
            value={formData.unitLabel}
            onChange={(e) => onFormChange("unitLabel", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl
                       focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                       transition-all bg-white"
          >
            <option value="人">人</option>
            <option value="組">組</option>
            <option value="套">套</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            单位说明
            <span className="text-gray-400 text-xs ml-2">可选</span>
          </label>
          <input
            type="text"
            value={formData.unitDescription}
            onChange={(e) => onFormChange("unitDescription", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl
                       focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                       transition-all bg-white"
            placeholder="例如：2人、2大人+1小孩"
          />
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* 购买数量限制 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">购买数量限制</label>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">最少</label>
            <input
              type="number"
              value={formData.minQuantity}
              onChange={(e) => onFormChange("minQuantity", Number(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                         transition-all bg-white"
              min="1"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">最多</label>
            <input
              type="number"
              value={formData.maxQuantity}
              onChange={(e) => onFormChange("maxQuantity", Number(e.target.value) || 10)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                         transition-all bg-white"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* 押金 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          押金
          <span className="text-gray-400 text-xs ml-2">可选，0 表示无押金</span>
        </label>
        <div className="relative max-w-xs">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
          <input
            type="number"
            value={formData.depositAmount || ""}
            onChange={(e) => onFormChange("depositAmount", e.target.value)}
            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl
                       focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                       transition-all bg-white"
            placeholder="1000"
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
