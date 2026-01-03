"use client";

import { PlanFormData } from "@/store/planDraft";
import { Clock, Calendar, Star, Eye, EyeOff } from "lucide-react";

interface AdvancedTabProps {
  formData: PlanFormData;
  onFormChange: <K extends keyof PlanFormData>(field: K, value: PlanFormData[K]) => void;
}

// 常用时长选项
const DURATION_OPTIONS = [
  { value: 2, label: "2小时" },
  { value: 4, label: "4小时" },
  { value: 6, label: "6小时" },
  { value: 8, label: "全天" },
];

export default function AdvancedTab({ formData, onFormChange }: AdvancedTabProps) {
  return (
    <div className="space-y-8">
      {/* 体验时长 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Clock className="w-4 h-4 inline mr-1" />
          体验时长
        </label>
        <div className="flex gap-3 mb-3">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFormChange("duration", option.value)}
              className={`
                px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                ${
                  formData.duration === option.value
                    ? "border-[#D4A5A5] bg-[#FDFBF7] text-[#8B4513]"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => onFormChange("duration", Number(e.target.value) || 4)}
            className="w-24 px-3 py-2 border border-gray-200 rounded-lg
                       focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                       transition-all bg-white text-center"
            min="1"
            max="24"
          />
          <span className="text-gray-500">小时</span>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* 限量设置 */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`
              w-12 h-6 rounded-full transition-colors relative
              ${formData.isLimited ? "bg-[#D4A5A5]" : "bg-gray-200"}
            `}
            onClick={() => onFormChange("isLimited", !formData.isLimited)}
          >
            <div
              className={`
                absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${formData.isLimited ? "translate-x-7" : "translate-x-1"}
              `}
            />
          </div>
          <div>
            <span className="font-medium text-gray-700">限量套餐</span>
            <p className="text-xs text-gray-500">设置最大预订数量</p>
          </div>
        </label>

        {formData.isLimited && (
          <div className="mt-4 ml-15">
            <label className="block text-sm text-gray-600 mb-2">最大预订数</label>
            <input
              type="number"
              value={formData.maxBookings || ""}
              onChange={(e) =>
                onFormChange("maxBookings", e.target.value ? Number(e.target.value) : null)
              }
              className="w-32 px-4 py-2 border border-gray-200 rounded-lg
                         focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                         transition-all bg-white"
              placeholder="100"
              min="1"
            />
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* 时间限制 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Calendar className="w-4 h-4 inline mr-1" />
          销售时间限制
          <span className="text-gray-400 text-xs ml-2">可选</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始销售</label>
            <input
              type="datetime-local"
              value={formData.availableFrom || ""}
              onChange={(e) => onFormChange("availableFrom", e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                         transition-all bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束销售</label>
            <input
              type="datetime-local"
              value={formData.availableUntil || ""}
              onChange={(e) => onFormChange("availableUntil", e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                         transition-all bg-white text-sm"
            />
          </div>
        </div>
        {(formData.availableFrom || formData.availableUntil) && (
          <button
            type="button"
            onClick={() => {
              onFormChange("availableFrom", null);
              onFormChange("availableUntil", null);
            }}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            清除时间限制
          </button>
        )}
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* 精选和上架状态 */}
      <div className="space-y-4">
        {/* 精选套餐 */}
        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
          <div
            className={`
              w-12 h-6 rounded-full transition-colors relative
              ${formData.isFeatured ? "bg-amber-400" : "bg-gray-200"}
            `}
            onClick={() => onFormChange("isFeatured", !formData.isFeatured)}
          >
            <div
              className={`
                absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${formData.isFeatured ? "translate-x-7" : "translate-x-1"}
              `}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Star
                className={`w-4 h-4 ${formData.isFeatured ? "text-amber-500 fill-amber-500" : "text-gray-400"}`}
              />
              <span className="font-medium text-gray-700">精选套餐</span>
            </div>
            <p className="text-xs text-gray-500">在首页和精选位置展示</p>
          </div>
        </label>

        {/* 上架状态 */}
        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
          <div
            className={`
              w-12 h-6 rounded-full transition-colors relative
              ${formData.isActive ? "bg-green-500" : "bg-gray-200"}
            `}
            onClick={() => onFormChange("isActive", !formData.isActive)}
          >
            <div
              className={`
                absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${formData.isActive ? "translate-x-7" : "translate-x-1"}
              `}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {formData.isActive ? (
                <Eye className="w-4 h-4 text-green-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="font-medium text-gray-700">
                {formData.isActive ? "已上架" : "已下架"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {formData.isActive ? "套餐对用户可见" : "套餐对用户不可见"}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
