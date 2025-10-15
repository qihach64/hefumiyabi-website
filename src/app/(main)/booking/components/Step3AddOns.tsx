"use client";

import { useState } from "react";
import { Camera, Scissors, Sparkles, Gem, MessageSquare } from "lucide-react";
import type { BookingData } from "../page";

interface Step3Props {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

// 附加服务列表（参考 https://hefumiyabi.com/zh/service）
const addOnServices = [
  {
    id: "photography",
    name: "专业摄影",
    description: "专业摄影师跟拍，记录美好瞬间",
    icon: Camera,
  },
  {
    id: "hairstyling",
    name: "发型设计",
    description: "专业发型师设计适合和服的发型",
    icon: Scissors,
  },
  {
    id: "makeup",
    name: "化妆服务",
    description: "专业化妆师为您打造完美妆容",
    icon: Sparkles,
  },
  {
    id: "accessories",
    name: "配饰升级",
    description: "升级选择高级配饰和装饰品",
    icon: Gem,
  },
];

export default function Step3AddOns({
  bookingData,
  updateBookingData,
  onNext,
  onPrev,
}: Step3Props) {
  const [notes, setNotes] = useState(bookingData.notes || "");

  const toggleAddOn = (addOnId: string) => {
    const currentAddOns = bookingData.addOns || [];
    const newAddOns = currentAddOns.includes(addOnId)
      ? currentAddOns.filter((id) => id !== addOnId)
      : [...currentAddOns, addOnId];
    updateBookingData({ addOns: newAddOns });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookingData({ notes });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">附加服务</h2>
        <p className="text-gray-600">
          选择您需要的附加服务，让您的和服体验更加完美（可选）
        </p>
      </div>

      {/* MVP 提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>温馨提示：</strong>
          附加服务将在预约确认时由工作人员与您详细说明价格和安排。
        </p>
      </div>

      {/* 附加服务选择 */}
      <div className="grid md:grid-cols-2 gap-4">
        {addOnServices.map((service) => {
          const Icon = service.icon;
          const isSelected = bookingData.addOns?.includes(service.id);

          return (
            <label
              key={service.id}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${
                  isSelected
                    ? "border-rose-500 bg-rose-50"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleAddOn(service.id)}
                className="sr-only"
              />
              <div className="flex items-start gap-3">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  ${
                    isSelected
                      ? "bg-rose-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }
                `}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {service.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* 特殊要求备注 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="w-4 h-4 inline mr-1" />
          特殊要求或备注（可选）
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="请告诉我们您的特殊要求，例如：偏好的和服颜色、图案、特殊场合等..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          我们会尽力满足您的特殊要求
        </p>
      </div>

      {/* 已选服务摘要 */}
      {bookingData.addOns && bookingData.addOns.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="font-medium text-gray-900 mb-2">已选择的附加服务：</p>
          <div className="flex flex-wrap gap-2">
            {bookingData.addOns.map((addOnId) => {
              const service = addOnServices.find((s) => s.id === addOnId);
              return (
                <span
                  key={addOnId}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
                >
                  {service?.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 按钮 */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="border-2 border-gray-300 text-gray-700 font-medium py-3 px-8 rounded-lg hover:bg-gray-50 transition"
        >
          上一步
        </button>
        <button
          type="submit"
          className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-lg hover:from-rose-600 hover:to-pink-600 transition shadow-md hover:shadow-lg"
        >
          下一步
        </button>
      </div>
    </form>
  );
}
