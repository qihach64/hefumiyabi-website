"use client";

import { PlanFormData } from "@/store/planDraft";
import ImageUploader from "@/components/ImageUploader";

interface BasicInfoTabProps {
  formData: PlanFormData;
  onFormChange: <K extends keyof PlanFormData>(field: K, value: PlanFormData[K]) => void;
}

export default function BasicInfoTab({ formData, onFormChange }: BasicInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* 套餐名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          套餐名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onFormChange("name", e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl
                     focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                     transition-all bg-white"
          placeholder="例如：经典女士和服体验"
        />
      </div>

      {/* 核心卖点 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          核心卖点
          <span className="text-gray-400 text-xs ml-2">一句话描述套餐亮点</span>
        </label>
        <input
          type="text"
          value={formData.highlights}
          onChange={(e) => onFormChange("highlights", e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl
                     focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                     transition-all bg-white"
          placeholder="例如：专业造型师全程服务，含精修照片10张"
        />
      </div>

      {/* 详细描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          详细描述 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          rows={5}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl
                     focus:ring-2 focus:ring-[#D4A5A5]/50 focus:border-[#D4A5A5]
                     transition-all bg-white resize-none"
          placeholder="详细介绍套餐内容、特色和体验流程..."
        />
        <p className="mt-1 text-xs text-gray-400">
          至少 10 个字符，当前 {formData.description.length} 字
        </p>
      </div>

      {/* 套餐图片 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          套餐图片
          <span className="text-gray-400 text-xs ml-2">
            拖拽排序，第一张为主图
          </span>
        </label>
        <div className="bg-gray-50/50 rounded-xl p-4 border border-dashed border-gray-200">
          <ImageUploader
            category="plan"
            purpose="gallery"
            multiple={true}
            maxFiles={10}
            value={formData.images}
            mainImage={formData.imageUrl}
            onChange={(images) => {
              onFormChange("images", images);
              // 自动设置第一张为主图
              if (images.length > 0 && formData.imageUrl !== images[0]) {
                onFormChange("imageUrl", images[0]);
              }
            }}
            onMainImageChange={(url) => onFormChange("imageUrl", url)}
          />
        </div>
        {formData.images.length > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            已上传 {formData.images.length} 张图片
            {formData.imageUrl && "，主图已设置"}
          </p>
        )}
      </div>
    </div>
  );
}
