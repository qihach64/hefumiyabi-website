"use client";

import { ComponentConfig } from "@/store/planDraft";
import PlanComponentEditor from "../PlanComponentEditor";

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
    <div className="h-full">
      <PlanComponentEditor
        themeId={themeId}
        mapTemplate={mapTemplate}
        customMapImageUrl={customMapImageUrl}
        onCustomMapImageChange={onCustomMapImageChange}
        planId={planId}
        selectedMerchantComponentIds={selectedMerchantComponentIds}
        componentConfigs={componentConfigs}
        onChange={onComponentIdsChange}
        onConfigChange={onComponentConfigsChange}
      />
    </div>
  );
}
