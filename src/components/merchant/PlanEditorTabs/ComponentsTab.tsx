"use client";

import { ComponentConfig } from "@/store/planDraft";
import PlanComponentEditor from "../PlanComponentEditor";
import ImageUploader from "@/components/ImageUploader";
import { ImageIcon, X } from "lucide-react";

interface MapTemplateData {
  id: string;
  imageUrl: string;
  hotspots: {
    componentId: string;
    x: number;
    y: number;
    labelPosition: string;
  }[];
}

interface ComponentsTabProps {
  themeId: string | null;
  selectedMerchantComponentIds: string[];
  componentConfigs: ComponentConfig[];
  mapTemplate?: MapTemplateData | null;
  customMapImageUrl?: string;
  onCustomMapImageChange?: (url: string) => void;
  onComponentIdsChange: (ids: string[]) => void;
  onComponentConfigsChange: (configs: ComponentConfig[]) => void;
  planId?: string;
}

export default function ComponentsTab({
  themeId,
  selectedMerchantComponentIds,
  componentConfigs,
  mapTemplate,
  customMapImageUrl,
  onCustomMapImageChange,
  onComponentIdsChange,
  onComponentConfigsChange,
  planId,
}: ComponentsTabProps) {
  return (
    <div className="h-full flex flex-col">
      {/* 自定义背景图上传区域 */}
      <div className="flex-shrink-0 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-gray-500" />
          <h4 className="text-[14px] font-medium text-gray-700">自定义热点图背景</h4>
        </div>
        <p className="text-[12px] text-gray-500 mb-3">
          上传自定义图片替代系统默认背景，建议尺寸 450×600 像素，3:4 比例
        </p>

        <div className="flex items-center gap-4">
          {/* 当前背景预览 */}
          {customMapImageUrl && (
            <div className="relative w-20 h-[106px] rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
              <img
                src={customMapImageUrl}
                alt="自定义背景"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onCustomMapImageChange?.("")}
                className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                title="移除自定义背景"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          )}

          {/* 上传区域 */}
          <div className={customMapImageUrl ? "flex-1" : "w-full"}>
            <ImageUploader
              category="plan"
              entityId={planId || "new"}
              purpose="gallery"
              multiple={false}
              maxFiles={1}
              value={customMapImageUrl ? [customMapImageUrl] : []}
              onChange={(urls) => onCustomMapImageChange?.(urls[0] || "")}
              aspectRatio="3:4"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 组件编辑器 */}
      <div className="flex-1 min-h-0">
        <PlanComponentEditor
          themeId={themeId}
          mapTemplate={mapTemplate}
          customMapImageUrl={customMapImageUrl}
          selectedMerchantComponentIds={selectedMerchantComponentIds}
          componentConfigs={componentConfigs}
          onChange={onComponentIdsChange}
          onConfigChange={onComponentConfigsChange}
        />
      </div>
    </div>
  );
}
