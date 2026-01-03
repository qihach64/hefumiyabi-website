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
  onComponentIdsChange: (ids: string[]) => void;
  onComponentConfigsChange: (configs: ComponentConfig[]) => void;
}

export default function ComponentsTab({
  themeId,
  selectedMerchantComponentIds,
  componentConfigs,
  mapTemplate,
  onComponentIdsChange,
  onComponentConfigsChange,
}: ComponentsTabProps) {
  return (
    <div className="h-full">
      <PlanComponentEditor
        themeId={themeId}
        mapTemplate={mapTemplate}
        selectedMerchantComponentIds={selectedMerchantComponentIds}
        componentConfigs={componentConfigs}
        onChange={onComponentIdsChange}
        onConfigChange={onComponentConfigsChange}
      />
    </div>
  );
}
