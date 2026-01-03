"use client";

import { useState } from "react";
import { PlanFormData, ComponentConfig } from "@/store/planDraft";
import { CreditCard, FileText, ChevronDown } from "lucide-react";
import CardPreview from "./CardPreview";
import DetailPreview from "./DetailPreview";

type PreviewMode = "card" | "detail";

interface Tag {
  id: string;
  code: string;
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

interface PlanEditPreviewProps {
  formData: PlanFormData;
  componentConfigs: ComponentConfig[];
  selectedTags: Tag[];
  theme: Theme | null;
  store: Store | null;
  isCampaign?: boolean;
}

export default function PlanEditPreview({
  formData,
  componentConfigs,
  selectedTags,
  theme,
  store,
  isCampaign = false,
}: PlanEditPreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("card");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const modes = [
    { id: "card" as PreviewMode, label: "卡片预览", icon: CreditCard },
    { id: "detail" as PreviewMode, label: "详情页预览", icon: FileText },
  ];

  const currentMode = modes.find((m) => m.id === mode)!;

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7]">
      {/* 预览模式选择器 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700
                       bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full"
          >
            <currentMode.icon className="w-4 h-4 text-[#D4A5A5]" />
            <span>{currentMode.label}</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2 text-sm text-left
                    hover:bg-gray-50 transition-colors
                    ${mode === m.id ? "text-[#8B4513] bg-[#FDFBF7]" : "text-gray-700"}
                  `}
                >
                  <m.icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 预览内容 */}
      <div className="flex-1 overflow-auto p-4">
        {mode === "card" ? (
          <CardPreview
            formData={formData}
            selectedTags={selectedTags}
            isCampaign={isCampaign}
          />
        ) : (
          <DetailPreview
            formData={formData}
            componentConfigs={componentConfigs}
            selectedTags={selectedTags}
            theme={theme}
            store={store}
            isCampaign={isCampaign}
          />
        )}
      </div>

      {/* 预览提示 */}
      <div className="flex-shrink-0 px-4 py-2 bg-amber-50 border-t border-amber-100">
        <p className="text-xs text-amber-700 text-center">
          预览基于当前编辑内容，保存后生效
        </p>
      </div>
    </div>
  );
}
